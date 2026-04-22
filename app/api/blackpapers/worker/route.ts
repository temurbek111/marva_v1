import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenAI } from "@google/genai";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: Request) {
  try {
    // 1. Fetch exactly ONE pending item to process
    const { data: item, error: fetchError } = await supabase
      .from("blackpapers")
      .select("*")
      .eq("status", "pending_enrichment")
      .order("created_at", { ascending: true })
      .limit(1)
      .single();

    if (fetchError || !item) {
      if (fetchError && fetchError.code !== "PGRST116") {
        console.error("[Worker] Error fetching item:", fetchError);
        return NextResponse.json({ error: "Failed to fetch pending items" }, { status: 500 });
      }
      return NextResponse.json({ message: "No pending items to process" });
    }

    // 2. Lock item to prevent race conditions
    await supabase.from("blackpapers").update({ status: "processing" }).eq("id", item.id);

    let enrichedData: any = {};
    let validationFlags = { errors: [] as string[], warnings: [] as string[] };
    let newStatus = "review_ready";

    const nameToSearch = item.raw_data.name || item.raw_data.title || `product ${item.id}`;

    // 3. AI Enrichment Phase
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error("Missing GEMINI_API_KEY");

      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `You are an expert product researcher.
          Search for the product named "${nameToSearch}".
          Return a JSON object with exactly these keys:
          - "description": A concise, 2-sentence summary.
          - "full_description": A detailed markdown overview of specs, indications, and features.
          - "brand": The probable brand of the product (or empty string).
          - "country": The origin country (or empty string).
          - "category_guess": Your best guess for the category.
          
          Provide strictly valid JSON.`,
        config: {
          responseMimeType: "application/json",
          tools: [{ googleSearch: {} }],
          temperature: 0.2,
        },
      });

      const responseText = response.text || "{}";
      enrichedData = JSON.parse(responseText);
    } catch (aiError: any) {
      console.error("[Worker] AI Enrichment failed:", aiError);
      validationFlags.warnings.push(`AI Enrichment failed: ${aiError.message}`);
      // If AI fails, we still want admin to review the raw data.
    }

    // 4. Validation Phase
    if (!item.raw_data.name && !enrichedData.name) {
      validationFlags.errors.push("Product name is completely missing.");
    }
    
    // Check price
    if (!item.raw_data.price || item.raw_data.price <= 0) {
      validationFlags.warnings.push("Product price is missing or invalid.");
    }

    // Check Duplicate
    if (item.raw_data.name) {
      const { data: existing } = await supabase
        .from("products")
        .select("id")
        .ilike("name", `%${item.raw_data.name}%`)
        .limit(1);
      
      if (existing && existing.length > 0) {
        validationFlags.warnings.push(`Potential duplicate: found existing product with similar name.`);
      }
    }

    // Determine final status
    if (validationFlags.errors.length > 0) {
      newStatus = "validation_failed";
    }

    // 5. Update Database
    const { error: updateError } = await supabase
      .from("blackpapers")
      .update({
        enriched_data: enrichedData,
        validation_flags: validationFlags,
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", item.id);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({
      message: "Processed 1 item successfully",
      processed_id: item.id,
      status: newStatus,
      flags: validationFlags,
    });

  } catch (err: any) {
    console.error("[Worker] Unhandled Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

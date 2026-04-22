import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenAI } from "@google/genai";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: Request) {
  try {
    // Fetch up to 5 pending items with retry_count < 3
    const { data: items, error: fetchError } = await supabase
      .from("blackpapers")
      .select("*")
      .eq("status", "pending")
      .lt("retry_count", 3)
      .order("created_at", { ascending: true })
      .limit(5);

    if (fetchError) {
      console.error("[Description Worker] Error fetching items:", fetchError);
      return NextResponse.json({ error: "Failed to fetch pending items" }, { status: 500 });
    }

    if (!items || items.length === 0) {
      return NextResponse.json({ message: "No pending items to process" });
    }

    // Mark as processing
    const ids = items.map(item => item.id);
    await supabase
      .from("blackpapers")
      .update({ status: "processing" })
      .in("id", ids);

    const results = [];

    for (const item of items) {
      try {
        const generatedDescription = await generateDescription(item.name);

        let validationFlags = {};

        // Simple validation
        if (!generatedDescription) {
          validationFlags = { error: "Failed to generate description" };
        }

        // Update item
        const { error: updateError } = await supabase
          .from("blackpapers")
          .update({
            generated_description: generatedDescription,
            status: generatedDescription ? "ready_for_review" : "failed",
            validation_flags: validationFlags,
            retry_count: item.retry_count + (generatedDescription ? 0 : 1)
          })
          .eq("id", item.id);

        if (updateError) {
          console.error(`[Description Worker] Error updating item ${item.id}:`, updateError);
        }

        results.push({ id: item.id, status: generatedDescription ? "ready_for_review" : "failed" });

      } catch (err: any) {
        console.error(`[Description Worker] Error processing item ${item.id}:`, err);
        await supabase
          .from("blackpapers")
          .update({ status: "failed", validation_flags: { error: err.message }, retry_count: item.retry_count + 1 })
          .eq("id", item.id);
        results.push({ id: item.id, status: "failed" });
      }
    }

    return NextResponse.json({ message: `Processed ${results.length} items`, results });

  } catch (error: any) {
    console.error("[Description Worker] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function generateDescription(productName: string): Promise<string | null> {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("Missing GEMINI_API_KEY");

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: `You are an expert product researcher. For the product "${productName}", perform a web search and generate a concise, human-readable description in 2-4 sentences. Focus on features, specs, and use cases. Make it non-generic and informative.`,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.2,
      },
    });

    const description = response.text?.trim();
    return description || null;
  } catch (error) {
    console.error("AI generation failed:", error);
    return null;
  }
}
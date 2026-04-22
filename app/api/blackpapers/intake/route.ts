import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase with Service Role to bypass RLS for internal intake
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: Request) {
  try {
    const rawData = await req.json();

    // Minimum required check (you could expand this)
    if (!rawData || (!rawData.name && !rawData.cart_id)) {
      return NextResponse.json(
        { error: "Product name or cart_id is required for intake." },
        { status: 400 }
      );
    }

    const payload = {
      cart_id: rawData.cart_id || null,
      raw_data: rawData,
      status: "pending_enrichment",
    };

    const { data, error } = await supabase
      .from("blackpapers")
      .insert(payload)
      .select("id, status")
      .single();

    if (error) {
      console.error("[Intake API] Failed to insert blackpaper:", error);
      throw error;
    }

    return NextResponse.json({
      message: "Blackpaper created successfully. Awaiting AI Enrichment.",
      blackpaper: data,
    });
  } catch (error: any) {
    console.error("[Intake API] Error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error during intake." },
      { status: 500 }
    );
  }
}

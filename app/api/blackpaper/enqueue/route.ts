import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: Request) {
  try {
    const { product_id } = await req.json();

    if (!product_id) {
      return NextResponse.json({ error: "product_id is required" }, { status: 400 });
    }

    // Get product details
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("id, name, description")
      .eq("id", product_id)
      .single();

    if (productError || !product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    if (product.description && product.description.trim() !== "") {
      return NextResponse.json({ message: "Product already has description" });
    }

    // Insert into blackpaper
    const { error: insertError } = await supabase
      .from("blackpapers")
      .upsert({
        product_id: product.id,
        name: product.name,
        status: "pending",
        source: "new_product"
      }, { onConflict: "product_id" });

    if (insertError) {
      console.error("Error enqueuing product:", insertError);
      return NextResponse.json({ error: "Failed to enqueue" }, { status: 500 });
    }

    return NextResponse.json({ message: "Product enqueued for description generation" });

  } catch (error: any) {
    console.error("Enqueue error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
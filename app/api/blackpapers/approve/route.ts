import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function slugify(text: string) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")     // Replace spaces with -
    .replace(/[^\w\-]+/g, "") // Remove all non-word chars
    .replace(/\-\-+/g, "-");    // Replace multiple - with single -
}

export async function POST(req: Request) {
  try {
    const { blackpaper_id, action, edited_data } = await req.json();

    if (!blackpaper_id || !action) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (action === "approve") {
      const { data: item, error: fetchError } = await supabase
        .from("blackpapers")
        .select("*")
        .eq("id", blackpaper_id)
        .single();

      if (fetchError || !item) {
        return NextResponse.json({ error: "Blackpaper not found" }, { status: 404 });
      }

      // Merge raw, enriched, and potentially edited data
      const finalData = {
        ...(item.raw_data || {}),
        ...(item.enriched_data || {}),
        ...(edited_data || {}),
      };

      const productPayload = {
        name: finalData.name,
        slug: finalData.slug || `${slugify(finalData.name || "product")}-${Math.random().toString(36).substring(2, 7)}`,
        description: finalData.description,
        full_description: finalData.full_description,
        price: Number(finalData.price || 0),
        old_price: finalData.old_price ? Number(finalData.old_price) : null,
        image_url: finalData.image_url || null,
        stock: Number(finalData.stock || 0),
        is_active: true,
        is_featured: !!finalData.is_featured,
        brand: finalData.brand || null,
        country: finalData.country || null,
        article: finalData.article || null,
        package_info: finalData.package_info || null,
        usage_area: finalData.usage_area || null,
        category_id: finalData.category_id ? Number(finalData.category_id) : null,
      };

      const { data: product, error: prodError } = await supabase
        .from("products")
        .insert(productPayload)
        .select()
        .single();

      if (prodError) {
        console.error("[Approve API] Product insertion error:", prodError);
        throw prodError;
      }

      await supabase
        .from("blackpapers")
        .update({ status: "approved", updated_at: new Date().toISOString() })
        .eq("id", blackpaper_id);

      return NextResponse.json({ message: "Product approved and created", product });
    }

    if (action === "reject") {
      await supabase
        .from("blackpapers")
        .update({ status: "rejected", updated_at: new Date().toISOString() })
        .eq("id", blackpaper_id);
      return NextResponse.json({ message: "Product rejected" });
    }

    if (action === "request_changes") {
      await supabase
        .from("blackpapers")
        .update({ status: "changes_requested", updated_at: new Date().toISOString() })
        .eq("id", blackpaper_id);
      return NextResponse.json({ message: "Changes requested" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  } catch (error: any) {
    console.error("[Approve API] Error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

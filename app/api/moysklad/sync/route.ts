import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import axios from "axios";

type MoyProduct = {
  id: string;
  name?: string;
  code?: string;
  article?: string;
  updated?: string;
  images?: {
    meta?: {
      href?: string;
      size?: number;
    };
  };
};

type MoyStockRow = {
  assortmentId?: string;
  stock?: number | string;
};

export async function GET() {
  try {
    const token = process.env.MOYSKLAD_TOKEN;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!token) {
      return NextResponse.json(
        { ok: false, error: "MOYSKLAD_TOKEN topilmadi" },
        { status: 500 }
      );
    }

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { ok: false, error: "Supabase env topilmadi" },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const axiosClient = axios.create({
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json;charset=utf-8",
        "Content-Type": "application/json",
      },
      timeout: 30000,
    });

    async function fetchAllProducts() {
      const limit = 100;
      let offset = 0;
      let allRows: MoyProduct[] = [];
      let total = 0;

      while (true) {
        const res = await axiosClient.get(
          `https://api.moysklad.ru/api/remap/1.2/entity/product?limit=${limit}&offset=${offset}`
        );

        const rows: MoyProduct[] = res.data?.rows || [];
        total = res.data?.meta?.size || total;

        allRows = allRows.concat(rows);

        if (rows.length < limit) break;
        offset += limit;
      }

      return { rows: allRows, total };
    }

    async function fetchAllStocks() {
      const limit = 1000;
      let offset = 0;
      let allRows: MoyStockRow[] = [];

      while (true) {
        const res = await axiosClient.get(
          `https://api.moysklad.ru/api/remap/1.2/report/stock/all/current?limit=${limit}&offset=${offset}`
        );

        const rows: MoyStockRow[] = Array.isArray(res.data)
          ? res.data
          : res.data?.rows || res.data?.data || [];

        allRows = allRows.concat(rows);

        if (rows.length < limit) break;
        offset += limit;
      }

      return allRows;
    }

    async function getProductImageUrl(
      imageMetaHref: string | null,
      externalId: string,
      versionSeed: string
    ) {
      if (!imageMetaHref) return null;

      try {
        const imageListRes = await axiosClient.get(imageMetaHref);
        const firstImage = imageListRes.data?.rows?.[0];

        const sourceUrl =
          firstImage?.downloadHref ||
          (firstImage?.miniature?.href
            ? String(firstImage.miniature.href).replace("?miniature=true", "")
            : null) ||
          null;

        if (!sourceUrl) return null;

        const imageRes = await axiosClient.get(sourceUrl, {
          responseType: "arraybuffer",
        });

        const contentType =
          imageRes.headers["content-type"] || "image/png";

        const ext =
          contentType.includes("jpeg") || contentType.includes("jpg")
            ? "jpg"
            : contentType.includes("webp")
              ? "webp"
              : "png";

        const filePath = `moysklad/${externalId}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("products")
          .upload(filePath, imageRes.data, {
            contentType,
            upsert: true,
          });

        if (uploadError) return null;

        const { data: publicUrlData } = supabase.storage
          .from("products")
          .getPublicUrl(filePath);

        const version = encodeURIComponent(versionSeed || "1");
        return `${publicUrlData.publicUrl}?v=${version}`;
      } catch {
        return null;
      }
    }

    const [{ rows: moyProducts, total: totalFromApi }, stockRows] =
      await Promise.all([fetchAllProducts(), fetchAllStocks()]);

    const stockMap = new Map<string, number>();

    for (const item of stockRows) {
      if (!item.assortmentId) continue;
      stockMap.set(item.assortmentId, Number(item.stock || 0));
    }

    const payload: any[] = [];

    for (const item of moyProducts) {
      const imageUrl = await getProductImageUrl(
        item.images?.meta?.href || null,
        item.id,
        item.updated || item.id
      );

      payload.push({
        external_id: item.id,
        name: item.name || "No name",
        slug: `ms-${item.id}`,
        description: item.name || "",
        full_description: item.name || "",
        article: item.article || null,
        code: item.code || null,
        price: 0,
        old_price: null,
        image_url: imageUrl,
        stock: Math.floor(stockMap.get(item.id) || 0),
        is_active: true,
        images: imageUrl ? [imageUrl] : [],
      });
    }

    const totalProducts = payload.length;
    const withImage = payload.filter((item) => item.image_url).length;
    const withoutImage = totalProducts - withImage;

    const { data, error } = await supabase
      .from("products")
      .upsert(payload, {
        onConflict: "external_id",
      })
      .select("id, external_id, name, stock, image_url");

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    const currentExternalIds = moyProducts.map((item) => item.id);

    if (currentExternalIds.length > 0) {
      const { data: allDbRows, error: dbReadError } = await supabase
        .from("products")
        .select("external_id")
        .not("external_id", "is", null);

      if (!dbReadError && allDbRows) {
        const idsToDeactivate = allDbRows
          .map((row) => row.external_id)
          .filter((id) => id && !currentExternalIds.includes(id));

        if (idsToDeactivate.length > 0) {
          await supabase
            .from("products")
            .update({ is_active: false })
            .in("external_id", idsToDeactivate);
        }
      }
    }

    return NextResponse.json({
      ok: true,
      totalFromApi,
      totalProducts,
      withImage,
      withoutImage,
      count: data?.length || 0,
      sample: data?.slice(0, 10) || [],
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: error?.response?.data || error?.message || "Noma'lum xato",
      },
      { status: 500 }
    );
  }
}
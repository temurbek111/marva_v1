import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import axios from "axios";

export const runtime = "nodejs";

const CRON_SECRET = process.env.CRON_SECRET;
const MOYSKLAD_BASE_URL =
  process.env.MOYSKLAD_BASE_URL || "https://api.moysklad.ru/api/remap/1.2";

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

type ProductPayload = {
  external_id: string;
  name: string;
  slug: string;
  description: string;
  full_description: string;
  article: string | null;
  code: string | null;
  price: number;
  old_price: number | null;
  image_url: string | null;
  stock: number;
  is_active: boolean;
  images: string[];
};

function normalizeError(error: unknown) {
  if (axios.isAxiosError(error)) {
    return error.response?.data || error.message || "Axios xato";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Noma'lum xato";
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");

  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

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
          `${MOYSKLAD_BASE_URL}/entity/product?limit=${limit}&offset=${offset}`
        );

        const rows: MoyProduct[] = Array.isArray(res.data?.rows)
          ? res.data.rows
          : [];

        total =
          typeof res.data?.meta?.size === "number" ? res.data.meta.size : total;

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
          `${MOYSKLAD_BASE_URL}/report/stock/all/current?limit=${limit}&offset=${offset}`
        );

        const rows: MoyStockRow[] = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data?.rows)
            ? res.data.rows
            : Array.isArray(res.data?.data)
              ? res.data.data
              : [];

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
    ): Promise<string | null> {
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

        const imageRes = await axiosClient.get<ArrayBuffer>(sourceUrl, {
          responseType: "arraybuffer",
        });

        const contentType =
          String(imageRes.headers["content-type"] || "image/png").toLowerCase();

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

        if (uploadError) {
          console.error("Image upload error:", uploadError.message);
          return null;
        }

        const { data: publicUrlData } = supabase.storage
          .from("products")
          .getPublicUrl(filePath);

        const version = encodeURIComponent(versionSeed || "1");
        return `${publicUrlData.publicUrl}?v=${version}`;
      } catch (error) {
        console.error(`Image fetch error for product ${externalId}:`, error);
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

    const payload: ProductPayload[] = [];

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
    const withImage = payload.filter((item) => Boolean(item.image_url)).length;
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
          .filter(
            (id): id is string =>
              typeof id === "string" && !currentExternalIds.includes(id)
          );

        if (idsToDeactivate.length > 0) {
          const { error: deactivateError } = await supabase
            .from("products")
            .update({ is_active: false })
            .in("external_id", idsToDeactivate);

          if (deactivateError) {
            console.error("Deactivate old products error:", deactivateError);
          }
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
  } catch (error: unknown) {
    return NextResponse.json(
      {
        ok: false,
        error: normalizeError(error),
      },
      { status: 500 }
    );
  }
}
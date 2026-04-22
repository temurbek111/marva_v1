import { NextResponse } from "next/server";

export const runtime = "nodejs";

const MOYSKLAD_BASE =
  process.env.MOYSKLAD_BASE_URL || "https://api.moysklad.ru/api/remap/1.2";

const MOYSKLAD_TOKEN = process.env.MOYSKLAD_TOKEN;

function getHeaders() {
  if (!MOYSKLAD_TOKEN) {
    throw new Error("MOYSKLAD_TOKEN topilmadi");
  }

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${MOYSKLAD_TOKEN}`,
  };
}

export async function GET() {
  try {
    const res = await fetch(`${MOYSKLAD_BASE}/entity/product?limit=100`, {
      method: "GET",
      headers: getHeaders(),
      cache: "no-store",
    });

    const text = await res.text();

    if (!res.ok) {
      return NextResponse.json(
        {
          success: false,
          message: "MoySklad productlarni olishda xato",
          error: text,
        },
        { status: 500 }
      );
    }

    const data = JSON.parse(text);

    const products =
      Array.isArray(data?.rows)
        ? data.rows.map((item: any) => ({
            id: item.id,
            name: item.name,
            code: item.code,
            article: item.article,
            pathName: item.pathName,
          }))
        : [];

    return NextResponse.json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Server xatosi",
      },
      { status: 500 }
    );
  }
}

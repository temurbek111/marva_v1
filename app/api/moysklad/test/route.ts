import { NextResponse } from "next/server";
import axios from "axios";

export async function GET() {
  try {
    const token = process.env.MOYSKLAD_TOKEN;

    if (!token) {
      return NextResponse.json(
        { ok: false, error: "MOYSKLAD_TOKEN topilmadi" },
        { status: 500 }
      );
    }

    const productRes = await axios.get(
      "https://api.moysklad.ru/api/remap/1.2/entity/product?limit=10",
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json;charset=utf-8",
          "Content-Type": "application/json",
        },
        timeout: 20000,
      }
    );

    const rows = productRes.data?.rows || [];
    const productWithImage = rows.find((item: any) => (item.images?.meta?.size || 0) > 0);

    if (!productWithImage) {
      return NextResponse.json({ ok: false, error: "Rasmli product topilmadi" });
    }

    const imageListRes = await axios.get(productWithImage.images.meta.href, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json;charset=utf-8",
        "Content-Type": "application/json",
      },
      timeout: 20000,
    });

    const firstImage = imageListRes.data?.rows?.[0] || null;

    return NextResponse.json({
      ok: true,
      productName: productWithImage.name,
      downloadHref: firstImage?.downloadHref || null,
      miniature: firstImage?.miniature?.href || null,
      tiny: firstImage?.tiny?.href || null,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Noma'lum xato",
        data: error?.response?.data || null,
      },
      { status: 500 }
    );
  }
}
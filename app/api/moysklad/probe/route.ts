import { NextResponse } from "next/server";

export async function GET() {
  try {
    const token = process.env.MOYSKLAD_TOKEN;

    if (!token) {
      return NextResponse.json(
        { ok: false, error: "MOYSKLAD_TOKEN topilmadi", route: "probe" },
        { status: 500 }
      );
    }

    const response = await fetch(
      "https://api.moysklad.ru/api/remap/1.2/entity/product?limit=10",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json;charset=utf-8",
        },
        cache: "no-store",
      }
    );

    const text = await response.text();

    return NextResponse.json({
      route: "probe",
      ok: response.ok,
      status: response.status,
      raw: text,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        route: "probe",
        ok: false,
        error: error?.message || "Noma'lum xato",
      },
      { status: 500 }
    );
  }
}
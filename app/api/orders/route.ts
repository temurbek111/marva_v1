import { NextResponse } from "next/server";

export const runtime = "nodejs";

type OrderItem = {
  product_name?: string;
  quantity?: number;
  price?: number | string;
  product_id?: string;
  moysklad_product_id?: string;
};

const MOYSKLAD_BASE =
  process.env.MOYSKLAD_BASE_URL || "https://api.moysklad.ru/api/remap/1.2";

const MOYSKLAD_TOKEN = process.env.MOYSKLAD_TOKEN;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID;

function getMoyskladHeaders() {
  if (!MOYSKLAD_TOKEN) {
    throw new Error("MOYSKLAD_TOKEN topilmadi");
  }

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${MOYSKLAD_TOKEN}`,
  };
}

async function sendTelegramMessage(
  text: string,
  inline_keyboard?: Array<
    Array<{
      text: string;
      url?: string;
      callback_data?: string;
    }>
  >
) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_ADMIN_CHAT_ID) {
    throw new Error("Telegram env topilmadi");
  }

  const telegramRes = await fetch(
    `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: TELEGRAM_ADMIN_CHAT_ID,
        text,
        reply_markup: inline_keyboard ? { inline_keyboard } : undefined,
      }),
      cache: "no-store",
    }
  );

  const telegramData = await telegramRes.json();

  if (!telegramRes.ok || !telegramData?.ok) {
    throw new Error(telegramData?.description || "Telegramga yuborilmadi");
  }

  return telegramData;
}

async function getProductStock(productId: string): Promise<number> {
  const res = await fetch(`${MOYSKLAD_BASE}/entity/product/${productId}`, {
    method: "GET",
    headers: getMoyskladHeaders(),
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`MoySklad product olishda xato: ${text}`);
  }

  const data = await res.json();
  return Number(data?.stock || 0);
}

function normalizeItems(items: unknown): OrderItem[] {
  return Array.isArray(items) ? (items as OrderItem[]) : [];
}

function attachMoyskladIds(items: OrderItem[]): OrderItem[] {
  const map: Record<string, string> = {
    "Щипцы шт": "0001b99a-6ab6-11ef-0a80-16860010bc6c",
    "Плоток резина": "0012bd18-7765-11f0-0a80-11c8000be6fa",
    "ZR PFZ CHD A1 10g": "009b7b44-a172-11ee-0a80-064000333dd0",
    "Мегадез 3Л": "01025e06-b46a-11ef-0a80-08280019d9c4",
  };

  return items.map((item) => ({
    ...item,
    moysklad_product_id:
      item.moysklad_product_id || map[item.product_name || ""],
  }));
}

function buildItemsText(items: OrderItem[]) {
  if (!items.length) return "Mahsulotlar yo‘q";

  return items
    .map((item, index) => {
      const name = item.product_name || "Nomsiz mahsulot";
      const quantity = Number(item.quantity ?? 0);
      const price = item.price ?? 0;
      return `${index + 1}. ${name} — ${quantity} dona — ${price}`;
    })
    .join("\n");
}

function buildMoyskladPositions(items: OrderItem[]) {
  return items
    .filter((item) => item.moysklad_product_id && Number(item.quantity || 0) > 0)
    .map((item) => ({
      quantity: Number(item.quantity || 0),
      price: Math.round(Number(item.price || 0) * 100),
      assortment: {
        meta: {
          href: `${MOYSKLAD_BASE}/entity/product/${item.moysklad_product_id}`,
          type: "product",
          mediaType: "application/json",
        },
      },
    }));
}

async function createMoyskladOrder(params: {
  orderId: string;
  fullName?: string;
  phone?: string;
  address?: string;
  note?: string;
  items: OrderItem[];
}) {
  const positions = buildMoyskladPositions(params.items);

  if (!positions.length) {
    throw new Error(
      "MoySklad uchun positions topilmadi. product_name map bilan mos kelmayapti yoki moysklad_product_id yo‘q."
    );
  }

  const payload = {
    name: `TG-${params.orderId}`,
    description: [
      `Telegram/Web order: #${params.orderId}`,
      `Mijoz: ${params.fullName || "-"}`,
      `Telefon: ${params.phone || "-"}`,
      `Manzil: ${params.address || "-"}`,
      `Izoh: ${params.note || "-"}`,
    ].join("\n"),
    positions,
  };

  const res = await fetch(`${MOYSKLAD_BASE}/entity/customerorder`, {
    method: "POST",
    headers: getMoyskladHeaders(),
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`MoySklad order yaratishda xato: ${text}`);
  }

  return res.json();
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      orderId,
      fullName,
      phone,
      address,
      note,
      totalAmount,
      items,
    } = body ?? {};

    if (!orderId) {
      return NextResponse.json(
        { success: false, message: "orderId topilmadi" },
        { status: 400 }
      );
    }

    const rawItems = normalizeItems(items);
    const safeItems = attachMoyskladIds(rawItems);

    if (!safeItems.length) {
      return NextResponse.json(
        { success: false, message: "Mahsulotlar yo‘q" },
        { status: 400 }
      );
    }

    console.log("ORDER ITEMS:", safeItems);

    const moyskladOrder = await createMoyskladOrder({
      orderId: String(orderId),
      fullName,
      phone,
      address,
      note,
      items: safeItems,
    });

    let updatedStock: number | null = null;
    const firstMappedItem = safeItems.find((item) => item.moysklad_product_id);

    if (firstMappedItem?.moysklad_product_id) {
      updatedStock = await getProductStock(firstMappedItem.moysklad_product_id);
    }

    const itemsText = buildItemsText(safeItems);

    const text = [
      "🦷 Yangi buyurtma (Admin)",
      "",
      `Order ID: #${orderId}`,
      `Mijoz: ${fullName || "-"}`,
      `Telefon: ${phone || "-"}`,
      `Manzil: ${address || "-"}`,
      `Izoh: ${note || "-"}`,
      `Jami: ${totalAmount || "-"}`,
      `MoySklad order: ${moyskladOrder?.name || moyskladOrder?.id || "-"}`,
      updatedStock !== null ? `Yangilangan qoldiq: ${updatedStock}` : null,
      "",
      "Mahsulotlar:",
      itemsText,
    ]
      .filter(Boolean)
      .join("\n");

    await sendTelegramMessage(text, [
      [
        {
          text: "Admin panel",
          url: `${process.env.NEXT_PUBLIC_WEBAPP_URL}/admin`,
        },
        {
          text: "Buyurtmalar",
          url: `${process.env.NEXT_PUBLIC_WEBAPP_URL}/orders`,
        },
      ],
      [
        {
          text: "Qabul qilindi",
          callback_data: `accept:${orderId}`,
        },
        {
          text: "Bekor qilindi",
          callback_data: `cancel:${orderId}`,
        },
      ],
    ]);

    return NextResponse.json({
      success: true,
      moyskladOrderId: moyskladOrder?.id || null,
      updatedStock,
      items: safeItems,
    });
  } catch (error: any) {
    console.error("orders route error:", error);

    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Server xatosi",
      },
      { status: 500 }
    );
  }
}
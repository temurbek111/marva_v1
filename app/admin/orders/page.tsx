import { NextResponse } from "next/server";

type OrderItem = {
  product_name?: string;
  name?: string;
  quantity: number;
  price: number;
};

export async function POST(req: Request) {
  try {
    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const TELEGRAM_GROUP_CHAT_ID = process.env.TELEGRAM_GROUP_CHAT_ID;

    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_GROUP_CHAT_ID) {
      return NextResponse.json(
        { error: "Telegram env variables are missing" },
        { status: 500 }
      );
    }

    const body = await req.json();

    const {
      orderId,
      fullName,
      phone,
      address,
      note,
      totalAmount,
      items,
    }: {
      orderId: number | string;
      fullName: string;
      phone: string;
      address: string;
      note?: string;
      totalAmount: string;
      items: OrderItem[];
    } = body;

    const itemsText = (items || [])
      .map((item, index) => {
        const productName = item.product_name || item.name || "Mahsulot";
        return `${index + 1}. ${productName}\n   ${item.quantity} x ${item.price}`;
      })
      .join("\n\n");

    const text = [
      `🛒 Yangi buyurtma`,
      ``,
      `🆔 Buyurtma ID: ${orderId}`,
      `👤 Mijoz: ${fullName}`,
      `📞 Telefon: ${phone}`,
      `📍 Manzil: ${address}`,
      note ? `📝 Izoh: ${note}` : `📝 Izoh: -`,
      `💰 Jami: ${totalAmount}`,
      ``,
      `📦 Mahsulotlar:`,
      itemsText || `-`,
    ].join("\n");

    const telegramRes = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: TELEGRAM_GROUP_CHAT_ID,
          text,
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "Kuryerga berish",
                  callback_data: `order_assign_${orderId}`,
                },
                {
                  text: "Yetkazildi",
                  callback_data: `order_delivered_${orderId}`,
                },
                {
                  text: "O‘chirib tashlash",
                  callback_data: `order_delete_${orderId}`,
                },
              ],
            ],
          },
        }),
      }
    );

    const telegramData = await telegramRes.json();

    if (!telegramRes.ok) {
      return NextResponse.json(
        { error: telegramData?.description || "Telegram send failed" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, telegram: telegramData });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
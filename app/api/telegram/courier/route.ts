import { NextResponse } from "next/server";

export const runtime = "nodejs";

type OrderItem = {
  product_name?: string;
  quantity?: number;
  price?: number | string;
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("courier route body:", body);

    const {
      orderId,
      fullName,
      phone,
      address,
      pickupPoint,
      courierName,
      courierPhone,
      deliveryNote,
      items,
    } = body ?? {};

    if (!orderId) {
      return NextResponse.json(
        { success: false, message: "orderId topilmadi" },
        { status: 400 }
      );
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const courierChatId = process.env.TELEGRAM_COURIER_CHAT_ID;

    console.log("has bot token:", !!botToken);
    console.log("has courier chat id:", !!courierChatId);

    if (!botToken || !courierChatId) {
      return NextResponse.json(
        {
          success: false,
          message: "Telegram env topilmadi",
          debug: {
            hasBotToken: !!botToken,
            hasCourierChatId: !!courierChatId,
          },
        },
        { status: 500 }
      );
    }

    const safeItems: OrderItem[] = Array.isArray(items) ? items : [];

    const itemsText =
      safeItems.length > 0
        ? safeItems
            .map((item, index) => {
              const name = item.product_name || "Nomsiz mahsulot";
              const quantity = item.quantity ?? 0;
              const price = item.price ?? 0;
              return `${index + 1}. ${name} — ${quantity} dona — ${price}`;
            })
            .join("\n")
        : "Mahsulotlar yo‘q";

    const text = [
      "🚚 Yangi kuryer buyurtmasi",
      "",
      `Order ID: #${orderId}`,
      `Mijoz: ${fullName || "-"}`,
      `Telefon: ${phone || "-"}`,
      `Manzil: ${address || "-"}`,
      "",
      `Pickup point: ${pickupPoint || "-"}`,
      `Kuryer: ${courierName || "-"}`,
      `Kuryer telefoni: ${courierPhone || "-"}`,
      `Izoh: ${deliveryNote || "-"}`,
      "",
      "Mahsulotlar:",
      itemsText,
    ].join("\n");

    const telegramRes = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: courierChatId,
          text,
          reply_markup: {
            inline_keyboard: [
              [{ text: "Qabul qildim", callback_data: `accept:${orderId}` }],
              [{ text: "Yo'ldaman", callback_data: `ontheway:${orderId}` }],
              [{ text: "Yetkazdim", callback_data: `delivered:${orderId}` }],
            ],
          },
        }),
        cache: "no-store",
      }
    );

    const telegramData = await telegramRes.json();
    console.log("telegram response:", telegramData);

    if (!telegramRes.ok || !telegramData?.ok) {
      return NextResponse.json(
        {
          success: false,
          message: telegramData?.description || "Telegramga yuborilmadi",
          error: telegramData,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Telegramga yuborildi",
    });
  } catch (error: any) {
    console.error("courier route error:", error);

    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Server xatosi",
      },
      { status: 500 }
    );
  }
}
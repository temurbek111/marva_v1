import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
    const webUrl = process.env.NEXT_PUBLIC_WEBAPP_URL;

    if (!botToken || !chatId) {
      return NextResponse.json(
        { success: false, message: "Telegram env topilmadi" },
        { status: 500 }
      );
    }

    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: "🧪 Telegram test message",
        reply_markup: {
          inline_keyboard: [
            [
              { text: "Admin panel", url: `${webUrl}/admin` },
              { text: "Buyurtmalar", url: `${webUrl}/orders` },
            ],
            [
              { text: "Qabul qilindi", callback_data: "accept:test-123" },
              { text: "Bekor qilindi", callback_data: "cancel:test-123" },
            ],
          ],
        },
      }),
      cache: "no-store",
    });

    const data = await res.json();

    return NextResponse.json({
      success: res.ok && data?.ok,
      telegram: data,
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
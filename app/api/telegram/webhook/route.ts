import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

async function telegram(method: string, body: Record<string, unknown>) {
  const token = process.env.TELEGRAM_BOT_TOKEN;

  if (!token) {
    throw new Error("TELEGRAM_BOT_TOKEN topilmadi");
  }

  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const data = await res.json();

  if (!res.ok || !data?.ok) {
    throw new Error(data?.description || `Telegram ${method} xatosi`);
  }

  return data;
}

export async function POST(req: NextRequest) {
  try {
    const update = await req.json();

    const message = update.message;
    const callback = update.callback_query;

    // /start uchun
  if (message?.text === "/start") {
  await telegram("sendMessage", {
    chat_id: message.chat.id,
    text: "Bot ishladi ✅",
    reply_markup: {
      inline_keyboard: [
        [
          { text: "✅ Qabul qilish", callback_data: "accept:123" },
          { text: "❌ Bekor qilish", callback_data: "cancel:123" }
        ]
      ]
    }
  });

  return NextResponse.json({ ok: true });
}

    // oddiy message bo'lsa, shunchaki ok qaytaramiz
    if (!callback) {
      return NextResponse.json({ ok: true });
    }

    const data = String(callback.data || "");
    const chatId = callback.message?.chat?.id;
    const messageId = callback.message?.message_id;

    if (!chatId || !messageId) {
      return NextResponse.json({ ok: true });
    }

    const [action, orderId] = data.split(":");

    let text = "Noma'lum amal";

    if (action === "accept") {
      text = `✅ Buyurtma qabul qilindi: #${orderId}`;
    } else if (action === "cancel") {
      text = `❌ Buyurtma bekor qilindi: #${orderId}`;
    }

    await telegram("answerCallbackQuery", {
      callback_query_id: callback.id,
      text,
    });

    await telegram("sendMessage", {
      chat_id: chatId,
      text,
    });

    await telegram("editMessageReplyMarkup", {
      chat_id: chatId,
      message_id: messageId,
      reply_markup: {
        inline_keyboard: [],
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("telegram webhook error:", error);

    return NextResponse.json(
      {
        ok: false,
        message: error?.message || "Webhook xatosi",
      },
      { status: 500 }
    );
  }
}
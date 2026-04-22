import { NextRequest, NextResponse } from "next/server";
import { telegramBot } from "@/lib/telegram-bot";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const update = await req.json();

    const message = update.message;
    const callback = update.callback_query;

    if (message?.text === "/start") {
      await telegramBot("sendMessage", {
        chat_id: message.chat.id,
        text: "Bot ishladi ✅",
      });

      return NextResponse.json({ ok: true });
    }

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

    // Agar keyin status update qo‘shmoqchi bo‘lsangiz,
    // shu yerda faqat order status ni o‘zgartiring.
    // Quantity / stock ga tegmang.

    await telegramBot("answerCallbackQuery", {
      callback_query_id: callback.id,
      text,
    });

    await telegramBot("sendMessage", {
      chat_id: chatId,
      text,
    });

    await telegramBot("editMessageReplyMarkup", {
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
import { NextRequest, NextResponse } from "next/server";
import { telegramBot } from "@/lib/telegram-bot";
import { type BotLang, getText } from "@/lib/bot-texts";
import {
  languageKeyboard,
  mainMenuKeyboard,
  productsKeyboard,
  backInlineKeyboard,
} from "@/lib/bot-menu";

export const runtime = "nodejs";

function getUserLang(update: any): BotLang {
  const code =
    update?.message?.from?.language_code ||
    update?.callback_query?.from?.language_code ||
    "uz";

  return code.startsWith("ru") ? "ru" : "uz";
}

async function sendMainMenu(chatId: number, lang: BotLang) {
  await telegramBot("sendMessage", {
    chat_id: chatId,
    text: getText(lang, "mainMenu"),
    reply_markup: mainMenuKeyboard(lang),
  });
}

export async function POST(req: NextRequest) {
  try {
    const update = await req.json();

    const message = update.message;
    const callback = update.callback_query;

    if (message?.text === "/start") {
      await telegramBot("sendMessage", {
        chat_id: message.chat.id,
        text: getText(getUserLang(update), "chooseLanguage"),
        reply_markup: languageKeyboard(),
      });

      return NextResponse.json({ ok: true });
    }

    if (callback) {
      const data = String(callback.data || "");
      const chatId = callback.message?.chat?.id;
      const messageId = callback.message?.message_id;
      const lang = getUserLang(update);

      if (!chatId) {
        return NextResponse.json({ ok: true });
      }

      if (data === "lang:uz" || data === "lang:ru") {
        const selectedLang = data.split(":")[1] as BotLang;

        await telegramBot("answerCallbackQuery", {
          callback_query_id: callback.id,
          text: selectedLang === "uz" ? "O‘zbek tili tanlandi" : "Выбран русский язык",
        });

        if (messageId) {
          await telegramBot("editMessageText", {
            chat_id: chatId,
            message_id: messageId,
            text: getText(selectedLang, "mainMenu"),
          });
        }

        await telegramBot("sendMessage", {
          chat_id: chatId,
          text: getText(selectedLang, "mainMenu"),
          reply_markup: mainMenuKeyboard(selectedLang),
        });

        return NextResponse.json({ ok: true });
      }

      if (data === "menu:back") {
        await telegramBot("answerCallbackQuery", {
          callback_query_id: callback.id,
        });

        await sendMainMenu(chatId, lang);
        return NextResponse.json({ ok: true });
      }

      if (data.startsWith("accept:") || data.startsWith("cancel:")) {
        const [action, orderId] = data.split(":");

        const text =
          action === "accept"
            ? `✅ Buyurtma qabul qilindi: #${orderId}`
            : `❌ Buyurtma bekor qilindi: #${orderId}`;

        await telegramBot("answerCallbackQuery", {
          callback_query_id: callback.id,
          text,
        });

        await telegramBot("sendMessage", {
          chat_id: chatId,
          text,
        });

        if (messageId) {
          await telegramBot("editMessageReplyMarkup", {
            chat_id: chatId,
            message_id: messageId,
            reply_markup: {
              inline_keyboard: [],
            },
          });
        }

        return NextResponse.json({ ok: true });
      }

      return NextResponse.json({ ok: true });
    }

    if (message?.text) {
      const chatId = message.chat.id;
      const lang = getUserLang(update);
      const text = String(message.text);

      if (text === getText(lang, "products")) {
        await telegramBot("sendMessage", {
          chat_id: chatId,
          text: getText(lang, "products"),
          reply_markup: productsKeyboard(lang),
        });

        return NextResponse.json({ ok: true });
      }

      if (text === getText(lang, "myOrders")) {
        await telegramBot("sendMessage", {
          chat_id: chatId,
          text: getText(lang, "ordersEmpty"),
          reply_markup: backInlineKeyboard(lang),
        });

        return NextResponse.json({ ok: true });
      }

      if (text === getText(lang, "callOperator")) {
        await telegramBot("sendMessage", {
          chat_id: chatId,
          text: getText(lang, "operatorText"),
          reply_markup: backInlineKeyboard(lang),
        });

        return NextResponse.json({ ok: true });
      }

      if (text === getText(lang, "about")) {
        await telegramBot("sendMessage", {
          chat_id: chatId,
          text: getText(lang, "contactText"),
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "📍 Open map",
                  url: "https://maps.google.com",
                },
              ],
              [{ text: getText(lang, "back"), callback_data: "menu:back" }],
            ],
          },
        });

        return NextResponse.json({ ok: true });
      }

      if (text === getText(lang, "language")) {
        await telegramBot("sendMessage", {
          chat_id: chatId,
          text: getText(lang, "chooseLanguage"),
          reply_markup: languageKeyboard(),
        });

        return NextResponse.json({ ok: true });
      }
    }

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
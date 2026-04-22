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

function logIncomingUpdate(update: any) {
  console.log("TELEGRAM_UPDATE", {
    update_id: update?.update_id,
    update_type: update?.message
      ? "message"
      : update?.callback_query
      ? "callback_query"
      : "unknown",
    chat_id:
      update?.message?.chat?.id || update?.callback_query?.message?.chat?.id,
    user_id: update?.message?.from?.id || update?.callback_query?.from?.id,
    text: update?.message?.text || null,
    callback_data: update?.callback_query?.data || null,
    ts: new Date().toISOString(),
  });
}

async function sendTelegram(method: string, payload: Record<string, any>) {
  console.log("TELEGRAM_SEND", {
    method,
    chat_id: payload?.chat_id ?? null,
    message_id: payload?.message_id ?? null,
    text: payload?.text ?? null,
    callback_query_id: payload?.callback_query_id ?? null,
    ts: new Date().toISOString(),
  });

  return telegramBot(method, payload);
}

async function sendMainMenu(chatId: number, lang: BotLang) {
  await sendTelegram("sendMessage", {
    chat_id: chatId,
    text: getText(lang, "mainMenu"),
    reply_markup: mainMenuKeyboard(lang),
  });
}

export async function POST(req: NextRequest) {
  try {
    const update = await req.json();
    logIncomingUpdate(update);

    const message = update?.message;
    const callback = update?.callback_query;

    if (message?.text === "/start") {
      await sendTelegram("sendMessage", {
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

        await sendTelegram("answerCallbackQuery", {
          callback_query_id: callback.id,
          text:
            selectedLang === "uz"
              ? "O‘zbek tili tanlandi"
              : "Выбран русский язык",
        });

        if (messageId) {
          await sendTelegram("editMessageText", {
            chat_id: chatId,
            message_id: messageId,
            text: getText(selectedLang, "mainMenu"),
          });
        }

        await sendTelegram("sendMessage", {
          chat_id: chatId,
          text: getText(selectedLang, "mainMenu"),
          reply_markup: mainMenuKeyboard(selectedLang),
        });

        return NextResponse.json({ ok: true });
      }

      if (data === "menu:back") {
        await sendTelegram("answerCallbackQuery", {
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

        await sendTelegram("answerCallbackQuery", {
          callback_query_id: callback.id,
          text,
        });

        await sendTelegram("sendMessage", {
          chat_id: chatId,
          text,
        });

        if (messageId) {
          await sendTelegram("editMessageReplyMarkup", {
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
        await sendTelegram("sendMessage", {
          chat_id: chatId,
          text: getText(lang, "products"),
          reply_markup: productsKeyboard(lang),
        });

        return NextResponse.json({ ok: true });
      }

      if (text === getText(lang, "myOrders")) {
        await sendTelegram("sendMessage", {
          chat_id: chatId,
          text: getText(lang, "ordersEmpty"),
          reply_markup: backInlineKeyboard(lang),
        });

        return NextResponse.json({ ok: true });
      }

      if (text === getText(lang, "callOperator")) {
        await sendTelegram("sendMessage", {
          chat_id: chatId,
          text: getText(lang, "operatorText"),
          reply_markup: backInlineKeyboard(lang),
        });

        return NextResponse.json({ ok: true });
      }

      if (text === getText(lang, "about")) {
        await sendTelegram("sendMessage", {
          chat_id: chatId,
          text: getText(lang, "contactText"),
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "📍 Open map",
                  url: "https://yandex.uz/maps/?ll=69.216837%2C41.334880&z=17&pt=69.216837,41.334880,pm2rdm",
                },
              ],
              [{ text: getText(lang, "back"), callback_data: "menu:back" }],
            ],
          },
        });

        return NextResponse.json({ ok: true });
      }

      if (text === getText(lang, "language")) {
        await sendTelegram("sendMessage", {
          chat_id: chatId,
          text: getText(lang, "chooseLanguage"),
          reply_markup: languageKeyboard(),
        });

        return NextResponse.json({ ok: true });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("TELEGRAM_WEBHOOK_ERROR", {
      message: error?.message || "Unknown error",
      stack: error?.stack || null,
      ts: new Date().toISOString(),
    });

    return NextResponse.json(
      {
        ok: false,
        message: error?.message || "Webhook xatosi",
      },
      { status: 500 }
    );
  }
}
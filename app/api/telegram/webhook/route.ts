import { NextRequest, NextResponse } from "next/server";
import { telegramBot } from "@/lib/telegram-bot";
import { supabaseServer } from "@/lib/supabase-server";
import { type BotLang, getText } from "@/lib/bot-texts";
import {
  languageKeyboard,
  mainMenuKeyboard,
  productsKeyboard,
  backInlineKeyboard,
} from "@/lib/bot-menu";
export const runtime = "nodejs";

const processedUpdates = new Set<number>();
const chatLangStore = new Map<number, BotLang>();

type MenuAction =
  | "products"
  | "myOrders"
  | "callOperator"
  | "about"
  | "language"
  | null;

type DbCustomer = {
  id: number;
  full_name: string | null;
  telegram_id: number | null;
  phone: string | null;
};

type DbOrder = {
  id: number;
  created_at: string;
  total_amount: number | null;
  order_status: string | null;
};

function getTelegramUserId(update: any): number | null {
  return (
    update?.message?.from?.id ||
    update?.callback_query?.from?.id ||
    null
  );
}

async function getCustomerOrdersByTelegramUser(telegramUserId: number) {
  const { data: customer, error: customerError } = await supabaseServer
    .from("customers")
    .select("id, full_name, telegram_id, phone")
    .eq("telegram_id", telegramUserId)
    .maybeSingle();

  if (customerError) {
    throw new Error(customerError.message);
  }

  if (!customer) {
    return {
      customer: null as DbCustomer | null,
      orders: [] as DbOrder[],
    };
  }

  const { data: orders, error: ordersError } = await supabaseServer
    .from("orders")
    .select("id, created_at, total_amount, order_status")
    .eq("user_id", customer.id)
    .order("created_at", { ascending: false })
    .limit(10);

  if (ordersError) {
    throw new Error(ordersError.message);
  }

  return {
    customer: customer as DbCustomer,
    orders: (orders ?? []) as DbOrder[],
  };
}

function buildOrdersMessage(params: {
  lang: BotLang;
  customerName?: string | null;
  orders: DbOrder[];
}) {
  const { lang, customerName, orders } = params;

  if (!orders.length) {
    return lang === "uz"
      ? "Sizda hozircha buyurtmalar yo‘q."
      : "У вас пока нет заказов.";
  }

  const title = lang === "uz" ? "📦 Buyurtmalaringiz" : "📦 Ваши заказы";

  const ownerLine = customerName
    ? lang === "uz"
      ? `Mijoz: ${customerName}`
      : `Клиент: ${customerName}`
    : null;

  const rows = orders.map((order, index) => {
    const dateText = new Date(order.created_at).toLocaleString(
      lang === "ru" ? "ru-RU" : "uz-UZ"
    );

    const statusText =
      order.order_status || (lang === "uz" ? "Noma’lum" : "Неизвестно");

    return [
      `${index + 1}) #${order.id}`,
      lang === "uz" ? `📅 Sana: ${dateText}` : `📅 Дата: ${dateText}`,
      lang === "uz"
        ? `💵 Jami: $${Number(order.total_amount || 0)}`
        : `💵 Сумма: $${Number(order.total_amount || 0)}`,
      lang === "uz"
        ? `📌 Holat: ${statusText}`
        : `📌 Статус: ${statusText}`,
    ].join("\n");
  });

  return [title, ownerLine, "", ...rows].filter(Boolean).join("\n\n");
}


function getTelegramProfileLang(update: any): BotLang {
  const code =
    update?.message?.from?.language_code ||
    update?.callback_query?.from?.language_code ||
    "uz";

  return code.startsWith("ru") ? "ru" : "uz";
}

function getChatId(update: any): number | null {
  return (
    update?.message?.chat?.id ||
    update?.callback_query?.message?.chat?.id ||
    null
  );
}

function getResolvedLang(update: any): BotLang {
  const chatId = getChatId(update);
  if (chatId && chatLangStore.has(chatId)) {
    return chatLangStore.get(chatId)!;
  }
  return getTelegramProfileLang(update);
}

function setResolvedLang(chatId: number, lang: BotLang) {
  chatLangStore.set(chatId, lang);
}

function resolveMenuAction(text: string): MenuAction {
  if (
    text === getText("uz", "products") ||
    text === getText("ru", "products")
  ) {
    return "products";
  }

  if (
    text === getText("uz", "myOrders") ||
    text === getText("ru", "myOrders")
  ) {
    return "myOrders";
  }

  if (
    text === getText("uz", "callOperator") ||
    text === getText("ru", "callOperator")
  ) {
    return "callOperator";
  }

  if (text === getText("uz", "about") || text === getText("ru", "about")) {
    return "about";
  }

  if (
    text === getText("uz", "language") ||
    text === getText("ru", "language")
  ) {
    return "language";
  }

  return null;
}

function logIncomingUpdate(update: any) {
  console.log("TELEGRAM_UPDATE", {
    update_id: update?.update_id,
    update_type: update?.message
      ? "message"
      : update?.callback_query
      ? "callback_query"
      : "unknown",
    chat_id: getChatId(update),
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

async function sendLanguagePicker(chatId: number, lang: BotLang) {
  await sendTelegram("sendMessage", {
    chat_id: chatId,
    text: getText(lang, "chooseLanguage"),
    reply_markup: languageKeyboard(),
  });
}

export async function POST(req: NextRequest) {
  try {
    const update = await req.json();
    logIncomingUpdate(update);

    if (typeof update?.update_id === "number") {
      if (processedUpdates.has(update.update_id)) {
        console.log("DUPLICATE_UPDATE_SKIPPED", {
          update_id: update.update_id,
          ts: new Date().toISOString(),
        });
        return NextResponse.json({ ok: true });
      }

      processedUpdates.add(update.update_id);

      setTimeout(() => {
        processedUpdates.delete(update.update_id);
      }, 5 * 60 * 1000);
    }

    const message = update?.message;
    const callback = update?.callback_query;

    if (message?.text === "/start") {
      const chatId = message.chat.id;
      const lang = getResolvedLang(update);

      await sendLanguagePicker(chatId, lang);
      return NextResponse.json({ ok: true });
    }

    if (callback) {
      const data = String(callback.data || "");
      const chatId = callback.message?.chat?.id;
      const messageId = callback.message?.message_id;

      if (!chatId) {
        return NextResponse.json({ ok: true });
      }

      if (data === "lang:uz" || data === "lang:ru") {
        const selectedLang = data.split(":")[1] as BotLang;
        setResolvedLang(chatId, selectedLang);

        await sendTelegram("answerCallbackQuery", {
          callback_query_id: callback.id,
          text:
            selectedLang === "uz"
              ? "O‘zbek tili tanlandi"
              : "Выбран русский язык",
        });

        if (messageId) {
          try {
            await sendTelegram("editMessageText", {
              chat_id: chatId,
              message_id: messageId,
              text: getText(selectedLang, "mainMenu"),
              reply_markup: mainMenuKeyboard(selectedLang),
            });
            return NextResponse.json({ ok: true });
          } catch (error: any) {
            console.warn("EDIT_MAIN_MENU_FAILED", {
              message: error?.message || "Unknown error",
              chat_id: chatId,
              message_id: messageId,
              ts: new Date().toISOString(),
            });
          }
        }

        await sendMainMenu(chatId, selectedLang);
        return NextResponse.json({ ok: true });
      }

      if (data === "menu:back") {
        const lang = getResolvedLang(update);

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
      const lang = getResolvedLang(update);
      const text = String(message.text);
      const action = resolveMenuAction(text);

      if (action === "products") {
        await sendTelegram("sendMessage", {
          chat_id: chatId,
          text: getText(lang, "products"),
          reply_markup: productsKeyboard(lang),
        });

        return NextResponse.json({ ok: true });
      }

     if (action === "myOrders") {
  const telegramUserId = getTelegramUserId(update);

  if (!telegramUserId) {
    await sendTelegram("sendMessage", {
      chat_id: chatId,
      text:
        lang === "uz"
          ? "Telegram foydalanuvchi ID topilmadi."
          : "Не удалось определить Telegram user ID.",
      reply_markup: backInlineKeyboard(lang),
    });

    return NextResponse.json({ ok: true });
  }

  const { customer, orders } = await getCustomerOrdersByTelegramUser(
    telegramUserId
  );

  if (!customer) {
    await sendTelegram("sendMessage", {
      chat_id: chatId,
      text:
        lang === "uz"
          ? "Profil topilmadi. Avval Mini App ichida profilingizni to‘ldiring va buyurtma bering."
          : "Профиль не найден. Сначала заполните профиль в Mini App и оформите заказ.",
      reply_markup: backInlineKeyboard(lang),
    });

    return NextResponse.json({ ok: true });
  }

  await sendTelegram("sendMessage", {
    chat_id: chatId,
    text: buildOrdersMessage({
      lang,
      customerName: customer.full_name,
      orders,
    }),
    reply_markup: backInlineKeyboard(lang),
  });

  return NextResponse.json({ ok: true });
}

      if (action === "callOperator") {
        await sendTelegram("sendMessage", {
          chat_id: chatId,
          text: getText(lang, "operatorText"),
          reply_markup: backInlineKeyboard(lang),
        });

        return NextResponse.json({ ok: true });
      }

      if (action === "about") {
        await sendTelegram("sendMessage", {
          chat_id: chatId,
          text: getText(lang, "contactText"),
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: lang === "ru" ? "📍 Открыть карту" : "📍 Open map",
                  url: "https://yandex.uz/maps/?ll=69.216837%2C41.334880&z=17&pt=69.216837,41.334880,pm2rdm",
                },
              ],
              [{ text: getText(lang, "back"), callback_data: "menu:back" }],
            ],
          },
        });

        return NextResponse.json({ ok: true });
      }

      if (action === "language") {
        await sendLanguagePicker(chatId, lang);
        return NextResponse.json({ ok: true });
      }

      await sendMainMenu(chatId, lang);
      return NextResponse.json({ ok: true });
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
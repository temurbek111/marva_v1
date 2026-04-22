import type { BotLang } from "@/lib/bot-texts";
import { getText } from "@/lib/bot-texts";

const WEB_APP_URL = "https://marva-v1.vercel.app";

export function languageKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: "🇺🇿 O‘zbekcha", callback_data: "lang:uz" },
        { text: "🇷🇺 Русский", callback_data: "lang:ru" },
      ],
    ],
  };
}

export function mainMenuKeyboard(lang: BotLang) {
  return {
    keyboard: [
      [{ text: getText(lang, "products") }],
      [{ text: getText(lang, "myOrders") }],
      [{ text: getText(lang, "callOperator") }],
      [{ text: getText(lang, "about") }],
      [{ text: getText(lang, "language") }],
    ],
    resize_keyboard: true,
  };
}

export function productsKeyboard(lang: BotLang) {
  return {
    inline_keyboard: [
      [
        {
          text: getText(lang, "openCatalog"),
          web_app: { url: WEB_APP_URL },
        },
      ],
      [{ text: getText(lang, "back"), callback_data: "menu:back" }],
    ],
  };
}

export function backInlineKeyboard(lang: BotLang) {
  return {
    inline_keyboard: [
      [{ text: getText(lang, "back"), callback_data: "menu:back" }],
    ],
  };
}

export function aboutKeyboard(lang: BotLang) {
  return {
    inline_keyboard: [
      [
        {
          text: getText(lang, "openMap"),
          url: "https://www.google.com/maps/search/?api=1&query=Toshkent%2C%20Olmazor%2C%20Farobiy%2094",
        },
      ],
      [{ text: getText(lang, "back"), callback_data: "menu:back" }],
    ],
  };
}
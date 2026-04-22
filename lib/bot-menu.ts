import type { BotLang } from "@/lib/bot-texts";
import { getText } from "@/lib/bot-texts";

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
          web_app: { url: "https://marva-v1.vercel.app" },
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
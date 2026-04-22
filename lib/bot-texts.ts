export type BotLang = "uz" | "ru";

export const TEXTS = {
  uz: {
    chooseLanguage: "Tilni tanlang:",
    mainMenu: "Kerakli bo‘limni tanlang:",
    products: "🛍 Mahsulotlar",
    myOrders: "📦 Buyurtmalarim",
    callOperator: "☎️ Operator bilan bog‘lanish",
    about: "ℹ️ Biz haqimizda / Aloqa",
    language: "🌐 Til",
    back: "⬅️ Orqaga",
    openCatalog: "🛒 Katalogni ochish",
    contactText: [
      "🦷 Marva Dental",
      "",
      "📞 Telefon: +998 XX XXX XX XX",
      "📍 Manzil: Toshkent, ...",
      "🕘 Ish vaqti: Du-Sha 9:00 - 18:00",
      "🚚 Yetkazib berish: Toshkent bo‘ylab mavjud",
    ].join("\n"),
    operatorText:
      "Operator bilan bog‘lanish uchun shu yerga telefon raqamingiz yoki xabaringizni yuboring.",
    ordersEmpty: "Sizda hozircha buyurtmalar yo‘q.",
  },
  ru: {
    chooseLanguage: "Выберите язык:",
    mainMenu: "Выберите нужный раздел:",
    products: "🛍 Товары",
    myOrders: "📦 Мои заказы",
    callOperator: "☎️ Связаться с оператором",
    about: "ℹ️ О нас / Контакты",
    language: "🌐 Язык",
    back: "⬅️ Назад",
    openCatalog: "🛒 Открыть каталог",
    contactText: [
      "🦷 Marva Dental",
      "",
      "📞 Телефон: +998 XX XXX XX XX",
      "📍 Адрес: Ташкент, ...",
      "🕘 Время работы: Пн-Сб 9:00 - 18:00",
      "🚚 Доставка: доступна по Ташкенту",
    ].join("\n"),
    operatorText:
      "Чтобы связаться с оператором, отправьте сюда свой номер телефона или сообщение.",
    ordersEmpty: "У вас пока нет заказов.",
  },
} as const;

export function getText(lang: BotLang, key: keyof (typeof TEXTS)["uz"]) {
  return TEXTS[lang][key];
}
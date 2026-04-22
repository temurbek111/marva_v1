export type Lang = "uz" | "ru";

export const messages = {
  uz: {
    home: "Bosh sahifa",
    catalog: "Katalog",
    cart: "Savat",
    profile: "Profil",
    searchPlaceholder: "Mahsulot qidiring...",
    emptyCart: "Savatcha bo‘sh",
    addToCart: "Savatga qo‘shish",
    orders: "Buyurtmalarim",
    save: "Saqlash",
  },
  ru: {
    home: "Главная",
    catalog: "Каталог",
    cart: "Корзина",
    profile: "Профиль",
    searchPlaceholder: "Поиск товара...",
    emptyCart: "Корзина пуста",
    addToCart: "Добавить в корзину",
    orders: "Мои заказы",
    save: "Сохранить",
  },
} as const;

export function getLang(input?: string | null): Lang {
  if (!input) return "uz";
  return input.toLowerCase().startsWith("ru") ? "ru" : "uz";
}

export function t(lang: Lang, key: keyof typeof messages.uz) {
  return messages[lang][key] ?? messages.uz[key];
}
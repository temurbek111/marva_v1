export type AddressParts = {
  viloyat: string;
  tuman: string;
  street: string;
  houseNumber: string;
};

export const VILOYATLAR = [
  "Toshkent shahri",
  "Toshkent viloyati",
  "Andijon viloyati",
  "Buxoro viloyati",
  "Farg‘ona viloyati",
  "Jizzax viloyati",
  "Xorazm viloyati",
  "Namangan viloyati",
  "Navoiy viloyati",
  "Qashqadaryo viloyati",
  "Qoraqalpog‘iston Respublikasi",
  "Samarqand viloyati",
  "Sirdaryo viloyati",
  "Surxondaryo viloyati",
] as const;

/**
 * Fill each viloyat with your real tuman list.
 * I only included Toshkent shahri fully here so the structure is ready.
 */
export const TUMANLAR_BY_VILOYAT: Record<string, string[]> = {
  "Toshkent shahri": [
    "Bektemir",
    "Chilonzor",
    "Mirobod",
    "Mirzo Ulug‘bek",
    "Olmazor",
    "Sergeli",
    "Shayxontohur",
    "Uchtepa",
    "Yakkasaroy",
    "Yashnobod",
    "Yunusobod",
    "Yangi Hayot",
  ],
  "Toshkent viloyati": [],
  "Andijon viloyati": [],
  "Buxoro viloyati": [],
  "Farg‘ona viloyati": [],
  "Jizzax viloyati": [],
  "Xorazm viloyati": [],
  "Namangan viloyati": [],
  "Navoiy viloyati": [],
  "Qashqadaryo viloyati": [],
  "Qoraqalpog‘iston Respublikasi": [],
  "Samarqand viloyati": [],
  "Sirdaryo viloyati": [],
  "Surxondaryo viloyati": [],
};

export function buildAddress(parts: AddressParts) {
  return [
    parts.viloyat.trim(),
    parts.tuman.trim(),
    parts.street.trim(),
    parts.houseNumber.trim(),
  ]
    .filter(Boolean)
    .join(", ");
}

export function parseAddress(raw: string): AddressParts {
  const value = String(raw || "").trim();

  // old saved map links cannot be safely split into viloyat/tuman/street/house number
  if (!value || /https?:\/\/|yandex|google|maps/i.test(value)) {
    return {
      viloyat: "",
      tuman: "",
      street: "",
      houseNumber: "",
    };
  }

  const parts = value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  return {
    viloyat: parts[0] || "",
    tuman: parts[1] || "",
    street: parts[2] || "",
    houseNumber: parts.slice(3).join(", "),
  };
}
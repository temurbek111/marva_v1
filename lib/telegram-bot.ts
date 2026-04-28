export type TelegramOrderItem = {
  product_name?: string;
  quantity?: number;
  price?: number | string;
};

export type TelegramOrderPayload = {
  orderId: string;
  fullName?: string;
  phone?: string;
  address?: string;
  latitude?: number | null;
  longitude?: number | null;
  note?: string;
  totalAmount?: number | string;
  items: TelegramOrderItem[];
  moyskladOrderName?: string;
  updatedStock?: number | null;
};

function buildItemsText(items: TelegramOrderItem[]) {
  if (!items.length) return "Mahsulotlar yo‘q";

  return items
    .map((item, index) => {
      const name = item.product_name || "Nomsiz mahsulot";
      const quantity = Number(item.quantity ?? 0);
      const price = item.price ?? 0;

      return `${index + 1}. ${name} — ${quantity} dona — ${price}`;
    })
    .join("\n");
}

export async function telegramBot(
  method: string,
  body: Record<string, unknown>
) {
  const token = process.env.TELEGRAM_BOT_TOKEN;

  if (!token) {
    throw new Error("TELEGRAM_BOT_TOKEN topilmadi");
  }

  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const data = await res.json();

  if (!res.ok || !data?.ok) {
    throw new Error(data?.description || `Telegram ${method} xatosi`);
  }

  return data;
}

function orderActionKeyboard(orderId: string) {
  return {
    inline_keyboard: [
      [
        {
          text: "💾 Saqlash",
          callback_data: `order:save:${orderId}`,
        },
        {
          text: "🚚 Kuryerga berish",
          callback_data: `order:courier:${orderId}`,
        },
      ],
      [
        {
          text: "✅ Yetkazildi",
          callback_data: `order:delivered:${orderId}`,
        },
        {
          text: "🗑 O‘chirish",
          callback_data: `order:delete:${orderId}`,
        },
      ],
    ],
  };
}

export async function sendTelegramAdminOrder(params: TelegramOrderPayload) {
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID;

  if (!chatId) {
    throw new Error("TELEGRAM_ADMIN_CHAT_ID topilmadi");
  }

  const itemsText = buildItemsText(params.items);

  const text = [
    "🦷 Yangi buyurtma",
    "",
    `Order ID: #${params.orderId}`,
    `Mijoz: ${params.fullName || "-"}`,
    `Telefon: ${params.phone || "-"}`,
    `Manzil: ${params.address || "-"}`,
    params.latitude && params.longitude
      ? `Koordinata: ${params.latitude}, ${params.longitude}`
      : null,
    `Izoh: ${params.note || "-"}`,
    `Jami: ${params.totalAmount || "-"}`,
    `MoySklad order: ${params.moyskladOrderName || "-"}`,
    params.updatedStock !== null && params.updatedStock !== undefined
      ? `Yangilangan qoldiq: ${params.updatedStock}`
      : null,
    "",
    "Mahsulotlar:",
    itemsText,
  ]
    .filter(Boolean)
    .join("\n");

  return telegramBot("sendMessage", {
    chat_id: chatId,
    text,
    reply_markup: orderActionKeyboard(params.orderId),
  });
}
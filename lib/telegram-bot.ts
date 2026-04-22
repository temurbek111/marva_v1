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

export async function sendOrderToTelegram(order: {
  id: number | string;
  customer_name?: string;
  phone?: string;
  address?: string;
  total?: number | string;
}) {
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!chatId) {
    throw new Error("TELEGRAM_CHAT_ID topilmadi");
  }

  const text = [
    "🆕 Yangi buyurtma",
    `ID: #${order.id}`,
    `Mijoz: ${order.customer_name || "-"}`,
    `Telefon: ${order.phone || "-"}`,
    `Manzil: ${order.address || "-"}`,
    `Jami: ${order.total || "-"}`,
  ].join("\n");

  return telegramBot("sendMessage", {
    chat_id: chatId,
    text,
    reply_markup: {
      inline_keyboard: [
        [
          { text: "✅ Qabul qilish", callback_data: `accept:${order.id}` },
          { text: "❌ Bekor qilish", callback_data: `cancel:${order.id}` },
        ],
      ],
    },
  });
}
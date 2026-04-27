// @ts-nocheck
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type OrderRow = {
  id?: string | number;
  full_name?: string | null;
  phone?: string | null;
  address?: string | null;
  note?: string | null;
  total_amount?: number | string | null;
  order_status?: string | null;
  delivery_status?: string | null;
  courier_name?: string | null;
  courier_phone?: string | null;
  delivery_note?: string | null;
};

type OrderItemRow = {
  id?: string | number;
  order_id?: string | number;
  product_id?: string | number | null;
  product_name?: string | null;
  quantity?: number | string | null;
  price?: number | string | null;
};

type WebhookPayload = {
  type?: string;
  table?: string;
  schema?: string;
  record?: OrderRow | null;
  old_record?: OrderRow | null;
};

function buildItemsText(items: OrderItemRow[]) {
  if (!items.length) {
    return "Mahsulotlar topilmadi";
  }

  return items
    .map((item, index) => {
      const name = item.product_name || "Nomsiz mahsulot";
      const productNumber = item.product_id || "-";
      const quantity = item.quantity ?? "-";
      const price = item.price ?? "-";

      return [
        `${index + 1}. ${name}`,
        `   Mahsulot raqami: ${productNumber}`,
        `   Soni: ${quantity} dona`,
        `   Narxi: ${price}`,
      ].join("\n");
    })
    .join("\n\n");
}

function buildOrderKeyboard(orderId: string | number) {
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

function buildText(order: OrderRow, items: OrderItemRow[]) {
  return [
    "🆕 Order notification",
    `Order ID: #${order.id ?? "-"}`,
    `Client: ${order.full_name ?? "-"}`,
    `Phone: ${order.phone ?? "-"}`,
    `Address: ${order.address ?? "-"}`,
    `Note: ${order.note ?? "-"}`,
    `Total: ${order.total_amount ?? "-"}`,
    `Order status: ${order.order_status ?? "-"}`,
    `Delivery status: ${order.delivery_status ?? "-"}`,
    `Courier: ${order.courier_name ?? "-"}`,
    `Courier phone: ${order.courier_phone ?? "-"}`,
    `Delivery note: ${order.delivery_note ?? "-"}`,
    "",
    "Mahsulotlar:",
    buildItemsText(items),
  ].join("\n");
}

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function getOrderItemsWithRetry(orderId: string | number) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    return [];
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  for (let attempt = 1; attempt <= 8; attempt++) {
    const { data, error } = await supabase
      .from("order_items")
      .select("id, order_id, product_id, product_name, quantity, price")
      .eq("order_id", orderId)
      .order("id", { ascending: true });

    if (error) {
      console.error("ORDER_ITEMS_FETCH_ERROR", error.message);
      return [];
    }

    if (data && data.length > 0) {
      return data;
    }

    await sleep(700);
  }

  return [];
}

serve(async (req) => {
  try {
    const payload = (await req.json()) as WebhookPayload;
    const order = payload.record;

    if (!order?.id) {
      return new Response(
        JSON.stringify({ ok: false, message: "No order record found" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
    const groupChatId = Deno.env.get("TELEGRAM_GROUP_CHAT_ID");

    if (!botToken) {
      return new Response(
        JSON.stringify({ ok: false, message: "Missing TELEGRAM_BOT_TOKEN" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (!groupChatId) {
      return new Response(
        JSON.stringify({ ok: false, message: "Missing TELEGRAM_GROUP_CHAT_ID" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const items = await getOrderItemsWithRetry(order.id);
    const text = buildText(order, items);

    const telegramRes = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: groupChatId,
          text,
          reply_markup: buildOrderKeyboard(order.id),
        }),
      }
    );

    const telegramJson = await telegramRes.json();

    return new Response(
      JSON.stringify({
        ok: telegramRes.ok,
        telegram: telegramJson,
      }),
      {
        status: telegramRes.ok ? 200 : 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        ok: false,
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

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

type WebhookPayload = {
  type?: string;
  table?: string;
  schema?: string;
  record?: OrderRow | null;
  old_record?: OrderRow | null;
};

function buildText(order: OrderRow) {
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
  ].join("\n");
}

serve(async (req) => {
  try {
    const payload = (await req.json()) as WebhookPayload;
    const order = payload.record;

    if (!order) {
      return new Response(JSON.stringify({ ok: false, message: "No record found" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
    const groupChatId = Deno.env.get("TELEGRAM_GROUP_CHAT_ID");

    if (!botToken) {
      return new Response(JSON.stringify({ ok: false, message: "Missing TELEGRAM_BOT_TOKEN" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    if (!groupChatId) {
      return new Response(JSON.stringify({ ok: false, message: "Missing TELEGRAM_GROUP_CHAT_ID" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    const text = buildText(order);

    const telegramRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: groupChatId,
        text
      })
    });

    const telegramJson = await telegramRes.json();

    return new Response(JSON.stringify({
      ok: telegramRes.ok,
      telegram: telegramJson
    }), {
      status: telegramRes.ok ? 200 : 500,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      ok: false,
      message: error instanceof Error ? error.message : "Unknown error"
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
});

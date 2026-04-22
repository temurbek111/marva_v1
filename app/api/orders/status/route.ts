import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const botToken = process.env.BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

type UpdatePayload = {
  orderId?: number;
  order_status?: string;
  delivery_status?: string;
  courier_name?: string;
  courier_phone?: string;
  pickup_point?: string;
  delivery_note?: string;
  notify_customer?: boolean;
  customer_message?: string;
  customer_chat_id?: string | number | null;
};

function normalizePhone(value?: string | null) {
  return String(value || "").replace(/[^\d+]/g, "").trim();
}

async function sendTelegramMessage(chatId: string | number, text: string) {
  if (!botToken) return { success: false, reason: "BOT_TOKEN topilmadi" };

  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text,
      }),
    });

    const data = await res.json();

    if (!res.ok || !data.ok) {
      return {
        success: false,
        reason: data?.description || "Telegram sendMessage xatosi",
      };
    }

    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      reason: error?.message || "Telegram fetch xatosi",
    };
  }
}

async function tryFindCustomerChatId(
  order: any,
  payload: UpdatePayload
): Promise<string | number | null> {
  if (payload.customer_chat_id) {
    return payload.customer_chat_id;
  }

  if (order?.telegram_id) {
    return order.telegram_id;
  }

  const phone = normalizePhone(order?.phone);
  if (!phone) return null;

  // 1) customers jadvali bo'lsa shu yerdan
  try {
    const { data } = await supabase
      .from("customers")
      .select("telegram_id, phone")
      .eq("phone", order.phone)
      .limit(1)
      .maybeSingle();

    if (data?.telegram_id) {
      return data.telegram_id;
    }
  } catch {
    // ignore
  }

  // 2) profiles jadvali bo'lsa shu yerdan
  try {
    const { data } = await supabase
      .from("profiles")
      .select("telegram_id, phone")
      .eq("phone", order.phone)
      .limit(1)
      .maybeSingle();

    if (data?.telegram_id) {
      return data.telegram_id;
    }
  } catch {
    // ignore
  }

  // 3) exact match bo'lmasa normalize qilib ko'rish
  try {
    const { data } = await supabase
      .from("customers")
      .select("telegram_id, phone")
      .limit(1000);

    const found = (data || []).find(
      (item: any) => normalizePhone(item.phone) === phone
    );

    if (found?.telegram_id) {
      return found.telegram_id;
    }
  } catch {
    // ignore
  }

  try {
    const { data } = await supabase
      .from("profiles")
      .select("telegram_id, phone")
      .limit(1000);

    const found = (data || []).find(
      (item: any) => normalizePhone(item.phone) === phone
    );

    if (found?.telegram_id) {
      return found.telegram_id;
    }
  } catch {
    // ignore
  }

  return null;
}

export async function POST(req: Request) {
  try {
    const body: UpdatePayload = await req.json();

    const {
      orderId,
      order_status,
      delivery_status,
      courier_name,
      courier_phone,
      pickup_point,
      delivery_note,
      notify_customer,
      customer_message,
    } = body;

    if (!orderId) {
      return NextResponse.json(
        { success: false, message: "orderId kerak" },
        { status: 400 }
      );
    }

    const updateData: Record<string, any> = {};

    if (order_status !== undefined) updateData.order_status = order_status;
    if (delivery_status !== undefined) updateData.delivery_status = delivery_status;
    if (courier_name !== undefined) updateData.courier_name = courier_name;
    if (courier_phone !== undefined) updateData.courier_phone = courier_phone;
    if (pickup_point !== undefined) updateData.pickup_point = pickup_point;
    if (delivery_note !== undefined) updateData.delivery_note = delivery_note;

    const { data: updatedOrder, error: updateError } = await supabase
      .from("orders")
      .update(updateData)
      .eq("id", orderId)
      .select("*")
      .single();

    if (updateError) {
      return NextResponse.json(
        { success: false, message: updateError.message },
        { status: 500 }
      );
    }

    let customerNotified = false;
    let customerNotifyReason: string | null = null;

    if (notify_customer && customer_message) {
      const chatId = await tryFindCustomerChatId(updatedOrder, body);

      if (chatId) {
        const telegramResult = await sendTelegramMessage(chatId, customer_message);

        if (telegramResult.success) {
          customerNotified = true;
        } else {
          customerNotifyReason = telegramResult.reason || "Telegram yuborilmadi";
        }
      } else {
        customerNotifyReason =
          "Mijozning telegram_id topilmadi. customers/profiles yoki order ichida yo‘q.";
      }
    }

    return NextResponse.json({
      success: true,
      order: updatedOrder,
      customerNotified,
      customerNotifyReason,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Status route xatosi",
      },
      { status: 500 }
    );
  }
}
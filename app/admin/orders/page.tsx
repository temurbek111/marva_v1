"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { formatPrice } from "@/lib/utils";

type OrderItemRow = {
  id?: number;
  order_id: number;
  product_id?: number | null;
  product_name?: string | null;
  quantity?: number | null;
  price?: number | null;
};

type OrderRow = {
  id: number;
  created_at?: string | null;
  user_id?: number | null;
  full_name?: string | null;
  phone?: string | null;
  address?: string | null;
  total_amount?: number | null;
  order_status?: string | null;
  delivery_status?: string | null;
  note?: string | null;

  courier_name?: string | null;
  courier_phone?: string | null;
  pickup_location?: string | null;
  delivery_note?: string | null;

  items?: OrderItemRow[];
};

type OrderDraft = {
  order_status: string;
  delivery_status: string;
  courier_name: string;
  courier_phone: string;
  pickup_location: string;
  delivery_note: string;
};

const ORDER_STATUSES = ["Yangi", "Jarayonda", "Tugallandi", "Bekor qilindi"];

const DELIVERY_STATUSES = [
  "Dastavka biriktirilmagan",
  "Kuryerga berildi",
  "Yetkazildi",
  "Bekor qilindi",
];

function createDraft(order: OrderRow): OrderDraft {
  return {
    order_status: order.order_status || "Yangi",
    delivery_status: order.delivery_status || "Dastavka biriktirilmagan",
    courier_name: order.courier_name || "",
    courier_phone: order.courier_phone || "",
    pickup_location: order.pickup_location || "",
    delivery_note: order.delivery_note || "",
  };
}

function formatDate(value?: string | null) {
  if (!value) return "-";

  try {
    return new Date(value).toLocaleString("uz-UZ");
  } catch {
    return value;
  }
}

function normalizeMoney(value?: number | null) {
  return formatPrice(Number(value || 0));
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [drafts, setDrafts] = useState<Record<number, OrderDraft>>({});
  const [loading, setLoading] = useState(true);
  const [savingOrderId, setSavingOrderId] = useState<number | null>(null);
  const [errorText, setErrorText] = useState("");

  const sortedOrders = useMemo(() => {
    return [...orders].sort((a, b) => {
      const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
      const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
      return bTime - aTime;
    });
  }, [orders]);

  async function loadOrders() {
    if (!supabase) {
      setErrorText("Supabase ulanmagan");
      setLoading(false);
      return;
    }

    setLoading(true);
    setErrorText("");

    try {
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (ordersError) {
        setErrorText(ordersError.message);
        setLoading(false);
        return;
      }

      const safeOrders = (ordersData || []) as OrderRow[];
      const orderIds = safeOrders.map((order) => order.id);

      let itemsByOrderId: Record<number, OrderItemRow[]> = {};

      if (orderIds.length > 0) {
        const { data: itemsData, error: itemsError } = await supabase
          .from("order_items")
          .select("*")
          .in("order_id", orderIds);

        if (itemsError) {
          console.error("Order items load error:", itemsError.message);
        } else {
          itemsByOrderId = ((itemsData || []) as OrderItemRow[]).reduce(
            (acc, item) => {
              if (!acc[item.order_id]) {
                acc[item.order_id] = [];
              }

              acc[item.order_id].push(item);
              return acc;
            },
            {} as Record<number, OrderItemRow[]>
          );
        }
      }

      const ordersWithItems = safeOrders.map((order) => ({
        ...order,
        items: itemsByOrderId[order.id] || [],
      }));

      setOrders(ordersWithItems);

      const nextDrafts = ordersWithItems.reduce((acc, order) => {
        acc[order.id] = createDraft(order);
        return acc;
      }, {} as Record<number, OrderDraft>);

      setDrafts(nextDrafts);
    } catch (error: any) {
      setErrorText(error?.message || "Buyurtmalarni yuklashda xato");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadOrders();
  }, []);

  function updateDraft(orderId: number, key: keyof OrderDraft, value: string) {
    setDrafts((current) => ({
      ...current,
      [orderId]: {
        ...current[orderId],
        [key]: value,
      },
    }));
  }

  async function updateOrderWithFallback(orderId: number, draft: OrderDraft) {
    if (!supabase) throw new Error("Supabase ulanmagan");

    const fullPayload = {
      order_status: draft.order_status,
      delivery_status: draft.delivery_status,
      courier_name: draft.courier_name.trim() || null,
      courier_phone: draft.courier_phone.trim() || null,
      pickup_location: draft.pickup_location.trim() || null,
      delivery_note: draft.delivery_note.trim() || null,
    };

    const { error } = await supabase
      .from("orders")
      .update(fullPayload)
      .eq("id", orderId);

    if (!error) return;

    const message = String(error.message || "");

    if (
      message.includes("courier_name") ||
      message.includes("courier_phone") ||
      message.includes("pickup_location") ||
      message.includes("delivery_note") ||
      message.includes("schema cache")
    ) {
      const fallbackPayload = {
        order_status: draft.order_status,
        delivery_status: draft.delivery_status,
      };

      const { error: fallbackError } = await supabase
        .from("orders")
        .update(fallbackPayload)
        .eq("id", orderId);

      if (fallbackError) {
        throw new Error(fallbackError.message);
      }

      return;
    }

    throw new Error(error.message);
  }

  async function saveOrder(orderId: number) {
    const draft = drafts[orderId];

    if (!draft) return;

    setSavingOrderId(orderId);
    setErrorText("");

    try {
      await updateOrderWithFallback(orderId, draft);
      await loadOrders();
      alert("Buyurtma saqlandi");
    } catch (error: any) {
      alert(error?.message || "Saqlashda xato");
    } finally {
      setSavingOrderId(null);
    }
  }

  async function giveToCourier(orderId: number) {
    const currentDraft = drafts[orderId];

    if (!currentDraft) return;

    const nextDraft = {
      ...currentDraft,
      delivery_status: "Kuryerga berildi",
    };

    setDrafts((current) => ({
      ...current,
      [orderId]: nextDraft,
    }));

    setSavingOrderId(orderId);

    try {
      await updateOrderWithFallback(orderId, nextDraft);
      await loadOrders();
    } catch (error: any) {
      alert(error?.message || "Kuryerga berishda xato");
    } finally {
      setSavingOrderId(null);
    }
  }

  async function markDelivered(orderId: number) {
    const currentDraft = drafts[orderId];

    if (!currentDraft) return;

    const nextDraft = {
      ...currentDraft,
      order_status: "Tugallandi",
      delivery_status: "Yetkazildi",
    };

    setDrafts((current) => ({
      ...current,
      [orderId]: nextDraft,
    }));

    setSavingOrderId(orderId);

    try {
      await updateOrderWithFallback(orderId, nextDraft);
      await loadOrders();
    } catch (error: any) {
      alert(error?.message || "Yetkazildi qilishda xato");
    } finally {
      setSavingOrderId(null);
    }
  }

  async function deleteOrder(orderId: number) {
    if (!supabase) {
      alert("Supabase ulanmagan");
      return;
    }

    const confirmed = confirm(`#${orderId} buyurtmani o‘chirishni xohlaysizmi?`);

    if (!confirmed) return;

    setSavingOrderId(orderId);

    try {
      const { error: itemsError } = await supabase
        .from("order_items")
        .delete()
        .eq("order_id", orderId);

      if (itemsError) {
        throw new Error(itemsError.message);
      }

      const { error: orderError } = await supabase
        .from("orders")
        .delete()
        .eq("id", orderId);

      if (orderError) {
        throw new Error(orderError.message);
      }

      setOrders((current) => current.filter((order) => order.id !== orderId));
    } catch (error: any) {
      alert(error?.message || "O‘chirishda xato");
    } finally {
      setSavingOrderId(null);
    }
  }

  return (
    <div className="min-h-screen bg-[#F3F6F5] px-4 py-6">
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="rounded-[28px] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-[#12332D]">
                Buyurtmalar
              </h1>
              <p className="mt-1 text-sm text-[#5D7E78]">
                Admin panel — buyurtmalarni boshqarish
              </p>
            </div>

            <button
              type="button"
              onClick={() => loadOrders()}
              disabled={loading}
              className="rounded-2xl bg-[#004F45] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
            >
              Yangilash
            </button>
          </div>
        </div>

        {errorText ? (
          <div className="rounded-[22px] border border-red-100 bg-red-50 p-4 text-sm text-red-700">
            {errorText}
          </div>
        ) : null}

        {loading ? (
          <div className="rounded-[28px] bg-white p-6 text-center text-sm text-[#5D7E78] shadow-sm">
            Yuklanmoqda...
          </div>
        ) : null}

        {!loading && sortedOrders.length === 0 ? (
          <div className="rounded-[28px] bg-white p-6 text-center text-sm text-[#5D7E78] shadow-sm">
            Buyurtmalar yo‘q
          </div>
        ) : null}

        {sortedOrders.map((order) => {
          const draft = drafts[order.id] || createDraft(order);
          const isSaving = savingOrderId === order.id;

          return (
            <div
              key={order.id}
              className="rounded-[28px] bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-[#12332D]">
                    #{order.id}
                  </h2>
                  <p className="mt-1 text-xs text-[#5D7E78]">
                    {formatDate(order.created_at)}
                  </p>
                </div>

                <div className="rounded-2xl bg-[#F3F6F5] px-4 py-2 text-right">
                  <p className="text-xs text-[#5D7E78]">Jami</p>
                  <p className="font-bold text-[#12332D]">
                    {normalizeMoney(order.total_amount)}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid gap-3 rounded-2xl bg-[#F8FBFA] p-4 text-sm text-[#12332D]">
                <div>
                  <p className="text-xs text-[#5D7E78]">Mijoz</p>
                  <p className="font-semibold">{order.full_name || "-"}</p>
                </div>

                <div>
                  <p className="text-xs text-[#5D7E78]">Telefon</p>
                  <p className="font-semibold">{order.phone || "-"}</p>
                </div>

                <div>
                  <p className="text-xs text-[#5D7E78]">Manzil</p>
                  <p className="font-semibold">{order.address || "-"}</p>
                </div>

                {order.note ? (
                  <div>
                    <p className="text-xs text-[#5D7E78]">Mijoz izohi</p>
                    <p className="font-semibold">{order.note}</p>
                  </div>
                ) : null}
              </div>

              <div className="mt-4 rounded-2xl bg-[#F8FBFA] p-4">
                <p className="mb-3 font-semibold text-[#12332D]">
                  Mahsulotlar
                </p>

                {order.items && order.items.length > 0 ? (
                  <div className="space-y-2">
                    {order.items.map((item, index) => (
                      <div
                        key={`${order.id}-${item.id || index}`}
                        className="rounded-xl bg-white p-3 text-sm text-[#12332D]"
                      >
                        <p className="font-semibold">
                          {index + 1}. {item.product_name || "Mahsulot"}
                        </p>
                        <p className="mt-1 text-xs text-[#5D7E78]">
                          {Number(item.quantity || 0)} dona x{" "}
                          {normalizeMoney(Number(item.price || 0))}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-[#5D7E78]">Mahsulotlar yo‘q</p>
                )}
              </div>

              <div className="mt-4 space-y-3">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#12332D]">
                    Buyurtma statusi
                  </label>
                  <select
                    value={draft.order_status}
                    onChange={(event) =>
                      updateDraft(
                        order.id,
                        "order_status",
                        event.target.value
                      )
                    }
                    className="w-full rounded-2xl border border-[#E3ECE9] bg-white px-4 py-4 outline-none"
                  >
                    {ORDER_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#12332D]">
                    Dostavka statusi
                  </label>
                  <select
                    value={draft.delivery_status}
                    onChange={(event) =>
                      updateDraft(
                        order.id,
                        "delivery_status",
                        event.target.value
                      )
                    }
                    className="w-full rounded-2xl border border-[#E3ECE9] bg-white px-4 py-4 outline-none"
                  >
                    {DELIVERY_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#12332D]">
                    Kuryer ismi
                  </label>
                  <input
                    value={draft.courier_name}
                    onChange={(event) =>
                      updateDraft(order.id, "courier_name", event.target.value)
                    }
                    placeholder="Masalan: Jasur"
                    className="w-full rounded-2xl border border-[#E3ECE9] bg-white px-4 py-4 outline-none"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#12332D]">
                    Kuryer telefoni
                  </label>
                  <input
                    value={draft.courier_phone}
                    onChange={(event) =>
                      updateDraft(order.id, "courier_phone", event.target.value)
                    }
                    placeholder="+998 90 123 45 67"
                    className="w-full rounded-2xl border border-[#E3ECE9] bg-white px-4 py-4 outline-none"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#12332D]">
                    Qayerdan olib ketadi
                  </label>
                  <input
                    value={draft.pickup_location}
                    onChange={(event) =>
                      updateDraft(
                        order.id,
                        "pickup_location",
                        event.target.value
                      )
                    }
                    placeholder="Masalan: MARVA ombori, Chilonzor"
                    className="w-full rounded-2xl border border-[#E3ECE9] bg-white px-4 py-4 outline-none"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#12332D]">
                    Dastavka izohi
                  </label>
                  <textarea
                    value={draft.delivery_note}
                    onChange={(event) =>
                      updateDraft(order.id, "delivery_note", event.target.value)
                    }
                    placeholder="Masalan: oldin telefon qilsin, 2-qavat"
                    rows={4}
                    className="w-full rounded-2xl border border-[#E3ECE9] bg-white px-4 py-4 outline-none"
                  />
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <button
                  type="button"
                  onClick={() => saveOrder(order.id)}
                  disabled={isSaving}
                  className="rounded-2xl bg-[#004F45] px-4 py-4 font-semibold text-white disabled:opacity-60"
                >
                  Saqlash
                </button>

                <button
                  type="button"
                  onClick={() => giveToCourier(order.id)}
                  disabled={isSaving}
                  className="rounded-2xl bg-[#006B5D] px-4 py-4 font-semibold text-white disabled:opacity-60"
                >
                  Kuryerga berish
                </button>

                <button
                  type="button"
                  onClick={() => markDelivered(order.id)}
                  disabled={isSaving}
                  className="rounded-2xl bg-[#16A34A] px-4 py-4 font-semibold text-white disabled:opacity-60"
                >
                  Yetkazildi
                </button>

                <button
                  type="button"
                  onClick={() => deleteOrder(order.id)}
                  disabled={isSaving}
                  className="rounded-2xl bg-[#DC2626] px-4 py-4 font-semibold text-white disabled:opacity-60"
                >
                  O‘chirish
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
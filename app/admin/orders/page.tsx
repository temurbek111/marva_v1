"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { Container } from "@/components/ui/Container";
import { supabase } from "@/lib/supabase";
import { formatPrice } from "@/lib/utils";

type OrderProductItem = {
  id: number;
  product_id: number | null;
  product_name: string;
  quantity: number;
  price: number;
};

type OrderItem = {
  id: number;
  full_name: string;
  phone: string;
  address: string;
  total_amount: number;
  order_status: string;
  delivery_status: string;
  courier_name: string | null;
  courier_phone: string | null;
  pickup_point: string | null;
  delivery_note: string | null;
  note: string | null;
  created_at: string;
  order_items?: OrderProductItem[];
};

type CourierDraft = {
  courier_name: string;
  courier_phone: string;
  pickup_point: string;
  delivery_note: string;
};

type OrderUpdatePayload = Partial<{
  order_status: string;
  delivery_status: string;
  courier_name: string;
  courier_phone: string;
  pickup_point: string;
  delivery_note: string;
}>;

function isMapLink(value?: string | null) {
  if (!value) return false;

  return (
    value.includes("yandex") ||
    value.includes("google") ||
    value.includes("maps")
  );
}

function getShortAddress(value?: string | null) {
  if (!value) return "Manzil yo‘q";

  if (isMapLink(value)) {
    return "📍 Xaritada ochish";
  }

  if (value.length > 42) {
    return `${value.slice(0, 42)}...`;
  }

  return value;
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingOrderId, setSendingOrderId] = useState<number | null>(null);
  const [deliveringOrderId, setDeliveringOrderId] = useState<number | null>(null);
  const [savingOrderId, setSavingOrderId] = useState<number | null>(null);
  const [courierDrafts, setCourierDrafts] = useState<Record<number, CourierDraft>>({});

  const buildDraftFromOrder = (order: OrderItem): CourierDraft => ({
    courier_name: order.courier_name || "",
    courier_phone: order.courier_phone || "",
    pickup_point: order.pickup_point || "",
    delivery_note: order.delivery_note || "",
  });

  const mergeOrdersWithItems = (
    ordersData: any[],
    itemsData: any[]
  ): OrderItem[] => {
    const itemsByOrderId = new Map<number, OrderProductItem[]>();

    (itemsData || []).forEach((item: any) => {
      const orderId = Number(item.order_id);

      if (!itemsByOrderId.has(orderId)) {
        itemsByOrderId.set(orderId, []);
      }

      itemsByOrderId.get(orderId)?.push({
        id: Number(item.id),
        product_id: item.product_id ? Number(item.product_id) : null,
        product_name: String(item.product_name || ""),
        quantity: Number(item.quantity || 0),
        price: Number(item.price || 0),
      });
    });

    return (ordersData || []).map((order: any) => ({
      ...order,
      id: Number(order.id),
      total_amount: Number(order.total_amount || 0),
      order_items: itemsByOrderId.get(Number(order.id)) || [],
    }));
  };

  const loadOrders = async () => {
    try {
      if (!supabase) {
        setOrders([]);
        setLoading(false);
        return;
      }

      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select("*")
        .order("id", { ascending: false });

      if (ordersError) {
        alert(ordersError.message || "Buyurtmalarni yuklashda xato");
        setOrders([]);
        setLoading(false);
        return;
      }

      const { data: itemsData, error: itemsError } = await supabase
        .from("order_items")
        .select("id, order_id, product_id, product_name, quantity, price");

      if (itemsError) {
        alert(itemsError.message || "Buyurtma mahsulotlarini yuklashda xato");
        setOrders((ordersData as OrderItem[]) || []);
        setLoading(false);
        return;
      }

      const mergedOrders = mergeOrdersWithItems(ordersData || [], itemsData || []);
      setOrders(mergedOrders);

      setCourierDrafts((prev) => {
        const nextDrafts: Record<number, CourierDraft> = { ...prev };

        mergedOrders.forEach((order) => {
          nextDrafts[order.id] = prev[order.id] || buildDraftFromOrder(order);
        });

        return nextDrafts;
      });

      setLoading(false);
    } catch (err: any) {
      alert(err?.message || "Kutilmagan xato yuz berdi");
      setOrders([]);
      setLoading(false);
    }
  };

  const updateOrderInDb = async (
    orderId: number,
    payload: OrderUpdatePayload
  ): Promise<OrderItem | false> => {
    try {
      if (!supabase) {
        alert("Supabase ulanmagan");
        return false;
      }

      const { data, error } = await supabase
        .from("orders")
        .update(payload)
        .eq("id", orderId)
        .select("*")
        .single();

      if (error || !data) {
        alert(error?.message || "Buyurtmani yangilab bo‘lmadi");
        return false;
      }

      return {
        ...(data as OrderItem),
        id: Number((data as any).id),
        total_amount: Number((data as any).total_amount || 0),
      };
    } catch (error: any) {
      alert(error?.message || "Buyurtmani yangilashda xato");
      return false;
    }
  };

  const applyOrderPatch = (orderId: number, payload: OrderUpdatePayload) => {
    setOrders((prev) =>
      prev.map((item) =>
        item.id === orderId
          ? {
              ...item,
              ...payload,
            }
          : item
      )
    );
  };

  const setCourierDraftField = (
    orderId: number,
    field: keyof CourierDraft,
    value: string
  ) => {
    setCourierDrafts((prev) => ({
      ...prev,
      [orderId]: {
        ...(prev[orderId] || {
          courier_name: "",
          courier_phone: "",
          pickup_point: "",
          delivery_note: "",
        }),
        [field]: value,
      },
    }));
  };

  const saveCourierDraft = async (orderId: number) => {
    const draft = courierDrafts[orderId];
    if (!draft) return true;

    setSavingOrderId(orderId);

    const updated = await updateOrderInDb(orderId, {
      courier_name: draft.courier_name.trim(),
      courier_phone: draft.courier_phone.trim(),
      pickup_point: draft.pickup_point.trim(),
      delivery_note: draft.delivery_note.trim(),
    });

    setSavingOrderId(null);

    if (!updated) return false;

    applyOrderPatch(orderId, {
      courier_name: draft.courier_name.trim(),
      courier_phone: draft.courier_phone.trim(),
      pickup_point: draft.pickup_point.trim(),
      delivery_note: draft.delivery_note.trim(),
    });

    return true;
  };

  const sendCourierTelegramMessage = async (
    order: OrderItem,
    draft: CourierDraft
  ) => {
    try {
      const res = await fetch("/api/telegram/courier", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId: order.id,
          fullName: order.full_name,
          phone: order.phone,
          address: order.address,
          pickupPoint: draft.pickup_point.trim(),
          courierName: draft.courier_name.trim(),
          courierPhone: draft.courier_phone.trim(),
          deliveryNote: draft.delivery_note.trim(),
          items: order.order_items || [],
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        alert(data.message || data.error?.description || "Telegramga yuborilmadi");
        return false;
      }

      return true;
    } catch {
      alert("Telegramga yuborishda xato");
      return false;
    }
  };

  const isCourierAlreadySent = (order: OrderItem) => {
    return ["Dastavkaga berildi", "Yo‘lda", "Yetkazib berdi"].includes(
      order.delivery_status
    );
  };

  const isDelivered = (order: OrderItem) => {
    return (
      order.order_status === "Yetkazildi" ||
      order.delivery_status === "Yetkazib berdi"
    );
  };

  const getDeliveryBadge = (status: string) => {
    if (status === "Dastavkaga berildi") {
      return {
        label: "Kuryerga yuborildi",
        className: "bg-blue-100 text-blue-700",
      };
    }

    if (status === "Yo‘lda") {
      return {
        label: "Yo‘lda",
        className: "bg-amber-100 text-amber-700",
      };
    }

    if (status === "Yetkazib berdi") {
      return {
        label: "Yetkazildi",
        className: "bg-green-100 text-green-700",
      };
    }

    if (status === "Yetkazib bera olmadi") {
      return {
        label: "Yetkazib bera olmadi",
        className: "bg-red-100 text-red-700",
      };
    }

    return null;
  };

  const getOrderBadge = (status: string) => {
    if (status === "Yangi") {
      return {
        label: "Yangi buyurtma",
        className: "bg-slate-100 text-slate-700",
      };
    }

    if (status === "Tasdiqlandi") {
      return {
        label: "Tasdiqlandi",
        className: "bg-cyan-100 text-cyan-700",
      };
    }

    if (status === "Tayyorlanmoqda") {
      return {
        label: "Tayyorlanmoqda",
        className: "bg-violet-100 text-violet-700",
      };
    }

    if (status === "Upakovka qilindi") {
      return {
        label: "Upakovka qilindi",
        className: "bg-fuchsia-100 text-fuchsia-700",
      };
    }

    if (status === "Kuryerga topshirildi") {
      return {
        label: "Kuryerga topshirildi",
        className: "bg-blue-100 text-blue-700",
      };
    }

    if (status === "Yetkazildi") {
      return {
        label: "Yetkazildi",
        className: "bg-green-100 text-green-700",
      };
    }

    if (status === "Bekor qilindi") {
      return {
        label: "Bekor qilindi",
        className: "bg-red-100 text-red-700",
      };
    }

    return null;
  };

  const assignToCourier = async (order: OrderItem) => {
    try {
      if (isCourierAlreadySent(order)) {
        alert("Bu buyurtma allaqachon kuryerga yuborilgan");
        return;
      }

      const draft = courierDrafts[order.id] || buildDraftFromOrder(order);

      const courierName = draft.courier_name.trim();
      const courierPhone = draft.courier_phone.trim();
      const pickupPoint = draft.pickup_point.trim();

      if (!courierName) {
        alert("Avval kuryer ismini kiriting");
        return;
      }

      if (!courierPhone) {
        alert("Avval kuryer telefonini kiriting");
        return;
      }

      if (!pickupPoint) {
        alert("Avval qayerdan olib ketishini kiriting");
        return;
      }

      setSendingOrderId(order.id);

      const saved = await saveCourierDraft(order.id);
      if (!saved) {
        setSendingOrderId(null);
        return;
      }

      const telegramSent = await sendCourierTelegramMessage(order, draft);
      if (!telegramSent) {
        setSendingOrderId(null);
        return;
      }

      const updated = await updateOrderInDb(order.id, {
        order_status: "Kuryerga topshirildi",
        delivery_status: "Dastavkaga berildi",
        courier_name: courierName,
        courier_phone: courierPhone,
        pickup_point: pickupPoint,
        delivery_note: draft.delivery_note.trim(),
      });

      if (!updated) {
        setSendingOrderId(null);
        return;
      }

      applyOrderPatch(order.id, {
        order_status: "Kuryerga topshirildi",
        delivery_status: "Dastavkaga berildi",
        courier_name: courierName,
        courier_phone: courierPhone,
        pickup_point: pickupPoint,
        delivery_note: draft.delivery_note.trim(),
      });
    } finally {
      setSendingOrderId(null);
    }
  };

  const markAsDelivered = async (order: OrderItem) => {
    if (isDelivered(order)) {
      alert("Bu buyurtma allaqachon yetkazilgan");
      return;
    }

    setDeliveringOrderId(order.id);

    const updated = await updateOrderInDb(order.id, {
      order_status: "Yetkazildi",
      delivery_status: "Yetkazib berdi",
    });

    setDeliveringOrderId(null);

    if (!updated) return;

    applyOrderPatch(order.id, {
      order_status: "Yetkazildi",
      delivery_status: "Yetkazib berdi",
    });
  };

  useEffect(() => {
    loadOrders();

    const interval = setInterval(() => {
      loadOrders();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#F7FAF9_0%,#EEF3F1_55%,#E8EFED_100%)] pb-28">
      <Header />

      <Container className="space-y-5 py-5">
        <div className="rounded-[28px] bg-white p-5 shadow-soft">
          <h1 className="text-2xl font-bold text-marva-900">Buyurtmalar</h1>
          <p className="mt-1 text-sm text-marva-700/70">
            Tushgan zakazlar va dostavka boshqaruvi
          </p>
        </div>

        {loading ? (
          <div className="rounded-[28px] bg-white p-5 shadow-soft">
            Yuklanmoqda...
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-[28px] bg-white p-5 shadow-soft">
            Hali buyurtma yo‘q
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const draft = courierDrafts[order.id] || {
                courier_name: "",
                courier_phone: "",
                pickup_point: "",
                delivery_note: "",
              };

              const isSending = sendingOrderId === order.id;
              const isDelivering = deliveringOrderId === order.id;
              const isSaving = savingOrderId === order.id;
              const courierAlreadySent = isCourierAlreadySent(order);
              const deliveredAlready = isDelivered(order);
              const deliveryBadge = getDeliveryBadge(order.delivery_status);
              const orderBadge = getOrderBadge(order.order_status);

              return (
                <div
                  key={order.id}
                  className="rounded-[24px] bg-white p-5 shadow-soft"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-lg font-bold text-marva-900">
                        #{order.id} — {order.full_name}
                      </p>

                      <p className="mt-1 text-sm text-marva-700/80">
                        {order.phone}
                      </p>

                      <div className="mt-2">
                        {order.address ? (
                          isMapLink(order.address) ? (
                            <a
                              href={order.address}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex rounded-full bg-marva-50 px-3 py-2 text-xs font-semibold text-marva-700 ring-1 ring-black/5"
                            >
                              {getShortAddress(order.address)}
                            </a>
                          ) : (
                            <p className="max-w-full truncate text-sm text-marva-700/80">
                              {getShortAddress(order.address)}
                            </p>
                          )
                        ) : (
                          <p className="text-sm text-marva-700/60">
                            Manzil yo‘q
                          </p>
                        )}
                      </div>

                      {order.note ? (
                        <p className="mt-2 line-clamp-2 text-sm text-marva-700/80">
                          Mijoz izohi: {order.note}
                        </p>
                      ) : null}
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="text-xl font-bold text-marva-900">
                        {formatPrice(order.total_amount)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {orderBadge ? (
                      <div
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${orderBadge.className}`}
                      >
                        {orderBadge.label}
                      </div>
                    ) : null}

                    {deliveryBadge ? (
                      <div
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${deliveryBadge.className}`}
                      >
                        {deliveryBadge.label}
                      </div>
                    ) : null}
                  </div>

                  <div className="mt-4 rounded-[20px] bg-marva-50 p-4">
                    <p className="text-sm font-semibold text-marva-900">
                      Buyurtma mahsulotlari
                    </p>

                    {!order.order_items || order.order_items.length === 0 ? (
                      <p className="mt-2 text-sm text-marva-700/70">
                        Mahsulotlar topilmadi
                      </p>
                    ) : (
                      <div className="mt-3 space-y-2">
                        {order.order_items.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-start justify-between gap-3 rounded-2xl bg-white px-4 py-3"
                          >
                            <div>
                              <p className="text-sm font-semibold text-marva-900">
                                {item.product_name}
                              </p>
                              <p className="mt-1 text-xs text-marva-700/70">
                                Soni: {item.quantity}
                              </p>
                            </div>

                            <div className="text-right">
                              <p className="text-sm font-semibold text-marva-900">
                                {formatPrice(item.price)}
                              </p>
                              <p className="mt-1 text-xs text-marva-700/70">
                                Jami: {formatPrice(item.price * item.quantity)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 grid gap-3">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-marva-900">
                        Buyurtma statusi
                      </label>
                      <select
                        value={order.order_status}
                        onChange={async (e) => {
                          const value = e.target.value;

                          const updated = await updateOrderInDb(order.id, {
                            order_status: value,
                          });

                          if (!updated) return;

                          applyOrderPatch(order.id, {
                            order_status: value,
                          });
                        }}
                        className="w-full rounded-2xl border border-marva-100 px-4 py-3 outline-none"
                      >
                        <option value="Yangi">Yangi</option>
                        <option value="Tasdiqlandi">Tasdiqlandi</option>
                        <option value="Tayyorlanmoqda">Tayyorlanmoqda</option>
                        <option value="Upakovka qilindi">Upakovka qilindi</option>
                        <option value="Kuryerga topshirildi">Kuryerga topshirildi</option>
                        <option value="Yetkazildi">Yetkazildi</option>
                        <option value="Bekor qilindi">Bekor qilindi</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-marva-900">
                        Dostavka statusi
                      </label>
                      <select
                        value={order.delivery_status}
                        onChange={async (e) => {
                          const value = e.target.value;

                          const updated = await updateOrderInDb(order.id, {
                            delivery_status: value,
                          });

                          if (!updated) return;

                          applyOrderPatch(order.id, {
                            delivery_status: value,
                          });
                        }}
                        className="w-full rounded-2xl border border-marva-100 px-4 py-3 outline-none"
                      >
                        <option value="Dastavka biriktirilmagan">
                          Dastavka biriktirilmagan
                        </option>
                        <option value="Dastavkaga berildi">Dastavkaga berildi</option>
                        <option value="Yo‘lda">Yo‘lda</option>
                        <option value="Yetkazib berdi">Yetkazib berdi</option>
                        <option value="Yetkazib bera olmadi">
                          Yetkazib bera olmadi
                        </option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-marva-900">
                        Kuryer ismi
                      </label>
                      <input
                        value={draft.courier_name}
                        onChange={(e) =>
                          setCourierDraftField(order.id, "courier_name", e.target.value)
                        }
                        onBlur={() => saveCourierDraft(order.id)}
                        placeholder="Masalan: Jasur"
                        disabled={courierAlreadySent || deliveredAlready || isSaving}
                        className="w-full rounded-2xl border border-marva-100 px-4 py-3 outline-none disabled:bg-slate-50 disabled:text-slate-400"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-marva-900">
                        Kuryer telefoni
                      </label>
                      <input
                        value={draft.courier_phone}
                        onChange={(e) =>
                          setCourierDraftField(order.id, "courier_phone", e.target.value)
                        }
                        onBlur={() => saveCourierDraft(order.id)}
                        placeholder="+998 90 123 45 67"
                        disabled={courierAlreadySent || deliveredAlready || isSaving}
                        className="w-full rounded-2xl border border-marva-100 px-4 py-3 outline-none disabled:bg-slate-50 disabled:text-slate-400"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-marva-900">
                        Qayerdan olib ketadi
                      </label>
                      <input
                        value={draft.pickup_point}
                        onChange={(e) =>
                          setCourierDraftField(order.id, "pickup_point", e.target.value)
                        }
                        onBlur={() => saveCourierDraft(order.id)}
                        placeholder="Masalan: MARVA ombori, Chilonzor"
                        disabled={courierAlreadySent || deliveredAlready || isSaving}
                        className="w-full rounded-2xl border border-marva-100 px-4 py-3 outline-none disabled:bg-slate-50 disabled:text-slate-400"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-marva-900">
                        Dastavka izohi
                      </label>
                      <textarea
                        value={draft.delivery_note}
                        onChange={(e) =>
                          setCourierDraftField(order.id, "delivery_note", e.target.value)
                        }
                        onBlur={() => saveCourierDraft(order.id)}
                        placeholder="Masalan: oldin telefon qilsin, 2-qavat, klinika kirish eshigi yonida"
                        rows={3}
                        disabled={courierAlreadySent || deliveredAlready || isSaving}
                        className="w-full rounded-2xl border border-marva-100 px-4 py-3 outline-none disabled:bg-slate-50 disabled:text-slate-400"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => assignToCourier(order)}
                        disabled={
                          isSending || isDelivering || courierAlreadySent || deliveredAlready
                        }
                        className="rounded-2xl bg-marva-700 px-4 py-3 font-semibold text-white disabled:opacity-50"
                      >
                        {isSending
                          ? "Yuborilmoqda..."
                          : courierAlreadySent
                          ? "Yuborildi"
                          : deliveredAlready
                          ? "Yetkazilgan"
                          : "Kuryerga berish"}
                      </button>

                      <button
                        type="button"
                        onClick={() => markAsDelivered(order)}
                        disabled={isSending || isDelivering || deliveredAlready}
                        className="rounded-2xl bg-green-600 px-4 py-3 font-semibold text-white disabled:opacity-50"
                      >
                        {isDelivering
                          ? "Saqlanmoqda..."
                          : deliveredAlready
                          ? "Yetkazilgan"
                          : "Yetkazildi"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Container>

      <BottomNav />
    </div>
  );
}
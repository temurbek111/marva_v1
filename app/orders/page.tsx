"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { Container } from "@/components/ui/Container";
import {
  Package,
  ShoppingBag,
  Clock3,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type SavedUser = {
  id?: number | string;
  phone?: string;
  telegramId?: number | string | null;
};

type OrderItem = {
  id?: string | number;
  name: string;
  price: number;
  quantity: number;
  image?: string;
};

type UiOrder = {
  id: string;
  createdAt: string;
  status?: string | null;
  total: number;
  items: OrderItem[];
  address?: string;
  paymentMethod?: string;
  phone?: string | null;
};

type DbOrderRow = {
  id: number;
  created_at: string;
  total_amount: number | null;
  address: string | null;
  order_status: string | null;
  delivery_status: string | null;
  phone: string | null;
};

type DbOrderItemRow = {
  order_id: number;
  product_id: number | null;
  product_name: string | null;
  quantity: number | null;
  price: number | null;
};

type DbProductRow = {
  id: number;
  image_url: string | null;
  images: unknown;
};

function getStatusLabel(status?: string | null) {
  const normalized = String(status || "").toLowerCase();

  if (normalized.includes("processing") || normalized.includes("jarayon")) {
    return {
      text: "Jarayonda",
      className: "bg-[#FFF4E5] text-[#D9822B]",
    };
  }

  if (normalized.includes("delivered") || normalized.includes("yetkaz")) {
    return {
      text: "Yetkazilgan",
      className: "bg-[#ECF8F3] text-[#0A7A5A]",
    };
  }

  if (normalized.includes("cancel") || normalized.includes("bekor")) {
    return {
      text: "Bekor qilingan",
      className: "bg-[#FDECEC] text-[#D94B4B]",
    };
  }

  if (normalized.includes("accept") || normalized.includes("qabul")) {
    return {
      text: "Qabul qilindi",
      className: "bg-[#EEF4FF] text-[#2563EB]",
    };
  }

  return {
    text: "Qabul qilindi",
    className: "bg-[#EEF4FF] text-[#2563EB]",
  };
}

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

  if (value.length > 40) {
    return `${value.slice(0, 40)}...`;
  }

  return value;
}

function getProductImage(product?: DbProductRow) {
  if (!product) return "";

  if (product.image_url && product.image_url.trim()) {
    return product.image_url;
  }

  if (Array.isArray(product.images)) {
    const firstImage = product.images.find(
      (value): value is string =>
        typeof value === "string" && value.trim().length > 0
    );

    if (firstImage) {
      return firstImage;
    }
  }

  return "";
}

export default function OrdersPage() {
  const router = useRouter();

  const [orders, setOrders] = useState<UiOrder[]>([]);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);

  const goBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }

    router.push("/profile");
  };

  useEffect(() => {
    let cancelled = false;

    async function loadOrders() {
      setMounted(true);

      try {
        const savedUser = localStorage.getItem("marva-user");

        if (!savedUser) {
          if (!cancelled) {
            setOrders([]);
          }
          return;
        }

        const parsedUser = JSON.parse(savedUser) as SavedUser;

        if (!parsedUser?.id) {
          if (!cancelled) {
            setOrders([]);
          }
          return;
        }

        const userId = Number(parsedUser.id);

        if (!Number.isFinite(userId)) {
          if (!cancelled) {
            setOrders([]);
          }
          return;
        }

        const { data: orderRows, error: ordersError } = await supabase
          .from("orders")
          .select(
            "id, created_at, total_amount, address, order_status, delivery_status, phone"
          )
          .eq("user_id", userId)
          .order("created_at", { ascending: false });

        if (ordersError) {
          throw ordersError;
        }

        const safeOrders = (orderRows ?? []) as DbOrderRow[];

        if (!safeOrders.length) {
          if (!cancelled) {
            setOrders([]);
          }
          return;
        }

        const orderIds = safeOrders.map((order) => order.id);

        const { data: orderItemRows, error: itemsError } = await supabase
          .from("order_items")
          .select("order_id, product_id, product_name, quantity, price")
          .in("order_id", orderIds);

        if (itemsError) {
          throw itemsError;
        }

        const safeItems = (orderItemRows ?? []) as DbOrderItemRow[];

        const productIds = Array.from(
          new Set(
            safeItems
              .map((item) => item.product_id)
              .filter((id): id is number => typeof id === "number")
          )
        );

        let productsById = new Map<number, DbProductRow>();

        if (productIds.length > 0) {
          const { data: productRows, error: productsError } = await supabase
            .from("products")
            .select("id, image_url, images")
            .in("id", productIds);

          if (productsError) {
            throw productsError;
          }

          const safeProducts = (productRows ?? []) as DbProductRow[];

          productsById = new Map(
            safeProducts.map((product) => [product.id, product])
          );
        }

        const itemsByOrderId = new Map<number, OrderItem[]>();

        for (const item of safeItems) {
          const linkedProduct =
            item.product_id != null ? productsById.get(item.product_id) : undefined;

          const mappedItem: OrderItem = {
            id: item.product_id ?? `${item.order_id}-${item.product_name ?? "item"}`,
            name: item.product_name || "Nomsiz mahsulot",
            price: Number(item.price || 0),
            quantity: Number(item.quantity || 0),
            image: getProductImage(linkedProduct),
          };

          const currentItems = itemsByOrderId.get(item.order_id) ?? [];
          currentItems.push(mappedItem);
          itemsByOrderId.set(item.order_id, currentItems);
        }

        const mappedOrders: UiOrder[] = safeOrders.map((order) => ({
          id: String(order.id),
          createdAt: order.created_at,
          status: order.order_status,
          total: Number(order.total_amount || 0),
          items: itemsByOrderId.get(order.id) ?? [],
          address: order.address || undefined,
          paymentMethod: undefined,
          phone: order.phone,
        }));

        if (!cancelled) {
          setOrders(mappedOrders);
        }
      } catch (error) {
        console.error("Orders fetch error:", error);

        if (!cancelled) {
          setOrders([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadOrders();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-[100dvh] bg-[#F3F6F5] pb-28">
      <Header />

      <Container className="space-y-4 py-4 pb-32">
        <button
          type="button"
          onClick={goBack}
          className="inline-flex h-11 items-center gap-2 rounded-full bg-white px-4 text-sm font-semibold text-[#12332D] shadow-[0_10px_30px_rgba(15,23,42,0.05)] ring-1 ring-black/5 active:scale-[0.98]"
        >
          <ChevronLeft size={18} />
          Ortga
        </button>

        {!mounted || loading ? (
          <div className="rounded-[28px] bg-white p-5 text-center text-sm text-[#6B7280] shadow-[0_10px_30px_rgba(15,23,42,0.05)] ring-1 ring-black/5">
            Yuklanmoqda...
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-[32px] bg-white px-5 py-10 text-center shadow-[0_10px_30px_rgba(15,23,42,0.05)] ring-1 ring-black/5">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#F4F7F6] text-[#12332D]">
              <ShoppingBag size={34} />
            </div>

            <h2 className="mt-5 text-[24px] font-bold text-[#12332D]">
              Buyurtmalar yo‘q
            </h2>

            <p className="mt-2 text-sm leading-6 text-[#6B8A84]">
              Hozircha sizda buyurtma yo‘q. Mahsulot tanlab, buyurtma
              berishingiz mumkin.
            </p>

            <button
              onClick={() => router.push("/catalog")}
              className="mt-6 rounded-full bg-[#004F45] px-6 py-3 text-sm font-semibold text-white shadow-[0_14px_28px_rgba(0,79,69,0.22)]"
            >
              Katalogga o‘tish
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-[28px] bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.05)] ring-1 ring-black/5">
              <div className="text-[14px] font-extrabold uppercase tracking-[0.08em] text-[#4B5563]">
                Buyurtmalarim
              </div>
              <div className="mt-2 text-[28px] font-bold leading-none text-[#12332D]">
                {orders.length} ta
              </div>
              <div className="mt-2 text-sm text-[#6B8A84]">
                Faqat sizga tegishli buyurtmalar ko‘rinadi
              </div>
            </div>

            {orders.map((order) => {
              const status = getStatusLabel(order.status);

              return (
                <div
                  key={order.id}
                  className="rounded-[28px] bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.05)] ring-1 ring-black/5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-[0.08em] text-[#6B8A84]">
                        Buyurtma raqami
                      </div>
                      <div className="mt-1 text-[20px] font-bold text-[#12332D]">
                        #{order.id}
                      </div>
                    </div>

                    <span
                      className={`rounded-full px-3 py-2 text-xs font-semibold ${status.className}`}
                    >
                      {status.text}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-[20px] bg-[#F7FAF9] p-3">
                      <div className="flex items-center gap-2 text-[#6B8A84]">
                        <Clock3 size={16} />
                        <span className="text-xs font-medium">Sana</span>
                      </div>
                      <div className="mt-2 text-sm font-semibold text-[#12332D]">
                        {new Date(order.createdAt).toLocaleString()}
                      </div>
                    </div>

                    <div className="rounded-[20px] bg-[#F7FAF9] p-3">
                      <div className="flex items-center gap-2 text-[#6B8A84]">
                        <Package size={16} />
                        <span className="text-xs font-medium">Jami</span>
                      </div>
                      <div className="mt-2 text-sm font-semibold text-[#12332D]">
                        ${order.total}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 rounded-[22px] bg-[#F7FAF9] p-3">
                    <div className="text-xs font-semibold uppercase tracking-[0.08em] text-[#6B8A84]">
                      Mahsulotlar
                    </div>

                    <div className="mt-3 space-y-3">
                      {order.items?.map((item, index) => (
                        <div
                          key={`${order.id}-${index}`}
                          className="flex items-center gap-3"
                        >
                          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-[16px] bg-white ring-1 ring-black/5">
                            {item.image ? (
                              <img
                                src={item.image}
                                alt={item.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <span className="text-xs font-bold text-[#004F45]">
                                MARVA
                              </span>
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="line-clamp-2 text-sm font-semibold text-[#12332D]">
                              {item.name}
                            </div>
                            <div className="mt-1 text-xs text-[#6B8A84]">
                              {item.quantity} dona × ${item.price}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {order.address ? (
                    <div className="mt-4 space-y-3 text-sm text-[#5D7E78]">
                      <div className="rounded-[20px] bg-[#F7FAF9] p-3">
                        <div className="text-xs font-semibold uppercase tracking-[0.08em] text-[#6B8A84]">
                          Manzil
                        </div>

                        {isMapLink(order.address) ? (
                          <a
                            href={order.address}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2 inline-flex rounded-full bg-white px-3 py-2 text-xs font-semibold text-[#004F45] ring-1 ring-black/5"
                          >
                            {getShortAddress(order.address)}
                          </a>
                        ) : (
                          <p className="mt-2 line-clamp-2 text-sm font-medium text-[#12332D]">
                            {getShortAddress(order.address)}
                          </p>
                        )}
                      </div>
                    </div>
                  ) : null}

                  <button
                    onClick={() => router.push("/catalog")}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-full border border-[#DCE7E4] bg-white px-4 py-3 text-sm font-semibold text-[#12332D]"
                  >
                    Yana buyurtma qilish
                    <ChevronRight size={18} />
                  </button>
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
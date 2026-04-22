"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { Container } from "@/components/ui/Container";
import { Package, ShoppingBag, Clock3, ChevronRight } from "lucide-react";

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

type SavedOrder = {
  id: string;
  createdAt: string;
  status?: "new" | "processing" | "delivered" | "cancelled";
  total: number;
  items: OrderItem[];
  address?: string;
  paymentMethod?: string;
  userKey?: string;
  telegramId?: string | number | null;
  phone?: string;
};

function getCurrentUserKey(user: SavedUser | null) {
  if (!user) return "guest";

  if (user.telegramId) return `tg:${user.telegramId}`;
  if (user.phone) return `phone:${user.phone}`;
  if (user.id) return `id:${user.id}`;

  return "guest";
}

function orderBelongsToUser(order: SavedOrder, user: SavedUser | null) {
  if (!user) return false;

  const currentUserKey = getCurrentUserKey(user);

  if (order.userKey) {
    return order.userKey === currentUserKey;
  }

  if (user.telegramId && order.telegramId) {
    return String(order.telegramId) === String(user.telegramId);
  }

  if (user.phone && order.phone) {
    return String(order.phone) === String(user.phone);
  }

  return false;
}

function getStatusLabel(status?: SavedOrder["status"]) {
  if (status === "processing") {
    return {
      text: "Jarayonda",
      className: "bg-[#FFF4E5] text-[#D9822B]",
    };
  }

  if (status === "delivered") {
    return {
      text: "Yetkazilgan",
      className: "bg-[#ECF8F3] text-[#0A7A5A]",
    };
  }

  if (status === "cancelled") {
    return {
      text: "Bekor qilingan",
      className: "bg-[#FDECEC] text-[#D94B4B]",
    };
  }

  return {
    text: "Qabul qilindi",
    className: "bg-[#EEF4FF] text-[#2563EB]",
  };
}

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<SavedOrder[]>([]);
  const [currentUser, setCurrentUser] = useState<SavedUser | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    try {
      const savedUser = localStorage.getItem("marva-user");
      const savedOrders = localStorage.getItem("marva-orders");

      if (savedUser) {
        setCurrentUser(JSON.parse(savedUser));
      }

      if (savedOrders) {
        const parsedOrders = JSON.parse(savedOrders);
        if (Array.isArray(parsedOrders)) {
          setOrders(parsedOrders);
        }
      }
    } catch (error) {
      console.error("Orders parse error:", error);
    }
  }, []);

  const filteredOrders = useMemo(() => {
    return orders
      .filter((order) => orderBelongsToUser(order, currentUser))
      .sort((a, b) => {
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      });
  }, [orders, currentUser]);

  return (
    <div className="min-h-screen bg-[#F3F6F5] pb-28">
      <Header />

      <Container className="py-4">
        {!mounted ? (
          <div className="rounded-[28px] bg-white p-5 text-center text-sm text-[#6B7280] shadow-[0_10px_30px_rgba(15,23,42,0.05)] ring-1 ring-black/5">
            Yuklanmoqda...
          </div>
        ) : filteredOrders.length === 0 ? (
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
                {filteredOrders.length} ta
              </div>
              <div className="mt-2 text-sm text-[#6B8A84]">
                Faqat sizga tegishli buyurtmalar ko‘rinadi
              </div>
            </div>

            {filteredOrders.map((order) => {
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

                  {(order.address || order.paymentMethod) && (
                    <div className="mt-4 space-y-2 text-sm text-[#5D7E78]">
                      {order.address ? (
                        <div>
                          <span className="font-semibold text-[#12332D]">
                            Manzil:
                          </span>{" "}
                          {order.address}
                        </div>
                      ) : null}

                      {order.paymentMethod ? (
                        <div>
                          <span className="font-semibold text-[#12332D]">
                            To‘lov:
                          </span>{" "}
                          {order.paymentMethod}
                        </div>
                      ) : null}
                    </div>
                  )}

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
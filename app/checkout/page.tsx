"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { useCartStore } from "@/lib/store";
import { formatPrice } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { BottomNav } from "@/components/layout/BottomNav";
import DeliveryLocationField from "@/components/DeliveryLocationField";

type SavedUser = {
  id?: number;
  fullName: string;
  phone: string;
  address: string;
  telegramUsername?: string;
  telegramId?: string | number | null;
};

type LocalOrderItem = {
  id?: string | number;
  name: string;
  price: number;
  quantity: number;
  image?: string;
};

type LocalSavedOrder = {
  id: string;
  createdAt: string;
  status: "new" | "processing" | "delivered" | "cancelled";
  total: number;
  items: LocalOrderItem[];
  address?: string;
  paymentMethod?: string;
  userKey: string;
  telegramId?: string | number | null;
  phone?: string;
};

function getOrderUserKey(user: SavedUser) {
  if (user.telegramId) return `tg:${user.telegramId}`;
  if (user.phone) return `phone:${user.phone}`;
  if (user.id) return `id:${user.id}`;
  return "guest";
}

function saveOrderToLocalStorage(order: LocalSavedOrder) {
  try {
    const saved = localStorage.getItem("marva-orders");
    const parsed = saved ? JSON.parse(saved) : [];
    const currentOrders = Array.isArray(parsed) ? parsed : [];

    localStorage.setItem(
      "marva-orders",
      JSON.stringify([order, ...currentOrders])
    );
  } catch (error) {
    console.error("Order localStorage save error:", error);
  }
}

function getCoordinatesFromYandexLink(address: string) {
  const ptMatch = address.match(/pt=([\d.-]+),([\d.-]+)/);

  if (!ptMatch) {
    return {
      latitude: null,
      longitude: null,
    };
  }

  return {
    longitude: Number(ptMatch[1]),
    latitude: Number(ptMatch[2]),
  };
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, clear } = useCartStore();

  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingUser, setCheckingUser] = useState(true);

  const [savedUser, setSavedUser] = useState<SavedUser | null>(null);
  const [address, setAddress] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [note, setNote] = useState("");

  const total = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  useEffect(() => {
    const saved = localStorage.getItem("marva-user");

    if (!saved) {
      router.push("/auth");
      return;
    }

    try {
      const user: SavedUser = JSON.parse(saved);

      if (!user.fullName || !user.phone) {
        router.push("/auth");
        return;
      }

      setSavedUser(user);
      setAddress(user.address || "");

      if (user.address) {
        const coords = getCoordinatesFromYandexLink(user.address);
        setLatitude(coords.latitude);
        setLongitude(coords.longitude);
      }

      setCheckingUser(false);
    } catch {
      router.push("/auth");
    }
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!savedUser) {
      router.push("/auth");
      return;
    }

    if (!items.length) {
      alert("Savatcha bo'sh");
      return;
    }

    if (!address.trim()) {
      alert("Manzilni kiriting yoki lokatsiyani yuboring");
      return;
    }

    if (!supabase) {
      alert("Supabase ulanmagan");
      return;
    }

    setLoading(true);

    try {
      const userId = savedUser.id ?? null;
      const finalAddress = address.trim();

      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: userId,
          full_name: savedUser.fullName,
          phone: savedUser.phone,
          address: finalAddress,
          total_amount: total,
          order_status: "Yangi",
          delivery_status: "Dastavka biriktirilmagan",
          note,
        })
        .select()
        .single();

      if (orderError) {
        alert(orderError.message);
        setLoading(false);
        return;
      }

      const orderItems = items.map((item) => ({
        order_id: order.id,
        product_id: Number(item.product.id),
        product_name: item.product.name,
        quantity: item.quantity,
        price: item.product.price,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) {
        alert(itemsError.message);
        setLoading(false);
        return;
      }

      try {
        await fetch("/api/orders", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            orderId: order.id,
            fullName: savedUser.fullName,
            phone: savedUser.phone,
            address: finalAddress,
            note,
            totalAmount: formatPrice(total),
            items: orderItems,
          }),
        });
      } catch (error) {
        console.error("Admin telegramga yuborishda xato:", error);
      }

      const localOrder: LocalSavedOrder = {
        id: String(order.id),
        createdAt: new Date().toISOString(),
        status: "new",
        total,
        address: finalAddress,
        paymentMethod: "Operator bilan tasdiqlanadi",
        userKey: getOrderUserKey(savedUser),
        telegramId: savedUser.telegramId ?? null,
        phone: savedUser.phone,
        items: items.map((item) => ({
          id: item.product.id,
          name: item.product.name,
          price: item.product.price,
          quantity: item.quantity,
          image: item.product.image || "",
        })),
      };

      saveOrderToLocalStorage(localOrder);

      clear();
      setDone(true);
    } catch (error) {
      alert("Buyurtma yuborishda xato chiqdi");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  if (checkingUser) {
    return (
      <>
        <Container className="py-5 pb-28">
          <div className="rounded-[28px] bg-white p-5 shadow-soft">
            Yuklanmoqda...
          </div>
        </Container>
        <BottomNav />
      </>
    );
  }

  if (!savedUser) return null;

  return (
    <>
      <Container className="py-5 pb-28">
        <div className="rounded-[28px] bg-white p-5 shadow-soft">
          <h1 className="text-2xl font-bold text-marva-900">Checkout</h1>
          <p className="mt-1 text-sm text-marva-700/70">
            Buyurtma profilingiz asosida yuboriladi. Manzilni tasdiqlang yoki
            kartadan lokatsiyangizni tanlang.
          </p>
        </div>

        {done ? (
          <div className="mt-5 rounded-[28px] bg-white p-6 shadow-soft">
            <h2 className="text-xl font-bold text-marva-900">
              Buyurtma qabul qilindi
            </h2>
            <p className="mt-2 text-sm text-marva-700/75">
              Operator siz bilan tez orada bog'lanadi.
            </p>
            <button
              onClick={() => router.push("/")}
              className="mt-4 rounded-2xl bg-marva-700 px-5 py-3 font-semibold text-white"
            >
              Bosh sahifaga qaytish
            </button>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="mt-5 space-y-4 rounded-[28px] bg-white p-5 pb-36 shadow-soft"
          >
            <div className="rounded-2xl bg-marva-50 p-4">
              <p className="text-xs text-marva-700/70">Mijoz</p>
              <p className="mt-1 font-semibold text-marva-900">
                {savedUser.fullName}
              </p>
            </div>

            <div className="rounded-2xl bg-marva-50 p-4">
              <p className="text-xs text-marva-700/70">Telefon</p>
              <p className="mt-1 font-semibold text-marva-900">
                {savedUser.phone}
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-marva-900">
                Yetkazib berish manzili
              </label>

              <DeliveryLocationField
                address={address}
                setAddress={setAddress}
                latitude={latitude}
                setLatitude={setLatitude}
                longitude={longitude}
                setLongitude={setLongitude}
              />
            </div>

            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Izoh"
              rows={4}
              className="w-full rounded-2xl border border-marva-100 px-4 py-4 outline-none"
            />

            <div className="rounded-2xl bg-marva-50 p-4">
              <p className="text-sm text-marva-700/70">Jami summa</p>
              <p className="mt-1 text-2xl font-bold text-marva-900">
                {formatPrice(total)}
              </p>
            </div>

            <div className="fixed bottom-24 left-1/2 z-50 w-full max-w-md -translate-x-1/2 px-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-[20px] bg-marva-700 px-4 py-4 font-semibold text-white shadow-lg disabled:opacity-60"
              >
                {loading ? "Yuborilmoqda..." : "Buyurtmani yuborish"}
              </button>
            </div>
          </form>
        )}
      </Container>

      <BottomNav />
    </>
  );
}
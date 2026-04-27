"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { useCartStore } from "@/lib/store";
import { formatPrice } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { BottomNav } from "@/components/layout/BottomNav";

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

type AddressParts = {
  viloyat: string;
  tuman: string;
  street: string;
  houseNumber: string;
};

const VILOYATLAR = [
  "Toshkent shahri",
  "Toshkent viloyati",
  "Andijon viloyati",
  "Buxoro viloyati",
  "Farg‘ona viloyati",
  "Jizzax viloyati",
  "Xorazm viloyati",
  "Namangan viloyati",
  "Navoiy viloyati",
  "Qashqadaryo viloyati",
  "Qoraqalpog‘iston Respublikasi",
  "Samarqand viloyati",
  "Sirdaryo viloyati",
  "Surxondaryo viloyati",
] as const;

const TUMANLAR_BY_VILOYAT: Record<string, string[]> = {
  "Toshkent shahri": [
    "Bektemir",
    "Chilonzor",
    "Mirobod",
    "Mirzo Ulug‘bek",
    "Olmazor",
    "Sergeli",
    "Shayxontohur",
    "Uchtepa",
    "Yakkasaroy",
    "Yashnobod",
    "Yunusobod",
    "Yangi Hayot",
  ],
  "Toshkent viloyati": [
    "Angren shahri",
    "Bekobod",
    "Bekobod shahri",
    "Bo‘ka",
    "Bo‘stonliq",
    "Chinoz",
    "Chirchiq shahri",
    "Ohangaron",
    "Ohangaron shahri",
    "Oqqo‘rg‘on",
    "Olmaliq shahri",
    "Parkent",
    "Piskent",
    "Qibray",
    "Quyi Chirchiq",
    "Toshkent",
    "Yangiyo‘l",
    "Yangiyo‘l shahri",
    "Yuqori Chirchiq",
    "Zangiota",
    "O‘rta Chirchiq",
  ],
  "Andijon viloyati": [
    "Andijon shahri",
    "Andijon",
    "Asaka",
    "Baliqchi",
    "Bo‘ston",
    "Buloqboshi",
    "Izboskan",
    "Jalolquduq",
    "Xo‘jaobod",
    "Qo‘rg‘ontepa",
    "Marhamat",
    "Oltinko‘l",
    "Paxtaobod",
    "Shahrixon",
    "Ulug‘nor",
  ],
  "Buxoro viloyati": [
    "Buxoro shahri",
    "Buxoro",
    "G‘ijduvon",
    "Jondor",
    "Kogon",
    "Kogon shahri",
    "Olot",
    "Peshku",
    "Qorako‘l",
    "Qorovulbozor",
    "Romitan",
    "Shofirkon",
    "Vobkent",
  ],
  "Farg‘ona viloyati": [
    "Farg‘ona shahri",
    "Farg‘ona",
    "Beshariq",
    "Bog‘dod",
    "Buvayda",
    "Dang‘ara",
    "Furqat",
    "Marg‘ilon shahri",
    "Oltiariq",
    "Qo‘qon shahri",
    "Quva",
    "Quvasoy shahri",
    "Rishton",
    "So‘x",
    "Toshloq",
    "Uchko‘prik",
    "Yozyovon",
  ],
  "Jizzax viloyati": [
    "Jizzax shahri",
    "Arnasoy",
    "Baxmal",
    "Do‘stlik",
    "Forish",
    "G‘allaorol",
    "Mirzacho‘l",
    "Paxtakor",
    "Yangiobod",
    "Zafarobod",
    "Zarbdor",
    "Zomin",
    "Sharof Rashidov",
  ],
  "Xorazm viloyati": [
    "Urganch shahri",
    "Bog‘ot",
    "Gurlan",
    "Hazorasp",
    "Xiva",
    "Xiva shahri",
    "Qo‘shko‘pir",
    "Shovot",
    "Tuproqqal’a",
    "Urganch",
    "Xonqa",
    "Yangiariq",
    "Yangibozor",
  ],
  "Namangan viloyati": [
    "Namangan shahri",
    "Chortoq",
    "Chust",
    "Kosonsoy",
    "Mingbuloq",
    "Namangan",
    "Norin",
    "Pop",
    "To‘raqo‘rg‘on",
    "Uchqo‘rg‘on",
    "Uychi",
    "Yangiqo‘rg‘on",
  ],
  "Navoiy viloyati": [
    "Navoiy shahri",
    "Zarafshon shahri",
    "Karmana",
    "Konimex",
    "Navbahor",
    "Nurota",
    "Qiziltepa",
    "Tomdi",
    "Uchquduq",
    "Xatirchi",
  ],
  "Qashqadaryo viloyati": [
    "Qarshi shahri",
    "Shahrisabz shahri",
    "Chiroqchi",
    "Dehqonobod",
    "G‘uzor",
    "Kasbi",
    "Kitob",
    "Koson",
    "Ko‘kdala",
    "Mirishkor",
    "Muborak",
    "Nishon",
    "Qamashi",
    "Qarshi",
    "Shahrisabz",
    "Yakkabog‘",
  ],
  "Qoraqalpog‘iston Respublikasi": [
    "Nukus shahri",
    "Amudaryo",
    "Beruniy",
    "Bo‘zatov",
    "Chimboy",
    "Ellikqal’a",
    "Kegeyli",
    "Mo‘ynoq",
    "Nukus",
    "Qanliko‘l",
    "Qo‘ng‘irot",
    "Qorao‘zak",
    "Shumanay",
    "Taxtako‘pir",
    "Taxiatosh",
    "To‘rtko‘l",
    "Xo‘jayli",
  ],
  "Samarqand viloyati": [
    "Samarqand shahri",
    "Bulung‘ur",
    "Ishtixon",
    "Jomboy",
    "Kattaqo‘rg‘on",
    "Kattaqo‘rg‘on shahri",
    "Narpay",
    "Nurobod",
    "Oqdaryo",
    "Paxtachi",
    "Payariq",
    "Pastdarg‘om",
    "Qo‘shrabot",
    "Samarqand",
    "Toyloq",
    "Urgut",
  ],
  "Sirdaryo viloyati": [
    "Guliston shahri",
    "Yangiyer shahri",
    "Shirin shahri",
    "Boyovut",
    "Guliston",
    "Mirzaobod",
    "Oqoltin",
    "Sayxunobod",
    "Sardoba",
    "Sirdaryo",
    "Xovos",
  ],
  "Surxondaryo viloyati": [
    "Termiz shahri",
    "Angor",
    "Bandixon",
    "Boysun",
    "Denov",
    "Jarqo‘rg‘on",
    "Muzrabot",
    "Oltinsoy",
    "Qiziriq",
    "Qumqo‘rg‘on",
    "Sariosiyo",
    "Sherobod",
    "Sho‘rchi",
    "Termiz",
    "Uzun",
  ],
};

function buildAddress(parts: AddressParts) {
  return [
    parts.viloyat.trim(),
    parts.tuman.trim(),
    parts.street.trim(),
    parts.houseNumber.trim(),
  ]
    .filter(Boolean)
    .join(", ");
}

function parseAddress(raw: string): AddressParts {
  const value = String(raw || "").trim();

  if (!value || /https?:\/\/|yandex|google|maps/i.test(value)) {
    return {
      viloyat: "",
      tuman: "",
      street: "",
      houseNumber: "",
    };
  }

  const parts = value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  return {
    viloyat: parts[0] || "",
    tuman: parts[1] || "",
    street: parts[2] || "",
    houseNumber: parts.slice(3).join(", "),
  };
}

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

export default function CheckoutPage() {
  const router = useRouter();
  const { items, clear } = useCartStore();

  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingUser, setCheckingUser] = useState(true);

  const [savedUser, setSavedUser] = useState<SavedUser | null>(null);

  const [viloyat, setViloyat] = useState("");
  const [tuman, setTuman] = useState("");
  const [street, setStreet] = useState("");
  const [houseNumber, setHouseNumber] = useState("");

  const [note, setNote] = useState("");

  const currentTumans = viloyat ? TUMANLAR_BY_VILOYAT[viloyat] ?? [] : [];

  const formattedAddress = buildAddress({
    viloyat,
    tuman,
    street,
    houseNumber,
  });

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

      const parsedAddress = parseAddress(user.address || "");

      setSavedUser(user);
      setViloyat(parsedAddress.viloyat);
      setTuman(parsedAddress.tuman);
      setStreet(parsedAddress.street);
      setHouseNumber(parsedAddress.houseNumber);

      setCheckingUser(false);
    } catch {
      router.push("/auth");
    }
  }, [router]);

  useEffect(() => {
    if (!viloyat) {
      setTuman("");
      return;
    }

    const availableTumans = TUMANLAR_BY_VILOYAT[viloyat] ?? [];

    if (tuman && !availableTumans.includes(tuman)) {
      setTuman("");
    }
  }, [viloyat, tuman]);

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

    if (!viloyat || !tuman || !street.trim() || !houseNumber.trim()) {
      alert("Viloyat, tuman, ko‘cha va uy raqamini kiriting");
      return;
    }

    if (!supabase) {
      alert("Supabase ulanmagan");
      return;
    }

    setLoading(true);

    try {
      const userId = savedUser.id ?? null;
      const finalAddress = formattedAddress;

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
  moysklad_product_id: item.product.moyskladProductId || null,
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
            Buyurtma profilingiz asosida yuboriladi. Yetkazib berish manzilini
            tasdiqlang yoki yangilang.
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

            <div className="space-y-3">
              <label className="mb-2 block text-sm font-medium text-marva-900">
                Yetkazib berish manzili
              </label>

              <div>
                <label className="mb-2 block text-sm font-medium text-marva-900">
                  Viloyat
                </label>
                <select
                  value={viloyat}
                  onChange={(e) => setViloyat(e.target.value)}
                  className="w-full rounded-2xl border border-marva-100 px-4 py-4 outline-none"
                >
                  <option value="">Viloyatni tanlang</option>
                  {VILOYATLAR.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-marva-900">
                  Tuman
                </label>
                <select
                  value={tuman}
                  onChange={(e) => setTuman(e.target.value)}
                  disabled={!viloyat}
                  className="w-full rounded-2xl border border-marva-100 px-4 py-4 outline-none disabled:opacity-60"
                >
                  <option value="">
                    {viloyat ? "Tumanni tanlang" : "Avval viloyatni tanlang"}
                  </option>

                  {currentTumans.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-marva-900">
                  Ko‘cha nomi
                </label>
                <input
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  placeholder="Masalan: Amir Temur ko‘chasi"
                  className="w-full rounded-2xl border border-marva-100 px-4 py-4 outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-marva-900">
                  Uy raqami
                </label>
                <input
                  value={houseNumber}
                  onChange={(e) => setHouseNumber(e.target.value)}
                  placeholder="Masalan: 12"
                  className="w-full rounded-2xl border border-marva-100 px-4 py-4 outline-none"
                />
              </div>
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
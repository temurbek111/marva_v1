"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { useCartStore } from "@/lib/store";
import { formatPrice } from "@/lib/utils";
import { BottomNav } from "@/components/layout/BottomNav";
import { useLang } from "@/hooks/useLang";
import { t } from "@/lib/i18n";
import { LangSwitcher } from "@/components/common/LangSwitcher";

export default function CartPage() {
  const router = useRouter();
  const { items, removeItem, changeQuantity } = useCartStore();
  const { lang, mounted } = useLang();

  const total = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  const handleCheckout = () => {
    const savedUser = localStorage.getItem("marva-user");

    if (!savedUser) {
      router.push("/auth");
      return;
    }

    try {
      const parsed = JSON.parse(savedUser);

      if (!parsed?.fullName || !parsed?.phone) {
        router.push("/auth");
        return;
      }

      router.push("/checkout");
    } catch {
      router.push("/auth");
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#EEF3F1] pb-44">
      <Container className="py-5">
        <div className="rounded-[28px] bg-white p-5 shadow-soft">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <button
                onClick={() => router.back()}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] bg-[#F4F7F6] text-[#12332D] shadow-[0_10px_25px_rgba(15,23,42,0.06)] ring-1 ring-black/5"
              >
                <ArrowLeft size={22} />
              </button>

              <div>
                <h1 className="text-2xl font-bold text-marva-900">
                  {t(lang, "cart")}
                </h1>
                <p className="mt-1 text-sm text-marva-700/70">
                  {lang === "uz"
                    ? "Tanlangan mahsulotlar"
                    : "Выбранные товары"}
                </p>
              </div>
            </div>

            <LangSwitcher />
          </div>
        </div>

        <div className="mt-5 space-y-4">
          {items.length === 0 ? (
            <div className="rounded-[28px] bg-white p-6 text-center shadow-soft">
              <p className="text-lg font-semibold text-marva-900">
                {t(lang, "emptyCart")}
              </p>
              <p className="mt-2 text-sm text-marva-700/70">
                {lang === "uz"
                  ? "Katalogdan mahsulot qo‘shing."
                  : "Добавьте товары из каталога."}
              </p>
              <Link
                href="/catalog"
                className="mt-4 inline-block rounded-2xl bg-marva-700 px-5 py-3 font-semibold text-white"
              >
                {lang === "uz" ? "Katalogga o‘tish" : "Перейти в каталог"}
              </Link>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.product.id}
                className="rounded-[24px] bg-white p-4 shadow-soft"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-marva-900">
                      {item.product.name}
                    </h3>
                    <p className="mt-1 text-sm text-marva-700/70">
                      {formatPrice(item.product.price)} x {item.quantity}
                    </p>
                  </div>

                  <button
                    onClick={() => removeItem(item.product.id)}
                    className="shrink-0 text-sm text-red-500"
                  >
                    {lang === "uz" ? "O‘chirish" : "Удалить"}
                  </button>
                </div>

                <div className="mt-4 flex items-center gap-3">
                  <button
                    onClick={() =>
                      changeQuantity(item.product.id, item.quantity - 1)
                    }
                    className="flex h-10 w-10 items-center justify-center rounded-2xl bg-marva-50"
                  >
                    -
                  </button>

                  <div className="rounded-2xl bg-marva-50 px-4 py-2">
                    {item.quantity}
                  </div>

                  <button
                    onClick={() =>
                      changeQuantity(item.product.id, item.quantity + 1)
                    }
                    className="flex h-10 w-10 items-center justify-center rounded-2xl bg-marva-50"
                  >
                    +
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </Container>

      {items.length > 0 ? (
        <div className="fixed bottom-[88px] left-0 right-0 z-40">
          <div className="mx-auto w-full max-w-md px-4">
            <div className="rounded-[28px] bg-marva-800 p-5 text-white shadow-[0_18px_40px_rgba(0,0,0,0.18)]">
              <div className="flex items-center justify-between">
                <span>{lang === "uz" ? "Jami" : "Итого"}</span>
                <span className="text-2xl font-bold">{formatPrice(total)}</span>
              </div>

              <button
                onClick={handleCheckout}
                className="mt-4 block w-full rounded-[20px] bg-white px-4 py-4 text-center font-semibold text-marva-800"
              >
                {lang === "uz" ? "Rasmiylashtirish" : "Оформить заказ"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <BottomNav />
    </div>
  );
}
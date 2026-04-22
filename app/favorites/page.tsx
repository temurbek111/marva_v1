"use client";

import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { Container } from "@/components/ui/Container";
import { ProductCard } from "@/components/product/ProductCard";
import { useCartStore } from "@/lib/store";

export default function FavoritesPage() {
  const favorites = useCartStore((state) => state.favorites);

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#F7FAF9_0%,#EEF3F1_55%,#E8EFED_100%)] pb-28">
      <Header />

      <Container className="py-5">
        <div className="rounded-[28px] bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.06)] ring-1 ring-black/5">
          <h1 className="text-[28px] font-bold text-[#12332D]">Sevimlilar</h1>
          <p className="mt-1 text-sm text-[#5D7E78]">
            Yoqtirgan mahsulotlaringiz shu yerda turadi
          </p>
        </div>

        {favorites.length === 0 ? (
          <div className="mt-5 rounded-[28px] bg-white p-6 text-center shadow-[0_16px_40px_rgba(15,23,42,0.06)] ring-1 ring-black/5">
            <p className="text-lg font-semibold text-[#12332D]">
              Hozircha sevimli mahsulot yo‘q
            </p>

            <p className="mt-2 text-sm text-[#5D7E78]">
              Yoqtirgan mahsulotlaringizni heart orqali saqlang
            </p>

            <Link
              href="/catalog"
              className="mt-5 inline-flex rounded-full bg-[#004F45] px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(0,79,69,0.20)]"
            >
              Katalogga o‘tish
            </Link>
          </div>
        ) : (
          <div className="mt-5 grid grid-cols-2 gap-4">
            {favorites.map((product) => (
              <ProductCard key={String(product.id)} product={product} />
            ))}
          </div>
        )}
      </Container>

      <BottomNav />
    </div>
  );
}
"use client";

import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { useCartStore } from "@/lib/store";
import type { Product } from "@/lib/types";

type FavoriteButtonProps = {
  product: Product;
};

export function FavoriteButton({ product }: FavoriteButtonProps) {
  const { toggleFavorite, isFavorite } = useCartStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const favorite = mounted ? isFavorite(String(product.id)) : false;

  return (
    <button
      onClick={() => toggleFavorite(product)}
      className="flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-[0_8px_20px_rgba(0,0,0,0.06)] ring-1 ring-black/5"
    >
      <Heart
        size={20}
        className={
          favorite
            ? "fill-[#0A7A5A] text-[#0A7A5A]"
            : "text-[#0A7A5A]"
        }
      />
    </button>
  );
}
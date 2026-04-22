"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, Minus, Plus } from "lucide-react";
import { useCartStore } from "@/lib/store";

type Product = {
  id: string;
  name: string;
  price: number | string;
  oldPrice?: number | string;
  image?: string;
  slug?: string;
  categoryId?: string;
  currency?: string;
  shortDescription?: string;
  description?: string;
  stock?: number;
  featured?: boolean;
};

export function ProductCard({ product }: { product: Product }) {
  const router = useRouter();
  const {
    items,
    addItem,
    changeQuantity,
    removeItem,
    toggleFavorite,
    isFavorite,
  } = useCartStore();

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const stock = Number(product.stock || 0);

  const mappedProduct = {
    id: String(product.id),
    slug: product.slug || `product-${product.id}`,
    categoryId: product.categoryId || "",
    name: product.name,
    price: Number(product.price || 0),
    oldPrice: product.oldPrice ? Number(product.oldPrice) : undefined,
    currency: product.currency || "USD",
    image: product.image || "",
    shortDescription: product.shortDescription || "Dental mahsulot",
    description: product.description || "Dental mahsulot",
    stock,
    featured: Boolean(product.featured),
  };

  const favorite = mounted ? isFavorite(String(product.id)) : false;
  const cartItem = mounted
    ? items.find((item) => item.product.id === String(product.id))
    : undefined;
  const quantity = mounted ? cartItem?.quantity || 0 : 0;

  const status =
    stock <= 0
      ? {
          label: "Tez orada keladi",
          className: "bg-[#FDECEC] text-[#D94B4B]",
        }
      : stock < 3
      ? {
          label: "Sanoqli qolgan",
          className: "bg-[#FFF4E5] text-[#D9822B]",
        }
      : {
          label: "Sotuvda mavjud",
          className: "bg-[#ECF8F3] text-[#0A7A5A]",
        };

  const openProduct = () => {
    router.push(`/product/${product.id}`);
  };

  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(mappedProduct);
  };

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (stock <= 0) return;
    addItem(mappedProduct);
  };

  const increase = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (stock <= 0) return;

    if (!cartItem) {
      addItem(mappedProduct);
      return;
    }

    if (quantity >= stock) return;

    changeQuantity(String(product.id), quantity + 1);
  };

  const decrease = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!cartItem) return;

    if (quantity <= 1) {
      removeItem(String(product.id));
      return;
    }

    changeQuantity(String(product.id), quantity - 1);
  };

  return (
    <div
      onClick={openProduct}
      className="group cursor-pointer overflow-hidden rounded-[22px] bg-white shadow-[0_10px_30px_rgba(15,23,42,0.05)] ring-1 ring-black/5 transition"
    >
      <div className="relative p-3">
        <button
          onClick={handleFavorite}
          className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#0A7A5A] shadow-[0_8px_18px_rgba(15,23,42,0.06)] ring-1 ring-black/5"
        >
          <Heart
            size={18}
            className={
              favorite ? "fill-[#0A7A5A] text-[#0A7A5A]" : "text-[#0A7A5A]"
            }
          />
        </button>

        <div className="flex h-[160px] items-center justify-center overflow-hidden rounded-[18px] bg-[#F8FBFA]">
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              className="max-h-[145px] w-full object-contain transition duration-300 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm font-bold text-[#004F45]">
              MARVA
            </div>
          )}
        </div>
      </div>

      <div className="px-4 pb-4">
        <div className="flex items-start justify-between gap-2">
          <p className="text-xs text-[#6E8782] line-clamp-1">{product.shortDescription || "Dental mahsulot"}</p>

          <span
            className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${status.className}`}
          >
            {status.label}
          </span>
        </div>

        <h3 className="mt-2 line-clamp-2 min-h-[48px] text-[16px] font-semibold leading-6 text-[#12332D]">
          {product.name}
        </h3>

        <div className="mt-4 flex items-end justify-between gap-3">
          <div className="min-w-0">
            {product.oldPrice ? (
              <p className="text-xs text-[#91A6A1] line-through">
                ${product.oldPrice}
              </p>
            ) : null}

            <p className="text-[18px] font-bold text-[#004F45]">
              ${product.price}
            </p>
          </div>

          {!mounted ? (
            <button
              onClick={(e) => e.stopPropagation()}
              className="rounded-full bg-[#004F45] px-4 py-2 text-xs font-semibold text-white shadow-[0_10px_22px_rgba(0,79,69,0.18)]"
            >
              Savatga
            </button>
          ) : stock <= 0 ? (
            <div className="rounded-full bg-[#EEF2F6] px-3 py-2 text-xs font-semibold text-[#7F93B2]">
              Tez orada
            </div>
          ) : quantity > 0 ? (
            <div
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-2 rounded-full bg-[#004F45] px-2 py-2 text-white shadow-[0_10px_22px_rgba(0,79,69,0.18)]"
            >
              <button
                onClick={decrease}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15"
              >
                <Minus size={15} />
              </button>

              <span className="min-w-[18px] text-center text-sm font-bold">
                {quantity}
              </span>

              <button
                onClick={increase}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15"
              >
                <Plus size={15} />
              </button>
            </div>
          ) : (
            <button
              onClick={handleAdd}
              className="rounded-full bg-[#004F45] px-4 py-2 text-xs font-semibold text-white shadow-[0_10px_22px_rgba(0,79,69,0.18)]"
            >
              Savatga
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
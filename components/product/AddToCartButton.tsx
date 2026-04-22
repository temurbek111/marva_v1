"use client";

import { Minus, Plus } from "lucide-react";
import { useCartStore } from "@/lib/store";

type ProductItem = {
  id: string;
  slug: string;
  categoryId: string;
  name: string;
  price: number;
  oldPrice?: number;
  currency: string;
  image: string;
  shortDescription: string;
  description: string;
  stock: number;
  featured: boolean;
};

type AddToCartButtonProps = {
  product: ProductItem;
};

export function AddToCartButton({ product }: AddToCartButtonProps) {
  const { items, addItem, changeQuantity, removeItem } = useCartStore();

  const cartItem = items.find((item) => item.product.id === String(product.id));
  const quantity = cartItem?.quantity || 0;

  const handleAdd = () => {
    if (product.stock <= 0) return;
    addItem(product);
  };

  const increase = () => {
    if (product.stock <= 0) return;

    if (!cartItem) {
      addItem(product);
      return;
    }

    if (quantity >= product.stock) return;

    changeQuantity(String(product.id), quantity + 1);
  };

  const decrease = () => {
    if (!cartItem) return;

    if (quantity <= 1) {
      removeItem(String(product.id));
      return;
    }

    changeQuantity(String(product.id), quantity - 1);
  };

  return (
    <>
      <div className="h-28" />

      <div className="fixed inset-x-0 bottom-[72px] z-40">
        <div className="mx-auto w-full max-w-md px-4">
          <div className="rounded-[28px] bg-white/95 p-3 shadow-[0_18px_40px_rgba(15,23,42,0.14)] ring-1 ring-black/5 backdrop-blur">
            {product.stock <= 0 ? (
              <button
                disabled
                className="w-full rounded-full bg-[#E9EEF5] px-5 py-4 text-base font-semibold text-[#7F93B2]"
              >
                Tez orada keladi
              </button>
            ) : quantity > 0 ? (
              <div className="flex items-center justify-between gap-3 rounded-full bg-[#004F45] px-4 py-3 text-white shadow-[0_12px_24px_rgba(0,79,69,0.20)]">
                <div className="min-w-0">
                  <p className="text-xs text-white/75">Savatda</p>
                  <p className="text-sm font-semibold">
                    ${product.price} × {quantity}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={decrease}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15"
                  >
                    <Minus size={18} />
                  </button>

                  <span className="min-w-[20px] text-center text-lg font-bold">
                    {quantity}
                  </span>

                  <button
                    onClick={increase}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15"
                  >
                    <Plus size={18} />
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={handleAdd}
                className="w-full rounded-full bg-[#004F45] px-5 py-4 text-base font-semibold text-white shadow-[0_12px_24px_rgba(0,79,69,0.20)]"
              >
                Savatga qo‘shish
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
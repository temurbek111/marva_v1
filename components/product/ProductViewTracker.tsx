"use client";

import { useEffect } from "react";

type ViewedProduct = {
  id: string;
  name: string;
  price: number;
  image?: string;
  description?: string;
};

type SavedUser = {
  id?: number | string;
  phone?: string;
  telegramId?: number | string | null;
};

type StoredViewedProduct = ViewedProduct & {
  viewedAt: string;
  userKey: string;
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

export function ProductViewTracker({ product }: { product: ViewedProduct }) {
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem("marva-user");
      const parsedUser: SavedUser | null = savedUser
        ? JSON.parse(savedUser)
        : null;

      const userKey = getCurrentUserKey(parsedUser);

      const savedViewed = localStorage.getItem("marva-viewed");
      const parsedViewed = savedViewed ? JSON.parse(savedViewed) : [];
      const currentViewed: StoredViewedProduct[] = Array.isArray(parsedViewed)
        ? parsedViewed
        : [];

      const filtered = currentViewed.filter(
        (item) =>
          !(
            String(item.id) === String(product.id) &&
            String(item.userKey) === String(userKey)
          )
      );

      const newItem: StoredViewedProduct = {
        ...product,
        viewedAt: new Date().toISOString(),
        userKey,
        telegramId: parsedUser?.telegramId ?? null,
        phone: parsedUser?.phone ?? "",
      };

      localStorage.setItem(
        "marva-viewed",
        JSON.stringify([newItem, ...filtered].slice(0, 50))
      );
    } catch (error) {
      console.error("Viewed save error:", error);
    }
  }, [product]);

  return null;
}
"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Product, CartItem } from "@/lib/types";

function getCurrentUserStorageId() {
  if (typeof window === "undefined") return "guest";

  try {
    const savedUser = localStorage.getItem("marva-user");
    if (!savedUser) return "guest";

    const user = JSON.parse(savedUser);

    if (user?.telegramId) return String(user.telegramId);
    if (user?.phone) return String(user.phone);
    if (user?.id) return String(user.id);

    return "guest";
  } catch {
    return "guest";
  }
}

function getFavoritesStorageKey() {
  return `marva-favorites-${getCurrentUserStorageId()}`;
}

function readFavoritesFromStorage(): Product[] {
  if (typeof window === "undefined") return [];

  try {
    const saved = localStorage.getItem(getFavoritesStorageKey());
    if (!saved) return [];

    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeFavoritesToStorage(favorites: Product[]) {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(getFavoritesStorageKey(), JSON.stringify(favorites));
  } catch {
    // ignore
  }
}

type CartState = {
  items: CartItem[];
  favorites: Product[];

  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  changeQuantity: (productId: string, quantity: number) => void;
  clear: () => void;

  hydrateFavorites: () => void;
  toggleFavorite: (product: Product) => void;
  removeFavorite: (productId: string) => void;
  isFavorite: (productId: string) => boolean;
  clearFavorites: () => void;
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      favorites:
        typeof window !== "undefined" ? readFavoritesFromStorage() : [],

      addItem: (product) =>
        set((state) => {
          const existing = state.items.find(
            (item) => item.product.id === product.id
          );

          if (existing) {
            return {
              items: state.items.map((item) =>
                item.product.id === product.id
                  ? { ...item, quantity: item.quantity + 1 }
                  : item
              ),
            };
          }

          return {
            items: [...state.items, { product, quantity: 1 }],
          };
        }),

      removeItem: (productId) =>
        set((state) => ({
          items: state.items.filter((item) => item.product.id !== productId),
        })),

      changeQuantity: (productId, quantity) =>
        set((state) => ({
          items: state.items
            .map((item) =>
              item.product.id === productId ? { ...item, quantity } : item
            )
            .filter((item) => item.quantity > 0),
        })),

      clear: () => set({ items: [] }),

      hydrateFavorites: () => {
        set({ favorites: readFavoritesFromStorage() });
      },

      toggleFavorite: (product) => {
        const currentFavorites = readFavoritesFromStorage();
        const exists = currentFavorites.some(
          (item) => String(item.id) === String(product.id)
        );

        const newFavorites = exists
          ? currentFavorites.filter(
              (item) => String(item.id) !== String(product.id)
            )
          : [...currentFavorites, product];

        writeFavoritesToStorage(newFavorites);
        set({ favorites: newFavorites });
      },

      removeFavorite: (productId) => {
        const currentFavorites = readFavoritesFromStorage();
        const newFavorites = currentFavorites.filter(
          (item) => String(item.id) !== String(productId)
        );

        writeFavoritesToStorage(newFavorites);
        set({ favorites: newFavorites });
      },

      isFavorite: (productId) => {
        return readFavoritesFromStorage().some(
          (item) => String(item.id) === String(productId)
        );
      },

      clearFavorites: () => {
        writeFavoritesToStorage([]);
        set({ favorites: [] });
      },
    }),
    {
      name: "marva-store",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        items: state.items,
      }),
    }
  )
);

if (typeof window !== "undefined") {
  const syncFavorites = () => {
    try {
      useCartStore.getState().hydrateFavorites();
    } catch {
      // ignore
    }
  };

  syncFavorites();

  window.addEventListener("focus", syncFavorites);
  window.addEventListener("storage", syncFavorites);
}
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { Container } from "@/components/ui/Container";
import { Eye, Clock3 } from "lucide-react";

type SavedUser = {
  id?: number | string;
  phone?: string;
  telegramId?: number | string | null;
};

type ViewedProduct = {
  id: string;
  name: string;
  price: number;
  image?: string;
  description?: string;
  viewedAt?: string;
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

function itemBelongsToUser(item: ViewedProduct, user: SavedUser | null) {
  if (!user) return false;

  const currentUserKey = getCurrentUserKey(user);

  if (item.userKey) {
    return item.userKey === currentUserKey;
  }

  if (user.telegramId && item.telegramId) {
    return String(item.telegramId) === String(user.telegramId);
  }

  if (user.phone && item.phone) {
    return String(item.phone) === String(user.phone);
  }

  return false;
}

export default function ViewedPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<SavedUser | null>(null);
  const [items, setItems] = useState<ViewedProduct[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    try {
      const savedUser = localStorage.getItem("marva-user");
      const savedViewed = localStorage.getItem("marva-viewed");

      if (savedUser) {
        setCurrentUser(JSON.parse(savedUser));
      }

      if (savedViewed) {
        const parsed = JSON.parse(savedViewed);
        if (Array.isArray(parsed)) {
          setItems(parsed);
        }
      }
    } catch (error) {
      console.error("Viewed parse error:", error);
    }
  }, []);

  const filteredItems = useMemo(() => {
    return items
      .filter((item) => itemBelongsToUser(item, currentUser))
      .sort((a, b) => {
        const aTime = a.viewedAt ? new Date(a.viewedAt).getTime() : 0;
        const bTime = b.viewedAt ? new Date(b.viewedAt).getTime() : 0;
        return bTime - aTime;
      });
  }, [items, currentUser]);

  return (
    <div className="min-h-screen bg-[#F3F6F5] pb-28">
      <Header />

      <Container className="py-4">
        {!mounted ? (
          <div className="rounded-[28px] bg-white p-5 text-center text-sm text-[#6B7280] shadow-[0_10px_30px_rgba(15,23,42,0.05)] ring-1 ring-black/5">
            Yuklanmoqda...
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="rounded-[32px] bg-white px-5 py-10 text-center shadow-[0_10px_30px_rgba(15,23,42,0.05)] ring-1 ring-black/5">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#F4F7F6] text-[#12332D]">
              <Eye size={34} />
            </div>

            <h2 className="mt-5 text-[24px] font-bold text-[#12332D]">
              Ko‘rilgan mahsulotlar yo‘q
            </h2>

            <p className="mt-2 text-sm leading-6 text-[#6B8A84]">
              Siz ko‘rgan mahsulotlar shu yerda chiqadi.
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
                Ko‘rilgan mahsulotlar
              </div>
              <div className="mt-2 text-[28px] font-bold leading-none text-[#12332D]">
                {filteredItems.length} ta
              </div>
              <div className="mt-2 text-sm text-[#6B8A84]">
                Faqat siz ko‘rgan mahsulotlar ko‘rinadi
              </div>
            </div>

            <div className="space-y-3">
              {filteredItems.map((item) => (
                <button
                  key={`${item.id}-${item.viewedAt || ""}`}
                  onClick={() => router.push(`/product/${item.id}`)}
                  className="flex w-full items-center gap-3 rounded-[28px] bg-white p-4 text-left shadow-[0_10px_30px_rgba(15,23,42,0.05)] ring-1 ring-black/5"
                >
                  <div className="flex h-[90px] w-[90px] shrink-0 items-center justify-center overflow-hidden rounded-[22px] bg-[#F4F7F6]">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-sm font-bold text-[#004F45]">
                        MARVA
                      </span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="text-xs uppercase tracking-[0.08em] text-[#6B8A84]">
                      Dental mahsulot
                    </div>

                    <div className="mt-1 line-clamp-2 text-[18px] font-bold leading-6 text-[#12332D]">
                      {item.name}
                    </div>

                    {item.description ? (
                      <div className="mt-1 line-clamp-2 text-sm text-[#6B8A84]">
                        {item.description}
                      </div>
                    ) : null}

                    <div className="mt-3 flex items-center justify-between gap-2">
                      <div className="text-[24px] font-bold leading-none text-[#005B4F]">
                        ${item.price}
                      </div>

                      {item.viewedAt ? (
                        <div className="flex items-center gap-1 text-xs text-[#6B8A84]">
                          <Clock3 size={14} />
                          {new Date(item.viewedAt).toLocaleString()}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </Container>

      <BottomNav />
    </div>
  );
}
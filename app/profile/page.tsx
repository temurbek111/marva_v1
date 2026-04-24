"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppLang } from "@/components/common/LangProvider";
import { BottomNav } from "@/components/layout/BottomNav";
import { Container } from "@/components/ui/Container";
import { supabase } from "@/lib/supabase";
import {
  ArrowLeft,
  User,
  Package,
  Heart,
  Eye,
  MapPin,
  ChevronRight,
  LogOut,
} from "lucide-react";

type SavedUser = {
  fullName: string;
  phone: string;
  address: string;
  telegramUsername: string;
  telegramId?: number | null;
  age?: number | string | null;
  gender?: string | null;
  customerType?: string | null;
  clinicName?: string | null;
};

type MenuItemProps = {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  value?: string | number;
  onClick?: () => void;
};

function getAddressSubtitle(address?: string, lang: string = "uz") {
  if (!address) {
    return lang === "uz" ? "Manzil kiritilmagan" : "Адрес не указан";
  }

  if (address.includes("yandex") || address.includes("maps") || address.includes("google")) {
    return lang === "uz" ? "📍 Lokatsiya saqlangan" : "📍 Локация сохранена";
  }

  if (address.length > 32) {
    return `${address.slice(0, 32)}...`;
  }

  return address;
}

function MenuItem({ icon, title, subtitle, value, onClick }: MenuItemProps) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 px-4 py-4 text-left transition active:scale-[0.99]"
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#F4F6F7] text-[#4B5563]">
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <div className="text-[18px] font-semibold leading-6 text-[#111827]">
          {title}
        </div>
        {subtitle ? (
          <div className="mt-1 max-w-[230px] truncate text-sm text-[#9CA3AF]">
            {subtitle}
          </div>
        ) : null}
      </div>

      <div className="flex items-center gap-2">
        {value !== undefined ? (
          <span className="text-[18px] font-medium text-[#111827]">
            {value}
          </span>
        ) : null}
        <ChevronRight size={20} className="text-[#9CA3AF]" />
      </div>
    </button>
  );
}

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[28px] bg-white shadow-[0_10px_30px_rgba(15,23,42,0.05)] ring-1 ring-black/5">
      <div className="px-5 pb-2 pt-5 text-[15px] font-extrabold uppercase tracking-[0.08em] text-[#4B5563]">
        {title}
      </div>
      <div className="divide-y divide-[#EEF2F3]">{children}</div>
    </div>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const { lang, mounted } = useAppLang();

  const [user, setUser] = useState<SavedUser | null>(null);
  const [ordersCount, setOrdersCount] = useState(0);
  const [ordersCountLoading, setOrdersCountLoading] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("marva-user");

    if (!saved) {
      router.push("/auth");
      return;
    }

    try {
      const parsed = JSON.parse(saved) as SavedUser;
      setUser(parsed);
    } catch {
      router.push("/auth");
    }
  }, [router]);

  useEffect(() => {
    if (!user) return;

    const fetchOrdersCount = async () => {
      setOrdersCountLoading(true);

      const candidates: { column: string; value: string | number }[] = [];

      if (user.telegramId) {
        candidates.push(
          { column: "telegram_id", value: user.telegramId },
          { column: "telegramId", value: user.telegramId },
          { column: "customer_telegram_id", value: user.telegramId }
        );
      }

      if (user.phone) {
        candidates.push(
          { column: "phone", value: user.phone },
          { column: "customer_phone", value: user.phone },
          { column: "customerPhone", value: user.phone }
        );
      }

      if (user.telegramUsername) {
        const username = user.telegramUsername.startsWith("@")
          ? user.telegramUsername
          : `@${user.telegramUsername}`;

        candidates.push(
          { column: "telegram_username", value: username },
          { column: "telegramUsername", value: username },
          { column: "customer_telegram_username", value: username }
        );
      }

      let maxCount = 0;

      for (const candidate of candidates) {
        const { count, error } = await supabase
          .from("orders")
          .select("id", { count: "exact", head: true })
          .eq(candidate.column, candidate.value);

        if (!error && typeof count === "number") {
          maxCount = Math.max(maxCount, count);
        }
      }

      setOrdersCount(maxCount);
      setOrdersCountLoading(false);
    };

    fetchOrdersCount();
  }, [user]);

  const handleLogout = () => {
    localStorage.removeItem("marva-user");
    router.push("/auth");
  };

  if (!mounted) return null;

  if (!user) {
    return (
      <div className="min-h-screen bg-[#F3F6F5] pb-28">
        <div className="sticky top-0 z-40 border-b border-black/5 bg-white/95 backdrop-blur">
          <div className="mx-auto flex h-20 max-w-md items-center justify-between px-4">
            <button
              onClick={() => router.back()}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F4F7F6] text-[#12332D]"
            >
              <ArrowLeft size={22} />
            </button>

            <div className="text-[20px] font-bold text-[#12332D]">
              {lang === "uz" ? "Profil" : "Профиль"}
            </div>

            <div className="h-12 w-12" />
          </div>
        </div>

        <Container className="py-6">
          <div className="rounded-[28px] bg-white p-5 text-center text-sm text-[#6B7280] shadow-[0_10px_30px_rgba(15,23,42,0.05)] ring-1 ring-black/5">
            {lang === "uz" ? "Yuklanmoqda..." : "Загрузка..."}
          </div>
        </Container>

        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F3F6F5] pb-28">
      <div className="sticky top-0 z-40 border-b border-black/5 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-20 max-w-md items-center justify-between px-4">
          <button
            onClick={() => router.back()}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F4F7F6] text-[#12332D]"
          >
            <ArrowLeft size={22} />
          </button>

          <div className="text-[20px] font-bold text-[#12332D]">
            {lang === "uz" ? "Profil" : "Профиль"}
          </div>

          <div className="h-12 w-12" />
        </div>
      </div>

      <Container className="space-y-4 py-4">
        <div className="rounded-[28px] bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.05)] ring-1 ring-black/5">
          <button
            onClick={() => router.push("/profile/edit")}
            className="flex w-full items-center gap-4 text-left"
          >
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#EC4899_0%,#8B5CF6_100%)] p-[2px]">
              <div className="flex h-full w-full items-center justify-center rounded-full bg-white text-[#9CA3AF]">
                <User size={34} />
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <div className="text-[20px] font-bold text-[#111827]">
                {user.fullName ||
                  (lang === "uz" ? "Foydalanuvchi" : "Пользователь")}
              </div>
              <div className="mt-1 text-[17px] text-[#9CA3AF]">
                {user.phone ||
                  (lang === "uz" ? "Telefon yo‘q" : "Нет телефона")}
              </div>
            </div>

            <ChevronRight size={24} className="text-[#9CA3AF]" />
          </button>
        </div>

        <SectionCard title={lang === "uz" ? "Xaridlar" : "Покупки"}>
          <MenuItem
            icon={<Package size={24} />}
            title={lang === "uz" ? "Buyurtmalarim" : "Мои заказы"}
            value={ordersCountLoading ? "..." : ordersCount}
            onClick={() => router.push("/orders")}
          />

          <MenuItem
            icon={<Heart size={24} />}
            title={lang === "uz" ? "Sevimlilar" : "Избранное"}
            onClick={() => router.push("/favorites")}
          />

          <MenuItem
            icon={<Eye size={24} />}
            title={
              lang === "uz"
                ? "Ko‘rilgan mahsulotlar"
                : "Просмотренные товары"
            }
            onClick={() => router.push("/viewed")}
          />
        </SectionCard>

        <SectionCard
          title={lang === "uz" ? "Shaxsiy kabinet" : "Личный кабинет"}
        >
          <MenuItem
            icon={<User size={24} />}
            title={lang === "uz" ? "Profilim" : "Мой профиль"}
            subtitle={
              user.telegramUsername ||
              (lang === "uz"
                ? "@username_mavjud_emas"
                : "@username_не_указан")
            }
            onClick={() => router.push("/profile/edit")}
          />

          <MenuItem
            icon={<MapPin size={24} />}
            title={lang === "uz" ? "Manzillarim" : "Мои адреса"}
            subtitle={getAddressSubtitle(user.address, lang)}
            onClick={() => router.push("/addresses")}
          />
        </SectionCard>

        <button
          onClick={handleLogout}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-[#004F45] text-base font-semibold text-white shadow-[0_14px_28px_rgba(0,79,69,0.22)]"
        >
          <LogOut size={20} />
          {lang === "uz" ? "Chiqish" : "Выйти"}
        </button>
      </Container>

      <BottomNav />
    </div>
  );
}
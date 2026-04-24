"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppLang } from "@/components/common/LangProvider";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { Container } from "@/components/ui/Container";
import DeliveryLocationField from "@/components/DeliveryLocationField";
import { getTelegramUser } from "@/lib/web-telegram";
import { supabase } from "@/lib/supabase";
import {
  Phone,
  Send,
  User,
  MapPin,
  ShieldCheck,
  Building2,
  Calendar,
} from "lucide-react";

type CustomerRow = {
  id: number;
  telegram_id: number | null;
  telegram_username: string | null;
  full_name: string;
  phone: string | null;
  address: string | null;
  age: string | null;
  gender: string | null;
  customer_type: string | null;
  clinic_name: string | null;
};

type TelegramUser = {
  id?: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
};

type TelegramWebApp = {
  initData?: string;
  initDataUnsafe?: {
    user?: TelegramUser;
  };
  ready?: () => void;
  expand?: () => void;
  close?: () => void;
  requestContact?: (callback?: (shared: boolean) => void) => void;
  showAlert?: (message: string) => void;
  showConfirm?: (message: string, callback?: (confirmed: boolean) => void) => void;
  HapticFeedback?: {
    notificationOccurred?: (type: "error" | "success" | "warning") => void;
    impactOccurred?: (
      style: "light" | "medium" | "heavy" | "rigid" | "soft"
    ) => void;
  };
};

function normalizePhone(value: string) {
  return String(value || "").replace(/[^\d+]/g, "").trim();
}

function normalizeTelegramUsername(value: string) {
  const cleaned = String(value || "").trim();

  if (!cleaned) return "";
  if (cleaned.startsWith("@")) return cleaned;

  return `@${cleaned}`;
}

function getTelegramWebApp(): TelegramWebApp | null {
  if (typeof window === "undefined") return null;

  return ((window as any).Telegram?.WebApp || null) as TelegramWebApp | null;
}

function getTelegramUserSafely(): TelegramUser | null {
  const fromHelper = getTelegramUser();

  if (fromHelper?.id) {
    return fromHelper;
  }

  const tg = getTelegramWebApp();
  const fromWebApp = tg?.initDataUnsafe?.user;

  if (fromWebApp?.id) {
    return fromWebApp;
  }

  return null;
}

function getTelegramFullName(user: TelegramUser | null) {
  if (!user) return "";

  return `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim();
}

function toLocalUser(data: CustomerRow) {
  return {
    id: data.id,
    fullName: data.full_name,
    phone: data.phone || "",
    address: data.address || "",
    age: data.age || null,
    gender: data.gender || null,
    customerType: data.customer_type || null,
    clinicName: data.clinic_name || null,
    telegramUsername: data.telegram_username || "",
    telegramId: data.telegram_id || null,
  };
}

export default function AuthPage() {
  const router = useRouter();
  const { lang, mounted } = useAppLang();

  const [tgUser, setTgUser] = useState<TelegramUser | null>(null);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [telegramUsername, setTelegramUsername] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [customerType, setCustomerType] = useState("");
  const [clinicName, setClinicName] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingCustomer, setCheckingCustomer] = useState(true);
  const [telegramContactRequested, setTelegramContactRequested] =
    useState(false);
  const [telegramStatus, setTelegramStatus] = useState("");

  const applyTelegramUser = (user: TelegramUser | null, overwrite = false) => {
    if (!user) return;

    setTgUser(user);

    const name = getTelegramFullName(user);
    const username = user.username ? normalizeTelegramUsername(user.username) : "";

    if (name) {
      setFullName((current) => (overwrite ? name : current || name));
    }

    if (username) {
      setTelegramUsername((current) =>
        overwrite ? username : current || username
      );
    }
  };

  const requestTelegramAutofill = () => {
    const tg = getTelegramWebApp();
    const currentTgUser = getTelegramUserSafely();

    applyTelegramUser(currentTgUser, true);

    if (!tg) {
      alert(
        lang === "uz"
          ? "Telegram Mini App ichida ochilganda ma'lumotlar avtomatik olinadi."
          : "Автозаполнение работает внутри Telegram Mini App."
      );
      return;
    }

    tg.HapticFeedback?.impactOccurred?.("light");

    if (!currentTgUser?.id) {
      tg.showAlert?.(
        lang === "uz"
          ? "Telegram user ma'lumotlari topilmadi. Mini App'ni Telegram ichida qayta oching."
          : "Данные пользователя Telegram не найдены. Откройте Mini App внутри Telegram."
      );

      setTelegramStatus(
        lang === "uz"
          ? "Telegram user ma'lumotlari topilmadi."
          : "Данные пользователя Telegram не найдены."
      );
      return;
    }

    const askContact = () => {
      if (!tg.requestContact) {
        setTelegramStatus(
          lang === "uz"
            ? "Telegram kontakt so‘rovi bu versiyada ishlamayapti. Telefonni qo‘lda kiriting."
            : "Запрос контакта не поддерживается в этой версии Telegram. Введите телефон вручную."
        );
        return;
      }

      setTelegramContactRequested(true);

      tg.requestContact((shared: boolean) => {
        if (shared) {
          tg.HapticFeedback?.notificationOccurred?.("success");

          setTelegramStatus(
            lang === "uz"
              ? "Telegram ma'lumotlari olindi. Telefon avtomatik tushmasa, uni qo‘lda kiriting."
              : "Данные Telegram получены. Если телефон не заполнился автоматически, введите его вручную."
          );
        } else {
          tg.HapticFeedback?.notificationOccurred?.("warning");

          setTelegramStatus(
            lang === "uz"
              ? "Telefon raqam ulashilmadi. Telefonni qo‘lda kiriting."
              : "Номер телефона не был передан. Введите телефон вручную."
          );
        }
      });
    };

    if (tg.showConfirm) {
      tg.showConfirm(
        lang === "uz"
          ? "Telegram ma'lumotlaringiz bilan formani to‘ldiraymi?"
          : "Заполнить форму данными из Telegram?",
        (confirmed: boolean) => {
          if (confirmed) {
            askContact();
          }
        }
      );
    } else {
      askContact();
    }

    if (currentTgUser.username) {
      setTelegramStatus(
        lang === "uz"
          ? `Telegram username olindi: @${currentTgUser.username}`
          : `Telegram username получен: @${currentTgUser.username}`
      );
    } else {
      setTelegramStatus(
        lang === "uz"
          ? "Telegram ulandi, lekin profilingizda username yo‘q. Username bo‘lmasa, qo‘lda kiritishingiz mumkin."
          : "Telegram подключен, но username отсутствует. Можно ввести вручную."
      );
    }
  };

  useEffect(() => {
    const tg = getTelegramWebApp();

    tg?.ready?.();
    tg?.expand?.();

    const loadTelegramUser = () => {
      const user = getTelegramUserSafely();

      if (!user) return null;

      applyTelegramUser(user);

      return user;
    };

    loadTelegramUser();

    const timer = setTimeout(() => {
      loadTelegramUser();
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const hydrate = async () => {
      const saved = localStorage.getItem("marva-user");

      if (saved) {
        router.push("/profile");
        return;
      }

      const currentTgUser = tgUser || getTelegramUserSafely();

      if (currentTgUser) {
        const name = getTelegramFullName(currentTgUser);
        const username = currentTgUser.username
          ? normalizeTelegramUsername(currentTgUser.username)
          : "";

        setTgUser(currentTgUser);

        setFullName(
          name ||
            (lang === "uz"
              ? "Telegram foydalanuvchi"
              : "Пользователь Telegram")
        );

        setTelegramUsername(username);

        if (supabase && currentTgUser.id) {
          const { data, error } = await supabase
            .from("customers")
            .select("*")
            .eq("telegram_id", Number(currentTgUser.id))
            .maybeSingle();

          if (!error && data) {
            localStorage.setItem("marva-user", JSON.stringify(toLocalUser(data)));
            router.push("/profile");
            return;
          }
        }
      }

      setCheckingCustomer(false);
    };

    hydrate();
  }, [router, tgUser, lang]);

  const saveUser = async () => {
    if (!fullName.trim()) {
      alert(lang === "uz" ? "Ismni kiriting" : "Введите имя");
      return;
    }

    if (!phone.trim()) {
      alert(
        lang === "uz" ? "Telefon raqamni kiriting" : "Введите номер телефона"
      );
      return;
    }

    if (!address.trim()) {
      alert(lang === "uz" ? "Manzilni kiriting" : "Введите адрес");
      return;
    }

    if (!supabase) {
      alert(lang === "uz" ? "Supabase ulanmagan" : "Supabase не подключен");
      return;
    }

    setLoading(true);

    try {
      const currentTgUser = tgUser || getTelegramUserSafely();
      const telegramId = currentTgUser?.id ? Number(currentTgUser.id) : null;
      const normalizedPhone = normalizePhone(phone);

      const finalTelegramUsername =
        normalizeTelegramUsername(telegramUsername) ||
        (currentTgUser?.username
          ? normalizeTelegramUsername(currentTgUser.username)
          : "");

      const payload = {
        full_name: fullName.trim(),
        phone: normalizedPhone,
        address: address.trim(),
        age: age.trim() || null,
        gender: gender || null,
        customer_type: customerType || null,
        clinic_name: clinicName.trim() || null,
        telegram_username: finalTelegramUsername || null,
        telegram_id: telegramId,
        source: currentTgUser?.id ? "telegram_app" : "app",
      };

      let data: CustomerRow | null = null;
      let error: any = null;

      if (telegramId) {
        const result = await supabase
          .from("customers")
          .upsert(payload, { onConflict: "telegram_id" })
          .select("*")
          .single();

        data = result.data;
        error = result.error;
      } else {
        const { data: existingByPhone } = await supabase
          .from("customers")
          .select("*")
          .eq("phone", normalizedPhone)
          .maybeSingle();

        if (existingByPhone?.id) {
          const result = await supabase
            .from("customers")
            .update(payload)
            .eq("id", existingByPhone.id)
            .select("*")
            .single();

          data = result.data;
          error = result.error;
        } else {
          const result = await supabase
            .from("customers")
            .insert(payload)
            .select("*")
            .single();

          data = result.data;
          error = result.error;
        }
      }

      if (error) {
        alert(error.message);
        return;
      }

      if (!data) {
        alert(lang === "uz" ? "Mijoz saqlanmadi" : "Клиент не сохранен");
        return;
      }

      localStorage.setItem("marva-user", JSON.stringify(toLocalUser(data)));
      router.push("/profile");
    } catch (err: any) {
      alert(
        err?.message ||
          (lang === "uz" ? "Xato yuz berdi" : "Произошла ошибка")
      );
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  if (checkingCustomer) {
    return (
      <div className="min-h-screen bg-[linear-gradient(180deg,#F7FAF9_0%,#EEF3F1_55%,#E8EFED_100%)] pb-28">
        <Header />
        <Container className="py-5">
          <div className="rounded-[32px] bg-white/95 p-6 text-center shadow-[0_20px_50px_rgba(15,23,42,0.08)] ring-1 ring-black/5">
            {lang === "uz" ? "Tekshirilmoqda..." : "Проверяется..."}
          </div>
        </Container>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#F7FAF9_0%,#EEF3F1_55%,#E8EFED_100%)] pb-28">
      <Header />

      <Container className="space-y-5 py-5">
        <div className="overflow-hidden rounded-[32px] bg-white/95 shadow-[0_20px_50px_rgba(15,23,42,0.08)] ring-1 ring-black/5">
          <div className="bg-[#004F45] px-5 pb-6 pt-5 text-white">
            <p className="text-sm text-white/75">
              {lang === "uz"
                ? "Kirish / Ro'yxatdan o'tish"
                : "Вход / Регистрация"}
            </p>

            <h1 className="mt-1 text-[28px] font-bold leading-9">
              {lang === "uz"
                ? "Ma'lumotlaringizni kiriting"
                : "Введите ваши данные"}
            </h1>

            <p className="mt-2 text-sm text-white/80">
              {tgUser?.id
                ? lang === "uz"
                  ? `✅ Telegram ulandi: ${
                      tgUser.username
                        ? `@${tgUser.username}`
                        : tgUser.first_name || "user"
                    }`
                  : `✅ Telegram подключен: ${
                      tgUser.username
                        ? `@${tgUser.username}`
                        : tgUser.first_name || "user"
                    }`
                : lang === "uz"
                ? "ℹ️ Telegram ichida ochilsa ma'lumotlar avtomatik olinadi"
                : "ℹ️ При открытии в Telegram данные заполняются автоматически"}
            </p>

            <div className="mt-4 flex flex-col gap-3">
              <button
                type="button"
                onClick={requestTelegramAutofill}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-white text-sm font-semibold text-[#004F45] shadow-sm active:scale-[0.99]"
              >
                <Send size={17} />
                {lang === "uz"
                  ? "Telegram ma'lumotlarim bilan to'ldirish"
                  : "Заполнить данными Telegram"}
              </button>

              <div className="inline-flex items-center justify-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-medium">
                <ShieldCheck size={16} />
                {lang === "uz" ? "Xavfsiz kirish" : "Безопасный вход"}
              </div>
            </div>
          </div>

          <div className="space-y-4 p-5">
            {telegramStatus ? (
              <div className="rounded-[22px] border border-emerald-100 bg-emerald-50 px-4 py-3 text-xs leading-5 text-emerald-800">
                {telegramStatus}
              </div>
            ) : null}

            <div className="rounded-[22px] bg-[#F8FBFA] p-4 ring-1 ring-black/5">
              <label className="mb-2 flex items-center gap-2 text-xs text-[#5D7E78]">
                <User size={14} />
                {lang === "uz" ? "Ism Familiya" : "Имя и фамилия"}
              </label>

              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={
                  lang === "uz" ? "Ismingizni kiriting" : "Введите ваше имя"
                }
                className="h-12 w-full rounded-2xl border border-black/5 bg-white px-4 outline-none"
              />
            </div>

            <div className="rounded-[22px] bg-[#F8FBFA] p-4 ring-1 ring-black/5">
              <label className="mb-2 flex items-center gap-2 text-xs text-[#5D7E78]">
                <Phone size={14} />
                {lang === "uz" ? "Telefon" : "Телефон"}
              </label>

              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+998 90 123 45 67"
                className="h-12 w-full rounded-2xl border border-black/5 bg-white px-4 outline-none"
              />

              {telegramContactRequested ? (
                <p className="mt-2 text-xs leading-5 text-[#5D7E78]">
                  {lang === "uz"
                    ? "Telegram kontakt so‘rovi yuborildi. Telefon avtomatik tushmasa, uni qo‘lda kiriting."
                    : "Запрос контакта отправлен. Если номер не появился автоматически, введите его вручную."}
                </p>
              ) : (
                <p className="mt-2 text-xs leading-5 text-[#5D7E78]">
                  {lang === "uz"
                    ? "Telefon uchun yuqoridagi Telegram autofill tugmasini bosing yoki qo‘lda kiriting."
                    : "Для телефона нажмите Telegram autofill выше или введите вручную."}
                </p>
              )}
            </div>

            <div className="rounded-[22px] bg-[#F8FBFA] p-4 ring-1 ring-black/5">
              <label className="mb-2 flex items-center gap-2 text-xs text-[#5D7E78]">
                <MapPin size={14} />
                {lang === "uz" ? "Manzil" : "Адрес"}
              </label>

              <DeliveryLocationField
  address={address}
  setAddressAction={setAddress}
  latitude={latitude}
  setLatitudeAction={setLatitude}
  longitude={longitude}
  setLongitudeAction={setLongitude}
/>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-[22px] bg-[#F8FBFA] p-4 ring-1 ring-black/5">
                <label className="mb-2 flex items-center gap-2 text-xs text-[#5D7E78]">
                  <Calendar size={14} />
                  {lang === "uz" ? "Yosh" : "Возраст"}
                </label>

                <input
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="28"
                  type="number"
                  className="h-12 w-full rounded-2xl border border-black/5 bg-white px-4 outline-none"
                />
              </div>

              <div className="rounded-[22px] bg-[#F8FBFA] p-4 ring-1 ring-black/5">
                <label className="mb-2 flex items-center gap-2 text-xs text-[#5D7E78]">
                  <User size={14} />
                  {lang === "uz" ? "Jins" : "Пол"}
                </label>

                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="h-12 w-full rounded-2xl border border-black/5 bg-white px-4 outline-none"
                >
                  <option value="">
                    {lang === "uz" ? "Tanlang" : "Выберите"}
                  </option>
                  <option value="male">
                    {lang === "uz" ? "Erkak" : "Мужской"}
                  </option>
                  <option value="female">
                    {lang === "uz" ? "Ayol" : "Женский"}
                  </option>
                </select>
              </div>
            </div>

            <div className="rounded-[22px] bg-[#F8FBFA] p-4 ring-1 ring-black/5">
              <label className="mb-2 flex items-center gap-2 text-xs text-[#5D7E78]">
                <Building2 size={14} />
                {lang === "uz" ? "Kimligi" : "Статус"}
              </label>

              <select
                value={customerType}
                onChange={(e) => setCustomerType(e.target.value)}
                className="h-12 w-full rounded-2xl border border-black/5 bg-white px-4 outline-none"
              >
                <option value="">
                  {lang === "uz" ? "Tanlang" : "Выберите"}
                </option>
                <option value="dentist">
                  {lang === "uz" ? "Stomatolog" : "Стоматолог"}
                </option>
                <option value="clinic_staff">
                  {lang === "uz" ? "Klinika xodimi" : "Сотрудник клиники"}
                </option>
                <option value="clinic_owner">
                  {lang === "uz" ? "Klinika egasi" : "Владелец клиники"}
                </option>
                <option value="company_representative">
                  {lang === "uz"
                    ? "Kompaniya vakili"
                    : "Представитель компании"}
                </option>
                <option value="regular_customer">
                  {lang === "uz" ? "Oddiy mijoz" : "Обычный клиент"}
                </option>
              </select>
            </div>

            <div className="rounded-[22px] bg-[#F8FBFA] p-4 ring-1 ring-black/5">
              <label className="mb-2 flex items-center gap-2 text-xs text-[#5D7E78]">
                <Building2 size={14} />
                {lang === "uz"
                  ? "Klinika / kompaniya nomi"
                  : "Название клиники / компании"}
              </label>

              <input
                value={clinicName}
                onChange={(e) => setClinicName(e.target.value)}
                placeholder="Dental Clinic"
                className="h-12 w-full rounded-2xl border border-black/5 bg-white px-4 outline-none"
              />
            </div>

            <div className="rounded-[22px] bg-[#F8FBFA] p-4 ring-1 ring-black/5">
              <label className="mb-2 flex items-center gap-2 text-xs text-[#5D7E78]">
                <Send size={14} />
                Telegram username
              </label>

              <input
                value={telegramUsername}
                onChange={(e) => setTelegramUsername(e.target.value)}
                onBlur={(e) =>
                  setTelegramUsername(normalizeTelegramUsername(e.target.value))
                }
                placeholder="@username"
                className="h-12 w-full rounded-2xl border border-black/5 bg-white px-4 outline-none"
              />

              {tgUser?.username ? (
                <p className="mt-2 text-xs text-[#5D7E78]">
                  {lang === "uz"
                    ? `Telegram username avtomatik olindi: @${tgUser.username}`
                    : `Telegram username получен автоматически: @${tgUser.username}`}
                </p>
              ) : (
                <p className="mt-2 text-xs text-[#5D7E78]">
                  {lang === "uz"
                    ? "Agar Telegram profilingizda username bo‘lsa, Mini App ichida avtomatik tushadi."
                    : "Если в профиле Telegram есть username, он заполнится автоматически внутри Mini App."}
                </p>
              )}
            </div>

            <button
              onClick={saveUser}
              disabled={loading}
              className="flex h-14 w-full items-center justify-center rounded-full bg-[#004F45] text-base font-semibold text-white shadow-[0_14px_28px_rgba(0,79,69,0.22)] disabled:opacity-60"
            >
              {loading
                ? lang === "uz"
                  ? "Saqlanmoqda..."
                  : "Сохраняется..."
                : lang === "uz"
                ? "Davom etish"
                : "Продолжить"}
            </button>
          </div>
        </div>
      </Container>

      <BottomNav />
    </div>
  );
}
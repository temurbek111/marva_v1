"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppLang } from "@/components/common/LangProvider";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { Container } from "@/components/ui/Container";
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

type AddressParts = {
  viloyat: string;
  tuman: string;
  street: string;
  houseNumber: string;
};

const VILOYATLAR = [
  "Toshkent shahri",
  "Toshkent viloyati",
  "Andijon viloyati",
  "Buxoro viloyati",
  "Farg‘ona viloyati",
  "Jizzax viloyati",
  "Xorazm viloyati",
  "Namangan viloyati",
  "Navoiy viloyati",
  "Qashqadaryo viloyati",
  "Qoraqalpog‘iston Respublikasi",
  "Samarqand viloyati",
  "Sirdaryo viloyati",
  "Surxondaryo viloyati",
] as const;

const TUMANLAR_BY_VILOYAT: Record<string, string[]> = {
  "Toshkent shahri": [
    "Bektemir",
    "Chilonzor",
    "Mirobod",
    "Mirzo Ulug‘bek",
    "Olmazor",
    "Sergeli",
    "Shayxontohur",
    "Uchtepa",
    "Yakkasaroy",
    "Yashnobod",
    "Yunusobod",
    "Yangi Hayot",
  ],
  "Toshkent viloyati": [
    "Angren shahri",
    "Bekobod",
    "Bekobod shahri",
    "Bo‘ka",
    "Bo‘stonliq",
    "Chinoz",
    "Chirchiq shahri",
    "Ohangaron",
    "Ohangaron shahri",
    "Oqqo‘rg‘on",
    "Olmaliq shahri",
    "Parkent",
    "Piskent",
    "Qibray",
    "Quyi Chirchiq",
    "Toshkent",
    "Yangiyo‘l",
    "Yangiyo‘l shahri",
    "Yuqori Chirchiq",
    "Zangiota",
    "O‘rta Chirchiq",
  ],
  "Andijon viloyati": [
    "Andijon shahri",
    "Andijon",
    "Asaka",
    "Baliqchi",
    "Bo‘ston",
    "Buloqboshi",
    "Izboskan",
    "Jalolquduq",
    "Xo‘jaobod",
    "Qo‘rg‘ontepa",
    "Marhamat",
    "Oltinko‘l",
    "Paxtaobod",
    "Shahrixon",
    "Ulug‘nor",
  ],
  "Buxoro viloyati": [
    "Buxoro shahri",
    "Buxoro",
    "G‘ijduvon",
    "Jondor",
    "Kogon",
    "Kogon shahri",
    "Olot",
    "Peshku",
    "Qorako‘l",
    "Qorovulbozor",
    "Romitan",
    "Shofirkon",
    "Vobkent",
  ],
  "Farg‘ona viloyati": [
    "Farg‘ona shahri",
    "Farg‘ona",
    "Beshariq",
    "Bog‘dod",
    "Buvayda",
    "Dang‘ara",
    "Furqat",
    "Marg‘ilon shahri",
    "Oltiariq",
    "Qo‘qon shahri",
    "Quva",
    "Quvasoy shahri",
    "Rishton",
    "So‘x",
    "Toshloq",
    "Uchko‘prik",
    "Yozyovon",
  ],
  "Jizzax viloyati": [
    "Jizzax shahri",
    "Arnasoy",
    "Baxmal",
    "Do‘stlik",
    "Forish",
    "G‘allaorol",
    "Mirzacho‘l",
    "Paxtakor",
    "Yangiobod",
    "Zafarobod",
    "Zarbdor",
    "Zomin",
    "Sharof Rashidov",
  ],
  "Xorazm viloyati": [
    "Urganch shahri",
    "Bog‘ot",
    "Gurlan",
    "Hazorasp",
    "Xiva",
    "Xiva shahri",
    "Qo‘shko‘pir",
    "Shovot",
    "Tuproqqal’a",
    "Urganch",
    "Xonqa",
    "Yangiariq",
    "Yangibozor",
  ],
  "Namangan viloyati": [
    "Namangan shahri",
    "Chortoq",
    "Chust",
    "Kosonsoy",
    "Mingbuloq",
    "Namangan",
    "Norin",
    "Pop",
    "To‘raqo‘rg‘on",
    "Uchqo‘rg‘on",
    "Uychi",
    "Yangiqo‘rg‘on",
  ],
  "Navoiy viloyati": [
    "Navoiy shahri",
    "Zarafshon shahri",
    "Karmana",
    "Konimex",
    "Navbahor",
    "Nurota",
    "Qiziltepa",
    "Tomdi",
    "Uchquduq",
    "Xatirchi",
  ],
  "Qashqadaryo viloyati": [
    "Qarshi shahri",
    "Shahrisabz shahri",
    "Chiroqchi",
    "Dehqonobod",
    "G‘uzor",
    "Kasbi",
    "Kitob",
    "Koson",
    "Ko‘kdala",
    "Mirishkor",
    "Muborak",
    "Nishon",
    "Qamashi",
    "Qarshi",
    "Shahrisabz",
    "Yakkabog‘",
  ],
  "Qoraqalpog‘iston Respublikasi": [
    "Nukus shahri",
    "Amudaryo",
    "Beruniy",
    "Bo‘zatov",
    "Chimboy",
    "Ellikqal’a",
    "Kegeyli",
    "Mo‘ynoq",
    "Nukus",
    "Qanliko‘l",
    "Qo‘ng‘irot",
    "Qorao‘zak",
    "Shumanay",
    "Taxtako‘pir",
    "Taxiatosh",
    "To‘rtko‘l",
    "Xo‘jayli",
  ],
  "Samarqand viloyati": [
    "Samarqand shahri",
    "Bulung‘ur",
    "Ishtixon",
    "Jomboy",
    "Kattaqo‘rg‘on",
    "Kattaqo‘rg‘on shahri",
    "Narpay",
    "Nurobod",
    "Oqdaryo",
    "Paxtachi",
    "Payariq",
    "Pastdarg‘om",
    "Qo‘shrabot",
    "Samarqand",
    "Toyloq",
    "Urgut",
  ],
  "Sirdaryo viloyati": [
    "Guliston shahri",
    "Yangiyer shahri",
    "Shirin shahri",
    "Boyovut",
    "Guliston",
    "Mirzaobod",
    "Oqoltin",
    "Sayxunobod",
    "Sardoba",
    "Sirdaryo",
    "Xovos",
  ],
  "Surxondaryo viloyati": [
    "Termiz shahri",
    "Angor",
    "Bandixon",
    "Boysun",
    "Denov",
    "Jarqo‘rg‘on",
    "Muzrabot",
    "Oltinsoy",
    "Qiziriq",
    "Qumqo‘rg‘on",
    "Sariosiyo",
    "Sherobod",
    "Sho‘rchi",
    "Termiz",
    "Uzun",
  ],
};

function buildAddress(parts: AddressParts) {
  return [
    parts.viloyat.trim(),
    parts.tuman.trim(),
    parts.street.trim(),
    parts.houseNumber.trim(),
  ]
    .filter(Boolean)
    .join(", ");
}

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

  const [viloyat, setViloyat] = useState("");
  const [tuman, setTuman] = useState("");
  const [street, setStreet] = useState("");
  const [houseNumber, setHouseNumber] = useState("");

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

  const currentTumans = viloyat ? TUMANLAR_BY_VILOYAT[viloyat] ?? [] : [];

  const formattedAddress = buildAddress({
    viloyat,
    tuman,
    street,
    houseNumber,
  });

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

    if (currentTgUser?.username) {
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

  useEffect(() => {
    if (!viloyat) {
      setTuman("");
      return;
    }

    const availableTumans = TUMANLAR_BY_VILOYAT[viloyat] ?? [];

    if (tuman && !availableTumans.includes(tuman)) {
      setTuman("");
    }
  }, [viloyat, tuman]);

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

    if (!viloyat || !tuman || !street.trim() || !houseNumber.trim()) {
      alert(
        lang === "uz"
          ? "Viloyat, tuman, ko‘cha va uy raqamini kiriting"
          : "Выберите область, район, улицу и номер дома"
      );
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
        address: formattedAddress,
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
              <label className="mb-3 flex items-center gap-2 text-xs text-[#5D7E78]">
                <MapPin size={14} />
                {lang === "uz" ? "Manzil" : "Адрес"}
              </label>

              <div className="space-y-3">
                <div>
                  <label className="mb-2 block text-xs font-medium text-[#5D7E78]">
                    {lang === "uz" ? "Viloyat" : "Область"}
                  </label>

                  <select
                    value={viloyat}
                    onChange={(e) => setViloyat(e.target.value)}
                    className="h-12 w-full rounded-2xl border border-black/5 bg-white px-4 outline-none"
                  >
                    <option value="">
                      {lang === "uz"
                        ? "Viloyatni tanlang"
                        : "Выберите область"}
                    </option>

                    {VILOYATLAR.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-medium text-[#5D7E78]">
                    {lang === "uz" ? "Tuman" : "Район"}
                  </label>

                  <select
                    value={tuman}
                    onChange={(e) => setTuman(e.target.value)}
                    disabled={!viloyat}
                    className="h-12 w-full rounded-2xl border border-black/5 bg-white px-4 outline-none disabled:opacity-60"
                  >
                    <option value="">
                      {viloyat
                        ? lang === "uz"
                          ? "Tumanni tanlang"
                          : "Выберите район"
                        : lang === "uz"
                        ? "Avval viloyatni tanlang"
                        : "Сначала выберите область"}
                    </option>

                    {currentTumans.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-medium text-[#5D7E78]">
                    {lang === "uz" ? "Ko‘cha nomi" : "Улица"}
                  </label>

                  <input
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    placeholder={
                      lang === "uz"
                        ? "Masalan: Amir Temur ko‘chasi"
                        : "Например: улица Амира Темура"
                    }
                    className="h-12 w-full rounded-2xl border border-black/5 bg-white px-4 outline-none"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-medium text-[#5D7E78]">
                    {lang === "uz" ? "Uy raqami" : "Номер дома"}
                  </label>

                  <input
                    value={houseNumber}
                    onChange={(e) => setHouseNumber(e.target.value)}
                    placeholder={lang === "uz" ? "Masalan: 12" : "Например: 12"}
                    className="h-12 w-full rounded-2xl border border-black/5 bg-white px-4 outline-none"
                  />
                </div>
              </div>
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


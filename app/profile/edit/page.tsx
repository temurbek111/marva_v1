"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { Container } from "@/components/ui/Container";

type SavedUser = {
  id?: number;
  fullName: string;
  phone: string;
  address: string;
  telegramUsername: string;
  telegramId?: string | number | null;
  age?: number | string | null;
  gender?: string | null;
  customerType?: string | null;
  clinicName?: string | null;
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

function parseAddress(raw: string): AddressParts {
  const value = String(raw || "").trim();

  if (!value || /https?:\/\/|yandex|google|maps/i.test(value)) {
    return {
      viloyat: "",
      tuman: "",
      street: "",
      houseNumber: "",
    };
  }

  const parts = value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  return {
    viloyat: parts[0] || "",
    tuman: parts[1] || "",
    street: parts[2] || "",
    houseNumber: parts.slice(3).join(", "),
  };
}

export default function ProfileEditPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [userId, setUserId] = useState<number | undefined>(undefined);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [telegramUsername, setTelegramUsername] = useState("");
  const [telegramId, setTelegramId] = useState<string | number | null>(null);

  const [viloyat, setViloyat] = useState("");
  const [tuman, setTuman] = useState("");
  const [street, setStreet] = useState("");
  const [houseNumber, setHouseNumber] = useState("");

  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [customerType, setCustomerType] = useState("");
  const [clinicName, setClinicName] = useState("");

  const currentTumans = viloyat ? TUMANLAR_BY_VILOYAT[viloyat] ?? [] : [];

  const formattedAddress = buildAddress({
    viloyat,
    tuman,
    street,
    houseNumber,
  });

  useEffect(() => {
    const saved = localStorage.getItem("marva-user");

    if (!saved) {
      router.push("/auth");
      return;
    }

    try {
      const parsed: SavedUser = JSON.parse(saved);
      const parsedAddress = parseAddress(parsed.address || "");

      setUserId(parsed.id);
      setFullName(parsed.fullName || "");
      setPhone(parsed.phone || "");
      setTelegramUsername(parsed.telegramUsername || "");
      setTelegramId(parsed.telegramId ?? null);

      setViloyat(parsedAddress.viloyat);
      setTuman(parsedAddress.tuman);
      setStreet(parsedAddress.street);
      setHouseNumber(parsedAddress.houseNumber);

      setAge(parsed.age ? String(parsed.age) : "");
      setGender(parsed.gender || "");
      setCustomerType(parsed.customerType || "");
      setClinicName(parsed.clinicName || "");
    } catch {
      router.push("/auth");
      return;
    } finally {
      setLoading(false);
    }
  }, [router]);

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

  const handleSave = () => {
    if (!fullName.trim()) {
      alert("Ism-familyani kiriting");
      return;
    }

    if (!phone.trim()) {
      alert("Telefon raqamni kiriting");
      return;
    }

    if (!viloyat || !tuman || !street.trim() || !houseNumber.trim()) {
      alert("Viloyat, tuman, ko‘cha va uy raqamini kiriting");
      return;
    }

    setSaving(true);

    try {
      const updatedUser: SavedUser = {
        id: userId,
        fullName: fullName.trim(),
        phone: phone.trim(),
        telegramUsername: telegramUsername.trim(),
        address: formattedAddress,
        age: age.trim() || null,
        gender: gender || null,
        customerType: customerType || null,
        clinicName: clinicName.trim() || null,
        telegramId,
      };

      localStorage.setItem("marva-user", JSON.stringify(updatedUser));
      alert("Profil saqlandi");
      router.push("/profile");
    } catch (error) {
      console.error(error);
      alert("Saqlashda xato chiqdi");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F3F6F5] pb-28">
        <Header />
        <Container className="py-4">
          <div className="rounded-[28px] bg-white p-5 text-center text-sm text-[#6B7280] shadow-[0_10px_30px_rgba(15,23,42,0.05)] ring-1 ring-black/5">
            Yuklanmoqda...
          </div>
        </Container>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F3F6F5] pb-28">
      <Header />

      <Container className="space-y-4 py-4">
        <div className="rounded-[28px] bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.05)] ring-1 ring-black/5">
          <div className="text-[24px] font-bold text-[#12332D]">Profilim</div>
          <div className="mt-1 text-sm text-[#6B8A84]">
            Shaxsiy ma’lumotlarni tahrirlash
          </div>
        </div>

        <div className="rounded-[28px] bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.05)] ring-1 ring-black/5">
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-[#12332D]">
                Ism-familya
              </label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ism-familyangiz"
                className="w-full rounded-[18px] border border-[#E3ECE9] bg-[#F9FBFA] px-4 py-4 text-[15px] text-[#12332D] outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-[#12332D]">
                Telefon
              </label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+998..."
                className="w-full rounded-[18px] border border-[#E3ECE9] bg-[#F9FBFA] px-4 py-4 text-[15px] text-[#12332D] outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-[#12332D]">
                Telegram username
              </label>
              <input
                value={telegramUsername}
                onChange={(e) => setTelegramUsername(e.target.value)}
                placeholder="@username"
                className="w-full rounded-[18px] border border-[#E3ECE9] bg-[#F9FBFA] px-4 py-4 text-[15px] text-[#12332D] outline-none"
              />
            </div>

            <div className="space-y-3">
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#12332D]">
                  Viloyat
                </label>
                <select
                  value={viloyat}
                  onChange={(e) => setViloyat(e.target.value)}
                  className="w-full rounded-[18px] border border-[#E3ECE9] bg-[#F9FBFA] px-4 py-4 text-[15px] text-[#12332D] outline-none"
                >
                  <option value="">Viloyatni tanlang</option>
                  {VILOYATLAR.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#12332D]">
                  Tuman
                </label>
                <select
                  value={tuman}
                  onChange={(e) => setTuman(e.target.value)}
                  disabled={!viloyat}
                  className="w-full rounded-[18px] border border-[#E3ECE9] bg-[#F9FBFA] px-4 py-4 text-[15px] text-[#12332D] outline-none disabled:opacity-60"
                >
                  <option value="">
                    {viloyat ? "Tumanni tanlang" : "Avval viloyatni tanlang"}
                  </option>

                  {currentTumans.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#12332D]">
                  Ko‘cha nomi
                </label>
                <input
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  placeholder="Masalan: Amir Temur ko‘chasi"
                  className="w-full rounded-[18px] border border-[#E3ECE9] bg-[#F9FBFA] px-4 py-4 text-[15px] text-[#12332D] outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#12332D]">
                  Uy raqami
                </label>
                <input
                  value={houseNumber}
                  onChange={(e) => setHouseNumber(e.target.value)}
                  placeholder="Masalan: 12"
                  className="w-full rounded-[18px] border border-[#E3ECE9] bg-[#F9FBFA] px-4 py-4 text-[15px] text-[#12332D] outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#12332D]">
                  Yosh
                </label>
                <input
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="Masalan 28"
                  className="w-full rounded-[18px] border border-[#E3ECE9] bg-[#F9FBFA] px-4 py-4 text-[15px] text-[#12332D] outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#12332D]">
                  Jins
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full rounded-[18px] border border-[#E3ECE9] bg-[#F9FBFA] px-4 py-4 text-[15px] text-[#12332D] outline-none"
                >
                  <option value="">Tanlang</option>
                  <option value="male">Erkak</option>
                  <option value="female">Ayol</option>
                </select>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-[#12332D]">
                Mijoz turi
              </label>
              <select
                value={customerType}
                onChange={(e) => setCustomerType(e.target.value)}
                className="w-full rounded-[18px] border border-[#E3ECE9] bg-[#F9FBFA] px-4 py-4 text-[15px] text-[#12332D] outline-none"
              >
                <option value="">Tanlang</option>
                <option value="dentist">Stomatolog</option>
                <option value="clinic_staff">Klinika xodimi</option>
                <option value="clinic_owner">Klinika egasi</option>
                <option value="company_representative">Kompaniya vakili</option>
                <option value="regular_customer">Oddiy mijoz</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-[#12332D]">
                Klinika nomi
              </label>
              <input
                value={clinicName}
                onChange={(e) => setClinicName(e.target.value)}
                placeholder="Masalan: Marva Dental Clinic"
                className="w-full rounded-[18px] border border-[#E3ECE9] bg-[#F9FBFA] px-4 py-4 text-[15px] text-[#12332D] outline-none"
              />
            </div>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex h-14 w-full items-center justify-center rounded-full bg-[#004F45] text-base font-semibold text-white shadow-[0_14px_28px_rgba(0,79,69,0.22)] disabled:opacity-60"
        >
          {saving ? "Saqlanmoqda..." : "Saqlash"}
        </button>
      </Container>

      <BottomNav />
    </div>
  );
}
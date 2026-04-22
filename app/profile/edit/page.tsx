"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { Container } from "@/components/ui/Container";

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

export default function ProfileEditPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [telegramUsername, setTelegramUsername] = useState("");
  const [address, setAddress] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [customerType, setCustomerType] = useState("");
  const [clinicName, setClinicName] = useState("");
  const [telegramId, setTelegramId] = useState<number | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("marva-user");

    if (!saved) {
      router.push("/auth");
      return;
    }

    try {
      const parsed: SavedUser = JSON.parse(saved);

      setFullName(parsed.fullName || "");
      setPhone(parsed.phone || "");
      setTelegramUsername(parsed.telegramUsername || "");
      setAddress(parsed.address || "");
      setAge(parsed.age ? String(parsed.age) : "");
      setGender(parsed.gender || "");
      setCustomerType(parsed.customerType || "");
      setClinicName(parsed.clinicName || "");
      setTelegramId(parsed.telegramId ?? null);
    } catch {
      router.push("/auth");
      return;
    } finally {
      setLoading(false);
    }
  }, [router]);

  const handleSave = () => {
    if (!fullName.trim()) {
      alert("Ism-familyani kiriting");
      return;
    }

    if (!phone.trim()) {
      alert("Telefon raqamni kiriting");
      return;
    }

    if (!address.trim()) {
      alert("Manzilni kiriting");
      return;
    }

    setSaving(true);

    try {
      const updatedUser: SavedUser = {
        fullName: fullName.trim(),
        phone: phone.trim(),
        telegramUsername: telegramUsername.trim(),
        address: address.trim(),
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

            <div>
              <label className="mb-2 block text-sm font-semibold text-[#12332D]">
                Manzil
              </label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={4}
                placeholder="Manzilni kiriting"
                className="w-full rounded-[18px] border border-[#E3ECE9] bg-[#F9FBFA] px-4 py-4 text-[15px] text-[#12332D] outline-none"
              />
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
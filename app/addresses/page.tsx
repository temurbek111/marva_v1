"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { Container } from "@/components/ui/Container";
import {
  MapPin,
  Save,
  Home,
  Building2,
  Check,
  Navigation,
  Landmark,
} from "lucide-react";

type SavedUser = {
  id?: number | string;
  fullName?: string;
  phone?: string;
  address?: string;
  telegramUsername?: string;
  telegramId?: number | string | null;
  addressNote?: string;
  apartment?: string;
  entrance?: string;
  floor?: string;
  addressType?: "home" | "clinic";
};

export default function AddressesPage() {
  const router = useRouter();

  const [user, setUser] = useState<SavedUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [address, setAddress] = useState("");
  const [addressNote, setAddressNote] = useState("");
  const [apartment, setApartment] = useState("");
  const [entrance, setEntrance] = useState("");
  const [floor, setFloor] = useState("");
  const [addressType, setAddressType] = useState<"home" | "clinic">("home");

  useEffect(() => {
    const saved = localStorage.getItem("marva-user");

    if (!saved) {
      router.push("/auth");
      return;
    }

    try {
      const parsed: SavedUser = JSON.parse(saved);
      setUser(parsed);
      setAddress(parsed.address || "");
      setAddressNote(parsed.addressNote || "");
      setApartment(parsed.apartment || "");
      setEntrance(parsed.entrance || "");
      setFloor(parsed.floor || "");
      setAddressType(parsed.addressType === "clinic" ? "clinic" : "home");
    } catch {
      router.push("/auth");
      return;
    } finally {
      setLoading(false);
    }
  }, [router]);

  const handleSave = () => {
    if (!user) return;

    if (!address.trim()) {
      alert("Manzilni kiriting");
      return;
    }

    setSaving(true);

    try {
      const updatedUser: SavedUser = {
        ...user,
        address: address.trim(),
        addressNote: addressNote.trim(),
        apartment: apartment.trim(),
        entrance: entrance.trim(),
        floor: floor.trim(),
        addressType,
      };

      localStorage.setItem("marva-user", JSON.stringify(updatedUser));
      setUser(updatedUser);
      alert("Manzil saqlandi");
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
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F4F7F6] text-[#12332D]">
              <MapPin size={26} />
            </div>

            <div>
              <div className="text-[22px] font-bold text-[#12332D]">
                Manzilni tanlash
              </div>
              <div className="mt-1 text-sm text-[#6B8A84]">
                Karta-uslubida tanlang va saqlang
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-[32px] bg-white shadow-[0_10px_30px_rgba(15,23,42,0.05)] ring-1 ring-black/5">
          <div className="relative h-[340px] overflow-hidden bg-[linear-gradient(180deg,#EAF4F1_0%,#DDEBE6_100%)]">
            <div className="absolute left-[-30px] top-[56px] h-[18px] w-[220px] rotate-[12deg] rounded-full bg-white/70" />
            <div className="absolute right-[-20px] top-[92px] h-[16px] w-[210px] rotate-[-10deg] rounded-full bg-white/70" />
            <div className="absolute left-[30px] top-[170px] h-[18px] w-[250px] rotate-[-8deg] rounded-full bg-white/75" />
            <div className="absolute right-[10px] top-[210px] h-[16px] w-[180px] rotate-[11deg] rounded-full bg-white/70" />

            <div className="absolute left-[22px] top-[44px] h-16 w-16 rounded-[22px] bg-white/60" />
            <div className="absolute right-[28px] top-[54px] h-20 w-20 rounded-[26px] bg-white/60" />
            <div className="absolute left-[44px] bottom-[88px] h-14 w-24 rounded-[24px] bg-white/60" />
            <div className="absolute right-[40px] bottom-[92px] h-16 w-16 rounded-[20px] bg-white/60" />

            <div className="absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-[72%]">
              <div className="relative">
                <div className="absolute left-1/2 top-[44px] h-5 w-5 -translate-x-1/2 rounded-full bg-[#004F45]/20 blur-md" />
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-[0_10px_30px_rgba(0,79,69,0.18)] ring-4 ring-white/60">
                  <MapPin size={30} className="text-[#004F45]" />
                </div>
              </div>
            </div>

            <div className="absolute left-4 right-4 top-4 z-10 flex items-center justify-between">
              <div className="rounded-full bg-white/90 px-4 py-2 text-xs font-semibold text-[#12332D] shadow-sm backdrop-blur">
                Manzil markaziy pin bo‘yicha tanlanadi
              </div>

              <button
                type="button"
                className="flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-[#12332D] shadow-sm backdrop-blur"
              >
                <Navigation size={20} />
              </button>
            </div>

            <div className="absolute inset-x-0 bottom-0 z-10 bg-[linear-gradient(180deg,rgba(243,246,245,0)_0%,rgba(243,246,245,0.2)_18%,rgba(255,255,255,1)_100%)] px-4 pb-4 pt-20">
              <div className="rounded-[26px] bg-white p-4 shadow-[0_12px_28px_rgba(15,23,42,0.08)] ring-1 ring-black/5">
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#F4F7F6] text-[#004F45]">
                    <Landmark size={22} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold uppercase tracking-[0.08em] text-[#6B8A84]">
                      Tanlangan manzil
                    </div>
                    <div className="mt-1 line-clamp-2 text-[16px] font-bold leading-6 text-[#12332D]">
                      {address.trim() || "Manzil hali kiritilmagan"}
                    </div>
                    {addressNote ? (
                      <div className="mt-1 text-sm text-[#6B8A84]">
                        {addressNote}
                      </div>
                    ) : null}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#004F45] text-sm font-semibold text-white shadow-[0_14px_28px_rgba(0,79,69,0.18)] disabled:opacity-60"
                >
                  <Check size={18} />
                  {saving ? "Saqlanmoqda..." : "Shu manzilni tanlash"}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[28px] bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.05)] ring-1 ring-black/5">
          <div className="mb-4 text-[16px] font-bold text-[#12332D]">
            Manzil turi
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setAddressType("home")}
              className={`flex items-center gap-3 rounded-[22px] px-4 py-4 text-left ring-1 transition ${
                addressType === "home"
                  ? "bg-[#ECF8F3] text-[#0A7A5A] ring-[#BEE5D7]"
                  : "bg-[#F8FBFA] text-[#12332D] ring-black/5"
              }`}
            >
              <Home size={22} />
              <div>
                <div className="font-semibold">Uy</div>
                <div className="text-xs opacity-70">Asosiy manzil</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setAddressType("clinic")}
              className={`flex items-center gap-3 rounded-[22px] px-4 py-4 text-left ring-1 transition ${
                addressType === "clinic"
                  ? "bg-[#ECF8F3] text-[#0A7A5A] ring-[#BEE5D7]"
                  : "bg-[#F8FBFA] text-[#12332D] ring-black/5"
              }`}
            >
              <Building2 size={22} />
              <div>
                <div className="font-semibold">Klinika</div>
                <div className="text-xs opacity-70">Ish joyi manzili</div>
              </div>
            </button>
          </div>
        </div>

        <div className="rounded-[28px] bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.05)] ring-1 ring-black/5">
          <div className="mb-4 text-[16px] font-bold text-[#12332D]">
            Manzil tafsilotlari
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-[#12332D]">
                Asosiy manzil
              </label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={4}
                placeholder="Masalan: Toshkent sh., Chilonzor tumani, ..."
                className="w-full rounded-[22px] border border-[#E3ECE9] bg-[#F9FBFA] px-4 py-4 text-[15px] text-[#12332D] outline-none placeholder:text-[#93A6A1]"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-[#12332D]">
                Mo‘ljal
              </label>
              <input
                value={addressNote}
                onChange={(e) => setAddressNote(e.target.value)}
                placeholder="Masalan: Korzinka yonida"
                className="w-full rounded-[18px] border border-[#E3ECE9] bg-[#F9FBFA] px-4 py-4 text-[15px] text-[#12332D] outline-none placeholder:text-[#93A6A1]"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#12332D]">
                  Xonadon
                </label>
                <input
                  value={apartment}
                  onChange={(e) => setApartment(e.target.value)}
                  placeholder="12"
                  className="w-full rounded-[18px] border border-[#E3ECE9] bg-[#F9FBFA] px-4 py-4 text-[15px] text-[#12332D] outline-none placeholder:text-[#93A6A1]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#12332D]">
                  Pod’ezd
                </label>
                <input
                  value={entrance}
                  onChange={(e) => setEntrance(e.target.value)}
                  placeholder="2"
                  className="w-full rounded-[18px] border border-[#E3ECE9] bg-[#F9FBFA] px-4 py-4 text-[15px] text-[#12332D] outline-none placeholder:text-[#93A6A1]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#12332D]">
                  Qavat
                </label>
                <input
                  value={floor}
                  onChange={(e) => setFloor(e.target.value)}
                  placeholder="4"
                  className="w-full rounded-[18px] border border-[#E3ECE9] bg-[#F9FBFA] px-4 py-4 text-[15px] text-[#12332D] outline-none placeholder:text-[#93A6A1]"
                />
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-[#004F45] text-base font-semibold text-white shadow-[0_14px_28px_rgba(0,79,69,0.22)] disabled:opacity-60"
        >
          <Save size={18} />
          {saving ? "Saqlanmoqda..." : "Manzilni saqlash"}
        </button>

        <div className="rounded-[24px] bg-[#F8FBFA] p-4 text-sm leading-6 text-[#6B8A84] ring-1 ring-black/5">
          Hozir bu <span className="font-semibold text-[#12332D]">map-style UI</span>.
          Keyingi qadamda real karta va pin bilan tanlash ulanadi.
        </div>
      </Container>

      <BottomNav />
    </div>
  );
}
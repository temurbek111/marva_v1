"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { Container } from "@/components/ui/Container";
import { supabase } from "@/lib/supabase";

type CustomerItem = {
  id: number;
  full_name: string;
  phone: string;
  address: string | null;
  age: number | null;
  gender: string | null;
  customer_type: string | null;
  clinic_name: string | null;
  telegram_username: string | null;
  telegram_id: number | null;
  created_at: string;
};

function getGenderLabel(value?: string | null) {
  if (!value) return "—";
  if (value === "male") return "Erkak";
  if (value === "female") return "Ayol";
  return value;
}

function getCustomerTypeLabel(value?: string | null) {
  if (!value) return "—";

  const map: Record<string, string> = {
    dentist: "Stomatolog",
    clinic_staff: "Klinika xodimi",
    clinic_owner: "Klinika egasi",
    company_representative: "Kompaniya vakili",
    regular_customer: "Oddiy mijoz",
  };

  return map[value] || value;
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [customerTypeFilter, setCustomerTypeFilter] = useState("all");

  const loadCustomers = async () => {
    try {
      if (!supabase) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("users")
        .select("*")
        .order("id", { ascending: false });

      if (error) {
        console.log(error);
        setCustomers([]);
        setLoading(false);
        return;
      }

      setCustomers((data as CustomerItem[]) || []);
      setLoading(false);
    } catch (error) {
      console.log(error);
      setCustomers([]);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const filteredCustomers = useMemo(() => {
    const q = search.trim().toLowerCase();

    return customers.filter((customer) => {
      const haystack = [
        customer.full_name,
        customer.phone,
        customer.address,
        customer.customer_type,
        customer.clinic_name,
        customer.telegram_username,
        customer.telegram_id ? String(customer.telegram_id) : "",
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = !q || haystack.includes(q);
      const matchesType =
        customerTypeFilter === "all" ||
        customer.customer_type === customerTypeFilter;

      return matchesSearch && matchesType;
    });
  }, [customers, search, customerTypeFilter]);

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#F7FAF9_0%,#EEF3F1_55%,#E8EFED_100%)] pb-28">
      <Header />

      <Container className="py-5 space-y-5">
        <div className="rounded-[32px] bg-white p-5 shadow-soft">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-marva-700/70">Admin panel</p>
              <h1 className="mt-1 text-2xl font-bold text-marva-900">
                Mijozlar bazasi
              </h1>
              <p className="mt-2 text-sm text-marva-700/75">
                Ro‘yxatdan o‘tgan foydalanuvchilar ro‘yxati
              </p>
            </div>

            <Link
              href="/admin"
              className="rounded-full bg-marva-50 px-4 py-2 text-sm font-semibold text-marva-700"
            >
              Orqaga
            </Link>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Ism, telefon, username bo‘yicha qidirish"
              className="w-full rounded-[20px] border border-marva-100 px-4 py-3 text-sm outline-none"
            />

            <select
              value={customerTypeFilter}
              onChange={(e) => setCustomerTypeFilter(e.target.value)}
              className="w-full rounded-[20px] border border-marva-100 px-4 py-3 text-sm outline-none"
            >
              <option value="all">Barcha mijozlar</option>
              <option value="dentist">Stomatolog</option>
              <option value="clinic_staff">Klinika xodimi</option>
              <option value="clinic_owner">Klinika egasi</option>
              <option value="company_representative">Kompaniya vakili</option>
              <option value="regular_customer">Oddiy mijoz</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="rounded-[28px] bg-white p-5 shadow-soft">
            Yuklanmoqda...
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="rounded-[28px] bg-white p-5 shadow-soft">
            {search.trim() || customerTypeFilter !== "all"
              ? "Filter bo‘yicha mijoz topilmadi"
              : "Hali mijozlar yo‘q"}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredCustomers.map((customer) => (
              <div
                key={customer.id}
                className="rounded-[28px] bg-white p-5 shadow-soft"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-marva-900">
                      {customer.full_name || "Nomsiz foydalanuvchi"}
                    </h2>
                    <p className="mt-1 text-sm text-marva-700/75">
                      {customer.phone || "Telefon yo‘q"}
                    </p>
                  </div>

                  <div className="rounded-full bg-marva-50 px-3 py-1 text-xs font-semibold text-marva-700">
                    #{customer.id}
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[20px] bg-[#F8FBFA] p-4 ring-1 ring-black/5">
                    <p className="text-xs text-[#5D7E78]">Manzil</p>
                    <p className="mt-1 font-semibold text-[#12332D]">
                      {customer.address || "—"}
                    </p>
                  </div>

                  <div className="rounded-[20px] bg-[#F8FBFA] p-4 ring-1 ring-black/5">
                    <p className="text-xs text-[#5D7E78]">Yosh</p>
                    <p className="mt-1 font-semibold text-[#12332D]">
                      {customer.age || "—"}
                    </p>
                  </div>

                  <div className="rounded-[20px] bg-[#F8FBFA] p-4 ring-1 ring-black/5">
                    <p className="text-xs text-[#5D7E78]">Jins</p>
                    <p className="mt-1 font-semibold text-[#12332D]">
                      {getGenderLabel(customer.gender)}
                    </p>
                  </div>

                  <div className="rounded-[20px] bg-[#F8FBFA] p-4 ring-1 ring-black/5">
                    <p className="text-xs text-[#5D7E78]">Mijoz turi</p>
                    <p className="mt-1 font-semibold text-[#12332D]">
                      {getCustomerTypeLabel(customer.customer_type)}
                    </p>
                  </div>

                  <div className="rounded-[20px] bg-[#F8FBFA] p-4 ring-1 ring-black/5">
                    <p className="text-xs text-[#5D7E78]">Klinika / kompaniya</p>
                    <p className="mt-1 font-semibold text-[#12332D]">
                      {customer.clinic_name || "—"}
                    </p>
                  </div>

                  <div className="rounded-[20px] bg-[#F8FBFA] p-4 ring-1 ring-black/5">
                    <p className="text-xs text-[#5D7E78]">Telegram username</p>
                    <p className="mt-1 font-semibold text-[#12332D]">
                      {customer.telegram_username || "—"}
                    </p>
                  </div>

                  <div className="rounded-[20px] bg-[#F8FBFA] p-4 ring-1 ring-black/5 sm:col-span-2">
                    <p className="text-xs text-[#5D7E78]">Telegram ID</p>
                    <p className="mt-1 font-semibold text-[#12332D]">
                      {customer.telegram_id || "—"}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Container>

      <BottomNav />
    </div>
  );
}
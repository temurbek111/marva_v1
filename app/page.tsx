"use client";

import { useAppLang } from "@/components/common/LangProvider";
import { LangSwitcher } from "@/components/common/LangSwitcher";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  ChevronRight,
  Layers,
  Wrench,
  Smile,
  Syringe,
} from "lucide-react";
import { BottomNav } from "@/components/layout/BottomNav";
import { Header } from "@/components/layout/Header";
import { supabase } from "@/lib/supabase";

const categories = [
  {
    name: { uz: "Plombalar", ru: "Пломбы" },
    slug: "plombalar",
    desc: {
      uz: "Kompozit va flow materiallar",
      ru: "Композитные и flow материалы",
    },
    icon: "tooth",
  },
  {
    name: { uz: "Ortopedia", ru: "Ортопедия" },
    slug: "ortopedia",
    desc: {
      uz: "Koronka va sarf materiallar",
      ru: "Коронки и расходные материалы",
    },
    icon: "layers",
  },
  {
    name: { uz: "Instrumentlar", ru: "Инструменты" },
    slug: "instrumentlar",
    desc: {
      uz: "Stomatologik asboblar",
      ru: "Стоматологические инструменты",
    },
    icon: "wrench",
  },
  {
    name: { uz: "Endodontiya", ru: "Эндодонтия" },
    slug: "endodontiya",
    desc: {
      uz: "Kanal uchun materiallar",
      ru: "Материалы для каналов",
    },
    icon: "syringe",
  },
];

type HomeProduct = {
  id: number;
  name: string;
  price: number;
  image_url: string | null;
  images?: string[] | null;
  description: string | null;
};

type HeroBanner = {
  id: number;
  title: string | null;
  subtitle: string | null;
  media_type: "image" | "video";
  media_url: string | null;
  button_text: string | null;
  button_link: string | null;
  is_active: boolean;
  sort_order: number;
};

function CategoryIcon({ name }: { name: string }) {
  if (name === "tooth") return <Smile size={18} strokeWidth={2.2} />;
  if (name === "layers") return <Layers size={18} strokeWidth={2.2} />;
  if (name === "wrench") return <Wrench size={18} strokeWidth={2.2} />;
  if (name === "syringe") return <Syringe size={18} strokeWidth={2.2} />;
  return <Smile size={18} strokeWidth={2.2} />;
}

export default function HomePage() {
  const { lang, mounted } = useAppLang();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [products, setProducts] = useState<HomeProduct[]>([]);
  const [banners, setBanners] = useState<HeroBanner[]>([]);
  const [activeBanner, setActiveBanner] = useState(0);

  const currentBanner = useMemo(
    () => banners[activeBanner] || null,
    [banners, activeBanner]
  );

  const goSearch = () => {
    if (search.trim()) {
      router.push(`/catalog?q=${encodeURIComponent(search)}`);
    } else {
      router.push("/catalog");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") goSearch();
  };

  function handleBannerClick(link?: string | null) {
    if (!link) return;

    if (link.startsWith("http://") || link.startsWith("https://")) {
      window.location.href = link;
      return;
    }

    router.push(link);
  }

  async function loadProducts() {
    if (!supabase) return;

    const { data, error } = await supabase
      .from("products")
      .select("id,name,price,image_url,images,description")
      .eq("is_active", true)
      .order("id", { ascending: false })
      .limit(6);

    if (error) {
      console.error(error);
      return;
    }

    setProducts(data || []);
  }

  async function loadBanners() {
    if (!supabase) return;

    const { data, error } = await supabase
      .from("hero_banners")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("id", { ascending: false });

    if (error) {
      console.error(error);
      return;
    }

    setBanners(data || []);
  }

  useEffect(() => {
    loadProducts();
    loadBanners();
  }, []);

  useEffect(() => {
    if (banners.length <= 1) return;

    const timer = setInterval(() => {
      setActiveBanner((prev) => (prev + 1) % banners.length);
    }, 4000);

    return () => clearInterval(timer);
  }, [banners]);

  if (!mounted) return null;

  return (
    <>
      <main className="min-h-screen bg-[#F1F5F4] pb-28">
        <Header />

        <div className="mx-auto flex w-full max-w-md justify-end px-3 pt-2">
          <LangSwitcher />
        </div>

        <div className="mx-auto w-full max-w-md px-3 pt-3">
          <section className="rounded-[30px] bg-white p-3 shadow-[0_12px_30px_rgba(15,23,42,0.06)] ring-1 ring-black/5">
            {currentBanner ? (
              <div className="relative overflow-hidden rounded-[26px] bg-[linear-gradient(135deg,#005B4F_0%,#00473F_100%)] text-white shadow-[0_18px_40px_rgba(0,79,69,0.25)]">
                {currentBanner.media_url ? (
                  <>
                    {currentBanner.media_type === "video" ? (
                      <video
                        src={currentBanner.media_url}
                        className="absolute inset-0 h-full w-full object-cover"
                        muted
                        autoPlay
                        loop
                        playsInline
                      />
                    ) : (
                      <img
                        src={currentBanner.media_url}
                        alt={currentBanner.title || "banner"}
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                    )}

                    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.08)_0%,rgba(0,32,28,0.38)_34%,rgba(0,48,42,0.92)_100%)]" />
                  </>
                ) : null}

                <div className="relative flex min-h-[290px] flex-col justify-end p-5 text-white">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-white/70">
                    Dental market
                  </p>

                  <h2 className="mt-2 text-[26px] font-bold leading-[1.05]">
                    {currentBanner.title || "MARVA Dental shop"}
                  </h2>

                  {currentBanner.subtitle ? (
                    <p className="mt-2 text-sm text-white/85">
                      {currentBanner.subtitle}
                    </p>
                  ) : null}

                  <div className="mt-4 flex items-center gap-2">
                    <button
                      onClick={() => handleBannerClick(currentBanner.button_link)}
                      className="rounded-full border border-white/20 bg-white/14 px-4 py-2.5 text-[13px] font-semibold text-white backdrop-blur-md"
                    >
                      {currentBanner.button_text ||
                        (lang === "uz" ? "Ko‘rish" : "Смотреть")}
                    </button>

                    <button
                      onClick={goSearch}
                      className="rounded-full border border-white/15 bg-black/20 px-4 py-2.5 text-[13px] font-semibold text-white backdrop-blur-md"
                    >
                      {lang === "uz" ? "Katalog" : "Каталог"}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-[26px] bg-[linear-gradient(135deg,#005B4F_0%,#00473F_100%)] p-4 text-white shadow-[0_18px_40px_rgba(0,79,69,0.25)]">
                <p className="text-[11px] uppercase tracking-[0.24em] text-white/65">
                  Dental market
                </p>
                <h2 className="mt-2 text-[28px] font-bold leading-[1.05]">
                  {lang === "uz"
                    ? "Klinikangiz uchun"
                    : "Для вашей клиники"}
                  <br />
                  {lang === "uz"
                    ? "kerakli jihozlar"
                    : "нужное оборудование"}
                </h2>
                <p className="mt-2 text-sm text-white/75">
                  {lang === "uz"
                    ? "Dental mahsulotlarni tez toping va buyurtma bering"
                    : "Быстро находите и заказывайте стоматологические товары"}
                </p>
              </div>
            )}

            {banners.length > 1 && (
              <div className="mt-3 flex items-center justify-center gap-2">
                {banners.map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setActiveBanner(index)}
                    className={`rounded-full transition-all ${
                      activeBanner === index
                        ? "h-2.5 w-8 bg-[#005B4F]"
                        : "h-2.5 w-2.5 bg-[#CFE0DC]"
                    }`}
                  />
                ))}
              </div>
            )}

            <div className="mt-3 rounded-[22px] bg-[#F4F7F6] p-2">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-[#004F45]">
                  <Search size={18} />
                </div>

                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    lang === "uz" ? "Mahsulot qidiring..." : "Поиск товара..."
                  }
                  className="h-10 min-w-0 flex-1 bg-transparent text-[15px] text-[#12332D] outline-none placeholder:text-[#94A3B8]"
                />

                <button
                  onClick={goSearch}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#083B35] text-white"
                  aria-label={lang === "uz" ? "Qidirish" : "Поиск"}
                >
                  <Search size={18} />
                </button>
              </div>
            </div>
          </section>

          <section className="mt-5">
            <div className="mb-3 flex items-end justify-between">
              <div>
                <h3 className="text-[28px] font-bold leading-none text-[#12332D]">
                  {lang === "uz" ? "Kategoriyalar" : "Категории"}
                </h3>
                <p className="mt-1 text-sm text-[#6B8A84]">
                  {lang === "uz" ? "Asosiy bo‘limlar" : "Основные разделы"}
                </p>
              </div>

              <button
                onClick={() => router.push("/catalog")}
                className="flex items-center gap-1 text-sm font-semibold text-[#005B4F]"
              >
                {lang === "uz" ? "Barchasi" : "Все"}
                <ChevronRight size={16} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {categories.map((item, index) => (
                <button
                  key={item.slug}
                  onClick={() => router.push(`/catalog?category=${item.slug}`)}
                  className={`rounded-[26px] p-4 text-left shadow-[0_12px_28px_rgba(15,23,42,0.05)] ring-1 ring-black/5 ${
                    index === 0
                      ? "bg-[linear-gradient(135deg,#FFFFFF_0%,#F2F8F6_100%)]"
                      : "bg-white"
                  }`}
                >
                  <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F3F7F6] text-[#005B4F]">
                    <CategoryIcon name={item.icon} />
                  </div>

                  <h4 className="text-[21px] font-bold leading-tight text-[#12332D]">
                    {item.name[lang]}
                  </h4>

                  <p className="mt-2 text-[13px] leading-5 text-[#6B8A84]">
                    {item.desc[lang]}
                  </p>
                </button>
              ))}
            </div>
          </section>

          <section className="mt-6">
            <div className="mb-3 flex items-end justify-between">
              <div>
                <h3 className="text-[28px] font-bold leading-none text-[#12332D]">
                  {lang === "uz"
                    ? "Mashhur mahsulotlar"
                    : "Популярные товары"}
                </h3>
                <p className="mt-1 text-sm text-[#6B8A84]">
                  {lang === "uz" ? "Ko‘p ko‘rilayotganlar" : "Самые популярные"}
                </p>
              </div>

              <button
                onClick={() => router.push("/catalog")}
                className="flex items-center gap-1 text-sm font-semibold text-[#005B4F]"
              >
                {lang === "uz" ? "Ko‘rish" : "Смотреть"}
                <ChevronRight size={16} />
              </button>
            </div>

            <div className="space-y-3">
              {products.length === 0 ? (
                <div className="rounded-[26px] bg-white p-4 text-sm text-[#6B8A84] shadow-[0_12px_28px_rgba(15,23,42,0.05)] ring-1 ring-black/5">
                  {lang === "uz"
                    ? "Hozircha mahsulot yo‘q"
                    : "Пока товаров нет"}
                </div>
              ) : (
                products.map((item) => {
                  const previewImage = item.images?.[0] || item.image_url || "";

                  return (
                    <button
                      key={item.id}
                      onClick={() => router.push(`/product/${item.id}`)}
                      className="flex w-full items-center gap-3 rounded-[26px] bg-white p-3 text-left shadow-[0_12px_28px_rgba(15,23,42,0.05)] ring-1 ring-black/5"
                    >
                      <div className="flex h-[92px] w-[92px] shrink-0 items-center justify-center overflow-hidden rounded-[22px] bg-[#F3F7F6]">
                        {previewImage ? (
                          <img
                            src={previewImage}
                            alt={item.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Layers size={24} className="text-[#0B5D52]" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-[#6B8A84] line-clamp-1">
                          {item.description ||
                            (lang === "uz"
                              ? "Dental mahsulot"
                              : "Стоматологический товар")}
                        </p>

                        <h4 className="mt-1 line-clamp-2 text-[18px] font-bold leading-6 text-[#12332D]">
                          {item.name}
                        </h4>

                        <div className="mt-3 flex items-center justify-between gap-2">
                          <div className="text-[24px] font-bold leading-none text-[#005B4F]">
                            ${item.price}
                          </div>

                          <div className="rounded-full bg-[#005B4F] px-4 py-2 text-xs font-semibold text-white">
                            {lang === "uz" ? "Ko‘rish" : "Смотреть"}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </section>
        </div>
      </main>

      <BottomNav />
    </>
  );
}
"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Search, ArrowLeft } from "lucide-react";

import { useAppLang } from "@/components/common/LangProvider";
import { BottomNav } from "@/components/layout/BottomNav";
import { Container } from "@/components/ui/Container";
import { ProductCard } from "@/components/product/ProductCard";

export type ProductRow = {
  id: number | string;
  category_id?: number | string | null;
  name?: string | null;
  price?: number | null;
  old_price?: number | null;
  images?: string[] | null;
  image_url?: string | null;
  description?: string | null;
  stock?: number | null;
  is_featured?: boolean | null;
  is_active?: boolean | null;
  use_category?: string | null;
  type_category?: string | null;
  tags?: string[] | null;
};

type UseCategory =
  | "all"
  | "terapiya"
  | "endodontiya"
  | "ortopediya"
  | "jarrohlik"
  | "gigiyena"
  | "uskunalar"
  | "umumiy";

type TypeCategory =
  | "all"
  | "material"
  | "instrument"
  | "rasxodnik"
  | "uskuna"
  | "aksessuar";

type CatalogProduct = {
  id: string;
  slug: string;
  categoryId: string;
  name: string;
  price: number;
  oldPrice?: number;
  currency: string;
  image: string;
  shortDescription: string;
  description: string;
  stock: number;
  featured: boolean;
  useCategory: Exclude<UseCategory, "all">;
  typeCategory: Exclude<TypeCategory, "all">;
};

type CatalogPageClientProps = {
  initialProducts: ProductRow[];
};

function normalizeText(value?: string | null) {
  return String(value || "").trim().toLowerCase();
}

function containsAny(source: string, keywords: string[]) {
  return keywords.some((keyword) => source.includes(keyword));
}

function detectUseCategory(
  name?: string | null,
  description?: string | null
): Exclude<UseCategory, "all"> {
  const text = `${normalizeText(name)} ${normalizeText(description)}`;

  if (
    containsAny(text, [
      "endo",
      "gutta",
      "sealer",
      "root canal",
      "canal",
      "obturation",
      "file",
      "reamer",
      "broach",
      "mta",
      "edta",
      "naocl",
    ])
  ) {
    return "endodontiya";
  }

  if (
    containsAny(text, [
      "crown",
      "bridge",
      "veneer",
      "silicone",
      "silikon",
      "impression",
      "prost",
      "temporary crown",
    ])
  ) {
    return "ortopediya";
  }

  if (
    containsAny(text, [
      "extract",
      "forceps",
      "elevator",
      "surgery",
      "surgical",
      "implant",
      "scalpel",
      "suture",
    ])
  ) {
    return "jarrohlik";
  }

  if (
    containsAny(text, [
      "whitening",
      "bleach",
      "prophy",
      "paste",
      "polish",
      "floss",
      "toothbrush",
      "hygiene",
    ])
  ) {
    return "gigiyena";
  }

  if (
    containsAny(text, [
      "chair",
      "kreslo",
      "xray",
      "x-ray",
      "rentgen",
      "sensor",
      "camera",
      "kamera",
      "monitor",
      "unit",
      "scaler",
      "autoclave",
      "sterilizer",
      "compressor",
      "micromotor",
      "light cure",
      "lamp",
      "lampa",
    ])
  ) {
    return "uskunalar";
  }

  if (
    containsAny(text, [
      "bond",
      "composite",
      "cement",
      "etch",
      "flow",
      "resin",
      "liner",
      "adhesive",
      "seal",
      "filling",
      "plomba",
    ])
  ) {
    return "terapiya";
  }

  return "umumiy";
}

function detectTypeCategory(
  name?: string | null,
  description?: string | null
): Exclude<TypeCategory, "all"> {
  const text = `${normalizeText(name)} ${normalizeText(description)}`;

  if (
    containsAny(text, [
      "chair",
      "kreslo",
      "xray",
      "x-ray",
      "rentgen",
      "sensor",
      "camera",
      "kamera",
      "monitor",
      "unit",
      "scaler",
      "autoclave",
      "sterilizer",
      "compressor",
      "micromotor",
      "lamp",
      "lampa",
      "apex locator",
    ])
  ) {
    return "uskuna";
  }

  if (
    containsAny(text, [
      "forceps",
      "elevator",
      "mirror",
      "probe",
      "clamp",
      "plier",
      "scissor",
      "holder",
      "tweezer",
      "instrument",
      "spatula",
      "file",
      "reamer",
    ])
  ) {
    return "instrument";
  }

  if (
    containsAny(text, [
      "glove",
      "mask",
      "tips",
      "tip ",
      "micro applicator",
      "applicator",
      "needle",
      "barrier",
      "bib",
      "paket",
      "sleeve",
      "cotton",
      "roll",
      "pellet",
      "disposable",
      "bir martalik",
      "ejector",
    ])
  ) {
    return "rasxodnik";
  }

  if (
    containsAny(text, [
      "bond",
      "composite",
      "cement",
      "etch",
      "flow",
      "resin",
      "liner",
      "adhesive",
      "seal",
      "filling",
      "plomba",
      "gutta",
      "sealer",
      "mta",
      "paste",
      "gel",
      "silicone",
      "silikon",
    ])
  ) {
    return "material";
  }

  return "aksessuar";
}

function buildCatalogProducts(rawProducts: ProductRow[]): CatalogProduct[] {
  return rawProducts.map((product) => {
    const detectedUse = detectUseCategory(product.name, product.description);
    const detectedType = detectTypeCategory(product.name, product.description);

    return {
      id: String(product.id),
      slug: `product-${product.id}`,
      categoryId: product.category_id ? String(product.category_id) : "",
      name: product.name || "Nomsiz mahsulot",
      price: Number(product.price || 0),
      oldPrice: product.old_price ? Number(product.old_price) : undefined,
      currency: "USD",
      image: product.images?.[0] || product.image_url || "",
      shortDescription: product.description || "Dental mahsulot",
      description: product.description || "Dental mahsulot",
      stock: Number(product.stock || 0),
      featured: Boolean(product.is_featured),
      useCategory:
        (product.use_category as Exclude<UseCategory, "all"> | null) ||
        detectedUse,
      typeCategory:
        (product.type_category as Exclude<TypeCategory, "all"> | null) ||
        detectedType,
    };
  });
}

export default function CatalogPageClient({
  initialProducts,
}: CatalogPageClientProps) {
  const { lang, mounted } = useAppLang();
  const searchParams = useSearchParams();

  const allProducts = useMemo(
    () => buildCatalogProducts(initialProducts),
    [initialProducts]
  );

  const activeUse = (searchParams.get("use") || "all") as UseCategory;
  const activeType = (searchParams.get("type") || "all") as TypeCategory;
  const searchQuery = searchParams.get("q")?.trim() || "";

  const USE_CATEGORY_LABELS: Record<UseCategory, string> = {
    all: lang === "uz" ? "Barchasi" : "Все",
    terapiya: lang === "uz" ? "Terapiya" : "Терапия",
    endodontiya: lang === "uz" ? "Endodontiya" : "Эндодонтия",
    ortopediya: lang === "uz" ? "Ortopediya" : "Ортопедия",
    jarrohlik: lang === "uz" ? "Jarrohlik" : "Хирургия",
    gigiyena: lang === "uz" ? "Gigiyena" : "Гигиена",
    uskunalar: lang === "uz" ? "Uskunalar" : "Оборудование",
    umumiy: lang === "uz" ? "Umumiy" : "Общее",
  };

  const TYPE_CATEGORY_LABELS: Record<TypeCategory, string> = {
    all: lang === "uz" ? "Barchasi" : "Все",
    material: lang === "uz" ? "Material" : "Материал",
    instrument: lang === "uz" ? "Instrument" : "Инструмент",
    rasxodnik: lang === "uz" ? "Rasxodnik" : "Расходник",
    uskuna: lang === "uz" ? "Uskuna" : "Оборудование",
    aksessuar: lang === "uz" ? "Aksessuar" : "Аксессуар",
  };

  const baseProducts = useMemo(() => {
    if (!searchQuery) return allProducts;

    const q = searchQuery.toLowerCase();

    return allProducts.filter((product) => {
      return (
        product.name.toLowerCase().includes(q) ||
        product.description.toLowerCase().includes(q)
      );
    });
  }, [allProducts, searchQuery]);

  const filteredByUse = useMemo(() => {
    if (activeUse === "all") return baseProducts;
    return baseProducts.filter((product) => product.useCategory === activeUse);
  }, [baseProducts, activeUse]);

  const visibleProducts = useMemo(() => {
    if (activeType === "all") return filteredByUse;
    return filteredByUse.filter(
      (product) => product.typeCategory === activeType
    );
  }, [filteredByUse, activeType]);

  const useCounts = useMemo<Record<UseCategory, number>>(
    () => ({
      all: baseProducts.length,
      terapiya: baseProducts.filter((p) => p.useCategory === "terapiya").length,
      endodontiya: baseProducts.filter((p) => p.useCategory === "endodontiya")
        .length,
      ortopediya: baseProducts.filter((p) => p.useCategory === "ortopediya")
        .length,
      jarrohlik: baseProducts.filter((p) => p.useCategory === "jarrohlik")
        .length,
      gigiyena: baseProducts.filter((p) => p.useCategory === "gigiyena").length,
      uskunalar: baseProducts.filter((p) => p.useCategory === "uskunalar")
        .length,
      umumiy: baseProducts.filter((p) => p.useCategory === "umumiy").length,
    }),
    [baseProducts]
  );

  const typeCounts = useMemo<Record<TypeCategory, number>>(
    () => ({
      all: filteredByUse.length,
      material: filteredByUse.filter((p) => p.typeCategory === "material")
        .length,
      instrument: filteredByUse.filter((p) => p.typeCategory === "instrument")
        .length,
      rasxodnik: filteredByUse.filter((p) => p.typeCategory === "rasxodnik")
        .length,
      uskuna: filteredByUse.filter((p) => p.typeCategory === "uskuna").length,
      aksessuar: filteredByUse.filter((p) => p.typeCategory === "aksessuar")
        .length,
    }),
    [filteredByUse]
  );

  const buildHref = (nextUse: UseCategory, nextType: TypeCategory) => {
    const params = new URLSearchParams();

    if (nextUse !== "all") params.set("use", nextUse);
    if (nextType !== "all") params.set("type", nextType);
    if (searchQuery) params.set("q", searchQuery);

    const query = params.toString();
    return query ? `/catalog?${query}` : "/catalog";
  };

  const useOrder: UseCategory[] = [
    "all",
    "terapiya",
    "endodontiya",
    "ortopediya",
    "jarrohlik",
    "gigiyena",
    "uskunalar",
    "umumiy",
  ];

  const typeOrder: TypeCategory[] = [
    "all",
    "material",
    "instrument",
    "rasxodnik",
    "uskuna",
    "aksessuar",
  ];

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#EEF3F1] pb-28">
      <Container className="py-4">
        <div className="rounded-[28px] bg-white p-4 shadow-[0_16px_40px_rgba(15,23,42,0.06)] ring-1 ring-black/5">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[18px] bg-white text-[#12332D] shadow-[0_10px_25px_rgba(15,23,42,0.06)] ring-1 ring-black/5"
            >
              <ArrowLeft size={22} />
            </Link>

            <form
              action="/catalog"
              method="GET"
              className="flex flex-1 items-center gap-3"
            >
              {activeUse !== "all" ? (
                <input type="hidden" name="use" value={activeUse} />
              ) : null}
              {activeType !== "all" ? (
                <input type="hidden" name="type" value={activeType} />
              ) : null}

              <div className="flex min-h-[56px] flex-1 items-center gap-3 rounded-[18px] bg-[#F4F7F6] px-4">
                <Search size={20} className="text-[#6D8781]" />
                <input
                  type="text"
                  name="q"
                  defaultValue={searchQuery}
                  placeholder={
                    lang === "uz"
                      ? "Mahsulotlarni qidiring"
                      : "Поиск товаров"
                  }
                  className="w-full bg-transparent text-[15px] text-[#12332D] outline-none placeholder:text-[#6D8781]"
                />
              </div>
            </form>
          </div>

          <div className="mt-4 flex items-end justify-between gap-3">
            <div>
              <p className="text-sm text-[#6D8781]">MARVA Dental market</p>
              <h1 className="mt-1 text-[30px] font-bold text-[#12332D]">
                {lang === "uz" ? "Katalog" : "Каталог"}
              </h1>
              <p className="mt-1 text-sm text-[#5D7E78]">
                {lang === "uz"
                  ? `${visibleProducts.length} ta mahsulot topildi`
                  : `Найдено товаров: ${visibleProducts.length}`}
              </p>
            </div>

            {searchQuery ? (
              <div className="rounded-full bg-[#F4F7F6] px-3 py-2 text-xs font-semibold text-[#12332D]">
                “{searchQuery}”
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-5 rounded-[28px] bg-white p-4 shadow-[0_16px_40px_rgba(15,23,42,0.06)] ring-1 ring-black/5">
          <div>
            <h2 className="text-[22px] font-bold text-[#12332D]">
              {lang === "uz" ? "Yo‘nalish" : "Направление"}
            </h2>
            <p className="mt-1 text-sm text-[#5D7E78]">
              {lang === "uz"
                ? "Avval bo‘limni tanlang"
                : "Сначала выберите раздел"}
            </p>
          </div>

          <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
            {useOrder.map((category) => {
              const isActive = activeUse === category;
              const count = useCounts[category];

              return (
                <Link
                  key={category}
                  href={buildHref(category, activeType)}
                  className={`shrink-0 rounded-full px-4 py-3 text-sm font-semibold transition ${
                    isActive
                      ? "bg-[#004F45] text-white shadow-[0_12px_24px_rgba(0,79,69,0.20)]"
                      : "bg-[#F8FBFA] text-[#12332D] ring-1 ring-black/5"
                  }`}
                >
                  {USE_CATEGORY_LABELS[category]} ({count})
                </Link>
              );
            })}
          </div>
        </div>

        <div className="mt-4 rounded-[28px] bg-white p-4 shadow-[0_16px_40px_rgba(15,23,42,0.06)] ring-1 ring-black/5">
          <div>
            <h2 className="text-[22px] font-bold text-[#12332D]">
              {lang === "uz" ? "Mahsulot turi" : "Тип товара"}
            </h2>
            <p className="mt-1 text-sm text-[#5D7E78]">
              {lang === "uz"
                ? "Xohlasangiz, qo‘shimcha filtr ham tanlang"
                : "При желании выберите и дополнительный фильтр"}
            </p>
          </div>

          <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
            {typeOrder.map((category) => {
              const isActive = activeType === category;
              const count = typeCounts[category];

              return (
                <Link
                  key={category}
                  href={buildHref(activeUse, category)}
                  className={`shrink-0 rounded-full px-4 py-3 text-sm font-semibold transition ${
                    isActive
                      ? "bg-[#004F45] text-white shadow-[0_12px_24px_rgba(0,79,69,0.20)]"
                      : "bg-[#F8FBFA] text-[#12332D] ring-1 ring-black/5"
                  }`}
                >
                  {TYPE_CATEGORY_LABELS[category]} ({count})
                </Link>
              );
            })}
          </div>
        </div>

        <div className="mt-6 rounded-[28px] bg-white p-4 shadow-[0_16px_40px_rgba(15,23,42,0.06)] ring-1 ring-black/5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-[22px] font-bold text-[#12332D]">
                {lang === "uz" ? "Mahsulotlar" : "Товары"}
              </h3>
              <p className="mt-1 text-sm text-[#5D7E78]">
                {lang === "uz"
                  ? "Tanlangan filtrlar bo‘yicha natijalar"
                  : "Результаты по выбранным фильтрам"}
              </p>
            </div>

            <div className="rounded-full bg-[#F4F7F6] px-3 py-2 text-xs font-semibold text-[#12332D]">
              {lang === "uz"
                ? `${visibleProducts.length} ta`
                : `${visibleProducts.length} шт.`}
            </div>
          </div>

          {visibleProducts.length === 0 ? (
            <div className="mt-5 rounded-[22px] bg-[#F8FBFA] p-6 text-center">
              <p className="text-base font-semibold text-[#12332D]">
                {lang === "uz" ? "Mahsulot topilmadi" : "Товар не найден"}
              </p>
              <p className="mt-2 text-sm text-[#5D7E78]">
                {lang === "uz"
                  ? "Boshqa filter yoki qidiruvni sinab ko‘ring"
                  : "Попробуйте другой фильтр или поиск"}
              </p>
            </div>
          ) : (
            <div className="mt-5 grid grid-cols-2 gap-4">
              {visibleProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </Container>

      <BottomNav />
    </div>
  );
}
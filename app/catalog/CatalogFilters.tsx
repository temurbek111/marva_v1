"use client";

import Link from "next/link";

type UseCategory =
  | "all" | "terapiya" | "endodontiya" | "ortopediya"
  | "jarrohlik" | "gigiyena" | "uskunalar" | "umumiy";

type Props = {
  activeUse: UseCategory;
  searchQuery: string;
  lang: string;
};

const USE_ORDER: UseCategory[] = [
  "all", "terapiya", "endodontiya", "ortopediya",
  "jarrohlik", "gigiyena", "uskunalar", "umumiy",
];

const LABELS: Record<UseCategory, { uz: string; ru: string }> = {
  all:         { uz: "Barchasi",    ru: "Все" },
  terapiya:    { uz: "Terapiya",    ru: "Терапия" },
  endodontiya: { uz: "Endodontiya", ru: "Эндодонтия" },
  ortopediya:  { uz: "Ortopediya",  ru: "Ортопедия" },
  jarrohlik:   { uz: "Jarrohlik",   ru: "Хирургия" },
  gigiyena:    { uz: "Gigiyena",    ru: "Гигиена" },
  uskunalar:   { uz: "Uskunalar",   ru: "Оборудование" },
  umumiy:      { uz: "Umumiy",      ru: "Общее" },
};

export function CatalogFilters({ activeUse, searchQuery, lang }: Props) {
  const buildHref = (category: UseCategory) => {
    const params = new URLSearchParams();
    if (category !== "all") params.set("use", category);
    if (searchQuery) params.set("q", searchQuery);
    const s = params.toString();
    return s ? `/catalog?${s}` : "/catalog";
  };

  return (
    <div className="mt-5 rounded-[28px] bg-white p-4 shadow-[0_16px_40px_rgba(15,23,42,0.06)] ring-1 ring-black/5">
      <h2 className="text-[22px] font-bold text-[#12332D]">
        {lang === "uz" ? "Yo'nalish" : "Направление"}
      </h2>
      <p className="mt-1 text-sm text-[#5D7E78]">
        {lang === "uz" ? "Avval bo'limni tanlang" : "Сначала выберите раздел"}
      </p>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
        {USE_ORDER.map((category) => (
          <Link
            key={category}
            href={buildHref(category)}
            className={`shrink-0 rounded-full px-4 py-3 text-sm font-semibold transition ${
              activeUse === category
                ? "bg-[#004F45] text-white shadow-[0_12px_24px_rgba(0,79,69,0.20)]"
                : "bg-[#F8FBFA] text-[#12332D] ring-1 ring-black/5"
            }`}
          >
            {lang === "uz" ? LABELS[category].uz : LABELS[category].ru}
          </Link>
        ))}
      </div>
    </div>
  );
}
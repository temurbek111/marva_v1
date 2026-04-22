"use client";

import { useAppLang } from "@/components/common/LangProvider";

export function LangSwitcher() {
  const { lang, toggleLang, mounted } = useAppLang();

  if (!mounted) return null;

  return (
    <button
      type="button"
      onClick={toggleLang}
      className="inline-flex items-center rounded-full border border-[#D9E3E0] bg-white px-3 py-1.5 text-sm font-medium text-[#004F45] shadow-sm"
    >
      {lang === "uz" ? "UZ | RU" : "RU | UZ"}
    </button>
  );
}
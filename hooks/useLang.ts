"use client";

import { useEffect, useState } from "react";
import { getTelegramLang } from "@/lib/telegram";
import type { Lang } from "@/lib/i18n";

const STORAGE_KEY = "app_lang";

export function useLang() {
  const [lang, setLang] = useState<Lang>("uz");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Lang | null;

    if (saved === "uz" || saved === "ru") {
      setLang(saved);
    } else {
      setLang(getTelegramLang());
    }

    setMounted(true);
  }, []);

  const changeLang = (nextLang: Lang) => {
    setLang(nextLang);
    localStorage.setItem(STORAGE_KEY, nextLang);
  };

  const toggleLang = () => {
    const nextLang = lang === "uz" ? "ru" : "uz";
    changeLang(nextLang);
  };

  return {
    lang,
    setLang: changeLang,
    toggleLang,
    mounted,
  };
}
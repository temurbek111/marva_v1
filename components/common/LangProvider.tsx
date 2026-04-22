"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { getTelegramLang } from "@/lib/telegram";
import type { Lang } from "@/lib/i18n";

type LangContextType = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  toggleLang: () => void;
  mounted: boolean;
};

const LangContext = createContext<LangContextType | undefined>(undefined);

const STORAGE_KEY = "app_lang";

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("uz");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Lang | null;

    if (saved === "uz" || saved === "ru") {
      setLangState(saved);
    } else {
      setLangState(getTelegramLang());
    }

    setMounted(true);
  }, []);

  const setLang = (nextLang: Lang) => {
    setLangState(nextLang);
    localStorage.setItem(STORAGE_KEY, nextLang);
  };

  const toggleLang = () => {
    setLang(lang === "uz" ? "ru" : "uz");
  };

  return (
    <LangContext.Provider value={{ lang, setLang, toggleLang, mounted }}>
      {children}
    </LangContext.Provider>
  );
}

export function useAppLang() {
  const context = useContext(LangContext);

  if (!context) {
    throw new Error("useAppLang must be used inside LangProvider");
  }

  return context;
}

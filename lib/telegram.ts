"use client";

import { getLang, type Lang } from "@/lib/i18n";

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        ready: () => void;
        expand: () => void;
        close: () => void;
        colorScheme?: "light" | "dark";
        initDataUnsafe?: {
          user?: {
            id?: number;
            first_name?: string;
            last_name?: string;
            username?: string;
            language_code?: string;
          };
        };
      };
    };
  }
}

export function getTelegramUser() {
  if (typeof window === "undefined") return null;
  return window.Telegram?.WebApp?.initDataUnsafe?.user ?? null;
}

export function getTelegramLang(): Lang {
  if (typeof window === "undefined") return "uz";
  const code = window.Telegram?.WebApp?.initDataUnsafe?.user?.language_code;
  return getLang(code);
}

export function initTelegramApp() {
  if (typeof window === "undefined") return;

  const app = window.Telegram?.WebApp;
  if (!app) return;

  app.ready();
  app.expand();
}
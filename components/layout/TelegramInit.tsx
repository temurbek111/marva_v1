"use client";

import { useEffect } from "react";
import { initTelegramApp } from "@/lib/web-telegram";

export function TelegramInit() {
  useEffect(() => {
    initTelegramApp();
  }, []);

  return null;
}

import type { Metadata } from "next";
import Script from "next/script";
import { TelegramInit } from "@/components/layout/TelegramInit";
import { LangProvider } from "@/components/common/LangProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "MARVA Dental shop",
  description: "Dental market mini app",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="uz">
      <body>
        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="beforeInteractive"
        />

        <LangProvider>
          <TelegramInit />
          {children}
        </LangProvider>
      </body>
    </html>
  );
}
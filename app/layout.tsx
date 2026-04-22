import type { Metadata } from "next";
import Script from "next/script";
import { TelegramInit } from "@/components/layout/TelegramInit";
import "./globals.css";
import { LangProvider } from "@/components/common/LangProvider";
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
        <LangProvider>{children}</LangProvider>
      </body>
    </html>
  );
}
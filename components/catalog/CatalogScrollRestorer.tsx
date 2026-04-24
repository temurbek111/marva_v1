"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const SCROLL_KEY = "catalog-scroll-y";
const RETURN_URL_KEY = "catalog-return-url";

export function CatalogScrollRestorer() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const savedScroll = sessionStorage.getItem(SCROLL_KEY);
    const savedReturnUrl = sessionStorage.getItem(RETURN_URL_KEY);

    const query = searchParams?.toString();
    const currentUrl = query ? `${pathname}?${query}` : pathname;

    if (!savedScroll) return;
    if (!savedReturnUrl) return;
    if (currentUrl !== savedReturnUrl) return;

    const y = Number(savedScroll);

    const restoreScroll = () => {
      window.scrollTo({
        top: y,
        behavior: "auto",
      });
    };

    const rafId = window.requestAnimationFrame(restoreScroll);
    const timeout1 = window.setTimeout(restoreScroll, 80);
    const timeout2 = window.setTimeout(() => {
      restoreScroll();
      sessionStorage.removeItem(SCROLL_KEY);
      sessionStorage.removeItem(RETURN_URL_KEY);
    }, 250);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.clearTimeout(timeout1);
      window.clearTimeout(timeout2);
    };
  }, [pathname, searchParams]);

  return null;
}
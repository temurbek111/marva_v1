"use client";

import { useEffect, useMemo, useState } from "react";
import { Bell } from "lucide-react";
import { LangSwitcher } from "@/components/common/LangSwitcher";
import ReelsButton from "@/components/home/ReelsButton";
import ReelsViewerModal from "@/components/home/ReelsViewerModal";
import { getActiveReels } from "@/lib/reels";
import type { Reel } from "@/lib/types";

const VIEWED_REELS_KEY = "marva-viewed-reel-ids";

export function Header() {
  const [reels, setReels] = useState<Reel[]>([]);
  const [isReelsLoading, setIsReelsLoading] = useState(true);
  const [isReelsOpen, setIsReelsOpen] = useState(false);
  const [viewedReelIds, setViewedReelIds] = useState<number[]>([]);

  useEffect(() => {
    let mounted = true;

    async function loadReels() {
      try {
        const data = await getActiveReels();

        if (mounted) {
          setReels(data);
        }
      } catch (error) {
        console.error("Failed to load reels:", error);

        if (mounted) {
          setReels([]);
        }
      } finally {
        if (mounted) {
          setIsReelsLoading(false);
        }
      }
    }

    void loadReels();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(VIEWED_REELS_KEY);

      if (!saved) return;

      const parsed = JSON.parse(saved);

      if (Array.isArray(parsed)) {
        setViewedReelIds(
          parsed.filter((id): id is number => typeof id === "number")
        );
      }
    } catch (error) {
      console.error("Failed to load viewed reels:", error);
    }
  }, []);

  useEffect(() => {
    if (!reels.length) return;

    setViewedReelIds((prev) => {
      const activeIds = new Set(reels.map((reel) => reel.id));
      const next = prev.filter((id) => activeIds.has(id));

      if (next.length !== prev.length) {
        localStorage.setItem(VIEWED_REELS_KEY, JSON.stringify(next));
      }

      return next;
    });
  }, [reels]);

  const handleReelViewed = (reelId: number) => {
    setViewedReelIds((prev) => {
      if (prev.includes(reelId)) {
        return prev;
      }

      const next = [...prev, reelId];
      localStorage.setItem(VIEWED_REELS_KEY, JSON.stringify(next));
      return next;
    });
  };

  const hasUnseenReels = useMemo(() => {
    if (!reels.length) return false;

    return reels.some((reel) => !viewedReelIds.includes(reel.id));
  }, [reels, viewedReelIds]);

  return (
    <>
      <div
        className="sticky top-0 z-40 border-b border-black/5 bg-white/95 backdrop-blur"
        style={{
          paddingTop:
            "max(env(safe-area-inset-top, 0px), var(--tg-content-safe-area-inset-top, 0px))",
        }}
      >
        <div className="mx-auto flex max-w-md items-center justify-between px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-[11px] uppercase tracking-[0.24em] text-[#6B8A84]">
              Dental market
            </p>

            <h1 className="truncate text-[19px] font-bold leading-6 text-[#12332D]">
              MARVA Dental shop
            </h1>
          </div>

          <div className="ml-3 flex shrink-0 items-center gap-2">
            {!isReelsLoading && reels.length > 0 && (
              <ReelsButton
                onClickAction={() => setIsReelsOpen(true)}
                imageUrl="/logo.png"
                hasUnseen={hasUnseenReels}
              />
            )}

            <LangSwitcher />

            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F4F7F6] text-[#12332D]"
            >
              <Bell size={19} />
            </button>
          </div>
        </div>
      </div>

      <ReelsViewerModal
        isOpen={isReelsOpen}
        reels={reels}
        onCloseAction={() => setIsReelsOpen(false)}
        onReelViewedAction={handleReelViewed}
      />
    </>
  );
}
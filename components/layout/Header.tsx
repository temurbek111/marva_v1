"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { LangSwitcher } from "@/components/common/LangSwitcher";
import ReelsButton from "@/components/home/ReelsButton";
import ReelsViewerModal from "@/components/home/ReelsViewerModal";
import { getActiveReels } from "@/lib/reels";
import type { Reel } from "@/lib/types";

export function Header() {
  const [reels, setReels] = useState<Reel[]>([]);
  const [isReelsLoading, setIsReelsLoading] = useState(true);
  const [isReelsOpen, setIsReelsOpen] = useState(false);

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

  return (
    <>
      <div className="sticky top-0 z-40 border-b border-black/5 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-md items-center justify-between px-4 py-4">
          <div className="min-w-0 flex-1">
            <p className="text-xs uppercase tracking-[0.24em] text-[#6B8A84]">
              Dental market
            </p>

            <h1 className="truncate text-[20px] font-bold text-[#12332D]">
              MARVA Dental shop
            </h1>
          </div>

          <div className="ml-3 flex shrink-0 items-center gap-2">
            {!isReelsLoading && reels.length > 0 && (
              <ReelsButton
                onClick={() => setIsReelsOpen(true)}
                imageUrl="/logo.png"
              />
            )}

            <LangSwitcher />

            <button
              type="button"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-[#F4F7F6] text-[#12332D]"
            >
              <Bell size={20} />
            </button>
          </div>
        </div>
      </div>

      <ReelsViewerModal
        isOpen={isReelsOpen}
        reels={reels}
        onClose={() => setIsReelsOpen(false)}
      />
    </>
  );
}
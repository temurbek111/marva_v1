"use client";

import { Share2 } from "lucide-react";

type ShareButtonProps = {
  title: string;
};

export function ShareButton({ title }: ShareButtonProps) {
  const handleShare = async () => {
    const shareUrl = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title,
          url: shareUrl,
        });
      } catch (error) {
        console.log("Share cancelled");
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      alert("Havola nusxalandi");
    } catch (error) {
      alert("Havolani nusxalab bo‘lmadi");
    }
  };

  return (
    <button
      onClick={handleShare}
      className="flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-[0_8px_20px_rgba(0,0,0,0.06)] ring-1 ring-black/5"
    >
      <Share2 size={20} className="text-[#0A7A5A]" />
    </button>
  );
}
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Volume2, VolumeX, X } from "lucide-react";
import type { Reel } from "@/lib/types";

type ReelsViewerModalProps = {
  isOpen: boolean;
  reels: Reel[];
  onClose: () => void;
};

export default function ReelsViewerModal({
  isOpen,
  reels,
  onClose,
}: ReelsViewerModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVideoLoading, setIsVideoLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [translateY, setTranslateY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const touchCurrentYRef = useRef<number | null>(null);

  const currentReel = useMemo(() => reels[currentIndex], [reels, currentIndex]);

  useEffect(() => {
    if (!isOpen) {
      setCurrentIndex(0);
      setIsVideoLoading(true);
      setProgress(0);
      setIsPaused(false);
      setTranslateY(0);
      setIsDragging(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !currentReel) return;

    setIsVideoLoading(true);
    setProgress(0);
    setIsPaused(false);
  }, [isOpen, currentReel]);

  const goToNext = () => {
    if (currentIndex < reels.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      return;
    }

    onClose();
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const pauseVideo = () => {
    const video = videoRef.current;
    if (!video) return;

    video.pause();
    setIsPaused(true);
  };

  const resumeVideo = () => {
    const video = videoRef.current;
    if (!video) return;

    void video.play();
    setIsPaused(false);
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }

      if (event.key === "ArrowRight") {
        goToNext();
      }

      if (event.key === "ArrowLeft") {
        goToPrevious();
      }

      if (event.key === " ") {
        event.preventDefault();

        if (videoRef.current?.paused) {
          resumeVideo();
        } else {
          pauseVideo();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, currentIndex, reels.length]);

  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    const touchY = event.touches[0]?.clientY ?? 0;
    touchStartYRef.current = touchY;
    touchCurrentYRef.current = touchY;
  };

  const handleTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartYRef.current === null) return;

    const touchY = event.touches[0]?.clientY ?? 0;
    touchCurrentYRef.current = touchY;

    const deltaY = touchY - touchStartYRef.current;

    if (deltaY > 0) {
      setIsDragging(true);
      setTranslateY(deltaY);
    }
  };

  const handleTouchEnd = () => {
    if (touchStartYRef.current === null || touchCurrentYRef.current === null) {
      touchStartYRef.current = null;
      touchCurrentYRef.current = null;
      return;
    }

    const deltaY = touchCurrentYRef.current - touchStartYRef.current;

    if (deltaY > 120) {
      onClose();
    } else {
      setTranslateY(0);
      setIsDragging(false);
    }

    touchStartYRef.current = null;
    touchCurrentYRef.current = null;
  };

  if (!isOpen || reels.length === 0 || !currentReel) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black">
      <div
        className="relative mx-auto flex h-full w-full max-w-md flex-col overflow-hidden bg-black"
        style={{
          transform: `translateY(${translateY}px)`,
          transition: isDragging ? "none" : "transform 0.25s ease",
          opacity: Math.max(0.7, 1 - translateY / 500),
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="absolute left-0 right-0 top-0 z-20 px-3 pt-3">
          <div className="mb-3 flex items-center gap-1">
            {reels.map((reel, index) => {
              let widthClass = "w-0";

              if (index < currentIndex) {
                widthClass = "w-full";
              } else if (index === currentIndex) {
                widthClass = "";
              }

              return (
                <div
                  key={reel.id}
                  className="h-1 flex-1 overflow-hidden rounded-full bg-white/25"
                >
                  <div
                    className={`h-full rounded-full bg-white transition-all duration-150 ${
                      index === currentIndex ? "" : widthClass
                    }`}
                    style={
                      index === currentIndex
                        ? { width: `${progress}%` }
                        : undefined
                    }
                  />
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
             {currentReel.title && (
  <p className="truncate text-sm font-medium text-white">
    {currentReel.title}
  </p>
)}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsMuted((prev) => !prev)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-black/35 text-white"
              >
                {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>

              <button
                type="button"
                onClick={onClose}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-black/35 text-white"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        </div>

        <div className="relative flex-1">
          <button
            type="button"
            aria-label="Previous reel"
            onClick={goToPrevious}
            className="absolute left-0 top-0 z-10 h-full w-1/3"
          />

          <button
            type="button"
            aria-label="Next reel"
            onClick={goToNext}
            className="absolute right-0 top-0 z-10 h-full w-1/3"
          />

          <div
            className="absolute left-1/3 right-1/3 top-0 z-10 h-full"
            onMouseDown={pauseVideo}
            onMouseUp={resumeVideo}
            onMouseLeave={resumeVideo}
            onTouchStart={pauseVideo}
            onTouchEnd={resumeVideo}
          />

          {isVideoLoading && (
            <div className="absolute inset-0 z-[5] flex items-center justify-center bg-black text-white">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            </div>
          )}

         <video
  key={currentReel.id}
  ref={videoRef}
  src={currentReel.video_url}
  className="h-full w-full object-cover"
  autoPlay
  muted={isMuted}
  playsInline
  preload="auto"
  onCanPlay={() => setIsVideoLoading(false)}
  onEnded={goToNext}
  controls={false}
/>

          {isPaused && !isVideoLoading && (
            <div className="pointer-events-none absolute inset-0 z-[6] flex items-center justify-center bg-black/10">
              <div className="rounded-full bg-black/40 px-4 py-2 text-sm font-medium text-white">
                Pause
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
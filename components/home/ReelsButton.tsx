"use client";

type ReelsButtonProps = {
  onClick: () => void;
  imageUrl?: string;
};

export default function ReelsButton({
  onClick,
  imageUrl,
}: ReelsButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Open reels"
      className="relative flex h-11 w-11 items-center justify-center rounded-full"
    >
      <span className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#ff004f] via-[#ff5f6d] to-[#ff8a00] p-[2px] shadow-sm">
        <span className="flex h-full w-full items-center justify-center rounded-full bg-white">
          <span className="flex h-[34px] w-[34px] overflow-hidden rounded-full bg-[#005B4F]">
            <img
              src={imageUrl || "/logo.png"}
              alt="Reels preview"
              className="h-full w-full object-cover"
            />
          </span>
        </span>
      </span>
    </button>
  );
}
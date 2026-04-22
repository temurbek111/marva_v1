"use client";

import { useMemo, useState } from "react";

interface ProductImageGalleryProps {
  images: string[];
  productName: string;
}

export function ProductImageGallery({
  images,
  productName,
}: ProductImageGalleryProps) {
  const validImages = useMemo(
    () => images.filter((img) => typeof img === "string" && img.trim() !== ""),
    [images]
  );

  const [selectedImage, setSelectedImage] = useState(validImages[0] || "");

  if (!validImages.length) {
    return (
      <div className="mx-auto flex h-[420px] items-center justify-center px-4">
        <div className="flex h-[260px] w-full items-center justify-center rounded-[30px] bg-white text-[#004F45] shadow-[0_12px_30px_rgba(0,0,0,0.06)] ring-1 ring-black/5">
          <span className="text-xl font-bold">MARVA</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mx-auto flex h-[420px] items-center justify-center px-4">
        <div className="relative flex h-full w-full items-center justify-center rounded-[24px] bg-white">
          <img
            src={selectedImage}
            alt={productName}
            className="max-h-[380px] w-full object-contain object-center"
          />
        </div>
      </div>

      {validImages.length > 1 && (
        <>
          <div className="mt-4 flex justify-center gap-2 px-4">
            {validImages.map((img, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setSelectedImage(img)}
                className={`h-[64px] w-[64px] overflow-hidden rounded-[14px] border bg-white transition ${
                  selectedImage === img
                    ? "border-[#004F45] ring-2 ring-[#004F45]/15"
                    : "border-[#D7E3DF]"
                }`}
              >
                <img
                  src={img}
                  alt={`${productName}-${index + 1}`}
                  className="h-full w-full object-cover"
                />
              </button>
            ))}
          </div>

          <div className="mt-3 flex items-center justify-center gap-2">
            {validImages.map((img, index) => (
              <span
                key={index}
                className={`rounded-full transition-all ${
                  selectedImage === img
                    ? "h-2.5 w-8 bg-[#004F45]"
                    : "h-2.5 w-2.5 bg-[#D7E3DF]"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
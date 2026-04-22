"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

type AccordionItem = {
  title: string;
  description: string;
};

type ProductInfoAccordionProps = {
  items: AccordionItem[];
};

export function ProductInfoAccordion({
  items,
}: ProductInfoAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const handleToggle = (index: number) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  };

  return (
    <div className="mt-4 space-y-3">
      {items.map((item, index) => {
        const isOpen = openIndex === index;

        return (
          <div
            key={item.title}
            className="overflow-hidden rounded-[22px] bg-white shadow-[0_12px_28px_rgba(15,23,42,0.05)] ring-1 ring-black/5"
          >
            <button
              onClick={() => handleToggle(index)}
              className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left"
            >
              <div>
                <p className="text-[15px] font-semibold text-[#12332D]">
                  {item.title}
                </p>
              </div>

              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#EAF3F1] text-[#004F45] transition ${
                  isOpen ? "rotate-180" : ""
                }`}
              >
                <ChevronDown size={18} />
              </div>
            </button>

            <div
              className={`grid transition-all duration-300 ease-in-out ${
                isOpen
                  ? "grid-rows-[1fr] opacity-100"
                  : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="overflow-hidden">
                <div className="border-t border-black/5 px-4 pb-4 pt-1">
                  <p className="text-sm leading-7 text-[#5D7E78]">
                    {item.description}
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
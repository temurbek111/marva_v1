"use client";

import { useState } from "react";

type ProductTabsProps = {
  description: string;
  details: {
    label: string;
    value: string;
  }[];
};

export function ProductTabs({ description, details }: ProductTabsProps) {
  const [activeTab, setActiveTab] = useState<"description" | "details">(
    "description"
  );

  return (
    <div className="mt-5 rounded-[26px] bg-white p-4 shadow-[0_16px_35px_rgba(15,23,42,0.06)] ring-1 ring-black/5">
      <div className="grid grid-cols-2 rounded-full bg-[#F4F8F7] p-1">
        <button
          onClick={() => setActiveTab("description")}
          className={`rounded-full px-4 py-3 text-sm font-semibold transition ${
            activeTab === "description"
              ? "bg-[#004F45] text-white shadow-[0_10px_20px_rgba(0,79,69,0.18)]"
              : "text-[#5D7E78]"
          }`}
        >
          Tavsif
        </button>

        <button
          onClick={() => setActiveTab("details")}
          className={`rounded-full px-4 py-3 text-sm font-semibold transition ${
            activeTab === "details"
              ? "bg-[#004F45] text-white shadow-[0_10px_20px_rgba(0,79,69,0.18)]"
              : "text-[#5D7E78]"
          }`}
        >
          Xarakteristika
        </button>
      </div>

      <div className="mt-4">
        {activeTab === "description" ? (
          <div className="rounded-[22px] bg-[#F8FBFA] p-4">
            <p className="text-sm leading-7 text-[#4F6F69]">
              {description || "Ma’lumot hozircha kiritilmagan"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {details.length > 0 ? (
              details.map((item) => (
                <div
                  key={item.label}
                  className="rounded-[18px] bg-[#F8FBFA] px-4 py-3"
                >
                  <p className="text-xs text-[#6F8A84]">{item.label}</p>
                  <p className="mt-1 text-sm font-semibold text-[#12332D]">
                    {item.value}
                  </p>
                </div>
              ))
            ) : (
              <div className="rounded-[22px] bg-[#F8FBFA] p-4">
                <p className="text-sm text-[#4F6F69]">
                  Qo‘shimcha ma’lumot hozircha yo‘q
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
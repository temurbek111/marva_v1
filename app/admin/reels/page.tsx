"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import type { Reel } from "@/lib/types";
import {
  getAllReels,
  createReel,
  updateReel,
  deleteReel,
  uploadReelVideo,
} from "@/lib/reels";

export default function AdminReelsPage() {
  const [reels, setReels] = useState<Reel[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [title, setTitle] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [sortOrder, setSortOrder] = useState("0");
  const [isActive, setIsActive] = useState(true);

  async function loadReels() {
    try {
      setLoading(true);
      const data = await getAllReels();
      setReels(data);
    } catch (error) {
      console.error("Failed to load reels:", error);
      setReels([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadReels();
  }, []);

  async function handleCreateReel(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!videoFile) {
      alert("Video file majburiy");
      return;
    }

    try {
      setSubmitting(true);

      const uploaded = await uploadReelVideo(videoFile);

      await createReel({
        title: title.trim() || undefined,
        video_url: uploaded.publicUrl,
        is_active: isActive,
        sort_order: Number(sortOrder) || 0,
      });

      setTitle("");
      setVideoFile(null);
      setSortOrder("0");
      setIsActive(true);

      const fileInput = document.getElementById(
        "reel-video-input"
      ) as HTMLInputElement | null;

      if (fileInput) {
        fileInput.value = "";
      }

      await loadReels();
      alert("Reel muvaffaqiyatli qo'shildi");
    } catch (error: any) {
      console.error("Failed to create reel:", error);

      const message =
        error?.message ||
        error?.error_description ||
        error?.details ||
        "Reel qo'shishda xatolik yuz berdi";

      alert(message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleActive(reel: Reel) {
    try {
      await updateReel(reel.id, {
        is_active: !reel.is_active,
      });

      await loadReels();
    } catch (error: any) {
      console.error("Failed to update reel:", error);
      alert(
        error?.message ||
          error?.details ||
          "Statusni o'zgartirib bo'lmadi"
      );
    }
  }

  async function handleSortOrderChange(reel: Reel, value: string) {
    try {
      await updateReel(reel.id, {
        sort_order: Number(value) || 0,
      });

      await loadReels();
    } catch (error: any) {
      console.error("Failed to update sort order:", error);
      alert(
        error?.message ||
          error?.details ||
          "Sort order yangilanmadi"
      );
    }
  }

  async function handleDelete(reel: Reel) {
    const confirmed = window.confirm(
      `"${reel.title || "Nomsiz reel"}" ni o'chirmoqchimisiz?`
    );

    if (!confirmed) return;

    try {
      await deleteReel(reel.id);
      await loadReels();
    } catch (error: any) {
      console.error("Failed to delete reel:", error);
      alert(
        error?.message ||
          error?.details ||
          "Reelni o'chirib bo'lmadi"
      );
    }
  }

  return (
    <main className="min-h-screen bg-[#F4F7F6]">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <Link
              href="/admin"
              className="mb-3 inline-flex items-center gap-2 text-sm text-[#335E56] hover:text-[#12332D]"
            >
              <ArrowLeft size={16} />
              Admin panelga qaytish
            </Link>

            <h1 className="text-2xl font-bold text-[#12332D]">Reels</h1>
            <p className="mt-1 text-sm text-[#5F7B75]">
              Reels videolarini upload qilish va boshqarish
            </p>
          </div>
        </div>

        <section className="rounded-3xl bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-[#12332D]">
            Yangi reel qo'shish
          </h2>

          <form onSubmit={handleCreateReel} className="grid gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-[#12332D]">
                Sarlavha
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Masalan: Hafta aksiyasi"
                className="w-full rounded-2xl border border-[#D9E3DF] px-4 py-3 outline-none focus:border-[#12332D]"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-[#12332D]">
                Video file <span className="text-red-500">*</span>
              </label>
              <input
                id="reel-video-input"
                type="file"
                accept="video/mp4,video/webm,video/quicktime"
                onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                className="w-full rounded-2xl border border-[#D9E3DF] px-4 py-3 outline-none focus:border-[#12332D]"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-[#12332D]">
                  Sort order
                </label>
                <input
                  type="number"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="w-full rounded-2xl border border-[#D9E3DF] px-4 py-3 outline-none focus:border-[#12332D]"
                />
              </div>

              <div className="flex items-end">
                <label className="flex items-center gap-3 rounded-2xl border border-[#D9E3DF] px-4 py-3 text-sm text-[#12332D]">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                  />
                  Aktiv holatda qo'shilsin
                </label>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-2xl bg-[#12332D] px-5 py-3 text-sm font-medium text-white disabled:opacity-60"
              >
                <Plus size={16} />
                {submitting ? "Upload qilinmoqda..." : "Reel qo'shish"}
              </button>
            </div>
          </form>
        </section>

        <section className="rounded-3xl bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#12332D]">
              Mavjud reels
            </h2>
            <button
              type="button"
              onClick={() => void loadReels()}
              className="rounded-xl border border-[#D9E3DF] px-3 py-2 text-sm text-[#12332D]"
            >
              Yangilash
            </button>
          </div>

          {loading ? (
            <p className="text-sm text-[#5F7B75]">Yuklanmoqda...</p>
          ) : reels.length === 0 ? (
            <p className="text-sm text-[#5F7B75]">Hozircha reel yo'q.</p>
          ) : (
            <div className="space-y-4">
              {reels.map((reel) => (
                <div
                  key={reel.id}
                  className="rounded-2xl border border-[#E4ECE9] p-4"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-base font-semibold text-[#12332D]">
                        {reel.title || "Nomsiz reel"}
                      </h3>

                      <p className="mt-2 break-all text-sm text-[#5F7B75]">
                        {reel.video_url}
                      </p>

                      <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
                        <span
                          className={`rounded-full px-3 py-1 ${
                            reel.is_active
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {reel.is_active ? "Aktiv" : "Noaktiv"}
                        </span>

                        <span className="text-[#5F7B75]">
                          Sort: {reel.sort_order}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 md:w-[220px]">
                      <button
                        type="button"
                        onClick={() => void handleToggleActive(reel)}
                        className="rounded-xl border border-[#D9E3DF] px-3 py-2 text-sm text-[#12332D]"
                      >
                        {reel.is_active ? "Noaktiv qilish" : "Aktiv qilish"}
                      </button>

                      <input
                        type="number"
                        defaultValue={reel.sort_order}
                        onBlur={(e) =>
                          void handleSortOrderChange(reel, e.target.value)
                        }
                        className="rounded-xl border border-[#D9E3DF] px-3 py-2 text-sm outline-none focus:border-[#12332D]"
                      />

                      <button
                        type="button"
                        onClick={() => void handleDelete(reel)}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 px-3 py-2 text-sm text-red-600"
                      >
                        <Trash2 size={16} />
                        O'chirish
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
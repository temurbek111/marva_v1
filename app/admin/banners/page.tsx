"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface HeroBanner {
  id: number;
  title: string | null;
  subtitle: string | null;
  media_type: string;
  media_url: string | null;
  button_text: string | null;
  button_link: string | null;
  is_active: boolean;
  sort_order: number;
  created_at?: string;
}

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<HeroBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [tab, setTab] = useState<"all" | "active" | "inactive">("all");

  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [mediaType, setMediaType] = useState<"image" | "video">("image");
  const [mediaUrl, setMediaUrl] = useState("");
  const [buttonText, setButtonText] = useState("");
  const [buttonLink, setButtonLink] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [sortOrder, setSortOrder] = useState("0");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);

    const { data, error } = await supabase
      .from("hero_banners")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("id", { ascending: false });

    if (error) {
      alert("❌ Bannerlarni olishda xato: " + error.message);
      setLoading(false);
      return;
    }

    setBanners(data || []);
    setLoading(false);
  }

  async function uploadMedia(file: File): Promise<string | null> {
    setUploading(true);

    try {
      const ext = file.name.split(".").pop();
      const fileName = `${Date.now()}_${Math.random()
        .toString(36)
        .slice(2)}.${ext}`;

      const { error } = await supabase.storage
        .from("hero-banners")
        .upload(fileName, file, { upsert: true });

      if (error) {
        alert("❌ Media yuklanmadi: " + error.message);
        return null;
      }

      const { data } = supabase.storage
        .from("hero-banners")
        .getPublicUrl(fileName);

      return data.publicUrl;
    } catch (e: any) {
      alert("❌ " + (e?.message || "Upload xatosi"));
      return null;
    } finally {
      setUploading(false);
    }
  }

  async function handleMediaChange(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = await uploadMedia(file);
    if (url) {
      setMediaUrl(url);
    }

    e.target.value = "";
  }

  function resetForm() {
    setEditingId(null);
    setTitle("");
    setSubtitle("");
    setMediaType("image");
    setMediaUrl("");
    setButtonText("");
    setButtonLink("");
    setIsActive(true);
    setSortOrder("0");
    setShowForm(false);
  }

  function openEditForm(banner: HeroBanner) {
    setEditingId(banner.id);
    setTitle(banner.title || "");
    setSubtitle(banner.subtitle || "");
    setMediaType(banner.media_type === "video" ? "video" : "image");
    setMediaUrl(banner.media_url || "");
    setButtonText(banner.button_text || "");
    setButtonLink(banner.button_link || "");
    setIsActive(banner.is_active);
    setSortOrder(String(banner.sort_order ?? 0));
    setShowForm(true);

    setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 100);
  }

  async function saveBanner() {
    if (!title.trim()) {
      alert("Banner sarlavhasini kiriting!");
      return;
    }

    if (!mediaUrl.trim()) {
      alert("Banner rasm yoki video yuklang!");
      return;
    }

    setSaving(true);

    const payload = {
      title: title.trim(),
      subtitle: subtitle.trim() || null,
      media_type: mediaType,
      media_url: mediaUrl.trim(),
      button_text: buttonText.trim() || null,
      button_link: buttonLink.trim() || null,
      is_active: isActive,
      sort_order: Number(sortOrder || 0),
    };

    let error = null;

    if (editingId) {
      const res = await supabase
        .from("hero_banners")
        .update(payload)
        .eq("id", editingId);

      error = res.error;
    } else {
      const res = await supabase.from("hero_banners").insert(payload);
      error = res.error;
    }

    setSaving(false);

    if (error) {
      alert("❌ Xato: " + error.message);
      return;
    }

    resetForm();
    loadData();
  }

  async function deleteBanner(id: number) {
    if (!confirm("Bannerni o'chirishni tasdiqlaysizmi?")) return;

    const { error } = await supabase
      .from("hero_banners")
      .delete()
      .eq("id", id);

    if (error) {
      alert("❌ " + error.message);
      return;
    }

    loadData();
  }

  async function toggleActive(banner: HeroBanner) {
    const { error } = await supabase
      .from("hero_banners")
      .update({ is_active: !banner.is_active })
      .eq("id", banner.id);

    if (error) {
      alert("❌ " + error.message);
      return;
    }

    loadData();
  }

  const filtered = banners.filter((banner) =>
    tab === "all" ? true : tab === "active" ? banner.is_active : !banner.is_active
  );

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f0f4f8",
        fontFamily: "'Segoe UI', sans-serif",
        maxWidth: "480px",
        margin: "0 auto",
      }}
    >
      <div
        style={{
          background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
          padding: "16px 20px 20px",
          position: "sticky",
          top: 0,
          zIndex: 100,
          boxShadow: "0 2px 20px rgba(0,0,0,0.3)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "4px",
          }}
        >
          <Link
            href="/admin"
            style={{
              color: "rgba(255,255,255,0.7)",
              textDecoration: "none",
              fontSize: "20px",
            }}
          >
            ←
          </Link>

          <div>
            <div style={{ color: "white", fontWeight: "700", fontSize: "18px" }}>
              🎯 Bannerlar
            </div>
            <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px" }}>
              {banners.length} ta banner
            </div>
          </div>

          <button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            style={{
              marginLeft: "auto",
              background: "#0d9488",
              color: "white",
              border: "none",
              borderRadius: "10px",
              padding: "8px 16px",
              cursor: "pointer",
              fontWeight: "600",
              fontSize: "13px",
              boxShadow: "0 2px 8px rgba(13,148,136,0.4)",
            }}
          >
            + Qo'shish
          </button>
        </div>

        <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
          {(["all", "active", "inactive"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                flex: 1,
                padding: "6px",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "12px",
                fontWeight: "600",
                background: tab === t ? "#0d9488" : "rgba(255,255,255,0.1)",
                color: tab === t ? "white" : "rgba(255,255,255,0.6)",
                transition: "all 0.2s",
              }}
            >
              {t === "all"
                ? `Barchasi (${banners.length})`
                : t === "active"
                ? `✅ Aktiv (${banners.filter((b) => b.is_active).length})`
                : `❌ Noaktiv (${banners.filter((b) => !b.is_active).length})`}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: "16px" }}>
        {showForm && (
          <div
            style={{
              background: "white",
              borderRadius: "20px",
              padding: "20px",
              marginBottom: "16px",
              boxShadow: "0 4px 24px rgba(0,0,0,0.10)",
              border: "1px solid #e2e8f0",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "20px",
              }}
            >
              <div>
                <div
                  style={{
                    fontWeight: "700",
                    fontSize: "16px",
                    color: "#1a1a2e",
                  }}
                >
                  {editingId ? "✏️ Bannerni tahrirlash" : "➕ Yangi banner"}
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    color: "#94a3b8",
                    marginTop: "2px",
                  }}
                >
                  Home tepasidagi promo blok
                </div>
              </div>

              <button
                onClick={resetForm}
                style={{
                  background: "#f1f5f9",
                  border: "none",
                  borderRadius: "10px",
                  width: "36px",
                  height: "36px",
                  cursor: "pointer",
                  fontSize: "18px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ marginBottom: "12px" }}>
              <label style={labelStyle}>Sarlavha *</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Masalan: Hafta aksiyasi"
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: "12px" }}>
              <label style={labelStyle}>Qisqa matn</label>
              <textarea
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="Masalan: Chegirmadagi mahsulotlarni ko‘ring"
                rows={3}
                style={{ ...inputStyle, resize: "vertical" as const }}
              />
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "10px",
                marginBottom: "12px",
              }}
            >
              <div>
                <label style={labelStyle}>Media turi</label>
                <select
                  value={mediaType}
                  onChange={(e) => setMediaType(e.target.value as "image" | "video")}
                  style={inputStyle}
                >
                  <option value="image">Image</option>
                  <option value="video">Video</option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>Tartib raqami</label>
                <input
                  type="number"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  placeholder="0"
                  style={inputStyle}
                />
              </div>
            </div>

            <div style={{ marginBottom: "12px" }}>
              <label style={labelStyle}>
                {mediaType === "video" ? "Video yuklash" : "Banner rasm yuklash"}
              </label>

              <label
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "2px dashed #cbd5e1",
                  borderRadius: "14px",
                  padding: "16px",
                  cursor: "pointer",
                  background: "#f8fafc",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {uploading ? (
                  <div style={{ textAlign: "center", color: "#0d9488" }}>
                    <div style={{ fontSize: "28px", marginBottom: "4px" }}>⏳</div>
                    <div style={{ fontSize: "13px", fontWeight: "600" }}>
                      Yuklanmoqda...
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: "center", color: "#94a3b8" }}>
                    <div style={{ fontSize: "36px", marginBottom: "6px" }}>
                      {mediaType === "video" ? "🎬" : "🖼️"}
                    </div>
                    <div style={{ fontSize: "13px", fontWeight: "600" }}>
                      {mediaType === "video"
                        ? "Video upload qilish"
                        : "Rasm upload qilish"}
                    </div>
                  </div>
                )}

                <input
                  type="file"
                  accept={mediaType === "video" ? "video/*" : "image/*"}
                  onChange={handleMediaChange}
                  style={{
                    position: "absolute",
                    opacity: 0,
                    inset: 0,
                    cursor: "pointer",
                  }}
                />
              </label>
            </div>

            <div style={{ marginBottom: "12px" }}>
              <label style={labelStyle}>
                {mediaType === "video" ? "Video URL *" : "Banner URL *"}
              </label>
              <input
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
                placeholder={
                  mediaType === "video"
                    ? "https://...video.mp4"
                    : "https://...banner.jpg"
                }
                style={inputStyle}
              />
            </div>

            {mediaUrl ? (
              <div
                style={{
                  marginBottom: "14px",
                  borderRadius: "14px",
                  overflow: "hidden",
                  border: "1px solid #e2e8f0",
                  background: "#f8fafc",
                }}
              >
                {mediaType === "video" ? (
                  <video
                    src={mediaUrl}
                    controls
                    style={{
                      width: "100%",
                      maxHeight: "220px",
                      display: "block",
                      background: "#000",
                    }}
                  />
                ) : (
                  <img
                    src={mediaUrl}
                    alt="preview"
                    style={{
                      width: "100%",
                      maxHeight: "220px",
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                )}
              </div>
            ) : null}

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "10px",
                marginBottom: "12px",
              }}
            >
              <div>
                <label style={labelStyle}>Button text</label>
                <input
                  value={buttonText}
                  onChange={(e) => setButtonText(e.target.value)}
                  placeholder="Masalan: Ko‘rish"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Button link</label>
                <input
                  value={buttonLink}
                  onChange={(e) => setButtonLink(e.target.value)}
                  placeholder="/catalog yoki /product/1"
                  style={inputStyle}
                />
              </div>
            </div>

            <div
              style={{
                background: "#f8fafc",
                borderRadius: "12px",
                padding: "12px",
                display: "flex",
                gap: "16px",
                marginBottom: "16px",
              }}
            >
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  cursor: "pointer",
                  flex: 1,
                }}
              >
                <div
                  onClick={() => setIsActive(!isActive)}
                  style={{
                    width: "44px",
                    height: "24px",
                    borderRadius: "12px",
                    background: isActive ? "#0d9488" : "#cbd5e1",
                    position: "relative",
                    transition: "background 0.2s",
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: "2px",
                      left: isActive ? "22px" : "2px",
                      width: "20px",
                      height: "20px",
                      borderRadius: "50%",
                      background: "white",
                      transition: "left 0.2s",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                    }}
                  />
                </div>
                <span
                  style={{
                    fontSize: "13px",
                    fontWeight: "600",
                    color: "#374151",
                  }}
                >
                  {isActive ? "✅ Aktiv" : "❌ Noaktiv"}
                </span>
              </label>
            </div>

            <button
              onClick={saveBanner}
              disabled={saving || uploading}
              style={{
                width: "100%",
                padding: "14px",
                border: "none",
                borderRadius: "14px",
                background:
                  saving || uploading
                    ? "#94a3b8"
                    : "linear-gradient(135deg, #0d9488, #0891b2)",
                color: "white",
                fontWeight: "700",
                fontSize: "15px",
                cursor: saving || uploading ? "not-allowed" : "pointer",
                boxShadow: "0 4px 14px rgba(13,148,136,0.4)",
              }}
            >
              {uploading
                ? "⏳ Media yuklanmoqda..."
                : saving
                ? "💾 Saqlanmoqda..."
                : editingId
                ? "💾 O'zgarishlarni saqlash"
                : "➕ Banner qo'shish"}
            </button>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <div style={{ fontSize: "40px", marginBottom: "12px" }}>⏳</div>
            <div style={{ color: "#64748b", fontWeight: "600" }}>
              Yuklanmoqda...
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "60px 20px",
              background: "white",
              borderRadius: "20px",
              boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
            }}
          >
            <div style={{ fontSize: "48px", marginBottom: "12px" }}>🎯</div>
            <div style={{ fontWeight: "700", color: "#1a1a2e", fontSize: "16px" }}>
              Bannerlar yo'q
            </div>
            <div style={{ color: "#94a3b8", fontSize: "13px", marginTop: "6px" }}>
              "+ Qo'shish" tugmasini bosing
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {filtered.map((banner) => (
              <div
                key={banner.id}
                style={{
                  background: "white",
                  borderRadius: "16px",
                  boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
                  border: `1px solid ${banner.is_active ? "#e2faf8" : "#fef2f2"}`,
                  overflow: "hidden",
                }}
              >
                <div style={{ display: "flex", gap: "0", alignItems: "stretch" }}>
                  <div
                    style={{
                      width: "4px",
                      flexShrink: 0,
                      background: banner.is_active
                        ? "linear-gradient(to bottom, #0d9488, #0891b2)"
                        : "#ef4444",
                    }}
                  />

                  <div
                    style={{
                      width: "88px",
                      height: "88px",
                      flexShrink: 0,
                      background: "#f1f5f9",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "10px 12px 10px 10px",
                      borderRadius: "12px",
                      overflow: "hidden",
                    }}
                  >
                    {banner.media_url ? (
                      banner.media_type === "video" ? (
                        <div
                          style={{
                            width: "100%",
                            height: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background: "#0f172a",
                            color: "white",
                            fontSize: "24px",
                          }}
                        >
                          ▶
                        </div>
                      ) : (
                        <img
                          src={banner.media_url}
                          alt={banner.title || "banner"}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      )
                    ) : (
                      <span style={{ fontSize: "28px" }}>🖼️</span>
                    )}
                  </div>

                  <div
                    style={{
                      flex: 1,
                      padding: "10px 10px 10px 0",
                      minWidth: 0,
                    }}
                  >
                    <div
                      style={{
                        fontWeight: "700",
                        fontSize: "14px",
                        color: "#1a1a2e",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {banner.title || "Nomsiz banner"}
                    </div>

                    <div
                      style={{
                        fontSize: "11px",
                        color: "#94a3b8",
                        marginTop: "3px",
                      }}
                    >
                      {banner.media_type} • Sort: {banner.sort_order}
                    </div>

                    {banner.subtitle ? (
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#64748b",
                          marginTop: "6px",
                          lineHeight: "16px",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {banner.subtitle}
                      </div>
                    ) : null}

                    <div style={{ display: "flex", gap: "6px", marginTop: "8px" }}>
                      <button
                        onClick={() => toggleActive(banner)}
                        style={{
                          background: banner.is_active ? "#dcfce7" : "#fee2e2",
                          color: banner.is_active ? "#15803d" : "#dc2626",
                          border: "none",
                          borderRadius: "6px",
                          padding: "4px 8px",
                          cursor: "pointer",
                          fontSize: "11px",
                          fontWeight: "600",
                        }}
                      >
                        {banner.is_active ? "✅ Aktiv" : "❌ Off"}
                      </button>

                      <button
                        onClick={() => openEditForm(banner)}
                        style={{
                          background: "#eff6ff",
                          color: "#2563eb",
                          border: "none",
                          borderRadius: "6px",
                          padding: "4px 8px",
                          cursor: "pointer",
                          fontSize: "11px",
                          fontWeight: "600",
                        }}
                      >
                        ✏️ Tahrir
                      </button>

                      <button
                        onClick={() => deleteBanner(banner.id)}
                        style={{
                          background: "#fef2f2",
                          color: "#dc2626",
                          border: "none",
                          borderRadius: "6px",
                          padding: "4px 8px",
                          cursor: "pointer",
                          fontSize: "11px",
                          fontWeight: "600",
                        }}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ height: "80px" }} />
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "12px",
  fontWeight: "600",
  color: "#475569",
  marginBottom: "5px",
  letterSpacing: "0.3px",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  border: "1.5px solid #e2e8f0",
  borderRadius: "10px",
  fontSize: "14px",
  color: "#1e293b",
  background: "white",
  boxSizing: "border-box",
  outline: "none",
};
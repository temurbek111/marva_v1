"use client";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Category {
  id: number;
  name: string;
  slug: string;
}

interface Product {
  id: number;
  name: string;
  price: number;
  old_price: number | null;
  image_url: string | null;
  images?: string[] | null;
  category_id: number | null;
  description: string | null;
  full_description: string | null;
  brand: string | null;
  country: string | null;
  article: string | null;
  package_info: string | null;
  usage_area: string | null;
  stock: number;
  is_active: boolean;
  is_featured: boolean;
  categories?: { name: string };
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [tab, setTab] = useState<"all" | "active" | "inactive">("all");

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [oldPrice, setOldPrice] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [fullDescription, setFullDescription] = useState("");
  const [brand, setBrand] = useState("");
  const [country, setCountry] = useState("");
  const [article, setArticle] = useState("");
  const [packageInfo, setPackageInfo] = useState("");
  const [usageArea, setUsageArea] = useState("");
  const [stock, setStock] = useState("0");
  const [isActive, setIsActive] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function handleGenerateAIInfo() {
    if (!name.trim()) {
      alert("Avval mahsulot nomini (Nomi) kiriting!");
      return;
    }
    
    setIsAiLoading(true);
    try {
      const res = await fetch("/api/ai/generate-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Noma'lum xatolik");
      }
      
      if (data.description) setDescription(data.description);
      if (data.full_description) setFullDescription(data.full_description);
      
    } catch (error: any) {
      alert("❌ AI xatosi: " + error.message);
    } finally {
      setIsAiLoading(false);
    }
  }

  async function loadData() {
    setLoading(true);

    const [{ data: cats }, { data: prods }] = await Promise.all([
      supabase.from("categories").select("*").order("name"),
      supabase
        .from("products")
        .select("*, categories(name)")
        .order("created_at", { ascending: false }),
    ]);

    setCategories(cats || []);
    setProducts(prods || []);
    setLoading(false);
  }

  async function uploadImage(file: File): Promise<string | null> {
    setUploading(true);

    try {
      const ext = file.name.split(".").pop();
      const fileName = `${Date.now()}_${Math.random()
        .toString(36)
        .slice(2)}.${ext}`;

      const { error } = await supabase.storage
        .from("products")
        .upload(fileName, file, { upsert: true });

      if (error) {
        alert("❌ Rasm yuklanmadi: " + error.message);
        return null;
      }

      const { data } = supabase.storage.from("products").getPublicUrl(fileName);
      return data.publicUrl;
    } catch (e: any) {
      alert("❌ " + (e?.message || "Yuklashda xato"));
      return null;
    } finally {
      setUploading(false);
    }
  }

  async function handleImagesChange(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const remainCount = 5 - imageUrls.length;

    if (remainCount <= 0) {
      alert("Maksimum 5 ta rasm yuklash mumkin");
      e.target.value = "";
      return;
    }

    const selectedFiles = files.slice(0, remainCount);

    const localPreviews = await Promise.all(
      selectedFiles.map(
        (file) =>
          new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = (ev) => resolve(ev.target?.result as string);
            reader.readAsDataURL(file);
          })
      )
    );

    setImagePreviews((prev) => [...prev, ...localPreviews]);

    const uploadedUrls: string[] = [];

    for (const file of selectedFiles) {
      const url = await uploadImage(file);
      if (url) uploadedUrls.push(url);
    }

    setImageUrls((prev) => [...prev, ...uploadedUrls]);

    e.target.value = "";
  }

  function removeImage(index: number) {
    setImageUrls((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  }

  function resetForm() {
    setEditingId(null);
    setName("");
    setPrice("");
    setOldPrice("");
    setImageUrls([]);
    setImagePreviews([]);
    setCategoryId("");
    setDescription("");
    setFullDescription("");
    setBrand("");
    setCountry("");
    setArticle("");
    setPackageInfo("");
    setUsageArea("");
    setStock("0");
    setIsActive(true);
    setIsFeatured(false);
    setShowForm(false);
  }

  function openEditForm(product: Product) {
    setEditingId(product.id);
    setName(product.name || "");
    setPrice(String(product.price || ""));
    setOldPrice(product.old_price ? String(product.old_price) : "");

    const existingImages =
      product.images && product.images.length > 0
        ? product.images
        : product.image_url
        ? [product.image_url]
        : [];

    setImageUrls(existingImages);
    setImagePreviews(existingImages);

    setCategoryId(product.category_id ? String(product.category_id) : "");
    setDescription(product.description || "");
    setFullDescription(product.full_description || "");
    setBrand(product.brand || "");
    setCountry(product.country || "");
    setArticle(product.article || "");
    setPackageInfo(product.package_info || "");
    setUsageArea(product.usage_area || "");
    setStock(String(product.stock || 0));
    setIsActive(product.is_active);
    setIsFeatured(product.is_featured);
    setShowForm(true);

    setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 100);
  }

  async function saveProduct() {
    if (!name.trim()) {
      alert("Mahsulot nomini kiriting!");
      return;
    }

    if (!price) {
      alert("Narxni kiriting!");
      return;
    }

    setSaving(true);

    const payload = {
      name: name.trim(),
      price: Number(price),
      old_price: oldPrice ? Number(oldPrice) : null,
      image_url: imageUrls[0] || null,
      images: imageUrls,
      category_id: categoryId ? Number(categoryId) : null,
      description: description.trim() || null,
      full_description: fullDescription.trim() || null,
      brand: brand.trim() || null,
      country: country.trim() || null,
      article: article.trim() || null,
      package_info: packageInfo.trim() || null,
      usage_area: usageArea.trim() || null,
      stock: Number(stock || 0),
      is_active: isActive,
      is_featured: isFeatured,
    };

    let error;

    if (editingId) {
      const res = await supabase
        .from("products")
        .update(payload)
        .eq("id", editingId);
      error = res.error;
    } else {
      const res = await supabase.from("products").insert(payload);
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

  async function deleteProduct(id: number) {
    if (!confirm("Mahsulotni o'chirishni tasdiqlaysizmi?")) return;

    const { error } = await supabase.from("products").delete().eq("id", id);

    if (error) {
      alert("❌ " + error.message);
      return;
    }

    loadData();
  }

  async function toggleActive(product: Product) {
    await supabase
      .from("products")
      .update({ is_active: !product.is_active })
      .eq("id", product.id);

    loadData();
  }

  const filtered = products.filter((p) =>
    tab === "all" ? true : tab === "active" ? p.is_active : !p.is_active
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
            <div
              style={{ color: "white", fontWeight: "700", fontSize: "18px" }}
            >
              🛍️ Mahsulotlar
            </div>
            <div
              style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px" }}
            >
              {products.length} ta mahsulot
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
                ? `Barchasi (${products.length})`
                : t === "active"
                ? `✅ Aktiv (${products.filter((p) => p.is_active).length})`
                : `❌ Noaktiv (${products.filter((p) => !p.is_active).length})`}
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
                  {editingId
                    ? "✏️ Mahsulotni tahrirlash"
                    : "➕ Yangi mahsulot"}
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    color: "#94a3b8",
                    marginTop: "2px",
                  }}
                >
                  Barcha (* bilan) maydonlar majburiy
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

            <div style={{ marginBottom: "16px" }}>
              <label style={labelStyle}>📸 Mahsulot rasmlari (1–5 ta)</label>

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
                    <div style={{ fontSize: "28px", marginBottom: "4px" }}>
                      ⏳
                    </div>
                    <div style={{ fontSize: "13px", fontWeight: "600" }}>
                      Yuklanmoqda...
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: "center", color: "#94a3b8" }}>
                    <div style={{ fontSize: "36px", marginBottom: "6px" }}>
                      📷
                    </div>
                    <div style={{ fontSize: "13px", fontWeight: "600" }}>
                      Rasm yuklash
                    </div>
                    <div style={{ fontSize: "11px", marginTop: "2px" }}>
                      1 tadan 5 tagacha rasm
                    </div>
                  </div>
                )}

                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImagesChange}
                  style={{
                    position: "absolute",
                    opacity: 0,
                    inset: 0,
                    cursor: "pointer",
                  }}
                />
              </label>

              {imagePreviews.length > 0 && (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: "10px",
                    marginTop: "12px",
                  }}
                >
                  {imagePreviews.map((img, index) => (
                    <div
                      key={index}
                      style={{
                        position: "relative",
                        borderRadius: "12px",
                        overflow: "hidden",
                        border: "1px solid #e2e8f0",
                        background: "white",
                        aspectRatio: "1 / 1",
                      }}
                    >
                      <img
                        src={img}
                        alt={`preview-${index}`}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />

                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        style={{
                          position: "absolute",
                          top: "6px",
                          right: "6px",
                          background: "#ef4444",
                          color: "white",
                          border: "none",
                          borderRadius: "50%",
                          width: "24px",
                          height: "24px",
                          cursor: "pointer",
                          fontWeight: "bold",
                          fontSize: "12px",
                        }}
                      >
                        ✕
                      </button>

                      <div
                        style={{
                          position: "absolute",
                          left: "6px",
                          bottom: "6px",
                          background: "rgba(0,0,0,0.65)",
                          color: "white",
                          fontSize: "10px",
                          padding: "2px 6px",
                          borderRadius: "999px",
                          fontWeight: "600",
                        }}
                      >
                        {index === 0 ? "Asosiy" : `${index + 1}-rasm`}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ marginBottom: "12px" }}>
              <label style={labelStyle}>Nomi *</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Masalan: 3M Filtek Supreme"
                style={inputStyle}
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
                <label style={labelStyle}>Narx ($) *</label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="50000"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Eski narx</label>
                <input
                  type="number"
                  value={oldPrice}
                  onChange={(e) => setOldPrice(e.target.value)}
                  placeholder="70000"
                  style={inputStyle}
                />
              </div>
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
                <label style={labelStyle}>Kategoriya</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  style={inputStyle}
                >
                  <option value="">— Tanlang —</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={labelStyle}>Miqdor (dona)</label>
                <input
                  type="number"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  placeholder="0"
                  style={inputStyle}
                />
              </div>
            </div>

            <div style={{ marginBottom: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "4px" }}>
                <label style={{ ...labelStyle, marginBottom: 0 }}>Qisqa tavsif</label>
                <button
                  type="button"
                  onClick={handleGenerateAIInfo}
                  disabled={isAiLoading}
                  style={{
                    background: "linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    padding: "6px 12px",
                    fontSize: "12px",
                    fontWeight: "bold",
                    cursor: isAiLoading ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    boxShadow: "0 2px 8px rgba(168, 85, 247, 0.4)",
                    opacity: isAiLoading ? 0.7 : 1
                  }}
                >
                  {isAiLoading ? "⏳ Yozilmoqda..." : "✨ AI orqali to'ldirish"}
                </button>
              </div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Mahsulot haqida qisqa ma'lumot..."
                rows={2}
                style={{ ...inputStyle, resize: "vertical" as const }}
              />
            </div>

            <div style={{ marginBottom: "12px" }}>
              <label style={labelStyle}>To'liq tavsif</label>
              <textarea
                value={fullDescription}
                onChange={(e) => setFullDescription(e.target.value)}
                placeholder="Batafsil tavsif, xususiyatlar..."
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
                <label style={labelStyle}>Brend</label>
                <input
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="3M, Dentsply..."
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Mamlakat</label>
                <input
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="Germaniya..."
                  style={inputStyle}
                />
              </div>
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
                <label style={labelStyle}>Artikul</label>
                <input
                  value={article}
                  onChange={(e) => setArticle(e.target.value)}
                  placeholder="ART-001"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Qadoqlash</label>
                <input
                  value={packageInfo}
                  onChange={(e) => setPackageInfo(e.target.value)}
                  placeholder="1 quti / 10 dona"
                  style={inputStyle}
                />
              </div>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={labelStyle}>Qo'llanish sohasi</label>
              <input
                value={usageArea}
                onChange={(e) => setUsageArea(e.target.value)}
                placeholder="Kompozit plomba uchun..."
                style={inputStyle}
              />
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
                  onClick={() => setIsFeatured(!isFeatured)}
                  style={{
                    width: "44px",
                    height: "24px",
                    borderRadius: "12px",
                    background: isFeatured ? "#f59e0b" : "#cbd5e1",
                    position: "relative",
                    transition: "background 0.2s",
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: "2px",
                      left: isFeatured ? "22px" : "2px",
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
                  {isFeatured ? "⭐ Featured" : "Featured yo'q"}
                </span>
              </label>
            </div>

            <button
              onClick={saveProduct}
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
                ? "⏳ Rasm yuklanmoqda..."
                : saving
                ? "💾 Saqlanmoqda..."
                : editingId
                ? "💾 O'zgarishlarni saqlash"
                : "➕ Mahsulot qo'shish"}
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
            <div style={{ fontSize: "48px", marginBottom: "12px" }}>📦</div>
            <div
              style={{ fontWeight: "700", color: "#1a1a2e", fontSize: "16px" }}
            >
              Mahsulotlar yo'q
            </div>
            <div
              style={{ color: "#94a3b8", fontSize: "13px", marginTop: "6px" }}
            >
              "+ Qo'shish" tugmasini bosing
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {filtered.map((product) => {
              const previewImage =
                product.images?.[0] || product.image_url || null;

              return (
                <div
                  key={product.id}
                  style={{
                    background: "white",
                    borderRadius: "16px",
                    boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
                    border: `1px solid ${
                      product.is_active ? "#e2faf8" : "#fef2f2"
                    }`,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{ display: "flex", gap: "0", alignItems: "stretch" }}
                  >
                    <div
                      style={{
                        width: "4px",
                        flexShrink: 0,
                        background: product.is_active
                          ? "linear-gradient(to bottom, #0d9488, #0891b2)"
                          : "#ef4444",
                      }}
                    />

                    <div
                      style={{
                        width: "80px",
                        height: "80px",
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
                      {previewImage ? (
                        <img
                          src={previewImage}
                          alt={product.name}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        <span style={{ fontSize: "28px" }}>📦</span>
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
                        {product.name}
                      </div>

                      <div
                        style={{
                          fontSize: "11px",
                          color: "#94a3b8",
                          marginTop: "2px",
                        }}
                      >
                        {product.categories?.name || "Kategoriyasiz"} • Sklad:{" "}
                        {product.stock} dona
                      </div>

                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          marginTop: "6px",
                        }}
                      >
                        <span
                          style={{
                            fontWeight: "800",
                            color: "#0d9488",
                            fontSize: "15px",
                          }}
                        >
                          {Number(product.price).toLocaleString()} $
                        </span>

                        {product.old_price && (
                          <span
                            style={{
                              textDecoration: "line-through",
                              color: "#cbd5e1",
                              fontSize: "11px",
                            }}
                          >
                            {Number(product.old_price).toLocaleString()}
                          </span>
                        )}

                        {product.is_featured && (
                          <span
                            style={{
                              background: "#fef3c7",
                              color: "#92400e",
                              fontSize: "10px",
                              padding: "1px 5px",
                              borderRadius: "4px",
                              fontWeight: "700",
                            }}
                          >
                            ⭐
                          </span>
                        )}
                      </div>

                      <div
                        style={{ display: "flex", gap: "6px", marginTop: "8px" }}
                      >
                        <button
                          onClick={() => toggleActive(product)}
                          style={{
                            background: product.is_active
                              ? "#dcfce7"
                              : "#fee2e2",
                            color: product.is_active ? "#15803d" : "#dc2626",
                            border: "none",
                            borderRadius: "6px",
                            padding: "4px 8px",
                            cursor: "pointer",
                            fontSize: "11px",
                            fontWeight: "600",
                          }}
                        >
                          {product.is_active ? "✅ Aktiv" : "❌ Off"}
                        </button>

                        <button
                          onClick={() => openEditForm(product)}
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
                          onClick={() => deleteProduct(product.id)}
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
              );
            })}
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
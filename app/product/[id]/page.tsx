import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Truck,
  ShieldCheck,
  BadgeDollarSign,
} from "lucide-react";
import { ProductViewTracker } from "@/components/product/ProductViewTracker";
import { BottomNav } from "@/components/layout/BottomNav";
import { Container } from "@/components/ui/Container";
import { AddToCartButton } from "@/components/product/AddToCartButton";
import { FavoriteButton } from "@/components/product/FavoriteButton";
import { ShareButton } from "@/components/product/ShareButton";
import { ProductTabs } from "@/components/product/ProductTabs";
import { supabase } from "@/lib/supabase";
import { ProductImageGallery } from "@/components/product/ProductImageGallery";

function getBackHrefFromReferer(referer: string | null) {
  if (!referer) return "/catalog";

  try {
    const url = new URL(referer);

    if (url.pathname.startsWith("/catalog")) {
      return `${url.pathname}${url.search}`;
    }

    return "/catalog";
  } catch {
    if (referer.startsWith("/catalog")) {
      return referer;
    }

    return "/catalog";
  }
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!supabase) return notFound();

  const headersList = await headers();
  const referer = headersList.get("referer");
  const backHref = getBackHrefFromReferer(referer);

  const { data: product, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", Number(id))
    .eq("is_active", true)
    .single();

  if (error || !product) return notFound();

  const productImages =
    product.images && product.images.length > 0
      ? product.images
      : product.image_url
        ? [product.image_url]
        : [];

  const mappedProduct = {
    id: String(product.id),
    slug: `product-${product.id}`,
    categoryId: product.category_id ? String(product.category_id) : "",
    name: product.name,
    price: Number(product.price || 0),
    oldPrice: product.old_price ? Number(product.old_price) : undefined,
    currency: "USD",
    image: productImages[0] || "",
    images: productImages,
    shortDescription: product.description || "Dental mahsulot",
    description:
      product.full_description || product.description || "Dental mahsulot",
    stock: Number(product.stock || 0),
    featured: false,
    brand: product.brand || "",
    country: product.country || "",
    article: product.article || "",
    packageInfo: product.package_info || "",
    usageArea: product.usage_area || "",
  };

  const viewedProduct = {
    id: String(product.id),
    name: product.name,
    price: Number(product.price || 0),
    image: productImages[0] || "",
    description: product.description || "Dental mahsulot",
  };

  const stockStatus =
    mappedProduct.stock <= 0
      ? {
          label: "Tez orada keladi",
          className: "bg-[#FDECEC] text-[#D94B4B]",
        }
      : mappedProduct.stock < 3
        ? {
            label: "Sanoqli qolgan",
            className: "bg-[#FFF4E5] text-[#D9822B]",
          }
        : {
            label: "Sotuvda mavjud",
            className: "bg-[#ECF8F3] text-[#0A7A5A]",
          };

  const detailItems = [
    { label: "Brend", value: mappedProduct.brand },
    { label: "Davlat", value: mappedProduct.country },
    { label: "Artikul", value: mappedProduct.article },
    { label: "Qadoq", value: mappedProduct.packageInfo },
    { label: "Qo‘llanish sohasi", value: mappedProduct.usageArea },
  ].filter((item) => item.value);

  return (
    <div className="min-h-screen bg-[#EEF3F1] pb-28">
      <Container className="px-0 pb-6">
        <div className="overflow-hidden rounded-b-[34px] bg-white shadow-[0_18px_50px_rgba(15,23,42,0.10)]">
          <div className="relative bg-[linear-gradient(180deg,#F7FAF9_0%,#EEF3F1_100%)] px-4 pb-6 pt-4">
            <div className="absolute left-4 top-4 z-20">
              <Link
                href={backHref}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-white/95 text-[#12332D] shadow-[0_8px_20px_rgba(0,0,0,0.08)] ring-1 ring-black/5 backdrop-blur"
              >
                <ArrowLeft size={20} />
              </Link>
            </div>

            <div className="absolute right-4 top-4 z-20 flex items-center gap-2">
              <FavoriteButton product={mappedProduct} />
              <ShareButton title={mappedProduct.name} />
            </div>

            <div className="pt-12">
              <ProductImageGallery
                images={mappedProduct.images}
                productName={mappedProduct.name}
              />
            </div>
          </div>

          <div className="px-4 pb-5">
            <div className="-mt-3 rounded-[28px] bg-white p-5 shadow-[0_16px_35px_rgba(15,23,42,0.08)] ring-1 ring-black/5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm text-[#5D7E78]">
                    {mappedProduct.shortDescription}
                  </p>

                  <h1 className="mt-2 text-[26px] font-bold leading-8 text-[#12332D]">
                    {mappedProduct.name}
                  </h1>
                </div>

                <span
                  className={`shrink-0 rounded-full px-3 py-2 text-xs font-semibold ${stockStatus.className}`}
                >
                  {stockStatus.label}
                </span>
              </div>

              <div className="mt-4">
                <div className="flex flex-wrap items-end gap-x-3 gap-y-1">
                  <p className="text-[34px] font-bold leading-none text-[#004F45]">
                    ${mappedProduct.price}
                  </p>

                  {mappedProduct.oldPrice ? (
                    <p className="text-lg font-medium text-[#97ACA7] line-through">
                      ${mappedProduct.oldPrice}
                    </p>
                  ) : null}
                </div>

                {mappedProduct.oldPrice ? (
                  <p className="mt-2 text-sm text-[#5D7E78]">
                    Chegirmadagi narx
                  </p>
                ) : null}
              </div>

              {(mappedProduct.brand || mappedProduct.country) && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {mappedProduct.brand ? (
                    <span className="rounded-full bg-[#F4F8F7] px-3 py-2 text-xs font-semibold text-[#12332D] ring-1 ring-black/5">
                      Brend: {mappedProduct.brand}
                    </span>
                  ) : null}

                  {mappedProduct.country ? (
                    <span className="rounded-full bg-[#F4F8F7] px-3 py-2 text-xs font-semibold text-[#12332D] ring-1 ring-black/5">
                      Davlat: {mappedProduct.country}
                    </span>
                  ) : null}
                </div>
              )}
            </div>

            <ProductTabs
              description={mappedProduct.description}
              details={detailItems}
            />

            <div className="mt-4 rounded-[26px] bg-white p-4 shadow-[0_16px_35px_rgba(15,23,42,0.06)] ring-1 ring-black/5">
              <div className="grid grid-cols-1 gap-3">
                <div className="flex items-center gap-3 rounded-[18px] bg-[#F8FBFA] px-4 py-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EAF3F1] text-[#004F45]">
                    <Truck size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#12332D]">
                      Tez yetkazib berish
                    </p>
                    <p className="text-xs text-[#5D7E78]">
                      Buyurtma qulay va tez topshiriladi
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-[18px] bg-[#F8FBFA] px-4 py-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EAF3F1] text-[#004F45]">
                    <ShieldCheck size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#12332D]">
                      Sifat kafolati
                    </p>
                    <p className="text-xs text-[#5D7E78]">
                      Ishonchli va sifatli dental mahsulotlar
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-[18px] bg-[#F8FBFA] px-4 py-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EAF3F1] text-[#004F45]">
                    <BadgeDollarSign size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#12332D]">
                      Qulay narx
                    </p>
                    <p className="text-xs text-[#5D7E78]">
                      Narxlar doimiy yangilanib turadi
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <AddToCartButton product={mappedProduct} />
          </div>
        </div>
      </Container>

      <BottomNav />
      <ProductViewTracker product={viewedProduct} />
    </div>
  );
}
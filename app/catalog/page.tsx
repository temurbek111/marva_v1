import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";
import { cookies } from "next/headers";
import { supabase } from "@/lib/supabase";
import { Container } from "@/components/ui/Container";
import { BottomNav } from "@/components/layout/BottomNav";
import { ProductCard } from "@/components/product/ProductCard";
import { CatalogFilters } from "./CatalogFilters";
import { CatalogScrollRestorer } from "@/components/catalog/CatalogScrollRestorer";

const PAGE_SIZE = 24;

type UseCategory =
  | "all"
  | "terapiya"
  | "endodontiya"
  | "ortopediya"
  | "jarrohlik"
  | "gigiyena"
  | "uskunalar"
  | "umumiy";

type PageProps = {
  searchParams: Promise<{ use?: string; q?: string; page?: string }>;
};

async function getProducts(
  useCategory: string,
  searchQuery: string,
  page: number
) {
  if (!supabase) {
    return { products: [], total: 0 };
  }

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase
    .from("products")
    .select(
      "id, name, price, old_price, images, image_url, use_category, stock, is_featured, category_id, description",
      { count: "exact" }
    )
    .eq("is_active", true)
    .gt("stock", 0)
    .order("id", { ascending: false })
    .range(from, to);

  if (useCategory !== "all") {
    query = query.eq("use_category", useCategory);
  }

  if (searchQuery) {
    query = query.ilike("name", `%${searchQuery}%`);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error("Catalog fetch error:", error.message);
    return { products: [], total: 0 };
  }

  return {
    products: data ?? [],
    total: count ?? 0,
  };
}

export default async function CatalogPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;

  const useCategory = (resolvedParams.use || "all") as UseCategory;
  const searchQuery = resolvedParams.q?.trim() || "";

  const parsedPage = Number.parseInt(resolvedParams.page || "1", 10);
  const page = Number.isNaN(parsedPage) ? 1 : Math.max(1, parsedPage);

  const cookieStore = await cookies();
  const lang = cookieStore.get("lang")?.value === "ru" ? "ru" : "uz";

  const { products, total } = await getProducts(useCategory, searchQuery, page);
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const t = {
    catalog: lang === "uz" ? "Katalog" : "Каталог",
    found:
      lang === "uz"
        ? `${total} ta mahsulot topildi`
        : `Найдено: ${total}`,
    products: lang === "uz" ? "Mahsulotlar" : "Товары",
    subtitle:
      lang === "uz"
        ? "Tanlangan filtrlar bo'yicha"
        : "По выбранным фильтрам",
    notfound: lang === "uz" ? "Mahsulot topilmadi" : "Товар не найден",
    tryother:
      lang === "uz"
        ? "Boshqa filter yoki qidiruvni sinab ko'ring"
        : "Попробуйте другой фильтр",
    search:
      lang === "uz" ? "Mahsulotlarni qidiring" : "Поиск товаров",
    prev: lang === "uz" ? "← Oldingi" : "← Назад",
    next: lang === "uz" ? "Keyingi →" : "Вперёд →",
    count: lang === "uz" ? `${total} ta` : `${total} шт.`,
  };

  const buildHref = (params: Record<string, string>) => {
    const search = new URLSearchParams(params).toString();
    return search ? `/catalog?${search}` : "/catalog";
  };

  return (
    <div className="min-h-screen bg-[#EEF3F1] pb-28">
      <CatalogScrollRestorer />

      <Container className="py-4">
        <div className="rounded-[28px] bg-white p-4 shadow-[0_16px_40px_rgba(15,23,42,0.06)] ring-1 ring-black/5">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[18px] bg-white text-[#12332D] shadow-[0_10px_25px_rgba(15,23,42,0.06)] ring-1 ring-black/5"
            >
              <ArrowLeft size={22} />
            </Link>

            <form
              action="/catalog"
              method="GET"
              className="flex flex-1 items-center gap-3"
            >
              {useCategory !== "all" && (
                <input type="hidden" name="use" value={useCategory} />
              )}

              <div className="flex min-h-[56px] flex-1 items-center gap-3 rounded-[18px] bg-[#F4F7F6] px-4">
                <Search size={20} className="text-[#6D8781]" />
                <input
                  type="text"
                  name="q"
                  defaultValue={searchQuery}
                  placeholder={t.search}
                  className="w-full bg-transparent text-[15px] text-[#12332D] outline-none placeholder:text-[#6D8781]"
                />
              </div>
            </form>
          </div>

          <div className="mt-4">
            <p className="text-sm text-[#6D8781]">MARVA Dental market</p>
            <h1 className="mt-1 text-[30px] font-bold text-[#12332D]">
              {t.catalog}
            </h1>
            <p className="mt-1 text-sm text-[#5D7E78]">{t.found}</p>
          </div>
        </div>

        <CatalogFilters
          activeUse={useCategory}
          searchQuery={searchQuery}
          lang={lang}
        />

        <div className="mt-6 rounded-[28px] bg-white p-4 shadow-[0_16px_40px_rgba(15,23,42,0.06)] ring-1 ring-black/5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-[22px] font-bold text-[#12332D]">
                {t.products}
              </h3>
              <p className="mt-1 text-sm text-[#5D7E78]">{t.subtitle}</p>
            </div>

            <div className="rounded-full bg-[#F4F7F6] px-3 py-2 text-xs font-semibold text-[#12332D]">
              {t.count}
            </div>
          </div>

          {products.length === 0 ? (
            <div className="mt-5 rounded-[22px] bg-[#F8FBFA] p-6 text-center">
              <p className="text-base font-semibold text-[#12332D]">
                {t.notfound}
              </p>
              <p className="mt-2 text-sm text-[#5D7E78]">{t.tryother}</p>
            </div>
          ) : (
            <div className="mt-5 grid grid-cols-2 gap-4">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={{
                    id: String(product.id),
                    slug: `product-${product.id}`,
                    categoryId: product.category_id
                      ? String(product.category_id)
                      : "",
                    name: product.name || "Nomsiz mahsulot",
                    price: Number(product.price || 0),
                    oldPrice: product.old_price
                      ? Number(product.old_price)
                      : undefined,
                    currency: "USD",
                    image: product.images?.[0] || product.image_url || "",
                    shortDescription:
                      product.description || "Dental mahsulot",
                    description: product.description || "Dental mahsulot",
                    stock: Number(product.stock || 0),
                    featured: Boolean(product.is_featured),
                  }}
                />
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-3">
              {page > 1 && (
                <Link
                  href={buildHref({
                    ...(useCategory !== "all" ? { use: useCategory } : {}),
                    ...(searchQuery ? { q: searchQuery } : {}),
                    page: String(page - 1),
                  })}
                  className="rounded-full bg-[#F8FBFA] px-4 py-2 text-sm font-semibold text-[#12332D] ring-1 ring-black/5"
                >
                  {t.prev}
                </Link>
              )}

              <span className="rounded-full bg-[#004F45] px-4 py-2 text-sm font-semibold text-white">
                {page} / {totalPages}
              </span>

              {page < totalPages && (
                <Link
                  href={buildHref({
                    ...(useCategory !== "all" ? { use: useCategory } : {}),
                    ...(searchQuery ? { q: searchQuery } : {}),
                    page: String(page + 1),
                  })}
                  className="rounded-full bg-[#F8FBFA] px-4 py-2 text-sm font-semibold text-[#12332D] ring-1 ring-black/5"
                >
                  {t.next}
                </Link>
              )}
            </div>
          )}
        </div>
      </Container>

      <BottomNav />
    </div>
  );
}
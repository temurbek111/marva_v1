const MOYSKLAD_BASE = process.env.MOYSKLAD_BASE_URL || "https://api.moysklad.ru/api/remap/1.2";
const MOYSKLAD_TOKEN = process.env.MOYSKLAD_TOKEN!;

const headers = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${MOYSKLAD_TOKEN}`,
};

export async function getProductById(productId: string) {
  const res = await fetch(`${MOYSKLAD_BASE}/entity/product/${productId}`, {
    method: "GET",
    headers,
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Mahsulotni olishda xatolik");
  }

  return res.json();
}

export async function getProductStock(productId: string): Promise<number> {
  const product = await getProductById(productId);

  return Number(product.stock || 0);
}

export async function createCustomerOrder(params: {
  productId: string;
  quantity: number;
  customerName: string;
  customerPhone: string;
}) {
  const { productId, quantity, customerName, customerPhone } = params;

  const payload = {
    name: `TG-${Date.now()}`,
    description: `Telegram orqali zakaz. Mijoz: ${customerName}, tel: ${customerPhone}`,
    positions: [
      {
        quantity,
        assortment: {
          meta: {
            href: `${MOYSKLAD_BASE}/entity/product/${productId}`,
            type: "product",
            mediaType: "application/json",
          },
        },
      },
    ],
  };

  const res = await fetch(`${MOYSKLAD_BASE}/entity/customerorder`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Order yaratilmadi: ${text}`);
  }

  return res.json();
}
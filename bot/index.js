require("dotenv").config({ path: ".env.local" });

const fs = require("fs");
const path = require("path");
const TelegramBot = require("node-telegram-bot-api");
const { createClient } = require("@supabase/supabase-js");

const token = process.env.BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;
const webAppUrl = process.env.NEXT_PUBLIC_WEBAPP_URL;
const appBaseUrl =
  process.env.APP_BASE_URL || process.env.NEXT_PUBLIC_WEBAPP_URL;
const adminChatId = process.env.ADMIN_CHAT_ID
  ? String(process.env.ADMIN_CHAT_ID)
  : null;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!token) {
  throw new Error("BOT_TOKEN yoki TELEGRAM_BOT_TOKEN kerak");
}

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_URL va NEXT_PUBLIC_SUPABASE_ANON_KEY kerak"
  );
}

const supabase = createClient(supabaseUrl, supabaseKey);
const bot = new TelegramBot(token, { polling: true });

const STORE_DIR = path.join(__dirname, "data");
const STORE_FILE = path.join(STORE_DIR, "bot-store.json");

if (!fs.existsSync(STORE_DIR)) {
  fs.mkdirSync(STORE_DIR, { recursive: true });
}

function readStore() {
  try {
    if (!fs.existsSync(STORE_FILE)) {
      return { users: {}, orderRequests: [] };
    }

    const raw = fs.readFileSync(STORE_FILE, "utf8");
    const parsed = JSON.parse(raw);

    return {
      users: parsed.users || {},
      orderRequests: Array.isArray(parsed.orderRequests)
        ? parsed.orderRequests
        : [],
    };
  } catch {
    return { users: {}, orderRequests: [] };
  }
}

function writeStore(data) {
  fs.writeFileSync(STORE_FILE, JSON.stringify(data, null, 2), "utf8");
}

function getUser(chatId) {
  const store = readStore();
  return store.users[String(chatId)] || null;
}

function saveUser(chatId, userData) {
  const store = readStore();
  store.users[String(chatId)] = userData;
  writeStore(store);
}
function normalizePhoneForDb(phone = "") {
  return String(phone).replace(/[^\d+]/g, "").trim();
}

async function upsertCustomer(userData) {
  try {
    const payload = {
      telegram_id: userData?.telegramId ? Number(userData.telegramId) : null,
      telegram_username: userData?.telegramUsername || null,
      full_name: userData?.fullName?.trim() || "Mijoz",
      phone: normalizePhoneForDb(userData?.phone || ""),
      address: userData?.address?.trim() || null,
      source: "bot",
    };

    // 1) Avval telegram_id bo'yicha
    if (payload.telegram_id) {
      const { data, error } = await supabase
        .from("customers")
        .upsert(payload, { onConflict: "telegram_id" })
        .select("*")
        .single();

      if (error) {
        console.error("customers upsert error:", error.message);
        return null;
      }

      return data;
    }

    // 2) Telegram ID bo'lmasa phone bo'yicha
    if (payload.phone) {
      const { data: existingByPhone } = await supabase
        .from("customers")
        .select("*")
        .eq("phone", payload.phone)
        .maybeSingle();

      if (existingByPhone?.id) {
        const { data, error } = await supabase
          .from("customers")
          .update(payload)
          .eq("id", existingByPhone.id)
          .select("*")
          .single();

        if (error) {
          console.error("customers phone update error:", error.message);
          return null;
        }

        return data;
      }

      const { data, error } = await supabase
        .from("customers")
        .insert(payload)
        .select("*")
        .single();

      if (error) {
        console.error("customers insert error:", error.message);
        return null;
      }

      return data;
    }

    return null;
  } catch (error) {
    console.error("upsertCustomer error:", error);
    return null;
  }
}

function saveOrderRequest(orderData) {
  const store = readStore();
  store.orderRequests.unshift(orderData);
  writeStore(store);
}

const sessions = new Map();

function setSession(chatId, data) {
  sessions.set(String(chatId), data);
}

function getSession(chatId) {
  return sessions.get(String(chatId)) || null;
}

function clearSession(chatId) {
  sessions.delete(String(chatId));
}

const MENU_TEXTS = [
  "🛍 Mini App",
  "📘 Mahsulot haqida ma'lumot",
  "🧾 Zakaz qoldirish",
  "👤 Profilim",
  "☎️ Operator bilan bog'lanish",
];

function isMainMenuText(text = "") {
  return MENU_TEXTS.includes(text);
}

async function sendTyping(chatId) {
  try {
    await bot.sendChatAction(chatId, "typing");
  } catch {
    // ignore
  }
}

function normalizeSearchText(text = "") {
  return text
    .toLowerCase()
    .replace("haqida ma'lumot bering", "")
    .replace("haqida malumot bering", "")
    .replace("haqida ma'lumot", "")
    .replace("haqida malumot", "")
    .replace("ma'lumot bering", "")
    .replace("malumot bering", "")
    .replace("ma'lumot", "")
    .replace("malumot", "")
    .replace("avval", "")
    .replace(/\s+/g, " ")
    .trim();
}

function getMainMenuReplyMarkup() {
  const miniAppButton =
    webAppUrl && webAppUrl.startsWith("https://")
      ? { text: "🛍 Mini App", web_app: { url: webAppUrl } }
      : { text: "🛍 Mini App" };

  return {
    keyboard: [
      [miniAppButton, { text: "📘 Mahsulot haqida ma'lumot" }],
      [{ text: "🧾 Zakaz qoldirish" }, { text: "👤 Profilim" }],
      [{ text: "☎️ Operator bilan bog'lanish" }],
    ],
    resize_keyboard: true,
  };
}

function getPhoneRequestKeyboard() {
  return {
    keyboard: [[{ text: "📱 Raqamni yuborish", request_contact: true }]],
    resize_keyboard: true,
    one_time_keyboard: true,
  };
}

async function sendAdminMessage(text, options = {}) {
  if (!adminChatId) return;

  try {
    await bot.sendMessage(adminChatId, text, options);
  } catch (error) {
    console.error("Admin chatga yuborishda xato:", error.message);
  }
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

function getStockLabel(stock) {
  const stockNumber = Number(stock || 0);

  if (stockNumber <= 0) return "Tez orada keladi";
  if (stockNumber < 3) return "Sanoqli qolgan";
  return "Sotuvda mavjud";
}

function formatProductMessage(product) {
  const lines = [
    `🦷 ${product.name}`,
    "",
    `💵 Narx: $${Number(product.price || 0)}`,
    `📦 Holati: ${getStockLabel(product.stock)}`,
  ];

  if (product.brand) lines.push(`🏷 Brend: ${product.brand}`);
  if (product.country) lines.push(`🌍 Davlat: ${product.country}`);
  if (product.article) lines.push(`🔖 Artikul: ${product.article}`);
  if (product.package_info) lines.push(`📦 Qadoq: ${product.package_info}`);
  if (product.usage_area)
    lines.push(`🩺 Qo‘llanish sohasi: ${product.usage_area}`);
  if (product.description) lines.push(`📝 Tavsif: ${product.description}`);

  return lines.join("\n");
}

async function findCategoryByQuery(queryText) {
  const q = normalizeSearchText(queryText);
  if (!q) return null;

  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .ilike("name", `%${q}%`)
    .limit(1);

  if (error) {
    console.error("Category search error:", error.message);
    return null;
  }

  return data?.[0] || null;
}

async function findProductsByCategory(categoryId) {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .eq("category_id", Number(categoryId))
    .order("id", { ascending: false })
    .limit(5);

  if (error) {
    console.error("Category products error:", error.message);
    return [];
  }

  return data || [];
}

async function findProductsByQuery(queryText) {
  const q = normalizeSearchText(queryText);
  if (!q) return [];

  let result = await supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .ilike("name", `${q}%`)
    .order("id", { ascending: false })
    .limit(3);

  if (!result.error && result.data?.length) return result.data;

  result = await supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .ilike("name", `%${q}%`)
    .order("id", { ascending: false })
    .limit(3);

  if (!result.error && result.data?.length) return result.data;

  result = await supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .ilike("description", `%${q}%`)
    .order("id", { ascending: false })
    .limit(3);

  if (result.error) {
    console.error("Product search error:", result.error.message);
    return [];
  }

  return result.data || [];
}

bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const existingUser = getUser(chatId);

  if (existingUser) {
    await bot.sendMessage(
      chatId,
      "🦷 MARVA Dental shop botiga qaytganingiz bilan!",
      {
        reply_markup: getMainMenuReplyMarkup(),
      }
    );
    return;
  }

  setSession(chatId, {
    step: "register_full_name",
    data: {
      telegramId: msg.from?.id || null,
      telegramUsername: msg.from?.username ? `@${msg.from.username}` : "",
      fullName: "",
      phone: "",
      address: "",
    },
  });

  await bot.sendMessage(
    chatId,
    "🦷 MARVA Dental shop botiga xush kelibsiz!\n\nAvval ro‘yxatdan o‘tamiz.\n\nIsm-familyangizni yuboring:"
  );
});

bot.on("message", async (msg) => {
  const chatId = msg.chat.id;

  if (msg.web_app_data) {
    await bot.sendMessage(
      chatId,
      `✅ Buyurtma olindi: ${msg.web_app_data.data}`
    );
    return;
  }

  const text = msg.text;
  const session = getSession(chatId);
  const existingUser = getUser(chatId);

  if (!text && !msg.contact) return;
  if (text && text.startsWith("/start")) return;

  if (text && isMainMenuText(text)) {
    clearSession(chatId);
  }

  if (session?.step === "register_full_name") {
    const nextData = {
      ...session.data,
      fullName: (text || "").trim(),
    };

    setSession(chatId, {
      step: "register_phone",
      data: nextData,
    });

    await bot.sendMessage(
      chatId,
      "Telefon raqamingizni tugma orqali yuboring:",
      {
        reply_markup: getPhoneRequestKeyboard(),
      }
    );
    return;
  }

  if (session?.step === "register_phone") {
    const contact = msg.contact;

    if (!contact || String(contact.user_id || "") !== String(msg.from?.id || "")) {
      await bot.sendMessage(
        chatId,
        "Pastdagi 📱 tugmani bosing va telefon raqamingizni yuboring.",
        {
          reply_markup: getPhoneRequestKeyboard(),
        }
      );
      return;
    }

    const nextData = {
      ...session.data,
      phone: contact.phone_number || "",
    };

    setSession(chatId, {
      step: "register_address",
      data: nextData,
    });

    await bot.sendMessage(chatId, "Manzilingizni yuboring:", {
      reply_markup: {
        remove_keyboard: true,
      },
    });
    return;
  }

  if (session?.step === "register_address") {
  const finalUser = {
    ...session.data,
    address: (text || "").trim(),
    createdAt: new Date().toISOString(),
  };

  const customer = await upsertCustomer(finalUser);

  saveUser(chatId, {
    ...finalUser,
    customerId: customer?.id || null,
  });

  clearSession(chatId);

  await bot.sendMessage(
    chatId,
    "✅ Ro‘yxatdan o‘tdingiz. Endi menyudan foydalanishingiz mumkin.",
    {
      reply_markup: getMainMenuReplyMarkup(),
    }
  );

  await sendAdminMessage(
    `🆕 Yangi bot user ro‘yxatdan o‘tdi\n\n` +
      `👤 ${finalUser.fullName}\n` +
      `📞 ${finalUser.phone}\n` +
      `📍 ${finalUser.address}\n` +
      `🆔 Telegram ID: ${finalUser.telegramId || "yo‘q"}\n` +
      `📨 Username: ${finalUser.telegramUsername || "yo‘q"}\n` +
      `🗂 Customer ID: ${customer?.id || "saqlanmadi"}`
  );

  return;
}

  if (session?.step === "product_info_name") {
    const queryText = (text || "").trim();

    if (!queryText) {
      await bot.sendMessage(chatId, "Mahsulot nomini yozing.");
      return;
    }

    await sendTyping(chatId);

    const foundCategory = await findCategoryByQuery(queryText);

    if (foundCategory) {
      const categoryProducts = await findProductsByCategory(foundCategory.id);
      clearSession(chatId);

      if (!categoryProducts.length) {
        await bot.sendMessage(
          chatId,
          `📂 ${foundCategory.name} kategoriyasi topildi, lekin hozir aktiv mahsulot yo‘q.`,
          {
            reply_markup: getMainMenuReplyMarkup(),
          }
        );
        return;
      }

      const productList = categoryProducts
        .map((item) => {
          const stockLabel = getStockLabel(item.stock);
          return `• ${item.name} — $${Number(item.price || 0)} (${stockLabel})`;
        })
        .join("\n");

      await bot.sendMessage(
        chatId,
        `📂 ${foundCategory.name} kategoriyasi bo‘yicha topilgan mahsulotlar:\n\n${productList}`,
        {
          reply_markup: getMainMenuReplyMarkup(),
        }
      );
      return;
    }

    const foundProducts = await findProductsByQuery(queryText);
    clearSession(chatId);

    if (!foundProducts.length) {
      await bot.sendMessage(
        chatId,
        "❌ Bizda bunaqa mahsulot yo‘q.\n\nBoshqa nom bilan qayta urinib ko‘ring.",
        {
          reply_markup: getMainMenuReplyMarkup(),
        }
      );
      return;
    }

    const mainProduct = foundProducts[0];
    await bot.sendMessage(chatId, formatProductMessage(mainProduct), {
      reply_markup: getMainMenuReplyMarkup(),
    });

    if (foundProducts.length > 1) {
      const otherNames = foundProducts
        .slice(1)
        .map((item) => `• ${item.name}`)
        .join("\n");

      if (otherNames) {
        await bot.sendMessage(
          chatId,
          `Yana o‘xshash mahsulotlar topildi:\n\n${otherNames}`
        );
      }
    }

    return;
  }

  if (session?.step === "order_product_name") {
    const nextData = {
      ...session.data,
      productName: (text || "").trim(),
    };

    setSession(chatId, {
      step: "order_quantity",
      data: nextData,
    });

    await bot.sendMessage(chatId, "Nechta kerak? Miqdorni yuboring:");
    return;
  }

  if (session?.step === "order_quantity") {
    const nextData = {
      ...session.data,
      quantity: (text || "").trim(),
    };

    setSession(chatId, {
      step: "order_address",
      data: nextData,
    });

    await bot.sendMessage(
      chatId,
      "Yetkazib berish manzilini yuboring:\n\nYoki hozirgi manzilni qayta yuboring."
    );
    return;
  }

  if (session?.step === "order_address") {
    const orderData = {
      id: `BOT-${Date.now()}`,
      createdAt: new Date().toISOString(),
      source: "telegram_bot",
      chatId: String(chatId),
      telegramId: msg.from?.id || existingUser?.telegramId || null,
      telegramUsername:
        existingUser?.telegramUsername ||
        (msg.from?.username ? `@${msg.from.username}` : ""),
      fullName: existingUser?.fullName || "",
      phone: existingUser?.phone || "",
      productName: session.data.productName,
      quantity: session.data.quantity,
      address: (text || "").trim(),
      status: "new",
    };

    saveOrderRequest(orderData);
    clearSession(chatId);

    await bot.sendMessage(
      chatId,
      "✅ Zakaz qabul qilindi.\n\nOperator siz bilan tez orada bog‘lanadi.",
      {
        reply_markup: getMainMenuReplyMarkup(),
      }
    );

    await sendAdminMessage(
      `🛒 Yangi bot zakaz\n\n` +
        `🆔 ${orderData.id}\n` +
        `👤 ${orderData.fullName || "Noma'lum"}\n` +
        `📞 ${orderData.phone || "yo‘q"}\n` +
        `📨 ${orderData.telegramUsername || "yo‘q"}\n` +
        `📦 Mahsulot: ${orderData.productName}\n` +
        `🔢 Miqdor: ${orderData.quantity}\n` +
        `📍 Manzil: ${orderData.address}\n` +
        `⏰ ${orderData.createdAt}`
    );

    return;
  }

  if (session?.step === "operator_question") {
    clearSession(chatId);

    await bot.sendMessage(
      chatId,
      "✅ Savolingiz qabul qilindi.\n\nOperator tez orada javob beradi.",
      {
        reply_markup: getMainMenuReplyMarkup(),
      }
    );

    await sendAdminMessage(
      `☎️ Operatorga savol\n\n` +
        `👤 ${existingUser?.fullName || "Noma'lum"}\n` +
        `📞 ${existingUser?.phone || "yo‘q"}\n` +
        `📨 ${existingUser?.telegramUsername || "yo‘q"}\n` +
        `📝 Savol: ${(text || "").trim()}`
    );

    return;
  }

  if (!existingUser) {
    await bot.sendMessage(chatId, "Avval /start bosib ro‘yxatdan o‘ting.");
    return;
  }

  if (text === "👤 Profilim") {
    await bot.sendMessage(
      chatId,
      `👤 Profilingiz\n\n` +
        `Ism: ${existingUser.fullName || "yo‘q"}\n` +
        `Telefon: ${existingUser.phone || "yo‘q"}\n` +
        `Manzil: ${existingUser.address || "yo‘q"}\n` +
        `Telegram: ${existingUser.telegramUsername || "yo‘q"}`
    );
    return;
  }

  if (text === "📘 Mahsulot haqida ma'lumot") {
    setSession(chatId, {
      step: "product_info_name",
      data: {},
    });

    await bot.sendMessage(
      chatId,
      "Qaysi mahsulot haqida ma’lumot kerak?\n\nMahsulot nomini yozing."
    );
    return;
  }

  if (text === "🧾 Zakaz qoldirish") {
    setSession(chatId, {
      step: "order_product_name",
      data: {},
    });

    await bot.sendMessage(
      chatId,
      "Qaysi mahsulot kerak?\n\nMahsulot nomini yozing."
    );
    return;
  }

  if (text === "☎️ Operator bilan bog'lanish") {
    setSession(chatId, {
      step: "operator_question",
      data: {},
    });

    await bot.sendMessage(
      chatId,
      "Savolingizni yozing.\n\nOperatorga yuboriladi."
    );
    return;
  }

  await bot.sendMessage(chatId, "Kerakli bo‘limni menyudan tanlang.", {
    reply_markup: getMainMenuReplyMarkup(),
  });
});

bot.on("callback_query", async (query) => {
  const chatId = query.message?.chat?.id;
  const messageId = query.message?.message_id;
  const data = query.data || "";
  const currentText = query.message?.text || "";

  try {
    await bot.answerCallbackQuery(query.id, { text: "⏳ Bajarilmoqda..." });
  } catch (e) {
    console.error("answerCallbackQuery error:", e.message);
  }

  if (!chatId || !messageId) return;

  // Disabled tugmalar uchun
  if (data.startsWith("done:")) {
    try {
      await bot.answerCallbackQuery(query.id, {
        text: "Bu bosqich allaqachon bajarilgan",
        show_alert: false,
      });
    } catch {}
    return;
  }

  const colonIdx = data.indexOf(":");
  if (colonIdx === -1) return;

  const action = data.slice(0, colonIdx);
  const orderId = Number(data.slice(colonIdx + 1));

  if (!orderId || !["accept", "ontheway", "delivered"].includes(action)) {
    console.log("Invalid action/orderId:", action, orderId);
    return;
  }

  let statusPayload = {};
  let statusLabel = "";
  let customerMessage = "";
  let newKeyboard = [];

  if (action === "accept") {
    statusPayload = {
      order_status: "Kuryerga topshirildi",
      delivery_status: "Dastavkaga berildi",
      notify_customer: true,
      customer_message:
        "📦 Buyurtmangiz kuryerga topshirildi. Tez orada yo‘lga chiqadi.",
    };

    statusLabel = "✅ Kuryer qabul qildi";
    customerMessage =
      "📦 Buyurtmangiz kuryerga topshirildi. Tez orada yo‘lga chiqadi.";

    newKeyboard = [
      [{ text: "✅ Qabul qilindi", callback_data: `done:accept:${orderId}` }],
      [{ text: "🚚 Yo'ldaman", callback_data: `ontheway:${orderId}` }],
      [{ text: "📦 Yetkazdim", callback_data: `delivered:${orderId}` }],
    ];
  } else if (action === "ontheway") {
    statusPayload = {
      order_status: "Kuryerga topshirildi",
      delivery_status: "Yo'lda",
      notify_customer: true,
      customer_message:
        "🚚 Buyurtmangiz yo‘lda. Kuryer siz bilan bog‘lanadi.",
    };

    statusLabel = "🚚 Kuryer yo'lda";
    customerMessage =
      "🚚 Buyurtmangiz yo‘lda. Kuryer siz bilan bog‘lanadi.";

    newKeyboard = [
      [{ text: "✅ Qabul qilindi", callback_data: `done:accept:${orderId}` }],
      [{ text: "✅ Yo'lda", callback_data: `done:ontheway:${orderId}` }],
      [{ text: "📦 Yetkazdim", callback_data: `delivered:${orderId}` }],
    ];
  } else if (action === "delivered") {
    statusPayload = {
      order_status: "Yetkazildi",
      delivery_status: "Yetkazib berdi",
      notify_customer: true,
      customer_message:
        "✅ Buyurtmangiz muvaffaqiyatli yetkazildi. Xaridingiz uchun rahmat.",
    };

    statusLabel = "📦 Yetkazib berildi!";
    customerMessage =
      "✅ Buyurtmangiz muvaffaqiyatli yetkazildi. Xaridingiz uchun rahmat.";

    newKeyboard = [
      [{ text: "✅ Qabul qilindi", callback_data: `done:accept:${orderId}` }],
      [{ text: "✅ Yo'lda", callback_data: `done:ontheway:${orderId}` }],
      [{ text: "✅ Yetkazildi", callback_data: `done:delivered:${orderId}` }],
    ];
  }

  if (appBaseUrl) {
    try {
      const apiUrl = `${appBaseUrl.replace(/\/$/, "")}/api/orders/status`;

      const res = await fetchWithTimeout(
        apiUrl,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId,
            ...statusPayload,
          }),
        },
        10000
      );

      const result = await res.json();

      if (!res.ok || !result.success) {
        console.error("[BOT] API error:", result.message);
      }
    } catch (err) {
      console.error("[BOT] API fetch error:", err.message);
    }
  } else {
    console.warn("[BOT] APP_BASE_URL topilmadi — status DB ga yozilmadi");
  }

  try {
    const updatedText = currentText.includes(statusLabel)
      ? currentText
      : `${currentText}\n\n${statusLabel}`;

    await bot.editMessageText(updatedText, {
      chat_id: chatId,
      message_id: messageId,
      reply_markup: { inline_keyboard: newKeyboard },
    });
  } catch (editErr) {
    console.error("[BOT] editMessageText error:", editErr.message);
  }
});

console.log("🤖 Marva bot started!");
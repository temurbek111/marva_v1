# MARVA Dental shop Mini App

Telegram Mini App uchun tayyor starter loyiha.

## Stack
- Next.js 15
- TypeScript
- Tailwind CSS
- Zustand
- Supabase

## Ishga tushirish
```bash
npm install
npm run dev
```

## Environment
`.env.example` fayldan nusxa oling.

## Asosiy sahifalar
- `/` home
- `/catalog` katalog
- `/product/[id]` mahsulot sahifasi
- `/cart` savatcha
- `/checkout` checkout
- `/profile` profil
- `/auth` auth

## Telegram sozlash
1. BotFather orqali bot oching.
2. Mini App URL ni HTTPS domen bilan ulang.
3. `telegram-web-app.js` avtomatik yuklanadi.
4. Telegram ichida ochilganda user data `window.Telegram.WebApp.initDataUnsafe.user` orqali olinadi.

## Features:
- Supabase bilan real products/orders ulangan
- Admin panelli
- OTP auth 
- PDF katalogni bazaga import qilina olinishi
  

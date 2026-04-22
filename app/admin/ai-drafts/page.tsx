"use client";

import Link from "next/link";
import { ArrowLeft, Package, ShoppingBag, Users, Megaphone } from "lucide-react";

const cards = [
  {
    title: "Buyurtmalar",
    desc: "Tushgan zakazlar, status va dostavka",
    href: "/admin/orders",
    icon: ShoppingBag,
  },
  {
    title: "Mahsulotlar",
    desc: "Mahsulot qo'shish, edit va o'chirish",
    href: "/admin/products",
    icon: Package,
  },
  {
    title: "Bannerlar",
    desc: "Home promo, aksiya va reklama bloklari",
    href: "/admin/banners",
    icon: Megaphone,
  },
  {
    title: "Mijozlar",
    desc: "Ro'yxatdan o'tgan foydalanuvchilar bazasi",
    href: "/admin/customers",
    icon: Users,
  },
];

export default function AdminPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#eef3f1",
        fontFamily: "'Segoe UI', sans-serif",
      }}
    >
      <div
        style={{
          background: "white",
          position: "sticky",
          top: 0,
          zIndex: 50,
          borderBottom: "1px solid #e5ece9",
        }}
      >
        <div
          style={{
            maxWidth: "480px",
            margin: "0 auto",
            padding: "18px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Link
            href="/"
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "999px",
              background: "#f3f7f6",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#12332d",
              textDecoration: "none",
            }}
          >
            <ArrowLeft size={20} />
          </Link>

          <div
            style={{
              fontSize: "18px",
              fontWeight: 700,
              color: "#12332d",
            }}
          >
            Admin
          </div>

          <div style={{ width: "44px", height: "44px" }} />
        </div>
      </div>

      <div
        style={{
          maxWidth: "480px",
          margin: "0 auto",
          padding: "18px 16px 110px",
        }}
      >
        <div
          style={{
            background: "white",
            borderRadius: "28px",
            padding: "18px",
            boxShadow: "0 16px 40px rgba(15,23,42,0.06)",
            border: "1px solid rgba(15,23,42,0.04)",
            marginBottom: "16px",
          }}
        >
          <div
            style={{
              fontSize: "14px",
              color: "#4f8c84",
              marginBottom: "8px",
            }}
          >
            Admin panel
          </div>

          <div
            style={{
              fontSize: "24px",
              fontWeight: 800,
              color: "#12332d",
              lineHeight: 1.15,
              marginBottom: "10px",
            }}
          >
            Boshqaruv bo'limi
          </div>

          <div
            style={{
              fontSize: "15px",
              color: "#5d7e78",
              lineHeight: 1.5,
            }}
          >
            Mahsulotlar, bannerlar, buyurtmalar va mijozlar bazasi
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gap: "16px",
          }}
        >
          {cards.map((card) => {
            const Icon = card.icon;

            return (
              <Link
                key={card.title}
                href={card.href}
                style={{
                  textDecoration: "none",
                }}
              >
                <div
                  style={{
                    background: "white",
                    borderRadius: "28px",
                    padding: "18px",
                    boxShadow: "0 14px 34px rgba(15,23,42,0.06)",
                    border: "1px solid rgba(15,23,42,0.04)",
                    transition: "transform 0.2s ease",
                  }}
                >
                  <div
                    style={{
                      width: "46px",
                      height: "46px",
                      borderRadius: "18px",
                      background: "#f3f7f6",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#0b5d52",
                      marginBottom: "16px",
                    }}
                  >
                    <Icon size={22} />
                  </div>

                  <div
                    style={{
                      fontSize: "18px",
                      fontWeight: 800,
                      color: "#12332d",
                      marginBottom: "10px",
                    }}
                  >
                    {card.title}
                  </div>

                  <div
                    style={{
                      fontSize: "14px",
                      color: "#5d7e78",
                      lineHeight: 1.5,
                    }}
                  >
                    {card.desc}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
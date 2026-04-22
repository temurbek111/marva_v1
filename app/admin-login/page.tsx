"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const router = useRouter();

  function handleLogin() {
    if (password === "marva2024secret") {
      document.cookie = "admin_auth=marva2024secret; path=/; max-age=86400";
      router.push("/admin");
    } else {
      setError(true);
    }
  }

  return (
    <div className="min-h-screen bg-[#EEF3F1] flex items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-[28px] bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
        <h1 className="text-2xl font-bold text-[#12332D] mb-2">Admin kirish</h1>
        <p className="text-sm text-[#5D7E78] mb-6">Parolni kiriting</p>
        <input
          type="password"
          value={password}
          onChange={(e) => { setPassword(e.target.value); setError(false); }}
          onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          placeholder="Parol"
          className="w-full rounded-[14px] bg-[#F4F7F6] px-4 py-3 text-[#12332D] outline-none mb-3"
        />
        {error && <p className="text-red-500 text-sm mb-3">Parol noto'g'ri</p>}
        <button onClick={handleLogin} className="w-full rounded-[14px] bg-[#004F45] py-3 text-white font-semibold">
          Kirish
        </button>
      </div>
    </div>
  );
}

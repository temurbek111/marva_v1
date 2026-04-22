"use client";

import { useState } from "react";

type Props = {
  address: string;
  setAddress: (value: string) => void;
  latitude: number | null;
  setLatitude: (value: number | null) => void;
  longitude: number | null;
  setLongitude: (value: number | null) => void;
};

export default function DeliveryLocationField({
  address,
  setAddress,
  latitude,
  setLatitude,
  longitude,
  setLongitude,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleUseCurrentLocation = () => {
    setLoading(true);
    setError("");

    if (!navigator.geolocation) {
      setError("Geolokatsiya qo‘llab-quvvatlanmaydi");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        setLatitude(lat);
        setLongitude(lng);

        const yandexLink = `https://yandex.uz/maps/?ll=${lng}%2C${lat}&z=17&pt=${lng},${lat},pm2rdm`;

        setAddress(
          `Koordinata: ${lat}, ${lng}\nXarita: ${yandexLink}`
        );

        setLoading(false);
      },
      (geoError) => {
        setError(geoError.message || "Lokatsiyani olishda xato");
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  return (
    <div className="space-y-3">
      <textarea
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        placeholder="Manzilni kiriting yoki lokatsiyani yuboring"
        className="w-full rounded-xl border p-3 min-h-[110px]"
      />

      <button
        type="button"
        onClick={handleUseCurrentLocation}
        disabled={loading}
        className="rounded-xl border px-4 py-2"
      >
        {loading ? "Lokatsiya olinmoqda..." : "📍 Mening lokatsiyamni yuborish"}
      </button>

      {latitude && longitude ? (
        <p className="text-sm text-gray-600">
          Tanlangan koordinata: {latitude}, {longitude}
        </p>
      ) : null}

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
"use client";

import { useEffect, useRef, useState } from "react";

type DeliveryLocationFieldProps = {
  address: string;
  setAddress: (value: string) => void;
  latitude: number | null;
  setLatitude: (value: number | null) => void;
  longitude: number | null;
  setLongitude: (value: number | null) => void;
};

declare global {
  interface Window {
    L?: any;
  }
}

const DEFAULT_LAT = 41.311081;
const DEFAULT_LNG = 69.240562;

function makeYandexMapLink(lat: number, lng: number) {
  return `https://yandex.uz/maps/?ll=${lng}%2C${lat}&z=17&pt=${lng},${lat},pm2rdm`;
}

export default function DeliveryLocationField({
  address,
  setAddress,
  latitude,
  setLatitude,
  longitude,
  setLongitude,
}: DeliveryLocationFieldProps) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  const [mapReady, setMapReady] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);

  const selectedLat = latitude ?? DEFAULT_LAT;
  const selectedLng = longitude ?? DEFAULT_LNG;

  const updateLocation = (lat: number, lng: number) => {
    setLatitude(lat);
    setLongitude(lng);

    const mapLink = makeYandexMapLink(lat, lng);
    setAddress(mapLink);

    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    }

    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([lat, lng], 17);
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;

    const existingCss = document.querySelector(
      'link[href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"]'
    );

    if (!existingCss) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    if (window.L) {
      setMapReady(true);
      return;
    }

    const existingScript = document.querySelector(
      'script[src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"]'
    );

    if (existingScript) {
      existingScript.addEventListener("load", () => setMapReady(true));
      return;
    }

    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.async = true;
    script.onload = () => setMapReady(true);
    document.body.appendChild(script);
  }, []);

  useEffect(() => {
    if (!mapReady || !mapRef.current || !window.L || mapInstanceRef.current) {
      return;
    }

    const L = window.L;

    const map = L.map(mapRef.current, {
      center: [selectedLat, selectedLng],
      zoom: 17,
      zoomControl: true,
      attributionControl: false,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
    }).addTo(map);

    const marker = L.marker([selectedLat, selectedLng], {
      draggable: true,
    }).addTo(map);

    marker.on("dragend", () => {
      const position = marker.getLatLng();
      updateLocation(position.lat, position.lng);
    });

    map.on("click", (event: any) => {
      updateLocation(event.latlng.lat, event.latlng.lng);
    });

    mapInstanceRef.current = map;
    markerRef.current = marker;

    setTimeout(() => {
      map.invalidateSize();
    }, 300);

    if (!address && latitude && longitude) {
      setAddress(makeYandexMapLink(latitude, longitude));
    }
  }, [mapReady]);

  const handleGetMyLocation = () => {
    if (!navigator.geolocation) {
      alert("Brauzeringiz lokatsiyani qo'llab-quvvatlamaydi.");
      return;
    }

    setLoadingLocation(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        updateLocation(lat, lng);
        setLoadingLocation(false);
      },
      (error) => {
        console.error("Location error:", error);
        alert("Lokatsiyani olish uchun ruxsat berishingiz kerak.");
        setLoadingLocation(false);
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
      <div className="overflow-hidden rounded-[22px] border border-black/5 bg-white shadow-sm">
        <div ref={mapRef} className="h-[260px] w-full" />
      </div>

      <button
        type="button"
        onClick={handleGetMyLocation}
        disabled={loadingLocation}
        className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold text-[#12332D] shadow-sm disabled:opacity-60"
      >
        {loadingLocation ? "Lokatsiya olinmoqda..." : "📍 Mening lokatsiyamni yuborish"}
      </button>

      <p className="text-xs leading-5 text-[#5D7E78]">
        Kartadan joyni tanlang yoki pinni sudrang. Tanlangan joy buyurtmaga
        xarita linki sifatida saqlanadi.
      </p>
    </div>
  );
}
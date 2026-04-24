"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type DeliveryLocationFieldProps = {
  address: string;
  setAddressAction: (value: string) => void;
  latitude: number | null;
  setLatitudeAction: (value: number | null) => void;
  longitude: number | null;
  setLongitudeAction: (value: number | null) => void;
};

type TelegramLocationData = {
  latitude: number;
  longitude: number;
  altitude?: number;
  course?: number;
  speed?: number;
  horizontal_accuracy?: number;
  vertical_accuracy?: number;
  course_accuracy?: number;
  speed_accuracy?: number;
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

function splitAddressValue(value: string) {
  const raw = String(value || "").trim();

  if (!raw) {
    return {
      manualAddress: "",
      mapLink: "",
    };
  }

  const lines = raw
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);

  const mapLinkLine =
    lines.find((line) => line.includes("https://yandex.uz/maps/")) || "";

  const manualLines = lines.filter((line) => line !== mapLinkLine);

  return {
    manualAddress: manualLines.join("\n"),
    mapLink: mapLinkLine,
  };
}

function combineAddressValue(manualAddress: string, mapLink: string) {
  const parts = [manualAddress.trim(), mapLink.trim()].filter(Boolean);
  return parts.join("\n");
}

function getTelegramLocation(): Promise<TelegramLocationData> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("Window mavjud emas."));
      return;
    }

    const locationManager = (window as any).Telegram?.WebApp?.LocationManager;

    if (!locationManager?.init || !locationManager?.getLocation) {
      reject(new Error("Telegram LocationManager mavjud emas."));
      return;
    }

    const requestLocation = () => {
      locationManager.getLocation(
        (locationData: TelegramLocationData | null) => {
          if (!locationData) {
            reject(new Error("Telegram lokatsiyaga ruxsat bermadi."));
            return;
          }

          resolve(locationData);
        }
      );
    };

    if (locationManager.isInited) {
      requestLocation();
      return;
    }

    locationManager.init(() => {
      requestLocation();
    });
  });
}

function getBrowserLocation(): Promise<TelegramLocationData> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      reject(new Error("Brauzer lokatsiyani qo'llab-quvvatlamaydi."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          horizontal_accuracy: position.coords.accuracy,
        });
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  });
}

export default function DeliveryLocationField({
  address,
  setAddressAction,
  latitude,
  setLatitudeAction,
  longitude,
  setLongitudeAction,
}: DeliveryLocationFieldProps) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  const initialAddressState = useMemo(() => splitAddressValue(address), [address]);

  const [manualAddress, setManualAddress] = useState(
    initialAddressState.manualAddress
  );
  const [mapLink, setMapLink] = useState(initialAddressState.mapLink);

  const [mapReady, setMapReady] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [locationWarning, setLocationWarning] = useState("");

  const selectedLat = latitude ?? DEFAULT_LAT;
  const selectedLng = longitude ?? DEFAULT_LNG;

  useEffect(() => {
    const parsed = splitAddressValue(address);

    setManualAddress(parsed.manualAddress);
    setMapLink(parsed.mapLink);
  }, [address]);

  useEffect(() => {
    const combined = combineAddressValue(manualAddress, mapLink);

    if (combined !== address) {
      setAddressAction(combined);
    }
  }, [manualAddress, mapLink, address, setAddressAction]);

  const updateLocation = (
    lat: number,
    lng: number,
    horizontalAccuracy?: number
  ) => {
    setLatitudeAction(lat);
    setLongitudeAction(lng);

    const nextMapLink = makeYandexMapLink(lat, lng);
    setMapLink(nextMapLink);

    if (horizontalAccuracy && horizontalAccuracy > 100) {
      setLocationWarning(
        `Lokatsiya taxminiy bo'lishi mumkin. Aniqlik: ${Math.round(
          horizontalAccuracy
        )} metr. Iltimos, xaritadagi pinni tekshirib qo'ying.`
      );
    } else {
      setLocationWarning("");
    }

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

    if (!mapLink && latitude && longitude) {
      setMapLink(makeYandexMapLink(latitude, longitude));
    }
  }, [mapReady]);

  const handleGetMyLocation = async () => {
    setLoadingLocation(true);
    setLocationWarning("");

    try {
      let locationData: TelegramLocationData;

      try {
        locationData = await getTelegramLocation();
      } catch {
        locationData = await getBrowserLocation();
      }

      updateLocation(
        locationData.latitude,
        locationData.longitude,
        locationData.horizontal_accuracy
      );
    } catch (error) {
      console.error("Location error:", error);

      setLocationWarning(
        "Lokatsiyani avtomatik olishning imkoni bo'lmadi. Iltimos, Telegram yoki brauzer sozlamalarida lokatsiyaga ruxsat bering yoki xaritadan joyni qo'lda tanlang."
      );
    } finally {
      setLoadingLocation(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="rounded-[22px] bg-[#F8FBFA] p-4 ring-1 ring-black/5">
        <label className="mb-2 block text-xs text-[#5D7E78]">
          Qo'lda manzil kiriting
        </label>

        <textarea
          value={manualAddress}
          onChange={(e) => setManualAddress(e.target.value)}
          placeholder="Masalan: Toshkent shahar, Chilonzor tumani, 19-kvartal, 12-uy"
          rows={3}
          className="w-full rounded-2xl border border-black/5 bg-white px-4 py-3 outline-none"
        />

        <p className="mt-2 text-xs leading-5 text-[#5D7E78]">
          Manzilni matn ko‘rinishida yozing. Xohlasangiz pastdagi xaritadan ham
          aniq lokatsiyani belgilang.
        </p>
      </div>

      <div className="overflow-hidden rounded-[22px] border border-black/5 bg-white shadow-sm">
        <div ref={mapRef} className="h-[260px] w-full" />
      </div>

      <button
        type="button"
        onClick={handleGetMyLocation}
        disabled={loadingLocation}
        className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold text-[#12332D] shadow-sm disabled:opacity-60"
      >
        {loadingLocation
          ? "Lokatsiya olinmoqda..."
          : "📍 Mening lokatsiyamni yuborish"}
      </button>

      {mapLink ? (
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-xs leading-5 text-emerald-800 break-all">
          <div className="mb-1 font-semibold">Saqlanadigan xarita linki:</div>
          {mapLink}
        </div>
      ) : null}

      {locationWarning ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-800">
          {locationWarning}
        </div>
      ) : null}

      <p className="text-xs leading-5 text-[#5D7E78]">
        Kartadan joyni tanlang yoki pinni sudrang. Tanlangan joy buyurtmaga
        xarita linki sifatida saqlanadi.
      </p>
    </div>
  );
}
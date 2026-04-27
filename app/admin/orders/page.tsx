export default function AdminOrdersPage() {
  return (
    <div className="min-h-screen bg-[#F3F6F5] px-4 py-8">
      <div className="mx-auto max-w-3xl rounded-[28px] bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-[#12332D]">Buyurtmalar</h1>

        <p className="mt-2 text-sm text-[#5D7E78]">
          Buyurtmalar admin paneli.
        </p>

        <p className="mt-4 text-sm text-[#5D7E78]">
          Telegramga buyurtma yuborish API kodi{" "}
          <code>app/api/orders/route.ts</code> ichida ishlaydi.
        </p>
      </div>
    </div>
  );
}
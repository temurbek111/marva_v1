"use client";

import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Edit3,
  RefreshCcw,
  Search,
  Eye,
  AlertTriangle
} from "lucide-react";


interface BlackpaperItem {
  id: string;
  product_id: number;
  name: string;
  generated_description: string;
  status: string;
  validation_flags: any;
  created_at: string;
}

export default function DescriptionQueuePage() {
  const [items, setItems] = useState<BlackpaperItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ready_for_review");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<BlackpaperItem | null>(null);
  const [editedDescription, setEditedDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchItems();
  }, [filter]);

  async function fetchItems() {
    setLoading(true);
    setError(null);
    try {
      let url = "/api/blackpapers/list?" + (filter !== "all" ? `status=${encodeURIComponent(filter)}` : "");
      const res = await fetch(url);
      if (!res.ok) {
        const text = await res.text();
        setError(`Request failed: ${res.status} ${res.statusText} - ${text}`);
        setItems([]);
        setLoading(false);
        return;
      }
      const json = await res.json();
      setItems(json.items || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
      setItems([]);
    }
    setLoading(false);
  }

  async function approveItem(id: string, description: string) {
    setProcessingId(id);
    const { error } = await supabase
      .from("products")
      .update({ description })
      .eq("id", selectedItem?.product_id);

    if (error) {
      alert("Error updating product: " + error.message);
    } else {
      await supabase
        .from("blackpapers")
        .update({ status: "published" })
        .eq("id", id);
      fetchItems();
      setSelectedItem(null);
    }
    setProcessingId(null);
  }

  async function rejectItem(id: string) {
    setProcessingId(id);
    await supabase
      .from("blackpapers")
      .update({ status: "rejected" })
      .eq("id", id);
    fetchItems();
    setProcessingId(null);
  }

  const openModal = (item: BlackpaperItem) => {
    setSelectedItem(item);
    setEditedDescription(item.generated_description || "");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="p-2 hover:bg-gray-100 rounded-lg">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-bold">Description Queue</h1>
          </div>
          <button
            onClick={fetchItems}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            <RefreshCcw className="w-4 h-4 inline mr-2" />
            Refresh
          </button>
        </div>

        <div className="mb-6">
          <div className="flex gap-2">
            {["all", "ready_for_review", "pending", "processing", "published", "rejected", "failed"].map(status => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg ${
                  filter === status ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700"
                }`}
              >
                {status.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : error ? (
          <div className="text-center py-8 text-red-600">{error}</div>
        ) : (
          <div className="grid gap-4">
            {items.map(item => (
              <div key={item.id} className="bg-white p-6 rounded-lg shadow">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">{item.name}</h3>
                    <p className="text-sm text-gray-500">ID: {item.product_id}</p>
                    <p className="text-sm text-gray-500">Status: {item.status}</p>
                    {item.validation_flags?.error && (
                      <p className="text-red-500 text-sm">
                        <AlertTriangle className="w-4 h-4 inline mr-1" />
                        {item.validation_flags.error}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openModal(item)}
                      className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
                    >
                      <Eye className="w-4 h-4 inline mr-1" />
                      Review
                    </button>
                    {item.status === "ready_for_review" && (
                      <>
                        <button
                          onClick={() => approveItem(item.id, item.generated_description)}
                          disabled={processingId === item.id}
                          className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                        >
                          <CheckCircle className="w-4 h-4 inline mr-1" />
                          Approve
                        </button>
                        <button
                          onClick={() => rejectItem(item.id)}
                          disabled={processingId === item.id}
                          className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
                        >
                          <XCircle className="w-4 h-4 inline mr-1" />
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedItem && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white p-6 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <h2 className="text-xl font-bold mb-4">{selectedItem.name}</h2>
              <textarea
                value={editedDescription}
                onChange={(e) => setEditedDescription(e.target.value)}
                className="w-full h-32 p-2 border rounded mb-4"
                placeholder="Edit description..."
              />
              <div className="flex gap-2">
                <button
                  onClick={() => approveItem(selectedItem.id, editedDescription)}
                  disabled={processingId === selectedItem.id}
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                >
                  Approve
                </button>
                <button
                  onClick={() => rejectItem(selectedItem.id)}
                  disabled={processingId === selectedItem.id}
                  className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
                >
                  Reject
                </button>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
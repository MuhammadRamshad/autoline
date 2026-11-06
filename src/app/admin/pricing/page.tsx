"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { 
  ArrowLeft, 
  Trash2, 
  Plus, 
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Edit2,
  Save,
  X
} from "lucide-react";

interface PriceItem {
  _id?: string;
  category: string;
  name?: string;
  price: number;
  group?: string;
  groupLabel?: string;
  order?: number;
}

const GROUPS = [
  { key: "2 wheeler", title: "2 WHEELER" },
  { key: "car", title: "CAR" },
  { key: "pickup", title: "PICKUP" },
  { key: "traveller", title: "TRAVELLER" },
  { key: "other", title: "OTHER CATEGORIES" },
];

export default function PricingManagementPage() {
  const [prices, setPrices] = useState<PriceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState<string>("");

  // Add category state
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newPrice, setNewPrice] = useState<string>("");
  const [newGroup, setNewGroup] = useState<string>("other");

  // Toast
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchPrices = async (isBackground = false) => {
    try {
      if (!isBackground) setRefreshing(true);
      const res = await fetch(`/api/prices?_t=${Date.now()}`, { cache: "no-store" });
      const data = await res.json();
      if (data.success && data.prices) {
        setPrices(data.prices);
      }
    } catch (e) {
      console.error(e);
      showToast("Failed to load prices", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(() => fetchPrices(true), 4000);
    return () => clearInterval(interval);
  }, []);

  const startEditPrice = (item: PriceItem) => {
    setEditingCategory(item.category);
    setEditPrice(item.price === 0 ? "" : item.price.toString());
  };

  const savePriceSetting = async (categoryName: string, groupName?: string) => {
    try {
      const parsedPrice = editPrice.trim() === "" ? 0 : Number(editPrice);
      const res = await fetch("/api/prices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: categoryName,
          price: parsedPrice,
          group: groupName,
        }),
      });

      if (res.ok) {
        setEditingCategory(null);
        showToast(`Rate updated for ${categoryName}`, "success");
        fetchPrices();
      } else {
        showToast("Failed to save price", "error");
      }
    } catch (e) {
      console.error(e);
      showToast("Error updating rate", "error");
    }
  };

  const handleDeleteCategory = async (category: string, id?: string) => {
    if (!confirm(`Are you sure you want to delete the "${category}" category?`)) return;

    try {
      const param = id ? `id=${id}` : `category=${encodeURIComponent(category)}`;
      const res = await fetch(`/api/prices?${param}`, { method: "DELETE" });
      if (res.ok) {
        showToast(`Category "${category}" deleted`, "success");
        fetchPrices();
      } else {
        showToast("Failed to delete category", "error");
      }
    } catch (e) {
      console.error(e);
      showToast("Error deleting category", "error");
    }
  };

  const handleAddNewCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    try {
      const parsed = newPrice.trim() === "" ? 0 : Number(newPrice);
      const res = await fetch("/api/prices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: newCatName.trim(),
          price: parsed,
          group: newGroup,
        }),
      });

      if (res.ok) {
        setNewCatName("");
        setNewPrice("");
        setShowAddCategory(false);
        showToast("New category created successfully", "success");
        fetchPrices();
      } else {
        showToast("Failed to add category", "error");
      }
    } catch (e) {
      console.error(e);
      showToast("Error adding category", "error");
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col selection:bg-white selection:text-black">
      <Navbar />

      {/* Floating Toast Notification */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 animate-in fade-in slide-in-from-top-4 duration-200">
          <div
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded shadow-xl border text-xs font-mono font-medium ${
              toast.type === "success"
                ? "bg-neutral-900 border-emerald-500/60 text-emerald-300"
                : "bg-neutral-900 border-rose-500/60 text-rose-300"
            }`}
          >
            {toast.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-10 space-y-6 sm:space-y-8">
        
        {/* Title Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 border-b border-neutral-900 pb-4 sm:pb-5">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <Link
              href="/admin"
              className="p-1.5 sm:p-2 border border-neutral-800 rounded bg-neutral-900 text-neutral-400 hover:text-white hover:border-neutral-700 transition"
              title="Back to Admin Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-lg sm:text-xl font-bold uppercase tracking-tight">Category & Pricing</h1>
              <p className="text-[11px] sm:text-xs font-mono text-neutral-500 uppercase mt-0.5">
                Headings: 2 Wheeler • Car • Pickup • Traveller
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchPrices()}
              disabled={refreshing}
              className="px-3 py-1.5 sm:py-2 bg-neutral-900 hover:bg-neutral-800 text-xs font-mono text-neutral-300 border border-neutral-800 cursor-pointer flex items-center gap-1.5 rounded"
              title="Refresh Rates"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </button>

            <button
              onClick={() => setShowAddCategory(!showAddCategory)}
              className="px-3.5 sm:px-4 py-1.5 sm:py-2 bg-white text-black text-xs font-mono uppercase tracking-wider font-semibold hover:bg-neutral-200 cursor-pointer flex items-center gap-1.5 rounded"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Item</span>
            </button>
          </div>
        </div>

        {/* Add Category Form */}
        {showAddCategory && (
          <form
            onSubmit={handleAddNewCategory}
            className="p-4 bg-neutral-950 border border-neutral-800 flex flex-wrap items-center gap-3 rounded"
          >
            <input
              type="text"
              placeholder="Name (e.g. Teflon Coating)"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              className="bg-black border border-neutral-800 px-3 py-2 text-xs text-white flex-1 min-w-[200px] font-mono focus:outline-none focus:border-white rounded"
              required
            />
            <select
              value={newGroup}
              onChange={(e) => setNewGroup(e.target.value)}
              className="bg-black border border-neutral-800 px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-white rounded"
            >
              <option value="2 wheeler">2 Wheeler</option>
              <option value="car">Car</option>
              <option value="pickup">Pickup</option>
              <option value="traveller">Traveller</option>
              <option value="other">Other</option>
            </select>
            <div className="flex items-center gap-1 bg-black border border-neutral-800 px-3 py-2 rounded">
              <span className="text-xs text-neutral-500 font-mono">₹</span>
              <input
                type="number"
                placeholder="Rate (blank for none)"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                className="bg-transparent text-xs text-white w-28 font-mono focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="bg-white text-black text-xs font-mono font-bold uppercase px-4 py-2 hover:bg-neutral-200 cursor-pointer rounded"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => setShowAddCategory(false)}
              className="text-xs font-mono text-neutral-500 hover:text-white px-2 py-2 cursor-pointer"
            >
              Cancel
            </button>
          </form>
        )}

        {/* Headings & Items */}
        <div className="space-y-6">
          {GROUPS.map((grp) => {
            const groupItems = prices.filter((p) => {
              if (grp.key === "other") {
                return !["2 wheeler", "car", "pickup", "traveller"].includes(p.group || "");
              }
              return (p.group || "").toLowerCase() === grp.key;
            });

            if (groupItems.length === 0) return null;

            return (
              <div key={grp.key} className="border border-neutral-900 bg-neutral-950 rounded-lg overflow-hidden">
                {/* Heading */}
                <div className="px-4 py-3 bg-neutral-900/80 border-b border-neutral-900 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono font-bold tracking-widest uppercase text-white">
                      {grp.title}
                    </span>
                    <span className="text-[10px] font-mono text-neutral-500">
                      ({groupItems.length} {groupItems.length === 1 ? "rate" : "rates"})
                    </span>
                  </div>
                </div>

                {/* Rates under heading */}
                <div className="divide-y divide-neutral-900/70">
                  {groupItems.map((item) => {
                    const isEditing = editingCategory === item.category;
                    const displayName = item.name || item.category.replace(/^(Car|2 Wheeler) - /i, "");

                    return (
                      <div
                        key={item._id || item.category}
                        className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-neutral-900/30 transition-colors"
                      >
                        {/* Name */}
                        <div className="flex-1">
                          <span className="text-xs font-mono text-white font-medium">
                            {displayName}
                          </span>
                        </div>

                        {/* Price & Actions */}
                        <div className="flex items-center justify-between sm:justify-end gap-3">
                          {isEditing ? (
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1 bg-black border border-neutral-700 px-2.5 py-1 rounded">
                                <span className="text-xs text-neutral-400 font-mono">₹</span>
                                <input
                                  type="number"
                                  placeholder="No amount"
                                  value={editPrice}
                                  onChange={(e) => setEditPrice(e.target.value)}
                                  className="w-20 bg-transparent text-xs text-white font-mono font-bold focus:outline-none"
                                  autoFocus
                                />
                              </div>
                              <button
                                onClick={() => savePriceSetting(item.category, item.group)}
                                className="px-2.5 py-1 bg-white text-black text-[11px] font-mono font-bold uppercase rounded hover:bg-neutral-200 cursor-pointer flex items-center gap-1"
                              >
                                <Save className="h-3 w-3" />
                                <span>Save</span>
                              </button>
                              <button
                                onClick={() => setEditingCategory(null)}
                                className="p-1 text-neutral-500 hover:text-white cursor-pointer"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-mono font-bold text-white min-w-[70px] text-right">
                                {item.price && item.price > 0 ? (
                                  `₹${item.price}`
                                ) : (
                                  <span className="text-neutral-500 font-normal italic">No amount</span>
                                )}
                              </span>
                              <button
                                onClick={() => startEditPrice(item)}
                                className="p-1 text-neutral-400 hover:text-white hover:bg-neutral-900 rounded cursor-pointer transition-colors"
                                title="Edit Rate"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteCategory(item.category, item._id)}
                                className="p-1 text-neutral-600 hover:text-rose-400 hover:bg-neutral-900 rounded cursor-pointer transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { 
  ArrowLeft, 
  Car, 
  ChevronDown, 
  ChevronUp, 
  Trash2, 
  Plus, 
  RefreshCw,
  CheckCircle2,
  AlertCircle
} from "lucide-react";

export default function PricingManagementPage() {
  const [prices, setPrices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState<number>(0);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  // Add category state
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newPrice, setNewPrice] = useState(400);

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

  const startEditPrice = (item: any) => {
    setEditingCategory(item.category);
    setEditPrice(item.price);
  };

  const savePriceSetting = async (categoryName: string) => {
    try {
      const res = await fetch("/api/prices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: categoryName,
          price: editPrice,
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
      const res = await fetch("/api/prices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: newCatName.trim(),
          price: Number(newPrice),
        }),
      });

      if (res.ok) {
        setNewCatName("");
        setNewPrice(400);
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

      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-10 space-y-8">
        
        {/* Title Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-900 pb-5">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="p-2 border border-neutral-800 rounded bg-neutral-900 text-neutral-400 hover:text-white hover:border-neutral-700 transition"
              title="Back to Admin Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-xl font-bold uppercase tracking-tight">Category Rates & Pricing</h1>
              <p className="text-xs font-mono text-neutral-500 uppercase mt-0.5">
                Manage fixed tariffs and vehicle categories for counter entry
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchPrices()}
              disabled={refreshing}
              className="px-3 py-2 bg-neutral-900 hover:bg-neutral-800 text-xs font-mono text-neutral-300 border border-neutral-800 cursor-pointer flex items-center gap-1.5"
              title="Refresh Rates"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </button>

            <button
              onClick={() => setShowAddCategory(!showAddCategory)}
              className="px-4 py-2 bg-white text-black text-xs font-mono uppercase tracking-wider font-semibold hover:bg-neutral-200 cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Category</span>
            </button>
          </div>
        </div>

        {/* Add Category Form Dropdown */}
        {showAddCategory && (
          <form
            onSubmit={handleAddNewCategory}
            className="p-4 bg-neutral-950 border border-neutral-800 flex flex-wrap items-center gap-3 rounded"
          >
            <input
              type="text"
              placeholder="Category Name (e.g. Electric 3-Wheeler)"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              className="bg-black border border-neutral-800 px-3 py-2 text-xs text-white flex-1 min-w-[220px] font-mono focus:outline-none focus:border-white"
              required
            />
            <div className="flex items-center gap-1 bg-black border border-neutral-800 px-3 py-2">
              <span className="text-xs text-neutral-500 font-mono">₹</span>
              <input
                type="number"
                placeholder="Rate"
                value={newPrice}
                onChange={(e) => setNewPrice(Number(e.target.value))}
                className="bg-transparent text-xs text-white w-24 font-mono focus:outline-none"
                required
              />
            </div>
            <button
              type="submit"
              className="bg-white text-black text-xs font-mono font-bold uppercase px-5 py-2 hover:bg-neutral-200 cursor-pointer"
            >
              Save Category
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

        {/* Pricing Table */}
        <div className="border border-neutral-900 bg-neutral-950 p-5 rounded">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="border-b border-neutral-900 text-neutral-500 uppercase">
                <tr>
                  <th className="py-2.5 px-3">Vehicle Category</th>
                  <th className="py-2.5 px-3">Included Vehicles</th>
                  <th className="py-2.5 px-3">Wash Rate</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-900">
                {prices.map((item) => {
                  const isEditing = editingCategory === item.category;
                  const isExpanded = expandedCategory === item.category;
                  const vehicleCount = item.vehicles?.length || 0;

                  return (
                    <tr key={item._id || item.category} className="group hover:bg-neutral-900/30 transition">
                      <td className="py-3 px-3 text-white font-medium align-top">
                        <div className="flex items-center gap-2">
                          <Car className="h-3.5 w-3.5 text-neutral-500" />
                          <span>{item.category}</span>
                        </div>
                      </td>

                      {/* Models Included Column */}
                      <td className="py-3 px-3 text-neutral-400 align-top max-w-md">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setExpandedCategory(isExpanded ? null : item.category)}
                            className="inline-flex items-center gap-1 text-[11px] font-mono text-neutral-300 hover:text-white bg-neutral-900 border border-neutral-800 px-2 py-0.5 cursor-pointer"
                          >
                            <span>{vehicleCount} models</span>
                            {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                          </button>
                        </div>

                        {/* Expanded vehicle list chips */}
                        {isExpanded && (
                          <div className="mt-2.5 p-2 bg-neutral-950 border border-neutral-850 flex flex-wrap gap-1 max-h-40 overflow-y-auto">
                            {item.vehicles?.map((vName: string, i: number) => (
                              <span key={i} className="text-[10px] bg-neutral-900 text-neutral-300 px-2 py-0.5 border border-neutral-800">
                                {vName}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>

                      {/* Single Wash Rate */}
                      <td className="py-3 px-3 align-top font-bold text-white text-sm">
                        {isEditing ? (
                          <div className="flex items-center gap-1">
                            <span>₹</span>
                            <input
                              type="number"
                              value={editPrice}
                              onChange={(e) => setEditPrice(Number(e.target.value))}
                              className="w-24 bg-black border border-neutral-700 px-2 py-1 text-white text-xs font-mono"
                              autoFocus
                            />
                          </div>
                        ) : (
                          `₹${item.price}`
                        )}
                      </td>

                      {/* Actions: Edit & Delete */}
                      <td className="py-3 px-3 text-right align-top">
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => savePriceSetting(item.category)}
                              className="px-2.5 py-1 bg-white text-black text-[11px] uppercase font-semibold cursor-pointer hover:bg-neutral-200"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingCategory(null)}
                              className="px-2 py-1 text-neutral-500 hover:text-white cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => startEditPrice(item)}
                              className="px-2.5 py-1 bg-neutral-900 hover:bg-neutral-800 text-white text-[11px] uppercase font-mono border border-neutral-800 cursor-pointer"
                            >
                              Edit Rate
                            </button>
                            <button
                              onClick={() => handleDeleteCategory(item.category, item._id)}
                              className="text-neutral-600 hover:text-rose-400 cursor-pointer p-1"
                              title="Delete category"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

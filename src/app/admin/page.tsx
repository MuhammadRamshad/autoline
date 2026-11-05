"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { 
  Trash2,
  Save,
  RefreshCw,
  Car,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { exportToExcel, exportToPDF } from "@/lib/exportUtils";

export default function AdminDashboardPage() {
  const [prices, setPrices] = useState<any[]>([]);
  const [entries, setEntries] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalAmount: 0, upiAmount: 0, cashAmount: 0, pendingAmount: 0, pendingCount: 0, count: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const [filterDate, setFilterDate] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedPayment, setSelectedPayment] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");

  // Single price edit
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState<number>(0);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  // Add category
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newPrice, setNewPrice] = useState(400);

  const fetchData = async () => {
    try {
      setRefreshing(true);
      const priceRes = await fetch("/api/prices");
      const priceData = await priceRes.json();
      if (priceData.success) {
        setPrices(priceData.prices);
      }

      const params = new URLSearchParams();
      if (filterDate) params.append("date", filterDate);
      if (searchQuery) params.append("search", searchQuery);
      if (selectedCategory && selectedCategory !== "All") params.append("category", selectedCategory);
      if (selectedPayment && selectedPayment !== "All") params.append("paymentMode", selectedPayment);
      if (selectedStatus && selectedStatus !== "All") params.append("paymentStatus", selectedStatus);

      const entriesRes = await fetch(`/api/washes?${params.toString()}`);
      const entriesData = await entriesRes.json();
      if (entriesData.success) {
        setEntries(entriesData.entries);
        setStats(entriesData.stats);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterDate, selectedCategory, selectedPayment, selectedStatus]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData();
  };

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
        })
      });

      if (res.ok) {
        setEditingCategory(null);
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteCategory = async (category: string, id?: string) => {
    if (!confirm(`Are you sure you want to delete the "${category}" category?`)) return;

    try {
      const param = id ? `id=${id}` : `category=${encodeURIComponent(category)}`;
      const res = await fetch(`/api/prices?${param}`, { method: "DELETE" });
      if (res.ok) {
        fetchData();
      } else {
        alert("Could not delete category");
      }
    } catch (e) {
      console.error(e);
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
          price: newPrice,
        })
      });

      if (res.ok) {
        setShowAddCategory(false);
        setNewCatName("");
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteEntry = async (id: string) => {
    if (!confirm("Delete record?")) return;
    try {
      const res = await fetch(`/api/washes?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: "Paid" | "Pending", mode?: string) => {
    try {
      setUpdatingId(id);
      const res = await fetch("/api/washes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          paymentStatus: newStatus,
          ...(mode ? { paymentMode: mode } : {})
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        fetchData();
      } else {
        alert("Failed to update: " + (data.error || "Server error"));
      }
    } catch (e: any) {
      alert("Error: " + e.message);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col selection:bg-white selection:text-black">
      <Navbar />

      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-10 space-y-10">
        
        {/* Title Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-900 pb-5">
          <div>
            <h1 className="text-xl font-bold uppercase tracking-tight">Admin</h1>
            <p className="text-xs font-mono text-neutral-500 uppercase mt-0.5">Autoline</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchData()}
              disabled={refreshing}
              className="px-3 py-2 bg-neutral-900 hover:bg-neutral-800 text-xs font-mono text-neutral-300 border border-neutral-800 cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
            </button>

            <button
              onClick={() => exportToExcel(entries, `Autoline_Report_${filterDate || "All"}.xlsx`)}
              disabled={entries.length === 0}
              className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-xs font-mono uppercase tracking-wider text-neutral-300 border border-neutral-800 disabled:opacity-40 cursor-pointer"
            >
              Excel
            </button>

            <button
              onClick={() => exportToPDF(entries, "Autoline Wash Report", filterDate || "")}
              disabled={entries.length === 0}
              className="px-4 py-2 bg-white text-black text-xs font-mono uppercase tracking-wider font-semibold hover:bg-neutral-200 disabled:opacity-40 cursor-pointer"
            >
              PDF
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="p-4 border border-neutral-900 bg-neutral-950">
            <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-500">Revenue (Total)</div>
            <div className="text-2xl font-mono font-bold mt-1">₹{stats.totalAmount.toLocaleString("en-IN")}</div>
          </div>

          <div className="p-4 border border-neutral-900 bg-neutral-950">
            <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-500">Vehicles</div>
            <div className="text-2xl font-mono font-bold mt-1">{stats.count}</div>
          </div>

          <div className="p-4 border border-neutral-900 bg-neutral-950">
            <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-500">UPI / QR</div>
            <div className="text-2xl font-mono font-bold mt-1">₹{stats.upiAmount.toLocaleString("en-IN")}</div>
          </div>

          <div className="p-4 border border-neutral-900 bg-neutral-950">
            <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-500">Cash</div>
            <div className="text-2xl font-mono font-bold mt-1">₹{stats.cashAmount.toLocaleString("en-IN")}</div>
          </div>

          <div className={`p-4 border ${stats.pendingAmount > 0 ? "border-amber-500/50 bg-amber-950/20" : "border-neutral-900 bg-neutral-950"}`}>
            <div className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold flex items-center justify-between">
              <span>Pending Dues</span>
              {stats.pendingCount > 0 && (
                <span className="bg-amber-500 text-black px-1.5 py-0.2 rounded text-[9px] font-mono font-bold">
                  {stats.pendingCount}
                </span>
              )}
            </div>
            <div className="text-2xl font-mono font-bold mt-1 text-amber-400">
              ₹{(stats.pendingAmount || 0).toLocaleString("en-IN")}
            </div>
          </div>
        </div>

        {/* Category Pricing (Single Price per Category & Delete Option) */}
        <div className="border border-neutral-900 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-mono uppercase tracking-wider text-neutral-300">Vehicle Categories & Rates</h2>
              <p className="text-[11px] font-mono text-neutral-500 mt-0.5">Edit rates, view models included, or delete categories</p>
            </div>
            <button
              onClick={() => setShowAddCategory(!showAddCategory)}
              className="text-xs font-mono uppercase text-neutral-400 hover:text-white cursor-pointer"
            >
              + Add Category
            </button>
          </div>

          {showAddCategory && (
            <form onSubmit={handleAddNewCategory} className="p-3 bg-neutral-950 border border-neutral-800 flex flex-wrap gap-2">
              <input
                type="text"
                placeholder="Category Name (e.g. Electric 3-Wheeler)"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                className="bg-black border border-neutral-800 px-3 py-1.5 text-xs text-white flex-1 min-w-[200px]"
                required
              />
              <input
                type="number"
                placeholder="Fixed Rate (₹)"
                value={newPrice}
                onChange={(e) => setNewPrice(Number(e.target.value))}
                className="bg-black border border-neutral-800 px-3 py-1.5 text-xs text-white w-32"
                required
              />
              <button
                type="submit"
                className="bg-white text-black text-xs font-semibold uppercase px-4 py-1.5 hover:bg-neutral-200 cursor-pointer"
              >
                Save
              </button>
            </form>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="border-b border-neutral-900 text-neutral-500 uppercase">
                <tr>
                  <th className="py-2.5 px-3">Vehicle Category</th>
                  <th className="py-2.5 px-3">Included Vehicles (Indian DB)</th>
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
                    <tr key={item._id || item.category} className="group">
                      <td className="py-3 px-3 text-white font-medium align-top">
                        <div className="flex items-center gap-2">
                          <Car className="h-3.5 w-3.5 text-neutral-500" />
                          <span>{item.category}</span>
                        </div>
                      </td>

                      {/* Models Included Column with toggle */}
                      <td className="py-3 px-3 text-neutral-400 align-top max-w-md">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setExpandedCategory(isExpanded ? null : item.category)}
                            className="inline-flex items-center gap-1 text-[11px] font-mono text-neutral-300 hover:text-white bg-neutral-900 border border-neutral-800 px-2 py-0.5 cursor-pointer"
                          >
                            <span>{vehicleCount} models in DB</span>
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
                              ✕
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => startEditPrice(item)}
                              className="text-neutral-400 hover:text-white cursor-pointer text-xs"
                            >
                              Edit
                            </button>
                            <span className="text-neutral-700">|</span>
                            <button
                              onClick={() => handleDeleteCategory(item.category, item._id)}
                              className="text-neutral-500 hover:text-rose-400 cursor-pointer p-1"
                              title={`Delete ${item.category}`}
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

        {/* Wash Records */}
        <div className="border border-neutral-900 p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-sm font-mono uppercase tracking-wider text-neutral-300">Wash Records</h2>
            
            <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-center gap-2">
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="bg-black border border-neutral-800 text-xs text-neutral-300 px-2 py-1"
              />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-black border border-neutral-800 text-xs text-neutral-300 px-2 py-1"
              >
                <option value="All">All Categories</option>
                {prices.map(p => <option key={p.category} value={p.category}>{p.category}</option>)}
              </select>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-black border border-neutral-800 text-xs text-neutral-300 px-2 py-1"
              >
                <option value="All">All Statuses</option>
                <option value="Paid">Paid Only</option>
                <option value="Pending">Pending Only</option>
              </select>
              <input
                type="text"
                placeholder="Search vehicle / phone"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-black border border-neutral-800 text-xs text-neutral-300 px-2 py-1 w-36"
              />
            </form>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="border-b border-neutral-900 text-neutral-500 uppercase">
                <tr>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Vehicle</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Phone</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">Payment</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-900">
                {entries.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-neutral-600">No records found</td>
                  </tr>
                ) : (
                  entries.map((e) => {
                    const isPending = e.paymentStatus === "Pending";
                    return (
                      <tr
                        key={e._id}
                        className={`transition-colors ${
                          isPending ? "bg-amber-950/20 border-l-2 border-l-amber-500" : "hover:bg-neutral-950"
                        }`}
                      >
                        <td className="py-3 px-3 text-neutral-400">
                          {new Date(e.createdAt).toLocaleDateString("en-IN")}
                        </td>
                        <td className="py-3 px-3 text-white font-bold">{e.vehicleNumber}</td>
                        <td className="py-3 px-3 text-neutral-400">{e.category}</td>
                        <td className="py-3 px-3 text-neutral-400">{e.customerPhone}</td>
                        <td className="py-3 px-3 text-white font-bold">₹{e.amount}</td>
                        <td className="py-3 px-3 text-neutral-400">{e.paymentMode}</td>
                        <td className="py-3 px-3">
                          {isPending ? (
                            <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold bg-amber-500/20 text-amber-300 border border-amber-500/50 px-2 py-0.5 rounded">
                              ⏳ Pending
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-2 py-0.5 rounded">
                              ✓ Paid
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {isPending ? (
                              <button
                                type="button"
                                disabled={updatingId === e._id}
                                onClick={() => handleUpdateStatus(e._id, "Paid", "Cash")}
                                className="px-2 py-1 bg-amber-500 hover:bg-amber-400 text-black text-[10px] font-mono uppercase font-bold cursor-pointer"
                                title="Mark as settled"
                              >
                                {updatingId === e._id ? "..." : "Settle"}
                              </button>
                            ) : (
                              <button
                                type="button"
                                disabled={updatingId === e._id}
                                onClick={() => handleUpdateStatus(e._id, "Pending")}
                                className="text-[10px] font-mono text-neutral-500 hover:text-amber-400 cursor-pointer"
                                title="Revert to pending"
                              >
                                Mark Pending
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteEntry(e._id)}
                              className="text-neutral-600 hover:text-rose-400 cursor-pointer p-1"
                              title="Delete entry"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  );
}

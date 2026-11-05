"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { 
  Trash2,
  Save,
  RefreshCw,
  Car,
  ChevronDown,
  ChevronUp,
  Search,
  Calendar,
  Filter,
  X,
  FileSpreadsheet,
  FileText,
  Receipt,
  TrendingDown,
  TrendingUp,
  DollarSign
} from "lucide-react";
import { exportToExcel, exportToPDF } from "@/lib/exportUtils";

export default function AdminDashboardPage() {
  const [prices, setPrices] = useState<any[]>([]);
  const [entries, setEntries] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalAmount: 0, upiAmount: 0, cashAmount: 0, pendingAmount: 0, pendingCount: 0, paidCount: 0, count: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Expenses State for Admin
  const [expenses, setExpenses] = useState<any[]>([]);
  const [expenseStats, setExpenseStats] = useState({ totalExpense: 0, cashExpense: 0, upiExpense: 0, count: 0 });
  const [activeTab, setActiveTab] = useState<"washes" | "expenses">("washes");

  // Advanced Filters
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedPaymentMode, setSelectedPaymentMode] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");

  // Single price edit
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState<number>(0);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  // Add category
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newPrice, setNewPrice] = useState(400);

  const fetchData = async (isBackground: boolean = false) => {
    try {
      if (!isBackground) setRefreshing(true);
      // Append cache-busting timestamp to prevent intermediate browser/service-worker caching
      const ts = Date.now();
      const priceRes = await fetch(`/api/prices?_t=${ts}`, { cache: "no-store" });
      const priceData = await priceRes.json();
      if (priceData.success) {
        setPrices(priceData.prices);
      }

      const params = new URLSearchParams();
      if (fromDate) params.append("fromDate", fromDate);
      if (toDate) params.append("toDate", toDate);
      if (searchQuery) params.append("search", searchQuery.trim());
      if (selectedCategory && selectedCategory !== "All") params.append("category", selectedCategory);
      if (selectedPaymentMode && selectedPaymentMode !== "All") params.append("paymentMode", selectedPaymentMode);
      if (selectedStatus && selectedStatus !== "All") params.append("paymentStatus", selectedStatus);
      params.append("_t", String(ts));

      const entriesRes = await fetch(`/api/washes?${params.toString()}`, { cache: "no-store" });
      const entriesData = await entriesRes.json();
      if (entriesData.success) {
        setEntries(entriesData.entries);
        setStats(entriesData.stats);
      }

      // Fetch Expenses matching date/search
      const expParams = new URLSearchParams();
      if (fromDate) expParams.append("fromDate", fromDate);
      if (toDate) expParams.append("toDate", toDate);
      if (searchQuery) expParams.append("search", searchQuery.trim());
      expParams.append("_t", String(ts));
      const expRes = await fetch(`/api/expenses?${expParams.toString()}`, { cache: "no-store" });
      const expData = await expRes.json();
      if (expData.success) {
        setExpenses(expData.expenses);
        setExpenseStats(expData.stats);
      }
    } catch (err) {
      console.error(err);
    } finally {
      if (!isBackground) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  };

  useEffect(() => {
    fetchData();

    // Auto-sync polling every 2.5 seconds to reflect shopkeeper settlements, status edits, and entries instantly
    const interval = setInterval(() => {
      fetchData(true);
    }, 2500);

    const handleFocus = () => {
      fetchData(true);
    };
    window.addEventListener("focus", handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, [fromDate, toDate, searchQuery, selectedCategory, selectedPaymentMode, selectedStatus]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData();
  };

  const clearAllFilters = () => {
    setFromDate("");
    setToDate("");
    setSearchQuery("");
    setSelectedCategory("All");
    setSelectedPaymentMode("All");
    setSelectedStatus("All");
  };

  // Quick Preset Handlers
  const setQuickDatePreset = (preset: "today" | "yesterday" | "thisMonth" | "clear") => {
    const today = new Date();
    const pad = (n: number) => n.toString().padStart(2, "0");
    const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    if (preset === "today") {
      const dStr = fmt(today);
      setFromDate(dStr);
      setToDate(dStr);
    } else if (preset === "yesterday") {
      const y = new Date();
      y.setDate(y.getDate() - 1);
      const dStr = fmt(y);
      setFromDate(dStr);
      setToDate(dStr);
    } else if (preset === "thisMonth") {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      setFromDate(fmt(firstDay));
      setToDate(fmt(today));
    } else if (preset === "clear") {
      setFromDate("");
      setToDate("");
    }
  };

  // Human-readable filter subtitle for Export Reports
  const getFilterSummaryString = () => {
    const parts = [];
    if (fromDate && toDate) parts.push(`${fromDate} to ${toDate}`);
    else if (fromDate) parts.push(`From ${fromDate}`);
    else if (toDate) parts.push(`Up to ${toDate}`);
    else parts.push("All Time");

    if (selectedStatus !== "All") parts.push(`Status: ${selectedStatus}`);
    if (selectedPaymentMode !== "All") parts.push(`Mode: ${selectedPaymentMode}`);
    if (selectedCategory !== "All") parts.push(`Category: ${selectedCategory}`);
    if (searchQuery) parts.push(`Query: "${searchQuery}"`);

    return parts.join(" • ");
  };

  const handleExportExcel = () => {
    const filename = `Autoline_Report_${fromDate || "Start"}_to_${toDate || "End"}.xlsx`;
    exportToExcel(entries, filename);
  };

  const handleExportPDF = () => {
    const subtitle = getFilterSummaryString();
    exportToPDF(entries, "Autoline Wash Report", subtitle);
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
              className="px-3 py-2 bg-neutral-900 hover:bg-neutral-800 text-xs font-mono text-neutral-300 border border-neutral-800 cursor-pointer flex items-center gap-1.5"
              title="Refresh Data"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              onClick={handleExportExcel}
              disabled={entries.length === 0}
              className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-xs font-mono uppercase tracking-wider text-neutral-300 border border-neutral-800 disabled:opacity-40 cursor-pointer flex items-center gap-1.5"
              title="Export filtered records to Excel"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" />
              <span>Excel ({entries.length})</span>
            </button>

            <button
              onClick={handleExportPDF}
              disabled={entries.length === 0}
              className="px-4 py-2 bg-white text-black text-xs font-mono uppercase tracking-wider font-semibold hover:bg-neutral-200 disabled:opacity-40 cursor-pointer flex items-center gap-1.5"
              title="Export filtered report to PDF"
            >
              <FileText className="h-3.5 w-3.5" />
              <span>PDF Report</span>
            </button>
          </div>
        </div>

        {/* Stats Grid Including Revenue, Expenses, and Net Profit */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          <div className="p-3.5 border border-neutral-900 bg-neutral-950">
            <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-500">Gross Inflow</div>
            <div className="text-xl font-mono font-bold mt-1 text-white">₹{stats.totalAmount.toLocaleString("en-IN")}</div>
          </div>

          <div className="p-3.5 border border-neutral-900 bg-neutral-950">
            <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-500">Total Expenses</div>
            <div className="text-xl font-mono font-bold mt-1 text-rose-400">₹{expenseStats.totalExpense.toLocaleString("en-IN")}</div>
          </div>

          <div className="p-3.5 border border-neutral-900 bg-neutral-950">
            <div className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold">Net Profit</div>
            <div className="text-xl font-mono font-bold mt-1 text-emerald-400">
              ₹{(stats.totalAmount - (stats.pendingAmount || 0) - expenseStats.totalExpense).toLocaleString("en-IN")}
            </div>
          </div>

          <div className="p-3.5 border border-neutral-900 bg-neutral-950">
            <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-500">Vehicles Serviced</div>
            <div className="text-xl font-mono font-bold mt-1 text-white">{stats.count}</div>
          </div>

          <div className="p-3.5 border border-neutral-900 bg-neutral-950">
            <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-500">Cash Inflow</div>
            <div className="text-xl font-mono font-bold mt-1 text-white">₹{stats.cashAmount.toLocaleString("en-IN")}</div>
          </div>

          <div className={`p-3.5 border ${stats.pendingAmount > 0 ? "border-amber-500/50 bg-amber-950/20" : "border-neutral-900 bg-neutral-950"}`}>
            <div className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold flex items-center justify-between">
              <span>Pending Dues</span>
              {stats.pendingCount > 0 && (
                <span className="bg-amber-500 text-black px-1 py-0.2 rounded text-[9px] font-mono font-bold">
                  {stats.pendingCount}
                </span>
              )}
            </div>
            <div className="text-xl font-mono font-bold mt-1 text-amber-400">
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

        {/* Section Tabs: Wash Records vs Shop Expenses */}
        <div className="flex border-b border-neutral-900 gap-6 text-xs font-mono uppercase tracking-wider">
          <button
            type="button"
            onClick={() => setActiveTab("washes")}
            className={`pb-3 border-b-2 font-bold cursor-pointer transition-colors flex items-center gap-2 ${
              activeTab === "washes"
                ? "border-white text-white"
                : "border-transparent text-neutral-500 hover:text-neutral-300"
            }`}
          >
            <Car className="h-4 w-4" />
            <span>Wash Records ({entries.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("expenses")}
            className={`pb-3 border-b-2 font-bold cursor-pointer transition-colors flex items-center gap-2 ${
              activeTab === "expenses"
                ? "border-amber-400 text-amber-300"
                : "border-transparent text-neutral-500 hover:text-neutral-300"
            }`}
          >
            <Receipt className="h-4 w-4" />
            <span>Shop Expenses ({expenses.length})</span>
          </button>
        </div>

        {/* Tab 1: Wash Records with Advanced Multi-Filter */}
        {activeTab === "washes" && (
        <div className="border border-neutral-900 p-5 space-y-5">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-900 pb-4">
            <div>
              <h2 className="text-sm font-mono uppercase tracking-wider text-neutral-200 flex items-center gap-2">
                <Filter className="h-4 w-4 text-sky-400" />
                <span>Wash Records & Reports</span>
              </h2>
              <p className="text-[11px] font-mono text-neutral-500 mt-0.5">
                Filtered view: {entries.length} records matching • {getFilterSummaryString()}
              </p>
            </div>

            {/* Quick Date Presets */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
              <span className="text-[10px] text-neutral-500 uppercase mr-1">Quick:</span>
              <button
                type="button"
                onClick={() => setQuickDatePreset("today")}
                className="px-2 py-1 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 cursor-pointer"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => setQuickDatePreset("yesterday")}
                className="px-2 py-1 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 cursor-pointer"
              >
                Yesterday
              </button>
              <button
                type="button"
                onClick={() => setQuickDatePreset("thisMonth")}
                className="px-2 py-1 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 cursor-pointer"
              >
                This Month
              </button>
              <button
                type="button"
                onClick={clearAllFilters}
                className="px-2 py-1 text-neutral-400 hover:text-white cursor-pointer ml-1 underline text-[11px]"
              >
                Reset All
              </button>
            </div>
          </div>

          {/* Filtering Controls Grid with Native Styled Calendar Inputs */}
          <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
            
            {/* From Date with Calendar Icon */}
            <div>
              <label className="block text-[10px] uppercase font-mono tracking-wider text-neutral-400 mb-1 flex items-center gap-1">
                <Calendar className="h-3 w-3 text-sky-400" />
                <span>From Date</span>
              </label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full bg-black border border-neutral-800 text-xs font-mono text-neutral-200 px-2.5 py-2 focus:outline-none focus:border-white [color-scheme:dark]"
              />
            </div>

            {/* To Date with Calendar Icon */}
            <div>
              <label className="block text-[10px] uppercase font-mono tracking-wider text-neutral-400 mb-1 flex items-center gap-1">
                <Calendar className="h-3 w-3 text-sky-400" />
                <span>To Date</span>
              </label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full bg-black border border-neutral-800 text-xs font-mono text-neutral-200 px-2.5 py-2 focus:outline-none focus:border-white [color-scheme:dark]"
              />
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-[10px] uppercase font-mono tracking-wider text-neutral-400 mb-1">
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full bg-black border border-neutral-800 text-xs font-mono text-neutral-200 px-2.5 py-2 focus:outline-none focus:border-white cursor-pointer"
              >
                <option value="All">All Categories</option>
                {prices.map(p => <option key={p.category} value={p.category}>{p.category}</option>)}
              </select>
            </div>

            {/* Payment Mode (UPI / Cash / Pending / All) */}
            <div>
              <label className="block text-[10px] uppercase font-mono tracking-wider text-neutral-400 mb-1">
                Payment Mode
              </label>
              <select
                value={selectedPaymentMode}
                onChange={(e) => setSelectedPaymentMode(e.target.value)}
                className="w-full bg-black border border-neutral-800 text-xs font-mono text-neutral-200 px-2.5 py-2 focus:outline-none focus:border-white cursor-pointer"
              >
                <option value="All">All Payment Modes</option>
                <option value="UPI / QR">UPI / QR Only</option>
                <option value="Cash">Cash Only</option>
                <option value="Pending">Pending / Pay Later</option>
              </select>
            </div>

            {/* Payment Status (Paid / Pending / All) */}
            <div>
              <label className="block text-[10px] uppercase font-mono tracking-wider text-neutral-400 mb-1">
                Payment Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full bg-black border border-neutral-800 text-xs font-mono text-neutral-200 px-2.5 py-2 focus:outline-none focus:border-white cursor-pointer"
              >
                <option value="All">All Statuses</option>
                <option value="Paid">Paid Only</option>
                <option value="Pending">Pending Dues Only</option>
              </select>
            </div>

            {/* Universal Search (Registration, Phone, Owner, Make, Model) */}
            <div>
              <label className="block text-[10px] uppercase font-mono tracking-wider text-neutral-400 mb-1">
                Search Query
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Reg No / Phone / Owner"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-black border border-neutral-800 text-xs font-mono text-white pl-2.5 pr-7 py-2 focus:outline-none focus:border-white"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2 top-2 text-neutral-500 hover:text-white cursor-pointer"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>

          </form>

          {/* Active Filter Indicators */}
          {(fromDate || toDate || searchQuery || selectedCategory !== "All" || selectedPaymentMode !== "All" || selectedStatus !== "All") && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] font-mono">
              <span className="text-neutral-500 text-[10px] uppercase">Active Filters:</span>
              {fromDate && (
                <span className="bg-neutral-900 border border-neutral-800 text-neutral-300 px-2 py-0.5 rounded">
                  From: {fromDate}
                </span>
              )}
              {toDate && (
                <span className="bg-neutral-900 border border-neutral-800 text-neutral-300 px-2 py-0.5 rounded">
                  To: {toDate}
                </span>
              )}
              {selectedCategory !== "All" && (
                <span className="bg-neutral-900 border border-neutral-800 text-neutral-300 px-2 py-0.5 rounded">
                  Category: {selectedCategory}
                </span>
              )}
              {selectedPaymentMode !== "All" && (
                <span className="bg-neutral-900 border border-neutral-800 text-neutral-300 px-2 py-0.5 rounded">
                  Mode: {selectedPaymentMode}
                </span>
              )}
              {selectedStatus !== "All" && (
                <span className="bg-amber-950/40 border border-amber-600/40 text-amber-300 px-2 py-0.5 rounded">
                  Status: {selectedStatus}
                </span>
              )}
              {searchQuery && (
                <span className="bg-sky-950/40 border border-sky-600/40 text-sky-300 px-2 py-0.5 rounded">
                  "{searchQuery}"
                </span>
              )}
              <button
                type="button"
                onClick={clearAllFilters}
                className="text-neutral-400 hover:text-white cursor-pointer ml-1 underline text-[10px]"
              >
                Clear Filters
              </button>
            </div>
          )}

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="border-b border-neutral-900 text-neutral-500 uppercase">
                <tr>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Vehicle No</th>
                  <th className="py-2.5 px-3">Vehicle Model</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Customer</th>
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
                    <td colSpan={10} className="py-12 text-center text-neutral-600">
                      No records found matching current filters
                    </td>
                  </tr>
                ) : (
                  entries.map((e) => {
                    const isPending = e.paymentMode === "Pending" || e.paymentStatus === "Pending";
                    return (
                      <tr
                        key={e._id}
                        className={`transition-colors ${
                          isPending ? "bg-amber-950/20 border-l-2 border-l-amber-500" : "hover:bg-neutral-950"
                        }`}
                      >
                        <td className="py-3 px-3 text-neutral-400">
                          <div>{new Date(e.createdAt).toLocaleDateString("en-IN")}</div>
                          <div className="text-[10px] text-neutral-600">{new Date(e.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</div>
                        </td>
                        <td className="py-3 px-3 text-white font-bold tracking-wide">{e.vehicleNumber}</td>
                        <td className="py-3 px-3 text-neutral-300">
                          {e.make || e.model ? `${e.make || ""} ${e.model || ""}`.trim() : "-"}
                        </td>
                        <td className="py-3 px-3 text-neutral-400">{e.category}</td>
                        <td className="py-3 px-3 text-neutral-300">{e.customerName || "-"}</td>
                        <td className="py-3 px-3 text-neutral-400">{e.customerPhone}</td>
                        <td className="py-3 px-3 text-white font-bold">₹{e.amount}</td>
                        <td className="py-3 px-3 text-neutral-400">{e.paymentMode}</td>
                        <td className="py-3 px-3">
                          {isPending ? (
                            <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold bg-amber-500/20 text-amber-300 border border-amber-500/50 px-2 py-0.5 rounded">
                              Pending
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-2 py-0.5 rounded">
                              Paid
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
                                title="Mark as settled (Cash)"
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
        )}

        {/* Tab 2: Shop Expenses Management & Records */}
        {activeTab === "expenses" && (
          <div className="border border-neutral-900 p-5 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-900 pb-4">
              <div>
                <h2 className="text-sm font-mono uppercase tracking-wider text-amber-400 flex items-center gap-2">
                  <Receipt className="h-4 w-4" />
                  <span>Shop Expenses & Outflow Records</span>
                </h2>
                <p className="text-[11px] font-mono text-neutral-500 mt-0.5">
                  Showing {expenses.length} expense entries • Total: ₹{expenseStats.totalExpense.toLocaleString("en-IN")} (Cash: ₹{expenseStats.cashExpense.toLocaleString("en-IN")} • UPI: ₹{expenseStats.upiExpense.toLocaleString("en-IN")})
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-neutral-400">Total Outflow:</span>
                <span className="text-lg font-mono font-bold text-rose-400">₹{expenseStats.totalExpense.toLocaleString("en-IN")}</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="border-b border-neutral-900 text-neutral-500 uppercase">
                  <tr>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Expense Title</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">Paid By</th>
                    <th className="py-2.5 px-3">Amount</th>
                    <th className="py-2.5 px-3">Mode</th>
                    <th className="py-2.5 px-3 text-right">Delete</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-900">
                  {expenses.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-neutral-600">
                        No expenses recorded for this period
                      </td>
                    </tr>
                  ) : (
                    expenses.map((exp) => (
                      <tr key={exp._id} className="hover:bg-neutral-950">
                        <td className="py-3 px-3 text-neutral-400">
                          {new Date(exp.createdAt).toLocaleDateString("en-IN")} {new Date(exp.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                        </td>
                        <td className="py-3 px-3 text-white font-bold">{exp.title}</td>
                        <td className="py-3 px-3 text-neutral-400">{exp.category}</td>
                        <td className="py-3 px-3 text-neutral-400">{exp.paidBy || "-"}</td>
                        <td className="py-3 px-3 text-rose-400 font-bold">₹{exp.amount}</td>
                        <td className="py-3 px-3 text-neutral-400">{exp.paymentMode}</td>
                        <td className="py-3 px-3 text-right">
                          <button
                            type="button"
                            onClick={async () => {
                              if (!confirm(`Delete expense "${exp.title}"?`)) return;
                              const res = await fetch(`/api/expenses?id=${exp._id}`, { method: "DELETE" });
                              if (res.ok) fetchData();
                            }}
                            className="text-neutral-600 hover:text-rose-400 cursor-pointer p-1"
                            title="Delete expense"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

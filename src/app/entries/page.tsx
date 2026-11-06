"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import { 
  ArrowLeft, 
  Search, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  Banknote, 
  QrCode, 
  Car, 
  RefreshCw,
  Phone,
  Receipt,
  ArrowDownRight,
  TrendingDown,
  TrendingUp,
  Tag,
  Edit3,
  X,
  Save,
  Trash2
} from "lucide-react";

type EntryType = "wash" | "expense";

interface CombinedEntryItem {
  _id: string;
  type: EntryType;
  // Wash fields
  vehicleNumber?: string;
  registrationNumber?: string;
  make?: string;
  model?: string;
  vehicleModel?: string;
  serviceType?: string;
  customerPhone?: string;
  customerName?: string;
  paymentStatus?: string;
  // Expense fields
  title?: string;
  paidBy?: string;
  // Shared fields
  category: string;
  amount: number;
  paymentMode: string;
  notes?: string;
  createdAt: string;
}

export default function AllEntriesPage() {
  const [entries, setEntries] = useState<CombinedEntryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"All" | "wash" | "expense">("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // Tariffs list for category change in edit modal
  const [tariffs, setTariffs] = useState<any[]>([]);

  // Edit states
  const [editingEntry, setEditingEntry] = useState<any | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchTariffs = async () => {
    try {
      const res = await fetch(`/api/prices?_t=${Date.now()}`);
      const data = await res.json();
      if (data.success && data.prices) {
        setTariffs(data.prices);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchEntries = async () => {
    try {
      setLoading(true);
      const ts = Date.now();
      const params = new URLSearchParams();
      if (search.trim()) params.append("search", search.trim());
      if (categoryFilter !== "All") params.append("category", categoryFilter);
      if (statusFilter !== "All") params.append("paymentStatus", statusFilter);
      if (fromDate) params.append("fromDate", fromDate);
      if (toDate) params.append("toDate", toDate);
      params.append("limit", "1000");
      params.append("_t", String(ts));

      // Fetch both washes and expenses concurrently
      const [washRes, expRes] = await Promise.all([
        fetch(`/api/washes?${params.toString()}`, { cache: "no-store" }),
        fetch(`/api/expenses?${params.toString()}`, { cache: "no-store" }),
      ]);

      const washData = await washRes.json();
      const expData = await expRes.json();

      const combined: CombinedEntryItem[] = [];

      if (washData.success && Array.isArray(washData.entries)) {
        washData.entries.forEach((w: any) => {
          combined.push({
            ...w,
            type: "wash",
          });
        });
      }

      if (expData.success && Array.isArray(expData.expenses)) {
        expData.expenses.forEach((e: any) => {
          combined.push({
            ...e,
            type: "expense",
            category: e.category || "Expense",
            paymentStatus: "Paid",
          });
        });
      }

      // Sort newest to oldest
      combined.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setEntries(combined);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTariffs();
    fetchEntries();

    const interval = setInterval(() => {
      fetchEntries();
    }, 3000);

    const handleFocus = () => fetchEntries();
    window.addEventListener("focus", handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, [categoryFilter, statusFilter, fromDate, toDate, search]);

  // Quick Settle for Pending Washes
  const handleSettle = async (id: string, mode: string = "Cash") => {
    try {
      setUpdatingId(id);
      const res = await fetch("/api/washes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          paymentStatus: "Paid",
          paymentMode: mode,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`Settled as ${mode}`, "success");
        fetchEntries();
      } else {
        showToast(data.error || "Failed to settle", "error");
      }
    } catch (err: any) {
      showToast(err.message || "Error settling dues", "error");
    } finally {
      setUpdatingId(null);
    }
  };

  // Open Edit Modal (supports both Wash and Expense)
  const openEditModal = (entry: CombinedEntryItem) => {
    if (entry.type === "wash") {
      setEditingEntry({
        ...entry,
        vehicleNumber: entry.vehicleNumber || entry.registrationNumber || "",
        customerPhone: entry.customerPhone || "",
        customerName: entry.customerName || "",
        category: entry.category || "Hatchback (5 Seater)",
        amount: entry.amount || 0,
        paymentMode: entry.paymentMode || "UPI / QR",
        paymentStatus: entry.paymentStatus || (entry.paymentMode === "Pending" ? "Pending" : "Paid"),
        notes: entry.notes || "",
      });
    } else {
      setEditingEntry({
        ...entry,
        title: entry.title || "",
        category: entry.category || "Miscellaneous",
        amount: entry.amount || 0,
        paymentMode: entry.paymentMode || "Cash",
        paidBy: entry.paidBy || "",
        notes: entry.notes || "",
      });
    }
  };

  // Save Edit Handler
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEntry) return;

    setIsSavingEdit(true);
    try {
      if (editingEntry.type === "wash") {
        if (editingEntry.amount === undefined || editingEntry.amount === null || isNaN(Number(editingEntry.amount)) || Number(editingEntry.amount) < 0) {
          showToast("Valid amount is required", "error");
          setIsSavingEdit(false);
          return;
        }

        const trimmedPhone = (editingEntry.customerPhone || "").toString().trim();
        if (trimmedPhone) {
          const digitsOnly = trimmedPhone.replace(/\D/g, "");
          if (digitsOnly.length !== 10) {
            showToast("Phone number must be exactly 10 digits", "error");
            setIsSavingEdit(false);
            return;
          }
        }

        const res = await fetch("/api/washes", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingEntry._id,
            vehicleNumber: (editingEntry.vehicleNumber || "").toUpperCase().trim(),
            customerName: editingEntry.customerName || "",
            customerPhone: trimmedPhone,
            category: editingEntry.category,
            amount: Number(editingEntry.amount),
            paymentMode: editingEntry.paymentMode,
            paymentStatus: editingEntry.paymentMode === "Pending" ? "Pending" : editingEntry.paymentStatus,
            notes: editingEntry.notes || "",
          }),
        });

        const data = await res.json();
        if (res.ok && data.success) {
          showToast(`Updated ${data.entry.vehicleNumber}`, "success");
          setEditingEntry(null);
          fetchEntries();
        } else {
          showToast(data.error || "Failed to save changes", "error");
        }
      } else {
        // Edit Expense
        if (!editingEntry.title?.trim()) {
          showToast("Expense title is required", "error");
          setIsSavingEdit(false);
          return;
        }

        const res = await fetch("/api/expenses", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingEntry._id,
            title: editingEntry.title.trim(),
            category: editingEntry.category,
            amount: Number(editingEntry.amount),
            paymentMode: editingEntry.paymentMode,
            paidBy: editingEntry.paidBy || "",
            notes: editingEntry.notes || "",
          }),
        });

        const data = await res.json();
        if (res.ok && data.success) {
          showToast(`Expense updated`, "success");
          setEditingEntry(null);
          fetchEntries();
        } else {
          showToast(data.error || "Failed to update expense", "error");
        }
      }
    } catch (err: any) {
      showToast(err.message || "Network error", "error");
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Apply in-memory type filter ("All" | "wash" | "expense")
  const filteredEntries = entries.filter((item) => {
    if (typeFilter === "All") return true;
    return item.type === typeFilter;
  });

  // Group entries by Date (e.g. "Thursday, 5 November 2026")
  const groupedEntries: { [dateStr: string]: CombinedEntryItem[] } = {};
  filteredEntries.forEach((item) => {
    const d = new Date(item.createdAt);
    const dateTitle = d.toLocaleDateString("en-IN", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    if (!groupedEntries[dateTitle]) {
      groupedEntries[dateTitle] = [];
    }
    groupedEntries[dateTitle].push(item);
  });

  const dateTitles = Object.keys(groupedEntries);

  // Overall financial summary for active view
  const totalWashInflow = filteredEntries
    .filter((e) => e.type === "wash")
    .reduce((sum, e) => sum + (e.amount || 0), 0);
  const totalExpensesOutflow = filteredEntries
    .filter((e) => e.type === "expense")
    .reduce((sum, e) => sum + (e.amount || 0), 0);
  const netBalance = totalWashInflow - totalExpensesOutflow;

  return (
    <div className="min-h-screen bg-black text-neutral-100 flex flex-col font-sans">
      
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 animate-in fade-in slide-in-from-top-4 duration-200">
          <div
            className={`flex items-center gap-2 px-4 py-2.5 rounded shadow-xl border text-xs font-mono font-medium ${
              toast.type === "success"
                ? "bg-neutral-900 border-emerald-500/60 text-emerald-300"
                : "bg-neutral-900 border-rose-500/60 text-rose-300"
            }`}
          >
            {toast.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            ) : (
              <X className="h-4 w-4 text-rose-400 shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Top Header */}
      <header className="border-b border-neutral-800 bg-neutral-950/90 backdrop-blur sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <Link
              href="/"
              className="p-1.5 sm:p-2 border border-neutral-800 rounded bg-neutral-900 text-neutral-400 hover:text-white hover:border-neutral-700 transition shrink-0"
              title="Back to Home"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-black uppercase tracking-wider text-white truncate">
                All Entries
              </h1>
              <p className="text-[10px] sm:text-xs text-neutral-400 font-mono truncate">
                Washes & expenses by date
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => fetchEntries()}
              className="p-1.5 sm:p-2 border border-neutral-800 rounded bg-neutral-900 text-neutral-400 hover:text-white transition flex items-center gap-1.5 text-xs font-mono"
              title="Refresh"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Quick summary stats strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 bg-neutral-950 border border-neutral-850 rounded">
            <div className="text-[10px] font-mono uppercase text-neutral-500 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-emerald-400" />
              <span>Wash Inflow</span>
            </div>
            <div className="text-lg font-mono font-bold text-white mt-0.5">
              ₹{totalWashInflow.toLocaleString("en-IN")}
            </div>
          </div>

          <div className="p-3 bg-neutral-950 border border-amber-900/40 bg-amber-950/10 rounded">
            <div className="text-[10px] font-mono uppercase text-amber-400 flex items-center gap-1 font-bold">
              <TrendingDown className="w-3 h-3 text-amber-400" />
              <span>Shop Expenses</span>
            </div>
            <div className="text-lg font-mono font-bold text-amber-300 mt-0.5">
              ₹{totalExpensesOutflow.toLocaleString("en-IN")}
            </div>
          </div>

          <div className="p-3 bg-neutral-950 border border-neutral-850 rounded">
            <div className="text-[10px] font-mono uppercase text-neutral-500">
              Net In Hand
            </div>
            <div className={`text-lg font-mono font-bold mt-0.5 ${netBalance >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
              ₹{netBalance.toLocaleString("en-IN")}
            </div>
          </div>

          <div className="p-3 bg-neutral-950 border border-neutral-850 rounded">
            <div className="text-[10px] font-mono uppercase text-neutral-500">
              Total Records
            </div>
            <div className="text-lg font-mono font-bold text-neutral-200 mt-0.5">
              {filteredEntries.length}
            </div>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="bg-neutral-950 border border-neutral-800 p-4 rounded-lg space-y-3">
          <div className="flex flex-col md:flex-row gap-3">
            {/* Search Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                fetchEntries();
              }}
              className="relative flex-1"
            >
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
              <input
                type="text"
                placeholder="Search registration, phone, model, expense title..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-neutral-900 border border-neutral-800 rounded text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-600 font-mono"
              />
            </form>

            {/* Type Filter: All / Wash / Expense */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="px-3 py-2 bg-neutral-900 border border-neutral-800 rounded text-xs text-white focus:outline-none focus:border-neutral-600 font-mono"
            >
              <option value="All">All Types (Wash & Expense)</option>
              <option value="wash">Washes Only</option>
              <option value="expense">Expenses Only</option>
            </select>

            {/* From Date */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-400 font-mono">From:</span>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="px-3 py-2 bg-neutral-900 border border-neutral-800 rounded text-xs text-white [color-scheme:dark] focus:outline-none focus:border-neutral-600 font-mono"
              />
            </div>

            {/* To Date */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-400 font-mono">To:</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="px-3 py-2 bg-neutral-900 border border-neutral-800 rounded text-xs text-white [color-scheme:dark] focus:outline-none focus:border-neutral-600 font-mono"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-neutral-900 border border-neutral-800 rounded text-xs text-white focus:outline-none focus:border-neutral-600 font-mono"
            >
              <option value="All">All Status</option>
              <option value="Paid">Paid</option>
              <option value="Pending">Pending</option>
            </select>

            {/* Clear button if active filters */}
            {(search || fromDate || toDate || statusFilter !== "All" || typeFilter !== "All" || categoryFilter !== "All") && (
              <button
                onClick={() => {
                  setSearch("");
                  setFromDate("");
                  setToDate("");
                  setTypeFilter("All");
                  setStatusFilter("All");
                  setCategoryFilter("All");
                }}
                className="px-3 py-2 border border-neutral-800 text-xs font-mono text-neutral-400 hover:text-white rounded transition"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Loading indicator */}
        {loading && entries.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-neutral-600 animate-spin mx-auto" />
            <p className="text-xs font-mono text-neutral-500 uppercase tracking-widest">
              Loading entries & expenses...
            </p>
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="py-20 text-center border border-dashed border-neutral-800 rounded-lg p-8">
            <Car className="w-10 h-10 text-neutral-700 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-neutral-300 uppercase tracking-wider">
              No entries found
            </h3>
            <p className="text-xs text-neutral-500 mt-1 font-mono">
              Try adjusting your search query or date range filters.
            </p>
          </div>
        ) : (
          /* Date grouped entries listing */
          <div className="space-y-8">
            {dateTitles.map((dateTitle) => {
              const dayList = groupedEntries[dateTitle];
              const dayWashes = dayList.filter((x) => x.type === "wash");
              const dayExpenses = dayList.filter((x) => x.type === "expense");
              const dayWashTotal = dayWashes.reduce((acc, curr) => acc + (curr.amount || 0), 0);
              const dayExpTotal = dayExpenses.reduce((acc, curr) => acc + (curr.amount || 0), 0);
              const dayPaid = dayWashes.filter((x) => x.paymentStatus === "Paid").length;
              const dayPending = dayWashes.filter((x) => x.paymentStatus === "Pending").length;

              return (
                <div key={dateTitle} className="space-y-3">
                  {/* Dated Title Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-neutral-800">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-neutral-400" />
                      <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
                        {dateTitle}
                      </h2>
                      <span className="ml-2 px-2 py-0.5 text-xs font-mono rounded bg-neutral-900 border border-neutral-800 text-neutral-400">
                        {dayList.length} total ({dayWashes.length} washes, {dayExpenses.length} expenses)
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
                      <span className="text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> {dayPaid} Paid
                      </span>
                      {dayPending > 0 && (
                        <span className="text-amber-400 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> {dayPending} Pending
                        </span>
                      )}
                      <span className="text-white font-bold ml-1">
                        Washes: ₹{dayWashTotal.toLocaleString("en-IN")}
                      </span>
                      {dayExpTotal > 0 && (
                        <span className="text-amber-300 font-bold bg-amber-950/60 border border-amber-800/80 px-2 py-0.5 rounded">
                          Expenses: ₹{dayExpTotal.toLocaleString("en-IN")}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Day's entries table / list */}
                  <div className="bg-neutral-950 border border-neutral-800 rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs font-mono">
                        <thead className="bg-neutral-900/80 border-b border-neutral-800 text-neutral-400 uppercase tracking-wider">
                          <tr>
                            <th className="px-4 py-3">Type</th>
                            <th className="px-4 py-3">Time</th>
                            <th className="px-4 py-3">Details / Reg No</th>
                            <th className="px-4 py-3">Category</th>
                            <th className="px-4 py-3">Customer / Paid By</th>
                            <th className="px-4 py-3 text-right">Amount</th>
                            <th className="px-4 py-3 text-center">Status / Mode</th>
                            <th className="px-4 py-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-900 text-neutral-300">
                          {dayList.map((entry) => {
                            const entryTime = new Date(entry.createdAt).toLocaleTimeString("en-IN", {
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: true,
                            });

                            if (entry.type === "expense") {
                              // Highlighted Expense Row (Amber accent with badge)
                              return (
                                <tr
                                  key={`exp-${entry._id}`}
                                  className="bg-amber-950/25 border-l-4 border-l-amber-500 hover:bg-amber-950/35 transition"
                                >
                                  <td className="px-4 py-3 whitespace-nowrap">
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-amber-500 text-black font-mono">
                                      <Receipt className="w-3 h-3" />
                                      Expense
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-amber-200/70 whitespace-nowrap">
                                    {entryTime}
                                  </td>
                                  <td className="px-4 py-3 font-bold text-amber-200 tracking-wide">
                                    <div className="flex items-center gap-1.5">
                                      <ArrowDownRight className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                      <span>{entry.title}</span>
                                    </div>
                                    {entry.notes && (
                                      <div className="text-[10px] text-amber-400/70 font-normal mt-0.5">
                                        {entry.notes}
                                      </div>
                                    )}
                                  </td>
                                  <td className="px-4 py-3">
                                    <span className="text-amber-300 font-medium">
                                      {entry.category}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-neutral-400 whitespace-nowrap">
                                    {entry.paidBy ? (
                                      <span className="text-amber-200/90 font-mono">
                                        Paid by: {entry.paidBy}
                                      </span>
                                    ) : (
                                      <span className="text-neutral-600">-</span>
                                    )}
                                  </td>
                                  <td className="px-4 py-3 text-right font-bold text-amber-300 whitespace-nowrap text-sm">
                                    - ₹{entry.amount}
                                  </td>
                                  <td className="px-4 py-3 text-center whitespace-nowrap">
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold rounded bg-neutral-900 text-neutral-300 border border-neutral-700">
                                      {entry.paymentMode === "Cash" ? (
                                        <Banknote className="w-3 h-3 text-neutral-400" />
                                      ) : (
                                        <QrCode className="w-3 h-3 text-neutral-400" />
                                      )}
                                      {entry.paymentMode}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-right whitespace-nowrap">
                                    <button
                                      type="button"
                                      onClick={() => openEditModal(entry)}
                                      className="inline-flex items-center gap-1 px-2 py-1 bg-neutral-900 hover:bg-neutral-800 text-amber-300 border border-amber-900/60 rounded text-[11px] font-mono cursor-pointer transition"
                                      title="Edit expense"
                                    >
                                      <Edit3 className="w-3 h-3" />
                                      <span>Edit</span>
                                    </button>
                                  </td>
                                </tr>
                              );
                            }

                            // Standard Wash Row
                            const isPending = entry.paymentStatus === "Pending" || entry.paymentMode === "Pending";
                            const isPaid = !isPending;
                            const regNum = entry.vehicleNumber || entry.registrationNumber || "-";
                            const modelDisplay = [entry.make, entry.model].filter(Boolean).join(" ") || entry.vehicleModel;

                            return (
                              <tr
                                key={`wash-${entry._id}`}
                                className={`transition ${
                                  isPending ? "bg-amber-950/15 border-l-4 border-l-amber-600/70" : "hover:bg-neutral-900/50"
                                }`}
                              >
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-neutral-900 text-neutral-300 border border-neutral-800 font-mono">
                                    <Car className="w-3 h-3 text-neutral-400" />
                                    Wash
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-neutral-500 whitespace-nowrap">
                                  {entryTime}
                                </td>
                                <td className="px-4 py-3 font-bold text-white tracking-wider">
                                  <div className="flex items-center gap-2">
                                    <span>{regNum}</span>
                                    {modelDisplay && (
                                      <span className="text-[11px] text-neutral-400 font-normal">
                                        ({modelDisplay})
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-neutral-300">
                                  {entry.category}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-neutral-400">
                                  {entry.customerPhone ? (
                                    <span className="flex items-center gap-1.5">
                                      <Phone className="w-3 h-3 text-neutral-600" />
                                      {entry.customerPhone}
                                    </span>
                                  ) : (
                                    <span className="text-neutral-600">-</span>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-right font-bold text-white whitespace-nowrap">
                                  ₹{entry.amount}
                                </td>
                                <td className="px-4 py-3 text-center whitespace-nowrap">
                                  <div className="inline-flex items-center gap-1.5">
                                    {isPaid ? (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/60">
                                        <CheckCircle2 className="w-3 h-3" />
                                        {entry.paymentMode === "UPI" || entry.paymentMode?.includes("UPI") ? (
                                          <span className="flex items-center gap-0.5">
                                            <QrCode className="w-2.5 h-2.5" /> UPI
                                          </span>
                                        ) : (
                                          <span className="flex items-center gap-0.5">
                                            <Banknote className="w-2.5 h-2.5" /> Cash
                                          </span>
                                        )}
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold rounded bg-amber-950/60 text-amber-400 border border-amber-800/60">
                                        <Clock className="w-3 h-3" />
                                        Pending
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-right whitespace-nowrap">
                                  <div className="flex items-center justify-end gap-1.5">
                                    {isPending && (
                                      <button
                                        type="button"
                                        disabled={updatingId === entry._id}
                                        onClick={() => handleSettle(entry._id, "Cash")}
                                        className="px-2 py-1 bg-amber-500 hover:bg-amber-400 text-black text-[10px] font-mono uppercase font-bold cursor-pointer rounded"
                                        title="Quick Settle with Cash"
                                      >
                                        {updatingId === entry._id ? "..." : "Settle"}
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => openEditModal(entry)}
                                      className="inline-flex items-center gap-1 px-2 py-1 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 rounded text-[11px] font-mono cursor-pointer transition"
                                      title="Edit entry details"
                                    >
                                      <Edit3 className="w-3 h-3 text-neutral-400" />
                                      <span>Edit</span>
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Small Edit Setup Modal (Washes & Expenses) */}
      {editingEntry && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-950 border border-neutral-800 w-full max-w-lg p-5 sm:p-6 space-y-4 rounded-lg shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-900 pb-3">
              <div className="flex items-center gap-2">
                <Edit3 className="h-4 w-4 text-sky-400" />
                <h3 className="font-mono text-sm uppercase font-bold text-white">
                  {editingEntry.type === "wash" ? "Edit Wash Entry" : "Edit Expense"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingEntry(null)}
                className="text-neutral-500 hover:text-white cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5 text-xs font-mono">
              {editingEntry.type === "wash" ? (
                <>
                  <div>
                    <label className="block uppercase text-neutral-400 mb-1">Vehicle Number</label>
                    <input
                      type="text"
                      placeholder="Optional"
                      value={editingEntry.vehicleNumber || ""}
                      onChange={(e) => setEditingEntry({ ...editingEntry, vehicleNumber: e.target.value.toUpperCase() })}
                      className="w-full bg-black border border-neutral-800 px-3 py-2 text-white font-mono uppercase text-sm focus:outline-none focus:border-white rounded"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block uppercase text-neutral-400 mb-1">Customer Phone</label>
                      <input
                        type="tel"
                        maxLength={10}
                        placeholder="10 Digits (Optional)"
                        value={editingEntry.customerPhone || ""}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                          setEditingEntry({ ...editingEntry, customerPhone: val });
                        }}
                        className="w-full bg-black border border-neutral-800 px-3 py-2 text-white font-mono focus:outline-none focus:border-white rounded"
                      />
                    </div>
                    <div>
                      <label className="block uppercase text-neutral-400 mb-1">Customer Name</label>
                      <input
                        type="text"
                        value={editingEntry.customerName || ""}
                        onChange={(e) => setEditingEntry({ ...editingEntry, customerName: e.target.value })}
                        className="w-full bg-black border border-neutral-800 px-3 py-2 text-white font-mono focus:outline-none focus:border-white rounded"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block uppercase text-neutral-400 mb-1">Category</label>
                      <select
                        value={editingEntry.category}
                        onChange={(e) => {
                          const newCat = e.target.value;
                          if (newCat === "Custom") {
                            setEditingEntry({ ...editingEntry, category: "Custom" });
                            return;
                          }
                          const match = tariffs.find((p) => p.category === newCat);
                          setEditingEntry({
                            ...editingEntry,
                            category: newCat,
                            amount: match?.price !== undefined ? match.price : editingEntry.amount,
                          });
                        }}
                        className="w-full bg-black border border-neutral-800 px-2.5 py-2 text-white font-mono focus:outline-none focus:border-white rounded"
                      >
                        <option value="Custom" className="bg-neutral-900 text-white font-bold">Custom (Manual Amount)</option>
                        
                        {tariffs.some((p) => p.group === "2 wheeler") && (
                          <optgroup label="2 WHEELER" className="bg-neutral-950 text-neutral-400 font-bold">
                            {tariffs.filter((p) => p.group === "2 wheeler").map((p) => (
                              <option key={p.category} value={p.category} className="text-white bg-black">
                                {p.name || p.category} {p.price && p.price > 0 ? `— ₹${p.price}` : "— No Amount"}
                              </option>
                            ))}
                          </optgroup>
                        )}

                        {tariffs.some((p) => p.group === "car") && (
                          <optgroup label="CAR" className="bg-neutral-950 text-neutral-400 font-bold">
                            {tariffs.filter((p) => p.group === "car").map((p) => (
                              <option key={p.category} value={p.category} className="text-white bg-black">
                                {(p.name || p.category).replace(/^Car - /i, "")} {p.price && p.price > 0 ? `— ₹${p.price}` : "— No Amount"}
                              </option>
                            ))}
                          </optgroup>
                        )}

                        {tariffs.some((p) => p.group === "pickup") && (
                          <optgroup label="PICKUP" className="bg-neutral-950 text-neutral-400 font-bold">
                            {tariffs.filter((p) => p.group === "pickup").map((p) => (
                              <option key={p.category} value={p.category} className="text-white bg-black">
                                {p.name || p.category} {p.price && p.price > 0 ? `— ₹${p.price}` : "— No Amount"}
                              </option>
                            ))}
                          </optgroup>
                        )}

                        {tariffs.some((p) => p.group === "traveller") && (
                          <optgroup label="TRAVELLER" className="bg-neutral-950 text-neutral-400 font-bold">
                            {tariffs.filter((p) => p.group === "traveller").map((p) => (
                              <option key={p.category} value={p.category} className="text-white bg-black">
                                {p.name || p.category} {p.price && p.price > 0 ? `— ₹${p.price}` : "— No Amount"}
                              </option>
                            ))}
                          </optgroup>
                        )}
                      </select>
                    </div>

                    <div>
                      <label className="block uppercase text-neutral-400 mb-1">Amount (₹)</label>
                      <input
                        type="number"
                        required
                        value={editingEntry.amount}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          const match = tariffs.find((p) => p.category === editingEntry.category);
                          const nextCat = match && match.price !== val ? "Custom" : editingEntry.category;
                          setEditingEntry({ ...editingEntry, amount: val, category: nextCat });
                        }}
                        className="w-full bg-black border border-neutral-800 px-3 py-2 text-white font-mono font-bold focus:outline-none focus:border-white rounded"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block uppercase text-neutral-400 mb-1">Payment Mode</label>
                      <select
                        value={editingEntry.paymentMode}
                        onChange={(e) => {
                          const mode = e.target.value;
                          setEditingEntry({
                            ...editingEntry,
                            paymentMode: mode,
                            paymentStatus: mode === "Pending" ? "Pending" : "Paid",
                          });
                        }}
                        className="w-full bg-black border border-neutral-800 px-2.5 py-2 text-white font-mono focus:outline-none focus:border-white rounded"
                      >
                        <option value="UPI / QR">UPI / QR</option>
                        <option value="Cash">Cash</option>
                        <option value="Pending">Pending</option>
                      </select>
                    </div>

                    <div>
                      <label className="block uppercase text-neutral-400 mb-1">Payment Status</label>
                      <select
                        value={editingEntry.paymentStatus}
                        onChange={(e) => setEditingEntry({ ...editingEntry, paymentStatus: e.target.value })}
                        className="w-full bg-black border border-neutral-800 px-2.5 py-2 text-white font-mono focus:outline-none focus:border-white rounded"
                      >
                        <option value="Paid">Paid</option>
                        <option value="Pending">Pending</option>
                      </select>
                    </div>
                  </div>
                </>
              ) : (
                /* Expense Edit Fields */
                <>
                  <div>
                    <label className="block uppercase text-neutral-400 mb-1">Expense Title *</label>
                    <input
                      type="text"
                      required
                      value={editingEntry.title || ""}
                      onChange={(e) => setEditingEntry({ ...editingEntry, title: e.target.value })}
                      className="w-full bg-black border border-neutral-800 px-3 py-2 text-white font-mono focus:outline-none focus:border-white rounded"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block uppercase text-neutral-400 mb-1">Amount (₹) *</label>
                      <input
                        type="number"
                        required
                        value={editingEntry.amount}
                        onChange={(e) => setEditingEntry({ ...editingEntry, amount: Number(e.target.value) })}
                        className="w-full bg-black border border-neutral-800 px-3 py-2 text-white font-mono font-bold focus:outline-none focus:border-white rounded"
                      />
                    </div>
                    <div>
                      <label className="block uppercase text-neutral-400 mb-1">Category</label>
                      <select
                        value={editingEntry.category}
                        onChange={(e) => setEditingEntry({ ...editingEntry, category: e.target.value })}
                        className="w-full bg-black border border-neutral-800 px-2.5 py-2 text-white font-mono focus:outline-none focus:border-white rounded"
                      >
                        <option value="Miscellaneous">Miscellaneous</option>
                        <option value="Chemicals & Soap">Chemicals & Soap</option>
                        <option value="Electricity & Water">Electricity & Water</option>
                        <option value="Staff & Daily Wages">Staff & Daily Wages</option>
                        <option value="Maintenance & Tools">Maintenance & Tools</option>
                        <option value="Refreshments / Tea">Refreshments / Tea</option>
                        <option value="Rent">Rent</option>
                        <option value="Fuel / Diesel">Fuel / Diesel</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block uppercase text-neutral-400 mb-1">Payment Mode</label>
                      <select
                        value={editingEntry.paymentMode}
                        onChange={(e) => setEditingEntry({ ...editingEntry, paymentMode: e.target.value })}
                        className="w-full bg-black border border-neutral-800 px-2.5 py-2 text-white font-mono focus:outline-none focus:border-white rounded"
                      >
                        <option value="Cash">Cash</option>
                        <option value="UPI / QR">UPI / QR</option>
                      </select>
                    </div>
                    <div>
                      <label className="block uppercase text-neutral-400 mb-1">Paid By</label>
                      <input
                        type="text"
                        value={editingEntry.paidBy || ""}
                        onChange={(e) => setEditingEntry({ ...editingEntry, paidBy: e.target.value })}
                        className="w-full bg-black border border-neutral-800 px-3 py-2 text-white font-mono focus:outline-none focus:border-white rounded"
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block uppercase text-neutral-400 mb-1">Notes</label>
                <input
                  type="text"
                  placeholder="Optional notes"
                  value={editingEntry.notes || ""}
                  onChange={(e) => setEditingEntry({ ...editingEntry, notes: e.target.value })}
                  className="w-full bg-black border border-neutral-800 px-3 py-2 text-white font-mono focus:outline-none focus:border-white rounded"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-900">
                <button
                  type="button"
                  onClick={() => setEditingEntry(null)}
                  className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 font-mono text-xs uppercase cursor-pointer rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="px-5 py-2 bg-white hover:bg-neutral-200 text-black font-mono font-bold text-xs uppercase cursor-pointer flex items-center gap-1.5 rounded"
                >
                  <Save className="h-3.5 w-3.5" />
                  <span>{isSavingEdit ? "Saving..." : "Save Changes"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

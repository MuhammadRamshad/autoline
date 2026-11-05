"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
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
  Filter
} from "lucide-react";

interface WashEntryItem {
  _id: string;
  vehicleNumber?: string;
  registrationNumber?: string;
  make?: string;
  model?: string;
  vehicleModel?: string;
  category: string;
  serviceType: string;
  paymentMode: string;
  paymentStatus: string;
  amount: number;
  customerPhone?: string;
  customerName?: string;
  notes?: string;
  createdAt: string;
}

export default function AllEntriesPage() {
  const [entries, setEntries] = useState<WashEntryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

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

      const res = await fetch(`/api/washes?${params.toString()}`, { cache: "no-store" });
      const data = await res.json();
      if (data.success && data.entries) {
        setEntries(data.entries);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
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

  // Group entries by Date (e.g. "Thursday, 5 November 2026")
  const groupedEntries: { [dateStr: string]: WashEntryItem[] } = {};
  entries.forEach((item) => {
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

  return (
    <div className="min-h-screen bg-black text-neutral-100 flex flex-col font-sans">
      {/* Top Header */}
      <header className="border-b border-neutral-800 bg-neutral-950/80 backdrop-blur sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="p-2 border border-neutral-800 rounded bg-neutral-900 text-neutral-400 hover:text-white hover:border-neutral-700 transition"
              title="Back to Home"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-lg font-black uppercase tracking-wider text-white">
                All Vehicle Entries
              </h1>
              <p className="text-xs text-neutral-400 font-mono">
                Historical records grouped by date
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/shop"
              className="px-3.5 py-1.5 text-xs font-mono font-bold uppercase tracking-wider bg-white text-black hover:bg-neutral-200 transition rounded"
            >
              Vehicle Entry Form
            </Link>
            <button
              onClick={() => fetchEntries()}
              className="p-2 border border-neutral-800 rounded bg-neutral-900 text-neutral-400 hover:text-white transition"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Filters Bar */}
        <div className="bg-neutral-950 border border-neutral-800 p-4 rounded-lg space-y-4">
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
                placeholder="Search registration, phone, model..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-neutral-900 border border-neutral-800 rounded text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-600 font-mono"
              />
            </form>

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
            {(search || fromDate || toDate || statusFilter !== "All" || categoryFilter !== "All") && (
              <button
                onClick={() => {
                  setSearch("");
                  setFromDate("");
                  setToDate("");
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

        {/* Results summary */}
        <div className="flex items-center justify-between text-xs font-mono text-neutral-400 px-1">
          <div>
            Showing <span className="text-white font-bold">{entries.length}</span> entries across{" "}
            <span className="text-white font-bold">{dateTitles.length}</span> date{dateTitles.length === 1 ? "" : "s"}
          </div>
        </div>

        {/* Loading skeleton */}
        {loading && entries.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-neutral-600 animate-spin mx-auto" />
            <p className="text-xs font-mono text-neutral-500 uppercase tracking-widest">
              Loading entries...
            </p>
          </div>
        ) : entries.length === 0 ? (
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
              const dayTotal = dayList.reduce((acc, curr) => acc + (curr.amount || 0), 0);
              const dayPaid = dayList.filter((x) => x.paymentStatus === "Paid").length;
              const dayPending = dayList.filter((x) => x.paymentStatus === "Pending").length;

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
                        {dayList.length} {dayList.length === 1 ? "entry" : "entries"}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs font-mono">
                      <span className="text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> {dayPaid} Paid
                      </span>
                      {dayPending > 0 && (
                        <span className="text-amber-400 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> {dayPending} Pending
                        </span>
                      )}
                      <span className="text-white font-bold ml-2">
                        Total: ₹{dayTotal.toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>

                  {/* Day's entries table / list */}
                  <div className="bg-neutral-950 border border-neutral-800 rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs font-mono">
                        <thead className="bg-neutral-900/80 border-b border-neutral-800 text-neutral-400 uppercase tracking-wider">
                          <tr>
                            <th className="px-4 py-3">Time</th>
                            <th className="px-4 py-3">Reg. Number</th>
                            <th className="px-4 py-3">Vehicle / Category</th>
                            <th className="px-4 py-3">Service</th>
                            <th className="px-4 py-3">Customer Phone</th>
                            <th className="px-4 py-3 text-right">Amount</th>
                            <th className="px-4 py-3 text-center">Status / Mode</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-900 text-neutral-300">
                          {dayList.map((entry) => {
                            const entryTime = new Date(entry.createdAt).toLocaleTimeString("en-IN", {
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: true,
                            });
                            const isPaid = entry.paymentStatus === "Paid";
                            const regNum = entry.vehicleNumber || entry.registrationNumber || "-";
                            const modelDisplay = [entry.make, entry.model].filter(Boolean).join(" ") || entry.vehicleModel;

                            return (
                              <tr key={entry._id} className="hover:bg-neutral-900/50 transition">
                                <td className="px-4 py-3 text-neutral-500 whitespace-nowrap">
                                  {entryTime}
                                </td>
                                <td className="px-4 py-3 font-bold text-white tracking-wider whitespace-nowrap">
                                  {regNum}
                                </td>
                                <td className="px-4 py-3">
                                  {modelDisplay ? (
                                    <>
                                      <div className="font-semibold text-white">
                                        {modelDisplay}
                                      </div>
                                      <div className="text-[11px] text-neutral-400">
                                        {entry.category}
                                      </div>
                                    </>
                                  ) : (
                                    <div className="font-semibold text-neutral-200">
                                      {entry.category}
                                    </div>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-neutral-400 whitespace-nowrap">
                                  {entry.serviceType}
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
                                        {entry.paymentMode === "UPI" ? (
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
    </div>
  );
}

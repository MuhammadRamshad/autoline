"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { 
  ChevronDown, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Clock, 
  Check, 
  Edit3, 
  CheckSquare, 
  Banknote, 
  QrCode,
  Save,
  Receipt,
  Plus,
  ArrowUpRight
} from "lucide-react";
import { INDIAN_VEHICLES_DATABASE, IndianVehicleModel } from "@/lib/vehicleDatabase";

export default function ShopkeeperCounterPage() {
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Hatchback (5 Seater)");
  const [selectedMake, setSelectedMake] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [amount, setAmount] = useState<number>(350);
  const [paymentMode, setPaymentMode] = useState<string>("UPI / QR");
  const [notes, setNotes] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Modern Toast Notification State
  const [toast, setToast] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);

  const showToast = (message: string, type: "success" | "error" | "info" = "info") => {
    setToast({ type, message });
  };

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      setToast(null);
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  const [pricesList, setPricesList] = useState<any[]>([]);
  const [vehicleSearchText, setVehicleSearchText] = useState("");
  const [filteredVehicles, setFilteredVehicles] = useState<IndianVehicleModel[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSubmittedEntry, setLastSubmittedEntry] = useState<any>(null);
  const [recentEntries, setRecentEntries] = useState<any[]>([]);

  // Edit Modal State for Shopkeeper
  const [editingEntry, setEditingEntry] = useState<any | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Expense Quick-Form State
  const [expenseTitle, setExpenseTitle] = useState("");
  const [expenseCategory, setExpenseCategory] = useState("Miscellaneous");
  const [expenseAmount, setExpenseAmount] = useState<string>("");
  const [expensePaymentMode, setExpensePaymentMode] = useState<"Cash" | "UPI / QR">("Cash");
  const [expensePaidBy, setExpensePaidBy] = useState("");
  const [isSubmittingExpense, setIsSubmittingExpense] = useState(false);
  const [recentExpenses, setRecentExpenses] = useState<any[]>([]);

  const fetchRecentExpenses = async () => {
    try {
      const ts = Date.now();
      const res = await fetch(`/api/expenses?limit=4&_t=${ts}`, { cache: "no-store" });
      const data = await res.json();
      if (data.success && data.expenses) {
        setRecentExpenses(data.expenses);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseTitle.trim()) {
      showToast("Please enter an expense title", "error");
      return;
    }
    const num = Number(expenseAmount);
    if (!expenseAmount || isNaN(num) || num <= 0) {
      showToast("Please enter a valid expense amount", "error");
      return;
    }

    setIsSubmittingExpense(true);
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: expenseTitle.trim(),
          category: expenseCategory,
          amount: num,
          paymentMode: expensePaymentMode,
          paidBy: expensePaidBy.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`Expense recorded: ₹${data.expense.amount} (${data.expense.title})`, "success");
        setExpenseTitle("");
        setExpenseAmount("");
        setExpensePaidBy("");
        fetchRecentExpenses();
      } else {
        showToast(data.error || "Failed to save expense", "error");
      }
    } catch (err: any) {
      showToast(err.message || "Network error", "error");
    } finally {
      setIsSubmittingExpense(false);
    }
  };

  useEffect(() => {
    fetchTariffs();
    fetchRecentEntries();
    fetchRecentExpenses();

    // Auto-sync polling every 2.5 seconds to instantly reflect Admin price changes or status updates
    const interval = setInterval(() => {
      fetchTariffs();
      fetchRecentEntries();
      fetchRecentExpenses();
    }, 2500);

    // Sync immediately when user switches back to this tab / window
    const handleFocus = () => {
      fetchTariffs();
      fetchRecentEntries();
      fetchRecentExpenses();
    };
    window.addEventListener("focus", handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  const fetchTariffs = async () => {
    try {
      const ts = Date.now();
      const res = await fetch(`/api/prices?_t=${ts}`, { cache: "no-store" });
      const data = await res.json();
      if (data.success && data.prices) {
        setPricesList(data.prices);
        const match = data.prices.find((p: any) => p.category === selectedCategory);
        if (match) {
          setAmount(match.price);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchRecentEntries = async () => {
    try {
      const ts = Date.now();
      const res = await fetch(`/api/washes?limit=6&_t=${ts}`, { cache: "no-store" });
      const data = await res.json();
      if (data.success) {
        setRecentEntries(data.entries);
      }
    } catch (e) {
      console.error(e);
    }
  };



  // Automatically update the single amount whenever Category changes based on Admin's rate
  useEffect(() => {
    if (pricesList.length === 0) return;
    const catTariff = pricesList.find((p) => p.category === selectedCategory);
    if (catTariff && catTariff.price !== undefined) {
      setAmount(catTariff.price);
    }
  }, [selectedCategory, pricesList]);

  const markAsSettled = async (id: string, mode: string = "Cash") => {
    try {
      setUpdatingId(id);
      const res = await fetch("/api/washes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          paymentStatus: "Paid",
          paymentMode: mode
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        fetchRecentEntries();
        if (lastSubmittedEntry && lastSubmittedEntry._id === id) {
          setLastSubmittedEntry({ ...lastSubmittedEntry, paymentStatus: "Paid", paymentMode: mode });
        }
        showToast(`Settled as ${mode}`, "success");
      } else {
        showToast(data.error || "Failed to update status", "error");
      }
    } catch (err: any) {
      showToast(err.message || "Error settling amount", "error");
    } finally {
      setUpdatingId(null);
    }
  };

  const openEditModal = (entry: any) => {
    setEditingEntry({
      ...entry,
      vehicleNumber: entry.vehicleNumber || "",
      customerName: entry.customerName || "",
      customerPhone: entry.customerPhone || "",
      category: entry.category || "Hatchback (5 Seater)",
      amount: entry.amount || 0,
      paymentMode: entry.paymentMode || "UPI / QR",
      paymentStatus: entry.paymentStatus || (entry.paymentMode === "Pending" ? "Pending" : "Paid"),
      notes: entry.notes || "",
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEntry) return;

    if (editingEntry.amount === undefined || editingEntry.amount === null || isNaN(Number(editingEntry.amount)) || Number(editingEntry.amount) < 0) {
      showToast("Valid amount is required", "error");
      return;
    }

    const trimmedPhone = (editingEntry.customerPhone || "").toString().trim();
    if (trimmedPhone) {
      const digitsOnly = trimmedPhone.replace(/\D/g, "");
      if (digitsOnly.length !== 10) {
        showToast("Phone number must be exactly 10 digits", "error");
        return;
      }
    }

    setIsSavingEdit(true);
    try {
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
        showToast(`Updated entry successfully`, "success");
        setEditingEntry(null);
        fetchRecentEntries();
        if (lastSubmittedEntry && lastSubmittedEntry._id === data.entry._id) {
          setLastSubmittedEntry(data.entry);
        }
      } else {
        showToast(data.error || "Failed to save changes", "error");
      }
    } catch (err: any) {
      showToast(err.message || "Failed to update record", "error");
    } finally {
      setIsSavingEdit(false);
    }
  };

  useEffect(() => {
    if (!vehicleSearchText.trim()) {
      setFilteredVehicles([]);
      return;
    }
    const q = vehicleSearchText.toLowerCase();
    const matches = INDIAN_VEHICLES_DATABASE.filter(
      (v) =>
        v.model.toLowerCase().includes(q) ||
        v.make.toLowerCase().includes(q) ||
        `${v.make} ${v.model}`.toLowerCase().includes(q)
    ).slice(0, 8);
    setFilteredVehicles(matches);
  }, [vehicleSearchText]);

  const selectVehicle = (v: IndianVehicleModel) => {
    setSelectedMake(v.make);
    setSelectedModel(v.model);
    setSelectedCategory(v.category);
    // Auto-update amount according to category rate
    const catTariff = pricesList.find((p) => p.category === v.category);
    if (catTariff && catTariff.price !== undefined) {
      setAmount(catTariff.price);
    } else {
      setAmount(v.defaultWashPrice);
    }
    setVehicleSearchText(`${v.make} ${v.model}`);
    setShowDropdown(false);
    showToast(`Selected ${v.make} ${v.model} (${v.category})`, "info");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (amount === undefined || amount === null || isNaN(Number(amount)) || Number(amount) < 0) {
      showToast("Please enter a valid amount", "error");
      return;
    }

    const trimmedPhone = (customerPhone || "").toString().trim();
    if (trimmedPhone) {
      const digitsOnly = trimmedPhone.replace(/\D/g, "");
      if (digitsOnly.length !== 10) {
        showToast("Phone number must be exactly 10 digits", "error");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const isPending = paymentMode === "Pending";
      const res = await fetch("/api/washes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicleNumber: vehicleNumber ? vehicleNumber.toUpperCase().trim() : "",
          customerName: customerName.trim(),
          customerPhone: trimmedPhone,
          make: selectedMake,
          model: selectedModel,
          category: selectedCategory,
          serviceType: "Full Wash",
          amount: Number(amount),
          paymentMode,
          paymentStatus: isPending ? "Pending" : "Paid",
          notes: notes.trim(),
          status: "Completed"
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setLastSubmittedEntry(data.entry);
        showToast(
          `Recorded ${data.entry.vehicleNumber || "Vehicle"} (₹${data.entry.amount} • ${data.entry.paymentMode})`,
          "success"
        );
        setVehicleNumber("");
        setCustomerPhone("");
        setCustomerName("");
        setVehicleSearchText("");
        setSelectedMake("");
        setSelectedModel("");
        setNotes("");
        fetchRecentEntries();
      } else {
        showToast(data.error || "Failed to submit entry", "error");
      }
    } catch (err: any) {
      showToast(err.message || "Network error", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const paymentOptions = ["UPI / QR", "Cash", "Pending"];

  return (
    <div className="min-h-screen bg-black text-white flex flex-col selection:bg-white selection:text-black">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-10">
        
        {/* Header */}
        <div className="flex items-baseline justify-between border-b border-neutral-900 pb-3 mb-6 sm:mb-8">
          <h1 className="text-lg sm:text-xl font-bold uppercase tracking-tight">Vehicle Entry</h1>
          <span className="text-xs font-mono text-neutral-500 uppercase">Autoline</span>
        </div>

        {/* Floating Top-Right Toast Notification */}
        {toast && (
          <div className="fixed top-20 right-6 z-50 flex items-center gap-3 px-4 py-3 shadow-2xl rounded border font-mono text-xs animate-in fade-in slide-in-from-top-4 duration-200 transition-all bg-neutral-950 backdrop-blur-md max-w-sm">
            {toast.type === "success" && <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />}
            {toast.type === "error" && <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />}
            {toast.type === "info" && <CheckCircle2 className="h-4 w-4 text-sky-400 shrink-0" />}
            
            <div className={`flex-1 ${
              toast.type === "success" ? "text-emerald-300" :
              toast.type === "error" ? "text-rose-300" : "text-sky-300"
            }`}>
              {toast.message}
            </div>

            <button
              onClick={() => setToast(null)}
              className="text-neutral-500 hover:text-white cursor-pointer ml-1"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
          
          {/* Main Form */}
          <div className="md:col-span-7">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Registration */}
              <div>
                <label className="block text-xs uppercase font-mono tracking-wider text-neutral-400 mb-2">
                  Vehicle Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. MH12AB1234 (Optional)"
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                  className="w-full bg-black border border-neutral-800 px-4 py-3 text-lg font-mono tracking-widest text-white uppercase placeholder:text-neutral-700 focus:outline-none focus:border-white transition-colors"
                />
              </div>

              {/* Model Search */}
              <div>
                <label className="block text-xs uppercase font-mono tracking-wider text-neutral-400 mb-2">
                  Vehicle Model
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search model (e.g. Swift, Innova, Thar, Splendor, Creta)"
                    value={vehicleSearchText}
                    onChange={(e) => {
                      setVehicleSearchText(e.target.value);
                      setShowDropdown(true);
                    }}
                    onFocus={() => setShowDropdown(true)}
                    className="w-full bg-black border border-neutral-800 px-3.5 py-2.5 text-xs text-white placeholder:text-neutral-700 focus:outline-none focus:border-white"
                  />

                  {showDropdown && filteredVehicles.length > 0 && (
                    <div className="absolute z-20 left-0 right-0 mt-1 bg-neutral-950 border border-neutral-800 max-h-48 overflow-y-auto">
                      {filteredVehicles.map((v, i) => (
                        <div
                          key={i}
                          onClick={() => selectVehicle(v)}
                          className="px-3.5 py-2 hover:bg-neutral-900 cursor-pointer flex items-center justify-between text-xs border-b border-neutral-900"
                        >
                          <span className="font-semibold text-white">{v.make} {v.model}</span>
                          <span className="text-[10px] text-neutral-500 font-mono">{v.category}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Category (Single Selection with chevron and instant rate auto-fill) */}
              <div>
                <label className="block text-xs uppercase font-mono tracking-wider text-neutral-400 mb-2">
                  Vehicle Category (Determines Rate)
                </label>
                <div className="relative">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full appearance-none bg-black border border-neutral-800 pl-3.5 pr-10 py-3 text-xs text-white focus:outline-none focus:border-white cursor-pointer"
                  >
                    {pricesList.length > 0 ? (
                      pricesList.map((p) => (
                        <option key={p.category} value={p.category}>
                          {p.category} — ₹{p.price}
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="Bike / Scooter">Bike / Scooter — ₹150</option>
                        <option value="Hatchback (5 Seater)">Hatchback (5 Seater) — ₹350</option>
                        <option value="Sedan (5 Seater)">Sedan (5 Seater) — ₹420</option>
                        <option value="Compact SUV (5 Seater)">Compact SUV (5 Seater) — ₹480</option>
                        <option value="SUV / MUV (7 Seater)">SUV / MUV (7 Seater) — ₹600</option>
                        <option value="Luxury / Large Vehicle">Luxury / Large Vehicle — ₹850</option>
                        <option value="Auto / Commercial">Auto / Commercial — ₹300</option>
                      </>
                    )}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-neutral-400">
                    <ChevronDown className="h-4 w-4" />
                  </div>
                </div>
              </div>

              {/* Phone & Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase font-mono tracking-wider text-neutral-400 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    maxLength={10}
                    placeholder="10 Digits (Optional)"
                    value={customerPhone}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                      setCustomerPhone(val);
                    }}
                    className="w-full bg-black border border-neutral-800 px-3 py-2.5 text-xs font-mono text-white placeholder:text-neutral-700 focus:outline-none focus:border-white"
                  />
                  {customerPhone && customerPhone.length !== 10 && (
                    <span className="text-[10px] text-amber-400 font-mono mt-1 block">
                      Must be exactly 10 digits ({customerPhone.length}/10)
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-xs uppercase font-mono tracking-wider text-neutral-400 mb-2">
                    Owner Name
                  </label>
                  <input
                    type="text"
                    placeholder="Optional"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full bg-black border border-neutral-800 px-3 py-2.5 text-xs text-white placeholder:text-neutral-700 focus:outline-none focus:border-white"
                  />
                </div>
              </div>

              {/* Single Amount & Payment Mode Selection */}
              <div className="border border-neutral-800 p-4 bg-neutral-950 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs uppercase font-mono tracking-wider text-neutral-400 block">Total Amount *</span>
                    <span className="text-[10px] text-neutral-500 font-mono">Auto-filled from category rate • Editable</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-sm font-mono text-neutral-500">₹</span>
                    <input
                      type="number"
                      required
                      value={amount}
                      onChange={(e) => setAmount(Number(e.target.value))}
                      className="w-28 bg-transparent border-b border-neutral-700 font-mono text-2xl font-bold text-white focus:outline-none focus:border-white text-right"
                    />
                  </div>
                </div>

                <div>
                  <div className="text-[11px] uppercase font-mono text-neutral-400 mb-2.5">
                    Payment Mode: <span className={paymentMode === "Pending" ? "text-amber-400 font-bold" : "text-white font-bold"}>{paymentMode}</span>
                  </div>
                  
                  {/* Selectable payment buttons: UPI / QR, Cash, Pending */}
                  <div className="grid grid-cols-3 gap-2.5 pt-2 border-t border-neutral-900">
                    {paymentOptions.map((opt) => {
                      const isSelected = paymentMode === opt;
                      const isPendingOpt = opt === "Pending";
                      return (
                        <label
                          key={opt}
                          onClick={() => setPaymentMode(opt)}
                          className={`cursor-pointer select-none py-3 px-3 text-xs font-mono text-center border transition-all flex flex-col items-center justify-center gap-1.5 ${
                            isSelected
                              ? isPendingOpt
                                ? "bg-amber-500 text-black font-bold border-amber-400 ring-2 ring-amber-400/40"
                                : "bg-white text-black font-bold border-white"
                              : isPendingOpt
                              ? "bg-black text-amber-400/90 border-amber-900/60 hover:text-amber-300 hover:border-amber-600"
                              : "bg-black text-neutral-400 border-neutral-800 hover:text-white hover:border-neutral-600"
                          }`}
                        >
                          <input
                            type="radio"
                            name="payment_mode_radio"
                            checked={isSelected}
                            onChange={() => setPaymentMode(opt)}
                            className="sr-only"
                          />
                          <span
                            className={`w-2.5 h-2.5 rounded-full border ${
                              isSelected
                                ? isPendingOpt ? "bg-black border-black" : "bg-black border-black"
                                : isPendingOpt ? "border-amber-600" : "border-neutral-600"
                            }`}
                          />
                          <span>{opt}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-4 text-xs font-mono uppercase tracking-wider font-bold transition-all disabled:opacity-50 cursor-pointer ${
                  paymentMode === "Pending"
                    ? "bg-amber-500 hover:bg-amber-400 text-black shadow-lg shadow-amber-500/10"
                    : "bg-white hover:bg-neutral-200 text-black"
                }`}
              >
                {isSubmitting
                  ? "Recording..."
                  : `Record Entry (₹${amount} • ${paymentMode})`}
              </button>
            </form>
          </div>

          {/* Right column: Recent Entries & Quick Expense Recording */}
          <div className="md:col-span-5 space-y-6">

            {/* Quick Expense Form Beside Vehicle Entry */}
            <div className="border border-neutral-800 p-4 bg-neutral-950 space-y-3">
              <div className="flex items-center justify-between border-b border-neutral-900 pb-2">
                <div className="flex items-center gap-1.5">
                  <Receipt className="h-3.5 w-3.5 text-amber-400" />
                  <span className="text-xs font-mono uppercase font-bold text-neutral-200">Record Expense</span>
                </div>
                <span className="text-[10px] font-mono text-neutral-500 uppercase">Shop Outflow</span>
              </div>

              <form onSubmit={handleExpenseSubmit} className="space-y-2.5">
                <div>
                  <input
                    type="text"
                    required
                    placeholder="Expense title (e.g. Shampoo, Tea, Sponge, Water)"
                    value={expenseTitle}
                    onChange={(e) => setExpenseTitle(e.target.value)}
                    className="w-full bg-black border border-neutral-800 px-2.5 py-1.5 text-xs text-white placeholder:text-neutral-700 font-mono focus:outline-none focus:border-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <select
                      value={expenseCategory}
                      onChange={(e) => setExpenseCategory(e.target.value)}
                      className="w-full bg-black border border-neutral-800 px-2 py-1.5 text-[11px] text-white font-mono focus:outline-none focus:border-white"
                    >
                      <option value="Chemicals & Soap">Chemicals & Soap</option>
                      <option value="Refreshments / Tea">Refreshments / Tea</option>
                      <option value="Electricity & Water">Electricity & Water</option>
                      <option value="Staff & Daily Wages">Staff & Daily Wages</option>
                      <option value="Maintenance & Tools">Maintenance & Tools</option>
                      <option value="Fuel / Diesel">Fuel / Diesel</option>
                      <option value="Miscellaneous">Miscellaneous</option>
                    </select>
                  </div>

                  <div className="relative">
                    <span className="absolute left-2.5 top-1.5 text-xs font-mono text-neutral-500">₹</span>
                    <input
                      type="number"
                      required
                      placeholder="Amount"
                      value={expenseAmount}
                      onChange={(e) => setExpenseAmount(e.target.value)}
                      className="w-full bg-black border border-neutral-800 pl-6 pr-2 py-1.5 text-xs font-mono font-bold text-white placeholder:text-neutral-700 focus:outline-none focus:border-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="flex border border-neutral-800">
                    <button
                      type="button"
                      onClick={() => setExpensePaymentMode("Cash")}
                      className={`flex-1 py-1 text-[10px] font-mono uppercase font-semibold ${
                        expensePaymentMode === "Cash" ? "bg-white text-black" : "bg-black text-neutral-400"
                      }`}
                    >
                      Cash
                    </button>
                    <button
                      type="button"
                      onClick={() => setExpensePaymentMode("UPI / QR")}
                      className={`flex-1 py-1 text-[10px] font-mono uppercase font-semibold ${
                        expensePaymentMode === "UPI / QR" ? "bg-white text-black" : "bg-black text-neutral-400"
                      }`}
                    >
                      UPI
                    </button>
                  </div>

                  <input
                    type="text"
                    placeholder="Paid by (Optional)"
                    value={expensePaidBy}
                    onChange={(e) => setExpensePaidBy(e.target.value)}
                    className="w-full bg-black border border-neutral-800 px-2.5 py-1 text-[11px] text-white placeholder:text-neutral-700 font-mono focus:outline-none focus:border-white"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingExpense}
                  className="w-full py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-[11px] font-mono uppercase font-bold text-neutral-300 hover:text-white transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Plus className="h-3 w-3" />
                  <span>{isSubmittingExpense ? "Saving..." : "Add Expense"}</span>
                </button>
              </form>

              {recentExpenses.length > 0 && (
                <div className="pt-2 border-t border-neutral-900">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 mb-1.5">
                    Today's Expenses
                  </div>
                  <div className="space-y-1">
                    {recentExpenses.slice(0, 3).map((exp) => (
                      <div key={exp._id} className="flex items-center justify-between text-[11px] font-mono text-neutral-400">
                        <span className="truncate max-w-[170px] text-neutral-300">{exp.title}</span>
                        <span className="text-white font-semibold">₹{exp.amount} <span className="text-[9px] text-neutral-500 font-normal">({exp.paymentMode})</span></span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Last entry card */}
            {lastSubmittedEntry && (
              <div className="border border-neutral-700 p-5 bg-neutral-950 space-y-3">
                <div className="flex items-center justify-between text-xs font-mono text-neutral-400 uppercase border-b border-neutral-850 pb-2">
                  <span>Entry Recorded</span>
                  <span>{new Date(lastSubmittedEntry.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</span>
                </div>
                <div>
                  <div className="text-2xl font-mono font-bold uppercase tracking-wider">{lastSubmittedEntry.vehicleNumber}</div>
                  <div className="text-xs text-neutral-400 mt-1">{lastSubmittedEntry.category}</div>
                </div>
                <div className="flex items-baseline justify-between pt-1">
                  <div className="text-xl font-mono font-bold">
                    ₹{lastSubmittedEntry.amount}{" "}
                    <span className="text-xs font-normal text-neutral-400 font-mono">({lastSubmittedEntry.paymentMode})</span>
                  </div>
                  <span className={`text-[10px] font-mono uppercase px-2 py-0.5 font-bold flex items-center gap-1 ${
                    lastSubmittedEntry.paymentStatus === "Pending"
                      ? "bg-amber-500/20 text-amber-400 border border-amber-500/50"
                      : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/50"
                  }`}>
                    {lastSubmittedEntry.paymentStatus === "Pending" ? <Clock className="h-3 w-3" /> : <Check className="h-3 w-3" />}
                    <span>{lastSubmittedEntry.paymentStatus || "Paid"}</span>
                  </span>
                </div>
                <div className="text-xs text-neutral-400 font-mono">
                  Phone: {lastSubmittedEntry.customerPhone}
                </div>
                
                <div className="flex gap-2 pt-1">
                  {lastSubmittedEntry.paymentStatus === "Pending" && (
                    <>
                      <button
                        type="button"
                        disabled={updatingId === lastSubmittedEntry._id}
                        onClick={() => markAsSettled(lastSubmittedEntry._id, "Cash")}
                        className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-mono uppercase font-bold transition-colors cursor-pointer flex items-center justify-center gap-1"
                      >
                        <Banknote className="h-3.5 w-3.5" />
                        <span>{updatingId === lastSubmittedEntry._id ? "Updating..." : "Settle Cash"}</span>
                      </button>
                      <button
                        type="button"
                        disabled={updatingId === lastSubmittedEntry._id}
                        onClick={() => markAsSettled(lastSubmittedEntry._id, "UPI / QR")}
                        className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-mono uppercase font-bold transition-colors cursor-pointer flex items-center justify-center gap-1"
                      >
                        <QrCode className="h-3.5 w-3.5" />
                        <span>{updatingId === lastSubmittedEntry._id ? "Updating..." : "Settle UPI"}</span>
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => openEditModal(lastSubmittedEntry)}
                    className="py-1.5 px-3 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-700 text-[11px] font-mono uppercase cursor-pointer flex items-center gap-1"
                  >
                    <Edit3 className="h-3 w-3" />
                    <span>Edit</span>
                  </button>
                </div>
              </div>
            )}

            {/* Quick Link to All Entries */}
            <div className="p-3 bg-neutral-950 border border-neutral-900 rounded flex items-center justify-between">
              <span className="text-xs font-mono text-neutral-400">Looking for all records?</span>
              <Link
                href="/entries"
                className="text-xs font-mono font-bold text-white hover:underline flex items-center gap-1.5"
              >
                <span>View All Entries</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>

          </div>

        </div>

        {/* Edit Entry Modal for Shopkeeper */}
        {editingEntry && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-neutral-950 border border-neutral-800 w-full max-w-lg p-6 space-y-5 shadow-2xl">
              <div className="flex items-center justify-between border-b border-neutral-900 pb-3">
                <div className="flex items-center gap-2">
                  <Edit3 className="h-4 w-4 text-sky-400" />
                  <h3 className="font-mono text-sm uppercase font-bold text-white">Edit Wash Entry</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingEntry(null)}
                  className="text-neutral-500 hover:text-white cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="space-y-4 text-xs font-mono">
                <div>
                  <label className="block uppercase text-neutral-400 mb-1">Vehicle Number</label>
                  <input
                    type="text"
                    placeholder="Optional"
                    value={editingEntry.vehicleNumber}
                    onChange={(e) => setEditingEntry({ ...editingEntry, vehicleNumber: e.target.value.toUpperCase() })}
                    className="w-full bg-black border border-neutral-800 px-3 py-2 text-white font-mono uppercase text-sm focus:outline-none focus:border-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block uppercase text-neutral-400 mb-1">Customer Phone</label>
                    <input
                      type="tel"
                      maxLength={10}
                      placeholder="10 Digits (Optional)"
                      value={editingEntry.customerPhone}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                        setEditingEntry({ ...editingEntry, customerPhone: val });
                      }}
                      className="w-full bg-black border border-neutral-800 px-3 py-2 text-white font-mono focus:outline-none focus:border-white"
                    />
                  </div>
                  <div>
                    <label className="block uppercase text-neutral-400 mb-1">Customer Name</label>
                    <input
                      type="text"
                      value={editingEntry.customerName}
                      onChange={(e) => setEditingEntry({ ...editingEntry, customerName: e.target.value })}
                      className="w-full bg-black border border-neutral-800 px-3 py-2 text-white font-mono focus:outline-none focus:border-white"
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
                        const match = pricesList.find((p) => p.category === newCat);
                        setEditingEntry({
                          ...editingEntry,
                          category: newCat,
                          amount: match?.price !== undefined ? match.price : editingEntry.amount,
                        });
                      }}
                      className="w-full bg-black border border-neutral-800 px-2.5 py-2 text-white font-mono focus:outline-none focus:border-white"
                    >
                      {pricesList.map((p) => (
                        <option key={p.category} value={p.category}>
                          {p.category}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block uppercase text-neutral-400 mb-1">Amount (₹)</label>
                    <input
                      type="number"
                      required
                      value={editingEntry.amount}
                      onChange={(e) => setEditingEntry({ ...editingEntry, amount: Number(e.target.value) })}
                      className="w-full bg-black border border-neutral-800 px-3 py-2 text-white font-mono font-bold focus:outline-none focus:border-white"
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
                      className="w-full bg-black border border-neutral-800 px-2.5 py-2 text-white font-mono focus:outline-none focus:border-white"
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
                      className="w-full bg-black border border-neutral-800 px-2.5 py-2 text-white font-mono focus:outline-none focus:border-white"
                    >
                      <option value="Paid">Paid</option>
                      <option value="Pending">Pending</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block uppercase text-neutral-400 mb-1">Notes</label>
                  <input
                    type="text"
                    placeholder="Optional note"
                    value={editingEntry.notes || ""}
                    onChange={(e) => setEditingEntry({ ...editingEntry, notes: e.target.value })}
                    className="w-full bg-black border border-neutral-800 px-3 py-2 text-white font-mono focus:outline-none focus:border-white"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-900">
                  <button
                    type="button"
                    onClick={() => setEditingEntry(null)}
                    className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 font-mono text-xs uppercase cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingEdit}
                    className="px-5 py-2 bg-white hover:bg-neutral-200 text-black font-mono font-bold text-xs uppercase cursor-pointer flex items-center gap-1.5"
                  >
                    <Save className="h-3.5 w-3.5" />
                    <span>{isSavingEdit ? "Saving..." : "Save Changes"}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

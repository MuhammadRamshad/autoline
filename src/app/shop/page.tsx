"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { ChevronDown } from "lucide-react";
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

  const [pricesList, setPricesList] = useState<any[]>([]);
  const [vehicleSearchText, setVehicleSearchText] = useState("");
  const [filteredVehicles, setFilteredVehicles] = useState<IndianVehicleModel[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSubmittedEntry, setLastSubmittedEntry] = useState<any>(null);
  const [recentEntries, setRecentEntries] = useState<any[]>([]);
  const [submitFeedback, setSubmitFeedback] = useState<string | null>(null);

  useEffect(() => {
    fetchTariffs();
    fetchRecentEntries();
  }, []);

  const fetchTariffs = async () => {
    try {
      const res = await fetch("/api/prices");
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
      const res = await fetch("/api/washes?limit=6");
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
      } else {
        alert("Failed to update status: " + (data.error || "Server error"));
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setUpdatingId(null);
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
    setVehicleSearchText(`${v.make} ${v.model}`);
    setShowDropdown(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitFeedback(null);

    if (!vehicleNumber.trim()) {
      alert("Please enter a vehicle number");
      return;
    }
    if (!customerPhone.trim()) {
      alert("Please enter customer phone number");
      return;
    }

    setIsSubmitting(true);
    try {
      const isPending = paymentMode === "Pending";
      const res = await fetch("/api/washes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicleNumber: vehicleNumber.toUpperCase().trim(),
          customerName,
          customerPhone: customerPhone.trim(),
          make: selectedMake,
          model: selectedModel,
          category: selectedCategory,
          serviceType: "Full Wash",
          amount: Number(amount),
          paymentMode,
          paymentStatus: isPending ? "Pending" : "Paid",
          notes,
          status: "Completed"
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setLastSubmittedEntry(data.entry);
        setSubmitFeedback(`Recorded ${data.entry.vehicleNumber} (₹${data.entry.amount} • ${data.entry.paymentMode})`);
        setVehicleNumber("");
        setCustomerPhone("");
        setCustomerName("");
        setVehicleSearchText("");
        setSelectedMake("");
        setSelectedModel("");
        setNotes("");
        fetchRecentEntries();
      } else {
        alert("Failed to submit entry: " + (data.error || "Server error"));
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const paymentOptions = ["UPI / QR", "Cash", "Pending"];

  return (
    <div className="min-h-screen bg-black text-white flex flex-col selection:bg-white selection:text-black">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-10">
        
        {/* Header */}
        <div className="flex items-baseline justify-between border-b border-neutral-900 pb-4 mb-8">
          <h1 className="text-xl font-bold uppercase tracking-tight">Vehicle Entry</h1>
          <span className="text-xs font-mono text-neutral-500 uppercase">Autoline</span>
        </div>

        {submitFeedback && (
          <div className="mb-6 p-3 bg-neutral-900 border border-neutral-700 text-xs font-mono text-white flex items-center justify-between">
            <span>✓ {submitFeedback}</span>
            <button onClick={() => setSubmitFeedback(null)} className="text-neutral-400 hover:text-white cursor-pointer">✕</button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
          
          {/* Main Form */}
          <div className="md:col-span-7">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Registration */}
              <div>
                <label className="block text-xs uppercase font-mono tracking-wider text-neutral-400 mb-2">
                  Vehicle Number *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MH12AB1234"
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
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="9876543210"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full bg-black border border-neutral-800 px-3 py-2.5 text-xs font-mono text-white placeholder:text-neutral-700 focus:outline-none focus:border-white"
                  />
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
                    <span className="text-xs uppercase font-mono tracking-wider text-neutral-400 block">Total Amount</span>
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

          {/* Right column: Recent Entries & Thermal Voucher */}
          <div className="md:col-span-5 space-y-6">
            
            {/* Last entry voucher */}
            {lastSubmittedEntry && (
              <div className="border border-neutral-700 p-5 bg-neutral-950 space-y-3">
                <div className="flex items-center justify-between text-xs font-mono text-neutral-400 uppercase border-b border-neutral-850 pb-2">
                  <span>Entry Saved</span>
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
                  <span className={`text-[10px] font-mono uppercase px-2 py-0.5 font-bold ${
                    lastSubmittedEntry.paymentStatus === "Pending"
                      ? "bg-amber-500/20 text-amber-400 border border-amber-500/50"
                      : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/50"
                  }`}>
                    {lastSubmittedEntry.paymentStatus || "Paid"}
                  </span>
                </div>
                <div className="text-xs text-neutral-400 font-mono">
                  Phone: {lastSubmittedEntry.customerPhone}
                </div>
                {lastSubmittedEntry.paymentStatus === "Pending" && (
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      disabled={updatingId === lastSubmittedEntry._id}
                      onClick={() => markAsSettled(lastSubmittedEntry._id, "Cash")}
                      className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-mono uppercase font-bold transition-colors cursor-pointer"
                    >
                      {updatingId === lastSubmittedEntry._id ? "Updating..." : "✓ Settle as Cash"}
                    </button>
                    <button
                      type="button"
                      disabled={updatingId === lastSubmittedEntry._id}
                      onClick={() => markAsSettled(lastSubmittedEntry._id, "UPI / QR")}
                      className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-mono uppercase font-bold transition-colors cursor-pointer"
                    >
                      {updatingId === lastSubmittedEntry._id ? "Updating..." : "✓ Settle UPI"}
                    </button>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="w-full py-2 bg-neutral-900 hover:bg-neutral-800 text-xs font-mono uppercase tracking-wider text-neutral-300 border border-neutral-700 cursor-pointer"
                >
                  Print Receipt
                </button>
              </div>
            )}

            {/* List */}
            <div>
              <div className="text-xs font-mono uppercase tracking-wider text-neutral-500 mb-3 flex items-center justify-between">
                <span>Recent Wash Entries</span>
                <button onClick={fetchRecentEntries} className="hover:text-white cursor-pointer">Refresh</button>
              </div>
              <div className="divide-y divide-neutral-900 border border-neutral-900">
                {recentEntries.length === 0 ? (
                  <div className="p-4 text-xs font-mono text-neutral-600 text-center">No entries recorded yet</div>
                ) : (
                  recentEntries.map((e) => {
                    const isPending = e.paymentMode === "Pending" || e.paymentStatus === "Pending";
                    return (
                      <div
                        key={e._id}
                        className={`p-3 transition-colors ${
                          isPending ? "bg-amber-950/20 border-l-2 border-l-amber-500" : ""
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-white tracking-wide">{e.vehicleNumber}</span>
                              {isPending ? (
                                <span className="text-[9px] font-mono uppercase bg-amber-500/20 text-amber-300 border border-amber-500/50 px-1.5 py-0.5 rounded font-bold animate-pulse">
                                  ⏳ PENDING
                                </span>
                              ) : (
                                <span className="text-[9px] font-mono uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-1.5 py-0.5 rounded">
                                  PAID
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-neutral-500 mt-0.5">
                              {e.category} {e.customerPhone ? `• ${e.customerPhone}` : ""}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`font-mono font-semibold ${isPending ? "text-amber-400 font-bold" : "text-white"}`}>
                              ₹{e.amount}
                            </div>
                            <div className={`text-[10px] font-mono ${isPending ? "text-amber-400/80 font-bold" : "text-neutral-400"}`}>
                              {e.paymentMode}
                            </div>
                          </div>
                        </div>

                        {/* Settle button directly inside recent entries if pending */}
                        {isPending && (
                          <div className="mt-2 pt-2 border-t border-amber-900/30 flex items-center justify-between gap-2">
                            <span className="text-[10px] font-mono text-amber-400/80">Settle Due:</span>
                            <div className="flex gap-1.5">
                              <button
                                type="button"
                                disabled={updatingId === e._id}
                                onClick={() => markAsSettled(e._id, "Cash")}
                                className="px-2 py-1 bg-amber-500 hover:bg-amber-400 text-black text-[10px] font-mono uppercase font-bold cursor-pointer"
                              >
                                {updatingId === e._id ? "..." : "Cash"}
                              </button>
                              <button
                                type="button"
                                disabled={updatingId === e._id}
                                onClick={() => markAsSettled(e._id, "UPI / QR")}
                                className="px-2 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 text-[10px] font-mono uppercase cursor-pointer"
                              >
                                UPI
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>

        </div>

      </main>
    </div>
  );
}

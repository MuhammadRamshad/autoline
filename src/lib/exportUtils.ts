import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

export function exportToExcel(entries: any[], filename = "Autoline_CarWash_Report.xlsx") {
  const data = entries.map((e, idx) => ({
    "S.No": idx + 1,
    "Date & Time": new Date(e.createdAt).toLocaleString("en-IN"),
    "Vehicle No": e.vehicleNumber,
    "Customer Phone": e.customerPhone,
    "Customer Name": e.customerName || "-",
    "Make": e.make || "-",
    "Model": e.model || "-",
    "Category": e.category,
    "Service": e.serviceType,
    "Amount (INR)": e.amount,
    "Payment Mode": e.paymentMode,
    "Payment Status": e.paymentStatus || "Paid",
    "Status": e.status,
    "RTO Office": e.parivahanDetails?.rtoOffice || "-",
    "Fuel Type": e.parivahanDetails?.fuelType || "-",
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Wash Records");
  XLSX.writeFile(workbook, filename);
}

export function exportToPDF(entries: any[], title = "Autoline Car Wash - Revenue Report", subtitle = "") {
  const doc = new jsPDF("landscape");

  // Header Title
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, 297, 24, "F");
  
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text("AUTOLINE CAR WASH & DETAILING CENTER", 14, 12);

  doc.setFontSize(10);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text(`Official Executive Statement • Generated: ${new Date().toLocaleString("en-IN")}`, 14, 18);

  // Subtitle / Filters
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text(title + (subtitle ? ` (${subtitle})` : ""), 14, 32);

  // Stats calculation
  const totalAmount = entries.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const upiTotal = entries.filter(e => e.paymentMode?.includes("UPI")).reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const cashTotal = entries.filter(e => e.paymentMode === "Cash").reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const pendingTotal = entries.filter(e => e.paymentStatus === "Pending").reduce((acc, curr) => acc + (curr.amount || 0), 0);

  doc.setFontSize(10);
  doc.setTextColor(51, 65, 85);
  doc.text(`Total Vehicles: ${entries.length}  |  Total: Rs. ${totalAmount.toLocaleString("en-IN")}  |  UPI: Rs. ${upiTotal.toLocaleString("en-IN")}  |  Cash: Rs. ${cashTotal.toLocaleString("en-IN")}  |  Pending: Rs. ${pendingTotal.toLocaleString("en-IN")}`, 14, 38);

  const tableBody = entries.map((e, idx) => [
    idx + 1,
    new Date(e.createdAt).toLocaleDateString("en-IN") + " " + new Date(e.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
    e.vehicleNumber,
    `${e.make || ""} ${e.model || ""}`.trim() || "-",
    e.category,
    e.customerPhone,
    `Rs. ${e.amount}`,
    e.paymentMode,
    e.paymentStatus || "Paid"
  ]);

  autoTable(doc, {
    startY: 42,
    head: [["#", "Date Time", "Vehicle No", "Vehicle", "Category", "Phone", "Amount", "Mode", "Payment Status"]],
    body: tableBody,
    theme: "striped",
    headStyles: {
      fillColor: [30, 58, 138], // Indigo 900
      textColor: 255,
      fontStyle: "bold"
    },
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    }
  });

  doc.save(`${title.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`);
}

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

export function exportToExcel(entries: any[], filename = "Autoline_CarWash_Report.xlsx") {
  const totalAmount = entries.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const upiTotal = entries.filter(e => e.paymentMode?.includes("UPI")).reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const cashTotal = entries.filter(e => e.paymentMode === "Cash").reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const pendingTotal = entries.filter(e => e.paymentMode === "Pending" || e.paymentStatus === "Pending").reduce((acc, curr) => acc + (curr.amount || 0), 0);

  const data: any[] = entries.map((e, idx) => ({
    "S.No": idx + 1,
    "Date & Time": new Date(e.createdAt).toLocaleString("en-IN"),
    "Vehicle No": e.vehicleNumber,
    "Customer Phone": e.customerPhone,
    "Customer Name": e.customerName || "-",
    "Make": e.make || "-",
    "Model": e.model || "-",
    "Category": e.category,
    "Service": e.serviceType || "Full Wash",
    "Amount (INR)": e.amount,
    "Payment Mode": e.paymentMode,
    "Payment Status": (e.paymentMode === "Pending" || e.paymentStatus === "Pending") ? "Pending" : "Paid",
    "Notes": e.notes || "-",
  }));

  // Append Grand Total Row at bottom
  data.push({
    "S.No": "TOTAL",
    "Date & Time": `Total Count: ${entries.length}`,
    "Vehicle No": "",
    "Customer Phone": "",
    "Customer Name": "",
    "Make": "",
    "Model": "",
    "Category": "",
    "Service": "GRAND TOTAL",
    "Amount (INR)": totalAmount,
    "Payment Mode": `Cash: ${cashTotal} | UPI: ${upiTotal}`,
    "Payment Status": `Pending: ${pendingTotal}`,
    "Notes": `Paid: ${totalAmount - pendingTotal}`,
  });

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
  const pendingTotal = entries.filter(e => e.paymentMode === "Pending" || e.paymentStatus === "Pending").reduce((acc, curr) => acc + (curr.amount || 0), 0);

  doc.setFontSize(10);
  doc.setTextColor(51, 65, 85);
  doc.text(`Total Records: ${entries.length}  |  Total: Rs. ${totalAmount.toLocaleString("en-IN")}  |  UPI: Rs. ${upiTotal.toLocaleString("en-IN")}  |  Cash: Rs. ${cashTotal.toLocaleString("en-IN")}  |  Pending Dues: Rs. ${pendingTotal.toLocaleString("en-IN")}`, 14, 38);

  const tableBody = entries.map((e, idx) => {
    const isPending = e.paymentMode === "Pending" || e.paymentStatus === "Pending";
    return [
      idx + 1,
      new Date(e.createdAt).toLocaleDateString("en-IN") + " " + new Date(e.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
      e.vehicleNumber,
      `${e.make || ""} ${e.model || ""}`.trim() || "-",
      e.category,
      e.customerName || "-",
      e.customerPhone,
      `Rs. ${e.amount}`,
      e.paymentMode,
      isPending ? "PENDING" : "PAID"
    ];
  });

  // Dedicated Grand Total Footer Row
  const tableFoot = [
    [
      "TOTAL",
      `${entries.length} vehicles`,
      "",
      "",
      "",
      "",
      "GRAND TOTAL",
      `Rs. ${totalAmount.toLocaleString("en-IN")}`,
      `Cash: ${cashTotal} | UPI: ${upiTotal}`,
      `Due: Rs. ${pendingTotal.toLocaleString("en-IN")}`
    ]
  ];

  autoTable(doc, {
    startY: 42,
    head: [["#", "Date Time", "Vehicle No", "Vehicle", "Category", "Customer", "Phone", "Amount", "Mode", "Status"]],
    body: tableBody,
    foot: tableFoot,
    theme: "striped",
    headStyles: {
      fillColor: [30, 58, 138], // Indigo 900
      textColor: 255,
      fontStyle: "bold"
    },
    footStyles: {
      fillColor: [15, 23, 42], // Slate 900
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 9
    },
    styles: {
      fontSize: 8.5,
      cellPadding: 3,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    }
  });

  doc.save(`${title.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`);
}

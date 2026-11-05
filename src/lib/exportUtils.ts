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
  // A4 Landscape orientation: 297mm x 210mm
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4"
  });

  const pageWidth = 297;
  const pageHeight = 210;

  // 1. Sleek Modern Header Bar
  doc.setFillColor(10, 10, 10); // Deep Black
  doc.rect(0, 0, pageWidth, 26, "F");

  // Accent Line under header
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 26, pageWidth, 0.8, "F");

  // Brand Name
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text("AUTOLINE", 14, 12);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(163, 163, 163); // neutral-400
  doc.text("VEHICLE DETAILING & WASH SERVICE MANAGEMENT SYSTEM", 14, 18);

  // Right-aligned report timestamp & info
  const dateStr = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
  const timeStr = new Date().toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  });
  doc.setFontSize(8);
  doc.text(`REPORT GENERATED: ${dateStr.toUpperCase()} • ${timeStr}`, pageWidth - 14, 12, { align: "right" });
  doc.text("CONFIDENTIAL EXECUTIVE SUMMARY", pageWidth - 14, 18, { align: "right" });

  // 2. Report Title & Scope Subtitle
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(17, 24, 39); // Gray 900
  doc.text(title.toUpperCase(), 14, 36);

  if (subtitle) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139); // Slate 500
    doc.text(`Filter Parameters: ${subtitle}`, 14, 42);
  }

  // 3. Financial Aggregate Metrics Cards
  const totalAmount = entries.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const upiTotal = entries.filter(e => e.paymentMode?.includes("UPI")).reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const cashTotal = entries.filter(e => e.paymentMode === "Cash").reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const pendingTotal = entries.filter(e => e.paymentMode === "Pending" || e.paymentStatus === "Pending").reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const paidTotal = totalAmount - pendingTotal;

  const cardY = subtitle ? 46 : 41;
  const cardHeight = 15;
  const gap = 3.5;
  const totalCards = 5;
  const startX = 14;
  const availableWidth = pageWidth - 28;
  const cardWidth = (availableWidth - (gap * (totalCards - 1))) / totalCards;

  const cardsData = [
    { label: "TOTAL VEHICLES", value: `${entries.length}`, highlight: false },
    { label: "GROSS REVENUE", value: `Rs. ${totalAmount.toLocaleString("en-IN")}`, highlight: true },
    { label: "COLLECTED CASH", value: `Rs. ${cashTotal.toLocaleString("en-IN")}`, highlight: false },
    { label: "COLLECTED UPI", value: `Rs. ${upiTotal.toLocaleString("en-IN")}`, highlight: false },
    { label: "PENDING DUES", value: `Rs. ${pendingTotal.toLocaleString("en-IN")}`, highlight: pendingTotal > 0, alert: pendingTotal > 0 },
  ];

  cardsData.forEach((card, idx) => {
    const x = startX + idx * (cardWidth + gap);

    // Card background
    if (card.alert) {
      doc.setFillColor(254, 242, 242); // Rose 50
      doc.setDrawColor(244, 63, 94); // Rose 500
    } else if (card.highlight) {
      doc.setFillColor(241, 245, 249); // Slate 100
      doc.setDrawColor(15, 23, 42); // Slate 900
    } else {
      doc.setFillColor(248, 250, 252); // Slate 50
      doc.setDrawColor(226, 232, 240); // Slate 200
    }

    doc.roundedRect(x, cardY, cardWidth, cardHeight, 1.5, 1.5, "FD");

    // Card Label
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.setTextColor(card.alert ? 190 : 100, card.alert ? 18 : 116, card.alert ? 60 : 139);
    doc.text(card.label, x + 3.5, cardY + 5);

    // Card Value
    doc.setFontSize(10);
    doc.setTextColor(card.alert ? 190 : 15, card.alert ? 24 : 23, card.alert ? 24 : 42);
    doc.text(card.value, x + 3.5, cardY + 11.5);
  });

  // 4. Data Table Rows
  const tableBody = entries.map((e, idx) => {
    const isPending = e.paymentMode === "Pending" || e.paymentStatus === "Pending";
    const d = new Date(e.createdAt);
    const dateFormatted = d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "2-digit" });
    const timeFormatted = d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
    const vehicleModel = [e.make, e.model].filter(Boolean).join(" ") || "-";

    return [
      idx + 1,
      `${dateFormatted}\n${timeFormatted}`,
      e.vehicleNumber,
      vehicleModel,
      e.category,
      e.customerName || "-",
      e.customerPhone,
      `Rs. ${e.amount.toLocaleString("en-IN")}`,
      e.paymentMode,
      isPending ? "PENDING" : "PAID"
    ];
  });

  // Dedicated Grand Total Footer
  const tableFoot = [
    [
      "",
      `Total: ${entries.length}`,
      "",
      "",
      "",
      "GRAND TOTAL",
      `Paid: Rs. ${paidTotal.toLocaleString("en-IN")}`,
      `Rs. ${totalAmount.toLocaleString("en-IN")}`,
      `Cash: ${cashTotal} | UPI: ${upiTotal}`,
      pendingTotal > 0 ? `Due: Rs. ${pendingTotal.toLocaleString("en-IN")}` : "CLEARED"
    ]
  ];

  autoTable(doc, {
    startY: cardY + cardHeight + 4.5,
    head: [["#", "DATE & TIME", "VEHICLE NO", "MODEL", "CATEGORY", "CUSTOMER", "PHONE", "AMOUNT", "MODE", "STATUS"]],
    body: tableBody,
    foot: tableFoot,
    theme: "plain",
    tableWidth: availableWidth,
    margin: { left: 14, right: 14 },
    headStyles: {
      fillColor: [17, 24, 39], // Black/Gray 900
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 7.5,
      cellPadding: { top: 3, bottom: 3, left: 2.5, right: 2.5 },
      halign: "left"
    },
    bodyStyles: {
      fontSize: 8,
      cellPadding: { top: 2.5, bottom: 2.5, left: 2.5, right: 2.5 },
      textColor: [30, 41, 59], // Slate 800
      lineColor: [226, 232, 240], // Slate 200
      lineWidth: 0.2
    },
    columnStyles: {
      0: { cellWidth: 10, halign: "center" },
      1: { cellWidth: 26 },
      2: { cellWidth: 30, fontStyle: "bold" },
      3: { cellWidth: 38 },
      4: { cellWidth: 38 },
      5: { cellWidth: 30 },
      6: { cellWidth: 28 },
      7: { cellWidth: 22, halign: "right", fontStyle: "bold" },
      8: { cellWidth: 24, halign: "center" },
      9: { cellWidth: 23, halign: "center", fontStyle: "bold" }
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252] // Slate 50
    },
    footStyles: {
      fillColor: [15, 23, 42], // Slate 900
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8,
      cellPadding: { top: 3.5, bottom: 3.5, left: 2.5, right: 2.5 }
    },
    didDrawCell: (data) => {
      // Custom colored status pill in table
      if (data.section === "body" && data.column.index === 9) {
        const text = data.cell.raw as string;
        const isPending = text === "PENDING";
        
        doc.setFontSize(6.5);
        doc.setFont("helvetica", "bold");
        
        const cellX = data.cell.x + 2;
        const cellY = data.cell.y + (data.cell.height / 2) - 3;
        const width = data.cell.width - 4;
        const height = 6;
        
        if (isPending) {
          doc.setFillColor(254, 242, 242);
          doc.setDrawColor(244, 63, 94);
          doc.roundedRect(cellX, cellY, width, height, 1, 1, "FD");
          doc.setTextColor(225, 29, 72);
          doc.text("PENDING", cellX + (width / 2), cellY + 4.2, { align: "center" });
        } else {
          doc.setFillColor(240, 253, 244);
          doc.setDrawColor(34, 197, 94);
          doc.roundedRect(cellX, cellY, width, height, 1, 1, "FD");
          doc.setTextColor(22, 101, 52);
          doc.text("PAID", cellX + (width / 2), cellY + 4.2, { align: "center" });
        }
      }
    },
    didDrawPage: (data) => {
      // Clean footer on every page
      const pageStr = `Page ${data.pageNumber} of ${doc.getNumberOfPages()}`;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text("AUTOLINE CAR WASH • SYSTEM AUDIT REPORT", 14, pageHeight - 6);
      doc.text(pageStr, pageWidth - 14, pageHeight - 6, { align: "right" });
    }
  });

  doc.save(`${title.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`);
}

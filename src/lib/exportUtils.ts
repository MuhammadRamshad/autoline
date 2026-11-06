import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

export function exportToExcel(entries: any[], filename = "Autoline_CarWash_Report.xlsx", expenses: any[] = []) {
  const washRows: any[] = entries.map((e, idx) => ({
    "S.No": idx + 1,
    "Date & Time": new Date(e.createdAt).toLocaleString("en-IN"),
    "Vehicle No": e.vehicleNumber || "-",
    "Customer Phone": e.customerPhone || "-",
    "Customer Name": e.customerName || "-",
    "Make": e.make || "-",
    "Model": e.model || "-",
    "Category": e.category || "-",
    "Service": e.serviceType || "Full Wash",
    "Amount (INR)": e.amount || 0,
    "Payment Mode": e.paymentMode || "-",
    "Payment Status": (e.paymentMode === "Pending" || e.paymentStatus === "Pending") ? "Pending" : "Paid",
    "Notes": e.notes || "-",
  }));

  const workbook = XLSX.utils.book_new();
  const washSheet = XLSX.utils.json_to_sheet(washRows);
  XLSX.utils.book_append_sheet(workbook, washSheet, "Vehicle Washes");

  if (expenses.length > 0) {
    const expenseRows: any[] = expenses.map((exp, idx) => ({
      "S.No": idx + 1,
      "Date & Time": new Date(exp.createdAt).toLocaleString("en-IN"),
      "Expense Title": exp.title || "-",
      "Category": exp.category || "-",
      "Amount (INR)": exp.amount || 0,
      "Payment Mode": exp.paymentMode || "-",
      "Paid By": exp.paidBy || "-",
      "Notes": exp.notes || "-",
    }));

    const expenseSheet = XLSX.utils.json_to_sheet(expenseRows);
    XLSX.utils.book_append_sheet(workbook, expenseSheet, "Shop Expenses");
  }

  XLSX.writeFile(workbook, filename);
}

/**
 * High-contrast, clean Black & White report optimized for physical B&W and laser printing.
 * Total row is placed directly beneath the Amount column.
 * Output filename automatically includes the formatted date.
 */
export function exportToPDF(
  entries: any[], 
  title = "Autoline Car Wash Report", 
  subtitle = "",
  expenses: any[] = []
) {
  // Standard A4 Portrait orientation: 210mm x 297mm (Standard Indian office & printer paper format)
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const marginX = 10;
  const availableWidth = pageWidth - (marginX * 2); // 190mm

  // Today's date in Indian Standard Time YYYY-MM-DD
  const now = new Date();
  const dateFormatted = now.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
  const fileDateStr = now.toISOString().slice(0, 10); // YYYY-MM-DD

  // 1. Clean B&W Header (White background, crisp black lines & text)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text("AUTOLINE CAR WASH", marginX, 14);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(60, 60, 60);
  doc.text("VEHICLE DETAILING & WASH SERVICE STATEMENT", marginX, 18.5);

  // Right Header: Date & Document info
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(0, 0, 0);
  doc.text(`DATE: ${dateFormatted.toUpperCase()}`, pageWidth - marginX, 14, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(80, 80, 80);
  doc.text(`PRINTED: ${now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })}`, pageWidth - marginX, 18.5, { align: "right" });

  // Crisp divider rule
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.6);
  doc.line(marginX, 21, pageWidth - marginX, 21);

  // 2. High-Contrast Summary Dashboard (Black & White Print Ready)
  // Metrics: TOTAL VEHICLES, REVENUE, EXPENSES, NET PROFIT, CASH / UPI, PENDING DUES
  let totalVehicles = entries.length;
  let revenue = 0; // Collected revenue (paid washes)
  let pendingDues = 0; // Uncollected / pending dues
  let pendingVehiclesCount = 0;
  let cashAmount = 0;
  let upiAmount = 0;

  entries.forEach((e) => {
    const amt = Number(e.amount) || 0;
    const isPending = e.paymentMode === "Pending" || e.paymentStatus === "Pending";
    if (isPending) {
      pendingDues += amt;
      pendingVehiclesCount += 1;
    } else {
      revenue += amt;
      const mode = (e.paymentMode || "").toLowerCase();
      if (mode.includes("cash")) {
        cashAmount += amt;
      } else {
        upiAmount += amt;
      }
    }
  });

  const totalExpenseAmount = expenses.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  const netProfit = revenue - totalExpenseAmount;
  const totalWashAmount = entries.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

  const boxY = 25;
  const cardHeight = 13;
  const numCards = 6;
  const cardSpacing = 2;
  const totalSpacing = cardSpacing * (numCards - 1);
  const cardWidth = (availableWidth - totalSpacing) / numCards; // ~30mm each

  const summaryCards = [
    { label: "TOTAL VEHICLES", value: `${totalVehicles}` },
    { label: "REVENUE", value: `Rs. ${revenue.toLocaleString("en-IN")}` },
    { label: "EXPENSES", value: `Rs. ${totalExpenseAmount.toLocaleString("en-IN")}` },
    { label: "NET PROFIT", value: `Rs. ${netProfit.toLocaleString("en-IN")}` },
    { label: "CASH / UPI", value: `C:${cashAmount} | U:${upiAmount}` },
    { label: "PENDING DUES", value: `Rs. ${pendingDues.toLocaleString("en-IN")}` }
  ];

  summaryCards.forEach((card, idx) => {
    const x = marginX + (idx * (cardWidth + cardSpacing));
    
    // Crisp bordered box for B&W print
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.35);
    doc.setFillColor(250, 250, 250);
    doc.rect(x, boxY, cardWidth, cardHeight, "FD");

    // Top small label
    doc.setFont("helvetica", "bold");
    doc.setFontSize(5.5);
    doc.setTextColor(60, 60, 60);
    doc.text(card.label, x + (cardWidth / 2), boxY + 4.2, { align: "center" });

    // Main value
    doc.setFont("helvetica", "bold");
    doc.setFontSize(idx === 4 ? 6.5 : 8);
    doc.setTextColor(0, 0, 0);
    doc.text(card.value, x + (cardWidth / 2), boxY + 10, { align: "center" });
  });

  // 4. Vehicle Washes Table
  const tableBody = entries.map((e, idx) => {
    const isPending = e.paymentMode === "Pending" || e.paymentStatus === "Pending";
    const d = new Date(e.createdAt);
    const dateStr = d.toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "2-digit" });
    const timeStr = d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
    const vehicleModel = [e.make, e.model].filter(Boolean).join(" ") || "-";

    return [
      idx + 1,
      `${dateStr} ${timeStr}`,
      e.vehicleNumber || "-",
      vehicleModel,
      e.category || "-",
      e.customerPhone || "-",
      `Rs. ${(Number(e.amount) || 0).toLocaleString("en-IN")}`,
      e.paymentMode || "-",
      isPending ? "PENDING" : "PAID"
    ];
  });

  autoTable(doc, {
    startY: boxY + cardHeight + 4,
    head: [["#", "DATE & TIME", "VEHICLE NO", "MODEL", "CATEGORY", "PHONE", "AMOUNT", "MODE", "STATUS"]],
    body: tableBody,
    foot: [
      [
        { content: "TOTAL", colSpan: 6, styles: { halign: "right", fontStyle: "bold", fontSize: 8.5 } },
        { content: `Rs. ${totalWashAmount.toLocaleString("en-IN")}`, styles: { halign: "right", fontStyle: "bold", fontSize: 8.5 } },
        { content: "", colSpan: 2 }
      ]
    ],
    theme: "plain",
    tableWidth: availableWidth,
    margin: { left: marginX, right: marginX },
    headStyles: {
      fillColor: [240, 240, 240], // Light gray for crisp B&W printing
      textColor: [0, 0, 0],
      fontStyle: "bold",
      fontSize: 7.5,
      cellPadding: { top: 2.5, bottom: 2.5, left: 1.5, right: 1.5 },
      lineWidth: 0.3,
      lineColor: [0, 0, 0]
    },
    bodyStyles: {
      fontSize: 7.5,
      cellPadding: { top: 2, bottom: 2, left: 1.5, right: 1.5 },
      textColor: [0, 0, 0],
      lineColor: [180, 180, 180],
      lineWidth: 0.2
    },
    alternateRowStyles: {
      fillColor: [255, 255, 255]
    },
    columnStyles: {
      0: { cellWidth: 8, halign: "center" },
      1: { cellWidth: 26 },
      2: { cellWidth: 27, fontStyle: "bold" },
      3: { cellWidth: 32 },
      4: { cellWidth: 32 },
      5: { cellWidth: 21, halign: "center" },
      6: { cellWidth: 20, halign: "right", fontStyle: "bold" }, // Amount Column
      7: { cellWidth: 12, halign: "center" },
      8: { cellWidth: 12, halign: "center" }
    },
    footStyles: {
      fillColor: [240, 240, 240],
      textColor: [0, 0, 0],
      fontStyle: "bold",
      fontSize: 8.5,
      cellPadding: { top: 2.5, bottom: 2.5, left: 1.5, right: 1.5 },
      lineWidth: 0.35,
      lineColor: [0, 0, 0]
    }
  });

  // 5. If expenses exist, append dedicated Shop Expenses Table in report
  if (expenses && expenses.length > 0) {
    const lastY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY : boxY + cardHeight + 20;

    // Check if table needs a page break
    if (lastY > pageHeight - 50) {
      doc.addPage();
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(0, 0, 0);
      doc.text("SHOP EXPENSES & OUTFLOWS", marginX, 14);
    } else {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(0, 0, 0);
      doc.text("SHOP EXPENSES & OUTFLOWS", marginX, lastY + 8);
    }

    const expStart = lastY > pageHeight - 50 ? 18 : lastY + 11;

    const expenseTableBody = expenses.map((exp, idx) => {
      const d = new Date(exp.createdAt);
      const dateStr = d.toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "2-digit" });
      const timeStr = d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });

      return [
        idx + 1,
        `${dateStr} ${timeStr}`,
        exp.title || "-",
        exp.category || "-",
        exp.paidBy || "-",
        exp.paymentMode || "Cash",
        `Rs. ${(Number(exp.amount) || 0).toLocaleString("en-IN")}`
      ];
    });

    autoTable(doc, {
      startY: expStart,
      head: [["#", "DATE & TIME", "EXPENSE TITLE", "CATEGORY", "PAID BY", "MODE", "AMOUNT"]],
      body: expenseTableBody,
      foot: [
        [
          { content: "TOTAL", colSpan: 6, styles: { halign: "right", fontStyle: "bold", fontSize: 8.5 } },
          { content: `Rs. ${totalExpenseAmount.toLocaleString("en-IN")}`, styles: { halign: "right", fontStyle: "bold", fontSize: 8.5 } }
        ]
      ],
      theme: "plain",
      tableWidth: availableWidth,
      margin: { left: marginX, right: marginX },
      headStyles: {
        fillColor: [240, 240, 240],
        textColor: [0, 0, 0],
        fontStyle: "bold",
        fontSize: 7.5,
        cellPadding: { top: 2.5, bottom: 2.5, left: 1.5, right: 1.5 },
        lineWidth: 0.3,
        lineColor: [0, 0, 0]
      },
      bodyStyles: {
        fontSize: 7.5,
        cellPadding: { top: 2, bottom: 2, left: 1.5, right: 1.5 },
        textColor: [0, 0, 0],
        lineColor: [180, 180, 180],
        lineWidth: 0.2
      },
      alternateRowStyles: {
        fillColor: [255, 255, 255]
      },
      footStyles: {
        fillColor: [240, 240, 240],
        textColor: [0, 0, 0],
        fontStyle: "bold",
        fontSize: 8.5,
        cellPadding: { top: 2.5, bottom: 2.5, left: 1.5, right: 1.5 },
        lineWidth: 0.35,
        lineColor: [0, 0, 0]
      },
      columnStyles: {
        0: { cellWidth: 8, halign: "center" },
        1: { cellWidth: 28 },
        2: { cellWidth: 50, fontStyle: "bold" },
        3: { cellWidth: 35 },
        4: { cellWidth: 27 },
        5: { cellWidth: 18, halign: "center" },
        6: { cellWidth: 24, halign: "right", fontStyle: "bold" } // Amount Column
      }
    });
  }

  // Final Footer on all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.3);
    doc.line(marginX, pageHeight - 8, pageWidth - marginX, pageHeight - 8);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(50, 50, 50);
    doc.text("AUTOLINE CAR WASH • OFFICIAL RECORD", marginX, pageHeight - 4.5);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - marginX, pageHeight - 4.5, { align: "right" });
  }

  // Save with filename containing the date
  const cleanTitle = title.replace(/[^a-zA-Z0-9]/g, "_");
  const filename = `${cleanTitle}_${fileDateStr}.pdf`;
  doc.save(filename);
}

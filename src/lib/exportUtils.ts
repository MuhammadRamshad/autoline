import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

export function exportToExcel(entries: any[], filename = "Autoline_CarWash_Report.xlsx", expenses: any[] = []) {
  const washRows: any[] = entries.map((e, idx) => ({
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

  const workbook = XLSX.utils.book_new();
  const washSheet = XLSX.utils.json_to_sheet(washRows);
  XLSX.utils.book_append_sheet(workbook, washSheet, "Vehicle Washes");

  if (expenses.length > 0) {
    const expenseRows: any[] = expenses.map((exp, idx) => ({
      "S.No": idx + 1,
      "Date & Time": new Date(exp.createdAt).toLocaleString("en-IN"),
      "Expense Title": exp.title,
      "Category": exp.category,
      "Amount (INR)": exp.amount,
      "Payment Mode": exp.paymentMode,
      "Paid By": exp.paidBy || "-",
      "Notes": exp.notes || "-",
    }));

    const expenseSheet = XLSX.utils.json_to_sheet(expenseRows);
    XLSX.utils.book_append_sheet(workbook, expenseSheet, "Shop Expenses");
  }

  XLSX.writeFile(workbook, filename);
}

export function exportToPDF(
  entries: any[], 
  title = "Autoline Car Wash - Revenue Report", 
  subtitle = "",
  expenses: any[] = []
) {
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

  // 3. Financial Aggregate Metrics Cards (Income, Expenses, Net Profit, Dues)
  const totalWashAmount = entries.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const upiWash = entries.filter(e => e.paymentMode?.includes("UPI")).reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const cashWash = entries.filter(e => e.paymentMode === "Cash").reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const pendingWash = entries.filter(e => e.paymentMode === "Pending" || e.paymentStatus === "Pending").reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const totalExpenseAmount = expenses.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const netProfit = totalWashAmount - totalExpenseAmount;

  const cardY = subtitle ? 46 : 41;
  const cardHeight = 15;
  const gap = 3;
  const totalCards = 6;
  const startX = 14;
  const availableWidth = pageWidth - 28;
  const cardWidth = (availableWidth - (gap * (totalCards - 1))) / totalCards;

  const cardsData = [
    { label: "TOTAL VEHICLES", value: `${entries.length}`, highlight: false },
    { label: "GROSS INFLOW", value: `Rs. ${totalWashAmount.toLocaleString("en-IN")}`, highlight: true },
    { label: "SHOP EXPENSES", value: `Rs. ${totalExpenseAmount.toLocaleString("en-IN")}`, isExpense: true },
    { label: "NET PROFIT", value: `Rs. ${netProfit.toLocaleString("en-IN")}`, isNet: true },
    { label: "CASH / UPI", value: `${cashWash} / ${upiWash}`, highlight: false },
    { label: "PENDING DUES", value: `Rs. ${pendingWash.toLocaleString("en-IN")}`, alert: pendingWash > 0 },
  ];

  cardsData.forEach((card, idx) => {
    const x = startX + idx * (cardWidth + gap);

    if (card.alert) {
      doc.setFillColor(254, 242, 242); // Rose 50
      doc.setDrawColor(244, 63, 94); // Rose 500
    } else if (card.isExpense) {
      doc.setFillColor(255, 251, 235); // Amber 50
      doc.setDrawColor(245, 158, 11); // Amber 500
    } else if (card.isNet) {
      doc.setFillColor(240, 253, 244); // Green 50
      doc.setDrawColor(34, 197, 94); // Green 500
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
    doc.setFontSize(6);
    if (card.alert) doc.setTextColor(190, 18, 60);
    else if (card.isExpense) doc.setTextColor(180, 83, 9);
    else if (card.isNet) doc.setTextColor(21, 128, 61);
    else doc.setTextColor(100, 116, 139);

    doc.text(card.label, x + 3, cardY + 4.8);

    // Card Value
    doc.setFontSize(9);
    if (card.alert) doc.setTextColor(190, 24, 24);
    else if (card.isExpense) doc.setTextColor(180, 83, 9);
    else if (card.isNet) doc.setTextColor(21, 128, 61);
    else doc.setTextColor(15, 23, 42);

    doc.text(card.value, x + 3, cardY + 11.2);
  });

  // 4. Vehicle Washes Table
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

  autoTable(doc, {
    startY: cardY + cardHeight + 4.5,
    head: [["#", "DATE & TIME", "VEHICLE NO", "MODEL", "CATEGORY", "CUSTOMER", "PHONE", "AMOUNT", "MODE", "STATUS"]],
    body: tableBody,
    foot: [
      [
        { content: "TOTAL", colSpan: 7, styles: { halign: "right", fontStyle: "bold" } },
        { content: `Rs. ${totalWashAmount.toLocaleString("en-IN")}`, styles: { halign: "right", fontStyle: "bold" } },
        { content: "", colSpan: 2 }
      ]
    ],
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
      fontSize: 8.5,
      cellPadding: { top: 3, bottom: 3, left: 2.5, right: 2.5 }
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
  });

  // 5. If expenses exist, append dedicated Shop Expenses Table in report
  if (expenses && expenses.length > 0) {
    const lastY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY : cardY + cardHeight + 20;

    // Check if table needs a page break
    if (lastY > pageHeight - 60) {
      doc.addPage();
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(180, 83, 9); // Amber 700
      doc.text("SHOP EXPENSES & OPERATIONAL OUTFLOWS", 14, 20);
    } else {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(180, 83, 9);
      doc.text("SHOP EXPENSES & OPERATIONAL OUTFLOWS", 14, lastY + 10);
    }

    const expStart = lastY > pageHeight - 60 ? 25 : lastY + 13;

    const expenseTableBody = expenses.map((exp, idx) => {
      const d = new Date(exp.createdAt);
      const dateFormatted = d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "2-digit" });
      const timeFormatted = d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });

      return [
        idx + 1,
        `${dateFormatted} ${timeFormatted}`,
        exp.title,
        exp.category,
        exp.paidBy || "-",
        exp.paymentMode || "Cash",
        `Rs. ${exp.amount.toLocaleString("en-IN")}`
      ];
    });

    autoTable(doc, {
      startY: expStart,
      head: [["#", "DATE & TIME", "EXPENSE TITLE", "CATEGORY", "PAID BY", "MODE", "AMOUNT"]],
      body: expenseTableBody,
      foot: [
        [
          { content: "TOTAL", colSpan: 6, styles: { halign: "right", fontStyle: "bold" } },
          { content: `Rs. ${totalExpenseAmount.toLocaleString("en-IN")}`, styles: { halign: "right", fontStyle: "bold" } }
        ]
      ],
      theme: "plain",
      tableWidth: availableWidth,
      margin: { left: 14, right: 14 },
      headStyles: {
        fillColor: [180, 83, 9], // Amber 700
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 7.5,
        cellPadding: { top: 3, bottom: 3, left: 2.5, right: 2.5 },
      },
      bodyStyles: {
        fontSize: 8,
        cellPadding: { top: 2.5, bottom: 2.5, left: 2.5, right: 2.5 },
        textColor: [69, 26, 3], // Amber 950
        lineColor: [254, 215, 170], // Orange 200
        lineWidth: 0.2
      },
      alternateRowStyles: {
        fillColor: [255, 251, 235] // Amber 50
      },
      footStyles: {
        fillColor: [120, 53, 15], // Amber 900
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 8,
        cellPadding: { top: 3, bottom: 3, left: 2.5, right: 2.5 }
      },
      columnStyles: {
        0: { cellWidth: 10, halign: "center" },
        1: { cellWidth: 35 },
        2: { cellWidth: 65, fontStyle: "bold" },
        3: { cellWidth: 45 },
        4: { cellWidth: 40 },
        5: { cellWidth: 30, halign: "center" },
        6: { cellWidth: 44, halign: "right", fontStyle: "bold" }
      }
    });
  }

  // Final Footer on all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text("AUTOLINE CAR WASH • SYSTEM AUDIT REPORT", 14, pageHeight - 6);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - 14, pageHeight - 6, { align: "right" });
  }

  doc.save(`${title.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`);
}

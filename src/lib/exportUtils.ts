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
  // A4 Landscape orientation: 297mm x 210mm
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4"
  });

  const pageWidth = 297;
  const pageHeight = 210;
  const marginX = 14;
  const availableWidth = pageWidth - (marginX * 2);

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
  doc.setFontSize(18);
  doc.setTextColor(0, 0, 0);
  doc.text("AUTOLINE CAR WASH", marginX, 15);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);
  doc.text("VEHICLE DETAILING & WASH SERVICE STATEMENT", marginX, 20);

  // Right Header: Date & Document info
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  doc.text(`DATE: ${dateFormatted.toUpperCase()}`, pageWidth - marginX, 15, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(80, 80, 80);
  doc.text(`PRINTED: ${now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })}`, pageWidth - marginX, 20, { align: "right" });

  // Crisp divider rule
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.8);
  doc.line(marginX, 23, pageWidth - marginX, 23);

  // 2. Report Subtitle / Scope
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.text(title.toUpperCase(), marginX, 30);

  if (subtitle) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(70, 70, 70);
    doc.text(`Scope: ${subtitle}`, marginX, 35);
  }

  // 3. Compact Key Summary Box (High-contrast B&W bordered boxes)
  const totalWashAmount = entries.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  const totalExpenseAmount = expenses.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  const netBalance = totalWashAmount - totalExpenseAmount;

  const boxY = subtitle ? 39 : 35;
  const boxHeight = 12;

  // Single clean summary row
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.4);
  doc.setFillColor(250, 250, 250);
  doc.rect(marginX, boxY, availableWidth, boxHeight, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);

  const colW = availableWidth / 4;
  doc.text(`TOTAL WASHES: ${entries.length}`, marginX + 6, boxY + 7.5);
  doc.text(`WASH REVENUE: Rs. ${totalWashAmount.toLocaleString("en-IN")}`, marginX + colW + 6, boxY + 7.5);
  doc.text(`EXPENSES: Rs. ${totalExpenseAmount.toLocaleString("en-IN")}`, marginX + (colW * 2) + 6, boxY + 7.5);
  doc.text(`NET BALANCE: Rs. ${netBalance.toLocaleString("en-IN")}`, marginX + (colW * 3) + 6, boxY + 7.5);

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
    startY: boxY + boxHeight + 4,
    head: [["#", "DATE & TIME", "VEHICLE NO", "MODEL", "CATEGORY", "PHONE", "AMOUNT", "MODE", "STATUS"]],
    body: tableBody,
    foot: [
      [
        { content: "TOTAL", colSpan: 6, styles: { halign: "right", fontStyle: "bold", fontSize: 9 } },
        { content: `Rs. ${totalWashAmount.toLocaleString("en-IN")}`, styles: { halign: "right", fontStyle: "bold", fontSize: 9 } },
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
      fontSize: 8,
      cellPadding: { top: 3, bottom: 3, left: 2, right: 2 },
      lineWidth: 0.3,
      lineColor: [0, 0, 0]
    },
    bodyStyles: {
      fontSize: 8,
      cellPadding: { top: 2.2, bottom: 2.2, left: 2, right: 2 },
      textColor: [0, 0, 0],
      lineColor: [180, 180, 180],
      lineWidth: 0.2
    },
    alternateRowStyles: {
      fillColor: [255, 255, 255]
    },
    columnStyles: {
      0: { cellWidth: 10, halign: "center" },
      1: { cellWidth: 32 },
      2: { cellWidth: 34, fontStyle: "bold" },
      3: { cellWidth: 42 },
      4: { cellWidth: 44 },
      5: { cellWidth: 28, halign: "center" },
      6: { cellWidth: 28, halign: "right", fontStyle: "bold" }, // Amount Column
      7: { cellWidth: 26, halign: "center" },
      8: { cellWidth: 25, halign: "center" }
    },
    footStyles: {
      fillColor: [240, 240, 240],
      textColor: [0, 0, 0],
      fontStyle: "bold",
      fontSize: 9,
      cellPadding: { top: 3, bottom: 3, left: 2, right: 2 },
      lineWidth: 0.4,
      lineColor: [0, 0, 0]
    }
  });

  // 5. If expenses exist, append dedicated Shop Expenses Table in report
  if (expenses && expenses.length > 0) {
    const lastY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY : boxY + boxHeight + 20;

    // Check if table needs a page break
    if (lastY > pageHeight - 55) {
      doc.addPage();
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10.5);
      doc.setTextColor(0, 0, 0);
      doc.text("SHOP EXPENSES & OUTFLOWS", marginX, 16);
    } else {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10.5);
      doc.setTextColor(0, 0, 0);
      doc.text("SHOP EXPENSES & OUTFLOWS", marginX, lastY + 8);
    }

    const expStart = lastY > pageHeight - 55 ? 20 : lastY + 11;

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
          { content: "TOTAL", colSpan: 6, styles: { halign: "right", fontStyle: "bold", fontSize: 9 } },
          { content: `Rs. ${totalExpenseAmount.toLocaleString("en-IN")}`, styles: { halign: "right", fontStyle: "bold", fontSize: 9 } }
        ]
      ],
      theme: "plain",
      tableWidth: availableWidth,
      margin: { left: marginX, right: marginX },
      headStyles: {
        fillColor: [240, 240, 240],
        textColor: [0, 0, 0],
        fontStyle: "bold",
        fontSize: 8,
        cellPadding: { top: 3, bottom: 3, left: 2, right: 2 },
        lineWidth: 0.3,
        lineColor: [0, 0, 0]
      },
      bodyStyles: {
        fontSize: 8,
        cellPadding: { top: 2.2, bottom: 2.2, left: 2, right: 2 },
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
        fontSize: 9,
        cellPadding: { top: 3, bottom: 3, left: 2, right: 2 },
        lineWidth: 0.4,
        lineColor: [0, 0, 0]
      },
      columnStyles: {
        0: { cellWidth: 10, halign: "center" },
        1: { cellWidth: 35 },
        2: { cellWidth: 70, fontStyle: "bold" },
        3: { cellWidth: 50 },
        4: { cellWidth: 40 },
        5: { cellWidth: 30, halign: "center" },
        6: { cellWidth: 34, halign: "right", fontStyle: "bold" } // Amount Column
      }
    });
  }

  // Final Footer on all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.3);
    doc.line(marginX, pageHeight - 9, pageWidth - marginX, pageHeight - 9);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(50, 50, 50);
    doc.text("AUTOLINE CAR WASH • OFFICIAL RECORD", marginX, pageHeight - 5);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - marginX, pageHeight - 5, { align: "right" });
  }

  // Save with filename containing the date
  const cleanTitle = title.replace(/[^a-zA-Z0-9]/g, "_");
  const filename = `${cleanTitle}_${fileDateStr}.pdf`;
  doc.save(filename);
}

import nodemailer from "nodemailer";
import * as XLSX from "xlsx";
import dbConnect from "@/lib/mongodb";
import WashEntry from "@/models/WashEntry";
import Expense from "@/models/Expense";

export interface DailyReportData {
  dateStr: string;
  recipientEmail: string;
  totalWashes: number;
  totalWashRevenue: number;
  totalExpenses: number;
  netProfit: number;
  paidWashesCount: number;
  pendingWashesCount: number;
  pendingWashAmount: number;
  washesByPaymentMode: { [key: string]: number };
  washes: any[];
  expenses: any[];
}

/**
 * Builds the daily data for vehicle washes and expenses
 * Default is current day in Indian Standard Time (Asia/Kolkata)
 */
export async function getDailyReportData(targetDate?: Date): Promise<DailyReportData> {
  await dbConnect();

  // Target date normalized to IST Day range (00:00:00 to 23:59:59.999 IST)
  const now = targetDate || new Date();
  
  // Format current IST date YYYY-MM-DD
  const istFormatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
  const dateStr = istFormatter.format(now); // "YYYY-MM-DD"

  // Start of day and End of day in IST converted to UTC ISO
  const startOfDay = new Date(`${dateStr}T00:00:00+05:30`);
  const endOfDay = new Date(`${dateStr}T23:59:59.999+05:30`);

  const [washes, expenses] = await Promise.all([
    WashEntry.find({
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    }).sort({ createdAt: 1 }).lean(),
    Expense.find({
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    }).sort({ createdAt: 1 }).lean()
  ]);

  let totalWashRevenue = 0;
  let paidWashesCount = 0;
  let pendingWashesCount = 0;
  let pendingWashAmount = 0;
  const washesByPaymentMode: { [key: string]: number } = {
    "UPI / QR": 0,
    "Cash": 0,
    "Pending": 0
  };

  washes.forEach((w: any) => {
    const amt = Number(w.amount) || 0;
    const isPending = w.paymentMode === "Pending" || w.paymentStatus === "Pending";
    if (isPending) {
      pendingWashesCount += 1;
      pendingWashAmount += amt;
      washesByPaymentMode["Pending"] = (washesByPaymentMode["Pending"] || 0) + amt;
    } else {
      paidWashesCount += 1;
      totalWashRevenue += amt;
      const mode = w.paymentMode || "UPI / QR";
      washesByPaymentMode[mode] = (washesByPaymentMode[mode] || 0) + amt;
    }
  });

  let totalExpenses = 0;
  expenses.forEach((e: any) => {
    totalExpenses += Number(e.amount) || 0;
  });

  const netProfit = totalWashRevenue - totalExpenses;
  const recipientEmail = process.env.REPORT_RECIPIENT_EMAIL || "nasifthetradesman01@gmail.com";

  return {
    dateStr,
    recipientEmail,
    totalWashes: washes.length,
    totalWashRevenue,
    totalExpenses,
    netProfit,
    paidWashesCount,
    pendingWashesCount,
    pendingWashAmount,
    washesByPaymentMode,
    washes,
    expenses
  };
}

/**
 * Creates Excel spreadsheet buffer for attachments
 */
export function generateExcelBuffer(data: DailyReportData): Buffer {
  const workbook = XLSX.utils.book_new();

  // Summary sheet
  const summaryRows = [
    { Metric: "Report Date", Value: data.dateStr },
    { Metric: "Generated At (IST)", Value: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) },
    { Metric: "Total Washes Count", Value: data.totalWashes },
    { Metric: "Paid Washes Count", Value: data.paidWashesCount },
    { Metric: "Pending Washes Count", Value: data.pendingWashesCount },
    { Metric: "Total Wash Revenue Collected (INR)", Value: data.totalWashRevenue },
    { Metric: "Total Pending Amount (INR)", Value: data.pendingWashAmount },
    { Metric: "Total Expenses (INR)", Value: data.totalExpenses },
    { Metric: "Net Cash Balance (Revenue - Expense) (INR)", Value: data.netProfit },
  ];
  const summarySheet = XLSX.utils.json_to_sheet(summaryRows);
  XLSX.utils.book_append_sheet(workbook, summarySheet, "Daily Summary");

  // Washes sheet
  const washRows = data.washes.map((w: any, idx: number) => ({
    "S.No": idx + 1,
    "Time (IST)": new Date(w.createdAt).toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit" }),
    "Vehicle No": w.vehicleNumber || "-",
    "Customer Phone": w.customerPhone || "-",
    "Customer Name": w.customerName || "-",
    "Category": w.category || "-",
    "Amount (INR)": w.amount || 0,
    "Payment Mode": w.paymentMode || "-",
    "Payment Status": (w.paymentMode === "Pending" || w.paymentStatus === "Pending") ? "Pending" : "Paid",
    "Notes": w.notes || "-"
  }));
  const washSheet = XLSX.utils.json_to_sheet(washRows.length > 0 ? washRows : [{ Note: "No washes recorded for this date" }]);
  XLSX.utils.book_append_sheet(workbook, washSheet, "Vehicle Washes");

  // Expenses sheet
  const expRows = data.expenses.map((e: any, idx: number) => ({
    "S.No": idx + 1,
    "Time (IST)": new Date(e.createdAt).toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit" }),
    "Title": e.title || "-",
    "Category": e.category || "-",
    "Amount (INR)": e.amount || 0,
    "Payment Mode": e.paymentMode || "-",
    "Paid By": e.paidBy || "-",
    "Notes": e.notes || "-"
  }));
  const expSheet = XLSX.utils.json_to_sheet(expRows.length > 0 ? expRows : [{ Note: "No expenses recorded for this date" }]);
  XLSX.utils.book_append_sheet(workbook, expSheet, "Expenses");

  const excelBuffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  return excelBuffer;
}

/**
 * Creates polished HTML email body
 */
export function generateEmailHtml(data: DailyReportData): string {
  const upiAmt = data.washesByPaymentMode["UPI / QR"] || 0;
  const cashAmt = data.washesByPaymentMode["Cash"] || 0;
  const pendingAmt = data.pendingWashAmount || 0;

  const washRowsHtml = data.washes.length > 0 ? data.washes.map((w: any, idx: number) => {
    const time = new Date(w.createdAt).toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit" });
    const isPending = w.paymentMode === "Pending" || w.paymentStatus === "Pending";
    return `
      <tr style="border-bottom: 1px solid #262626;">
        <td style="padding: 8px 10px; font-size: 12px; color: #a3a3a3;">${idx + 1}</td>
        <td style="padding: 8px 10px; font-size: 12px; color: #d4d4d4; font-family: monospace;">${time}</td>
        <td style="padding: 8px 10px; font-size: 12px; color: #ffffff; font-weight: bold; font-family: monospace;">${w.vehicleNumber || "—"}</td>
        <td style="padding: 8px 10px; font-size: 12px; color: #e4e4e7;">${w.customerName || "—"}</td>
        <td style="padding: 8px 10px; font-size: 12px; color: #a3a3a3;">${w.category || "—"}</td>
        <td style="padding: 8px 10px; font-size: 12px; color: #a3a3a3; font-family: monospace;">${w.customerPhone || "—"}</td>
        <td style="padding: 8px 10px; font-size: 12px; text-align: center;">
          <span style="display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: bold; ${isPending ? 'background-color: #451a03; color: #fbbf24; border: 1px solid #78350f;' : 'background-color: #052e16; color: #4ade80; border: 1px solid #14532d;'}">
            ${w.paymentMode || "UPI"}
          </span>
        </td>
        <td style="padding: 8px 10px; font-size: 12px; color: #ffffff; text-align: right; font-weight: bold; font-family: monospace;">Rs. ${(w.amount || 0).toLocaleString("en-IN")}</td>
      </tr>
    `;
  }).join("") : `<tr><td colspan="8" style="padding: 16px; text-align: center; color: #737373; font-size: 12px;">No vehicle washes recorded today.</td></tr>`;

  const expenseRowsHtml = data.expenses.length > 0 ? data.expenses.map((e: any, idx: number) => {
    const time = new Date(e.createdAt).toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit" });
    return `
      <tr style="border-bottom: 1px solid #262626;">
        <td style="padding: 8px 10px; font-size: 12px; color: #a3a3a3;">${idx + 1}</td>
        <td style="padding: 8px 10px; font-size: 12px; color: #d4d4d4; font-family: monospace;">${time}</td>
        <td style="padding: 8px 10px; font-size: 12px; color: #ffffff; font-weight: bold;">${e.title || "—"}</td>
        <td style="padding: 8px 10px; font-size: 12px; color: #fbbf24;">${e.category || "—"}</td>
        <td style="padding: 8px 10px; font-size: 12px; color: #a3a3a3;">${e.paidBy || "—"}</td>
        <td style="padding: 8px 10px; font-size: 12px; text-align: center; color: #d4d4d4;">${e.paymentMode || "Cash"}</td>
        <td style="padding: 8px 10px; font-size: 12px; color: #f87171; text-align: right; font-weight: bold; font-family: monospace;">Rs. ${(e.amount || 0).toLocaleString("en-IN")}</td>
      </tr>
    `;
  }).join("") : `<tr><td colspan="7" style="padding: 16px; text-align: center; color: #737373; font-size: 12px;">No shop expenses recorded today.</td></tr>`;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Autoline Daily Business Report</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #ededed;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a; padding: 24px 0;">
    <tr>
      <td align="center">
        <table width="680" cellpadding="0" cellspacing="0" style="background-color: #121212; border: 1px solid #262626; border-radius: 8px; overflow: hidden; max-width: 680px; width: 100%;">
          
          <!-- Header Banner -->
          <tr>
            <td style="background-color: #000000; padding: 24px 32px; border-bottom: 2px solid #333333;">
              <table width="100%">
                <tr>
                  <td>
                    <div style="font-size: 20px; font-weight: 800; letter-spacing: 1.5px; color: #ffffff; text-transform: uppercase;">AUTOLINE CAR WASH</div>
                    <div style="font-size: 12px; color: #a3a3a3; margin-top: 4px; font-family: monospace;">DAILY AUDIT & REVENUE REPORT • 7:00 PM IST</div>
                  </td>
                  <td align="right">
                    <div style="display: inline-block; padding: 6px 12px; background-color: #171717; border: 1px solid #404040; border-radius: 6px; font-family: monospace; font-size: 12px; color: #ffffff; font-weight: bold;">
                      ${data.dateStr}
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Summary Metric Cards -->
          <tr>
            <td style="padding: 24px 32px 12px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="32%" style="background-color: #171717; border: 1px solid #262626; border-radius: 6px; padding: 14px 16px;">
                    <div style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: #a3a3a3; font-family: monospace;">Revenue Collected</div>
                    <div style="font-size: 22px; font-weight: 800; color: #4ade80; margin-top: 6px; font-family: monospace;">Rs. ${data.totalWashRevenue.toLocaleString("en-IN")}</div>
                    <div style="font-size: 11px; color: #737373; margin-top: 4px;">${data.paidWashesCount} paid vehicle washes</div>
                  </td>
                  <td width="2%"></td>
                  <td width="32%" style="background-color: #171717; border: 1px solid #262626; border-radius: 6px; padding: 14px 16px;">
                    <div style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: #a3a3a3; font-family: monospace;">Shop Expenses</div>
                    <div style="font-size: 22px; font-weight: 800; color: #f87171; margin-top: 6px; font-family: monospace;">Rs. ${data.totalExpenses.toLocaleString("en-IN")}</div>
                    <div style="font-size: 11px; color: #737373; margin-top: 4px;">${data.expenses.length} expense items</div>
                  </td>
                  <td width="2%"></td>
                  <td width="32%" style="background-color: #171717; border: 1px solid #262626; border-radius: 6px; padding: 14px 16px;">
                    <div style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: #a3a3a3; font-family: monospace;">Net Cash Profit</div>
                    <div style="font-size: 22px; font-weight: 800; color: ${data.netProfit >= 0 ? '#38bdf8' : '#fb7185'}; margin-top: 6px; font-family: monospace;">
                      Rs. ${data.netProfit.toLocaleString("en-IN")}
                    </div>
                    <div style="font-size: 11px; color: #737373; margin-top: 4px;">Revenue minus expenses</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Payment Breakdown Bar -->
          <tr>
            <td style="padding: 12px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #171717; border: 1px solid #262626; border-radius: 6px; padding: 12px 16px;">
                <tr>
                  <td style="font-size: 11px; color: #a3a3a3; font-family: monospace; text-transform: uppercase;">
                    <strong>Mode Breakdown:</strong> 
                    <span style="color: #ffffff; margin-left: 8px;">UPI: <b>Rs. ${upiAmt.toLocaleString("en-IN")}</b></span> &nbsp;•&nbsp; 
                    <span style="color: #ffffff;">Cash: <b>Rs. ${cashAmt.toLocaleString("en-IN")}</b></span> &nbsp;•&nbsp; 
                    <span style="color: #fbbf24;">Pending / Due: <b>Rs. ${pendingAmt.toLocaleString("en-IN")} (${data.pendingWashesCount} vehicles)</b></span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Vehicle Washes Section -->
          <tr>
            <td style="padding: 20px 32px 8px 32px;">
              <div style="font-size: 13px; font-weight: 700; color: #ffffff; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px;">
                Today's Vehicle Washes (${data.washes.length})
              </div>
              <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #262626; border-collapse: collapse; border-radius: 6px; overflow: hidden;">
                <thead>
                  <tr style="background-color: #1c1917; border-bottom: 1px solid #333333; text-align: left;">
                    <th style="padding: 8px 10px; font-size: 10px; font-family: monospace; color: #a3a3a3; text-transform: uppercase;">#</th>
                    <th style="padding: 8px 10px; font-size: 10px; font-family: monospace; color: #a3a3a3; text-transform: uppercase;">Time</th>
                    <th style="padding: 8px 10px; font-size: 10px; font-family: monospace; color: #a3a3a3; text-transform: uppercase;">Vehicle No</th>
                    <th style="padding: 8px 10px; font-size: 10px; font-family: monospace; color: #a3a3a3; text-transform: uppercase;">Customer Name</th>
                    <th style="padding: 8px 10px; font-size: 10px; font-family: monospace; color: #a3a3a3; text-transform: uppercase;">Category</th>
                    <th style="padding: 8px 10px; font-size: 10px; font-family: monospace; color: #a3a3a3; text-transform: uppercase;">Phone</th>
                    <th style="padding: 8px 10px; font-size: 10px; font-family: monospace; color: #a3a3a3; text-transform: uppercase; text-align: center;">Mode</th>
                    <th style="padding: 8px 10px; font-size: 10px; font-family: monospace; color: #a3a3a3; text-transform: uppercase; text-align: right;">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  ${washRowsHtml}
                </tbody>
                <tfoot>
                  <tr style="background-color: #0c0a09; border-top: 2px solid #44403c;">
                    <td colspan="7" style="padding: 10px 12px; font-size: 11px; font-weight: bold; font-family: monospace; text-align: right; color: #d4d4d4; text-transform: uppercase;">
                      Total
                    </td>
                    <td style="padding: 10px 12px; font-size: 13px; font-weight: bold; font-family: monospace; text-align: right; color: #ffffff;">
                      Rs. ${data.washes.reduce((sum: number, w: any) => sum + (Number(w.amount) || 0), 0).toLocaleString("en-IN")}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </td>
          </tr>

          <!-- Expenses Section -->
          <tr>
            <td style="padding: 20px 32px 16px 32px;">
              <div style="font-size: 13px; font-weight: 700; color: #ffffff; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px;">
                Today's Shop Expenses (${data.expenses.length})
              </div>
              <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #262626; border-collapse: collapse; border-radius: 6px; overflow: hidden;">
                <thead>
                  <tr style="background-color: #291809; border-bottom: 1px solid #451a03; text-align: left;">
                    <th style="padding: 8px 10px; font-size: 10px; font-family: monospace; color: #fed7aa; text-transform: uppercase;">#</th>
                    <th style="padding: 8px 10px; font-size: 10px; font-family: monospace; color: #fed7aa; text-transform: uppercase;">Time</th>
                    <th style="padding: 8px 10px; font-size: 10px; font-family: monospace; color: #fed7aa; text-transform: uppercase;">Expense Title</th>
                    <th style="padding: 8px 10px; font-size: 10px; font-family: monospace; color: #fed7aa; text-transform: uppercase;">Category</th>
                    <th style="padding: 8px 10px; font-size: 10px; font-family: monospace; color: #fed7aa; text-transform: uppercase;">Paid By</th>
                    <th style="padding: 8px 10px; font-size: 10px; font-family: monospace; color: #fed7aa; text-transform: uppercase; text-align: center;">Mode</th>
                    <th style="padding: 8px 10px; font-size: 10px; font-family: monospace; color: #fed7aa; text-transform: uppercase; text-align: right;">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  ${expenseRowsHtml}
                </tbody>
                <tfoot>
                  <tr style="background-color: #1c0f05; border-top: 2px solid #78350f;">
                    <td colspan="6" style="padding: 10px 12px; font-size: 11px; font-weight: bold; font-family: monospace; text-align: right; color: #fed7aa; text-transform: uppercase;">
                      Total
                    </td>
                    <td style="padding: 10px 12px; font-size: 13px; font-weight: bold; font-family: monospace; text-align: right; color: #f87171;">
                      Rs. ${data.totalExpenses.toLocaleString("en-IN")}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </td>
          </tr>

          <!-- Attachment Notice & Footer -->
          <tr>
            <td style="background-color: #0a0a0a; border-top: 1px solid #262626; padding: 20px 32px; text-align: center;">
              <div style="font-size: 12px; color: #e5e5e5; margin-bottom: 6px;">
                📎 <strong>Attached:</strong> Complete Excel Spreadsheet (<code>Autoline_Report_${data.dateStr}.xlsx</code>)
              </div>
              <div style="font-size: 11px; color: #737373; font-family: monospace;">
                Automated daily notification sent from Autoline Car Wash Server to ${data.recipientEmail}.
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

/**
 * Transporter setup & email sending execution
 */
export async function sendDailyReportEmail(targetDate?: Date): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const data = await getDailyReportData(targetDate);

    const user = process.env.SMTP_USER || "mailautolinecarwash@gmail.com";
    const pass = process.env.SMTP_PASS?.replace(/"/g, "") || "nikl kfgd dyxg djrs";
    const recipient = process.env.REPORT_RECIPIENT_EMAIL || "nasifthetradesman01@gmail.com";

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: Number(process.env.SMTP_PORT) || 465,
      secure: process.env.SMTP_SECURE === "true" || true,
      auth: {
        user,
        pass,
      },
    });

    const excelBuffer = generateExcelBuffer(data);
    const htmlBody = generateEmailHtml(data);

    const info = await transporter.sendMail({
      from: `"Autoline Car Wash" <${user}>`,
      to: recipient,
      subject: `[Daily Report] Autoline Car Wash — ${data.dateStr} (Net: Rs. ${data.netProfit.toLocaleString("en-IN")})`,
      text: `Autoline Car Wash Daily Report for ${data.dateStr}\n\nRevenue Collected: Rs. ${data.totalWashRevenue}\nExpenses: Rs. ${data.totalExpenses}\nNet Cash Profit: Rs. ${data.netProfit}\nTotal Washes: ${data.totalWashes}\nPending Washes: ${data.pendingWashesCount} (Rs. ${data.pendingWashAmount})\n\nPlease check the attached Excel file for complete records.`,
      html: htmlBody,
      attachments: [
        {
          filename: `Autoline_Daily_Report_${data.dateStr}.xlsx`,
          content: excelBuffer,
          contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        },
      ],
    });

    console.log(`[DailyReport] Email sent to ${recipient}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error("[DailyReport] Error sending daily email report:", error);
    return { success: false, error: error.message || "Failed to send email" };
  }
}

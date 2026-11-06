import { NextResponse } from "next/server";
import { sendDailyReportEmail, getDailyReportData } from "@/lib/dailyReportMailer";
import { initDailyReportScheduler } from "@/lib/cronScheduler";

// Make sure the scheduler is initialized whenever backend routes load
initDailyReportScheduler();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const secret = searchParams.get("secret");

    // Check optional security secret if querying trigger
    const validSecret = process.env.CRON_SECRET || "autoline_daily_report_secret_token_7pm";
    if (action === "send" && secret !== validSecret) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (action === "send") {
      const result = await sendDailyReportEmail();
      return NextResponse.json(result);
    }

    // Default: return current day's report statistics preview
    const data = await getDailyReportData();
    return NextResponse.json({
      success: true,
      scheduler: "Active (0 19 * * * Asia/Kolkata)",
      currentTimeIST: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
      recipient: data.recipientEmail,
      preview: {
        date: data.dateStr,
        totalWashes: data.totalWashes,
        paidWashesCount: data.paidWashesCount,
        pendingWashesCount: data.pendingWashesCount,
        totalWashRevenue: data.totalWashRevenue,
        pendingWashAmount: data.pendingWashAmount,
        totalExpenses: data.totalExpenses,
        netProfit: data.netProfit,
        expensesCount: data.expenses.length
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { targetDate } = body;

    const dateObj = targetDate ? new Date(targetDate) : undefined;
    const result = await sendDailyReportEmail(dateObj);

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

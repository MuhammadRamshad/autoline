export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { initDailyReportScheduler } = await import("@/lib/cronScheduler");
    initDailyReportScheduler();
  }
}

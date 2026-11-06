import cron from "node-cron";
import { sendDailyReportEmail } from "./dailyReportMailer";

let isSchedulerInitialized = false;

/**
 * Initializes daily 7:00 PM IST automated email report scheduler.
 * Runs at minute 0, hour 19 (7 PM) in the "Asia/Kolkata" timezone.
 */
export function initDailyReportScheduler() {
  if (isSchedulerInitialized) {
    return;
  }

  isSchedulerInitialized = true;
  console.log("[Scheduler] Initializing daily report cron scheduler for 7:00 PM IST...");

  // 0 19 * * * = Every day at 19:00 (7:00 PM)
  cron.schedule(
    "0 19 * * *",
    async () => {
      console.log("[Scheduler] Triggering 7:00 PM IST daily report email...");
      try {
        const result = await sendDailyReportEmail();
        if (result.success) {
          console.log(`[Scheduler] Daily report successfully emailed (ID: ${result.messageId})`);
        } else {
          console.error(`[Scheduler] Daily report email failed: ${result.error}`);
        }
      } catch (err) {
        console.error("[Scheduler] Unexpected error during scheduled daily report dispatch:", err);
      }
    },
    {
      timezone: "Asia/Kolkata",
    } as any
  );

  console.log("[Scheduler] Daily report cron registered: '0 19 * * *' (Asia/Kolkata)");
}

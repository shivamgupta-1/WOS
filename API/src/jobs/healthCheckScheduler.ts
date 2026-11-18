import cron from "node-cron";
import { runHealthChecks } from "../controllers/healthSnapshot.ts";

let isRunning = false;

export const startHealthCheckScheduler = () => {
cron.schedule("0 */1 * * * *", async () => {  
    if (isRunning) return;

    isRunning = true;
    try {
      await runHealthChecks();
      console.log("Scheduled health checks completed");
    } catch (error) {
      console.error("Scheduled health checks failed:", error);
    } finally {
      isRunning = false;
    }
  });
};
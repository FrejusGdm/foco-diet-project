import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

/**
 * Scheduled Jobs Configuration
 *
 * Defines automated tasks that run on a schedule.
 * Currently configured:
 * - Daily menu scraping at midnight UTC (5:00 PM PT / 7:00 PM ET previous day)
 *
 * Note: Adjust the UTC time based on when the Foco menu updates.
 * The menu typically updates around midnight Eastern time (5:00 AM UTC).
 */
const crons = cronJobs();

crons.daily(
  "scrape-daily-foco-menu",
  { hourUTC: 5, minuteUTC: 0 },
  internal.scrapingActions.scrapeFocoMenu,
  {}
);

export default crons;

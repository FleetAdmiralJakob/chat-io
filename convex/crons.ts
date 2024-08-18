import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval(
  "expire open requests",
  { minutes: 1 },
  internal.messages.expireOpenRequests,
);

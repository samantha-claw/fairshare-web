// lib/logger.ts
const isDev = process.env.NODE_ENV === "development";

export const logger = {
  info: (...args: any[]) => {
    if (isDev) console.log("[FairShare]", ...args);
  },
  warn: (...args: any[]) => {
    if (isDev) console.warn("[FairShare]", ...args);
  },
  error: (...args: any[]) => {
    // Always log errors, even in production
    console.error("[FairShare Error]", ...args);
  },
  debug: (...args: any[]) => {
    if (isDev) console.debug("[FairShare Debug]", ...args);
  },
};
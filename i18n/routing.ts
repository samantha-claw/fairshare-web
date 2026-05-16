import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  // Locales supported by the app
  locales: ["en", "ar"],

  // Default locale if no locale is set in the URL or cookie
  defaultLocale: "en",

  // Cookie name for storing the locale preference
  localeCookie: {
    name: "NEXT_LOCALE",
    // 365 days
    maxAge: 60 * 60 * 24 * 365,
  },
});

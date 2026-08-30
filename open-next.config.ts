import { defineCloudflareConfig } from "@opennextjs/cloudflare";

/**
 * No incremental cache override and no revalidation queue, deliberately.
 *
 * Every showcase route sets `export const dynamic = "force-dynamic"` and every
 * fetch to focms-api passes `cache: "no-store"`, so there is no ISR or data
 * cache for R2 to hold. The single `next: { revalidate: 86400 }` lives in
 * lib/translate.ts and is dormant while GOOGLE_TRANSLATE_API_KEY is unset.
 *
 * Add r2IncrementalCache + doQueue here if translation is switched on or any
 * route stops being force-dynamic.
 */
export default defineCloudflareConfig();

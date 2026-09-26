/**
 * publicSite.ts — v0.2 data client for wizard-published family sites.
 * Fetches the anonymous site config from focms-api (/public/site/{slug}).
 * Returns null when the slug is unknown or unpublished.
 */

const API = process.env.FOCMS_API_URL ?? "https://api.outcomestar.app";

// 2026-09-25: tenant slugs are short lowercase tokens ("jrj"). Anything else is
// a bot probing app.outcomestar.app/<junk> (.env, .git, id_rsa, wp-admin ...),
// and until this guard every one of those was relayed to focms-api as
// GET /public/site/<junk> - 7,400 pointless API calls in two weeks. Reject the
// shape here so the page 404s locally and the API never hears about it.
const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,62}$/;
export function isValidSlug(slug: string): boolean {
  return SLUG_RE.test(slug);
}

export type PublicSiteConfig = {
  slug: string;
  hero_url?: string | null;
  student_first_name: string;
  graduation_year: number | null;
  age_band: "band_1_5" | "band_6_12" | "band_13_18";
  band_label: string;
  control_mode: string;
  theme: { key: string; name: string; vibe: string; built: boolean } | null;
  sections: Array<{ code: string; title: string; pillar?: string; count?: number; preview?: string | null }>;
  language_primary: string;
  language_secondary: string | null;
};

export async function getPublicSite(
  slug: string,
): Promise<PublicSiteConfig | null> {
  if (!isValidSlug(slug)) return null;
  try {
    const r = await fetch(`${API}/focms/v1/public/site/${encodeURIComponent(slug)}`, {
      cache: "no-store",
    });
    if (!r.ok) return null;
    return (await r.json()) as PublicSiteConfig;
  } catch {
    return null;
  }
}

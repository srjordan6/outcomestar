/**
 * publicSite.ts — v0.2 data client for wizard-published family sites.
 * Fetches the anonymous site config from focms-api (/public/site/{slug}).
 * Returns null when the slug is unknown or unpublished.
 */

const API = process.env.FOCMS_API_URL ?? "https://focms-api.onrender.com";

export type PublicSiteConfig = {
  slug: string;
  hero_url?: string | null;
  student_first_name: string;
  graduation_year: number | null;
  age_band: "band_1_5" | "band_6_12" | "band_13_18";
  band_label: string;
  control_mode: string;
  theme: { key: string; name: string; vibe: string; built: boolean } | null;
  sections: Array<{ code: string; title: string; pillar?: string }>;
  language_primary: string;
  language_secondary: string | null;
};

export async function getPublicSite(
  slug: string,
): Promise<PublicSiteConfig | null> {
  try {
    const r = await fetch(`${API}/focms/v1/public/site/${encodeURIComponent(slug)}`, {
      next: { revalidate: 60 },
    });
    if (!r.ok) return null;
    return (await r.json()) as PublicSiteConfig;
  } catch {
    return null;
  }
}

/**
 * app/[slug]/page.tsx — OutcomeStar public showcase route.
 *
 * Server component. Fetches the student's FOCMS feed and identity, resolves
 * the tenant's chosen theme, renders the theme component with the data.
 *
 * Architecture v2.2 §10:
 *   - One Next.js app handles every tenant via dynamic [slug] routing.
 *   - tenant_settings.theme.key selects the theme. Until product launch,
 *     all tenants render Mission Control.
 *   - URL override `?theme=...` previews any theme without persisting.
 *
 * Environment:
 *   FOCMS_API_URL      default https://focms-api.onrender.com
 *   FOCMS_API_TOKEN    bearer token for focms-api server-side calls
 *   FOCMS_FEED_URL     fallback swim feed (v0.1 data source)
 */

import { notFound } from "next/navigation";
import {
  resolveTheme,
  DEFAULT_THEME_KEY,
  VIEW_ALIASES,
  type ThemeProps,
} from "@/lib/themes";

// ---------------------------------------------------------------------------
// Tenant registry — until the parent portal lands, every new student is a row
// here. Architecture v2.2: this will move to the `tenants` table at launch.
// ---------------------------------------------------------------------------

interface TenantConfig {
  slug: string;
  studentId: string;
  tenantId: string;
  /** Display name for the public page. */
  displayName: string;
  /** Tenant's chosen theme key. Until launch, hardcoded to mission-control. */
  themeKey: string;
  /** Optional tagline shown in the Mission Profile panel. */
  tagline?: string;
  /** Optional URL to a portrait image rendered in the Mission Profile panel. */
  photoUrl?: string;
}

const TENANTS: Record<string, TenantConfig> = {
  john: {
    slug: "john",
    studentId: "019ed384-5769-72ca-864a-28e40c4e5d30",
    tenantId: "019ed384-56fc-7516-bfbf-efaa5231e281",
    displayName: "John Ray Jordan",
    themeKey: "mission-control",
    tagline: "Future astronaut · breaststroke specialist",
    photoUrl: "https://johnrjordan.com/wp-content/uploads/2026/05/john-at-the-cotillion-Ball-03292026-2-2-scaled.jpg",
  },
};

// ---------------------------------------------------------------------------
// Data fetchers
// ---------------------------------------------------------------------------

const API = process.env.FOCMS_API_URL ?? "https://focms-api.onrender.com";
const FEED_URL =
  process.env.FOCMS_FEED_URL ??
  "https://johnrjordan.com/focms-feed-swim-bests/";
const API_TOKEN = process.env.FOCMS_API_TOKEN;

async function fetchStudent(studentId: string) {
  if (!API_TOKEN) {
    console.warn("FOCMS_API_TOKEN not set; skipping student fetch");
    return {};
  }
  try {
    const r = await fetch(`${API}/focms/v1/student/${studentId}`, {
      headers: { Authorization: `Bearer ${API_TOKEN}` },
      next: { revalidate: 300 },
    });
    if (!r.ok) {
      console.warn(`student fetch ${r.status}`);
      return {};
    }
    return await r.json();
  } catch (e) {
    console.warn("student fetch failed", e);
    return {};
  }
}

async function fetchRecords(studentId: string, type: string): Promise<any[]> {
  if (!API_TOKEN) return [];
  try {
    const r = await fetch(
      `${API}/focms/v1/student/${studentId}/records?type=${type}&limit=500`,
      {
        headers: { Authorization: `Bearer ${API_TOKEN}` },
        next: { revalidate: 300 },
      },
    );
    if (!r.ok) {
      console.warn(`records[${type}] fetch ${r.status}`);
      return [];
    }
    const j = await r.json();
    return Array.isArray(j.records) ? j.records : [];
  } catch (e) {
    console.warn(`records[${type}] fetch failed`, e);
    return [];
  }
}

async function fetchTargetUniversities(studentId: string): Promise<any[]> {
  if (!API_TOKEN) return [];
  try {
    const r = await fetch(
      `${API}/focms/v1/student/${studentId}/target-universities`,
      {
        headers: { Authorization: `Bearer ${API_TOKEN}` },
        next: { revalidate: 300 },
      },
    );
    if (!r.ok) {
      console.warn(`target-universities fetch ${r.status}`);
      return [];
    }
    const j = await r.json();
    return Array.isArray(j.targets) ? j.targets : [];
  } catch (e) {
    console.warn("target-universities fetch failed", e);
    return [];
  }
}

async function fetchFeed() {
  // v0.1 source: WP-hosted feed page. Parses <pre id="focms-payload">{...}</pre>.
  // v0.2 source (planned): direct call to focms-api /computed/* endpoints.
  try {
    const r = await fetch(FEED_URL, { next: { revalidate: 300 } });
    if (!r.ok) return {};
    const html = await r.text();
    const match = html.match(/<pre id="focms-payload">([\s\S]+?)<\/pre>/);
    if (!match) return {};
    // Decode HTML entities the feed may contain
    const decoded = match[1]
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&#039;/g, "'");
    return JSON.parse(decoded);
  } catch (e) {
    console.warn("feed fetch failed", e);
    return {};
  }
}

// ---------------------------------------------------------------------------
// Route
// ---------------------------------------------------------------------------

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ theme?: string; view?: string }>;
}

export default async function StudentShowcasePage({
  params,
  searchParams,
}: PageProps) {
  const { slug } = await params;
  const { theme: themeOverride, view } = await searchParams;
  const tenant = TENANTS[slug];
  if (!tenant) return notFound();

  const [
    student,
    feed,
    assessments,
    goals,
    affiliations,
    targetUniversities,
  ] = await Promise.all([
    fetchStudent(tenant.studentId),
    fetchFeed(),
    fetchRecords(tenant.studentId, "assessments"),
    fetchRecords(tenant.studentId, "goals"),
    fetchRecords(tenant.studentId, "affiliations"),
    fetchTargetUniversities(tenant.studentId),
  ]);

  // Theme resolution priority (highest wins):
  //   1. ?theme=<key>     — explicit theme key
  //   2. ?view=<alias>    — semantic alias (e.g. view=resume → resume-mode)
  //   3. tenant.themeKey  — tenant's persisted choice
  //   4. DEFAULT_THEME_KEY
  const aliasedTheme = view ? VIEW_ALIASES[view] : undefined;
  const effectiveThemeKey =
    themeOverride ?? aliasedTheme ?? tenant.themeKey ?? DEFAULT_THEME_KEY;
  const theme = resolveTheme(effectiveThemeKey);
  const Theme = theme.component;

  const themeProps: ThemeProps = {
    student,
    feed,
    displayName: tenant.displayName,
    tagline: tenant.tagline,
    photoUrl: tenant.photoUrl,
    assessments,
    goals,
    affiliations,
    targetUniversities,
  };

  return <Theme {...themeProps} />;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const tenant = TENANTS[slug];
  if (!tenant) return { title: "OutcomeStar" };
  return {
    title: `${tenant.displayName} · OutcomeStar`,
    description: `Mission Control telemetry: ${tenant.displayName}'s portfolio.`,
  };
}

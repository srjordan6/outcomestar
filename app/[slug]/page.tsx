/**
 * app/[slug]/page.tsx — OutcomeStar public showcase route.
 *
 * Server component. Fetches the student's showcase config + identity data +
 * portfolio feed, resolves the chosen theme, renders the theme component.
 *
 * Architecture v2.2 §10 (commercial-ready):
 *   - One Next.js app handles every tenant via dynamic [slug] routing.
 *   - Tenant config is loaded from focms-api at request time, not from a
 *     hardcoded TENANTS constant. Adding a new student is one INSERT into
 *     public_showcases — no code change, no deploy.
 *   - tenant_settings.theme.key selects the theme; ?theme= or ?view= override.
 *
 * Environment:
 *   FOCMS_API_URL      default https://focms-api.onrender.com
 *   FOCMS_API_TOKEN    bearer token for focms-api server-side calls
 *
 * v1.6: fetchFeed now hits /focms/v1/student/{id}/computed/swim-bests instead
 * of the johnrjordan.com WP feed. Each student sees their own swim data
 * computed from personal_records, no bleed across students.
 */

import { notFound } from "next/navigation";
import {
  resolveTheme,
  DEFAULT_THEME_KEY,
  VIEW_ALIASES,
  type ThemeProps,
} from "@/lib/themes";

// ---------------------------------------------------------------------------
// Showcase config — fetched per request from focms-api
// ---------------------------------------------------------------------------

interface ShowcaseConfig {
  id: string;
  slug: string;
  tenant_id: string;
  student_id: string;
  theme_key: string;
  display_name: string | null;
  tagline: string | null;
  photo_url: string | null;
  visibility: string;
}

const API = process.env.FOCMS_API_URL ?? "https://focms-api.onrender.com";
const API_TOKEN = process.env.FOCMS_API_TOKEN;

async function fetchShowcase(slug: string): Promise<ShowcaseConfig | null> {
  if (!API_TOKEN) {
    console.warn("FOCMS_API_TOKEN not set; cannot resolve showcase");
    return null;
  }
  try {
    const r = await fetch(`${API}/focms/v1/showcase/${slug}`, {
      headers: { Authorization: `Bearer ${API_TOKEN}` },
      next: { revalidate: 60 },
    });
    if (r.status === 404) return null;
    if (!r.ok) {
      console.warn(`showcase fetch ${r.status}`);
      return null;
    }
    return (await r.json()) as ShowcaseConfig;
  } catch (e) {
    console.warn("showcase fetch failed", e);
    return null;
  }
}

async function fetchStudent(studentId: string) {
  if (!API_TOKEN) return {};
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

async function fetchFeed(studentId: string) {
  // v0.2: student-scoped swim feed computed server-side from personal_records.
  // Replaces the per-student bleed from the johnrjordan.com hardcoded WP feed.
  if (!API_TOKEN) return {};
  try {
    const r = await fetch(
      `${API}/focms/v1/student/${studentId}/computed/swim-bests`,
      {
        headers: { Authorization: `Bearer ${API_TOKEN}` },
        next: { revalidate: 300 },
      },
    );
    if (!r.ok) {
      console.warn(`swim-bests fetch ${r.status}`);
      return {};
    }
    return await r.json();
  } catch (e) {
    console.warn("swim-bests fetch failed", e);
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

  // Step 1: resolve the showcase config (slug -> tenant + student + display)
  const showcase = await fetchShowcase(slug);
  if (!showcase) return notFound();

  // Step 2: in parallel, fetch the data the theme will render
  const [
    student,
    feed,
    assessments,
    goals,
    affiliations,
    targetUniversities,
  ] = await Promise.all([
    fetchStudent(showcase.student_id),
    fetchFeed(showcase.student_id),
    fetchRecords(showcase.student_id, "assessments"),
    fetchRecords(showcase.student_id, "goals"),
    fetchRecords(showcase.student_id, "affiliations"),
    fetchTargetUniversities(showcase.student_id),
  ]);

  // Step 3: theme resolution priority (highest wins):
  //   1. ?theme=<key>     — explicit theme key
  //   2. ?view=<alias>    — semantic alias (e.g. view=resume → resume-mode)
  //   3. showcase.theme_key — tenant's persisted choice
  //   4. DEFAULT_THEME_KEY
  const aliasedTheme = view ? VIEW_ALIASES[view] : undefined;
  const effectiveThemeKey =
    themeOverride ?? aliasedTheme ?? showcase.theme_key ?? DEFAULT_THEME_KEY;
  const theme = resolveTheme(effectiveThemeKey);
  const Theme = theme.component;

  const themeProps: ThemeProps = {
    student,
    feed,
    displayName: showcase.display_name ?? undefined,
    tagline: showcase.tagline ?? undefined,
    photoUrl: showcase.photo_url ?? undefined,
    assessments,
    goals,
    affiliations,
    targetUniversities,
  };

  return <Theme {...themeProps} />;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const showcase = await fetchShowcase(slug);
  if (!showcase) return { title: "OutcomeStar" };
  const name = showcase.display_name ?? slug;
  return {
    title: `${name} · OutcomeStar`,
    description: `Mission Control telemetry: ${name}'s portfolio.`,
  };
}

/**
 * app/[slug]/[lang]/page.tsx — second-language family site (theme sprint).
 * Live only when the family configured that language as language_secondary
 * (or it matches language_primary). UI strings are machine-translated via
 * lib/translate; falls back to English text if translation is unavailable.
 */

export const dynamic = "force-dynamic";  // themes/records must reflect the latest save, not a 60s cache

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPublicSite } from "@/lib/publicSite";
import { resolveGenericTheme, GENERIC_THEMES } from "@/lib/genericThemes";
import { ThemedSite, defaultStrings } from "../ThemedSite";
import { GenericSite } from "../GenericSite";
import { translateBatch } from "@/lib/translate";
import { GOOGLE_LANGUAGE_CODES } from "@/lib/googleLanguages";
import { getLatest } from "@/lib/latestActivity";

export async function generateMetadata({
  params,
}: {
  params: { slug: string; lang: string };
}): Promise<Metadata> {
  const site = await getPublicSite(params.slug);
  if (!site) return { title: "Not found" };
  return {
    title: site.student_first_name,
    description: `${site.student_first_name} \u00b7 ${site.band_label} \u00b7 ${params.lang}`,
    robots: { index: false, follow: false },
  };
}

export default async function LangSitePage({
  params,
}: {
  params: { slug: string; lang: string };
}) {
  const site = await getPublicSite(params.slug);
  if (!site) notFound();
  const lang = params.lang;
  if (!GOOGLE_LANGUAGE_CODES.has(lang) || lang === "en") notFound();

  const theme =
    resolveGenericTheme(site!.theme?.key) ??
    GENERIC_THEMES[site!.age_band === "band_13_18" ? "resume-mode" : site!.age_band === "band_6_12" ? "mission-control" : "storybook"];

  const base = defaultStrings(site!);
  const flat = [
    base.classOf,
    base.bandLabel,
    base.sectionsHeading,
    base.growNote,
    base.footer,
    ...base.sections.map((s) => s.title),
  ];
  const tr = await translateBatch(flat, lang);
  const strings = {
    classOf: tr[0],
    bandLabel: tr[1],
    sectionsHeading: tr[2],
    growNote: tr[3],
    footer: tr[4],
    sections: base.sections.map((s, i) => ({ code: s.code, title: tr[5 + i] })),
  };

  if (!theme) return <GenericSite site={site!} />;
  const latest = await getLatest(site!.slug);
  return <ThemedSite site={site!} theme={theme} strings={strings} langBadge={lang.toUpperCase()} currentLang={lang} latest={latest} />;
}

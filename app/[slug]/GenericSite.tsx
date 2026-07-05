/**
 * GenericSite.tsx — v0.2 renderer for wizard-published family sites.
 * Renders any tenant's site from PublicSiteConfig alone: first name only,
 * age-band framing, chosen theme identity, enabled sections as the site map.
 * Section bodies come online as capture endpoints are wired per band.
 */

import type { PublicSiteConfig } from "@/lib/publicSite";

const BAND_STYLE: Record<
  PublicSiteConfig["age_band"],
  { accent: string; soft: string; blurb: string }
> = {
  band_1_5: {
    accent: "#F07800",
    soft: "#FFF4E8",
    blurb: "A family memory book — growing one milestone at a time.",
  },
  band_6_12: {
    accent: "#201868",
    soft: "#EEEDF7",
    blurb: "A developmental portfolio — achievements, activities, and growth.",
  },
  band_13_18: {
    accent: "#0F172A",
    soft: "#F1F5F9",
    blurb: "A professional launchpad — the record that opens doors.",
  },
};

export function GenericSite({ site }: { site: PublicSiteConfig }) {
  const style = BAND_STYLE[site.age_band] ?? BAND_STYLE.band_6_12;
  return (
    <main className="mx-auto max-w-page px-6 pt-12 pb-24">
      <header className="pb-8" style={{ borderBottom: `3px solid ${style.accent}` }}>
        <p className="eyebrow">{site.band_label}</p>
        <h1 className="mt-2 font-display text-5xl md:text-7xl font-semibold tracking-tight leading-[0.92]">
          {site.student_first_name}
        </h1>
        <p className="mt-4 text-ink-soft text-lg">
          {site.graduation_year ? (
            <>
              Class of <span className="font-mono">{site.graduation_year}</span> ·{" "}
            </>
          ) : null}
          {style.blurb}
        </p>
        {site.theme ? (
          <p className="mt-3 text-xs text-ink-fade">
            Theme: <span className="font-mono">{site.theme.name}</span> — {site.theme.vibe}
          </p>
        ) : null}
      </header>

      <section className="mt-14">
        <p className="eyebrow">Site map</p>
        <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight">
          Sections
        </h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {site.sections.map((s, i) => (
            <div
              key={s.code}
              className="rounded-xl p-5"
              style={{ background: style.soft }}
            >
              <p className="text-xs font-mono text-ink-fade">
                {String(i + 1).padStart(2, "0")}
              </p>
              <h3 className="mt-1 font-display text-xl font-semibold">
                {s.title}
              </h3>
              <p className="mt-2 text-sm text-ink-soft">
                Content appears here as the family record grows.
              </p>
            </div>
          ))}
        </div>
      </section>

      <footer className="mt-20 border-t border-ink/20 pt-6 text-xs text-ink-fade">
        <p>
          Published with outcomestar. First name only appears on this page; no
          contact details are ever shown for minors.
        </p>
      </footer>
    </main>
  );
}

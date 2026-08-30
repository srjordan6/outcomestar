/**
 * app/[slug]/section/[code]/page.tsx — v3 (2026-08-24).
 *
 * Section pages render inside the same design as the landing page:
 * ThemedShell (fonts, fx overlays, motion, footer) + ThemedHero (stage,
 * veil, character, signature heading). The stage shows THIS section's
 * entries, so the swim page's backdrop is the swim record.
 *
 * v3: when the section's items carry a first value and a current value for
 * enough events, the hero is The Drop instead: every improved event as a
 * tower falling from where it started to where it is now, the total gained
 * counting up in the headline. Inferred from the meta shape (any section
 * with first/best pairs), not keyed to athlete_tracker.
 *
 * Entry cards and the best-times board use the archetype card treatment
 * from showcaseKit, so a comic-book site gets panels here and a
 * mission-control site gets HUD brackets here, exactly as on the front.
 */

export const dynamic = "force-dynamic";  // themes/records must reflect the latest save, not a 60s cache

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPublicSite } from "@/lib/publicSite";
import { getLatest, formatLatest } from "@/lib/latestActivity";
import { resolveGenericTheme, GENERIC_THEMES, type GenericThemeTokens } from "@/lib/genericThemes";
import { bandEnergy, cardBaseFor, fxFlags, isDarkBg, PILLAR_LABEL, typeScale, type FxFlags } from "@/lib/showcaseKit";
import { parseTime, progressionFrom } from "@/lib/progression";
import { ThemedShell } from "../../ThemedShell";
import { ThemedHero } from "../../ThemedHero";
import TheDrop from "../../TheDrop";

const API = process.env.NEXT_PUBLIC_FOCMS_API || "https://focms-api.onrender.com";

type Item = {
  title: string;
  body?: string;
  date?: string;
  meta?: { stroke?: string; course?: string; event?: string; best_time?: string; first_time?: string; power_points?: number; usa_standard?: string };
};

async function getSection(slug: string, code: string) {
  const r = await fetch(`${API}/focms/v1/public/site/${slug}/section/${code}`, { cache: "no-store" });
  if (!r.ok) return null;
  return (await r.json()) as { title: string; code: string; items: Item[] };
}

function themeFor(site: NonNullable<Awaited<ReturnType<typeof getPublicSite>>>): GenericThemeTokens {
  return (
    resolveGenericTheme(site.theme?.key) ??
    GENERIC_THEMES[site.age_band === "band_13_18" ? "resume-mode" : site.age_band === "band_6_12" ? "mission-control" : "storybook"]
  );
}

export async function generateMetadata({ params: paramsPromise }: { params: Promise<{ slug: string; code: string }> }): Promise<Metadata> {
  const params = await paramsPromise;
  const site = await getPublicSite(params.slug);
  if (!site) return { title: "Not found" };
  const ref = site.sections.find((s) => s.code === params.code);
  return {
    title: `${ref?.title ?? params.code} \u00b7 ${site.student_first_name}`,
    robots: { index: false, follow: false },
  };
}

export default async function SectionPage({ params: paramsPromise }: { params: Promise<{ slug: string; code: string }> }) {
  const params = await paramsPromise;
  const site = await getPublicSite(params.slug);
  if (!site) notFound();
  const section = await getSection(params.slug, params.code);
  if (!section) notFound();
  const latest = await getLatest(params.slug);

  const theme = themeFor(site!);
  const [displayFont] = theme.fonts;
  const energy = bandEnergy(theme);
  const fx = fxFlags(theme);
  const T = typeScale(theme.layout);
  const cardBase = cardBaseFor(theme, T, fx, energy);
  const ref = site!.sections.find((s) => s.code === params.code);
  const pillar = ref?.pillar && PILLAR_LABEL[ref.pillar] ? PILLAR_LABEL[ref.pillar] : null;
  const n = section.items.length;
  const first = site!.student_first_name;

  /* The Drop, when the record can carry it. */
  const prog = progressionFrom(section.items);
  const backLink = (
    <a href={`/${site!.slug}`} style={{ color: "inherit", textDecoration: "none" }}>&larr; {first}</a>
  );
  /* Every word below comes from the scale, so a cellist's page reads about
     ratings and a swimmer's about times without either being special-cased. */
  const lower = prog ? prog.direction === "lower" : true;
  const noun = prog ? prog.scale.label.replace(/\s*\(.*\)$/, "").toLowerCase() : "";
  const move = lower ? "watch them fall" : "watch them climb";
  const backwards = lower ? "worse" : "lower";
  const dropSub = prog
    ? prog.slower === 0
      ? <>{prog.improved} {prog.improved === 1 ? "entry" : "entries"}. <b style={{ color: "#fff", fontWeight: 600 }}>Not one of them {backwards}.</b> Each tower stands at the first recorded {noun} &mdash; {move} to where {first} is now.</>
      : <>{prog.improved} of {prog.timed} improved on the first attempt. Each tower stands at that first {noun} &mdash; {move} to where {first} is now.</>
    : null;

  return (
    <ThemedShell theme={theme} crumbs={[{ label: first, href: `/${site!.slug}` }, { label: section.title }]}>
      <p style={{ color: theme.accent, fontSize: 12, letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 600, marginBottom: 24 }}>
        {formatLatest(latest)}
      </p>

      {prog ? (
        <TheDrop
          events={prog.events}
          direction={prog.direction}
          totalGain={prog.totalGain}
          unit={prog.unit}
          hudLabel={prog.hud}
          scaleKey={prog.scale.key}
          eyebrow={<>{backLink}{pillar ? <> &middot; {pillar}</> : null}{prog.years ? <> &middot; {prog.years[0]}&ndash;{prog.years[1]}</> : null}</>}
          sub={dropSub}
          accent={theme.accent}
          accent2={theme.accent2 ?? theme.accent}
          ground={dropGround(theme)}
          displayFont={displayFont}
          radius={typeof cardBase.borderRadius === "number" ? cardBase.borderRadius : 0}
        />
      ) : (
        <ThemedHero
          site={site!}
          theme={theme}
          variant="section"
          eyebrow={<>{backLink}{pillar ? ` \u00b7 ${pillar}` : ""}</>}
          title={section.title}
          chips={[n > 0 ? `${n} ${n === 1 ? "entry" : "entries"}` : "", site!.band_label]}
          entries={n}
        />
      )}

      <section style={{ marginTop: 40 }}>
        {prog ? (
          <h2 style={{ fontFamily: `'${displayFont}', serif`, fontSize: T.h2, fontWeight: 600, letterSpacing: T.track, marginBottom: 24, transform: fx.panel ? "rotate(-0.6deg)" : undefined }}>
            {section.title}
            <span style={{ color: theme.soft, fontSize: T.body, fontWeight: 500, letterSpacing: 0, marginLeft: 14 }}>{n} {n === 1 ? "entry" : "entries"}</span>
          </h2>
        ) : null}
        {n === 0 ? (
          <div className="os-card" style={cardBase}>
            <p style={{ color: theme.soft, fontSize: T.body }}>
              Content for <b style={{ color: theme.ink }}>{section.title}</b> appears here as the family adds records and marks them public.
            </p>
          </div>
        ) : params.code === "athlete_tracker" ? (
          <BestTimesBoard items={section.items} theme={theme} fx={fx} cardBase={cardBase} displayFont={displayFont} />
        ) : (
          <div
            style={{
              display: "grid",
              gap: fx.isEditorial ? 0 : fx.panel ? 22 : T.gap,
              gridTemplateColumns: fx.isEditorial ? "minmax(0,1fr)" : "repeat(auto-fit, minmax(280px, 1fr))",
              ...(fx.isEditorial ? { maxWidth: "68ch" } : {}),
            }}
          >
            {section.items.map((it, i) => {
              const style: React.CSSProperties = { ...cardBase, animationDelay: `${Math.min(i, 12) * 0.06}s` };
              if (fx.sticker) style.transform = `rotate(${i % 2 === 0 ? -1.1 : 0.9}deg)`;
              return (
                <article key={i} className="os-card" style={style}>
                  {fx.foil ? <span className="os-foil" aria-hidden /> : null}
                  {fx.tape ? (
                    <span aria-hidden style={{ position: "absolute", top: -10, left: 24, width: 64, height: 20, background: `${theme.pop ?? theme.accent}AA`, transform: "rotate(-4deg)", borderRadius: 2 }} />
                  ) : null}
                  {fx.hud ? (
                    <>
                      <span aria-hidden style={{ position: "absolute", top: 6, left: 6, width: 12, height: 12, borderTop: `2px solid ${theme.accent}`, borderLeft: `2px solid ${theme.accent}` }} />
                      <span aria-hidden style={{ position: "absolute", bottom: 6, right: 6, width: 12, height: 12, borderBottom: `2px solid ${theme.accent}`, borderRight: `2px solid ${theme.accent}` }} />
                    </>
                  ) : null}
                  {it.date ? (
                    <p style={{ color: theme.accent, fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 700 }}>{it.date}</p>
                  ) : null}
                  <h3 style={{ fontFamily: `'${displayFont}', serif`, fontSize: T.h3, fontWeight: 600, letterSpacing: T.track, lineHeight: 1.3, marginTop: it.date ? 6 : 0 }}>
                    {it.title}
                  </h3>
                  {it.body ? <p style={{ color: theme.soft, marginTop: 8, fontSize: T.body, lineHeight: 1.55 }}>{it.body}</p> : null}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </ThemedShell>
  );
}

/**
 * The Drop is always on dark ground: it is a cinematic inset. Dark themes
 * use their own background; light themes get a near-black derived from the
 * secondary accent so the stage still belongs to the palette.
 */
function dropGround(theme: GenericThemeTokens): string {
  if (isDarkBg(theme) && /^#[0-9a-fA-F]{6}$/.test(theme.bg.trim())) return theme.bg.trim();
  const src = (theme.accent2 ?? theme.accent).replace("#", "");
  const n = parseInt(src.slice(0, 6), 16);
  if (!Number.isFinite(n)) return "#04070E";
  const ch = (v: number) => Math.round(v * 0.13 + 3).toString(16).padStart(2, "0");
  return `#${ch((n >> 16) & 255)}${ch((n >> 8) & 255)}${ch(n & 255)}`;
}
function fmtDrop(best?: string, first?: string): { drop: string; pct: string } {
  const b = parseTime(best), f = parseTime(first);
  if (b == null || f == null || f <= 0) return { drop: "", pct: "" };
  const d = f - b;
  return { drop: d.toFixed(2), pct: ((d / f) * 100).toFixed(1) + "%" };
}

const STROKE_ORDER = ["Free", "Back", "Breast", "Fly", "IM"] as const;
const STROKE_LABEL: Record<string, string> = { Free: "Freestyle", Back: "Backstroke", Breast: "Breaststroke", Fly: "Butterfly", IM: "Individual Medley" };

function BestTimesBoard({
  items, theme, fx, cardBase, displayFont,
}: {
  items: Item[];
  theme: GenericThemeTokens;
  fx: FxFlags;
  cardBase: React.CSSProperties;
  displayFont: string;
}) {
  const byStroke: Record<string, Item[]> = {};
  for (const it of items) {
    const st = it.meta?.stroke || "Free";
    (byStroke[st] ||= []).push(it);
  }
  const strokes = STROKE_ORDER.filter((s) => byStroke[s]?.length);
  /* the card treatment, minus padding: the table supplies its own */
  const board: React.CSSProperties = { ...cardBase, padding: 0, overflowX: "auto", background: fx.isEditorial ? theme.card : cardBase.background };

  return (
    <>
      {strokes.map((st, si) => (
        <div key={st} style={{ marginBottom: 32 }}>
          <h3 style={{ fontFamily: `'${displayFont}', serif`, color: theme.accent, fontSize: 22, fontWeight: 600, marginBottom: 12, transform: fx.panel ? "rotate(-0.6deg)" : undefined }}>
            {STROKE_LABEL[st]}
          </h3>
          <div className="os-card" style={{ ...board, animationDelay: `${si * 0.08}s` }}>
            {fx.foil ? <span className="os-foil" aria-hidden /> : null}
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr style={{ background: `${theme.accent}22` }}>
                  {["Event", "Best", "Pts", "Std", "First", "Drop", "%", "Meet"].map((h) => (
                    <th key={h} style={{ padding: "10px 12px", textAlign: "left", color: theme.ink, borderBottom: `2px solid ${theme.accent}`, whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {byStroke[st].map((it, i) => {
                  const m = it.meta || {};
                  const { drop, pct } = fmtDrop(m.best_time, m.first_time);
                  return (
                    <tr key={i} style={{ borderTop: `1px solid ${theme.border}` }}>
                      <td style={{ padding: "10px 12px", color: theme.ink, whiteSpace: "nowrap" }}>
                        {m.event || it.title} {m.course ? <span style={{ color: theme.soft, fontSize: 12 }}>({m.course})</span> : null}
                      </td>
                      <td style={{ padding: "10px 12px", color: theme.ink, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{m.best_time || ""}</td>
                      <td style={{ padding: "10px 12px", color: theme.soft }}>{m.power_points ?? ""}</td>
                      <td style={{ padding: "10px 12px", color: theme.accent, fontWeight: 700 }}>{m.usa_standard || ""}</td>
                      <td style={{ padding: "10px 12px", color: theme.soft, fontVariantNumeric: "tabular-nums" }}>{m.first_time || ""}</td>
                      <td style={{ padding: "10px 12px", color: theme.soft }}>{drop ? `-${drop}s` : ""}</td>
                      <td style={{ padding: "10px 12px", color: theme.soft }}>{pct}</td>
                      <td style={{ padding: "10px 12px", color: theme.soft, whiteSpace: "nowrap" }}>{it.date || ""}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </>
  );
}

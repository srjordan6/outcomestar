/**
 * ThemedSite.tsx — v6 (2026-08-24): landing page composed from the shared
 * showcase kit. v3 "excitement kit" (2026-07-09) merged onto v2 (hero photo +
 * latest-activity, 2026-07-06); v4 latest headline; v5 character avatar.
 *
 * v6 moves the page chrome to ThemedShell and the hero to ThemedHero so the
 * section pages render the same design. Every visual decision still comes
 * from GenericThemeTokens, never from code branches per theme key.
 *
 * Props contract identical to v2 — page.tsx, [lang]/page.tsx untouched.
 */

import type { PublicSiteConfig } from "@/lib/publicSite";
import type { GenericThemeTokens } from "@/lib/genericThemes";
import { formatLatest, type LatestActivity } from "@/lib/latestActivity";
import {
  bandEnergy, cardBaseFor, fxFlags, groupByPillar, panelShadow, readableOn, typeScale, type SectionRef,
} from "@/lib/showcaseKit";
import { ThemedShell } from "./ThemedShell";
import { ThemedHero } from "./ThemedHero";
import TrophyCase from "./TrophyCase";

export interface ThemedStrings {
  classOf: string;
  bandLabel: string;
  sections: SectionRef[];
  sectionsHeading: string;
  growNote: string;
  footer: string;
}

export function defaultStrings(site: PublicSiteConfig): ThemedStrings {
  return {
    classOf: site.graduation_year ? `Class of ${site.graduation_year}` : "",
    bandLabel: site.band_label,
    sections: site.sections,
    sectionsHeading: "Sections",
    growNote: "Content appears here as the family record grows.",
    footer:
      "Published with outcomestar. First name only appears on this page; no contact details are ever shown for minors.",
  };
}

/* --------------------------------------------------------------- component */

export function ThemedSite({
  site,
  theme,
  strings,
  langBadge,
  latest,
}: {
  site: PublicSiteConfig;
  theme: GenericThemeTokens;
  strings: ThemedStrings;
  langBadge?: string | null;
  currentLang?: string;
  latest?: LatestActivity | null;
}) {
  const [displayFont] = theme.fonts;
  const energy = bandEnergy(theme);
  const fx = fxFlags(theme);
  const T = typeScale(theme.layout);
  const pop = theme.pop ?? theme.accent;
  const cardBase = cardBaseFor(theme, T, fx, energy);

  /* One plate per entry on the record. The hero's shape is the data. */
  const totalEntries = strings.sections.reduce((n, s) => n + (s.count ?? 0), 0);

  return (
    <ThemedShell theme={theme} footerNote={strings.footer}>
      {/* latest-activity elevated to page headline (roadmap R2) */}
      {latest ? (
        <div
          className="os-hero"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            background: fx.panel ? theme.card : `${theme.accent}14`,
            border: fx.panel ? `3px solid ${theme.ink}` : `1px solid ${theme.accent}55`,
            borderLeft: fx.panel ? undefined : `6px solid ${theme.accent}`,
            borderRadius: fx.panel ? 10 : 12,
            boxShadow: fx.panel ? panelShadow(theme.ink, 4) : undefined,
            padding: "14px 18px",
            marginBottom: 32,
          }}
        >
          <span
            data-os-pulse
            style={{ width: 10, height: 10, borderRadius: 999, background: pop, display: "inline-block", animation: "os-pulse 1.6s ease-in-out infinite", flexShrink: 0 }}
          />
          <span style={{ color: theme.accent, fontSize: 11, letterSpacing: "0.22em", textTransform: "uppercase", fontWeight: 700, flexShrink: 0 }}>
            Latest
          </span>
          <span style={{ fontFamily: `'${displayFont}', serif`, fontSize: "clamp(15px, 2.4vw, 20px)", fontWeight: 600, color: theme.ink, lineHeight: 1.35 }}>
            {formatLatest(latest)}
          </span>
        </div>
      ) : (
        <p style={{ color: theme.accent, fontSize: 12, letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 600, marginBottom: 32 }}>
          {formatLatest(null)}
        </p>
      )}

      <ThemedHero
        site={site}
        theme={theme}
        variant="site"
        eyebrow={<>{strings.bandLabel}{langBadge ? ` \u00b7 ${langBadge}` : ""}</>}
        title={site.student_first_name}
        badge={theme.badge}
        chips={[strings.classOf, theme.headerNote, `${strings.sections.length} ${strings.sectionsHeading.toLowerCase()}`]}
        entries={totalEntries}
      />

      {/* --------------------------------------------- sections */}
      <section style={{ marginTop: 52 }}>
        <h2
          style={{
            fontFamily: `'${displayFont}', serif`,
            fontSize: T.h2,
            fontWeight: 600,
            letterSpacing: T.track,
            textAlign: fx.isPoster ? "center" : "left",
            transform: fx.panel ? "rotate(-0.6deg)" : undefined,
          }}
        >
          {strings.sectionsHeading}
        </h2>
        {groupByPillar(strings.sections).map((group) => (
          <div key={group.pillar} style={{ marginTop: T.rowGap }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <span style={{ color: theme.accent, fontSize: 12, letterSpacing: "0.18em", textTransform: "uppercase", fontWeight: 700 }}>
                {group.label}
              </span>
              <span style={{ flex: 1, height: 1, background: `${theme.accent}33` }} />
            </div>
            <div
              style={{
                marginTop: 12,
                display: "grid",
                gap: fx.isEditorial ? 0 : fx.panel ? 22 : T.gap,
                gridTemplateColumns: fx.isEditorial ? "minmax(0,1fr)" : "repeat(auto-fit, minmax(260px, 1fr))",
                ...(fx.isEditorial ? { maxWidth: "68ch" } : {}),
              }}
            >
              {group.items.map((s, i) => {
                const cardStyle: React.CSSProperties = { ...cardBase, animationDelay: `${0.08 * i}s` };
                if (fx.sticker) cardStyle.transform = `rotate(${i % 2 === 0 ? -1.3 : 1.1}deg)`;
                const n = s.count ?? 0;
                return (
                  <a key={s.code} href={`/${site.slug}/section/${s.code}`} className="os-card" style={cardStyle}>
                    {fx.foil ? <span className="os-foil" aria-hidden /> : null}
                    {fx.tape ? (
                      <span aria-hidden style={{ position: "absolute", top: -10, left: 24, width: 64, height: 20, background: `${pop}AA`, transform: "rotate(-4deg)", borderRadius: 2 }} />
                    ) : null}
                    {fx.hud ? (
                      <>
                        <span aria-hidden style={{ position: "absolute", top: 6, left: 6, width: 12, height: 12, borderTop: `2px solid ${theme.accent}`, borderLeft: `2px solid ${theme.accent}` }} />
                        <span aria-hidden style={{ position: "absolute", bottom: 6, right: 6, width: 12, height: 12, borderBottom: `2px solid ${theme.accent}`, borderRight: `2px solid ${theme.accent}` }} />
                      </>
                    ) : null}

                    {/* Entry count: the one number on the card that means
                       something. Editorial omits the chip; its rows already
                       state the count beneath the title. */}
                    {fx.isEditorial ? null : fx.burst ? (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          minWidth: 34,
                          height: 34,
                          padding: "0 10px",
                          background: n > 0 ? pop : "transparent",
                          color: n > 0 ? readableOn(pop) : theme.soft,
                          fontFamily: `'${displayFont}', sans-serif`,
                          fontSize: 15,
                          fontWeight: 700,
                          border: fx.panel ? `2.5px solid ${theme.ink}` : n > 0 ? "none" : `1px dashed ${theme.border}`,
                          borderRadius: fx.panel ? 8 : 999,
                          transform: `rotate(${i % 2 === 0 ? -6 : 5}deg)`,
                          boxShadow: fx.panel ? panelShadow(theme.ink, 2) : "none",
                        }}
                      >
                        {n > 0 ? n : "\u2014"}
                      </span>
                    ) : (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          minWidth: 30,
                          height: 26,
                          padding: "0 9px",
                          borderRadius: 999,
                          background: n > 0 ? `${theme.accent}1F` : "transparent",
                          border: `1px solid ${n > 0 ? theme.accent + "55" : theme.border}`,
                          color: n > 0 ? theme.accent : theme.soft,
                          fontSize: 12,
                          fontWeight: 700,
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {n > 0 ? n : "\u2014"}
                      </span>
                    )}

                    <h3 style={{ fontFamily: `'${displayFont}', serif`, fontSize: T.h3, fontWeight: 600, letterSpacing: T.track, lineHeight: 1.3, marginTop: fx.isEditorial ? 0 : 10 }}>
                      {s.title}
                    </h3>

                    {fx.bubble ? (
                      <span style={{ position: "relative", display: "block", marginTop: 14, background: theme.bg, border: `2px solid ${theme.ink}`, borderRadius: 14, padding: "10px 14px", fontSize: 13.5, color: theme.ink }}>
                        <span aria-hidden style={{ position: "absolute", bottom: -8, left: 26, width: 12, height: 12, background: theme.bg, borderRight: `2px solid ${theme.ink}`, borderBottom: `2px solid ${theme.ink}`, transform: "rotate(45deg)" }} />
                        {n > 0 ? `${n} ${n === 1 ? "entry" : "entries"}${s.preview ? " \u00b7 " + s.preview : ""}` : strings.growNote}
                      </span>
                    ) : (
                      <p style={{ color: n > 0 ? theme.ink : theme.soft, marginTop: fx.isEditorial ? 4 : 8, fontSize: T.body, lineHeight: 1.55, fontWeight: n > 0 ? 600 : 400 }}>
                        {n > 0 ? `${n} ${n === 1 ? "entry" : "entries"}${s.preview ? " \u00b7 " + s.preview : ""}` : strings.growNote}
                      </p>
                    )}
                  </a>
                );
              })}
            </div>
          </div>
        ))}
        {theme.band === "band_1_5" || theme.band === "band_6_12" ? (
          <TrophyCase slug={site.slug} accent={theme.accent} ink={theme.ink} card={theme.card} displayFont={displayFont} />
        ) : null}
      </section>
    </ThemedShell>
  );
}

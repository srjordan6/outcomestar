/**
 * ThemedSite.tsx — v3 "excitement kit" (2026-07-09), merged onto v2 (hero
 * photo + latest-activity pass, 2026-07-06). One token-driven component
 * renders all 30 catalog themes; every visual decision comes from
 * GenericThemeTokens, never from code branches per theme key.
 *
 * v2 features preserved: hero photo slot (site.hero_url) framed per
 * archetype, language selector, latest-activity headline, stat chips,
 * clickable section cards (/{slug}/section/{code}), logo footer.
 *
 * v3 adds the personality layer:
 *   HERO MOMENT   panel themes get an outlined name with hard shadow and a
 *                 rotated badge sticker; neon themes glow; stripes themes get
 *                 a diagonal band behind the name.
 *   FX LAYERS     halftone, scanlines, star field, tape strips, HUD corner
 *                 brackets, foil sheen — pure CSS, zero assets.
 *   SECTION CHIPS burst badges / ghost numerals / HUD brackets per archetype.
 *   MOTION        staggered pop-in, hover lift, LIVE pulse dot. CSS-only
 *                 (server component safe), disabled under
 *                 prefers-reduced-motion, scaled by the `energy` token.
 *
 * Props contract identical to v2 — page.tsx, [lang]/page.tsx untouched.
 */

import type { PublicSiteConfig } from "@/lib/publicSite";
import type { GenericThemeTokens, ThemeFx } from "@/lib/genericThemes";
import { formatLatest, type LatestActivity } from "@/lib/latestActivity";
import { LanguageSelector } from "./LanguageSelector";

export interface ThemedStrings {
  classOf: string;
  bandLabel: string;
  sections: Array<{ code: string; title: string; pillar?: string }>;
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

/* ---------------------------------------------------------------- helpers */

const has = (theme: GenericThemeTokens, f: ThemeFx) =>
  (theme.fx ?? []).includes(f);

function bandEnergy(theme: GenericThemeTokens): number {
  if (theme.energy) return theme.energy;
  if (theme.band === "band_6_12") return 3;
  if (theme.band === "band_1_5") return 2;
  return 1;
}

/** Hard comic-panel shadow, scaled by energy. */
const panelShadow = (ink: string, px: number) => `${px}px ${px}px 0 ${ink}`;

/* Five-pillar identity for grouping section cards (roadmap R1). */
const PILLAR_ORDER = ["personal", "academics", "extracurricular", "career", "higher_education"] as const;
const PILLAR_LABEL: Record<string, string> = {
  personal: "Personal",
  academics: "Academics",
  extracurricular: "Extracurricular",
  career: "Career",
  higher_education: "Higher Education",
};
function groupByPillar(
  sections: Array<{ code: string; title: string; pillar?: string }>,
): Array<{ pillar: string; label: string; items: Array<{ code: string; title: string; pillar?: string }> }> {
  const buckets = new Map<string, Array<{ code: string; title: string; pillar?: string }>>();
  for (const s of sections) {
    const p = s.pillar && PILLAR_LABEL[s.pillar] ? s.pillar : "personal";
    if (!buckets.has(p)) buckets.set(p, []);
    buckets.get(p)!.push(s);
  }
  const ordered = PILLAR_ORDER.filter((p) => buckets.has(p));
  for (const p of buckets.keys()) if (!ordered.includes(p as (typeof PILLAR_ORDER)[number])) ordered.push(p as (typeof PILLAR_ORDER)[number]);
  return ordered.map((p) => ({ pillar: p, label: PILLAR_LABEL[p] ?? p, items: buckets.get(p)! }));
}

/* --------------------------------------------------------------- component */

export function ThemedSite({
  site,
  theme,
  strings,
  langBadge,
  currentLang,
  latest,
}: {
  site: PublicSiteConfig;
  theme: GenericThemeTokens;
  strings: ThemedStrings;
  langBadge?: string | null;
  currentLang?: string;
  latest?: LatestActivity | null;
}) {
  const [displayFont, bodyFont] = theme.fonts;
  const fontHref = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(
    displayFont,
  ).replace(/%20/g, "+")}:wght@400;600;700&family=${encodeURIComponent(
    bodyFont,
  ).replace(/%20/g, "+")}:wght@400;500;600&display=swap`;

  const isPoster = theme.layout === "poster";
  const isDashboard = theme.layout === "dashboard";
  const isEditorial = theme.layout === "editorial";
  const hero =
    (site as PublicSiteConfig & { hero_url?: string | null }).hero_url ?? null;

  const energy = bandEnergy(theme);
  const pop = theme.pop ?? theme.accent;
  const accent2 = theme.accent2 ?? theme.accent;

  const panel = has(theme, "panel");
  const glow = has(theme, "glow");
  const neon = has(theme, "neon");
  const sticker = has(theme, "sticker");
  const hud = has(theme, "hud");
  const burst = has(theme, "burst");
  const bubble = has(theme, "bubble");
  const tape = has(theme, "tape");
  const foil = has(theme, "foil");
  const chalkFx = has(theme, "chalk");

  /* ---- hero photo frame per archetype (v2), comic override (v3) ---- */
  const photoFrame: React.CSSProperties = panel
    ? { borderRadius: 10, border: `4px solid ${theme.ink}`, boxShadow: panelShadow(theme.ink, 6) }
    : theme.layout === "editorial"
      ? { borderRadius: 10, border: `1px solid ${theme.border}`, boxShadow: `8px 8px 0 ${theme.accent}22` }
      : theme.layout === "dashboard"
        ? { borderRadius: 14, border: `2px solid ${theme.accent}`, boxShadow: glow ? `0 0 24px ${theme.accent}66` : `0 0 24px ${theme.accent}44` }
        : theme.layout === "poster"
          ? { borderRadius: 0, border: `6px solid ${theme.ink}` }
          : { borderRadius: "50%", border: `5px solid ${theme.accent}` };

  /* ---- hero name treatment (the theme's signature moment) ---- */
  const nameStyle: React.CSSProperties = {
    fontFamily: `'${displayFont}', serif`,
    fontSize: isPoster ? "clamp(60px, 12vw, 130px)" : "clamp(42px, 7vw, 78px)",
    lineHeight: 0.95,
    marginTop: 10,
    fontWeight: 700,
    position: "relative",
    zIndex: 2,
  };
  if (panel) {
    nameStyle.color = "#FFFFFF";
    nameStyle.WebkitTextStroke = `3px ${theme.ink}`;
    nameStyle.textShadow = `${5 + energy}px ${5 + energy}px 0 ${theme.accent}`;
    nameStyle.letterSpacing = "0.02em";
    nameStyle.transform = "rotate(-1.2deg)";
  } else if (neon) {
    nameStyle.textShadow = `0 0 8px ${theme.accent}, 0 0 22px ${theme.accent}, 0 0 46px ${theme.accent}66`;
  } else if (glow && (isDashboard || isPoster)) {
    nameStyle.textShadow = `0 0 26px ${theme.accent}55`;
  }

  /* ---- card treatment per archetype ---- */
  const cardBase: React.CSSProperties = {
    background: theme.card,
    position: "relative",
    padding: "20px 22px",
    color: theme.ink,
    textDecoration: "none",
    display: "block",
    transition:
      "transform .18s cubic-bezier(.34,1.56,.64,1), box-shadow .18s ease",
  };
  if (panel) {
    Object.assign(cardBase, {
      border: `3px solid ${theme.ink}`,
      borderRadius: 10,
      boxShadow: panelShadow(theme.ink, 4 + energy),
    });
  } else if (isDashboard) {
    Object.assign(cardBase, {
      border: `1px solid ${theme.border}`,
      borderTop: `4px solid ${theme.accent}`,
      borderRadius: 10,
      boxShadow: glow
        ? `0 0 0 1px ${theme.accent}22, 0 10px 30px rgba(0,0,0,.35)`
        : undefined,
    });
  } else if (theme.layout === "cards") {
    Object.assign(cardBase, {
      border: chalkFx ? `2px dashed ${theme.border}` : `1px solid ${theme.border}`,
      borderTop: `4px solid ${theme.accent}`,
      borderRadius: 16,
      boxShadow: "0 10px 26px rgba(20,24,32,.08)",
    });
  } else {
    Object.assign(cardBase, {
      border: `1px solid ${theme.border}`,
      borderTop: `4px solid ${theme.accent}`,
      borderRadius: 6,
    });
  }

  return (
    <div
      style={{
        background: theme.bg,
        color: theme.ink,
        minHeight: "100vh",
        fontFamily: `'${bodyFont}', system-ui, sans-serif`,
        position: "relative",
        overflow: "hidden",
        ...(theme.motif
          ? { backgroundImage: theme.motif, backgroundSize: "26px 26px" }
          : {}),
      }}
      data-energy={energy}
    >
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link rel="stylesheet" href={fontHref} />

      <style>{`
        @keyframes os-pop {
          0% { opacity: 0; transform: translateY(${10 + energy * 6}px) scale(.96); }
          70% { transform: translateY(-${energy}px) scale(1.01); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes os-drop {
          0% { opacity: 0; transform: translateY(-${20 + energy * 10}px) rotate(-3deg); }
          60% { transform: translateY(${energy * 2}px) rotate(1deg); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes os-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: .45; transform: scale(.8); }
        }
        @keyframes os-drift {
          from { background-position: 0 0; }
          to { background-position: 120px 240px; }
        }
        @keyframes os-sheen {
          0% { transform: translateX(-130%) skewX(-18deg); }
          100% { transform: translateX(230%) skewX(-18deg); }
        }
        .os-card { animation: os-pop .5s cubic-bezier(.34,1.56,.64,1) both; }
        .os-card:hover {
          transform: translateY(-${3 + energy * 2}px)${sticker ? " rotate(0deg)" : ""};
          ${panel ? `box-shadow: ${7 + energy}px ${7 + energy}px 0 ${theme.ink};` : ""}
          ${!panel && !isDashboard && !isEditorial ? "box-shadow: 0 18px 38px rgba(20,24,32,.14);" : ""}
          ${isDashboard && glow ? `box-shadow: 0 0 0 1px ${theme.accent}66, 0 14px 34px rgba(0,0,0,.45);` : ""}
          ${isEditorial ? "box-shadow: 0 8px 20px rgba(20,24,32,.10);" : ""}
        }
        .os-hero { animation: os-drop .6s cubic-bezier(.34,1.56,.64,1) both; }
        .os-badge { animation: os-drop .7s .15s cubic-bezier(.34,1.56,.64,1) both; }
        .os-foil { position: absolute; inset: 0; overflow: hidden; border-radius: inherit; pointer-events: none; }
        .os-foil::after {
          content: ""; position: absolute; top: 0; bottom: 0; width: 45%;
          background: linear-gradient(105deg, transparent, rgba(255,255,255,.55), transparent);
          animation: os-sheen 3.4s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .os-card, .os-hero, .os-badge { animation: none !important; }
          .os-card:hover { transform: none; }
          .os-foil::after, [data-os-stars], [data-os-pulse] { animation: none !important; }
        }
      `}</style>

      {/* full-page fx overlays */}
      {has(theme, "halftone") ? (
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            backgroundImage: `radial-gradient(${theme.ink}14 1.4px, transparent 2px)`,
            backgroundSize: "14px 14px",
            zIndex: 0,
          }}
        />
      ) : null}
      {has(theme, "scanlines") ? (
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            backgroundImage:
              "repeating-linear-gradient(0deg, rgba(0,0,0,.18) 0 1px, transparent 1px 3px)",
            zIndex: 3,
            mixBlendMode: "multiply",
          }}
        />
      ) : null}
      {has(theme, "stars") ? (
        <div
          aria-hidden
          data-os-stars
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            backgroundImage: `radial-gradient(${accent2}55 1px, transparent 1.6px), radial-gradient(${pop}44 1px, transparent 1.8px)`,
            backgroundSize: "90px 90px, 140px 140px",
            backgroundPosition: "0 0, 40px 60px",
            animation: "os-drift 60s linear infinite",
            zIndex: 0,
          }}
        />
      ) : null}

      <main
        className="mx-auto max-w-page px-6 pt-12 pb-24"
        style={{ position: "relative", zIndex: 1 }}
      >
        {/* accent band + language selector (v2) */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
          <div style={{ height: 6, background: theme.accent, borderRadius: 3, flex: 1 }} />
          <LanguageSelector theme={theme} />
        </div>
        {/* v4: latest-activity elevated to page headline (roadmap R2) */}
        {latest ? (
          <div
            className="os-hero"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              background: panel ? theme.card : `${theme.accent}14`,
              border: panel ? `3px solid ${theme.ink}` : `1px solid ${theme.accent}55`,
              borderLeft: panel ? undefined : `6px solid ${theme.accent}`,
              borderRadius: panel ? 10 : 12,
              boxShadow: panel ? panelShadow(theme.ink, 4) : undefined,
              padding: "14px 18px",
              marginBottom: 32,
            }}
          >
            <span
              data-os-pulse
              style={{
                width: 10,
                height: 10,
                borderRadius: 999,
                background: pop,
                display: "inline-block",
                animation: "os-pulse 1.6s ease-in-out infinite",
                flexShrink: 0,
              }}
            />
            <span
              style={{
                color: theme.accent,
                fontSize: 11,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              Latest
            </span>
            <span
              style={{
                fontFamily: `'${displayFont}', serif`,
                fontSize: "clamp(15px, 2.4vw, 20px)",
                fontWeight: 600,
                color: theme.ink,
                lineHeight: 1.35,
              }}
            >
              {formatLatest(latest)}
            </span>
          </div>
        ) : (
          <p
            style={{
              color: theme.accent,
              fontSize: 12,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              fontWeight: 600,
              marginBottom: 32,
            }}
          >
            {formatLatest(null)}
          </p>
        )}

        {/* ------------------------------------------------ hero */}
        <header
          className="os-hero"
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 32,
            alignItems: "center",
            flexDirection: isPoster ? "column" : "row",
            textAlign: isPoster ? "center" : "left",
            borderBottom: panel
              ? `4px solid ${theme.ink}`
              : `3px solid ${theme.accent}`,
            paddingBottom: 32,
            position: "relative",
          }}
        >
          {/* diagonal stripe band behind the hero */}
          {has(theme, "stripes") ? (
            <div
              aria-hidden
              style={{
                position: "absolute",
                left: isPoster ? "8%" : 0,
                right: isPoster ? "8%" : "20%",
                top: "36%",
                height: "clamp(40px, 8vw, 90px)",
                background: `repeating-linear-gradient(-45deg, ${theme.accent} 0 14px, ${accent2} 14px 28px)`,
                opacity: 0.16,
                transform: "rotate(-1.5deg)",
                borderRadius: 6,
                zIndex: 0,
              }}
            />
          ) : null}

          {hero ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={hero}
              alt={site.student_first_name}
              width={200}
              height={200}
              style={{
                width: 200,
                height: 200,
                objectFit: "cover",
                objectPosition: "center 15%",
                flexShrink: 0,
                position: "relative",
                zIndex: 2,
                transform: sticker || panel ? "rotate(-2deg)" : undefined,
                ...photoFrame,
              }}
            />
          ) : (
            <div
              aria-hidden
              style={{
                width: 200,
                height: 200,
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: `'${displayFont}', serif`,
                fontSize: 96,
                fontWeight: 700,
                color: theme.accent,
                background: theme.card,
                position: "relative",
                zIndex: 2,
                transform: sticker || panel ? "rotate(-2deg)" : undefined,
                ...photoFrame,
              }}
            >
              {site.student_first_name.slice(0, 1)}
            </div>
          )}

          <div style={{ flex: 1, minWidth: 260, position: "relative", zIndex: 2 }}>
            <p
              style={{
                color: theme.accent,
                fontSize: 12,
                letterSpacing: "0.28em",
                textTransform: "uppercase",
                fontWeight: 600,
              }}
            >
              {strings.bandLabel}
              {langBadge ? ` · ${langBadge}` : ""}
            </p>
            <h1 style={nameStyle}>{site.student_first_name}</h1>

            {/* rotated hero badge / sticker (v3) */}
            {theme.badge ? (
              <span
                className="os-badge"
                style={{
                  display: "inline-block",
                  marginTop: 14,
                  background: pop,
                  color: panel || isDashboard || neon ? "#141414" : "#FFFFFF",
                  fontFamily: `'${displayFont}', sans-serif`,
                  fontSize: 14,
                  letterSpacing: "0.1em",
                  padding: "7px 15px",
                  transform: "rotate(-2deg)",
                  border: panel ? `3px solid ${theme.ink}` : "none",
                  borderRadius: panel ? 6 : 999,
                  boxShadow: panel
                    ? panelShadow(theme.ink, 3)
                    : "0 6px 18px rgba(0,0,0,.18)",
                }}
              >
                {theme.badge}
              </span>
            ) : null}

            {/* stat chips (v2) */}
            <div
              style={{
                display: "flex",
                gap: 10,
                flexWrap: "wrap",
                marginTop: 16,
                justifyContent: isPoster ? "center" : "flex-start",
              }}
            >
              {[strings.classOf, theme.headerNote, `${strings.sections.length} ${strings.sectionsHeading.toLowerCase()}`]
                .filter(Boolean)
                .map((chip) => (
                  <span
                    key={chip}
                    style={{
                      background: theme.card,
                      border: panel ? `2px solid ${theme.ink}` : `1px solid ${theme.border}`,
                      color: theme.soft,
                      borderRadius: 999,
                      padding: "6px 14px",
                      fontSize: 13,
                    }}
                  >
                    {chip}
                  </span>
                ))}
            </div>
          </div>
        </header>

        {/* --------------------------------------------- sections */}
        <section style={{ marginTop: 52 }}>
          <h2
            style={{
              fontFamily: `'${displayFont}', serif`,
              fontSize: 30,
              fontWeight: 600,
              textAlign: isPoster ? "center" : "left",
              transform: panel ? "rotate(-0.6deg)" : undefined,
            }}
          >
            {strings.sectionsHeading}
          </h2>
          {groupByPillar(strings.sections).map((group) => (
          <div key={group.pillar} style={{ marginTop: 28 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 4,
              }}
            >
              <span
                style={{
                  color: theme.accent,
                  fontSize: 12,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  fontWeight: 700,
                }}
              >
                {group.label}
              </span>
              <span style={{ flex: 1, height: 1, background: `${theme.accent}33` }} />
            </div>
          <div
            style={{
              marginTop: 12,
              display: "grid",
              gap: panel ? 22 : 16,
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            }}
          >
            {group.items.map((s, i) => {
              const cardStyle: React.CSSProperties = {
                ...cardBase,
                animationDelay: `${0.08 * i}s`,
              };
              if (sticker) {
                cardStyle.transform = `rotate(${i % 2 === 0 ? -1.3 : 1.1}deg)`;
              }
              return (
                <a
                  key={s.code}
                  href={`/${site.slug}/section/${s.code}`}
                  className="os-card"
                  style={cardStyle}
                >
                  {foil ? <span className="os-foil" aria-hidden /> : null}

                  {/* tape strip */}
                  {tape ? (
                    <span
                      aria-hidden
                      style={{
                        position: "absolute",
                        top: -10,
                        left: 24,
                        width: 64,
                        height: 20,
                        background: `${pop}AA`,
                        transform: "rotate(-4deg)",
                        borderRadius: 2,
                      }}
                    />
                  ) : null}

                  {/* HUD corner brackets */}
                  {hud ? (
                    <>
                      <span aria-hidden style={{ position: "absolute", top: 6, left: 6, width: 12, height: 12, borderTop: `2px solid ${theme.accent}`, borderLeft: `2px solid ${theme.accent}` }} />
                      <span aria-hidden style={{ position: "absolute", bottom: 6, right: 6, width: 12, height: 12, borderBottom: `2px solid ${theme.accent}`, borderRight: `2px solid ${theme.accent}` }} />
                    </>
                  ) : null}

                  {/* section chip */}
                  {burst ? (
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        minWidth: 34,
                        height: 34,
                        background: i % 2 === 0 ? pop : accent2,
                        color: panel ? theme.ink : "#FFFFFF",
                        fontFamily: `'${displayFont}', sans-serif`,
                        fontSize: 15,
                        fontWeight: 700,
                        border: panel ? `2.5px solid ${theme.ink}` : "none",
                        borderRadius: panel ? 8 : 999,
                        transform: `rotate(${i % 2 === 0 ? -6 : 5}deg)`,
                        boxShadow: panel ? panelShadow(theme.ink, 2) : "none",
                      }}
                    >
                      {i + 1}
                    </span>
                  ) : isEditorial ? (
                    <>
                      <p
                        aria-hidden
                        style={{
                          position: "absolute",
                          top: 4,
                          right: 14,
                          fontFamily: `'${displayFont}', serif`,
                          fontSize: 54,
                          fontWeight: 700,
                          color: `${theme.accent}18`,
                          lineHeight: 1,
                          userSelect: "none",
                        }}
                      >
                        {i + 1}
                      </p>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: 30,
                          height: 30,
                          borderRadius: "50%",
                          background: theme.accent,
                          color: "#fff",
                          fontSize: 13,
                          fontWeight: 700,
                        }}
                      >
                        {i + 1}
                      </span>
                    </>
                  ) : (
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: 30,
                        height: 30,
                        borderRadius: "50%",
                        background: theme.accent,
                        color: isDashboard || isPoster ? theme.ink : "#fff",
                        fontSize: 13,
                        fontWeight: 700,
                      }}
                    >
                      {i + 1}
                    </span>
                  )}

                  <h3
                    style={{
                      fontFamily: `'${displayFont}', serif`,
                      fontSize: 20,
                      fontWeight: 600,
                      marginTop: 10,
                    }}
                  >
                    {s.title}
                  </h3>

                  {/* grow note — speech bubble when the theme talks in bubbles */}
                  {bubble ? (
                    <span
                      style={{
                        position: "relative",
                        display: "block",
                        marginTop: 14,
                        background: theme.bg,
                        border: `2px solid ${theme.ink}`,
                        borderRadius: 14,
                        padding: "10px 14px",
                        fontSize: 13.5,
                        color: theme.ink,
                      }}
                    >
                      <span
                        aria-hidden
                        style={{
                          position: "absolute",
                          bottom: -8,
                          left: 26,
                          width: 12,
                          height: 12,
                          background: theme.bg,
                          borderRight: `2px solid ${theme.ink}`,
                          borderBottom: `2px solid ${theme.ink}`,
                          transform: "rotate(45deg)",
                        }}
                      />
                      {strings.growNote}
                    </span>
                  ) : (
                    <p style={{ color: theme.soft, marginTop: 8, fontSize: 14 }}>
                      {strings.growNote}
                    </p>
                  )}
                </a>
              );
            })}
          </div>
          </div>
          ))}
        </section>

        {/* ----------------------------------------------- footer (v2) */}
        <footer
          style={{
            marginTop: 80,
            borderTop: panel
              ? `3px solid ${theme.ink}`
              : `1px solid ${theme.border}`,
            paddingTop: 24,
            color: theme.soft,
            fontSize: 12,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 20,
            flexWrap: "wrap",
          }}
        >
          <a href="https://outcomestar.app" style={{ display: "inline-flex", alignItems: "center", flexShrink: 0 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="https://outcomestar.app/outcomestar_logo_primary.png" alt="outcomestar" style={{ height: 56, background: "#fff", borderRadius: 8, padding: "6px 12px" }} />
          </a>
          <div style={{ textAlign: "right" as const, flexShrink: 0 }}>
            <p style={{ margin: 0 }}>
              <a href="https://outcomestar.app/user-agreement" style={{ color: theme.soft, textDecoration: "underline" }}>Terms</a>
              {" \u00b7 "}
              <a href="https://outcomestar.app/privacy-policy" style={{ color: theme.soft, textDecoration: "underline" }}>Privacy</a>
              {" \u00b7 "}
              <a href="https://outcomestar.app/disclaimer" style={{ color: theme.soft, textDecoration: "underline" }}>Disclaimer</a>
            </p>
            <p style={{ margin: "6px 0 0" }}>&copy; 2026 SRJ Consulting &amp; Services LLC</p>
            <p style={{ margin: "6px 0 0", maxWidth: 320, fontSize: 11, opacity: 0.85 }}>{strings.footer}</p>
          </div>
        </footer>
      </main>
    </div>
  );
}

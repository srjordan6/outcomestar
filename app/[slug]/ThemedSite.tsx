/**
 * ThemedSite.tsx — token-driven renderer for wizard-published family sites.
 *
 * Theme sprint v2 (2026-07-09): the "excitement kit" renderer. Still one
 * component for all 30 catalog themes — every visual decision comes from
 * GenericThemeTokens, never from code branches per theme key. What changed:
 *
 *   HERO MOMENT   full-personality header per archetype: comic panels get an
 *                 outlined name with hard shadow + rotated issue badge; neon
 *                 themes glow; dashboards get a LIVE telemetry strip; sticker
 *                 themes get a tilted badge sticker.
 *   FX LAYERS     halftone, scanlines, star field, stripe bands, tape strips,
 *                 corner brackets, foil sheen — pure CSS/SVG, zero assets.
 *   SECTION CHIPS burst badges / HUD brackets / colored dots per archetype
 *                 instead of one monospace numeral for everything.
 *   MOTION        staggered pop-in, hover lift, pulse dot. All animation is
 *                 CSS-only (server component safe) and fully disabled under
 *                 prefers-reduced-motion. `energy` token scales intensity.
 *
 * Props contract unchanged — page.tsx and [lang]/page.tsx need no edits.
 */

import type { PublicSiteConfig } from "@/lib/publicSite";
import type { GenericThemeTokens, ThemeFx } from "@/lib/genericThemes";

export interface ThemedStrings {
  classOf: string;
  bandLabel: string;
  sections: Array<{ code: string; title: string }>;
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

/* --------------------------------------------------------------- component */

export function ThemedSite({
  site,
  theme,
  strings,
  langBadge,
}: {
  site: PublicSiteConfig;
  theme: GenericThemeTokens;
  strings: ThemedStrings;
  langBadge?: string | null;
}) {
  const [displayFont, bodyFont] = theme.fonts;
  const fontHref = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(
    displayFont,
  ).replace(/%20/g, "+")}:wght@400;600;700&family=${encodeURIComponent(
    bodyFont,
  ).replace(/%20/g, "+")}:wght@400;500;600&display=swap`;

  const isPoster = theme.layout === "poster";
  const isDashboard = theme.layout === "dashboard";
  const isCards = theme.layout === "cards" || isDashboard;
  const isEditorial = theme.layout === "editorial";

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

  const pageStyle: React.CSSProperties = {
    background: theme.bg,
    color: theme.ink,
    minHeight: "100vh",
    fontFamily: `'${bodyFont}', system-ui, sans-serif`,
    position: "relative",
    overflow: "hidden",
  };
  const motifStyle: React.CSSProperties = theme.motif
    ? {
        backgroundImage: theme.motif,
        backgroundSize: theme.motif.includes("gradient(9")
          ? "28px 28px"
          : "26px 26px",
      }
    : {};

  /* ---- hero name treatment (the theme's signature moment) ---- */
  const nameStyle: React.CSSProperties = {
    fontFamily: `'${displayFont}', serif`,
    fontSize: isPoster ? "clamp(64px, 14vw, 150px)" : "clamp(44px, 8vw, 84px)",
    lineHeight: 0.95,
    marginTop: 12,
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
    nameStyle.color = theme.ink;
    nameStyle.textShadow = `0 0 8px ${theme.accent}, 0 0 22px ${theme.accent}, 0 0 46px ${theme.accent}66`;
  } else if (glow && (isDashboard || isPoster)) {
    nameStyle.textShadow = `0 0 26px ${theme.accent}55`;
  }

  /* ---- card treatment per archetype ---- */
  const cardBase: React.CSSProperties = {
    background: theme.card,
    position: "relative",
    padding: "20px 22px",
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
      borderRadius: 10,
      borderTop: `3px solid ${theme.accent}`,
      boxShadow: glow ? `0 0 0 1px ${theme.accent}22, 0 10px 30px rgba(0,0,0,.35)` : undefined,
    });
  } else if (theme.layout === "cards") {
    Object.assign(cardBase, {
      border: chalkFx ? `2px dashed ${theme.border}` : `1px solid ${theme.border}`,
      borderRadius: 18,
      boxShadow: "0 10px 26px rgba(20,24,32,.08)",
    });
  } else {
    Object.assign(cardBase, {
      border: `1px solid ${theme.border}`,
      borderRadius: 6,
      borderLeft: `4px solid ${theme.accent}`,
    });
  }

  return (
    <div style={{ ...pageStyle, ...motifStyle }} data-energy={energy}>
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

      {/* full-page overlays */}
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
        {/* ------------------------------------------------ hero */}
        <header
          className="os-hero"
          style={{
            borderBottom: panel
              ? `4px solid ${theme.ink}`
              : `3px solid ${theme.accent}`,
            paddingBottom: "2.2rem",
            textAlign: isPoster ? "center" : "left",
            position: "relative",
          }}
        >
          {/* diagonal stripe band behind the name */}
          {has(theme, "stripes") ? (
            <div
              aria-hidden
              style={{
                position: "absolute",
                left: isPoster ? "8%" : 0,
                right: isPoster ? "8%" : "30%",
                top: "38%",
                height: "clamp(40px, 8vw, 90px)",
                background: `repeating-linear-gradient(-45deg, ${theme.accent} 0 14px, ${accent2} 14px 28px)`,
                opacity: 0.18,
                transform: "rotate(-1.5deg)",
                borderRadius: 6,
                zIndex: 0,
              }}
            />
          ) : null}

          <p
            style={{
              color: theme.accent,
              fontSize: 12,
              letterSpacing: "0.28em",
              textTransform: "uppercase",
              fontWeight: 600,
              position: "relative",
              zIndex: 2,
            }}
          >
            {strings.bandLabel}
            {langBadge ? ` · ${langBadge}` : ""}
          </p>

          <h1 style={nameStyle}>{site.student_first_name}</h1>

          {/* rotated hero badge / sticker */}
          {theme.badge ? (
            <span
              className="os-badge"
              style={{
                position: isPoster ? "static" : "absolute",
                display: "inline-block",
                marginTop: isPoster ? 18 : 0,
                top: isPoster ? undefined : 6,
                right: isPoster ? undefined : 0,
                background: pop,
                color: panel || isDashboard || neon ? "#141414" : "#FFFFFF",
                fontFamily: `'${displayFont}', sans-serif`,
                fontSize: 14,
                letterSpacing: "0.1em",
                padding: "8px 16px",
                transform: `rotate(${isPoster ? -2 : 4}deg)`,
                border: panel ? `3px solid ${theme.ink}` : "none",
                borderRadius: panel ? 6 : 999,
                boxShadow: panel
                  ? panelShadow(theme.ink, 3)
                  : "0 6px 18px rgba(0,0,0,.18)",
                zIndex: 2,
              }}
            >
              {theme.badge}
            </span>
          ) : null}

          {strings.classOf ? (
            <p
              style={{
                color: theme.soft,
                marginTop: 16,
                fontSize: 18,
                position: "relative",
                zIndex: 2,
              }}
            >
              {strings.classOf}
            </p>
          ) : null}

          {/* dashboards get a telemetry strip instead of a caption */}
          {isDashboard && hud ? (
            <p
              style={{
                marginTop: 12,
                fontFamily: "monospace",
                fontSize: 12,
                letterSpacing: "0.14em",
                color: accent2,
                display: "flex",
                alignItems: "center",
                gap: 8,
                justifyContent: isPoster ? "center" : "flex-start",
              }}
            >
              <span
                data-os-pulse
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 999,
                  background: pop,
                  display: "inline-block",
                  animation: "os-pulse 1.6s ease-in-out infinite",
                }}
              />
              LIVE · {theme.headerNote.toUpperCase()}
            </p>
          ) : (
            <p style={{ color: theme.soft, marginTop: 6, fontSize: 13 }}>
              {theme.headerNote}
            </p>
          )}
        </header>

        {/* --------------------------------------------- sections */}
        <section style={{ marginTop: 56 }}>
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
          <div
            style={{
              marginTop: 24,
              display: "grid",
              gap: panel ? 22 : 16,
              gridTemplateColumns: isCards
                ? "repeat(auto-fit, minmax(260px, 1fr))"
                : "1fr",
            }}
          >
            {strings.sections.map((s, i) => {
              const cardStyle: React.CSSProperties = {
                ...cardBase,
                animationDelay: `${0.08 * i}s`,
              };
              if (sticker) {
                cardStyle.transform = `rotate(${i % 2 === 0 ? -1.3 : 1.1}deg)`;
              }
              return (
                <div key={s.code} className="os-card" style={cardStyle}>
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
                        border: panel ? `2.5px solid ${theme.ink}` : "none",
                        borderRadius: panel ? 8 : 999,
                        transform: `rotate(${i % 2 === 0 ? -6 : 5}deg)`,
                        boxShadow: panel ? panelShadow(theme.ink, 2) : "none",
                      }}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  ) : isEditorial ? (
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
                      {String(i + 1).padStart(2, "0")}
                    </p>
                  ) : (
                    <p
                      style={{
                        color: theme.accent,
                        fontSize: 11,
                        fontFamily: "monospace",
                        letterSpacing: "0.12em",
                      }}
                    >
                      {hud ? `[ ${String(i + 1).padStart(2, "0")} ]` : String(i + 1).padStart(2, "0")}
                    </p>
                  )}

                  <h3
                    style={{
                      fontFamily: `'${displayFont}', serif`,
                      fontSize: 20,
                      fontWeight: 600,
                      marginTop: 8,
                    }}
                  >
                    {s.title}
                  </h3>

                  {/* grow note — speech bubble when the theme talks in bubbles */}
                  {bubble ? (
                    <div
                      style={{
                        position: "relative",
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
                    </div>
                  ) : (
                    <p style={{ color: theme.soft, marginTop: 8, fontSize: 14 }}>
                      {strings.growNote}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* ----------------------------------------------- footer */}
        <footer
          style={{
            marginTop: 80,
            borderTop: panel
              ? `3px solid ${theme.ink}`
              : `1px solid ${theme.border}`,
            paddingTop: 24,
            color: theme.soft,
            fontSize: 12,
          }}
        >
          <p>{strings.footer}</p>
        </footer>
      </main>
    </div>
  );
}

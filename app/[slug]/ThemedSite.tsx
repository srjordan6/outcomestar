/**
 * ThemedSite.tsx — v2 (hero photo + richer visual pass, 2026-07-06).
 * One token-driven component renders all 30 catalog themes. v2 adds:
 *   - hero photo slot (site.hero_url) framed per layout archetype
 *   - stat strip (class year, band, section count)
 *   - accent flourishes: numbered chips, motif band, layered header
 * Accepts pre-translated strings for second-language sites.
 */

import type { PublicSiteConfig } from "@/lib/publicSite";
import type { GenericThemeTokens } from "@/lib/genericThemes";
import { LanguageSelector } from "./LanguageSelector";

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

export function ThemedSite({
  site,
  theme,
  strings,
  langBadge,
  currentLang,
}: {
  site: PublicSiteConfig;
  theme: GenericThemeTokens;
  strings: ThemedStrings;
  langBadge?: string | null;
  currentLang?: string;
}) {
  const [displayFont, bodyFont] = theme.fonts;
  const fontHref = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(
    displayFont,
  ).replace(/%20/g, "+")}:wght@400;600;700&family=${encodeURIComponent(
    bodyFont,
  ).replace(/%20/g, "+")}:wght@400;500;600&display=swap`;

  const isPoster = theme.layout === "poster";
  const isDashboard = theme.layout === "dashboard";
  const hero = (site as PublicSiteConfig & { hero_url?: string | null }).hero_url ?? null;

  const photoFrame: React.CSSProperties =
    theme.layout === "editorial"
      ? { borderRadius: 10, border: `1px solid ${theme.border}`, boxShadow: `8px 8px 0 ${theme.accent}22` }
      : theme.layout === "dashboard"
        ? { borderRadius: 14, border: `2px solid ${theme.accent}`, boxShadow: `0 0 24px ${theme.accent}44` }
        : theme.layout === "poster"
          ? { borderRadius: 0, border: `6px solid ${theme.ink}` }
          : { borderRadius: "50%", border: `5px solid ${theme.accent}` };

  return (
    <div
      style={{
        background: theme.bg,
        color: theme.ink,
        minHeight: "100vh",
        fontFamily: `'${bodyFont}', system-ui, sans-serif`,
        ...(theme.motif ? { backgroundImage: theme.motif, backgroundSize: "26px 26px" } : {}),
      }}
    >
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link rel="stylesheet" href={fontHref} />
      <main className="mx-auto max-w-page px-6 pt-12 pb-24">
        {/* accent band + language selector */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 40 }}>
          <div style={{ height: 6, background: theme.accent, borderRadius: 3, flex: 1 }} />
          <LanguageSelector theme={theme} />
        </div>

        <header
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 32,
            alignItems: "center",
            flexDirection: isPoster ? "column" : "row",
            textAlign: isPoster ? "center" : "left",
            borderBottom: `3px solid ${theme.accent}`,
            paddingBottom: 32,
          }}
        >
          {hero ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={hero}
              alt={site.student_first_name}
              width={200}
              height={200}
              style={{ width: 200, height: 200, objectFit: "cover", objectPosition: "center 15%", flexShrink: 0, ...photoFrame }}
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
                ...photoFrame,
              }}
            >
              {site.student_first_name.slice(0, 1)}
            </div>
          )}
          <div style={{ flex: 1, minWidth: 260 }}>
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
            <h1
              style={{
                fontFamily: `'${displayFont}', serif`,
                fontSize: isPoster ? "clamp(60px, 12vw, 130px)" : "clamp(42px, 7vw, 78px)",
                lineHeight: 0.95,
                marginTop: 10,
                fontWeight: 700,
              }}
            >
              {site.student_first_name}
            </h1>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16, justifyContent: isPoster ? "center" : "flex-start" }}>
              {[strings.classOf, theme.headerNote, `${strings.sections.length} ${strings.sectionsHeading.toLowerCase()}`]
                .filter(Boolean)
                .map((chip) => (
                  <span
                    key={chip}
                    style={{
                      background: theme.card,
                      border: `1px solid ${theme.border}`,
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

        <section style={{ marginTop: 52 }}>
          <h2
            style={{
              fontFamily: `'${displayFont}', serif`,
              fontSize: 30,
              fontWeight: 600,
              textAlign: isPoster ? "center" : "left",
            }}
          >
            {strings.sectionsHeading}
          </h2>
          <div
            style={{
              marginTop: 24,
              display: "grid",
              gap: 16,
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            }}
          >
            {strings.sections.map((s, i) => (
              <div
                key={s.code}
                style={{
                  background: theme.card,
                  border: `1px solid ${theme.border}`,
                  borderTop: `4px solid ${theme.accent}`,
                  borderRadius: theme.layout === "cards" ? 16 : isDashboard ? 10 : 6,
                  padding: "20px 22px",
                }}
              >
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
                <p style={{ color: theme.soft, marginTop: 8, fontSize: 14 }}>{strings.growNote}</p>
              </div>
            ))}
          </div>
        </section>

        <footer
          style={{
            marginTop: 80,
            borderTop: `1px solid ${theme.border}`,
            paddingTop: 24,
            color: theme.soft,
            fontSize: 12,
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <p>{strings.footer}</p>
          <p style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <a href="https://outcomestar.app" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: theme.accent, fontWeight: 700, textDecoration: "none" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="https://outcomestar.app/outcomestar_logo_primary.png" alt="outcomestar" style={{ height: 26, background: "#fff", borderRadius: 6, padding: "2px 6px" }} />
            </a>
            <span>
              &copy; 2026{" "}
              <a href="https://srjconsultingservices.com" style={{ color: theme.soft, textDecoration: "underline" }}>
                SRJ Consulting Services LLC
              </a>
            </span>
          </p>
        </footer>
      </main>
    </div>
  );
}

/**
 * ThemedSite.tsx â token-driven renderer for wizard-published family sites.
 * Theme sprint 2026-07-06: one component renders all 30 catalog themes from
 * GenericThemeTokens (lib/genericThemes). Four layout archetypes; every
 * visual decision comes from tokens, never from code branches per theme.
 * Accepts pre-translated strings for second-language sites.
 */

import type { PublicSiteConfig } from "@/lib/publicSite";
import type { GenericThemeTokens } from "@/lib/genericThemes";

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

  const pageStyle: React.CSSProperties = {
    background: theme.bg,
    color: theme.ink,
    minHeight: "100vh",
    fontFamily: `'${bodyFont}', system-ui, sans-serif`,
  };
  const motifStyle: React.CSSProperties = theme.motif
    ? { backgroundImage: theme.motif, backgroundSize: theme.motif.includes("gradient(9") ? "28px 28px" : "26px 26px" }
    : {};

  return (
    <div style={{ ...pageStyle, ...motifStyle }}>
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link rel="stylesheet" href={fontHref} />
      <main className="mx-auto max-w-page px-6 pt-12 pb-24">
        <header
          style={{
            borderBottom: `3px solid ${theme.accent}`,
            paddingBottom: "2rem",
            textAlign: isPoster ? "center" : "left",
          }}
        >
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
            {langBadge ? ` Â· ${langBadge}` : ""}
          </p>
          <h1
            style={{
              fontFamily: `'${displayFont}', serif`,
              fontSize: isPoster ? "clamp(64px, 14vw, 150px)" : "clamp(44px, 8vw, 84px)",
              lineHeight: 0.95,
              marginTop: 12,
              fontWeight: 700,
            }}
          >
            {site.student_first_name}
          </h1>
          {strings.classOf ? (
            <p style={{ color: theme.soft, marginTop: 14, fontSize: 18 }}>{strings.classOf}</p>
          ) : null}
          <p style={{ color: theme.soft, marginTop: 6, fontSize: 13 }}>{theme.headerNote}</p>
        </header>

        <section style={{ marginTop: 56 }}>
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
              gridTemplateColumns: isCards ? "repeat(auto-fit, minmax(260px, 1fr))" : "1fr",
            }}
          >
            {strings.sections.map((s, i) => (
              <div
                key={s.code}
                style={{
                  background: theme.card,
                  border: `1px solid ${theme.border}`,
                  borderRadius: theme.layout === "cards" ? 14 : isDashboard ? 10 : 6,
                  padding: "20px 22px",
                  borderLeft: theme.layout === "editorial" ? `4px solid ${theme.accent}` : undefined,
                }}
              >
                <p style={{ color: theme.accent, fontSize: 11, fontFamily: "monospace" }}>
                  {String(i + 1).padStart(2, "0")}
                </p>
                <h3
                  style={{
                    fontFamily: `'${displayFont}', serif`,
                    fontSize: 20,
                    fontWeight: 600,
                    marginTop: 4,
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
          }}
        >
          <p>{strings.footer}</p>
        </footer>
      </main>
    </div>
  );
}

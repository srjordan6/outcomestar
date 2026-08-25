/**
 * app/[slug]/ThemedShell.tsx — v1 (2026-08-24).
 *
 * The page chrome every showcase page shares: themed background + motif,
 * Google Fonts link, the motion/fx stylesheet, full-page fx overlays
 * (halftone, scanlines, star field), the accent band + language selector,
 * and the footer. ThemedSite (landing) and the section page both render
 * inside this, so a family's site is one site, not a themed landing page
 * with plain sub-pages behind it.
 *
 * Server component. No client JS beyond the LanguageSelector island.
 */

import type { GenericThemeTokens } from "@/lib/genericThemes";
import { bandEnergy, fontHrefFor, fxFlags, showcaseCss } from "@/lib/showcaseKit";
import { LanguageSelector } from "./LanguageSelector";

export function ThemedShell({
  theme,
  footerNote,
  children,
}: {
  theme: GenericThemeTokens;
  /** privacy line under the copyright; optional on sub-pages */
  footerNote?: string;
  children: React.ReactNode;
}) {
  const [, bodyFont] = theme.fonts;
  const energy = bandEnergy(theme);
  const fx = fxFlags(theme);
  const pop = theme.pop ?? theme.accent;
  const accent2 = theme.accent2 ?? theme.accent;

  return (
    <div
      style={{
        background: theme.bg,
        color: theme.ink,
        minHeight: "100vh",
        fontFamily: `'${bodyFont}', system-ui, sans-serif`,
        position: "relative",
        overflow: "hidden",
        ...(theme.motif ? { backgroundImage: theme.motif, backgroundSize: "26px 26px" } : {}),
      }}
      data-energy={energy}
      data-os-shell="v1"
    >
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link rel="stylesheet" href={fontHrefFor(theme)} />
      {/* raw HTML, not a text child: see showcaseCss() for why */}
      <style dangerouslySetInnerHTML={{ __html: showcaseCss(theme, energy, fx) }} />

      {fx.halftone ? (
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
      {fx.scanlines ? (
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            backgroundImage: "repeating-linear-gradient(0deg, rgba(0,0,0,.18) 0 1px, transparent 1px 3px)",
            zIndex: 3,
            mixBlendMode: "multiply",
          }}
        />
      ) : null}
      {fx.stars ? (
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

      <main className="mx-auto max-w-page px-6 pt-12 pb-24" style={{ position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
          <div style={{ height: 6, background: theme.accent, borderRadius: 3, flex: 1 }} />
          <LanguageSelector theme={theme} />
        </div>

        {children}

        <footer
          style={{
            marginTop: 80,
            borderTop: fx.panel ? `3px solid ${theme.ink}` : `1px solid ${theme.border}`,
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
            <img
              src="https://outcomestar.app/outcomestar_logo_primary.png"
              alt="outcomestar"
              style={{ height: 32, background: "#fff", borderRadius: 6, padding: "5px 10px", opacity: 0.9 }}
            />
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
            {footerNote ? (
              <p style={{ margin: "6px 0 0", maxWidth: 320, fontSize: 11, opacity: 0.85 }}>{footerNote}</p>
            ) : null}
          </div>
        </footer>
      </main>
    </div>
  );
}

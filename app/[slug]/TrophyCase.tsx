"use client";
/**
 * TrophyCase.tsx — v2 (2026-08-24). Virtual trophy case for the kids' bands.
 *
 * Client island: fetches derived achievement badges from
 * /public/site/{slug}/badges (public, no PII) and renders them. Badges are
 * derived server-side ONLY from records already made public, so the
 * three-layer visibility gate is honoured upstream — this component just draws.
 *
 * v2: the case is no longer one hardcoded sticker style on every theme. Each
 * badge takes the SAME archetype card treatment the rest of the page uses
 * (from showcaseKit): foil on trading-card, tape on scrapbook, HUD brackets on
 * mission-control, a flat editorial tile on resume-mode, and so on. It reads
 * the theme, not a fixed look, so a mission-control trophy case and a
 * comic-book trophy case are visibly different objects.
 */
import { useEffect, useState } from "react";
import type { GenericThemeTokens } from "@/lib/genericThemes";
import { bandEnergy, cardBaseFor, fxFlags, typeScale } from "@/lib/showcaseKit";

const API =
  process.env.NEXT_PUBLIC_FOCMS_API_URL ?? "https://focms-api.onrender.com";

type Badge = { icon: string; label: string; sub: string };

const ICON: Record<string, string> = {
  medal: "\u{1F3C5}", gold: "\u{1F947}", silver: "\u{1F948}", bronze: "\u{1F949}",
  lane: "\u{1F3CA}", bolt: "\u26A1", team: "\u{1F91D}", calendar: "\u{1F4C5}", trophy: "\u{1F3C6}",
};

export default function TrophyCase({
  slug,
  theme,
  displayFont,
}: {
  slug: string;
  theme: GenericThemeTokens;
  displayFont: string;
}) {
  const [badges, setBadges] = useState<Badge[] | null>(null);

  useEffect(() => {
    let live = true;
    fetch(`${API}/focms/v1/public/site/${encodeURIComponent(slug)}/badges`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (live && d && Array.isArray(d.badges)) setBadges(d.badges); })
      .catch(() => {});
    return () => { live = false; };
  }, [slug]);

  if (!badges || badges.length === 0) return null;

  const energy = bandEnergy(theme);
  const fx = fxFlags(theme);
  const T = typeScale(theme.layout);
  const cardBase = cardBaseFor(theme, T, fx, energy);
  const pop = theme.pop ?? theme.accent;

  return (
    <section style={{ marginTop: 48 }} aria-label="Trophy case">
      <h2
        style={{
          fontFamily: `'${displayFont}', serif`,
          fontSize: T.h2,
          fontWeight: 700,
          letterSpacing: T.track,
          color: theme.ink,
          marginBottom: 18,
          display: "flex",
          alignItems: "center",
          gap: 12,
          transform: fx.panel ? "rotate(-0.6deg)" : undefined,
        }}
      >
        Trophy Case
        <span aria-hidden style={{ flex: 1, height: fx.panel ? 3 : 2, background: `${theme.accent}33`, borderRadius: 2 }} />
      </h2>

      <div
        style={{
          display: "grid",
          gap: fx.panel ? 20 : T.gap,
          gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
        }}
      >
        {badges.map((b, i) => {
          const style: React.CSSProperties = {
            ...cardBase,
            padding: "18px 14px",
            textAlign: "center",
            animationDelay: `${Math.min(i, 12) * 0.05}s`,
          };
          if (fx.sticker) style.transform = `rotate(${i % 2 === 0 ? -1.6 : 1.4}deg)`;
          return (
            <div key={i} className="os-card" style={style}>
              {fx.foil ? <span className="os-foil" aria-hidden /> : null}
              {fx.tape ? (
                <span aria-hidden style={{ position: "absolute", top: -10, left: "50%", marginLeft: -30, width: 60, height: 18, background: `${pop}AA`, transform: "rotate(-3deg)", borderRadius: 2 }} />
              ) : null}
              {fx.hud ? (
                <>
                  <span aria-hidden style={{ position: "absolute", top: 6, left: 6, width: 11, height: 11, borderTop: `2px solid ${theme.accent}`, borderLeft: `2px solid ${theme.accent}` }} />
                  <span aria-hidden style={{ position: "absolute", bottom: 6, right: 6, width: 11, height: 11, borderBottom: `2px solid ${theme.accent}`, borderRight: `2px solid ${theme.accent}` }} />
                </>
              ) : null}
              <div style={{ fontSize: 40, lineHeight: 1 }} aria-hidden>
                {ICON[b.icon] ?? "\u2B50"}
              </div>
              <div
                style={{
                  marginTop: 10,
                  fontFamily: `'${displayFont}', sans-serif`,
                  fontSize: 14,
                  fontWeight: 700,
                  letterSpacing: T.track,
                  color: theme.ink,
                  lineHeight: 1.2,
                }}
              >
                {b.label}
              </div>
              <div style={{ marginTop: 4, fontSize: 11, color: theme.accent, fontWeight: 700, letterSpacing: "0.04em", textTransform: (fx.hud || fx.isEditorial) ? "uppercase" : undefined }}>
                {b.sub}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

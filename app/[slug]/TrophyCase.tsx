"use client";
/**
 * TrophyCase.tsx — v1 (roadmap A4). Virtual trophy case for the kids' bands.
 * Client island: fetches derived achievement badges from
 * /public/site/{slug}/badges (public, no PII) and renders a sticker-book row.
 * Badges are derived server-side ONLY from records already made public, so the
 * three-layer visibility gate is honored upstream — this component just draws.
 */
import { useEffect, useState } from "react";

const API =
  process.env.NEXT_PUBLIC_FOCMS_API_URL ?? "https://focms-api.onrender.com";

type Badge = { icon: string; label: string; sub: string };

const ICON: Record<string, string> = {
  medal: "🏅",
  gold: "🥇",
  silver: "🥈",
  bronze: "🥉",
  lane: "🏊",
  bolt: "⚡",
  team: "🤝",
  calendar: "📅",
  trophy: "🏆",
};

export default function TrophyCase({
  slug,
  accent,
  ink,
  card,
  displayFont,
}: {
  slug: string;
  accent: string;
  ink: string;
  card: string;
  displayFont: string;
}) {
  const [badges, setBadges] = useState<Badge[] | null>(null);

  useEffect(() => {
    let live = true;
    fetch(`${API}/focms/v1/public/site/${encodeURIComponent(slug)}/badges`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (live && d && Array.isArray(d.badges)) setBadges(d.badges);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [slug]);

  if (!badges || badges.length === 0) return null;

  return (
    <section style={{ marginTop: 40 }} aria-label="Trophy case">
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <span
          style={{
            fontFamily: `'${displayFont}', serif`,
            fontSize: 24,
            fontWeight: 700,
            color: ink,
          }}
        >
          Trophy Case
        </span>
        <span style={{ flex: 1, height: 2, background: `${accent}33`, borderRadius: 2 }} />
      </div>
      <div
        style={{
          display: "grid",
          gap: 14,
          gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
        }}
      >
        {badges.map((b, i) => (
          <div
            key={i}
            style={{
              background: card,
              border: `2.5px solid ${ink}`,
              borderRadius: 16,
              boxShadow: `4px 4px 0 ${ink}`,
              padding: "16px 14px",
              textAlign: "center",
              transform: `rotate(${i % 2 === 0 ? -1.5 : 1.3}deg)`,
            }}
          >
            <div style={{ fontSize: 38, lineHeight: 1 }} aria-hidden>
              {ICON[b.icon] ?? "⭐"}
            </div>
            <div
              style={{
                marginTop: 8,
                fontFamily: `'${displayFont}', sans-serif`,
                fontSize: 14,
                fontWeight: 700,
                color: ink,
                lineHeight: 1.2,
              }}
            >
              {b.label}
            </div>
            <div style={{ marginTop: 3, fontSize: 11, color: accent, fontWeight: 600 }}>
              {b.sub}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

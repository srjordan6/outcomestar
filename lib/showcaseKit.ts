/**
 * lib/showcaseKit.ts — v1 (2026-08-24). The showcase design language as
 * pure functions.
 *
 * Everything here used to live inline in ThemedSite.tsx, which meant the
 * landing page had the personality layer (fx overlays, archetype card
 * treatment, hero name treatment, motion) and the section pages had none of
 * it. Extracting the helpers lets ThemedShell / ThemedHero / the section
 * page all draw from one source, so a family's site reads as one site.
 *
 * Nothing in this file branches on a theme key. Every decision is a token.
 */

import type { GenericThemeTokens, ThemeFx } from "@/lib/genericThemes";

export const has = (theme: GenericThemeTokens, f: ThemeFx) =>
  (theme.fx ?? []).includes(f);

export function bandEnergy(theme: GenericThemeTokens): number {
  if (theme.energy) return theme.energy;
  if (theme.band === "band_6_12") return 3;
  if (theme.band === "band_1_5") return 2;
  return 1;
}

/**
 * Per-archetype type scale and density. Editorial is set denser and tighter
 * because its reader is scanning for specifics; poster is set loud because
 * its reader is being handed a statement.
 */
export function typeScale(layout: GenericThemeTokens["layout"]) {
  switch (layout) {
    case "poster":
      return { h2: 40, h3: 23, body: 14.5, pad: "22px 24px", gap: 18, rowGap: 34, track: "-.02em" };
    case "editorial":
      return { h2: 25, h3: 17, body: 14, pad: "15px 0", gap: 0, rowGap: 26, track: "-.005em" };
    case "dashboard":
      return { h2: 26, h3: 18, body: 13.5, pad: "18px 19px", gap: 13, rowGap: 28, track: "-.01em" };
    default: // cards
      return { h2: 29, h3: 19.5, body: 14, pad: "20px 22px", gap: 16, rowGap: 30, track: "-.015em" };
  }
}
export type TypeScale = ReturnType<typeof typeScale>;

/** Hard comic-panel shadow, scaled by energy. */
export const panelShadow = (ink: string, px: number) => `${px}px ${px}px 0 ${ink}`;

/** Readable text colour for a given background, by contrast, not by fx flag. */
export function readableOn(bg: string): string {
  const h = bg.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h.slice(0, 6), 16);
  if (!Number.isFinite(n)) return "#FFFFFF";
  const srgb = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  const L = 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
  return 1.05 / (L + 0.05) >= (L + 0.05) / 0.05 ? "#FFFFFF" : "#141414";
}

/** Derived from the background itself, not from which fx flags are set. */
export const isDarkBg = (theme: GenericThemeTokens) => readableOn(theme.bg) === "#FFFFFF";

export function fontHrefFor(theme: GenericThemeTokens): string {
  const [displayFont, bodyFont] = theme.fonts;
  return `https://fonts.googleapis.com/css2?family=${encodeURIComponent(displayFont).replace(/%20/g, "+")}:wght@400;600;700&family=${encodeURIComponent(bodyFont).replace(/%20/g, "+")}:wght@400;500;600&display=swap`;
}

/* Five-pillar identity for grouping section cards. */
export const PILLAR_ORDER = ["personal", "academics", "extracurricular", "career", "higher_education"] as const;
export const PILLAR_LABEL: Record<string, string> = {
  personal: "Personal",
  academics: "Academics",
  extracurricular: "Extracurricular",
  career: "Career",
  higher_education: "Higher Education",
};
export type SectionRef = { code: string; title: string; pillar?: string; count?: number; preview?: string | null };

export function groupByPillar(sections: SectionRef[]): Array<{ pillar: string; label: string; items: SectionRef[] }> {
  const buckets = new Map<string, SectionRef[]>();
  for (const s of sections) {
    const p = s.pillar && PILLAR_LABEL[s.pillar] ? s.pillar : "personal";
    if (!buckets.has(p)) buckets.set(p, []);
    buckets.get(p)!.push(s);
  }
  const ordered: string[] = PILLAR_ORDER.filter((p) => buckets.has(p));
  for (const p of buckets.keys()) if (!ordered.includes(p)) ordered.push(p);
  return ordered.map((p) => ({ pillar: p, label: PILLAR_LABEL[p] ?? p, items: buckets.get(p)! }));
}

/** All the fx switches a renderer needs, read once. */
export function fxFlags(theme: GenericThemeTokens) {
  return {
    panel: has(theme, "panel"),
    glow: has(theme, "glow"),
    neon: has(theme, "neon"),
    sticker: has(theme, "sticker"),
    hud: has(theme, "hud"),
    burst: has(theme, "burst"),
    bubble: has(theme, "bubble"),
    tape: has(theme, "tape"),
    foil: has(theme, "foil"),
    chalk: has(theme, "chalk"),
    halftone: has(theme, "halftone"),
    scanlines: has(theme, "scanlines"),
    stars: has(theme, "stars"),
    stripes: has(theme, "stripes"),
    isPoster: theme.layout === "poster",
    isDashboard: theme.layout === "dashboard",
    isEditorial: theme.layout === "editorial",
    isCards: theme.layout === "cards",
  };
}
export type FxFlags = ReturnType<typeof fxFlags>;

/**
 * The motion + fx stylesheet. Injected with dangerouslySetInnerHTML, NOT as
 * a text child: React escapes text children (`""` -> `&quot;&quot;`), but a
 * <style> element is raw text in HTML so the browser never decodes it. The
 * server DOM then holds `&quot;` where the client expects `"`, which was the
 * hydration mismatch (#425 -> #418 -> #423 -> intermittent #329) on every
 * showcase page. Raw HTML injection makes server and client byte-identical.
 */
export function showcaseCss(theme: GenericThemeTokens, energy: number, fx: FxFlags): string {
  return `
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
      transform: translateY(-${3 + energy * 2}px)${fx.sticker ? " rotate(0deg)" : ""};
      ${fx.panel ? `box-shadow: ${7 + energy}px ${7 + energy}px 0 ${theme.ink};` : ""}
      ${!fx.panel && !fx.isDashboard && !fx.isEditorial ? "box-shadow: 0 18px 38px rgba(20,24,32,.14);" : ""}
      ${fx.isDashboard && fx.glow ? `box-shadow: 0 0 0 1px ${theme.accent}66, 0 14px 34px rgba(0,0,0,.45);` : ""}
      ${fx.isEditorial ? "box-shadow: 0 8px 20px rgba(20,24,32,.10);" : ""}
    }
    .os-hero { animation: os-drop .6s cubic-bezier(.34,1.56,.64,1) both; }
    /* on a phone the hero stacks, the stage sits under the type, and the
       side-weighted veil no longer covers it: add a centred one */
    .os-veil-m { display: none; }
    @media (max-width: 720px) { .os-veil-m { display: block; } }
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
  `;
}

/** Card treatment per archetype: the same object the landing grid uses. */
export function cardBaseFor(theme: GenericThemeTokens, T: TypeScale, fx: FxFlags, energy: number): React.CSSProperties {
  const base: React.CSSProperties = {
    background: fx.isEditorial ? "transparent" : theme.card,
    position: "relative",
    padding: T.pad,
    color: theme.ink,
    textDecoration: "none",
    display: "block",
    transition: "transform .18s cubic-bezier(.34,1.56,.64,1), box-shadow .18s ease",
  };
  if (fx.isEditorial) {
    Object.assign(base, { border: "none", borderBottom: `1px solid ${theme.border}`, borderRadius: 0 });
  } else if (fx.panel) {
    Object.assign(base, { border: `3px solid ${theme.ink}`, borderRadius: 10, boxShadow: panelShadow(theme.ink, 4 + energy) });
  } else if (fx.isDashboard) {
    Object.assign(base, {
      border: `1px solid ${theme.border}`,
      borderTop: `4px solid ${theme.accent}`,
      borderRadius: 10,
      boxShadow: fx.glow ? `0 0 0 1px ${theme.accent}22, 0 10px 30px rgba(0,0,0,.35)` : undefined,
    });
  } else if (fx.isCards) {
    Object.assign(base, {
      border: fx.chalk ? `2px dashed ${theme.border}` : `1px solid ${theme.border}`,
      borderTop: `4px solid ${theme.accent}`,
      borderRadius: 16,
      boxShadow: "0 10px 26px rgba(20,24,32,.08)",
    });
  } else {
    Object.assign(base, { border: `1px solid ${theme.border}`, borderTop: `4px solid ${theme.accent}`, borderRadius: 6 });
  }
  return base;
}

/** Hero photo / avatar frame per archetype. */
export function photoFrameFor(theme: GenericThemeTokens, fx: FxFlags): React.CSSProperties {
  if (fx.panel) return { borderRadius: 10, border: `4px solid ${theme.ink}`, boxShadow: panelShadow(theme.ink, 6) };
  if (fx.isEditorial) return { borderRadius: 10, border: `1px solid ${theme.border}`, boxShadow: `8px 8px 0 ${theme.accent}22` };
  if (fx.isDashboard) return { borderRadius: 14, border: `2px solid ${theme.accent}`, boxShadow: fx.glow ? `0 0 24px ${theme.accent}66` : `0 0 24px ${theme.accent}44` };
  if (fx.isPoster) return { borderRadius: 0, border: `6px solid ${theme.ink}` };
  return { borderRadius: "50%", border: `5px solid ${theme.accent}` };
}

/**
 * The theme's signature type moment, applied to whatever the page's one big
 * heading is: the student's name on the landing page, the section title on
 * a section page. `size` is the clamp() expression.
 */
export function nameStyleFor(theme: GenericThemeTokens, fx: FxFlags, energy: number, size: string): React.CSSProperties {
  const [displayFont] = theme.fonts;
  const s: React.CSSProperties = {
    fontFamily: `'${displayFont}', serif`,
    fontSize: size,
    lineHeight: 0.95,
    marginTop: 10,
    fontWeight: 700,
    position: "relative",
    zIndex: 2,
  };
  if (fx.panel) {
    s.color = "#FFFFFF";
    s.WebkitTextStroke = `3px ${theme.ink}`;
    s.textShadow = `${5 + energy}px ${5 + energy}px 0 ${theme.accent}`;
    s.letterSpacing = "0.02em";
    s.transform = "rotate(-1.2deg)";
  } else if (fx.neon) {
    s.textShadow = `0 0 8px ${theme.accent}, 0 0 22px ${theme.accent}, 0 0 46px ${theme.accent}66`;
  } else if (fx.glow && (fx.isDashboard || fx.isPoster)) {
    s.textShadow = `0 0 26px ${theme.accent}55`;
  }
  return s;
}

/**
 * Keeps type legible over the hero stage without burying it. The veil is
 * centred on the identity block (left third on row layouts), so the right
 * side, where the stage sits, stays nearly clear.
 *
 * Some themes set bg to a gradient, where appending an alpha suffix would
 * produce garbage; those fall back to a plain fade.
 */
export function heroVeilMobile(theme: GenericThemeTokens): string {
  const bgIsHex = /^#[0-9a-fA-F]{6}$/.test(theme.bg.trim());
  if (bgIsHex) return `radial-gradient(80% 70% at 50% 50%, ${theme.bg}CC 30%, ${theme.bg}66 70%, ${theme.bg}00 100%)`;
  return `radial-gradient(80% 70% at 50% 50%, ${isDarkBg(theme) ? "rgba(0,0,0,.5)" : "rgba(255,255,255,.6)"} 30%, rgba(0,0,0,0) 100%)`;
}

export function heroVeilFor(theme: GenericThemeTokens, poster: boolean): string {
  const bgIsHex = /^#[0-9a-fA-F]{6}$/.test(theme.bg.trim());
  const dark = isDarkBg(theme);
  const cx = poster ? "50%" : "30%";
  if (bgIsHex) {
    return poster
      ? `radial-gradient(110% 80% at ${cx} 46%, ${theme.bg}E0 22%, ${theme.bg}99 58%, ${theme.bg}40 100%)`
      : `radial-gradient(90% 90% at ${cx} 50%, ${theme.bg}D4 18%, ${theme.bg}8C 50%, ${theme.bg}1A 100%)`;
  }
  return `radial-gradient(110% 80% at ${cx} 46%, rgba(0,0,0,0) 24%, ${dark ? "rgba(0,0,0,.4)" : "rgba(255,255,255,.5)"} 100%)`;
}

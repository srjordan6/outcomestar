/**
 * lib/genericThemes.ts â full theme-token registry for wizard-published sites.
 *
 * Theme sprint (2026-07-06): all 30 themes across the three age bands ship as
 * DESIGN TOKENS rendered by one parameterized component (ThemedSite). A theme
 * is data, not code â commercial-viability rule "schema-as-data". Four layout
 * archetypes cover the catalog:
 *   editorial  â serif magazine column (13-18 professional looks)
 *   dashboard  â dark telemetry/stat panels (mission-control family)
 *   cards      â playful rounded card grid (1-5 and 6-12 looks)
 *   poster     â big display type, bold blocks (studio/spotlight/arcade)
 */

export type ThemeLayout = "editorial" | "dashboard" | "cards" | "poster";

export interface GenericThemeTokens {
  key: string;
  band: "band_1_5" | "band_6_12" | "band_13_18";
  layout: ThemeLayout;
  /** Google Fonts: [display, body] */
  fonts: [string, string];
  bg: string;        // page background (css color or gradient)
  ink: string;       // primary text
  soft: string;      // muted text
  card: string;      // card/panel background
  accent: string;    // accent color
  border: string;    // card border
  motif?: string;    // optional css background-image pattern for the page
  headerNote: string;
}

const T = (t: GenericThemeTokens) => t;

export const GENERIC_THEMES: Record<string, GenericThemeTokens> = {
  /* ---------------- band_1_5 Â· Family Memory Book ---------------- */
  sketchbook: T({ key: "sketchbook", band: "band_1_5", layout: "cards", fonts: ["Caveat", "Nunito"], bg: "#FDFBF7", ink: "#3B3A36", soft: "#8A867C", card: "#FFFFFF", accent: "#E8945A", border: "#E5DFD2", motif: "radial-gradient(#E5DFD2 1px, transparent 1px)", headerNote: "Watercolor, hand-drawn" }),
  storybook: T({ key: "storybook", band: "band_1_5", layout: "cards", fonts: ["Lora", "Source Serif 4"], bg: "#FFF9F0", ink: "#4A3728", soft: "#9B8570", card: "#FFFFFF", accent: "#B5651D", border: "#EADFCE", headerNote: "Picture-book pages, gentle serif" }),
  nursery: T({ key: "nursery", band: "band_1_5", layout: "cards", fonts: ["Quicksand", "Nunito"], bg: "#F7F5FB", ink: "#4E4A66", soft: "#948FB0", card: "#FFFFFF", accent: "#A78BC8", border: "#E6E1F2", headerNote: "Soft pastels, rounded shapes" }),
  scrapbook: T({ key: "scrapbook", band: "band_1_5", layout: "cards", fonts: ["Kalam", "Nunito"], bg: "#F6F1E7", ink: "#43392E", soft: "#8C8272", card: "#FFFDF8", accent: "#C0563E", border: "#DED4C2", motif: "repeating-linear-gradient(45deg, transparent 0 18px, rgba(192,86,62,.05) 18px 20px)", headerNote: "Taped photos, paper textures" }),
  "growth-chart": T({ key: "growth-chart", band: "band_1_5", layout: "cards", fonts: ["Fredoka", "Nunito"], bg: "#F2F8F4", ink: "#2F4A3A", soft: "#7B9787", card: "#FFFFFF", accent: "#3E9C6B", border: "#D8E8DE", motif: "repeating-linear-gradient(0deg, transparent 0 46px, rgba(62,156,107,.12) 46px 48px)", headerNote: "Ruler motifs, milestone markers" }),
  "toy-box": T({ key: "toy-box", band: "band_1_5", layout: "cards", fonts: ["Baloo 2", "Nunito"], bg: "#FFFDF5", ink: "#33324E", soft: "#83829B", card: "#FFFFFF", accent: "#E0473A", border: "#F0E9D4", headerNote: "Bright primary blocks" }),
  "picture-frame": T({ key: "picture-frame", band: "band_1_5", layout: "cards", fonts: ["Playfair Display", "Nunito"], bg: "#F4F2EE", ink: "#3B3B3B", soft: "#8B8B85", card: "#FFFFFF", accent: "#8A6F4D", border: "#DDD8CE", headerNote: "Gallery-wall photo grid" }),
  lullaby: T({ key: "lullaby", band: "band_1_5", layout: "dashboard", fonts: ["Comfortaa", "Nunito"], bg: "linear-gradient(180deg,#1B2143 0%,#2A3160 100%)", ink: "#EDEFFB", soft: "#A7ADD6", card: "rgba(255,255,255,.07)", accent: "#F3C86B", border: "rgba(255,255,255,.14)", motif: "radial-gradient(rgba(243,200,107,.35) 1px, transparent 1.6px)", headerNote: "Night-sky calm, stars" }),
  garden: T({ key: "garden", band: "band_1_5", layout: "cards", fonts: ["Lora", "Nunito"], bg: "#F4F8EF", ink: "#33442C", soft: "#7E9273", card: "#FFFFFF", accent: "#5C8A3C", border: "#DCE7D2", headerNote: "Botanical growth motifs" }),
  crayon: T({ key: "crayon", band: "band_1_5", layout: "poster", fonts: ["Gochi Hand", "Nunito"], bg: "#FFFFFF", ink: "#2E2A26", soft: "#7C766E", card: "#FFF8E8", accent: "#F0532D", border: "#F1E4C8", headerNote: "Kid-drawn strokes, bold color" }),

  /* -------------- band_6_12 Â· Developmental Portfolio -------------- */
  "mission-control": T({ key: "mission-control", band: "band_6_12", layout: "dashboard", fonts: ["Space Grotesk", "IBM Plex Mono"], bg: "#0B1120", ink: "#E4ECFF", soft: "#8CA0C6", card: "#111B31", accent: "#37C8F5", border: "#1E2C4A", motif: "linear-gradient(rgba(55,200,245,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(55,200,245,.05) 1px, transparent 1px)", headerNote: "Dark space telemetry, HUD readouts" }),
  "trading-card": T({ key: "trading-card", band: "band_6_12", layout: "cards", fonts: ["Rubik", "Inter"], bg: "#EEF1F7", ink: "#1E2433", soft: "#6D7691", card: "linear-gradient(160deg,#FFFFFF 0%,#F2F5FF 60%,#E8ECFB 100%)", accent: "#C8A24A", border: "#C8A24A", headerNote: "Foil-textured stat cards, rookie badges" }),
  arcade: T({ key: "arcade", band: "band_6_12", layout: "poster", fonts: ["Press Start 2P", "IBM Plex Mono"], bg: "#0D0B1E", ink: "#E9E6FF", soft: "#8F87C9", card: "#171334", accent: "#FF3E8A", border: "#2A2357", motif: "radial-gradient(rgba(255,62,138,.18) 1px, transparent 1.5px)", headerNote: "Neon pixel-art leaderboard" }),
  "comic-book": T({ key: "comic-book", band: "band_6_12", layout: "poster", fonts: ["Bangers", "Nunito"], bg: "#FFF9E8", ink: "#20242C", soft: "#6C7280", card: "#FFFFFF", accent: "#E43B2C", border: "#20242C", motif: "radial-gradient(rgba(32,36,44,.10) 1.2px, transparent 1.8px)", headerNote: "Halftone dots, action callouts" }),
  stadium: T({ key: "stadium", band: "band_6_12", layout: "dashboard", fonts: ["Oswald", "Inter"], bg: "#101418", ink: "#F2F5F7", soft: "#9AA6AE", card: "#1A2026", accent: "#3DDC5A", border: "#28313A", headerNote: "Sports broadcast graphics" }),
  "field-notes": T({ key: "field-notes", band: "band_6_12", layout: "editorial", fonts: ["Architects Daughter", "Inter"], bg: "#FBFAF6", ink: "#33393B", soft: "#7E8588", card: "#FFFFFF", accent: "#2F6F8F", border: "#DFE3E0", motif: "linear-gradient(rgba(47,111,143,.08) 1px, transparent 1px), linear-gradient(90deg, rgba(47,111,143,.08) 1px, transparent 1px)", headerNote: "Graph paper, hand-drawn annotations" }),
  "treasure-map": T({ key: "treasure-map", band: "band_6_12", layout: "cards", fonts: ["Pirata One", "Nunito"], bg: "#F3E9D2", ink: "#4A3520", soft: "#8D7A5C", card: "#FBF4E1", accent: "#9C2B1B", border: "#D8C7A4", headerNote: "Adventure chart, waypoints" }),
  "science-lab": T({ key: "science-lab", band: "band_6_12", layout: "editorial", fonts: ["Space Grotesk", "Inter"], bg: "#F5F8FA", ink: "#1F2A33", soft: "#68798A", card: "#FFFFFF", accent: "#0FA3A3", border: "#D8E2E8", headerNote: "Lab-notebook experiments" }),
  "game-day": T({ key: "game-day", band: "band_6_12", layout: "dashboard", fonts: ["Anton", "Inter"], bg: "#141210", ink: "#FBF6EE", soft: "#A79E8F", card: "#201C18", accent: "#F5A623", border: "#332C24", headerNote: "Scoreboard energy" }),
  clubhouse: T({ key: "clubhouse", band: "band_6_12", layout: "cards", fonts: ["Rubik", "Nunito"], bg: "#F1F4F1", ink: "#25332A", soft: "#71836F", card: "#FFFFFF", accent: "#1F6E43", border: "#D4DED4", headerNote: "Team locker-room boards" }),

  /* -------------- band_13_18 Â· Professional Launchpad -------------- */
  "resume-mode": T({ key: "resume-mode", band: "band_13_18", layout: "editorial", fonts: ["Source Serif 4", "Inter"], bg: "#FFFFFF", ink: "#161A1D", soft: "#5C646B", card: "#F7F8F9", accent: "#20456B", border: "#E3E7EA", headerNote: "Admissions-reader editorial" }),
  studio: T({ key: "studio", band: "band_13_18", layout: "poster", fonts: ["Bebas Neue", "Inter"], bg: "#111111", ink: "#F4F1EC", soft: "#9C968C", card: "#1C1C1C", accent: "#E33F2E", border: "#2C2C2C", headerNote: "Concert-poster typography" }),
  broadsheet: T({ key: "broadsheet", band: "band_13_18", layout: "editorial", fonts: ["Playfair Display", "Source Serif 4"], bg: "#FAF7F0", ink: "#1B1B1B", soft: "#6B665C", card: "#FFFFFF", accent: "#8C1D18", border: "#DCD5C6", headerNote: "Newspaper editorial layout" }),
  portfolio: T({ key: "portfolio", band: "band_13_18", layout: "cards", fonts: ["Inter", "Inter"], bg: "#FAFAFA", ink: "#121417", soft: "#6E7378", card: "#FFFFFF", accent: "#111827", border: "#E5E7EB", headerNote: "Gallery-grade project grid" }),
  blueprint: T({ key: "blueprint", band: "band_13_18", layout: "dashboard", fonts: ["IBM Plex Mono", "IBM Plex Sans"], bg: "#0E2A47", ink: "#DDEBFA", soft: "#8FB0CF", card: "#123357", accent: "#4FC3F7", border: "#1D406B", motif: "linear-gradient(rgba(79,195,247,.10) 1px, transparent 1px), linear-gradient(90deg, rgba(79,195,247,.10) 1px, transparent 1px)", headerNote: "Engineering drawings, cyan lines" }),
  varsity: T({ key: "varsity", band: "band_13_18", layout: "cards", fonts: ["Graduate", "Inter"], bg: "#F6F4EF", ink: "#232D3F", soft: "#6E7686", card: "#FFFFFF", accent: "#8E2A2A", border: "#D9D2C2", headerNote: "Recruitment profile, letterman accents" }),
  "command-brief": T({ key: "command-brief", band: "band_13_18", layout: "editorial", fonts: ["IBM Plex Sans", "IBM Plex Sans"], bg: "#F2F3F0", ink: "#1E2420", soft: "#66706A", card: "#FFFFFF", accent: "#3A5A40", border: "#D6DAD2", headerNote: "Service-academy briefing style" }),
  ledger: T({ key: "ledger", band: "band_13_18", layout: "editorial", fonts: ["Inter", "Inter"], bg: "#FFFFFF", ink: "#0A0A0A", soft: "#737373", card: "#FAFAFA", accent: "#0A0A0A", border: "#E5E5E5", headerNote: "Minimal monochrome precision" }),
  spotlight: T({ key: "spotlight", band: "band_13_18", layout: "poster", fonts: ["Cormorant Garamond", "Inter"], bg: "linear-gradient(180deg,#141114 0%,#221A22 100%)", ink: "#F5EFE6", soft: "#A99DA8", card: "rgba(255,255,255,.06)", accent: "#D9A441", border: "rgba(255,255,255,.14)", headerNote: "Stage-lit performance focus" }),
  summit: T({ key: "summit", band: "band_13_18", layout: "dashboard", fonts: ["Space Grotesk", "Inter"], bg: "#101820", ink: "#EAF1F5", soft: "#93A6B3", card: "#182430", accent: "#5FB49C", border: "#243444", motif: "repeating-linear-gradient(0deg, transparent 0 56px, rgba(95,180,156,.08) 56px 58px)", headerNote: "Expedition progress, elevation lines" }),
};

export function resolveGenericTheme(key?: string | null): GenericThemeTokens | null {
  if (!key) return null;
  return GENERIC_THEMES[key] ?? null;
}

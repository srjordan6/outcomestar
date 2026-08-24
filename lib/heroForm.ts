/**
 * lib/heroForm.ts — which hero backdrop each theme gets.
 *
 * Same principle as genericThemes.ts: this is DATA. One component reads
 * `form` and renders; nothing branches on a theme key.
 *
 *   "paper"  CSS layers only. NO WebGL, ever. Every band_1_5 theme uses this:
 *            that audience is grandparents on older tablets, and the job is
 *            warmth, not exploration. Three.js is never even requested.
 *   "column" plates stacked on a spine, time bottom to top
 *   "tower"  quarter-turn stack, widest mid-life
 *   "orbit"  plates on a swelling helix around a void
 */

export type HeroForm = "column" | "tower" | "orbit" | "paper";

const FORM: Record<string, HeroForm> = {
  // band_1_5 — paper only, no exceptions
  sketchbook: "paper", storybook: "paper", nursery: "paper", scrapbook: "paper",
  "growth-chart": "paper", "toy-box": "paper", "picture-frame": "paper",
  lullaby: "paper", garden: "paper", crayon: "paper",

  // band_6_12
  "mission-control": "orbit", "trading-card": "tower", arcade: "tower",
  "comic-book": "tower", stadium: "orbit", "field-notes": "column",
  "treasure-map": "tower", "science-lab": "column", "game-day": "orbit",
  clubhouse: "tower",

  // band_13_18
  "resume-mode": "column", studio: "tower", broadsheet: "column",
  portfolio: "tower", blueprint: "tower", varsity: "tower",
  "command-brief": "column", ledger: "column", spotlight: "orbit",
  summit: "orbit",
};

/** Falls back by band, then to paper — the cheapest option, never a crash. */
export function heroForm(themeKey?: string | null, band?: string | null): HeroForm {
  if (themeKey && FORM[themeKey]) return FORM[themeKey];
  if (band === "band_1_5") return "paper";
  if (band === "band_6_12") return "tower";
  if (band === "band_13_18") return "column";
  return "paper";
}

/** Bands 1-5 never pay for the 3D bundle. Check before loading anything. */
export function needsWebGL(themeKey?: string | null, band?: string | null): boolean {
  return heroForm(themeKey, band) !== "paper";
}

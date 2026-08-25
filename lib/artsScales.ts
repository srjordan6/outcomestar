/**
 * lib/artsScales.ts — v1 (2026-08-25).
 *
 * Performing arts have a measured record; it is just not kept the way sport
 * keeps one. A swimmer has a time. A musician has an adjudicated rating, a
 * chair, a graded exam level, a competition placing. All of those are
 * numbers that move in a direction, which means all of them can drive the
 * same progression hero — and none of them are stored anywhere commercial
 * music databases would look.
 *
 * This file is the vocabulary. Every scale is DATA, not a branch: a tenant
 * in Texas records UIL divisions, one in New York records NYSSMA levels, one
 * in Toronto records RCM grades, one in London records ABRSM marks. Adding a
 * country means adding a row here, never touching the renderer.
 *
 * Two things every scale must declare:
 *   direction  "lower" when 1 is the best result (rating, chair, placing)
 *              "higher" when the number climbs (marks, grades, points)
 *   parse/format  so "Division I", "I", and 1 are the same value, and the
 *              value counts back out in the form a musician recognises.
 */

export type Direction = "lower" | "higher";

export interface ArtsScale {
  key: string;
  /** what a parent would call it */
  label: string;
  direction: Direction;
  /** where this scale is used; shown as a hint, never a filter */
  region?: string;
  /** headline noun: "DIVISIONS", "CHAIRS", "POINTS" */
  unit: string;
  /** plural-aware verb for the headline: GAINED / HIGHER / FASTER */
  verb: string;
  /** label under the counter in the hero HUD */
  hud: string;
  /** best possible value, when the scale is bounded */
  best?: number;
  worst?: number;
  parse(raw: unknown): number | null;
  format(v: number): string;
}

const ROMAN = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII"];

function romanToInt(s: string): number | null {
  const i = ROMAN.indexOf(s.toUpperCase().trim());
  return i > 0 ? i : null;
}

/** Accepts 3, "3", "III", "Division III", "Div 3", "3rd" — all → 3. */
function parseRank(raw: unknown): number | null {
  if (raw == null || raw === "") return null;
  if (typeof raw === "number") return Number.isFinite(raw) ? raw : null;
  const s = String(raw).trim();
  const cleaned = s.replace(/^(division|div\.?|rating|chair|place|placing|grade|level)\s*/i, "").trim();
  const rom = romanToInt(cleaned.replace(/[^IVXivx]/g, ""));
  if (rom && /^[IVXivx]+$/.test(cleaned.replace(/[^IVXivx]/g, "")) && cleaned.length <= 4) return rom;
  const m = cleaned.match(/-?\d+(\.\d+)?/);
  return m ? parseFloat(m[0]) : null;
}

function parseNum(raw: unknown): number | null {
  if (raw == null || raw === "") return null;
  const n = typeof raw === "number" ? raw : parseFloat(String(raw).replace(/[^0-9.\-]/g, ""));
  return Number.isFinite(n) ? n : null;
}

/** m:ss.xx or ss.xx → seconds. Shared with swim; times are a scale too. */
export function parseTime(t?: unknown): number | null {
  if (t == null || t === "") return null;
  const m = String(t).trim().match(/^(?:(\d+):)?([0-5]?\d)(?:\.(\d+))?$/);
  if (!m) return null;
  return parseInt(m[1] || "0", 10) * 60 + parseInt(m[2] || "0", 10) + (m[3] ? parseFloat("0." + m[3]) : 0);
}

export function fmtTime(x: number): string {
  const m = Math.floor(x / 60), r = x - m * 60;
  return m ? `${m}:${r < 10 ? "0" : ""}${r.toFixed(2)}` : r.toFixed(2);
}

const ordinal = (n: number) => {
  const s = ["th", "st", "nd", "rd"], v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

export const ARTS_SCALES: Record<string, ArtsScale> = {
  /* ---------------- adjudicated ratings ---------------- */
  // UIL (Texas), and the same I-V shape used by most US state festivals.
  division: {
    key: "division", label: "Division rating (I\u2013V)", direction: "lower", region: "US state festival / UIL",
    unit: "DIVISION", verb: "BETTER", hud: "Results improved", best: 1, worst: 5,
    parse: parseRank, format: (v) => `Div ${ROMAN[Math.round(v)] || Math.round(v)}`,
  },
  // Superior / Excellent / Good, worded rather than numbered.
  rating_named: {
    key: "rating_named", label: "Rating (Superior\u2013Poor)", direction: "lower", region: "US festival",
    unit: "RATING", verb: "BETTER", hud: "Results improved", best: 1, worst: 5,
    parse: (raw) => {
      const s = String(raw ?? "").trim().toLowerCase();
      const named: Record<string, number> = { superior: 1, excellent: 2, good: 3, fair: 4, poor: 5 };
      if (named[s]) return named[s];
      return parseRank(raw);
    },
    format: (v) => ["", "Superior", "Excellent", "Good", "Fair", "Poor"][Math.round(v)] || String(Math.round(v)),
  },

  /* ---------------- placement ---------------- */
  chair: {
    key: "chair", label: "Chair placement", direction: "lower", region: "any seated ensemble",
    unit: "CHAIR", verb: "HIGHER", hud: "Seats gained", best: 1,
    parse: parseRank, format: (v) => `${ordinal(Math.round(v))} chair`,
  },
  placing: {
    key: "placing", label: "Competition placing", direction: "lower",
    unit: "PLACE", verb: "HIGHER", hud: "Placings improved", best: 1,
    parse: parseRank, format: (v) => ordinal(Math.round(v)),
  },

  /* ---------------- graded exams ---------------- */
  // RCM (Canada), ABRSM/Trinity (UK & Commonwealth), AMEB (Australia):
  // the level climbs, so higher is better. The mark within a level is its
  // own scale (see `mark`).
  grade_level: {
    key: "grade_level", label: "Graded exam level", direction: "higher", region: "RCM / ABRSM / Trinity / AMEB",
    unit: "GRADE", verb: "HIGHER", hud: "Grades cleared",
    parse: parseRank, format: (v) => `Grade ${Math.round(v)}`,
  },
  mark: {
    key: "mark", label: "Exam mark (out of 100)", direction: "higher", region: "RCM / ABRSM / Trinity",
    unit: "MARK", verb: "HIGHER", hud: "Marks improved", worst: 0, best: 100,
    parse: parseNum, format: (v) => `${Math.round(v)}`,
  },

  /* ---------------- generic ---------------- */
  score: {
    key: "score", label: "Score / points", direction: "higher",
    unit: "POINT", verb: "HIGHER", hud: "Scores improved",
    parse: parseNum, format: (v) => (Math.abs(v) >= 100 ? Math.round(v).toLocaleString() : String(Math.round(v * 10) / 10)),
  },
  time: {
    key: "time", label: "Time", direction: "lower",
    unit: "SECOND", verb: "FASTER", hud: "Events dropped",
    parse: parseTime, format: fmtTime,
  },
};

export const DEFAULT_SCALE = ARTS_SCALES.score;

export function scaleFor(key?: string | null): ArtsScale | null {
  if (!key) return null;
  return ARTS_SCALES[key] ?? null;
}

/**
 * Headline for the hero: "12 DIVISIONS BETTER", "357 SECONDS FASTER".
 * Pluralises the unit; the verb never pluralises.
 */
export function headlineUnit(scale: ArtsScale, total: number): string {
  const n = Math.round(Math.abs(total));
  return `${scale.unit}${n === 1 ? "" : "S"} ${scale.verb}`;
}

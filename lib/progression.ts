/**
 * lib/progression.ts — v2 (2026-08-25).
 *
 * Turns a section's items into a progression: for each named thing on the
 * record, where it started and where it is now. This is the data behind The
 * Drop, and it is deliberately not about swimming.
 *
 * v1 handled two shapes: swim times, and a generic higher-is-better number.
 * That was wrong for the performing arts, where the most meaningful numbers
 * are ranks — a Division I rating and 1st chair are the BEST results, and
 * both are small. A musician improving from Division IV to Division I was
 * being read as a decline.
 *
 * v2 resolves a SCALE for every section (lib/artsScales.ts), which carries
 * the direction, the parser and the formatter. Meta may name its scale
 * explicitly (`meta.scale`, set server-side) or it is inferred from the
 * field names present. Adding a country's grading system is a row in
 * artsScales, not a branch here.
 */

import { ARTS_SCALES, DEFAULT_SCALE, headlineUnit, scaleFor, type ArtsScale, type Direction } from "@/lib/artsScales";

export type { Direction };
export { parseTime, fmtTime } from "@/lib/artsScales";

export interface DropEvent {
  label: string;
  first: number;
  best: number;
  firstText: string;
  bestText: string;
  /** percent improved, positive */
  pct: number;
}

export interface Progression {
  direction: Direction;
  scale: ArtsScale;
  events: DropEvent[];        // improved only, biggest starting value first
  timed: number;              // entries that had both values
  improved: number;
  slower: number;             // entries now worse than where they started
  totalGain: number;          // always positive: distance travelled the right way
  years: [number, number] | null;
  /** "DIVISIONS BETTER", "SECONDS FASTER" */
  unit: string;
  /** label under the hero's counter */
  hud: string;
}

type Meta = Record<string, unknown> | null | undefined;
type ItemLike = { title: string; date?: string; meta?: Meta };

/**
 * Field pairs we understand, in priority order. The first pair present on
 * any item decides the scale for the whole section, unless meta.scale names
 * one outright.
 */
const PAIRS: Array<{ first: string; best: string; scale: string }> = [
  { first: "first_time", best: "best_time", scale: "time" },
  { first: "first_rating", best: "best_rating", scale: "division" },
  { first: "first_division", best: "best_division", scale: "division" },
  { first: "first_chair", best: "best_chair", scale: "chair" },
  { first: "first_placing", best: "best_placing", scale: "placing" },
  { first: "first_grade", best: "best_grade", scale: "grade_level" },
  { first: "first_mark", best: "best_mark", scale: "mark" },
  { first: "first_score", best: "best_score", scale: "score" },
  { first: "first_value", best: "best_value", scale: "score" },
];

function resolve(items: ItemLike[]): { scale: ArtsScale; first: string; best: string } | null {
  // Explicit wins: the server can name the scale, which is how a tenant
  // outside the US gets its own grading system without a code change.
  for (const it of items) {
    const named = it.meta && (it.meta as Record<string, unknown>)["scale"];
    if (typeof named === "string") {
      const s = scaleFor(named);
      if (s) {
        const pair = PAIRS.find((p) => p.scale === named) ?? { first: "first_value", best: "best_value" };
        return { scale: s, first: pair.first, best: pair.best };
      }
    }
  }
  // A student can be judged on more than one scale - a cellist with both a
  // chair and a division rating. One section renders one scale, so pick the
  // one the record supports best rather than whichever appears first.
  let winner: { scale: ArtsScale; first: string; best: string; n: number } | null = null;
  for (const p of PAIRS) {
    const n = items.filter((it) => {
      const m = it.meta as Record<string, unknown> | undefined | null;
      return !!m && m[p.first] != null && m[p.best] != null;
    }).length;
    if (n > 0 && (!winner || n > winner.n)) {
      winner = { scale: ARTS_SCALES[p.scale] ?? DEFAULT_SCALE, first: p.first, best: p.best, n };
    }
  }
  return winner ? { scale: winner.scale, first: winner.first, best: winner.best } : null;
}

/**
 * Build the progression. Returns null when fewer than `min` entries improved:
 * a record with two data points is not a drop, it is a table.
 */
export function progressionFrom(items: ItemLike[], min = 3): Progression | null {
  const r = resolve(items);
  if (!r) return null;
  const { scale } = r;
  const lower = scale.direction === "lower";

  const events: DropEvent[] = [];
  let timed = 0, slower = 0, totalGain = 0;
  const years: number[] = [];

  for (const it of items) {
    const m = (it.meta || {}) as Record<string, unknown>;
    const first = scale.parse(m[r.first]);
    const best = scale.parse(m[r.best]);
    if (first == null || best == null || !Number.isFinite(first) || !Number.isFinite(best)) continue;
    timed++;
    if (it.date && /^\d{4}/.test(it.date)) years.push(parseInt(it.date.slice(0, 4), 10));

    const gain = lower ? first - best : best - first;
    if (gain < 0) { slower++; continue; }
    if (gain === 0) continue;
    totalGain += gain;

    // What this row is: the piece, the event, the instrument — whatever the
    // record names it. Swim says "100 Free SCY"; music says "Cello · Region
    // Orchestra"; both are just a label.
    const label = [m["event"] ?? m["piece"] ?? m["work"] ?? it.title, m["course"] ?? m["instrument"] ?? m["ensemble"]]
      .filter((x) => typeof x === "string" && x.trim())
      .join(" \u00b7 ") || it.title;

    events.push({
      label,
      first, best,
      firstText: scale.format(first),
      bestText: scale.format(best),
      pct: first !== 0 ? Math.round((gain / Math.abs(first)) * 1000) / 10 : 0,
    });
  }

  if (events.length < min) return null;
  // Tallest first: on a rank scale the worst starting point is the biggest
  // number, which is exactly the tower with the furthest to fall.
  events.sort((a, b) => (lower ? b.first - a.first : b.best - a.best));

  return {
    direction: scale.direction, scale, events, timed,
    improved: events.length, slower, totalGain,
    years: years.length ? [Math.min(...years), Math.max(...years)] : null,
    unit: headlineUnit(scale, totalGain),
    hud: scale.hud,
  };
}

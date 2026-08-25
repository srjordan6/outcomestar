/**
 * lib/progression.ts — v1 (2026-08-24).
 *
 * Turns a section's items into a progression: for each event, where it
 * started and where it is now. This is the data behind The Drop, and it is
 * deliberately not about swimming. Any section whose item meta carries a
 * first and a current value can feed it:
 *
 *   direction "lower"   times — lower is better, values are m:ss.xx or ss.xx
 *   direction "higher"  scores, points, distances — higher is better
 *
 * The descriptor is inferred from the meta shape, never from the sport.
 */

export type Direction = "lower" | "higher";

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
  events: DropEvent[];        // improved events only, biggest first value first
  timed: number;              // events that had both values
  improved: number;
  slower: number;             // events whose current value is worse than first
  totalGain: number;          // sum of (first - best) for lower, (best - first) for higher
  years: [number, number] | null;
}

export function parseTime(t?: string | null): number | null {
  if (!t) return null;
  const m = String(t).trim().match(/^(?:(\d+):)?([0-5]?\d)(?:\.(\d+))?$/);
  if (!m) return null;
  const min = parseInt(m[1] || "0", 10);
  const sec = parseInt(m[2] || "0", 10);
  const frac = m[3] ? parseFloat("0." + m[3]) : 0;
  return min * 60 + sec + frac;
}

export function fmtTime(x: number): string {
  const m = Math.floor(x / 60), r = x - m * 60;
  return m ? `${m}:${r < 10 ? "0" : ""}${r.toFixed(2)}` : r.toFixed(2);
}

type ItemLike = {
  title: string;
  date?: string;
  meta?: { event?: string; course?: string; first_time?: string; best_time?: string; first_value?: number | string; best_value?: number | string } | null;
};

/**
 * Build the progression. Returns null when fewer than `min` events improved:
 * a record with two data points is not a drop, it is a table.
 */
export function progressionFrom(items: ItemLike[], min = 3): Progression | null {
  const direction: Direction = items.some((it) => it.meta?.first_time || it.meta?.best_time) ? "lower" : "higher";
  const events: DropEvent[] = [];
  let timed = 0, slower = 0, totalGain = 0;
  const years: number[] = [];

  for (const it of items) {
    const m = it.meta || {};
    let first: number | null, best: number | null, firstText: string, bestText: string;
    if (direction === "lower") {
      first = parseTime(m.first_time); best = parseTime(m.best_time);
      firstText = m.first_time ?? ""; bestText = m.best_time ?? "";
    } else {
      first = m.first_value != null ? Number(m.first_value) : null;
      best = m.best_value != null ? Number(m.best_value) : null;
      firstText = first != null ? String(m.first_value) : ""; bestText = best != null ? String(m.best_value) : "";
    }
    if (first == null || best == null || !Number.isFinite(first) || !Number.isFinite(best)) continue;
    timed++;
    if (it.date && /^\d{4}/.test(it.date)) years.push(parseInt(it.date.slice(0, 4), 10));
    const gain = direction === "lower" ? first - best : best - first;
    if (gain < 0) { slower++; continue; }
    if (gain === 0) continue;
    totalGain += gain;
    events.push({
      label: [m.event || it.title, m.course].filter(Boolean).join(" "),
      first, best, firstText, bestText,
      pct: Math.round((gain / first) * 1000) / 10,
    });
  }
  if (events.length < min) return null;
  events.sort((a, b) => (direction === "lower" ? b.first - a.first : b.best - a.best));
  return {
    direction, events, timed, improved: events.length, slower, totalGain,
    years: years.length ? [Math.min(...years), Math.max(...years)] : null,
  };
}

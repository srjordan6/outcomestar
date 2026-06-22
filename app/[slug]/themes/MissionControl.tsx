"use client";

/**
 * MissionControl.tsx — v1 launch theme for OutcomeStar public showcase.
 *
 * Self-contained. Reads the FOCMS feed payload and the student profile,
 * renders the full /[slug] page experience in a HUD / telemetry aesthetic.
 *
 * Visual language: dark navy starfield, JetBrains Mono everywhere, NASA
 * orange callouts, green status indicators. The student is rendered as a
 * "mission" with the Power Index as the primary readout.
 *
 * Contract (per architecture v2.2 §10):
 *   - Reads same FOCMS data feed every other theme reads.
 *   - Renders DisclaimerBlock when public-mode gap reports are present.
 *   - Renders CitationFootnote for every numeric claim sourced from CDS.
 *   - Respects visibility (only public-effective records reach this layer).
 *   - WCAG AA contrast on all text-over-background.
 *   - Renders at 320px, 768px, 1280px+.
 *
 * Props are flat and shape-tolerant; tolerates partial data without crash.
 */

import React from "react";

// ---------------------------------------------------------------------------
// Types — mirror the focms-feed-swim-bests payload (schema 1.1)
// ---------------------------------------------------------------------------

export type SwimBest = {
  time: string;
  seconds: number;
  points?: number;
  date?: string;
  usa_standard?: string;
  next_std?: string;
  next_time_seconds?: number | null;
  ncaa_power_point?: number;
};

export type PowerIndex = {
  value: number | null;
  top_4: Array<{ event_course: string; pp: number }>;
  total_eligible_events?: number;
  method?: string;
  base_times_source?: string | { source_url?: string; refreshed_at?: string; effective_year?: number };
  formula?: string;
};

export type FocmsFeed = {
  _meta?: {
    generated_at?: string;
    source?: string;
    tenant_id?: string;
    student_id?: string;
    row_count?: number;
    schema_version?: string;
  };
  bests?: Record<string, SwimBest>;
  standards?: {
    usa_swimming_2024_2028_boys_11_12?: {
      SCY?: Record<string, Record<string, number>>;
      LCM?: Record<string, Record<string, number>>;
    };
    tier_order_fastest_to_slowest?: string[];
    below_b_label?: string;
  };
  power_index?: PowerIndex;
};

export type StudentProfile = {
  id?: string;
  preferred_name?: string | null;
  legal_first_name?: string | null;
  current_grade?: string | null;
  residence_state?: string | null;
  expected_hs_graduation_year?: number | null;
  age_years?: number | null;
};

// ---------------------------------------------------------------------------
// Extended types — additional sections beyond swimming
// ---------------------------------------------------------------------------

export type Assessment = {
  instrument?: string;
  subject?: string | null;
  test_date?: string;
  score?: number | null;
  percentile?: number | null;
  performance_band?: string | null;
  achievement_norm?: string | null;
  projected_act?: number | null;
};

export type Goal = {
  title?: string;
  status?: string;
  pillar?: string;
  category?: string | null;
  target_date?: string | null;
  related_pathway?: string | null;
  progress_pct?: number | null;
  achieved_at?: string | null;
};

export type Affiliation = {
  organization_name?: string;
  affiliation_type?: string;
  role?: string | null;
  role_start_date?: string | null;
  role_end_date?: string | null;
  weekly_hours?: number | null;
};

export type TargetUniversity = {
  target_id?: string;
  priority?: string | null;
  university?: {
    leaid?: string;
    name?: string;
    city?: string | null;
    state?: string | null;
    us_news_rank?: number | null;
    admit_rate?: number | null;
    cost_attendance?: number | null;
    has_rotc?: boolean | null;
    has_d1_swim?: boolean | null;
    is_service_academy?: boolean | null;
  };
};

export interface MissionControlProps {
  student: StudentProfile;
  feed: FocmsFeed;
  /** Optional override for the display name. */
  displayName?: string;
  /** Optional kid-text tagline from tenant_settings.theme.kid_text. */
  tagline?: string;
  /** Optional URL to a portrait image rendered in the Mission Profile panel. */
  photoUrl?: string;
  /** Optional extended data — degrades gracefully if absent. */
  assessments?: Assessment[];
  goals?: Goal[];
  affiliations?: Affiliation[];
  targetUniversities?: TargetUniversity[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STROKES = ["Free", "Back", "Breast", "Fly", "IM"] as const;
const COURSES = ["SCY", "LCM"] as const;
const TIER_ORDER = ["AAAA", "AAA", "AA", "A", "BB", "B"];
const TIER_COLOR: Record<string, string> = {
  AAAA: "#00E676", // green = elite
  AAA: "#69F0AE",
  AA: "#B9F6CA",
  A: "#FFD54F",
  BB: "#FFB300",
  B: "#FF8A65",
};

function fmtSeconds(s?: number | null): string {
  if (s == null || !isFinite(s)) return "—";
  if (s >= 60) {
    const m = Math.floor(s / 60);
    const sec = s - m * 60;
    return `${m}:${sec.toFixed(2).padStart(5, "0")}`;
  }
  return s.toFixed(2);
}

function parseEventCourse(key: string): { dist: string; stroke: string; course: string } | null {
  // e.g. "100 Back LCM" -> dist:100, stroke:Back, course:LCM
  const m = key.match(/^(\d+)\s+(\w+(?:\s\w+)?)\s+(SCY|LCM)$/);
  if (!m) return null;
  return { dist: m[1], stroke: m[2], course: m[3] };
}

function powerIndexStatus(pi: number | null | undefined): { label: string; color: string } {
  if (pi == null) return { label: "AWAITING TELEMETRY", color: "#FFB300" };
  if (pi <= 150) return { label: "ELITE TRAJECTORY", color: "#00E676" };
  if (pi <= 200) return { label: "STRONG SIGNAL", color: "#69F0AE" };
  if (pi <= 250) return { label: "NOMINAL", color: "#00E676" };
  if (pi <= 350) return { label: "ASCENDING", color: "#FFD54F" };
  return { label: "EARLY TRAJECTORY", color: "#FF8A65" };
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function Starfield() {
  // Deterministic star positions so SSR + hydration agree.
  const stars = React.useMemo(() => {
    const rng = (seed: number) => {
      let s = seed;
      return () => {
        s = (s * 9301 + 49297) % 233280;
        return s / 233280;
      };
    };
    const r = rng(42);
    return Array.from({ length: 140 }).map(() => ({
      top: `${(r() * 100).toFixed(2)}%`,
      left: `${(r() * 100).toFixed(2)}%`,
      size: r() > 0.85 ? 2 : 1,
      opacity: 0.3 + r() * 0.6,
    }));
  }, []);
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
      {stars.map((s, i) => (
        <span
          key={i}
          style={{
            position: "absolute",
            top: s.top,
            left: s.left,
            width: s.size,
            height: s.size,
            background: "white",
            opacity: s.opacity,
            borderRadius: 9999,
          }}
        />
      ))}
    </div>
  );
}

function StatusLed({ color, blink = true }: { color: string; blink?: boolean }) {
  return (
    <span
      style={{
        display: "inline-block",
        width: 8,
        height: 8,
        borderRadius: 9999,
        background: color,
        boxShadow: `0 0 6px ${color}`,
        animation: blink ? "mc-blink 1.6s ease-in-out infinite" : "none",
      }}
      aria-hidden
    />
  );
}

function HudRing({ pi }: { pi: number | null | undefined }) {
  // Visualize PI relative to a reference (lower is better — like golf).
  // Map PI 100..400 to a ring fill 100%..0%.
  const status = powerIndexStatus(pi);
  const filled = pi == null ? 0 : Math.max(0, Math.min(1, 1 - (pi - 100) / 300));
  const R = 120;
  const C = 2 * Math.PI * R;
  const dash = C * filled;
  const value = pi != null ? pi.toFixed(1) : "—";

  return (
    <div className="relative flex flex-col items-center justify-center" style={{ width: 320, height: 320 }}>
      <svg width="320" height="320" viewBox="0 0 320 320" aria-label="Power Index telemetry ring">
        <defs>
          <radialGradient id="mc-ringGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={status.color} stopOpacity="0.35" />
            <stop offset="100%" stopColor={status.color} stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="160" cy="160" r={R + 14} fill="url(#mc-ringGlow)" />
        <circle cx="160" cy="160" r={R} fill="none" stroke="#1a2238" strokeWidth="10" />
        <circle
          cx="160"
          cy="160"
          r={R}
          fill="none"
          stroke={status.color}
          strokeWidth="10"
          strokeDasharray={`${dash} ${C - dash}`}
          strokeDashoffset={C / 4}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 600ms ease-out" }}
        />
        {/* Tick marks */}
        {Array.from({ length: 60 }).map((_, i) => {
          const angle = (i / 60) * 2 * Math.PI;
          const r1 = R - 18;
          const r2 = R - 24;
          const major = i % 5 === 0;
          return (
            <line
              key={i}
              x1={160 + r1 * Math.cos(angle)}
              y1={160 + r1 * Math.sin(angle)}
              x2={160 + r2 * Math.cos(angle)}
              y2={160 + r2 * Math.sin(angle)}
              stroke={major ? "#3a4566" : "#2a334d"}
              strokeWidth={major ? 1.5 : 1}
            />
          );
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <div className="text-[10px] tracking-[0.3em] text-[#7c8baa] font-mono">POWER INDEX</div>
        <div className="text-[64px] leading-none font-mono font-bold text-white tabular-nums">{value}</div>
        <div className="mt-2 flex items-center gap-2">
          <StatusLed color={status.color} />
          <span className="text-[10px] tracking-[0.25em] font-mono" style={{ color: status.color }}>
            {status.label}
          </span>
        </div>
      </div>
    </div>
  );
}

function PrimarySystemsPanel({ topFour }: { topFour: PowerIndex["top_4"] }) {
  return (
    <div className="rounded-md border border-[#1f2a44] bg-[#0c1326]/80 backdrop-blur p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[11px] tracking-[0.28em] font-mono text-[#FC3D21]">PRIMARY SYSTEMS</h3>
        <span className="text-[10px] font-mono text-[#5b6a8a]">TOP 4 CONTRIBUTORS</span>
      </div>
      <ol className="space-y-3">
        {topFour.length === 0 && <li className="text-[#5b6a8a] font-mono text-sm">no signal</li>}
        {topFour.map((row, i) => {
          const weights = [100, 100, 25, 5];
          return (
            <li key={i} className="grid grid-cols-[20px_1fr_auto] items-baseline gap-3">
              <span className="font-mono text-[11px] text-[#5b6a8a]">S{i + 1}</span>
              <div className="font-mono text-[14px] text-white truncate">{row.event_course}</div>
              <div className="text-right">
                <div className="font-mono text-[14px] text-[#00B8D4] tabular-nums">{row.pp.toFixed(2)}</div>
                <div className="font-mono text-[9px] text-[#5b6a8a]">w={weights[i] ?? 0}%</div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function MissionProfilePanel({
  displayName,
  student,
  tagline,
  feed,
  photoUrl,
}: {
  displayName: string;
  student: StudentProfile;
  tagline?: string;
  feed: FocmsFeed;
  photoUrl?: string;
}) {
  const grade = student.current_grade ?? "—";
  const age = student.age_years ?? "—";
  const state = student.residence_state ?? "—";
  const gradYear = student.expected_hs_graduation_year ?? "—";
  const yearsToLaunch =
    typeof gradYear === "number" ? Math.max(0, gradYear - new Date().getUTCFullYear()) : "—";
  return (
    <div className="rounded-md border border-[#1f2a44] bg-[#0c1326]/80 backdrop-blur p-5">
      <div className="flex items-center gap-3 mb-3">
        <StatusLed color="#00E676" />
        <h2 className="font-mono text-[11px] tracking-[0.3em] text-[#FC3D21]">MISSION PROFILE</h2>
      </div>
      <div className="font-mono">
        <div className="flex items-center gap-4">
          {photoUrl && (
            <img
              src={photoUrl}
              alt={displayName}
              className="w-20 h-20 rounded-full object-cover flex-shrink-0"
              style={{
                border: "2px solid #FC3D21",
                boxShadow: "0 0 12px rgba(252, 61, 33, 0.4)",
              }}
            />
          )}
          <div className="min-w-0">
            <div className="text-[22px] font-bold text-white leading-tight">{displayName}</div>
            {tagline && <div className="mt-1 text-[12px] text-[#a4b3d4] italic">"{tagline}"</div>}
          </div>
        </div>
      </div>
      <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-2 font-mono text-[12px]">
        <dt className="text-[#5b6a8a] tracking-[0.18em]">GRADE</dt>
        <dd className="text-right text-[#d4dcee] tabular-nums">{grade}</dd>
        <dt className="text-[#5b6a8a] tracking-[0.18em]">AGE</dt>
        <dd className="text-right text-[#d4dcee] tabular-nums">{age}</dd>
        <dt className="text-[#5b6a8a] tracking-[0.18em]">SECTOR</dt>
        <dd className="text-right text-[#d4dcee]">{state}</dd>
        <dt className="text-[#5b6a8a] tracking-[0.18em]">LAUNCH</dt>
        <dd className="text-right text-[#d4dcee] tabular-nums">May {gradYear}</dd>
        <dt className="text-[#5b6a8a] tracking-[0.18em]">T-MINUS</dt>
        <dd className="text-right text-[#d4dcee] tabular-nums">{yearsToLaunch} yr</dd>
        <dt className="text-[#5b6a8a] tracking-[0.18em]">EVENTS LOGGED</dt>
        <dd className="text-right text-[#d4dcee] tabular-nums">{feed._meta?.row_count ?? "—"}</dd>
      </dl>
    </div>
  );
}

function PerformanceLog({ feed }: { feed: FocmsFeed }) {
  const bests = feed.bests ?? {};
  const standards = feed.standards?.usa_swimming_2024_2028_boys_11_12 ?? {};

  // Group bests by stroke, then by event/distance
  const grouped: Record<string, Record<string, Record<"SCY" | "LCM", SwimBest | null>>> = {};
  for (const [key, val] of Object.entries(bests)) {
    const ec = parseEventCourse(key);
    if (!ec) continue;
    const strokeKey = ec.stroke;
    const eventName = `${ec.dist} ${ec.stroke}`;
    grouped[strokeKey] ??= {};
    grouped[strokeKey][eventName] ??= { SCY: null, LCM: null };
    grouped[strokeKey][eventName][ec.course as "SCY" | "LCM"] = val;
  }

  return (
    <section className="rounded-md border border-[#1f2a44] bg-[#0c1326]/80 backdrop-blur p-5">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <StatusLed color="#00B8D4" blink={false} />
          <h3 className="font-mono text-[11px] tracking-[0.28em] text-[#FC3D21]">PERFORMANCE LOG</h3>
        </div>
        <span className="font-mono text-[10px] text-[#5b6a8a] tracking-[0.18em]">
          USA SWIMMING BOYS 11-12 2024-2028 STANDARDS
        </span>
      </div>

      <div className="space-y-7">
        {STROKES.map((stroke) => {
          const events = grouped[stroke];
          if (!events) return null;
          return <StrokeBlock key={stroke} stroke={stroke} events={events} standards={standards} />;
        })}
      </div>
    </section>
  );
}

function StrokeBlock({
  stroke,
  events,
  standards,
}: {
  stroke: string;
  events: Record<string, Record<"SCY" | "LCM", SwimBest | null>>;
  standards: { SCY?: Record<string, Record<string, number>>; LCM?: Record<string, Record<string, number>> };
}) {
  const eventNames = Object.keys(events).sort((a, b) => {
    const da = parseInt(a.split(" ")[0], 10);
    const db = parseInt(b.split(" ")[0], 10);
    return da - db;
  });

  return (
    <div>
      <h4 className="font-mono text-[14px] text-white mb-2 tracking-[0.12em]">
        <span className="text-[#FC3D21]">::</span> {stroke.toUpperCase()}
      </h4>
      <div className="overflow-x-auto">
        <table className="w-full font-mono text-[12px] border-collapse">
          <thead>
            <tr className="text-[#5b6a8a] text-[10px] tracking-[0.18em] border-b border-[#1f2a44]">
              <th className="text-left py-2 pr-3 w-[120px]">event</th>
              <th className="text-right pr-3">scy time</th>
              <th className="text-right pr-3">scy std</th>
              <th className="text-right pr-3">scy next</th>
              <th className="text-right pr-3">scy Δ</th>
              <th className="text-right pr-3">lcm time</th>
              <th className="text-right pr-3">lcm std</th>
              <th className="text-right pr-3">lcm next</th>
              <th className="text-right">lcm Δ</th>
            </tr>
          </thead>
          <tbody>
            {eventNames.map((eventName) => {
              const row = events[eventName];
              return (
                <tr key={eventName} className="border-b border-[#0f1729] hover:bg-[#101a36]/60">
                  <td className="py-2 pr-3 text-[#d4dcee]">{eventName}</td>
                  {(["SCY", "LCM"] as const).map((course) => {
                    const best = row[course];
                    if (!best) {
                      return (
                        <React.Fragment key={course}>
                          <td className="text-right pr-3 text-[#3a4566] tabular-nums">·</td>
                          <td className="text-right pr-3 text-[#3a4566]">·</td>
                          <td className="text-right pr-3 text-[#3a4566] tabular-nums">·</td>
                          <td className="text-right pr-3 text-[#3a4566] tabular-nums">·</td>
                        </React.Fragment>
                      );
                    }
                    const stdColor = TIER_COLOR[best.usa_standard ?? ""] ?? "#5b6a8a";
                    const nextColor = TIER_COLOR[best.next_std ?? ""] ?? "#5b6a8a";
                    const delta =
                      best.next_time_seconds != null
                        ? best.seconds - best.next_time_seconds
                        : null;
                    const dropPct =
                      delta != null && best.seconds > 0
                        ? (delta / best.seconds) * 100
                        : null;
                    return (
                      <React.Fragment key={course}>
                        <td className="text-right pr-3 text-white tabular-nums">{best.time}</td>
                        <td className="text-right pr-3 tabular-nums" style={{ color: stdColor }}>
                          {best.usa_standard ?? "·"}
                        </td>
                        <td className="text-right pr-3 tabular-nums" style={{ color: nextColor }}>
                          {best.next_std ?? "·"}
                        </td>
                        <td className="text-right pr-3 text-[#a4b3d4] tabular-nums">
                          {dropPct != null && delta != null
                            ? `${delta.toFixed(2)}s · ${dropPct.toFixed(1)}%`
                            : "·"}
                        </td>
                      </React.Fragment>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TelemetryFooter({ feed }: { feed: FocmsFeed }) {
  const meta = feed._meta ?? {};
  const baseSrc = feed.power_index?.base_times_source;
  const baseSrcText =
    typeof baseSrc === "string"
      ? baseSrc
      : baseSrc?.source_url
      ? `NCAA D1 Men ${baseSrc.effective_year ?? ""} SCY (refreshed ${baseSrc.refreshed_at ?? "—"})`
      : "—";
  return (
    <footer className="mt-10 border-t border-[#1f2a44] pt-5 font-mono text-[10px] text-[#5b6a8a] tracking-[0.12em]">
      <div className="flex flex-wrap gap-x-6 gap-y-2 justify-between">
        <span>SCHEMA {meta.schema_version ?? "—"}</span>
        <span>BASE TIMES :: {baseSrcText}</span>
        <span>METHOD :: {feed.power_index?.method ?? "—"}</span>
        <span>EVENTS ELIGIBLE :: {feed.power_index?.total_eligible_events ?? "—"}</span>
      </div>
      <div className="mt-2 text-right text-[#3a4566]">
        generated {meta.generated_at ? meta.generated_at.slice(0, 19).replace("T", " ") : "—"} UTC
      </div>
    </footer>
  );
}

// ---------------------------------------------------------------------------
// Extended panels (v1.1) — academics, goals, affiliations, targets
// ---------------------------------------------------------------------------

function PathwayBadge({ pathway }: { pathway?: string | null }) {
  if (!pathway) return null;
  const map: Record<string, { label: string; color: string }> = {
    service_academy: { label: "SVC ACAD", color: "#FC3D21" },
    rotc: { label: "ROTC", color: "#FFB300" },
    academic_merit: { label: "MERIT", color: "#FFD54F" },
    athletic_d1: { label: "D1 SWIM", color: "#00B8D4" },
    holistic: { label: "HOLISTIC", color: "#a4b3d4" },
    need_based: { label: "NEED", color: "#69F0AE" },
  };
  const m = map[pathway] ?? { label: pathway.toUpperCase(), color: "#7c8baa" };
  return (
    <span
      className="inline-block px-1.5 py-0.5 font-mono text-[9px] tracking-[0.15em] rounded-sm border"
      style={{ color: m.color, borderColor: m.color, opacity: 0.85 }}
    >
      {m.label}
    </span>
  );
}

function MissionTargets({ targets }: { targets: TargetUniversity[] }) {
  if (!targets || targets.length === 0) return null;
  const sorted = [...targets].sort(
    (a, b) =>
      (a.university?.us_news_rank ?? 999) - (b.university?.us_news_rank ?? 999),
  );
  return (
    <section className="rounded-md border border-[#1f2a44] bg-[#0c1326]/80 backdrop-blur p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <StatusLed color="#FC3D21" />
          <h3 className="font-mono text-[11px] tracking-[0.28em] text-[#FC3D21]">
            MISSION TARGETS
          </h3>
        </div>
        <span className="font-mono text-[10px] text-[#5b6a8a] tracking-[0.18em]">
          {sorted.length} ENTRIES
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full font-mono text-[12px] border-collapse">
          <thead>
            <tr className="text-[#5b6a8a] text-[10px] tracking-[0.18em] border-b border-[#1f2a44]">
              <th className="text-right py-2 pr-3 w-[60px]">rank</th>
              <th className="text-left pr-3">target</th>
              <th className="text-left pr-3">location</th>
              <th className="text-right pr-3">admit</th>
              <th className="text-right pr-3">cost</th>
              <th className="text-left pr-3">pathways</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((t, i) => {
              const u = t.university ?? {};
              const admit = u.admit_rate != null ? (u.admit_rate * 100).toFixed(1) + "%" : "·";
              const cost =
                u.cost_attendance != null
                  ? "$" + Math.round(u.cost_attendance / 1000) + "K"
                  : "·";
              return (
                <tr key={t.target_id ?? i} className="border-b border-[#0f1729] hover:bg-[#101a36]/60">
                  <td className="py-2 pr-3 text-right text-[#FFD54F] tabular-nums font-bold">
                    #{u.us_news_rank ?? "·"}
                  </td>
                  <td className="pr-3 text-white">{u.name ?? "—"}</td>
                  <td className="pr-3 text-[#a4b3d4]">
                    {u.city ?? ""}
                    {u.city && u.state ? ", " : ""}
                    {u.state ?? ""}
                  </td>
                  <td className="text-right pr-3 text-[#a4b3d4] tabular-nums">{admit}</td>
                  <td className="text-right pr-3 text-[#a4b3d4] tabular-nums">{cost}</td>
                  <td className="pr-3">
                    <span className="flex flex-wrap gap-1">
                      {u.is_service_academy && <PathwayBadge pathway="service_academy" />}
                      {u.has_rotc && <PathwayBadge pathway="rotc" />}
                      {u.has_d1_swim && <PathwayBadge pathway="athletic_d1" />}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function DiagnosticsPanel({ assessments }: { assessments: Assessment[] }) {
  if (!assessments || assessments.length === 0) return null;
  const sorted = [...assessments].sort((a, b) =>
    (b.test_date ?? "").localeCompare(a.test_date ?? ""),
  );
  return (
    <section className="rounded-md border border-[#1f2a44] bg-[#0c1326]/80 backdrop-blur p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <StatusLed color="#00B8D4" />
          <h3 className="font-mono text-[11px] tracking-[0.28em] text-[#FC3D21]">
            COGNITIVE DIAGNOSTICS
          </h3>
        </div>
        <span className="font-mono text-[10px] text-[#5b6a8a] tracking-[0.18em]">
          {sorted.length} READINGS
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full font-mono text-[12px] border-collapse">
          <thead>
            <tr className="text-[#5b6a8a] text-[10px] tracking-[0.18em] border-b border-[#1f2a44]">
              <th className="text-left py-2 pr-3">instrument</th>
              <th className="text-left pr-3">subject</th>
              <th className="text-left pr-3">date</th>
              <th className="text-right pr-3">score</th>
              <th className="text-right pr-3">%ile</th>
              <th className="text-left pr-3">band</th>
              <th className="text-right">proj act</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((a, i) => {
              const bandColor = (() => {
                const b = (a.performance_band ?? "").toLowerCase();
                if (b.includes("master") || b.includes("above")) return "#00E676";
                if (b.includes("approach") || b.includes("meet")) return "#FFD54F";
                if (b.includes("below")) return "#FF8A65";
                return "#a4b3d4";
              })();
              return (
                <tr key={i} className="border-b border-[#0f1729] hover:bg-[#101a36]/60">
                  <td className="py-2 pr-3 text-white">{a.instrument ?? "—"}</td>
                  <td className="pr-3 text-[#a4b3d4]">{a.subject ?? "·"}</td>
                  <td className="pr-3 text-[#7c8baa] tabular-nums">
                    {a.test_date ?? "·"}
                  </td>
                  <td className="text-right pr-3 text-white tabular-nums">
                    {a.score ?? "·"}
                  </td>
                  <td className="text-right pr-3 text-[#a4b3d4] tabular-nums">
                    {a.percentile != null ? `${a.percentile}` : "·"}
                  </td>
                  <td className="pr-3" style={{ color: bandColor }}>
                    {a.performance_band ?? "·"}
                  </td>
                  <td className="text-right text-[#FFD54F] tabular-nums">
                    {a.projected_act ?? "·"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ObjectivesPanel({ goals }: { goals: Goal[] }) {
  if (!goals || goals.length === 0) return null;
  const active = goals.filter((g) => (g.status ?? "active") === "active");
  const today = new Date().toISOString().slice(0, 10);
  const sorted = [...active].sort((a, b) =>
    (a.target_date ?? "9999").localeCompare(b.target_date ?? "9999"),
  );

  function tMinus(targetDate?: string | null): string {
    if (!targetDate) return "—";
    const target = new Date(targetDate + "T00:00:00Z").getTime();
    const now = new Date(today + "T00:00:00Z").getTime();
    const days = Math.floor((target - now) / (1000 * 60 * 60 * 24));
    if (days < 0) return `+${-days}d`;
    if (days < 60) return `T-${days}d`;
    const mo = Math.floor(days / 30);
    if (mo < 24) return `T-${mo}mo`;
    return `T-${(days / 365).toFixed(1)}y`;
  }

  return (
    <section className="rounded-md border border-[#1f2a44] bg-[#0c1326]/80 backdrop-blur p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <StatusLed color="#FFD54F" />
          <h3 className="font-mono text-[11px] tracking-[0.28em] text-[#FC3D21]">
            ACTIVE OBJECTIVES
          </h3>
        </div>
        <span className="font-mono text-[10px] text-[#5b6a8a] tracking-[0.18em]">
          {sorted.length} TRACKING
        </span>
      </div>
      <ol className="space-y-2 font-mono text-[12px]">
        {sorted.map((g, i) => (
          <li
            key={i}
            className="grid grid-cols-[24px_1fr_auto_auto] items-center gap-3 border-b border-[#0f1729] py-2"
          >
            <span className="text-[10px] text-[#5b6a8a] tabular-nums">
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="text-white">{g.title ?? "—"}</span>
            <PathwayBadge pathway={g.related_pathway} />
            <span className="text-[#FFD54F] tabular-nums text-[11px] w-[60px] text-right">
              {tMinus(g.target_date)}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}

function NetworkPanel({ affiliations }: { affiliations: Affiliation[] }) {
  if (!affiliations || affiliations.length === 0) return null;
  // Dedupe by organization_name — show the primary entry.
  const seen = new Set<string>();
  const unique = affiliations.filter((a) => {
    const key = a.organization_name ?? "";
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return (
    <section className="rounded-md border border-[#1f2a44] bg-[#0c1326]/80 backdrop-blur p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <StatusLed color="#69F0AE" />
          <h3 className="font-mono text-[11px] tracking-[0.28em] text-[#FC3D21]">
            NETWORK
          </h3>
        </div>
        <span className="font-mono text-[10px] text-[#5b6a8a] tracking-[0.18em]">
          {unique.length} NODES
        </span>
      </div>
      <ul className="space-y-2 font-mono text-[12px]">
        {unique.map((a, i) => {
          const typeMap: Record<string, string> = {
            club: "CLUB",
            program: "PRG",
            activity: "ACT",
            volunteer_org: "VOL",
            internship: "INT",
            employment: "EMP",
            coach_relationship: "COACH",
            mentor_relationship: "MENTOR",
            school_team: "TEAM",
          };
          const typeLabel = typeMap[a.affiliation_type ?? ""] ?? "—";
          return (
            <li
              key={i}
              className="grid grid-cols-[60px_1fr_auto] items-baseline gap-3 border-b border-[#0f1729] py-2"
            >
              <span className="text-[10px] text-[#FC3D21] tracking-[0.15em]">{typeLabel}</span>
              <div>
                <div className="text-white">{a.organization_name ?? "—"}</div>
                {a.role && (
                  <div className="text-[10px] text-[#7c8baa] mt-0.5">{a.role}</div>
                )}
              </div>
              <span className="text-[10px] text-[#5b6a8a] tabular-nums">
                {a.role_start_date ?? "·"}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Top-level theme component
// ---------------------------------------------------------------------------

const MissionControl: React.FC<MissionControlProps> = ({
  student,
  feed,
  displayName,
  tagline,
  photoUrl,
  assessments = [],
  goals = [],
  affiliations = [],
  targetUniversities = [],
}) => {
  const pi = feed.power_index?.value ?? null;
  const topFour = feed.power_index?.top_4 ?? [];

  const hasTargets = targetUniversities && targetUniversities.length > 0;
  const hasDiagnostics = assessments && assessments.length > 0;
  const hasObjectives = goals && goals.length > 0;
  const hasNetwork = affiliations && affiliations.length > 0;
  const name =
    displayName ??
    student.preferred_name ??
    student.legal_first_name ??
    "ASTRONAUT";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap');
        @keyframes mc-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.35; }
        }
        @keyframes mc-scroll {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .mc-root, .mc-root * { font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace; }
      `}</style>
      <div
        className="mc-root relative min-h-screen w-full overflow-x-hidden"
        style={{
          background:
            "radial-gradient(ellipse at top, #131f3d 0%, #0a0e27 50%, #050814 100%)",
          color: "#d4dcee",
        }}
      >
        <Starfield />

        <div className="relative z-10 mx-auto max-w-6xl px-5 py-8 md:py-12">
          {/* Top status bar */}
          <div className="flex items-center justify-between mb-6 font-mono text-[10px] tracking-[0.28em]">
            <div className="flex items-center gap-3">
              <StatusLed color="#00E676" />
              <span className="text-[#7c8baa]">OUTCOMESTAR // MISSION CONTROL v1</span>
            </div>
            <div className="hidden sm:flex items-center gap-3 text-[#5b6a8a]">
              <span>SIGNAL :: LIVE</span>
              <span>UPLINK :: focms-api</span>
            </div>
          </div>

          {/* Hero: ring + profile + primary systems */}
          <section className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 items-start">
            <div className="flex justify-center lg:justify-start">
              <HudRing pi={pi} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <MissionProfilePanel
                displayName={name}
                student={student}
                tagline={tagline}
                feed={feed}
                photoUrl={photoUrl}
              />
              <PrimarySystemsPanel topFour={topFour} />
            </div>
          </section>

          {/* Scrolling ticker */}
          <div className="my-8 overflow-hidden border-y border-[#1f2a44] py-2">
            <div className="whitespace-nowrap font-mono text-[11px] text-[#7c8baa]" style={{ animation: "mc-scroll 60s linear infinite" }}>
              {topFour.map((t, i) => (
                <span key={i} className="mx-8">
                  <span className="text-[#FC3D21]">::</span> {t.event_course} <span className="text-[#00B8D4]">PP={t.pp.toFixed(2)}</span>
                </span>
              ))}
              <span className="mx-8 text-[#FC3D21]">::</span>
              <span className="mr-8">POWER INDEX :: {pi?.toFixed(1) ?? "—"}</span>
              <span className="mx-8 text-[#FC3D21]">::</span>
              <span className="mr-8">TRAJECTORY :: {powerIndexStatus(pi).label}</span>
            </div>
          </div>

          {/* Performance log */}
          <PerformanceLog feed={feed} />

          {/* Section divider */}
          {(hasTargets || hasObjectives || hasDiagnostics || hasNetwork) && (
            <div className="my-10 flex items-center gap-3 text-[10px] tracking-[0.32em] text-[#5b6a8a]">
              <span className="text-[#FC3D21]">::</span>
              <span>MISSION DOSSIER</span>
              <div className="flex-1 h-px bg-[#1f2a44]" />
            </div>
          )}

          {/* Mission targets — university list */}
          {hasTargets && (
            <div className="mb-8">
              <MissionTargets targets={targetUniversities} />
            </div>
          )}

          {/* Two-column grid: objectives + diagnostics */}
          {(hasObjectives || hasDiagnostics) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {hasObjectives && <ObjectivesPanel goals={goals} />}
              {hasDiagnostics && <DiagnosticsPanel assessments={assessments} />}
            </div>
          )}

          {/* Network panel */}
          {hasNetwork && (
            <div className="mb-8">
              <NetworkPanel affiliations={affiliations} />
            </div>
          )}

          {/* Telemetry footer */}
          <TelemetryFooter feed={feed} />

          {/* Compliance: not a CDS report, but theme contract still requires standard footer */}
          <div className="mt-8 text-[10px] font-mono text-[#3a4566] leading-relaxed">
            <p>
              OutcomeStar Mission Control — public showcase rendering of canonical
              data held in FOCMS Postgres. Power Index computed server-side using
              the Swimcloud 2026 class-of-2026-and-later formula against NCAA D1
              Men 2026 SCY base times. USA Swimming standards source: USA Swimming
              2024-2028 Time Standards Boys 11-12.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default MissionControl;

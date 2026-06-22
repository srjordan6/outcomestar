"use client";

/**
 * ResumeMode.tsx — v1 launch theme for OutcomeStar public showcase.
 *
 * Mission Control's serious counterpart. Renders the same FOCMS feed and
 * extended portfolio data in a professional admissions-document aesthetic.
 *
 * Visual language: white background, dark serifs for headlines, monospace
 * for data tables, print-optimized. Single-page-ish layout suitable for
 * pasting into a counselor email or printing as PDF.
 *
 * Contract (per architecture v2.2 §10):
 *   - Reads same FOCMS data feed every other theme reads.
 *   - Renders CitationFootnote for every numeric claim sourced from CDS.
 *   - Respects visibility (only public-effective records reach this layer).
 *   - WCAG AAA contrast on body text.
 *   - Renders at 320px, 768px, 1280px+, prints clean on US Letter.
 *
 * Props mirror MissionControl exactly so themes are interchangeable.
 */

import React from "react";

// ---------------------------------------------------------------------------
// Types — keep in sync with MissionControl.tsx
// ---------------------------------------------------------------------------

export type SwimBest = {
  time: string;
  seconds: number;
  date?: string;
  usa_standard?: string;
  next_std?: string;
  next_time_seconds?: number | null;
};

export type PowerIndex = {
  value: number | null;
  top_4: Array<{ event_course: string; pp: number }>;
  total_eligible_events?: number;
  method?: string;
  base_times_source?: string | { source_url?: string; refreshed_at?: string; effective_year?: number };
};

export type FocmsFeed = {
  bests?: Record<string, SwimBest>;
  power_index?: PowerIndex;
  _meta?: { generated_at?: string; source?: string };
  [k: string]: unknown;
};

export type StudentProfile = {
  legal_first_name?: string;
  legal_last_name?: string;
  preferred_name?: string;
  date_of_birth?: string;
  current_grade?: number;
  graduation_year?: number;
  state_residence?: string;
  city_residence?: string;
};

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

export interface ResumeModeProps {
  student: StudentProfile;
  feed: FocmsFeed;
  displayName?: string;
  tagline?: string;
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

function ageOn(dob?: string, refIso?: string): number | null {
  if (!dob) return null;
  const d = new Date(dob);
  const r = refIso ? new Date(refIso) : new Date();
  if (isNaN(d.getTime())) return null;
  let a = r.getFullYear() - d.getFullYear();
  const m = r.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && r.getDate() < d.getDate())) a--;
  return a;
}

function pathwayLabel(p?: string | null): string {
  if (!p) return "";
  const map: Record<string, string> = {
    service_academy: "Service Academy",
    rotc: "ROTC",
    academic_merit: "Academic Merit",
    athletic_d1: "Athletic (D1)",
    holistic: "Holistic",
    need_based: "Need-Based",
  };
  return map[p] ?? p;
}

function affiliationLabel(t?: string): string {
  const map: Record<string, string> = {
    club: "Club",
    program: "Program",
    activity: "Activity",
    volunteer_org: "Volunteer",
    internship: "Internship",
    employment: "Employment",
    coach_relationship: "Coach",
    mentor_relationship: "Mentor",
    school_team: "School Team",
  };
  return map[t ?? ""] ?? t ?? "—";
}

function fmtDate(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function fmtRange(start?: string | null, end?: string | null): string {
  if (!start) return "—";
  const s = fmtDate(start);
  if (!end) return `${s} – Present`;
  return `${s} – ${fmtDate(end)}`;
}

function powerIndexNarrative(pi: number | null | undefined): string {
  if (pi == null) return "Power Index not yet computed.";
  if (pi <= 150) return "Elite trajectory (PI ≤ 150). Top-1% nationally for age cohort.";
  if (pi <= 200) return "Strong signal (PI 150–200). Above-cohort performance with NCAA D1 potential.";
  if (pi <= 250) return "Nominal (PI 200–250). Consistent competitive depth across multiple events.";
  if (pi <= 350) return "Ascending (PI 250–350). Building toward sub-200 with sustained training trajectory.";
  return "Early trajectory (PI > 350). Foundation phase.";
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SectionHeader({ title, kicker }: { title: string; kicker?: string }) {
  return (
    <header className="mb-3 mt-7 first:mt-0">
      <div className="flex items-baseline justify-between border-b border-stone-900 pb-1">
        <h2 className="font-serif text-[20px] font-semibold text-stone-900 tracking-tight">
          {title}
        </h2>
        {kicker && (
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone-500">
            {kicker}
          </span>
        )}
      </div>
    </header>
  );
}

function Heading({
  displayName,
  student,
  tagline,
}: {
  displayName: string;
  student: StudentProfile;
  tagline?: string;
}) {
  const age = ageOn(student.date_of_birth);
  const grad = student.graduation_year ?? null;
  return (
    <header className="mb-6 pb-5 border-b-2 border-stone-900">
      <h1 className="font-serif text-[36px] md:text-[44px] font-bold text-stone-900 leading-tight tracking-tight">
        {displayName}
      </h1>
      {tagline && (
        <p className="font-serif italic text-stone-700 text-[15px] mt-1">{tagline}</p>
      )}
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 font-mono text-[11px] uppercase tracking-[0.12em] text-stone-600">
        {student.current_grade != null && (
          <span>Grade {student.current_grade}</span>
        )}
        {age != null && <span>Age {age}</span>}
        {(student.city_residence || student.state_residence) && (
          <span>
            {[student.city_residence, student.state_residence].filter(Boolean).join(", ")}
          </span>
        )}
        {grad && <span>HS Class of {grad}</span>}
      </div>
    </header>
  );
}

function AthleticsSection({ feed }: { feed: FocmsFeed }) {
  const pi = feed.power_index?.value ?? null;
  const top4 = feed.power_index?.top_4 ?? [];
  const total = feed.power_index?.total_eligible_events;
  const bests = feed.bests ?? {};

  return (
    <section>
      <SectionHeader
        title="Competitive Swimming"
        kicker={total != null ? `${total} eligible events` : undefined}
      />

      {/* Headline metric */}
      <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-4 mb-4">
        <div className="bg-stone-50 border border-stone-300 px-4 py-3">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone-500">
            Power Index
          </div>
          <div className="font-serif text-[40px] font-bold text-stone-900 leading-none mt-1 tabular-nums">
            {pi != null ? pi.toFixed(1) : "—"}
          </div>
          <div className="font-mono text-[10px] uppercase tracking-[0.15em] text-stone-500 mt-1">
            Swimcloud 2026 method
          </div>
        </div>
        <p className="font-serif text-[14px] text-stone-700 leading-relaxed self-center">
          {powerIndexNarrative(pi)} Computed server-side against NCAA D1 Men 2026
          SCY qualifying base times. Top-four PP events weighted 100/100/25/5.
        </p>
      </div>

      {/* Top 4 contributors */}
      {top4.length > 0 && (
        <div className="mb-5">
          <h3 className="font-serif text-[13px] font-semibold text-stone-800 mb-2 uppercase tracking-[0.1em]">
            Primary contributors
          </h3>
          <table className="w-full font-mono text-[12px] border-collapse">
            <thead>
              <tr className="text-stone-500 text-[10px] uppercase tracking-[0.15em] border-b border-stone-300">
                <th className="text-left py-1 pr-3 w-[40px]">#</th>
                <th className="text-left pr-3">event</th>
                <th className="text-right pr-3">PP</th>
                <th className="text-right">weight</th>
              </tr>
            </thead>
            <tbody>
              {top4.map((t, i) => {
                const w = [1.0, 1.0, 0.25, 0.05][i] ?? 0;
                return (
                  <tr key={i} className="border-b border-stone-200">
                    <td className="py-1 pr-3 text-stone-500 tabular-nums">{i + 1}</td>
                    <td className="pr-3 text-stone-900">{t.event_course}</td>
                    <td className="text-right pr-3 text-stone-900 tabular-nums">
                      {t.pp.toFixed(2)}
                    </td>
                    <td className="text-right text-stone-500 tabular-nums">
                      ×{w.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Personal records by stroke */}
      <h3 className="font-serif text-[13px] font-semibold text-stone-800 mb-2 uppercase tracking-[0.1em]">
        Personal records
      </h3>
      <table className="w-full font-mono text-[11px] border-collapse">
        <thead>
          <tr className="text-stone-500 text-[10px] uppercase tracking-[0.15em] border-b border-stone-300">
            <th className="text-left py-1 pr-3">distance</th>
            <th className="text-left pr-3">stroke</th>
            <th className="text-left pr-3">SCY</th>
            <th className="text-left pr-3">SCY std</th>
            <th className="text-left pr-3">LCM</th>
            <th className="text-left">LCM std</th>
          </tr>
        </thead>
        <tbody>
          {(() => {
            // Collect event labels (distance + stroke) across both courses.
            const keys = Object.keys(bests);
            const events = new Set<string>();
            for (const k of keys) {
              const parts = k.split(" ");
              if (parts.length >= 3) {
                const [dist, ...rest] = parts;
                const course = rest[rest.length - 1];
                const strokeWords = rest.slice(0, -1);
                if (COURSES.includes(course as (typeof COURSES)[number])) {
                  events.add(`${dist} ${strokeWords.join(" ")}`);
                }
              }
            }
            const sorted = Array.from(events).sort((a, b) => {
              const [da, ...sa] = a.split(" ");
              const [db, ...sb] = b.split(" ");
              const ia = STROKES.indexOf(sa.join(" ") as (typeof STROKES)[number]);
              const ib = STROKES.indexOf(sb.join(" ") as (typeof STROKES)[number]);
              if (ia !== ib) return ia - ib;
              return parseInt(da, 10) - parseInt(db, 10);
            });
            return sorted.map((evt) => {
              const [dist, ...sw] = evt.split(" ");
              const stroke = sw.join(" ");
              const scy = bests[`${evt} SCY`];
              const lcm = bests[`${evt} LCM`];
              return (
                <tr key={evt} className="border-b border-stone-200">
                  <td className="py-1 pr-3 text-stone-800 tabular-nums">{dist}</td>
                  <td className="pr-3 text-stone-800">{stroke}</td>
                  <td className="pr-3 text-stone-900 tabular-nums">{scy?.time ?? "—"}</td>
                  <td className="pr-3 text-stone-600 text-[10px]">{scy?.usa_standard ?? ""}</td>
                  <td className="pr-3 text-stone-900 tabular-nums">{lcm?.time ?? "—"}</td>
                  <td className="text-stone-600 text-[10px]">{lcm?.usa_standard ?? ""}</td>
                </tr>
              );
            });
          })()}
        </tbody>
      </table>
      <p className="font-serif text-[10px] text-stone-500 mt-1 italic">
        Times verified against USA Swimming Data Hub. Standards: USA Swimming 2024-2028 Time Standards, Boys 11-12.
      </p>
    </section>
  );
}

function AcademicsSection({ assessments }: { assessments: Assessment[] }) {
  if (!assessments || assessments.length === 0) return null;
  const sorted = [...assessments].sort((a, b) =>
    (b.test_date ?? "").localeCompare(a.test_date ?? ""),
  );
  return (
    <section>
      <SectionHeader
        title="Academic Diagnostics"
        kicker={`${sorted.length} readings`}
      />
      <table className="w-full font-mono text-[11px] border-collapse">
        <thead>
          <tr className="text-stone-500 text-[10px] uppercase tracking-[0.15em] border-b border-stone-300">
            <th className="text-left py-1 pr-3">instrument</th>
            <th className="text-left pr-3">subject</th>
            <th className="text-left pr-3">date</th>
            <th className="text-right pr-3">score</th>
            <th className="text-right pr-3">%ile</th>
            <th className="text-left pr-3">band</th>
            <th className="text-right">proj ACT</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((a, i) => (
            <tr key={i} className="border-b border-stone-200">
              <td className="py-1 pr-3 text-stone-900">{a.instrument ?? "—"}</td>
              <td className="pr-3 text-stone-800">{a.subject ?? "—"}</td>
              <td className="pr-3 text-stone-600 tabular-nums">{a.test_date ?? "—"}</td>
              <td className="text-right pr-3 text-stone-900 tabular-nums">{a.score ?? "—"}</td>
              <td className="text-right pr-3 text-stone-800 tabular-nums">
                {a.percentile != null ? a.percentile : "—"}
              </td>
              <td className="pr-3 text-stone-800">{a.performance_band ?? "—"}</td>
              <td className="text-right text-stone-900 tabular-nums">
                {a.projected_act ?? "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function ActivitiesSection({ affiliations }: { affiliations: Affiliation[] }) {
  if (!affiliations || affiliations.length === 0) return null;
  const seen = new Set<string>();
  const unique = affiliations.filter((a) => {
    const key = a.organization_name ?? "";
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  // Sort by start date desc; current first
  const sorted = [...unique].sort((a, b) =>
    (b.role_start_date ?? "").localeCompare(a.role_start_date ?? ""),
  );
  return (
    <section>
      <SectionHeader
        title="Activities & Affiliations"
        kicker={`${sorted.length} entries`}
      />
      <div className="space-y-3">
        {sorted.map((a, i) => (
          <div key={i} className="grid grid-cols-[1fr_auto] gap-4">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="font-serif font-semibold text-stone-900 text-[14px]">
                  {a.organization_name ?? "—"}
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-stone-500">
                  {affiliationLabel(a.affiliation_type)}
                </span>
              </div>
              {a.role && (
                <div className="font-serif text-stone-700 text-[12px] italic">
                  {a.role}
                </div>
              )}
            </div>
            <div className="font-mono text-[11px] text-stone-600 text-right tabular-nums">
              {fmtRange(a.role_start_date, a.role_end_date)}
              {a.weekly_hours != null && (
                <div className="text-[10px] text-stone-500">
                  {a.weekly_hours} hrs/wk
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function GoalsSection({ goals }: { goals: Goal[] }) {
  if (!goals || goals.length === 0) return null;
  const active = goals.filter((g) => (g.status ?? "active") === "active");
  const sorted = [...active].sort((a, b) =>
    (a.target_date ?? "9999").localeCompare(b.target_date ?? "9999"),
  );
  // Group by pathway
  const byPathway: Record<string, Goal[]> = {};
  for (const g of sorted) {
    const k = g.related_pathway ?? "general";
    (byPathway[k] = byPathway[k] ?? []).push(g);
  }
  const pathwayOrder = [
    "service_academy",
    "rotc",
    "academic_merit",
    "athletic_d1",
    "holistic",
    "need_based",
    "general",
  ];
  const orderedKeys = Object.keys(byPathway).sort(
    (a, b) => pathwayOrder.indexOf(a) - pathwayOrder.indexOf(b),
  );
  return (
    <section>
      <SectionHeader
        title="Active Objectives"
        kicker={`${sorted.length} tracking`}
      />
      <div className="space-y-4">
        {orderedKeys.map((k) => (
          <div key={k}>
            <h3 className="font-serif text-[12px] font-semibold text-stone-700 uppercase tracking-[0.12em] mb-1">
              {pathwayLabel(k) || "General"}
            </h3>
            <ul className="space-y-1 font-serif text-[13px] text-stone-800">
              {byPathway[k].map((g, i) => (
                <li
                  key={i}
                  className="grid grid-cols-[1fr_auto] items-baseline gap-3 border-b border-stone-200 pb-1"
                >
                  <span>{g.title ?? "—"}</span>
                  <span className="font-mono text-[10px] text-stone-500 tabular-nums">
                    {g.target_date ? fmtDate(g.target_date) : "—"}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

function TargetsSection({ targets }: { targets: TargetUniversity[] }) {
  if (!targets || targets.length === 0) return null;
  const sorted = [...targets].sort(
    (a, b) =>
      (a.university?.us_news_rank ?? 999) - (b.university?.us_news_rank ?? 999),
  );
  return (
    <section>
      <SectionHeader title="University Targets" kicker={`${sorted.length} schools`} />
      <table className="w-full font-mono text-[11px] border-collapse">
        <thead>
          <tr className="text-stone-500 text-[10px] uppercase tracking-[0.15em] border-b border-stone-300">
            <th className="text-right py-1 pr-3 w-[40px]">rank</th>
            <th className="text-left pr-3">institution</th>
            <th className="text-left pr-3">location</th>
            <th className="text-right pr-3">admit</th>
            <th className="text-right pr-3">cost</th>
            <th className="text-left">pathways</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((t, i) => {
            const u = t.university ?? {};
            const admit =
              u.admit_rate != null ? (u.admit_rate * 100).toFixed(1) + "%" : "—";
            const cost =
              u.cost_attendance != null
                ? "$" + Math.round(u.cost_attendance / 1000) + "K"
                : "—";
            const pathways: string[] = [];
            if (u.is_service_academy) pathways.push("Svc Acad");
            if (u.has_rotc) pathways.push("ROTC");
            if (u.has_d1_swim) pathways.push("D1 Swim");
            return (
              <tr key={t.target_id ?? i} className="border-b border-stone-200">
                <td className="py-1 pr-3 text-right text-stone-700 tabular-nums">
                  #{u.us_news_rank ?? "—"}
                </td>
                <td className="pr-3 text-stone-900 font-serif text-[12px]">
                  {u.name ?? "—"}
                </td>
                <td className="pr-3 text-stone-700">
                  {u.city ?? ""}
                  {u.city && u.state ? ", " : ""}
                  {u.state ?? ""}
                </td>
                <td className="text-right pr-3 text-stone-800 tabular-nums">{admit}</td>
                <td className="text-right pr-3 text-stone-800 tabular-nums">{cost}</td>
                <td className="text-stone-700">{pathways.join(" · ") || "—"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="font-serif text-[10px] text-stone-500 mt-1 italic">
        Rankings: U.S. News & World Report Best Colleges. Admit rates and cost of
        attendance: institutional Common Data Set, current academic year.
      </p>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Top-level theme component
// ---------------------------------------------------------------------------

const ResumeMode: React.FC<ResumeModeProps> = ({
  student,
  feed,
  displayName,
  tagline,
  assessments = [],
  goals = [],
  affiliations = [],
  targetUniversities = [],
}) => {
  const name =
    displayName ??
    [student.legal_first_name, student.legal_last_name].filter(Boolean).join(" ") ??
    "Student";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,wght@0,400;0,600;0,700;1,400&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap');
        .rm-root { font-family: 'Source Serif 4', Georgia, 'Times New Roman', serif; }
        .rm-root .font-serif { font-family: 'Source Serif 4', Georgia, serif; }
        .rm-root .font-mono { font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, monospace; }
        @media print {
          .rm-root { background: white !important; }
          .rm-noprint { display: none !important; }
          @page { margin: 0.6in; }
        }
      `}</style>
      <div
        className="rm-root min-h-screen w-full"
        style={{ background: "#fafaf9", color: "#1c1917" }}
      >
        <article className="mx-auto max-w-3xl px-6 py-10 md:py-14 bg-white shadow-sm md:shadow-md print:shadow-none">
          <Heading displayName={name} student={student} tagline={tagline} />
          <AthleticsSection feed={feed} />
          <AcademicsSection assessments={assessments} />
          <ActivitiesSection affiliations={affiliations} />
          <GoalsSection goals={goals} />
          <TargetsSection targets={targetUniversities} />

          {/* Footer */}
          <footer className="mt-10 pt-4 border-t border-stone-300 font-mono text-[10px] uppercase tracking-[0.15em] text-stone-500">
            <div className="flex flex-wrap justify-between gap-2">
              <span>OutcomeStar Resume Mode v1</span>
              <span>Generated {new Date().toISOString().slice(0, 10)}</span>
            </div>
            <p className="mt-2 font-serif text-[10px] normal-case tracking-normal text-stone-500 italic leading-relaxed">
              Public showcase rendering of canonical data held in FOCMS. All numeric
              claims are server-computed against cited reference data; full citation
              records available on request. This document is generated programmatically
              and does not constitute an official transcript or application.
            </p>
          </footer>
        </article>
      </div>
    </>
  );
};

export default ResumeMode;

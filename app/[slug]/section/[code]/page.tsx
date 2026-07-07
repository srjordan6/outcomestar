import { notFound } from "next/navigation";
import { getPublicSite } from "@/lib/publicSite";
import { getLatest, formatLatest } from "@/lib/latestActivity";
import { resolveGenericTheme, GENERIC_THEMES } from "@/lib/genericThemes";
import { LanguageSelector } from "../../LanguageSelector";

const API = process.env.NEXT_PUBLIC_FOCMS_API || "https://focms-api.onrender.com";

async function getSection(slug: string, code: string) {
  const r = await fetch(`${API}/focms/v1/public/site/${slug}/section/${code}`, { next: { revalidate: 60 } });
  if (!r.ok) return null;
  return (await r.json()) as { title: string; code: string; items: Array<{ title: string; body?: string; date?: string; meta?: { stroke?: string; course?: string; event?: string; best_time?: string; first_time?: string; power_points?: number; usa_standard?: string } }> };
}

export default async function SectionPage({ params }: { params: { slug: string; code: string } }) {
  const site = await getPublicSite(params.slug);
  if (!site) notFound();
  const section = await getSection(params.slug, params.code);
  if (!section) notFound();
  const latest = await getLatest(params.slug);

  const theme =
    resolveGenericTheme(site!.theme?.key) ??
    GENERIC_THEMES[site!.age_band === "band_13_18" ? "resume-mode" : site!.age_band === "band_6_12" ? "mission-control" : "storybook"];
  const [displayFont, bodyFont] = theme.fonts;
  const fontHref = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(displayFont).replace(/%20/g, "+")}:wght@400;600;700&family=${encodeURIComponent(bodyFont).replace(/%20/g, "+")}:wght@400;500;600&display=swap`;

  return (
    <div style={{ background: theme.bg, color: theme.ink, minHeight: "100vh", fontFamily: `'${bodyFont}', system-ui, sans-serif`, ...(theme.motif ? { backgroundImage: theme.motif, backgroundSize: "26px 26px" } : {}) }}>
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link rel="stylesheet" href={fontHref} />
      <main className="mx-auto max-w-page px-6 pt-12 pb-24">
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
          <div style={{ height: 6, background: theme.accent, borderRadius: 3, flex: 1 }} />
          <LanguageSelector theme={theme} />
        </div>
        <p style={{ color: theme.accent, fontSize: 12, letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 600 }}>
          {formatLatest(latest)}
        </p>
        <nav style={{ marginTop: 24 }}>
          <a href={`/${site!.slug}`} style={{ color: theme.soft, fontSize: 14, textDecoration: "none" }}>&larr; {site!.student_first_name}</a>
        </nav>
        <h1 style={{ fontFamily: `'${displayFont}', serif`, fontSize: "clamp(36px, 6vw, 60px)", fontWeight: 700, marginTop: 12 }}>{section.title}</h1>
        <section style={{ marginTop: 32 }}>
          {section.items.length === 0 ? (
            <div style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 12, padding: "28px 24px" }}>
              <p style={{ color: theme.soft, fontSize: 15 }}>
                Content for <b style={{ color: theme.ink }}>{section.title}</b> appears here as the family adds records and marks them public.
              </p>
            </div>
          ) : params.code === "athlete_tracker" ? (
            <BestTimesBoard items={section.items} theme={theme} displayFont={displayFont} />
          ) : (
            <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
              {section.items.map((it, i) => (
                <div key={i} style={{ background: theme.card, border: `1px solid ${theme.border}`, borderTop: `4px solid ${theme.accent}`, borderRadius: 12, padding: "20px 22px" }}>
                  <h3 style={{ fontFamily: `'${displayFont}', serif`, fontSize: 18, fontWeight: 600 }}>{it.title}</h3>
                  {it.date ? <p style={{ color: theme.accent, fontSize: 12, marginTop: 4 }}>{it.date}</p> : null}
                  {it.body ? <p style={{ color: theme.soft, marginTop: 8, fontSize: 14 }}>{it.body}</p> : null}
                </div>
              ))}
            </div>
          )}
        </section>
        <footer style={{ marginTop: 80, borderTop: `1px solid ${theme.border}`, paddingTop: 24, color: theme.soft, fontSize: 12, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
          <a href="https://outcomestar.app" style={{ display: "inline-flex", alignItems: "center", flexShrink: 0 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="https://outcomestar.app/outcomestar_logo_primary.png" alt="outcomestar" style={{ height: 56, background: "#fff", borderRadius: 8, padding: "6px 12px" }} />
          </a>
          <p>&copy; 2026 <a href="https://srjconsultingservices.com" style={{ color: theme.soft, textDecoration: "underline" }}>SRJ Consulting Services LLC</a></p>
        </footer>
      </main>
    </div>
  );
}

function parseTime(t?: string): number | null {
  if (!t) return null;
  const m = t.match(/^(?:(\d+):)?([0-5]?\d)(?:\.(\d+))?$/);
  if (!m) return null;
  const min = parseInt(m[1] || "0", 10);
  const sec = parseInt(m[2] || "0", 10);
  const frac = m[3] ? parseFloat("0." + m[3]) : 0;
  return min * 60 + sec + frac;
}
function fmtDrop(best?: string, first?: string): { drop: string; pct: string } {
  const b = parseTime(best), f = parseTime(first);
  if (b == null || f == null || f <= 0) return { drop: "", pct: "" };
  const d = f - b;
  return { drop: d.toFixed(2), pct: ((d / f) * 100).toFixed(1) + "%" };
}

const STROKE_ORDER = ["Free", "Back", "Breast", "Fly", "IM"] as const;
const STROKE_LABEL: Record<string, string> = { Free: "Freestyle", Back: "Backstroke", Breast: "Breaststroke", Fly: "Butterfly", IM: "Individual Medley" };

function BestTimesBoard({
  items,
  theme,
  displayFont,
}: {
  items: Array<{ title: string; date?: string; meta?: { stroke?: string; course?: string; event?: string; best_time?: string; first_time?: string; power_points?: number; usa_standard?: string } }>;
  theme: import("@/lib/genericThemes").GenericThemeTokens;
  displayFont: string;
}) {
  const byStroke: Record<string, typeof items> = {};
  for (const it of items) {
    const st = it.meta?.stroke || "Free";
    (byStroke[st] ||= []).push(it);
  }
  const strokes = STROKE_ORDER.filter((s) => byStroke[s]?.length);

  return (
    <>
      {strokes.map((st) => (
        <div key={st} style={{ marginBottom: 32 }}>
          <h3 style={{ fontFamily: `'${displayFont}', serif`, color: theme.accent, fontSize: 22, fontWeight: 600, marginBottom: 12 }}>
            {STROKE_LABEL[st]}
          </h3>
          <div style={{ overflowX: "auto", border: `1px solid ${theme.border}`, borderRadius: 12, background: theme.card }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr style={{ background: `${theme.accent}22` }}>
                  {["Event", "Best", "Pts", "Std", "First", "Drop", "%", "Meet"].map((h) => (
                    <th key={h} style={{ padding: "10px 12px", textAlign: "left", color: theme.ink, borderBottom: `2px solid ${theme.accent}`, whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {byStroke[st].map((it, i) => {
                  const m = it.meta || {};
                  const { drop, pct } = fmtDrop(m.best_time, m.first_time);
                  return (
                    <tr key={i} style={{ borderTop: `1px solid ${theme.border}` }}>
                      <td style={{ padding: "10px 12px", color: theme.ink, whiteSpace: "nowrap" }}>
                        {m.event || it.title} {m.course ? <span style={{ color: theme.soft, fontSize: 12 }}>({m.course})</span> : null}
                      </td>
                      <td style={{ padding: "10px 12px", color: theme.ink, fontWeight: 700 }}>{m.best_time || ""}</td>
                      <td style={{ padding: "10px 12px", color: theme.soft }}>{m.power_points ?? ""}</td>
                      <td style={{ padding: "10px 12px", color: theme.accent, fontWeight: 700 }}>{m.usa_standard || ""}</td>
                      <td style={{ padding: "10px 12px", color: theme.soft }}>{m.first_time || ""}</td>
                      <td style={{ padding: "10px 12px", color: theme.soft }}>{drop ? `-${drop}s` : ""}</td>
                      <td style={{ padding: "10px 12px", color: theme.soft }}>{pct}</td>
                      <td style={{ padding: "10px 12px", color: theme.soft, whiteSpace: "nowrap" }}>{it.date || ""}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </>
  );
}


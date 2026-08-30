export type LatestActivity = { date: string; kind: string };
export type LatestResponse = { latest: LatestActivity | null };

const API = process.env.FOCMS_API_URL || "https://focms-api.onrender.com";

export async function getLatest(slug: string): Promise<LatestActivity | null> {
  try {
    const r = await fetch(`${API}/focms/v1/public/site/${slug}/latest`, { cache: "no-store" });
    if (!r.ok) return null;
    const d = (await r.json()) as LatestResponse;
    return d.latest;
  } catch {
    return null;
  }
}

const KIND_LABEL: Record<string, string> = {
  events: "activity",
  awards_honors: "award",
  personal_records: "personal record",
  assessments: "assessment",
  essays: "essay",
  work_experiences: "work experience",
  portfolio_artifacts: "portfolio item",
};

export function formatLatest(latest: LatestActivity | null): string {
  if (!latest) return "Latest update: content appears here as new records are added.";
  const d = new Date(latest.date);
  const days = Math.max(0, Math.floor((Date.now() - d.getTime()) / 86_400_000));
  const kind = KIND_LABEL[latest.kind] ?? "update";
  if (days === 0) return `Latest update: new ${kind} added today.`;
  if (days === 1) return `Latest update: new ${kind} added yesterday.`;
  if (days < 30) return `Latest update: new ${kind} added ${days} days ago.`;
  return `Latest update: new ${kind} added on ${d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}.`;
}

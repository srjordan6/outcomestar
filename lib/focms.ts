/**
 * FOCMS data client.
 *
 * For v0.1 we read swim data from the public WP feed page on johnrjordan.com.
 * That feed is regenerated from Postgres and is the same JSON the inline
 * hydrator was consuming. This gets the site live today.
 *
 * Phase 2 work (next): add direct REST endpoints to focms-api so we don't
 * depend on WordPress. The Power Index endpoint already exists at
 *   GET /focms/v1/student/{id}/computed/power-index
 * but swim bests, standards, and metadata still need endpoints.
 */

const FEED_URL =
  process.env.FOCMS_FEED_URL ??
  "https://johnrjordan.com/focms-feed-swim-bests/";

export type StudentRef = {
  slug: string;
  displayName: string;
  classYear: number;
  firstTimes: Record<string, string>;
  birthDate: string;
};

export const STUDENTS: Record<string, StudentRef> = {
  john: {
    slug: "john",
    displayName: "John Ray Jordan",
    classYear: 2032,
    birthDate: "2014-08-29",
    firstTimes: {
      "50 Free LCM": "43.93",
      "50 Free SCY": "42.20",
      "100 Free LCM": "1:26.80",
      "100 Free SCY": "1:33.62",
      "200 Free LCM": "3:08.35",
      "200 Free SCY": "3:24.01",
      "500 Free SCY": "7:07.93",
      "50 Back LCM": "52.02",
      "50 Back SCY": "48.02",
      "100 Back LCM": "1:42.09",
      "100 Back SCY": "1:35.04",
      "200 Back SCY": "2:44.32",
      "50 Breast LCM": "54.14",
      "50 Breast SCY": "50.34",
      "100 Breast LCM": "1:51.51",
      "100 Breast SCY": "1:47.33",
      "200 Breast LCM": "3:07.47",
      "200 Breast SCY": "2:59.85",
      "50 Fly LCM": "38.59",
      "50 Fly SCY": "47.25",
      "100 Fly LCM": "1:37.48",
      "100 Fly SCY": "1:28.92",
      "200 Fly LCM": "3:05.52",
      "200 Fly SCY": "2:47.70",
      "100 IM SCY": "1:17.62",
      "200 IM LCM": "3:15.77",
      "200 IM SCY": "3:03.44",
    },
  },
};

export type SwimBest = {
  time: string;
  seconds: number | null;
  date: string | null;
  meet?: string;
  points?: number;
  usa_standard?: string;
  next_std?: string;
  next_time_seconds?: number;
};

export type PowerIndexTop4Item = {
  event_course: string;
  pp: number;
};

export type PowerIndexBlock = {
  value: number;
  total_eligible_events: number;
  top_4: PowerIndexTop4Item[];
  base_times_source?: {
    source_url?: string;
    effective_year?: number;
    refreshed_at?: string;
  };
};

export type SwimFeed = {
  bests: Record<string, SwimBest>;
  power_index?: PowerIndexBlock;
  _meta?: {
    schema_version?: string;
    current_age_group?: string;
  };
};

export async function getSwimFeed(): Promise<SwimFeed> {
  const res = await fetch(`${FEED_URL}?cb=${Date.now()}`, {
    next: { revalidate: 300 },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`feed HTTP ${res.status}`);
  const html = await res.text();
  const match = html.match(/<pre[^>]*>([\s\S]*?)<\/pre>/);
  if (!match) throw new Error("feed page missing <pre> with JSON");
  return JSON.parse(decodeEntities(match[1].trim()));
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

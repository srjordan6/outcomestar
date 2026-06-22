/** Parse swim time string ("1:23.45" or "43.93") to seconds. */
export function parseTime(s: string | null | undefined): number | null {
  if (!s || typeof s !== "string") return null;
  const trimmed = s.trim();
  if (!trimmed) return null;
  if (!trimmed.includes(":")) {
    const n = parseFloat(trimmed);
    return isNaN(n) ? null : n;
  }
  const [mStr, sStr] = trimmed.split(":");
  const m = parseFloat(mStr);
  const sec = parseFloat(sStr);
  if (isNaN(m) || isNaN(sec)) return null;
  return m * 60 + sec;
}

/** Format seconds back to "M:SS.HH" or "SS.HH" if under 60. */
export function formatTime(seconds: number | null | undefined): string {
  if (seconds == null || isNaN(seconds)) return "—";
  if (seconds < 60) return seconds.toFixed(2);
  const m = Math.floor(seconds / 60);
  let s = (seconds - m * 60).toFixed(2);
  if (parseFloat(s) < 10) s = "0" + s;
  return `${m}:${s}`;
}

/** Age at a given ISO date, given an ISO birth date. */
export function ageAt(dateStr: string | null | undefined, birthDate: string): string {
  if (!dateStr) return "—";
  const swim = new Date(dateStr);
  const dob = new Date(birthDate);
  if (isNaN(swim.getTime()) || isNaN(dob.getTime())) return "—";
  let age = swim.getFullYear() - dob.getFullYear();
  const m = swim.getMonth() - dob.getMonth();
  const didBirthday = m > 0 || (m === 0 && swim.getDate() >= dob.getDate());
  if (!didBirthday) age--;
  return String(age);
}

/** Pretty refreshed-at date for the citation line. */
export function formatRefreshedAt(s: string | undefined | null): string {
  if (!s) return "";
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

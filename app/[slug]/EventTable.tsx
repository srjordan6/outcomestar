import type { SwimBest, StudentRef } from "@/lib/focms";
import { ageAt, formatTime, parseTime } from "@/lib/format";

export function EventTable({
  label,
  events,
  bests,
  student,
}: {
  label: string;
  events: string[];
  bests: Record<string, SwimBest>;
  student: StudentRef;
}) {
  return (
    <>
      <h2 className="stroke-heading">{label}</h2>
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th className="w-[18%]">Event</th>
              <th className="w-[10%]">Best</th>
              <th className="w-[8%]">Pts</th>
              <th className="w-[10%]">Std → Next</th>
              <th className="w-[10%]">Needed</th>
              <th className="w-[10%]">Drop</th>
              <th className="w-[7%]">%</th>
              <th className="w-[6%]">Age</th>
              <th>Meet</th>
            </tr>
          </thead>
          <tbody>
            {events.map((eventKey) => (
              <Row
                key={eventKey}
                eventKey={eventKey}
                best={bests[eventKey]}
                firstStr={student.firstTimes[eventKey]}
                birthDate={student.birthDate}
              />
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function Row({
  eventKey,
  best,
  firstStr,
  birthDate,
}: {
  eventKey: string;
  best: SwimBest | undefined;
  firstStr: string | undefined;
  birthDate: string;
}) {
  if (!best) {
    return (
      <tr>
        <td>{eventKey}</td>
        <td colSpan={8} className="muted text-sm italic">
          No record on file
        </td>
      </tr>
    );
  }

  const firstSec = parseTime(firstStr);
  const btSec = best.seconds;

  let needed = "—";
  if (best.next_time_seconds != null && btSec != null) {
    const delta = btSec - best.next_time_seconds;
    needed = delta > 0 ? formatTime(delta) : "—";
  }

  let drop = "—";
  let pct = "—";
  if (firstSec != null && btSec != null && firstSec > 0) {
    const d = firstSec - btSec;
    drop = formatTime(d);
    pct = `${((d / firstSec) * 100).toFixed(1)}%`;
  }

  return (
    <tr>
      <td className="font-medium">{eventKey}</td>
      <td className="num">{best.time || formatTime(best.seconds)}</td>
      <td className="num">{best.points ?? ""}</td>
      <td>
        <span className="inline-flex items-center gap-1.5">
          <span className="pill pill-filled">{best.usa_standard || "—"}</span>
          <span className="text-ink-fade text-xs">→</span>
          <span className="pill pill-outline">{best.next_std || "—"}</span>
        </span>
      </td>
      <td className="num">{needed}</td>
      <td className={drop !== "—" ? "pos" : "num muted"}>{drop}</td>
      <td className={pct !== "—" ? "pos" : "num muted"}>{pct}</td>
      <td className="num">{ageAt(best.date, birthDate)}</td>
      <td className="text-sm text-ink-soft truncate max-w-[280px]">
        {best.meet ?? ""}
      </td>
    </tr>
  );
}

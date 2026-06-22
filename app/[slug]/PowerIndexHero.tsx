import type { PowerIndexBlock } from "@/lib/focms";
import { formatRefreshedAt } from "@/lib/format";

export function PowerIndexHero({ pi }: { pi: PowerIndexBlock | undefined }) {
  if (!pi || pi.value == null) {
    return (
      <section className="border-y border-rule py-12 my-12">
        <p className="eyebrow">Power Index</p>
        <p className="mt-3 text-ink-soft">Unavailable.</p>
      </section>
    );
  }

  const src = pi.base_times_source ?? {};
  const refreshed = formatRefreshedAt(src.refreshed_at);
  const yearLabel = src.effective_year != null ? String(src.effective_year) : "";

  return (
    <section className="border-y border-ink/90 py-14 my-12">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-10 items-start">
        <div className="md:col-span-7">
          <p className="eyebrow">Power Index</p>
          <div className="mt-4 font-mono text-hero text-ink leading-[0.9]">
            {pi.value.toFixed(1)}
          </div>
          <p className="mt-6 max-w-md text-ink-soft text-base leading-relaxed">
            Lower is better. Computed from{" "}
            <span className="font-mono text-ink">{pi.total_eligible_events}</span>{" "}
            eligible events benchmarked against NCAA Division I Men&apos;s{" "}
            <span className="whitespace-nowrap">{yearLabel}</span> qualifying standards.
          </p>
        </div>

        <div className="md:col-span-5">
          <p className="eyebrow">Top contributors</p>
          <ol className="mt-4 space-y-2">
            {pi.top_4.map((row, i) => (
              <li
                key={row.event_course}
                className="flex items-baseline justify-between gap-3 border-b border-rule pb-2"
              >
                <span className="flex items-baseline gap-3 min-w-0">
                  <span className="font-mono text-xs text-ink-fade tabular-nums w-4 shrink-0">
                    {i + 1}
                  </span>
                  <span className="text-ink truncate">{row.event_course}</span>
                </span>
                <span className="font-mono text-ink tabular-nums shrink-0">
                  {row.pp.toFixed(2)}
                </span>
              </li>
            ))}
          </ol>
          <p className="mt-5 text-xs text-ink-fade">
            Source: NCAA Division I Men {yearLabel} qualifying standards
            {refreshed ? ` · refreshed ${refreshed}` : ""}
          </p>
        </div>
      </div>
    </section>
  );
}

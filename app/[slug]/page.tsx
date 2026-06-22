import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getSwimFeed, STUDENTS } from "@/lib/focms";
import { STROKE_GROUPS } from "@/lib/events";
import { PowerIndexHero } from "./PowerIndexHero";
import { EventTable } from "./EventTable";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const student = STUDENTS[params.slug];
  if (!student) return { title: "Not found" };
  return {
    title: student.displayName,
    description: `${student.displayName} · Class of ${student.classYear} · Athletic and academic record.`,
  };
}

export default async function StudentPage({
  params,
}: {
  params: { slug: string };
}) {
  const student = STUDENTS[params.slug];
  if (!student) notFound();

  let feed;
  try {
    feed = await getSwimFeed();
  } catch (err) {
    return (
      <main className="mx-auto max-w-page px-6 py-24">
        <p className="eyebrow">Error</p>
        <h1 className="mt-3 font-display text-3xl">Could not load swim data</h1>
        <p className="mt-2 text-ink-soft">
          {err instanceof Error ? err.message : String(err)}
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-page px-6 pt-12 pb-24">
      <nav className="mb-10">
        <Link
          href="/"
          className="eyebrow hover:text-accent transition-colors"
        >
          ← OutcomeStar
        </Link>
      </nav>

      <header className="border-b border-ink/90 pb-8">
        <p className="eyebrow">Portfolio</p>
        <h1 className="mt-2 font-display text-5xl md:text-7xl font-semibold tracking-tight leading-[0.92]">
          {student.displayName}
        </h1>
        <p className="mt-4 text-ink-soft text-lg">
          Class of <span className="font-mono">{student.classYear}</span> ·
          Distance &amp; Breaststroke ·{" "}
          <span className="text-ink-fade">
            Tracking against NCAA Division I standards
          </span>
        </p>
      </header>

      <PowerIndexHero pi={feed.power_index} />

      <div className="mt-16">
        <p className="eyebrow">Section 01</p>
        <h2 className="mt-2 font-display text-3xl md:text-4xl font-semibold tracking-tight">
          Swim record
        </h2>
        <p className="mt-3 max-w-2xl text-ink-soft">
          Personal bests by stroke, benchmarked against USA Swimming age-group
          motivational standards and NCAA Division I qualifying times. Every
          row is sourced from a sanctioned meet result.
        </p>
        {feed._meta?.current_age_group && (
          <p className="mt-2 text-xs text-ink-fade">
            Standards shown for age group{" "}
            <span className="font-mono text-ink-soft">
              {feed._meta.current_age_group}
            </span>
            {feed._meta.schema_version && (
              <>
                {" "}· feed schema{" "}
                <span className="font-mono text-ink-soft">
                  v{feed._meta.schema_version}
                </span>
              </>
            )}
            .
          </p>
        )}
      </div>

      {STROKE_GROUPS.map((g) => (
        <EventTable
          key={g.label}
          label={g.label}
          events={g.events}
          bests={feed.bests}
          student={student}
        />
      ))}
    </main>
  );
}

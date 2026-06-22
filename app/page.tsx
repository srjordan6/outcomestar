import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto max-w-page px-6 py-24">
      <p className="eyebrow">OutcomeStar</p>
      <h1 className="mt-3 font-display text-5xl md:text-6xl font-semibold tracking-tight leading-[0.95] max-w-3xl">
        A documented record of every outcome that earned the seat.
      </h1>
      <p className="mt-6 max-w-2xl text-lg text-ink-soft">
        Each student carries a portfolio of academic, athletic, and leadership
        evidence built year over year. OutcomeStar is the place that record
        lives — citable, comparable, and ready for the people who decide.
      </p>

      <div className="mt-12 border-t border-rule pt-8">
        <p className="eyebrow">Current portfolios</p>
        <ul className="mt-4 space-y-1">
          <li>
            <Link
              href="/john"
              className="group inline-flex items-baseline gap-4 py-1 text-ink hover:text-accent"
            >
              <span className="font-display text-2xl font-semibold tracking-tight">
                John Ray Jordan
              </span>
              <span className="text-sm text-ink-fade group-hover:text-accent">
                Class of 2032 · Distance &amp; Breaststroke
              </span>
            </Link>
          </li>
        </ul>
      </div>
    </main>
  );
}

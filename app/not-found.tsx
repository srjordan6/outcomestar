import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-page px-6 py-32">
      <p className="eyebrow">404</p>
      <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">
        No portfolio here.
      </h1>
      <p className="mt-3 text-ink-soft">
        That student slug isn&apos;t in OutcomeStar yet.
      </p>
      <Link
        href="/"
        className="mt-8 inline-block text-accent hover:underline underline-offset-4"
      >
        ← Back to portfolios
      </Link>
    </main>
  );
}

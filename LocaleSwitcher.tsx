"use client";

import { SUPPORTED_LOCALES } from "@/lib/types";

type Props = { current: string; onChange: (locale: string) => void };

export default function LocaleSwitcher({ current, onChange }: Props) {
  return (
    <select
      value={current}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm shadow-sm focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
      aria-label="Language"
    >
      {SUPPORTED_LOCALES.map((l) => (
        <option key={l.code} value={l.code}>{l.label}</option>
      ))}
    </select>
  );
}
"use client";

import type { FormSection } from "@/lib/types";

type Props = {
  sections: FormSection[];
  activeId: string;
  onSelect: (sectionId: string) => void;
};

export default function SectionNav({ sections, activeId, onSelect }: Props) {
  return (
    <>
      <select
        value={activeId}
        onChange={(e) => onSelect(e.target.value)}
        className="md:hidden w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm"
      >
        {sections.map((s) => (
          <option key={s.section_id} value={s.section_id}>{s.section_label}</option>
        ))}
      </select>
      <nav className="hidden md:block">
        <ul className="flex flex-col gap-1">
          {sections.map((s) => (
            <li key={s.section_id}>
              <button
                type="button"
                onClick={() => onSelect(s.section_id)}
                className={`w-full text-left rounded-md px-3 py-2 text-sm transition ${
                  s.section_id === activeId
                    ? "bg-sky-100 text-sky-900 font-medium"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                {s.section_label}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
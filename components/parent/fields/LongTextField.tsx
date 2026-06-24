"use client";

import type { FieldDef } from "@/lib/types";

type Props = {
  field: FieldDef;
  value: string | null;
  onChange: (next: string) => void;
  disabled?: boolean;
  isEssay?: boolean;
};

function wordCount(s: string): number {
  return s.trim().length === 0 ? 0 : s.trim().split(/\s+/).length;
}

export default function LongTextField({ field, value, onChange, disabled, isEssay }: Props) {
  const text = value ?? "";
  const words = isEssay ? wordCount(text) : null;
  const maxChars = field.max_chars ?? undefined;

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={field.field_code} className="text-sm font-medium text-slate-700">
        {field.label}
        {field.is_required && <span className="text-rose-600 ml-1">*</span>}
      </label>
      <textarea
        id={field.field_code}
        value={text}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        maxLength={maxChars}
        rows={isEssay ? 12 : 4}
        className="rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:ring-1 focus:ring-sky-500 disabled:bg-slate-100 disabled:text-slate-500"
      />
      <div className="flex justify-between text-xs text-slate-500">
        <span>{field.help_text}</span>
        <span>
          {isEssay && words !== null && <>{words} words &middot; </>}
          {text.length}{maxChars ? ` / ${maxChars}` : ""} chars
        </span>
      </div>
    </div>
  );
}
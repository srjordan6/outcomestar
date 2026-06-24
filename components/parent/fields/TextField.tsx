"use client";

import type { FieldDef } from "@/lib/types";

type Props = {
  field: FieldDef;
  value: string | null;
  onChange: (next: string) => void;
  disabled?: boolean;
  inputType?: "text" | "email" | "tel";
};

export default function TextField({ field, value, onChange, disabled, inputType = "text" }: Props) {
  const max = field.max_chars ?? undefined;
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={field.field_code} className="text-sm font-medium text-slate-700">
        {field.label}
        {field.is_required && <span className="text-rose-600 ml-1">*</span>}
      </label>
      <input
        id={field.field_code}
        type={inputType}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        maxLength={max}
        className="rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:ring-1 focus:ring-sky-500 disabled:bg-slate-100 disabled:text-slate-500"
      />
      {field.help_text && <span className="text-xs text-slate-500">{field.help_text}</span>}
    </div>
  );
}
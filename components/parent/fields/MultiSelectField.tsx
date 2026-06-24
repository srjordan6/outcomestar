"use client";

import type { FieldDef } from "@/lib/types";

type Props = {
  field: FieldDef;
  value: string[] | null;
  onChange: (next: string[]) => void;
  disabled?: boolean;
};

export default function MultiSelectField({ field, value, onChange, disabled }: Props) {
  const options = field.enum_options ?? [];
  const selected = new Set(value ?? []);

  function toggle(opt: string) {
    const next = new Set(selected);
    if (next.has(opt)) next.delete(opt);
    else next.add(opt);
    onChange(Array.from(next));
  }

  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm font-medium text-slate-700">
        {field.label}
        {field.is_required && <span className="text-rose-600 ml-1">*</span>}
      </span>
      <div className="grid grid-cols-2 gap-2 rounded-md border border-slate-300 p-3 bg-white">
        {options.map((opt) => (
          <label key={opt} className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={selected.has(opt)}
              onChange={() => toggle(opt)}
              disabled={disabled}
              className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
            />
            {opt.replace(/_/g, " ")}
          </label>
        ))}
      </div>
      {field.help_text && <span className="text-xs text-slate-500">{field.help_text}</span>}
    </div>
  );
}
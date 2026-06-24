"use client";

import type { FieldDef } from "@/lib/types";

type Props = {
  field: FieldDef;
  value: boolean | null;
  onChange: (next: boolean) => void;
  disabled?: boolean;
};

export default function BooleanField({ field, value, onChange, disabled }: Props) {
  const checked = value === true;
  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm font-medium text-slate-700">
        {field.label}
        {field.is_required && <span className="text-rose-600 ml-1">*</span>}
      </span>
      <label className="inline-flex items-center gap-3 cursor-pointer">
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          disabled={disabled}
          onClick={() => onChange(!checked)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
            checked ? "bg-sky-600" : "bg-slate-300"
          } disabled:opacity-50`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
              checked ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
        <span className="text-sm text-slate-700">{checked ? "Yes" : "No"}</span>
      </label>
      {field.help_text && <span className="text-xs text-slate-500">{field.help_text}</span>}
    </div>
  );
}
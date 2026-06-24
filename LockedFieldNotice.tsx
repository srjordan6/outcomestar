"use client";

import type { FieldDef } from "@/lib/types";

type Props = { field: FieldDef; value?: unknown };

function displayValue(v: unknown): string {
  if (v === null || v === undefined || v === "") return "-";
  if (Array.isArray(v)) return v.length ? v.join(", ") : "-";
  if (typeof v === "boolean") return v ? "Yes" : "No";
  return String(v);
}

export default function LockedFieldNotice({ field, value }: Props) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-slate-700">{field.label}</span>
        <span className="inline-flex items-center rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-700">
          Locked
        </span>
      </div>
      <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
        {displayValue(value)}
      </div>
      <span className="text-xs text-slate-500">
        {field.lock_reason || "This field unlocks when the student turns 14 (COPPA/FERPA)."}
      </span>
    </div>
  );
}
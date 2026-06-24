"use client";

import type { FieldDef } from "@/lib/types";

type Props = { field: FieldDef };

export default function ArrayOfObjectsField({ field }: Props) {
  return (
    <div className="flex flex-col gap-1 rounded-md border border-dashed border-amber-400 bg-amber-50 p-4">
      <span className="text-sm font-medium text-amber-800">{field.label}</span>
      <span className="text-xs text-amber-700">
        Multi-row entry (family members, awards, activities, etc.) lands in the next release.
        For now, submit these details via email to your admissions counselor.
      </span>
    </div>
  );
}
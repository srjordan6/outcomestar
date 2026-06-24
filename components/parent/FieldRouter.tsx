"use client";

import type { FieldDef } from "@/lib/types";
import TextField from "@/components/parent/fields/TextField";
import LongTextField from "@/components/parent/fields/LongTextField";
import ChoiceField from "@/components/parent/fields/ChoiceField";
import MultiSelectField from "@/components/parent/fields/MultiSelectField";
import DateField from "@/components/parent/fields/DateField";
import NumberField from "@/components/parent/fields/NumberField";
import BooleanField from "@/components/parent/fields/BooleanField";
import ArrayOfObjectsField from "@/components/parent/fields/ArrayOfObjectsField";
import LockedFieldNotice from "@/components/parent/LockedFieldNotice";

type Props = {
  field: FieldDef;
  value: unknown;
  onChange: (next: unknown) => void;
};

export default function FieldRouter({ field, value, onChange }: Props) {
  if (field.is_locked_by_law) {
    return <LockedFieldNotice field={field} value={value} />;
  }

  switch (field.field_kind) {
    case "text":
      return <TextField field={field} value={value as string | null} onChange={onChange as (v: string) => void} />;
    case "email":
      return <TextField field={field} value={value as string | null} onChange={onChange as (v: string) => void} inputType="email" />;
    case "phone":
      return <TextField field={field} value={value as string | null} onChange={onChange as (v: string) => void} inputType="tel" />;
    case "long_text":
      return <LongTextField field={field} value={value as string | null} onChange={onChange as (v: string) => void} />;
    case "essay":
      return <LongTextField field={field} value={value as string | null} onChange={onChange as (v: string) => void} isEssay />;
    case "date":
      return <DateField field={field} value={value as string | null} onChange={onChange as (v: string) => void} />;
    case "number":
    case "numeric":
      return <NumberField field={field} value={value as number | null} onChange={onChange as (v: number | null) => void} />;
    case "boolean":
      return <BooleanField field={field} value={value as boolean | null} onChange={onChange as (v: boolean) => void} />;
    case "choice":
      return <ChoiceField field={field} value={value as string | null} onChange={onChange as (v: string) => void} />;
    case "multi_select":
      return <MultiSelectField field={field} value={value as string[] | null} onChange={onChange as (v: string[]) => void} />;
    case "array_of_objects":
      return <ArrayOfObjectsField field={field} />;
    default:
      return <div className="text-xs text-rose-600">Unsupported field kind: {field.field_kind}</div>;
  }
}
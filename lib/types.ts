// FOCMS Parent Portal — types matching focms-api v0.7.5

export const SUPPORTED_LOCALES = [
  { code: "en-US", label: "English (US)" },
  { code: "en-GB", label: "English (UK)" },
  { code: "es-ES", label: "Espanol (Espana)" },
  { code: "es-MX", label: "Espanol (Mexico)" },
  { code: "fr-FR", label: "Francais" },
  { code: "de-DE", label: "Deutsch" },
  { code: "it-IT", label: "Italiano" },
  { code: "pt-BR", label: "Portugues (Brasil)" },
  { code: "pt-PT", label: "Portugues (Portugal)" },
  { code: "nl-NL", label: "Nederlands" },
  { code: "sv-SE", label: "Svenska" },
  { code: "no-NO", label: "Norsk" },
  { code: "da-DK", label: "Dansk" },
  { code: "fi-FI", label: "Suomi" },
  { code: "pl-PL", label: "Polski" },
  { code: "ru-RU", label: "Russkiy" },
  { code: "uk-UA", label: "Ukrayinska" },
  { code: "tr-TR", label: "Turkce" },
  { code: "ar-SA", label: "Arabic" },
  { code: "he-IL", label: "Hebrew" },
  { code: "hi-IN", label: "Hindi" },
  { code: "bn-IN", label: "Bangla" },
  { code: "ta-IN", label: "Tamil" },
  { code: "zh-CN", label: "Chinese (Simplified)" },
  { code: "zh-TW", label: "Chinese (Traditional)" },
  { code: "ja-JP", label: "Japanese" },
  { code: "ko-KR", label: "Korean" },
  { code: "vi-VN", label: "Tieng Viet" },
  { code: "th-TH", label: "Thai" },
] as const;

export type LocaleCode = typeof SUPPORTED_LOCALES[number]["code"];

export type Permissions = {
  can_edit_personal: boolean;
  can_edit_academic: boolean;
  can_edit_extracurricular: boolean;
  can_edit_career: boolean;
  can_edit_higher_ed: boolean;
};

export type ParentContext = {
  tenant_id: string;
  student_id: string;
  student_name: string;
  student_age: number;
  preferred_ui_locale: string;
  permissions: Permissions;
  token_id: string;
};

export type FieldKind =
  | "text" | "long_text" | "essay" | "email" | "phone"
  | "date" | "number" | "numeric" | "boolean"
  | "choice" | "multi_select" | "array_of_objects";

export type FieldDef = {
  field_code: string;
  label: string;
  help_text: string | null;
  field_kind: FieldKind;
  is_required: boolean;
  is_locked_by_law: boolean;
  lock_reason: string | null;
  max_chars: number | null;
  source_table: string;
  source_column: string;
  enum_options: string[] | null;
};

export type FormSection = {
  section_id: string;
  section_label: string;
  section_order: number;
  fields: FieldDef[];
};

export type FormResponse = {
  student_id: string;
  student_name: string;
  student_age: number;
  locale: string;
  sections: FormSection[];
  current_values: Record<string, unknown>;
  meta: {
    total_fields: number;
    locked_fields: number;
    populated_fields: number;
  };
};

export type FieldUpdate = {
  field_code: string;
  value: string | number | boolean | string[] | null;
  record_id?: string | null;
};

export type SaveResult = {
  field_code: string;
  ok: boolean;
  error?: string;
  source_table?: string;
  source_column?: string;
  detail?: { pattern?: string };
};

export type SaveResponse = {
  successful: number;
  total_updates: number;
  results: SaveResult[];
};
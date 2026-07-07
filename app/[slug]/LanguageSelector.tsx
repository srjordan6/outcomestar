"use client";
/**
 * LanguageSelector — client-side dropdown, navigates to /{slug}/{lang}.
 * English resets to /{slug} (canonical URL, no lang segment).
 */
import { useRouter } from "next/navigation";
import { GOOGLE_LANGUAGES } from "@/lib/googleLanguages";
import type { GenericThemeTokens } from "@/lib/genericThemes";

export function LanguageSelector({
  slug,
  current,
  theme,
}: {
  slug: string;
  current: string;
  theme: GenericThemeTokens;
}) {
  const router = useRouter();
  return (
    <select
      value={current}
      onChange={(e) => {
        const v = e.target.value;
        router.push(v === "en" ? `/${slug}` : `/${slug}/${v}`);
      }}
      aria-label="Language"
      style={{
        background: theme.card,
        color: theme.ink,
        border: `1px solid ${theme.border}`,
        borderRadius: 999,
        padding: "6px 32px 6px 14px",
        fontSize: 13,
        fontWeight: 600,
        cursor: "pointer",
        appearance: "none",
        backgroundImage:
          `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'><path fill='${encodeURIComponent(theme.soft)}' d='M2 4l4 4 4-4z'/></svg>")`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 10px center",
      }}
    >
      {GOOGLE_LANGUAGES.map((l) => (
        <option key={l.code} value={l.code}>
          {l.name}
        </option>
      ))}
    </select>
  );
}

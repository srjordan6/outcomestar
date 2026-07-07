"use client";
/**
 * LanguageSelector — Google Translate widget (free, no API key).
 * Loads element.js once, sets googtrans cookie on change, reloads.
 * Cookie pattern is what google.translate.TranslateElement reads to
 * translate the entire DOM on next render.
 */
import { useEffect } from "react";
import { GOOGLE_LANGUAGES } from "@/lib/googleLanguages";
import type { GenericThemeTokens } from "@/lib/genericThemes";

function getGoogTransLang(): string {
  if (typeof document === "undefined") return "en";
  const m = document.cookie.match(/googtrans=\/en\/([^;]+)/);
  return m ? m[1] : "en";
}

export function LanguageSelector({ theme }: { theme: GenericThemeTokens }) {
  useEffect(() => {
    if (document.getElementById("gtranslate-init")) return;
    (window as unknown as { googleTranslateElementInit: () => void }).googleTranslateElementInit = () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      new (window as any).google.translate.TranslateElement(
        { pageLanguage: "en", autoDisplay: false, layout: 0 },
        "gtranslate-host",
      );
    };
    const s = document.createElement("script");
    s.id = "gtranslate-init";
    s.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    document.body.appendChild(s);
    const css = document.createElement("style");
    css.textContent = `
      #gtranslate-host, .goog-te-banner-frame, .skiptranslate { display: none !important; }
      body { top: 0 !important; }
      .goog-tooltip { display: none !important; }
      font { background: transparent !important; box-shadow: none !important; }
    `;
    document.head.appendChild(css);
  }, []);

  return (
    <>
      <div id="gtranslate-host" style={{ display: "none" }} />
      <select
        defaultValue={getGoogTransLang()}
        onChange={(e) => {
          const v = e.target.value;
          const host = window.location.hostname;
          const base = host.split(".").slice(-2).join(".");
          document.cookie = `googtrans=/en/${v}; path=/; domain=.${base}`;
          document.cookie = `googtrans=/en/${v}; path=/`;
          window.location.reload();
        }}
        aria-label="Language"
        translate="no"
        className="notranslate"
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
          backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'><path fill='${encodeURIComponent(theme.soft)}' d='M2 4l4 4 4-4z'/></svg>")`,
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
    </>
  );
}

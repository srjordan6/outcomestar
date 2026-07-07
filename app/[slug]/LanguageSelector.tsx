"use client";
/**
 * LanguageSelector v3 — Google Translate widget, cookie-driven.
 * Fixes over v2:
 *   - Reads current lang from cookie AFTER mount (SSR-safe) and syncs the select
 *   - Selecting English deletes the googtrans cookie on every path/domain scope so the widget resets
 *   - zh-CN used for Chinese Simplified (widget rejects bare "zh")
 */
import { useEffect, useState } from "react";
import { GOOGLE_LANGUAGES } from "@/lib/googleLanguages";
import type { GenericThemeTokens } from "@/lib/genericThemes";

function readGoogTrans(): string {
  if (typeof document === "undefined") return "en";
  const m = document.cookie.match(/(?:^|;\s*)googtrans=\/en\/([^;]+)/);
  return m ? m[1] : "en";
}

function clearGoogTrans() {
  const host = window.location.hostname;
  const parts = host.split(".");
  const domains = [""]; // no domain
  for (let i = 0; i < parts.length - 1; i++) domains.push("." + parts.slice(i).join("."));
  for (const d of domains) {
    document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/${d ? "; domain=" + d : ""}`;
  }
}

function setGoogTrans(lang: string) {
  const host = window.location.hostname;
  const parts = host.split(".");
  const domains = [""];
  for (let i = 0; i < parts.length - 1; i++) domains.push("." + parts.slice(i).join("."));
  for (const d of domains) {
    document.cookie = `googtrans=/en/${lang}; path=/${d ? "; domain=" + d : ""}`;
  }
}

export function LanguageSelector({ theme }: { theme: GenericThemeTokens }) {
  const [lang, setLang] = useState<string>("en");

  useEffect(() => {
    setLang(readGoogTrans());
    if (document.getElementById("gtranslate-init")) return;
    (window as unknown as { googleTranslateElementInit: () => void }).googleTranslateElementInit = () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      new (window as any).google.translate.TranslateElement(
        { pageLanguage: "en", autoDisplay: false },
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
        value={lang}
        onChange={(e) => {
          const v = e.target.value;
          if (v === "en") clearGoogTrans();
          else setGoogTrans(v);
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

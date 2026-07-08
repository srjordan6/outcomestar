"use client";

import { useEffect } from "react";

/**
 * Chatwoot support widget for the OutcomeStar product app.
 *
 * Anonymous-only for now. When the parent portal ships an auth flow,
 * this component will also call window.$chatwoot.setUser() with an
 * HMAC-signed identifier from a server route handler.
 *
 * Reads two public env vars, both baked into the client bundle at
 * build time via NEXT_PUBLIC_ prefix:
 *   NEXT_PUBLIC_CHATWOOT_WEBSITE_TOKEN
 *   NEXT_PUBLIC_CHATWOOT_BASE_URL
 *
 * Silent no-op if either is missing (local dev without .env).
 */
export default function ChatwootWidget() {
  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_CHATWOOT_WEBSITE_TOKEN;
    const baseUrl = process.env.NEXT_PUBLIC_CHATWOOT_BASE_URL;
    if (!token || !baseUrl) return;

    // ---- Positioning override (same fix as marketing) ----
    if (!document.getElementById("chatwoot-position-fix")) {
      const style = document.createElement("style");
      style.id = "chatwoot-position-fix";
      style.textContent = `
        #cw-bubble-holder {
          position: fixed !important;
          bottom: 20px !important;
          right: 20px !important;
          left: auto !important;
          top: auto !important;
          width: auto !important;
          height: auto !important;
          z-index: 999999 !important;
        }
        .woot-widget-holder { z-index: 999999 !important; }
        #chatwoot-hint {
          position: fixed;
          bottom: 34px;
          right: 92px;
          background: #201868;
          color: #ffffff;
          padding: 8px 14px;
          border-radius: 999px;
          font-family: Poppins, system-ui, -apple-system, sans-serif;
          font-size: 13px;
          font-weight: 500;
          box-shadow: 0 4px 12px rgba(32, 24, 104, 0.25);
          z-index: 999998;
          opacity: 0;
          transform: translateX(8px);
          transition: opacity 0.4s ease-out, transform 0.4s ease-out;
          pointer-events: none;
          white-space: nowrap;
        }
        #chatwoot-hint.show { opacity: 1; transform: translateX(0); }
        #chatwoot-hint::after {
          content: "";
          position: absolute;
          right: -6px;
          top: 50%;
          transform: translateY(-50%);
          border: 6px solid transparent;
          border-left-color: #201868;
          border-right: 0;
        }
      `;
      document.head.appendChild(style);
    }

    // ---- SDK settings ----
    (window as any).chatwootSettings = {
      position: "right",
      type: "standard",
      launcherTitle: "Ask Stephen",
      darkMode: "light",
    };

    // ---- Load SDK (idempotent — only inject the script tag once) ----
    if (!document.getElementById("chatwoot-sdk")) {
      const g = document.createElement("script");
      g.id = "chatwoot-sdk";
      g.src = `${baseUrl}/packs/js/sdk.js`;
      g.async = true;
      g.defer = true;
      g.onload = () => {
        (window as any).chatwootSDK.run({
          websiteToken: token,
          baseUrl: baseUrl,
        });
      };
      document.body.appendChild(g);
    }

    // ---- Bubble label hint (once per session) ----
    const SESSION_KEY = "chatwoot_hint_shown";
    if (sessionStorage.getItem(SESSION_KEY)) return;

    let attempts = 0;
    const poll = setInterval(() => {
      attempts++;
      if (document.querySelector("#cw-bubble-holder .woot-widget-bubble")) {
        clearInterval(poll);
        setTimeout(() => {
          const hint = document.createElement("div");
          hint.id = "chatwoot-hint";
          hint.textContent = "Ask Stephen";
          document.body.appendChild(hint);
          setTimeout(() => hint.classList.add("show"), 50);
          setTimeout(() => {
            hint.classList.remove("show");
            setTimeout(() => hint.remove(), 400);
          }, 8000);
          sessionStorage.setItem(SESSION_KEY, "1");
        }, 800);
      } else if (attempts > 40) {
        clearInterval(poll);
      }
    }, 500);

    return () => clearInterval(poll);
  }, []);

  return null;
}
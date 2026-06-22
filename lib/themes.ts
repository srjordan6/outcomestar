/**
 * lib/themes.ts — OutcomeStar theme registry.
 *
 * Architecture v2.2 §10 spec:
 *   - Themes are self-contained React components.
 *   - Registry maps theme_key -> { name, description, component, available }.
 *   - One theme per tenant at any given time, stored in tenant_settings.theme.key.
 *   - v1 launch ships TWO themes (Mission Control + Resume Mode). Full catalog
 *     ships at product launch.
 *   - `available: false` keeps a theme compiled and tested but hides it from
 *     the picker UI until launch.
 *
 * Adding a new theme = new file under app/[slug]/themes/ + a row in this
 * registry. The page router resolves theme_key -> component at request time.
 */

import type React from "react";
import MissionControl from "@/app/[slug]/themes/MissionControl";
import type { MissionControlProps } from "@/app/[slug]/themes/MissionControl";
import ResumeMode from "@/app/[slug]/themes/ResumeMode";
import type { ResumeModeProps } from "@/app/[slug]/themes/ResumeMode";

// Themes share the same prop shape — props are a superset that every theme
// accepts. Adding a new theme means adding to this union without changing the
// page-router contract.
export type ThemeProps = MissionControlProps & ResumeModeProps;

export interface ThemeEntry {
  key: string;
  name: string;
  description: string;
  component: React.ComponentType<ThemeProps>;
  /** Hidden from the parent-portal theme picker when false. */
  available: boolean;
}

export const THEMES: Record<string, ThemeEntry> = {
  "mission-control": {
    key: "mission-control",
    name: "Mission Control",
    description:
      "Dark space telemetry. Suited to aviation, STEM, and service-academy tracks.",
    component: MissionControl as React.ComponentType<ThemeProps>,
    available: true,
  },
  "resume-mode": {
    key: "resume-mode",
    name: "Resume Mode",
    description:
      "Print-optimized professional layout. Suited to admissions counselor share-outs and PDF export.",
    component: ResumeMode as React.ComponentType<ThemeProps>,
    available: true,
  },
  // RESERVED — built and tested before product launch:
  // "trading-card": { ... available: false },
};

export const DEFAULT_THEME_KEY = "mission-control";

/** Alias map from `?view=` query param to theme_key. */
export const VIEW_ALIASES: Record<string, string> = {
  resume: "resume-mode",
  mission: "mission-control",
};

export function resolveTheme(key?: string | null): ThemeEntry {
  const requested = key ?? DEFAULT_THEME_KEY;
  return THEMES[requested] ?? THEMES[DEFAULT_THEME_KEY];
}

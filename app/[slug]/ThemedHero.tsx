/**
 * app/[slug]/ThemedHero.tsx — v1 (2026-08-24).
 *
 * The hero block: HeroStage backdrop (one plate per entry), the legibility
 * veil, the stripe band, the photo / character, and the theme's signature
 * heading treatment. Two variants:
 *
 *   "site"     the landing page. Student first name, badge sticker, big.
 *   "section"  a section page. Section title in the same treatment, smaller
 *              identity image, and the stage shows THAT section's entries,
 *              so the swim page's backdrop is the swim record.
 *
 * Server component; HeroStage is the only client island inside it.
 */

import type { PublicSiteConfig } from "@/lib/publicSite";
import type { GenericThemeTokens } from "@/lib/genericThemes";
import type { AvatarTokens } from "@/lib/avatarTokens";
import { heroForm } from "@/lib/heroForm";
import {
  bandEnergy, fxFlags, heroVeilFor, heroVeilMobile, isDarkBg, nameStyleFor, panelShadow, photoFrameFor, readableOn,
} from "@/lib/showcaseKit";
import HeroStage from "./HeroStage";
import StudentAvatar from "./StudentAvatar";

export function ThemedHero({
  site,
  theme,
  variant,
  eyebrow,
  title,
  badge,
  chips,
  entries,
}: {
  site: PublicSiteConfig;
  theme: GenericThemeTokens;
  variant: "site" | "section";
  eyebrow: React.ReactNode;
  title: string;
  badge?: string | null;
  chips: string[];
  /** entries on the record this page represents; becomes the plate count */
  entries: number;
}) {
  const [displayFont] = theme.fonts;
  const energy = bandEnergy(theme);
  const fx = fxFlags(theme);
  const pop = theme.pop ?? theme.accent;
  const accent2 = theme.accent2 ?? theme.accent;
  const isSection = variant === "section";
  const dark = isDarkBg(theme);

  const hero = (site as PublicSiteConfig & { hero_url?: string | null }).hero_url ?? null;
  const photoFrame = photoFrameFor(theme, fx);
  const size = isSection ? 128 : 200;
  const nameStyle = nameStyleFor(
    theme, fx, energy,
    isSection
      ? (fx.isPoster ? "clamp(40px, 7vw, 84px)" : "clamp(34px, 5vw, 58px)")
      : (fx.isPoster ? "clamp(60px, 12vw, 130px)" : "clamp(42px, 7vw, 78px)"),
  );
  const tilt = fx.sticker || fx.panel ? "rotate(-2deg)" : undefined;

  return (
    <header
      className="os-hero"
      data-os-hero={variant}
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: isSection ? 24 : 32,
        alignItems: "center",
        flexDirection: fx.isPoster ? "column" : "row",
        textAlign: fx.isPoster ? "center" : "left",
        borderBottom: fx.panel ? `4px solid ${theme.ink}` : `3px solid ${theme.accent}`,
        paddingBottom: isSection ? 26 : 32,
        paddingTop: isSection ? 18 : 28,
        position: "relative",
        minHeight: isSection ? (fx.isPoster ? "40vh" : "32vh") : (fx.isPoster ? "58vh" : "46vh"),
      }}
    >
      {/* The record, rendered. Sits behind the identity block; never
          intercepts a click. */}
      <HeroStage
        form={heroForm(theme.key, theme.band)}
        entries={entries}
        bg={theme.bg}
        accent={theme.accent}
        accent2={accent2}
        pop={pop}
        base={theme.border}
        mute={theme.soft}
        light={!dark}
        xShift={fx.isPoster ? 0 : 0.45}
      />
      <div
        aria-hidden
        style={{ position: "absolute", inset: 0, zIndex: 1, pointerEvents: "none", background: heroVeilFor(theme, fx.isPoster) }}
      />
      <div
        aria-hidden
        className="os-veil-m"
        style={{ position: "absolute", inset: 0, zIndex: 1, pointerEvents: "none", background: heroVeilMobile(theme) }}
      />
      {fx.stripes ? (
        <div
          aria-hidden
          style={{
            position: "absolute",
            left: fx.isPoster ? "8%" : 0,
            right: fx.isPoster ? "8%" : "20%",
            top: "36%",
            height: "clamp(40px, 8vw, 90px)",
            background: `repeating-linear-gradient(-45deg, ${theme.accent} 0 14px, ${accent2} 14px 28px)`,
            opacity: 0.16,
            transform: "rotate(-1.5deg)",
            borderRadius: 6,
            zIndex: 1,
          }}
        />
      ) : null}

      {hero ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={hero}
          alt={site.student_first_name}
          width={size}
          height={size}
          style={{
            width: size,
            height: size,
            objectFit: "cover",
            objectPosition: "center 15%",
            flexShrink: 0,
            position: "relative",
            zIndex: 2,
            transform: tilt,
            ...photoFrame,
          }}
        />
      ) : (
        <StudentAvatar
          slug={site.slug}
          firstName={site.student_first_name}
          tokens={(site as PublicSiteConfig & { avatar_tokens?: Partial<AvatarTokens> | null }).avatar_tokens ?? null}
          size={size}
          radius={typeof photoFrame.borderRadius === "number" ? photoFrame.borderRadius : 0}
          style={{ flexShrink: 0, position: "relative", zIndex: 2, transform: tilt, ...photoFrame }}
        />
      )}

      <div style={{ flex: 1, minWidth: 260, position: "relative", zIndex: 2 }}>
        <p style={{ color: theme.accent, fontSize: 12, letterSpacing: "0.28em", textTransform: "uppercase", fontWeight: 600 }}>
          {eyebrow}
        </p>
        <h1 style={nameStyle}>{title}</h1>

        {badge ? (
          <span
            className="os-badge"
            style={{
              display: "inline-block",
              marginTop: 14,
              background: pop,
              color: readableOn(pop),
              fontFamily: `'${displayFont}', sans-serif`,
              fontSize: 14,
              letterSpacing: "0.1em",
              padding: "7px 15px",
              transform: "rotate(-2deg)",
              border: fx.panel ? `3px solid ${theme.ink}` : "none",
              borderRadius: fx.panel ? 6 : 999,
              boxShadow: fx.panel ? panelShadow(theme.ink, 3) : "0 6px 18px rgba(0,0,0,.18)",
            }}
          >
            {badge}
          </span>
        ) : null}

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16, justifyContent: fx.isPoster ? "center" : "flex-start" }}>
          {chips.filter(Boolean).map((chip) => (
            <span
              key={chip}
              style={{
                background: theme.card,
                border: fx.panel ? `2px solid ${theme.ink}` : `1px solid ${theme.border}`,
                color: theme.soft,
                borderRadius: 999,
                padding: "6px 14px",
                fontSize: 13,
              }}
            >
              {chip}
            </span>
          ))}
        </div>
      </div>
    </header>
  );
}

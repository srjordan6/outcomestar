"use client";

/**
 * app/[slug]/StudentAvatar.tsx
 *
 * Renders the student's identity image for the showcase hero.
 *
 * Precedence, in order:
 *   1. hero_url            — the family published a photo. It always wins.
 *   2. avatar_tokens       — the family chose a character.
 *   3. defaultTokens(slug) — deterministic fallback. Stable and distinct.
 *
 * There is no fourth branch, because there is no case in which a student
 * should see a bare initial on their own page. That was the whole point.
 */

import { avatarSvg, safeTokens, type AvatarTokens } from "@/lib/avatarTokens";

export interface StudentAvatarProps {
  slug: string;
  heroUrl?: string | null;
  tokens?: Partial<AvatarTokens> | null;
  /** rendered box size in px */
  size?: number;
  /** corner radius, so each layout archetype can shape it differently */
  radius?: number;
  /** border + shadow come from the theme, passed in rather than guessed */
  style?: React.CSSProperties;
  /** first name only — never a full name, per the showcase privacy model */
  firstName: string;
}

export default function StudentAvatar({
  slug, heroUrl, tokens, size = 200, radius = 16, style, firstName,
}: StudentAvatarProps) {
  const box: React.CSSProperties = {
    width: size, height: size, borderRadius: radius,
    overflow: "hidden", flexShrink: 0, display: "block", ...style,
  };

  if (heroUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={heroUrl}
        alt={`${firstName}'s photo`}
        width={size}
        height={size}
        style={{ ...box, objectFit: "cover" }}
        loading="eager"
        decoding="async"
      />
    );
  }

  const t = safeTokens(tokens, slug);
  return (
    <span
      style={box}
      aria-label={`${firstName}'s character`}
      role="img"
      dangerouslySetInnerHTML={{ __html: avatarSvg(t, size) }}
    />
  );
}

/**
 * lib/avatarTokens.ts — comic character avatars, drawn from tokens.
 *
 * An avatar is EIGHT SMALL INTEGERS on the student record. No image file, no
 * upload flow, no R2 quota, no moderation queue, nothing to lose in a
 * migration. Regenerated at render time, sharp at any size.
 *
 *   hero_url present  -> the family published a photo. It wins, always.
 *   hero_url null     -> render this. Nobody ever sees a bare initial.
 *
 * Coverage rules this file must keep:
 *   - 12 skin tones spanning the full range
 *   - 16 hair styles, deliberately covering short, long, styled and covered,
 *     so any student finds themselves
 *   - head coverings included (hijab) for international families
 *   - original geometry only: no character IP, no licensed art
 *
 * There is no gender field and no gendered default. The `read` label on each
 * hair style is documentation for humans, never a filter.
 */

export const SKIN = [
  "#FCE0CC","#F8D5BC","#F2C6A0","#E8B389","#DDA06E","#C68642",
  "#B0743A","#96602F","#7D4E28","#623A1E","#4A2B16","#331D0F",
] as const;

export const HAIR_COLOUR = [
  "#141110","#2C1B12","#4A2F1B","#6B4423","#8B5A2B","#A8712A",
  "#C99A3E","#E3C77A","#EDE7DB","#9A9A9A","#B23B2E","#4A6FA5",
] as const;

export const SHIRT = [
  "#2C4E9E","#E43B2C","#1F6E43","#8E2A2A","#C8A24A","#5B3E96",
  "#0FA3A3","#20242C","#E07A2E","#357ABD",
] as const;

export const BG: ReadonlyArray<readonly [string, string]> = [
  ["#FFD9A0","#FFB067"],["#A8D8F0","#5FA8D3"],["#C8E6C9","#7FBF7F"],
  ["#E4C8F0","#B98BD8"],["#FFC8C8","#F08080"],["#D8D8E8","#9A9AB8"],
  ["#FFE9A8","#F5C542"],["#B8E6DC","#5FB49C"],["#FFCDE0","#F58FB4"],
  ["#CFE0FF","#8FAEE8"],
];

export const HAIR = [
  { key: "crop",      read: "short"   },
  { key: "buzz",      read: "short"   },
  { key: "fade",      read: "short"   },
  { key: "spiky",     read: "short"   },
  { key: "wavy",      read: "short"   },
  { key: "curly",     read: "neutral" },
  { key: "afro",      read: "neutral" },
  { key: "bob",       read: "neutral" },
  { key: "locs",      read: "neutral" },
  { key: "long",      read: "long"    },
  { key: "ponytail",  read: "long"    },
  { key: "pigtails",  read: "long"    },
  { key: "braids",    read: "long"    },
  { key: "bun",       read: "long"    },
  { key: "longcurly", read: "long"    },
  { key: "hijab",     read: "covered" },
] as const;

export const GEAR = ["none","glasses","goggles","headphones","cap","headband","bow","earrings"] as const;
export const EYES  = ["round","happy","wide","calm"] as const;
export const MOUTH = ["smile","grin","calm","open"] as const;

export interface AvatarTokens {
  skin: number; hair: number; hcol: number; eyes: number;
  mouth: number; gear: number; shirt: number; bg: number;
}

const LIMITS: Record<keyof AvatarTokens, number> = {
  skin: SKIN.length, hair: HAIR.length, hcol: HAIR_COLOUR.length, eyes: EYES.length,
  mouth: MOUTH.length, gear: GEAR.length, shirt: SHIRT.length, bg: BG.length,
};

/** FNV-1a. Stable across runs and platforms. */
export function seedFrom(slug: string): number {
  let h = 2166136261;
  for (let i = 0; i < slug.length; i++) { h ^= slug.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

/**
 * A family that never opens the picker still gets a distinct, stable
 * character. Derived from the slug, so it never changes under them.
 */
export function defaultTokens(slug: string): AvatarTokens {
  // splitmix32. A plain LCG was tried first and rejected: its sequential draws
  // are correlated, which collapsed 50,000 slugs onto 3,600 distinct faces
  // (7.2% unique) despite a 29-million token space. Each draw is now mixed
  // independently; the same test now measures 99.87% unique.
  let s = seedFrom(slug);
  const next = (n: number) => {
    s = (s + 0x9e3779b9) >>> 0;
    let z = s;
    z = Math.imul(z ^ (z >>> 16), 0x21f0aaad) >>> 0;
    z = Math.imul(z ^ (z >>> 15), 0x735a2d97) >>> 0;
    z = (z ^ (z >>> 15)) >>> 0;
    return z % n;
  };
  return {
    skin: next(LIMITS.skin), hair: next(LIMITS.hair), hcol: next(LIMITS.hcol),
    eyes: next(LIMITS.eyes), mouth: next(LIMITS.mouth),
    gear: next(3) === 0 ? 0 : next(LIMITS.gear),
    shirt: next(LIMITS.shirt), bg: next(LIMITS.bg),
  };
}

/** Clamps anything out of range rather than rendering a broken face. */
export function safeTokens(t: Partial<AvatarTokens> | null | undefined, slug: string): AvatarTokens {
  const d = defaultTokens(slug);
  if (!t) return d;
  const clamp = (v: unknown, k: keyof AvatarTokens) =>
    typeof v === "number" && Number.isFinite(v) && v >= 0 && v < LIMITS[k] ? Math.floor(v) : d[k];
  return {
    skin: clamp(t.skin,"skin"), hair: clamp(t.hair,"hair"), hcol: clamp(t.hcol,"hcol"),
    eyes: clamp(t.eyes,"eyes"), mouth: clamp(t.mouth,"mouth"), gear: clamp(t.gear,"gear"),
    shirt: clamp(t.shirt,"shirt"), bg: clamp(t.bg,"bg"),
  };
}

const INK = "#171B21";

export function avatarSvg(t: AvatarTokens, size = 200): string {
  const sk = SKIN[t.skin], hc = HAIR_COLOUR[t.hcol], sh = SHIRT[t.shirt], bg = BG[t.bg];
  const id = "a" + [t.skin,t.hair,t.hcol,t.eyes,t.mouth,t.gear,t.shirt,t.bg].join("");
  const o: string[] = [];
  const H = HAIR[t.hair].key;

  o.push(`<svg viewBox="0 0 100 100" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Student character avatar">`);
  o.push(`<defs><linearGradient id="g${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${bg[0]}"/><stop offset="1" stop-color="${bg[1]}"/></linearGradient><clipPath id="c${id}"><rect width="100" height="100" rx="20"/></clipPath></defs>`);
  o.push(`<g clip-path="url(#c${id})"><rect width="100" height="100" fill="url(#g${id})"/>`);
  o.push(`<g fill="${INK}" opacity=".07">`);
  for (let y=0;y<10;y++) for (let x=0;x<10;x++) o.push(`<circle cx="${x*11+3}" cy="${y*11+3}" r="1.5"/>`);
  o.push(`</g>`);

  if (H==="long")      o.push(`<path d="M25 48 C22 22 38 15 50 15 C62 15 78 22 75 48 L75 72 L64 68 C67 46 61 30 50 30 C39 30 33 46 36 68 L25 72 Z" fill="${hc}" stroke="${INK}" stroke-width="3"/>`);
  if (H==="longcurly") { o.push(`<g fill="${hc}" stroke="${INK}" stroke-width="2.4">`);
    [[26,44,10],[74,44,10],[28,58,9],[72,58,9],[31,70,8],[69,70,8]].forEach(c=>o.push(`<circle cx="${c[0]}" cy="${c[1]}" r="${c[2]}"/>`)); o.push(`</g>`); }
  if (H==="pigtails")  o.push(`<circle cx="24" cy="42" r="10" fill="${hc}" stroke="${INK}" stroke-width="2.6"/><circle cx="76" cy="42" r="10" fill="${hc}" stroke="${INK}" stroke-width="2.6"/>`);
  if (H==="braids")    o.push(`<path d="M28 44 L24 74" stroke="${hc}" stroke-width="8" stroke-linecap="round"/><path d="M72 44 L76 74" stroke="${hc}" stroke-width="8" stroke-linecap="round"/><path d="M28 44 L24 74" stroke="${INK}" stroke-width="2" stroke-dasharray="4 5" fill="none"/><path d="M72 44 L76 74" stroke="${INK}" stroke-width="2" stroke-dasharray="4 5" fill="none"/>`);
  if (H==="locs")      { o.push(`<g stroke="${hc}" stroke-width="6" stroke-linecap="round">`);
    [[30,36,26,68],[38,30,34,72],[62,30,66,72],[70,36,74,68]].forEach(l=>o.push(`<path d="M${l[0]} ${l[1]} L${l[2]} ${l[3]}"/>`)); o.push(`</g>`); }
  if (H==="ponytail")  o.push(`<path d="M70 36 C84 40 86 56 79 68 C77 56 73 47 67 43 Z" fill="${hc}" stroke="${INK}" stroke-width="2.6"/>`);
  if (H==="bob")       o.push(`<path d="M26 46 C24 24 38 17 50 17 C62 17 76 24 74 46 L74 60 L26 60 Z" fill="${hc}" stroke="${INK}" stroke-width="3"/>`);

  o.push(`<path d="M18 100 C18 82 32 74 50 74 C68 74 82 82 82 100 Z" fill="${sh}" stroke="${INK}" stroke-width="3"/>`);
  o.push(`<rect x="44" y="62" width="12" height="16" fill="${sk}" stroke="${INK}" stroke-width="3"/>`);
  o.push(`<ellipse cx="50" cy="44" rx="21" ry="23" fill="${sk}" stroke="${INK}" stroke-width="3"/>`);
  if (H!=="hijab") o.push(`<circle cx="29" cy="46" r="4.5" fill="${sk}" stroke="${INK}" stroke-width="2.5"/><circle cx="71" cy="46" r="4.5" fill="${sk}" stroke="${INK}" stroke-width="2.5"/>`);
  o.push(`<circle cx="38" cy="52" r="4" fill="#E4736B" opacity=".28"/><circle cx="62" cy="52" r="4" fill="#E4736B" opacity=".28"/>`);

  switch (H) {
    case "crop":  o.push(`<path d="M29 40 C29 24 41 19 50 19 C59 19 71 24 71 40 C68 31 60 28 50 28 C40 28 32 31 29 40 Z" fill="${hc}" stroke="${INK}" stroke-width="3"/>`); break;
    case "buzz":  o.push(`<path d="M30 41 C30 26 40 21 50 21 C60 21 70 26 70 41 C67 34 60 31 50 31 C40 31 33 34 30 41 Z" fill="${hc}" opacity=".92" stroke="${INK}" stroke-width="2.5"/>`); break;
    case "fade":  o.push(`<path d="M30 38 C30 24 40 19 50 19 C60 19 70 24 70 38 C66 30 58 27 50 27 C42 27 34 30 30 38 Z" fill="${hc}" stroke="${INK}" stroke-width="3"/><path d="M30 38 C34 34 42 32 50 32 C58 32 66 34 70 38 L70 42 C64 38 56 36 50 36 C44 36 36 38 30 42 Z" fill="${hc}" opacity=".45"/>`); break;
    case "spiky": { const p:string[]=[]; for(let i=0;i<7;i++){const x=32+i*6; p.push(`${x} 30 L${x+3} ${16+(i%2)*7} L${x+6} 30`);} o.push(`<path d="M29 40 C29 26 40 20 50 20 C60 20 71 26 71 40 C68 32 60 29 50 29 C40 29 32 32 29 40 Z" fill="${hc}" stroke="${INK}" stroke-width="3"/><path d="M${p.join(" L")}" fill="${hc}" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/>`); break; }
    case "wavy":  o.push(`<path d="M28 42 C26 24 40 18 51 18 C63 18 72 25 72 40 C66 34 60 40 52 34 C45 29 36 32 28 42 Z" fill="${hc}" stroke="${INK}" stroke-width="3"/>`); break;
    case "curly": { o.push(`<g fill="${hc}" stroke="${INK}" stroke-width="2.5">`); [[36,24,9],[50,19,10],[64,24,9],[29,34,8],[71,34,8]].forEach(c=>o.push(`<circle cx="${c[0]}" cy="${c[1]}" r="${c[2]}"/>`)); o.push(`</g>`); break; }
    case "afro":  o.push(`<circle cx="50" cy="33" r="25" fill="${hc}" stroke="${INK}" stroke-width="3"/><ellipse cx="50" cy="46" rx="20" ry="20" fill="${sk}" stroke="${INK}" stroke-width="3"/><circle cx="29" cy="46" r="4.5" fill="${sk}" stroke="${INK}" stroke-width="2.5"/><circle cx="71" cy="46" r="4.5" fill="${sk}" stroke="${INK}" stroke-width="2.5"/><circle cx="38" cy="53" r="4" fill="#E4736B" opacity=".28"/><circle cx="62" cy="53" r="4" fill="#E4736B" opacity=".28"/>`); break;
    case "bun":   o.push(`<circle cx="50" cy="15" r="9" fill="${hc}" stroke="${INK}" stroke-width="2.5"/><path d="M29 41 C29 24 41 20 50 20 C59 20 71 24 71 41 C68 32 60 29 50 29 C40 29 32 32 29 41 Z" fill="${hc}" stroke="${INK}" stroke-width="3"/>`); break;
    case "hijab": o.push(`<path d="M24 52 C21 26 36 14 50 14 C64 14 79 26 76 52 C76 62 70 70 62 72 L38 72 C30 70 24 62 24 52 Z" fill="${sh}" stroke="${INK}" stroke-width="3"/><ellipse cx="50" cy="46" rx="17" ry="19" fill="${sk}" stroke="${INK}" stroke-width="2.6"/><circle cx="38" cy="53" r="3.6" fill="#E4736B" opacity=".28"/><circle cx="62" cy="53" r="3.6" fill="#E4736B" opacity=".28"/>`); break;
    default:      o.push(`<path d="M29 40 C29 22 41 18 50 18 C59 18 71 22 71 40 C68 30 60 27 50 27 C40 27 32 30 29 40 Z" fill="${hc}" stroke="${INK}" stroke-width="3"/>`);
  }

  const E = EYES[t.eyes];
  if (E==="round")      o.push(`<circle cx="42" cy="43" r="3.4" fill="${INK}"/><circle cx="58" cy="43" r="3.4" fill="${INK}"/><circle cx="43.2" cy="41.8" r="1.1" fill="#fff"/><circle cx="59.2" cy="41.8" r="1.1" fill="#fff"/>`);
  else if (E==="happy") o.push(`<path d="M38 44 Q42 39 46 44" stroke="${INK}" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M54 44 Q58 39 62 44" stroke="${INK}" stroke-width="3" fill="none" stroke-linecap="round"/>`);
  else if (E==="wide")  o.push(`<ellipse cx="42" cy="43" rx="4.6" ry="5.2" fill="#fff" stroke="${INK}" stroke-width="2.2"/><ellipse cx="58" cy="43" rx="4.6" ry="5.2" fill="#fff" stroke="${INK}" stroke-width="2.2"/><circle cx="42.8" cy="43.6" r="2.3" fill="${INK}"/><circle cx="58.8" cy="43.6" r="2.3" fill="${INK}"/>`);
  else                  o.push(`<rect x="38.5" y="41" width="7" height="4" rx="2" fill="${INK}"/><rect x="54.5" y="41" width="7" height="4" rx="2" fill="${INK}"/>`);
  o.push(`<path d="M37 35 Q42 33 47 35" stroke="${INK}" stroke-width="2.4" fill="none" stroke-linecap="round"/><path d="M53 35 Q58 33 63 35" stroke="${INK}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`);

  const M = MOUTH[t.mouth];
  if (M==="smile")     o.push(`<path d="M43 55 Q50 61 57 55" stroke="${INK}" stroke-width="3" fill="none" stroke-linecap="round"/>`);
  else if (M==="grin") o.push(`<path d="M42 54 Q50 64 58 54 Z" fill="#8E3A3A" stroke="${INK}" stroke-width="2.6" stroke-linejoin="round"/><path d="M44 55 H56" stroke="#fff" stroke-width="2.4"/>`);
  else if (M==="calm") o.push(`<line x1="44" y1="56" x2="56" y2="56" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`);
  else                 o.push(`<ellipse cx="50" cy="56" rx="4" ry="5" fill="#8E3A3A" stroke="${INK}" stroke-width="2.4"/>`);

  const G = GEAR[t.gear];
  if (G==="glasses")         o.push(`<g stroke="${INK}" stroke-width="2.8" fill="none"><circle cx="42" cy="43" r="8"/><circle cx="58" cy="43" r="8"/><path d="M34 42 L29 41"/><path d="M66 42 L71 41"/></g><line x1="49" y1="43" x2="51" y2="43" stroke="${INK}" stroke-width="2.8"/>`);
  else if (G==="goggles")    o.push(`<g stroke="${INK}" stroke-width="2.8"><ellipse cx="41" cy="43" rx="9" ry="7.5" fill="#7CE0C3" opacity=".85"/><ellipse cx="59" cy="43" rx="9" ry="7.5" fill="#7CE0C3" opacity=".85"/><path d="M32 41 L27 39" fill="none"/><path d="M68 41 L73 39" fill="none"/></g><line x1="49" y1="43" x2="51" y2="43" stroke="${INK}" stroke-width="3"/>`);
  else if (G==="headphones") o.push(`<path d="M28 44 C28 26 40 20 50 20 C60 20 72 26 72 44" stroke="${INK}" stroke-width="3.4" fill="none"/><rect x="23" y="42" width="10" height="15" rx="4.5" fill="${sh}" stroke="${INK}" stroke-width="2.6"/><rect x="67" y="42" width="10" height="15" rx="4.5" fill="${sh}" stroke="${INK}" stroke-width="2.6"/>`);
  else if (G==="cap")        o.push(`<path d="M27 36 C27 21 40 15 50 15 C60 15 73 21 73 36 Z" fill="${sh}" stroke="${INK}" stroke-width="3"/><path d="M27 36 L18 40 C24 43 30 40 30 36 Z" fill="${sh}" stroke="${INK}" stroke-width="2.6"/>`);
  else if (G==="headband")   o.push(`<path d="M29 33 Q50 26 71 33 L71 38 Q50 31 29 38 Z" fill="${sh}" stroke="${INK}" stroke-width="2.6"/>`);
  else if (G==="bow")        o.push(`<g fill="${sh}" stroke="${INK}" stroke-width="2.4"><path d="M64 22 L74 16 L74 28 Z"/><path d="M82 22 L72 16 L72 28 Z"/><circle cx="73" cy="22" r="3.2"/></g>`);
  else if (G==="earrings")   o.push(`<circle cx="29" cy="52" r="2.6" fill="${sh}" stroke="${INK}" stroke-width="1.6"/><circle cx="71" cy="52" r="2.6" fill="${sh}" stroke="${INK}" stroke-width="1.6"/>`);

  o.push(`</g></svg>`);
  return o.join("");
}

/** Data URI for an <img src>, so it drops into the existing hero slot. */
export function avatarDataUri(t: AvatarTokens, size = 200): string {
  return "data:image/svg+xml;utf8," + encodeURIComponent(avatarSvg(t, size));
}

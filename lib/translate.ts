/**
 * lib/translate.ts â second-language site translation (theme sprint).
 * Google Cloud Translation v2 REST with an API key (GOOGLE_TRANSLATE_API_KEY).
 * Module-level cache; graceful English fallback when the key is absent or the
 * call fails, so second-language routes never 500.
 */

const KEY = process.env.GOOGLE_TRANSLATE_API_KEY;
const cache = new Map<string, string[]>();

export async function translateBatch(texts: string[], target: string): Promise<string[]> {
  if (!KEY || target === "en" || texts.length === 0) return texts;
  const ck = target + "\u0000" + texts.join("\u0000");
  const hit = cache.get(ck);
  if (hit) return hit;
  try {
    const r = await fetch(
      `https://translation.googleapis.com/language/translate/v2?key=${KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ q: texts, target, source: "en", format: "text" }),
        next: { revalidate: 86400 },
      },
    );
    if (!r.ok) return texts;
    const d = (await r.json()) as { data?: { translations?: Array<{ translatedText: string }> } };
    const out = d.data?.translations?.map((t) => t.translatedText) ?? texts;
    const res = out.length === texts.length ? out : texts;
    cache.set(ck, res);
    return res;
  } catch {
    return texts;
  }
}

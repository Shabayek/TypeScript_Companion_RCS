/**
 * Pseudo-localisation: English made visibly foreign and about a third longer,
 * still readable. Text that stays plain English on screen was never routed
 * through a translation; a layout that breaks was not ready for German.
 *
 * Kept intact: code (`inline` and ``` fenced ```), {placeholders}, Markdown
 * markers and link targets, so the result renders and grades exactly like
 * the original. Development and tests only.
 */
const ACCENTED: Record<string, string> = {
  a: 'å', b: 'ƀ', c: 'ç', d: 'đ', e: 'é', f: 'ƒ', g: 'ğ', h: 'ĥ', i: 'î', j: 'ĵ', k: 'ķ', l: 'ļ', m: 'ɱ',
  n: 'ñ', o: 'ö', p: 'þ', q: 'ǫ', r: 'ŕ', s: 'š', t: 'ţ', u: 'û', v: 'ṽ', w: 'ŵ', x: 'ẋ', y: 'ý', z: 'ž',
  A: 'Å', B: 'Ɓ', C: 'Ç', D: 'Đ', E: 'É', F: 'Ƒ', G: 'Ğ', H: 'Ĥ', I: 'Î', J: 'Ĵ', K: 'Ķ', L: 'Ļ', M: 'Ṁ',
  N: 'Ñ', O: 'Ö', P: 'Þ', Q: 'Ǫ', R: 'Ŕ', S: 'Š', T: 'Ţ', U: 'Û', V: 'Ṽ', W: 'Ŵ', X: 'Ẋ', Y: 'Ý', Z: 'Ž',
};

/** Pieces that must survive untouched. */
const KEEP = /(```[\s\S]*?```|`[^`\n]*`|\{\w+\}|\]\([^)]*\)|https?:\/\/\S+|\*\*|__|\n)/g;

function accent(text: string): string {
  return text.replace(/[A-Za-z]/g, (letter) => ACCENTED[letter] ?? letter);
}

export function pseudo(text: string): string {
  if (text.trim() === '') return text;
  const parts = text.split(KEEP);
  let letters = 0;
  const body = parts
    .map((part, index) => {
      // split() with a capture group puts the kept pieces at odd indexes.
      if (index % 2 === 1) return part;
      letters += (part.match(/[A-Za-z]/g) ?? []).length;
      return accent(part);
    })
    .join('');
  const padding = ' ' + '·'.repeat(Math.max(1, Math.ceil(letters * 0.35)));
  return `⟦${body}${padding}⟧`;
}

type Tree = { readonly [key: string]: string | Tree };

/** A whole message catalogue, pseudo-localised (plural forms included). */
export function pseudoCatalogue<T extends Tree>(tree: T): T {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(tree)) {
    out[key] = typeof value === 'string' ? pseudo(value) : pseudoCatalogue(value);
  }
  return out as T;
}

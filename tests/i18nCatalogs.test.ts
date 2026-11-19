// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { LANGUAGES, PSEUDO_LANGUAGE } from '../src/i18n/languages';
import { en } from '../src/i18n/locales/en';
import { loadTranslation, translate, type Translation } from '../src/i18n/messages';

type Node = string | { readonly [key: string]: Node };
const PLURAL = new Set(['zero', 'one', 'two', 'few', 'many', 'other']);
const isPlural = (node: Node): node is Record<string, string> =>
  typeof node === 'object' && 'other' in node && Object.keys(node).every((key) => PLURAL.has(key));

/** Every message, by dotted key: a string, or plural forms. */
function flatten(node: Node, prefix = ''): Map<string, string | Record<string, string>> {
  const out = new Map<string, string | Record<string, string>>();
  if (typeof node === 'string' || isPlural(node)) {
    out.set(prefix.slice(0, -1), node);
    return out;
  }
  for (const [key, child] of Object.entries(node)) for (const [k, v] of flatten(child, `${prefix}${key}.`)) out.set(k, v);
  return out;
}

const placeholders = (text: string) => new Set([...text.matchAll(/\{(\w+)\}/g)].map((match) => match[1]));
/** Real code spans; a lone backtick talked about in prose ("starts with ` …") is not one. */
const codeSpans = (text: string) => (text.match(/`[^`\s][^`]*`/g) ?? []).sort();

const english = flatten(en as unknown as Node);
const translated = LANGUAGES.filter((language) => language.code !== 'en' && language.code !== PSEUDO_LANGUAGE);

describe.each(translated.map((language) => [language.englishName, language.code] as const))('%s screen text', (_name, code) => {
  let catalogue: Map<string, string | Record<string, string>>;

  it('loads', async () => {
    const translation: Translation = await loadTranslation(code);
    catalogue = flatten(translation as unknown as Node);
    expect(catalogue.size).toBeGreaterThan(0);
  });

  it('has exactly the English keys: none missing, none unknown', () => {
    const missing = [...english.keys()].filter((key) => !catalogue.has(key));
    const unknown = [...catalogue.keys()].filter((key) => !english.has(key));
    expect(missing, `missing in ${code}`).toEqual([]);
    expect(unknown, `unknown in ${code}`).toEqual([]);
  });

  it('keeps every {placeholder}, and every `code span`', () => {
    const problems: string[] = [];
    for (const [key, source] of english) {
      const target = catalogue.get(key);
      if (target === undefined) continue;
      const sourceText = typeof source === 'string' ? source : source.other ?? '';
      const forms = typeof target === 'string' ? { other: target } : target;
      for (const [form, text] of Object.entries(forms)) {
        const want = placeholders(sourceText);
        const have = placeholders(text);
        for (const name of have) if (!want.has(name)) problems.push(`${key}.${form}: unknown {${name}}`);
        // The "other" form carries every placeholder; one/two may leave out {count}.
        for (const name of want) if (!have.has(name) && (form === 'other' || name !== 'count')) problems.push(`${key}.${form}: lost {${name}}`);
        if (JSON.stringify(codeSpans(text)) !== JSON.stringify(codeSpans(sourceText))) problems.push(`${key}.${form}: code spans differ`);
      }
    }
    expect(problems).toEqual([]);
  });

  it('has every plural form the language needs', () => {
    const needed = new Intl.PluralRules(code).resolvedOptions().pluralCategories;
    const problems: string[] = [];
    for (const [key, source] of english) {
      if (typeof source === 'string') continue;
      const target = catalogue.get(key);
      if (typeof target !== 'object') {
        problems.push(`${key}: should have plural forms`);
        continue;
      }
      for (const category of needed) if (!target[category]) problems.push(`${key}: no "${category}" form`);
    }
    expect(problems).toEqual([]);
  });

  it('picks plural forms that read correctly', async () => {
    const translation = await loadTranslation(code);
    for (const count of [0, 1, 2, 3, 5, 11, 100, 1_000_000]) {
      const text = translate(code, translation, 'practice.stepsReady', { count });
      expect(text.length).toBeGreaterThan(0);
      expect(text).not.toContain('{');
    }
  });
});

describe('French typography', () => {
  it('puts a no-break space before : ; ! ? and inside « », never a plain one', async () => {
    const catalogue = flatten((await loadTranslation('fr')) as unknown as Node);
    const problems: string[] = [];
    for (const [key, value] of catalogue) {
      for (const text of typeof value === 'string' ? [value] : Object.values(value)) {
        const prose = text.replace(/`[^`]*`/g, 'X').replace(/\{\w+\}/g, 'X');
        if (/ [;!?]| :(\s|$)|« | »/.test(prose)) problems.push(`${key}: ${text}`);
      }
    }
    expect(problems).toEqual([]);
  });
});

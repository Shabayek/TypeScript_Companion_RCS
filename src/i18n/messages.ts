import { en } from './locales/en';
import { DEFAULT_LANGUAGE, languageInfo } from './languages';
import { renderText, type Text } from './text';

/** A message: plain text, or plural forms keyed by `Intl.PluralRules` category. */
export type PluralForms = { readonly other: string } & Partial<
  Record<'zero' | 'one' | 'two' | 'few' | 'many', string>
>;
type Message = string | PluralForms;

/** English's shape with every leaf widened, so other languages can fill it. */
type Shape<T> = { readonly [K in keyof T]: T[K] extends string ? string : T[K] extends PluralForms ? PluralForms : Shape<T[K]> };
type DeepPartial<T> = { readonly [K in keyof T]?: T[K] extends string | PluralForms ? T[K] : DeepPartial<T[K]> };

export type Messages = Shape<typeof en>;
/** What a translation provides: any subset of the English keys. */
export type Translation = DeepPartial<Messages>;

/** Every message key as a dotted path, e.g. `"nav.journey"`. */
export type MessageKey = KeyPaths<typeof en>;
type KeyPaths<T, Prefix extends string = ''> = {
  [K in keyof T & string]: T[K] extends string | PluralForms
    ? `${Prefix}${K}`
    : KeyPaths<T[K], `${Prefix}${K}.`>;
}[keyof T & string];

export const ENGLISH: Messages = en;

/**
 * Catalogues other than English load on demand, so a learner only downloads
 * the language they use. Register a language here and in `languages.ts`.
 */
const LOADERS: Readonly<Record<string, () => Promise<Translation>>> = {
  fr: () => import('./locales/fr').then((file) => file.fr),
  de: () => import('./locales/de').then((file) => file.de),
  lb: () => import('./locales/lb').then((file) => file.lb),
  it: () => import('./locales/it').then((file) => file.it),
  'pt-PT': () => import('./locales/pt-PT').then((file) => file.ptPT),
  ar: () => import('./locales/ar').then((file) => file.ar),
  // The test pseudo-language exists in development and tests only; the
  // production build drops this branch (and the pseudo code) entirely.
  ...(import.meta.env.DEV || import.meta.env.MODE === 'test'
    ? { 'en-XA': () => import('./pseudo').then((file) => file.pseudoCatalogue(en) as Translation) }
    : {}),
};

export function hasCatalogue(code: string): boolean {
  return code === DEFAULT_LANGUAGE || code in LOADERS;
}

export async function loadTranslation(code: string): Promise<Translation> {
  if (code === DEFAULT_LANGUAGE) return {};
  const load = LOADERS[code];
  return load ? load() : {};
}

function isPlural(value: unknown): value is PluralForms {
  return typeof value === 'object' && value !== null && typeof (value as { other?: unknown }).other === 'string';
}

function lookup(tree: unknown, key: string): Message | undefined {
  let node: unknown = tree;
  for (const part of key.split('.')) {
    if (typeof node !== 'object' || node === null) return undefined;
    node = (node as Record<string, unknown>)[part];
  }
  return typeof node === 'string' || isPlural(node) ? node : undefined;
}

export type MessageParams = Readonly<Record<string, string | number>>;

const pluralRules = new Map<string, Intl.PluralRules>();
function pluralCategory(language: string, count: number): Intl.LDMLPluralRule {
  let rules = pluralRules.get(language);
  if (!rules) {
    rules = new Intl.PluralRules(language);
    pluralRules.set(language, rules);
  }
  return rules.select(count);
}

/**
 * Resolve a key in a translation, falling back to English, then to the key
 * itself (so a missing message is visible, never blank). `{name}` placeholders
 * are filled from `params`; numbers are formatted for the language.
 */
export function translate(
  language: string,
  translation: Translation,
  key: MessageKey,
  params: MessageParams = {},
): string {
  const message = lookup(translation, key) ?? lookup(ENGLISH, key);
  if (message === undefined) return key;
  let text: string;
  if (typeof message === 'string') {
    text = message;
  } else {
    const count = typeof params.count === 'number' ? params.count : 0;
    text = message[pluralCategory(language, count)] ?? message.other;
  }
  const rtl = languageInfo(language).dir === 'rtl';
  return text.replace(/\{(\w+)\}/g, (whole, name: string) => {
    const value = params[name];
    if (value === undefined) return whole;
    if (typeof value === 'number') return formatNumber(value, language);
    // In a right-to-left sentence, an inserted Latin text (an English lesson
    // title such as "What is a program?") is isolated, so its punctuation
    // stays at its own end instead of jumping to the other side.
    return rtl && /[A-Za-z]/.test(value) ? `\u2068${value}\u2069` : value;
  });
}

/**
 * The locale to format numbers and dates with. Arabic keeps Western digits
 * (0–9): they match the numbers in code, which is never translated.
 */
export function intlLocale(language: string): string {
  return language.split('-')[0] === 'ar' ? `${language}-u-nu-latn` : language;
}

export function formatNumber(value: number, language: string, options?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat(intlLocale(language), options).format(value);
}

/** "2, 3 and 4" in the language's own way (Intl.ListFormat, with a plain fallback). */
export function formatList(items: readonly string[], language: string): string {
  const ListFormat = (Intl as unknown as { ListFormat?: new (lang: string, options: object) => { format: (list: readonly string[]) => string } }).ListFormat;
  if (ListFormat) return new ListFormat(intlLocale(language), { style: 'long', type: 'conjunction' }).format(items);
  return items.join(', ');
}

export function formatDate(value: number | Date, language: string, options?: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat(intlLocale(language), options).format(value);
}

/** English, for logs, tests and the build-time content check. */
export function inEnglish(text: Text): string {
  return renderText(text, (key, params) => translate('en', {}, key, params));
}

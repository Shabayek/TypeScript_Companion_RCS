/**
 * The languages the app can show. Adding one means: an entry here, a message
 * catalogue in `locales/<code>.ts` registered in `messages.ts`, and (when it
 * is ready) lesson overlays in `content/locales/<code>/`. Anything not
 * translated falls back to English.
 */
export interface LanguageInfo {
  /** BCP 47 code, also used for `<html lang>`, `Intl` and speech voices. */
  code: string;
  /** The name in the language itself, as shown in the picker. */
  nativeName: string;
  englishName: string;
  dir: 'ltr' | 'rtl';
  /**
   * Voices to read aloud with, most wanted first. Luxembourgish voices are
   * rare, so German and French follow.
   */
  speech: readonly string[];
  /**
   * `source`: the language the course is written in. `preview`: translated,
   * waiting for a native speaker's review. `reviewed`: reviewed.
   */
  status: 'source' | 'preview' | 'reviewed';
}

export const DEFAULT_LANGUAGE = 'en';

/** A test language (stretched, accented English), in development and tests only. */
export const PSEUDO_LANGUAGE = 'en-XA';

const SHIPPED: readonly LanguageInfo[] = [
  { code: 'en', nativeName: 'English', englishName: 'English', dir: 'ltr', speech: ['en-GB', 'en'], status: 'source' },
  { code: 'fr', nativeName: 'Français', englishName: 'French', dir: 'ltr', speech: ['fr-FR', 'fr'], status: 'preview' },
  { code: 'de', nativeName: 'Deutsch', englishName: 'German', dir: 'ltr', speech: ['de-DE', 'de'], status: 'preview' },
  {
    code: 'lb',
    nativeName: 'Lëtzebuergesch',
    englishName: 'Luxembourgish',
    dir: 'ltr',
    speech: ['lb', 'de-DE', 'de', 'fr-FR', 'fr'],
    status: 'preview',
  },
  { code: 'it', nativeName: 'Italiano', englishName: 'Italian', dir: 'ltr', speech: ['it-IT', 'it'], status: 'preview' },
  {
    code: 'pt-PT',
    nativeName: 'Português (Portugal)',
    englishName: 'European Portuguese',
    dir: 'ltr',
    speech: ['pt-PT', 'pt'],
    status: 'preview',
  },
  { code: 'ar', nativeName: 'العربية', englishName: 'Arabic', dir: 'rtl', speech: ['ar'], status: 'preview' },
];

const PSEUDO: LanguageInfo = {
  code: PSEUDO_LANGUAGE,
  nativeName: '[Ƥšéûđöļöçåļé]',
  englishName: 'Pseudo-locale (testing)',
  dir: 'ltr',
  speech: ['en'],
  status: 'preview',
};

// Read defensively: the browser tests import this file in plain Node, where
// Vite's import.meta.env does not exist.
const env = (import.meta as ImportMeta & { env?: Partial<ImportMetaEnv> }).env;

/** In the production build, only the real languages. */
export const LANGUAGES: readonly LanguageInfo[] = env?.DEV || env?.MODE === 'test' ? [...SHIPPED, PSEUDO] : SHIPPED;

const BY_CODE = new Map(LANGUAGES.map((language) => [language.code, language]));

export function isSupportedLanguage(code: unknown): code is string {
  return typeof code === 'string' && BY_CODE.has(code);
}

export function languageInfo(code: string): LanguageInfo {
  return BY_CODE.get(code) ?? (BY_CODE.get(DEFAULT_LANGUAGE) as LanguageInfo);
}

/**
 * The best supported language for a device's preference list (for example
 * `navigator.languages`): an exact match first, then the same base language
 * (`pt-BR` finds `pt-PT`, `fr-BE` finds `fr`), then English.
 */
export function matchLanguage(preferred: readonly string[]): string {
  const real = LANGUAGES.filter((language) => language.code !== PSEUDO_LANGUAGE);
  for (const wanted of preferred) {
    const lower = wanted.toLowerCase();
    const exact = real.find((language) => language.code.toLowerCase() === lower);
    if (exact) return exact.code;
    const base = lower.split('-')[0];
    const sameBase = real.find((language) => language.code.toLowerCase().split('-')[0] === base);
    if (sameBase) return sameBase.code;
  }
  return DEFAULT_LANGUAGE;
}

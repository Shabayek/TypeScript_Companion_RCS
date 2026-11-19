import { createContext, useContext, type ReactNode } from 'react';
import { DEFAULT_LANGUAGE, languageInfo } from '../i18n/languages';

/**
 * The language lesson text is in, when it differs from the screen's: an
 * English lesson shown in the Arabic interface, until it is translated.
 * Lesson text (rendered by `Markdown` / `InlineMarkdown`) then carries its own
 * `lang` and `dir`, so English punctuation and alignment are right inside a
 * right-to-left screen, and screen readers use the right voice.
 */
export interface TextLanguage {
  lang: string;
  dir: 'ltr' | 'rtl';
}

const ContentLanguageContext = createContext<TextLanguage | null>(null);

/** What to mark lesson text with, or null when it is in the screen's language. */
export function textLanguageFor(textLanguage: string | undefined, screenLanguage: string): TextLanguage | null {
  const lang = textLanguage ?? DEFAULT_LANGUAGE;
  if (lang === screenLanguage) return null;
  return { lang, dir: languageInfo(lang).dir };
}

export function ContentLanguage({ value, children }: { value: TextLanguage | null; children: ReactNode }) {
  return <ContentLanguageContext.Provider value={value}>{children}</ContentLanguageContext.Provider>;
}

/** `lang` and `dir` for an element showing lesson text (nothing when it matches the screen). */
export function useTextLanguageProps(): { lang?: string; dir?: 'ltr' | 'rtl' } {
  const value = useContext(ContentLanguageContext);
  return value ? { lang: value.lang, dir: value.dir } : {};
}

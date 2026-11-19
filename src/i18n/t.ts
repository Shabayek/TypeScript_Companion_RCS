import { useCallback } from 'react';
import { create } from 'zustand';
import { DEFAULT_LANGUAGE, isSupportedLanguage, languageInfo } from './languages';
import { loadTranslation, translate, type MessageKey, type MessageParams, type Translation } from './messages';
import { NO_COURSE_TEXT, loadCourseText, type CourseText } from '../content/courseText';

interface I18nState {
  /** The language on screen. Changes only once its catalogue has loaded. */
  language: string;
  translation: Translation;
  /** Course-wide wording in that language: module and lesson titles, glossary. */
  courseText: CourseText;
}

/**
 * The active language. Kept apart from saved settings on purpose: when the
 * learner picks a new language, the current wording stays on screen until the
 * new catalogue is ready, then everything swaps at once — no blank frame, no
 * remount, no change of page.
 */
export const useI18n = create<I18nState>(() => ({
  language: DEFAULT_LANGUAGE,
  translation: {},
  courseText: NO_COURSE_TEXT,
}));

let latestRequest = 0;

/** Switch the screen to a language (falls back to English when unknown). */
export async function activateLanguage(code: string): Promise<void> {
  const language = isSupportedLanguage(code) ? code : DEFAULT_LANGUAGE;
  if (useI18n.getState().language === language) return;
  const request = ++latestRequest;
  let translation: Translation = {};
  let courseText: CourseText = NO_COURSE_TEXT;
  try {
    // Both, then one swap: the screen never shows a mix of two languages.
    [translation, courseText] = await Promise.all([loadTranslation(language), loadCourseText(language)]);
  } catch (error) {
    // A missing catalogue must not take the app down: stay in the current language.
    console.error(`[TypeScript Companion] the ${language} messages could not load`, error);
    return;
  }
  // A later switch wins over an earlier one that finished last.
  if (request !== latestRequest) return;
  useI18n.setState({ language, translation, courseText });
}

export type TFunction = (key: MessageKey, params?: MessageParams) => string;

/** Messages outside React (toasts, speech). */
export function t(key: MessageKey, params?: MessageParams): string {
  const { language, translation } = useI18n.getState();
  return translate(language, translation, key, params);
}

/** Messages in components; re-renders when the language changes. */
export function useT(): { t: TFunction; language: string; dir: 'ltr' | 'rtl' } {
  const language = useI18n((state) => state.language);
  const translation = useI18n((state) => state.translation);
  const bound = useCallback<TFunction>(
    (key, params) => translate(language, translation, key, params),
    [language, translation],
  );
  return { t: bound, language, dir: languageInfo(language).dir };
}

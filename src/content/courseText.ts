import { PSEUDO_LANGUAGE } from '../i18n/languages';
import { ALL_LESSONS, MODULES } from './curriculum';
import { GLOSSARY } from './glossary';
import type { CourseOverlay, GlossaryOverlay, ModuleOverlay } from './overlay';
import type { Lesson } from './schema';

/**
 * Finds and loads course translations. Files are discovered, not registered:
 * dropping `content/locales/de/m03.ts` in place is enough. Each is its own
 * chunk, so a learner downloads only their language (and the service worker
 * precaches them all for offline use, like every other file).
 */
const COURSE_FILES = import.meta.glob<{ COURSE: CourseOverlay }>('./locales/*/course.ts');
const GLOSSARY_FILES = import.meta.glob<{ GLOSSARY: GlossaryOverlay }>('./locales/*/glossary.ts');
const MODULE_FILES = import.meta.glob<{ LESSONS: ModuleOverlay }>('./locales/*/m[0-9][0-9].ts');

const path = (language: string, file: string) => `./locales/${language}/${file}.ts`;

// Written out where used (not a helper), so the production build can see the
// branch is dead and leaves the pseudo-language code out entirely.

/** Wording that applies course-wide: module and lesson titles, glossary terms. */
export interface CourseText {
  course: CourseOverlay;
  glossary: GlossaryOverlay;
}

export const NO_COURSE_TEXT: CourseText = { course: {}, glossary: {} };

const textCache = new Map<string, Promise<CourseText>>();

export function loadCourseText(language: string): Promise<CourseText> {
  let request = textCache.get(language);
  if (!request) {
    request = (async (): Promise<CourseText> => {
      if ((import.meta.env.DEV || import.meta.env.MODE === 'test') && language === PSEUDO_LANGUAGE) {
        const { pseudoCourse, pseudoGlossary } = await import('./pseudoContent');
        return { course: pseudoCourse(MODULES, ALL_LESSONS), glossary: pseudoGlossary(GLOSSARY) };
      }
      const courseFile = COURSE_FILES[path(language, 'course')];
      const glossaryFile = GLOSSARY_FILES[path(language, 'glossary')];
      const [course, glossary] = await Promise.all([
        courseFile ? courseFile().then((file) => file.COURSE) : Promise.resolve({}),
        glossaryFile ? glossaryFile().then((file) => file.GLOSSARY) : Promise.resolve({}),
      ]);
      return { course, glossary };
    })();
    // A failed download may be retried later.
    request.catch(() => textCache.delete(language));
    textCache.set(language, request);
  }
  return request;
}

/** One module's lesson translations, or undefined when it has none (yet). */
export async function loadModuleOverlay(
  language: string,
  moduleId: string,
  englishLessons: () => Promise<readonly Lesson[]>,
): Promise<ModuleOverlay | undefined> {
  if ((import.meta.env.DEV || import.meta.env.MODE === 'test') && language === PSEUDO_LANGUAGE) {
    const { pseudoModule } = await import('./pseudoContent');
    return pseudoModule(await englishLessons());
  }
  const file = MODULE_FILES[path(language, moduleId)];
  return file ? (await file()).LESSONS : undefined;
}

/** Whether any lesson is translated into this language (the picker says so). */
export function hasLessonTranslations(language: string): boolean {
  if ((import.meta.env.DEV || import.meta.env.MODE === 'test') && language === PSEUDO_LANGUAGE) return true;
  return Object.keys(MODULE_FILES).some((file) => file.startsWith(`./locales/${language}/`));
}

/** Which translation files exist, for the content check. */
export function translationFiles(): { course: string[]; glossary: string[]; modules: string[] } {
  return { course: Object.keys(COURSE_FILES), glossary: Object.keys(GLOSSARY_FILES), modules: Object.keys(MODULE_FILES) };
}

/** Test-only. */
export function __resetCourseTextForTests(): void {
  textCache.clear();
}

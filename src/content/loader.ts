import type { Lesson } from './schema';
import { getLessonMeta } from './curriculum';
import { DEFAULT_LANGUAGE } from '../i18n/languages';
import { loadCourseText, loadModuleOverlay } from './courseText';
import { applyLessonOverlay } from './overlay';

/**
 * Lesson content, one module at a time.
 *
 * The journey map, search and progress only need the catalog
 * (generated/catalog.ts). A module's steps are downloaded when one of its
 * lessons opens, so the course can grow without slowing down the first
 * screen. Offline use is unaffected: the service worker precaches every
 * chunk, lesson modules included.
 *
 * Everything is keyed by language as well as module: a translation is laid
 * over the English source when the module loads (see `localise`).
 */
type ModuleLoader = () => Promise<readonly Lesson[]>;

/** One entry per file in content/lessons. A test checks this is complete. */
export const MODULE_LOADERS: Readonly<Record<string, ModuleLoader>> = {
  m00: () => import('./lessons/m00').then((file) => file.M00_LESSONS),
  m01: () => import('./lessons/m01').then((file) => file.M01_LESSONS),
  m02: () => import('./lessons/m02').then((file) => file.M02_LESSONS),
  m03: () => import('./lessons/m03').then((file) => file.M03_LESSONS),
  m04: () => import('./lessons/m04').then((file) => file.M04_LESSONS),
  m05: () => import('./lessons/m05').then((file) => file.M05_LESSONS),
  m06: () => import('./lessons/m06').then((file) => file.M06_LESSONS),
  m07: () => import('./lessons/m07').then((file) => file.M07_LESSONS),
  m08: () => import('./lessons/m08').then((file) => file.M08_LESSONS),
  m09: () => import('./lessons/m09').then((file) => file.M09_LESSONS),
  m10: () => import('./lessons/m10').then((file) => file.M10_LESSONS),
  m11: () => import('./lessons/m11').then((file) => file.M11_LESSONS),
  m12: () => import('./lessons/m12').then((file) => file.M12_LESSONS),
  m13: () => import('./lessons/m13').then((file) => file.M13_LESSONS),
  m14: () => import('./lessons/m14').then((file) => file.M14_LESSONS),
  m15: () => import('./lessons/m15').then((file) => file.M15_LESSONS),
  m16: () => import('./lessons/m16').then((file) => file.M16_LESSONS),
  m17: () => import('./lessons/m17').then((file) => file.M17_LESSONS),
  m18: () => import('./lessons/m18').then((file) => file.M18_LESSONS),
  m19: () => import('./lessons/m19').then((file) => file.M19_LESSONS),
};

const pending = new Map<string, Promise<ReadonlyMap<string, Lesson>>>();
const ready = new Map<string, ReadonlyMap<string, Lesson>>();

const cacheKey = (moduleId: string, language: string) => `${language}:${moduleId}`;

/**
 * The language layer: the module's translation (and the course-wide lesson
 * titles) laid over the English source. English is returned unchanged; a
 * language with no translation for this module shows English, titled in the
 * language where the course overlay has titles.
 */
async function localise(moduleId: string, lessons: readonly Lesson[], language: string): Promise<readonly Lesson[]> {
  if (language === DEFAULT_LANGUAGE) return lessons;
  const [overlay, text] = await Promise.all([
    loadModuleOverlay(language, moduleId, async () => lessons),
    loadCourseText(language),
  ]);
  return lessons.map((lesson) => {
    const own = overlay?.[lesson.id];
    const localised = applyLessonOverlay(lesson, own, text.course);
    // Still English: the screen marks it so, for right-to-left languages.
    return own ? { ...localised, textLanguage: language } : localised;
  });
}

/** A module's lessons by id. Resolves from memory after the first load. */
export function loadModule(moduleId: string, language: string): Promise<ReadonlyMap<string, Lesson>> {
  const key = cacheKey(moduleId, language);
  const done = ready.get(key);
  if (done) return Promise.resolve(done);
  let request = pending.get(key);
  if (!request) {
    const load = overrides.get(moduleId) ?? MODULE_LOADERS[moduleId];
    if (!load) return Promise.reject(new Error(`No lesson file for module "${moduleId}"`));
    request = load()
      .then((lessons) => localise(moduleId, lessons, language))
      .then(
        (lessons) => {
          const byId = new Map(lessons.map((lesson) => [lesson.id, lesson]));
          ready.set(key, byId);
          pending.delete(key);
          return byId;
        },
        (error: unknown) => {
          // Forget the failure so a later attempt can try again.
          pending.delete(key);
          throw error;
        },
      );
    pending.set(key, request);
  }
  return request;
}

/** A whole lesson, or `undefined` when the course has no such lesson. */
export async function loadLesson(lessonId: string, language: string): Promise<Lesson | undefined> {
  const meta = getLessonMeta(lessonId);
  if (!meta) return undefined;
  const lessons = await loadModule(meta.moduleId, language);
  return lessons.get(lessonId);
}

/** The lesson if its module is already in memory; lets screens skip a loading frame. */
export function peekLesson(lessonId: string, language: string): Lesson | undefined {
  const meta = getLessonMeta(lessonId);
  if (!meta) return undefined;
  return ready.get(cacheKey(meta.moduleId, language))?.get(lessonId);
}

/** Warm the cache for a lesson that is likely to open next. Errors are ignored. */
export function preloadLesson(lessonId: string, language: string): void {
  loadLesson(lessonId, language).catch(() => undefined);
}

const overrides = new Map<string, ModuleLoader>();

/** Test-only: forget everything loaded, and any replaced loaders. */
export function __resetLoaderForTests(): void {
  pending.clear();
  ready.clear();
  overrides.clear();
}

/** Test-only: replace how one module loads (to simulate a failed download). */
export function __setModuleLoaderForTests(moduleId: string, load: ModuleLoader): void {
  overrides.set(moduleId, load);
}

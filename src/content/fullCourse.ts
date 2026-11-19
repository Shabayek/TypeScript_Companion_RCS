import { MODULES } from './curriculum';
import { LESSONS } from './lessons';
import type { Lesson } from './schema';

/**
 * Every lesson with all of its steps, in course order.
 *
 * For build scripts and tests only: the app never imports this file, so lesson
 * content stays out of the main bundle and loads one module at a time
 * (content/loader.ts). `tests/contentLoading.test.ts` enforces that.
 */
export const FULL_COURSE: readonly Lesson[] = (() => {
  const byId = new Map(LESSONS.map((lesson) => [lesson.id, lesson]));
  const ordered: Lesson[] = [];
  for (const module of MODULES) {
    for (const id of module.lessonIds) {
      const lesson = byId.get(id);
      if (lesson) ordered.push(lesson);
    }
  }
  return ordered;
})();

const FULL_BY_ID = new Map(FULL_COURSE.map((lesson) => [lesson.id, lesson]));

/** A full lesson, for scripts and tests. */
export function fullLesson(id: string): Lesson | undefined {
  return FULL_BY_ID.get(id);
}

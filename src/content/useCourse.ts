import { useMemo } from 'react';
import { useI18n } from '../i18n/t';
import { GLOSSARY, type GlossaryEntry } from './glossary';
import type { AgeMode, CourseModule } from './schema';

/**
 * Course-wide wording in the language on screen: module titles and taglines,
 * lesson titles (for the map, search, practice — without loading lessons),
 * and the glossary. Falls back to English for anything not translated.
 */
export function useCourse() {
  const text = useI18n((state) => state.courseText);
  return useMemo(() => {
    const glossary: readonly GlossaryEntry[] = GLOSSARY.map((entry) => {
      const patch = text.glossary[entry.id];
      return patch ? { ...entry, ...Object.fromEntries(Object.entries(patch).filter(([, value]) => value)) } : entry;
    });
    const byId = new Map(glossary.map((entry) => [entry.id, entry]));
    return {
      moduleTitle: (module: CourseModule) => text.course.modules?.[module.id]?.title ?? module.title,
      moduleTagline: (module: CourseModule) => text.course.modules?.[module.id]?.tagline ?? module.tagline,
      lessonTitle: (lesson: { id: string; title: Record<AgeMode, string> }, mode: AgeMode) =>
        text.course.lessons?.[lesson.id]?.title?.[mode] ?? lesson.title[mode],
      glossary,
      term: (id: string) => byId.get(id),
    };
  }, [text]);
}

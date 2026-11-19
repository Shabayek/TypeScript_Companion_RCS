import { useEffect, useState } from 'react';
import { getLessonMeta } from '../../content/curriculum';
import { loadLesson, peekLesson } from '../../content/loader';
import type { Lesson } from '../../content/schema';
import { useI18n } from '../../i18n/t';

export type LessonLoad =
  | { status: 'loading' }
  | { status: 'ready'; lesson: Lesson }
  | { status: 'missing' }
  | { status: 'failed'; error: Error };

function initial(lessonId: string, language: string): LessonLoad {
  if (!getLessonMeta(lessonId)) return { status: 'missing' };
  const lesson = peekLesson(lessonId, language);
  return lesson ? { status: 'ready', lesson } : { status: 'loading' };
}

/**
 * A lesson's full content, in the language on screen.
 *
 * When the language changes, the lesson already shown stays on screen until
 * the new wording has loaded, and the same lesson object identity is never
 * used as a React key, so the player keeps its step and anything typed.
 */
export function useLesson(lessonId: string): LessonLoad {
  const language = useI18n((state) => state.language);
  const [load, setLoad] = useState<LessonLoad>(() => initial(lessonId, language));
  const [shownFor, setShownFor] = useState(lessonId);

  // A different lesson: start again (synchronously, so a stale lesson never
  // shows under a new address).
  if (shownFor !== lessonId) {
    setShownFor(lessonId);
    setLoad(initial(lessonId, language));
  }

  useEffect(() => {
    if (!getLessonMeta(lessonId)) return;
    let alive = true;
    loadLesson(lessonId, language).then(
      (lesson) => {
        if (!alive) return;
        setLoad((current) => {
          if (!lesson) return { status: 'missing' };
          // Already showing this exact content: keep the same state object.
          return current.status === 'ready' && current.lesson === lesson ? current : { status: 'ready', lesson };
        });
      },
      (error: unknown) => {
        console.error('[TypeScript Companion] lesson content could not load', error);
        if (!alive) return;
        // Keep showing a lesson that is already on screen (for example while
        // switching language); only an empty screen becomes an error.
        setLoad((current) =>
          current.status === 'ready'
            ? current
            : { status: 'failed', error: error instanceof Error ? error : new Error(String(error)) },
        );
      },
    );
    return () => {
      alive = false;
    };
  }, [lessonId, language]);

  return load;
}

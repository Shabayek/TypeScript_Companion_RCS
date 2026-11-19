import { Link } from 'react-router-dom';
import {
  blockingLesson,
  getLessonMeta,
  isAheadOfPath,
  isLessonCompleted,
  isLessonUnlocked,
  lessonIndex,
} from '../../content/curriculum';
import type { AgeMode } from '../../content/schema';
import { useT } from '../../i18n/t';
import type { ProgressState } from '../../storage/types';
import { Badge } from '../../ui/primitives';
import styles from './journey.module.css';
import { useCourse } from '../../content/useCourse';
import { useEngine } from '../../platform/useEngine';

/**
 * One lesson on the journey map or a module page: finished, next, open,
 * open ahead of the path (with every lesson unlocked), or locked with what
 * opens it. A locked lesson is plain text, never a dead link.
 */
export function LessonRow({
  lessonId,
  state,
  mode,
  nextId,
}: {
  lessonId: string;
  state: ProgressState;
  mode: AgeMode;
  nextId: string;
}) {
  const { t } = useT();
  const course = useCourse();
  const engine = useEngine();
  const lesson = getLessonMeta(lessonId);
  if (!lesson) return null;

  const unlocked = isLessonUnlocked(lessonId, state);
  const done = isLessonCompleted(lessonId, state);
  const ahead = unlocked && !done && isAheadOfPath(lessonId, state);
  const blocker = unlocked ? undefined : blockingLesson(lessonId, state);
  const isNext = lessonId === nextId && !done;
  const project = lesson.steps.some((step) => step.kind === 'play');

  const meta = [t('lesson.minutes', { count: lesson.estMinutes })];
  const bonus = lesson.steps.filter((step) => step.bonus).length;
  if (bonus > 0) meta.push(t('bonus.lessonMeta', { count: bonus }));
  // Parts written for newer phones: said either way, so nobody is surprised.
  if (lesson.steps.some((step) => step.modern)) {
    meta.push(engine === 'classic' ? t('engine.lessonClassic') : t('engine.lessonModern'));
  }
  if (blocker) meta.push(t('journey.opensAfter', { title: course.lessonTitle(blocker, mode) }));
  else if (ahead) meta.push(t('journey.ahead'));
  // Said for screen readers; sighted learners see the tick.
  const doneNote = done ? <span className="sr-only">{`, ${t('journey.done')}`}</span> : null;

  const body = (
    <>
      <span className={styles.lessonIndex} aria-hidden="true">
        {done ? '✓' : String(lessonIndex(lessonId) + 1).padStart(2, '0')}
      </span>
      <span className={styles.lessonBody}>
        <span className={styles.lessonTitle}>
          <bdi>{course.lessonTitle(lesson, mode)}</bdi>
          {doneNote}
        </span>
        <span className={styles.lessonMeta}>{meta.join(' · ')}</span>
      </span>
      {project ? <Badge tone="accent">{t('journey.project')}</Badge> : null}
      {isNext ? <Badge tone="warm">{t('journey.next')}</Badge> : null}
    </>
  );

  return (
    <li>
      {unlocked ? (
        <Link
          to={`/learn/${lessonId}`}
          className={styles.lesson}
          data-done={done}
          data-next={isNext}
          data-ahead={ahead}
          aria-current={isNext ? 'step' : undefined}
        >
          {body}
        </Link>
      ) : (
        <span className={styles.lesson} data-locked="true">
          {body}
        </span>
      )}
    </li>
  );
}

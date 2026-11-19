import { useState } from 'react';
import { Link } from 'react-router-dom';
import { minutesLeft, moduleStats } from '../../content/curriculum';
import type { AgeMode, CourseModule } from '../../content/schema';
import { useT } from '../../i18n/t';
import type { ProgressState } from '../../storage/types';
import { Mascot } from '../../ui/Mascot';
import { ProgressRing } from '../../ui/primitives';
import { LessonRow } from './LessonRow';
import styles from './journey.module.css';
import { useCourse } from '../../content/useCourse';

/**
 * The modules of one track. Each opens on tap to show its lessons; the module
 * the learner is in starts open, so the map stays short on a phone however
 * long the course grows.
 *
 * One structure, three looks (`data-variant`): Story is a winding path with
 * big stepping stones and Tess waiting at the current stop, Explorer is a
 * column of cards, Pro a dense list.
 */
export function JourneyMap({
  modules,
  state,
  mode,
  nextId,
  currentModuleId,
}: {
  modules: readonly CourseModule[];
  state: ProgressState;
  mode: AgeMode;
  nextId: string;
  currentModuleId: string | undefined;
}) {
  const [open, setOpen] = useState<ReadonlySet<string>>(
    () => new Set(currentModuleId ? [currentModuleId] : []),
  );

  const toggle = (moduleId: string) =>
    setOpen((current) => {
      const next = new Set(current);
      if (next.has(moduleId)) next.delete(moduleId);
      else next.add(moduleId);
      return next;
    });

  return (
    <ol className={styles.moduleList} data-variant={mode}>
      {modules.map((module, position) => (
        <ModuleSection
          key={module.id}
          module={module}
          state={state}
          mode={mode}
          nextId={nextId}
          current={module.id === currentModuleId}
          expanded={open.has(module.id)}
          onToggle={() => toggle(module.id)}
          side={position % 2 === 0 ? 'start' : 'end'}
        />
      ))}
    </ol>
  );
}

function ModuleSection({
  module,
  state,
  mode,
  nextId,
  current,
  expanded,
  onToggle,
  side,
}: {
  module: CourseModule;
  state: ProgressState;
  mode: AgeMode;
  nextId: string;
  current: boolean;
  expanded: boolean;
  onToggle: () => void;
  side: 'start' | 'end';
}) {
  const { t } = useT();
  const course = useCourse();
  const stats = moduleStats(module.id, state);
  const listId = `module-lessons-${module.id}`;
  const summary =
    stats.completed === stats.total
      ? t('journey.summaryDone', { total: stats.total })
      : t('journey.summary', {
          done: stats.completed,
          total: stats.total,
          minutes: minutesLeft(module.id, state),
        });

  return (
    <li
      data-accent={module.accent}
      data-current={current}
      data-expanded={expanded}
      data-side={side}
      className={styles.module}
    >
      <div className={styles.moduleHead}>
        <ProgressRing
          value={stats.ratio}
          label={`${stats.completed}`}
          size={mode === 'story' ? 56 : mode === 'pro' ? 34 : 44}
        />
        <div className={styles.moduleText}>
          <span className={styles.moduleNumber}>
            {module.number === 0 ? t('lesson.startHere') : t('lesson.moduleNumber', { number: module.number })}
          </span>
          <h3 className={styles.moduleTitle}>
            {/* Stretched over the whole header, so tapping anywhere on it toggles. */}
            <button
              type="button"
              className={styles.moduleToggle}
              aria-expanded={expanded}
              aria-controls={listId}
              onClick={onToggle}
            >
              <bdi>{course.moduleTitle(module)}</bdi>
            </button>
          </h3>
          {mode !== 'pro' ? <p className={styles.moduleTagline} dir="auto">{course.moduleTagline(module)}</p> : null}
          <span className={styles.moduleSummary}>{summary}</span>
          {current ? <span className={styles.current}>{t('journey.youAreHere')}</span> : null}
        </div>
        <span className={styles.chevron} aria-hidden="true" />
        {current && mode === 'story' ? (
          <span className={styles.tess}>
            <Mascot pose="idle" size={48} />
          </span>
        ) : null}
      </div>

      <div id={listId} hidden={!expanded}>
        {expanded ? (
          <>
            <ol className={styles.lessonList}>
              {module.lessonIds.map((lessonId) => (
                <LessonRow key={lessonId} lessonId={lessonId} state={state} mode={mode} nextId={nextId} />
              ))}
            </ol>
            <Link to={`/module/${module.id}`} className={styles.overviewLink}>
              {t('journey.overview')}
              <span className="sr-only">{`: ${course.moduleTitle(module)}`}</span>
            </Link>
          </>
        ) : null}
      </div>
    </li>
  );
}

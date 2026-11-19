import { Link, useParams } from 'react-router-dom';
import {
  MODULES,
  blockingLesson,
  getLessonMeta,
  getModule,
  isLessonCompleted,
  isLessonUnlocked,
  minutesLeft,
  moduleStats,
  nextUpLessonId,
} from '../../content/curriculum';
import { useT } from '../../i18n/t';
import { useJourney } from '../../storage/store';
import { LinkButton } from '../../ui/Button';
import { Card, EmptyState, ProgressRing } from '../../ui/primitives';
import { LessonRow } from './LessonRow';
import styles from './journey.module.css';
import { useCourse } from '../../content/useCourse';

/**
 * One module at a glance: how far along it is, the ideas it teaches, its
 * lessons, and a single button that does the obvious next thing.
 */
export function ModulePage() {
  const { moduleId = '' } = useParams<{ moduleId: string }>();
  const { t } = useT();
  const course = useCourse();
  const state = useJourney((store) => store.state);
  const mode = state.settings.mode;
  const module = getModule(moduleId);

  if (!module) {
    return (
      <EmptyState
        title={t('module.notFoundTitle')}
        action={
          <LinkButton to="/" variant="primary">
            {t('module.backToJourney')}
          </LinkButton>
        }
      >
        {t('module.notFoundBody')}
      </EmptyState>
    );
  }

  const stats = moduleStats(module.id, state);
  const nextId = nextUpLessonId(state);
  const firstOpenUnfinished = module.lessonIds.find(
    (id) => isLessonUnlocked(id, state) && !isLessonCompleted(id, state),
  );
  const started = module.lessonIds.some((id) => state.lessons[id] !== undefined);
  const firstLesson = module.lessonIds[0];
  const locked = firstLesson !== undefined && !isLessonUnlocked(firstLesson, state);
  const blocker = locked && firstLesson ? blockingLesson(firstLesson, state) : undefined;

  // Unique glossary terms across the module, in the order lessons introduce them.
  const ideas = [...new Set(module.lessonIds.flatMap((id) => getLessonMeta(id)?.concepts ?? []))]
    .map((id) => course.term(id))
    .filter((entry) => entry !== undefined);

  const index = MODULES.indexOf(module);
  const previous = MODULES[index - 1];
  const next = MODULES[index + 1];

  return (
    <div className={styles.page} data-accent={module.accent}>
      <Link to="/" className={styles.crumb}>
        {t('module.back')}
      </Link>

      <Card pad="lg" className={styles.hero}>
        <div className={styles.heroTop}>
          <ProgressRing value={stats.ratio} size={64} label={`${stats.completed}`} />
          <div>
            <p className="eyebrow" style={{ color: 'var(--module-accent)' }}>
              {t(`tracks.${module.track}`)} ·{' '}
              {module.number === 0 ? t('lesson.startHere') : t('lesson.moduleNumber', { number: module.number })}
            </p>
            <h1 className={styles.heroTitle} dir="auto">{course.moduleTitle(module)}</h1>
          </div>
        </div>
        <p className={styles.heroTagline} dir="auto">{course.moduleTagline(module)}</p>

        <dl className={styles.stats}>
          <div>
            <dt>{t('module.lessonsDone')}</dt>
            <dd>
              {stats.completed}/{stats.total}
            </dd>
          </div>
          <div>
            <dt>{t('module.minutesLeft')}</dt>
            <dd>{minutesLeft(module.id, state)}</dd>
          </div>
        </dl>

        {locked && blocker ? (
          <p className={styles.lockedNote}>{t('module.locked', { title: course.lessonTitle(blocker, mode) })}</p>
        ) : firstOpenUnfinished ? (
          <div className="row">
            <LinkButton to={`/learn/${firstOpenUnfinished}`} variant="primary" size="lg">
              {started ? t('module.continue') : t('module.start')}
            </LinkButton>
          </div>
        ) : firstLesson && stats.completed === stats.total ? (
          <div className="row">
            <LinkButton to={`/learn/${firstLesson}`} variant="ghost">
              {t('module.review')}
            </LinkButton>
          </div>
        ) : null}
      </Card>

      {ideas.length > 0 ? (
        <section aria-labelledby="module-ideas">
          <h2 id="module-ideas" className={styles.sectionTitle}>
            {t('module.keyIdeas')}
          </h2>
          <p className={styles.sectionNote}>{t('module.keyIdeasNote')}</p>
          <ul className={styles.ideas}>
            {ideas.map((entry) => (
              <li key={entry.id}>
                <Link to={`/glossary?term=${entry.id}`} className={styles.idea}>
                  {entry.term}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section aria-labelledby="module-lessons">
        <h2 id="module-lessons" className={styles.sectionTitle}>
          {t('module.lessons')}
        </h2>
        <ol className={styles.lessonList}>
          {module.lessonIds.map((lessonId) => (
            <LessonRow key={lessonId} lessonId={lessonId} state={state} mode={mode} nextId={nextId} />
          ))}
        </ol>
      </section>

      <nav className={styles.pager} aria-label={t('module.pager')}>
        {previous ? (
          <Link to={`/module/${previous.id}`} className={styles.pagerLink} data-dir="previous">
            <span className={styles.pagerLabel}>{t('module.previous')}</span>
            <bdi>{course.moduleTitle(previous)}</bdi>
          </Link>
        ) : null}
        {next ? (
          <Link to={`/module/${next.id}`} className={styles.pagerLink} data-dir="next">
            <span className={styles.pagerLabel}>{t('module.nextModule')}</span>
            <bdi>{course.moduleTitle(next)}</bdi>
          </Link>
        ) : null}
      </nav>
    </div>
  );
}

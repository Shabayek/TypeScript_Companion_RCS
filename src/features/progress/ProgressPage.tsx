import { Link } from 'react-router-dom';
import {
  ALL_LESSONS,
  MODULES,
  courseStats,
  moduleStats,
} from '../../content/curriculum';
import { useT, type TFunction } from '../../i18n/t';
import { formatDate } from '../../i18n/messages';
import { trackCertificates } from '../../storage/badges';
import { levelFor, streakInfo, xpFromState } from '../../storage/motivation';
import { LevelBar } from '../motivation/LevelBar';
import { BadgeGallery } from './BadgeGallery';
import { WeekChart } from './WeekChart';
import { useJourney } from '../../storage/store';
import { Badge, Card, ProgressRing } from '../../ui/primitives';
import { LinkButton } from '../../ui/Button';
import { Mascot } from '../../ui/Mascot';
import { ProgressData } from './ProgressData';
import { practiceSummary, whenDue } from '../review/queue';
import styles from './progress.module.css';
import { useCourse } from '../../content/useCourse';

function formatDuration(ms: number, t: TFunction): string {
  const minutes = Math.round(ms / 60000);
  if (minutes < 1) return t('progressPage.underAMinute');
  if (minutes < 60) return t('progressPage.minutes', { count: minutes });
  return t('progressPage.hoursMinutes', { hours: Math.floor(minutes / 60), minutes: minutes % 60 });
}

export function ProgressPage() {
  const state = useJourney((store) => store.state);

  const stats = courseStats(state);
  const practice = practiceSummary(state);

  const { t, language } = useT();
  const course = useCourse();
  const quiet = state.settings.quiet;
  const streak = streakInfo(state.activity);
  const certificates = trackCertificates(state);
  // The certificate is dated by when the course was finished (the last
  // lesson's completion), not by whenever the page happens to be opened.
  const finishedAt = Math.max(
    0,
    ...Object.values(state.lessons).map((lesson) => lesson.completedAt ?? 0),
  );

  return (
    <div className={styles.page}>
      <header>
        <p className="eyebrow">{t('progressPage.eyebrow')}</p>
        <h1 className={styles.title}>{t('progressPage.title')}</h1>
        <p className="muted">{t('progressPage.lede')}</p>
      </header>

      <div className={styles.statGrid}>
        <Card className={styles.stat}>
          <span className={styles.statValue}>
            {stats.completed}
            <span className={styles.statOf}>/{stats.total}</span>
          </span>
          <span className={styles.statLabel}>{t('progressPage.lessonsFinished')}</span>
          <ProgressRing value={stats.ratio} size={38} />
        </Card>
        <Card className={styles.stat}>
          <span className={styles.statValue}>{stats.solved}</span>
          <span className={styles.statLabel}>{t('progressPage.stepsSolved')}</span>
        </Card>
        <Card className={styles.stat}>
          <span className={styles.statValue}>{stats.practiced}</span>
          <span className={styles.statLabel}>{t('progressPage.stepsPractised')}</span>
        </Card>
        <Card className={styles.stat}>
          <span className={styles.statValue}>{formatDuration(state.totalTimeMs, t)}</span>
          <span className={styles.statLabel}>{t('progressPage.timeOnLessons')}</span>
        </Card>
      </div>

      {quiet ? null : (
        <section aria-labelledby="rhythm-title">
          <h2 id="rhythm-title" className={styles.h2}>
            {t('progressPage.rhythm')}
          </h2>
          <Card className={styles.rhythm}>
            <LevelBar info={levelFor(xpFromState(state))} />
            <div className={styles.rhythmRow}>
              <div>
                <span className={styles.statValue}>{streak.current}</span>
                <span className={styles.statLabel}>{t('progressPage.streakNow')}</span>
              </div>
              <div>
                <span className={styles.statValue}>{streak.best}</span>
                <span className={styles.statLabel}>{t('progressPage.streakBest')}</span>
              </div>
              <div>
                <span className={styles.statValue}>{streak.restDays}</span>
                <span className={styles.statLabel}>{t('progressPage.restDays')}</span>
              </div>
            </div>
            <p className={styles.statLabel} style={{ margin: 0 }}>
              {t('motivation.restDaysNote')}
            </p>
            <h3 className={styles.h3}>{t('progressPage.week', { goal: state.settings.dailyGoal })}</h3>
            <WeekChart state={state} />
          </Card>
        </section>
      )}

      <section aria-labelledby="practice-title">
        <h2 id="practice-title" className={styles.h2}>
          {t('progressPage.practice')}
        </h2>
        <Card className={styles.practice}>
          <p style={{ margin: 0 }}>
            {practice.total === 0
              ? t('progressPage.practiceEmpty')
              : `${t('progressPage.practiceSummary', { count: practice.total, strong: practice.strong })} ` +
                (practice.due > 0
                  ? t('progressPage.practiceDue', { count: practice.due })
                  : practice.nextDueAt !== null
                    ? t('progressPage.practiceNext', { when: whenDue(practice.nextDueAt, language) })
                    : '')}
          </p>
          <LinkButton to="/practice" variant={practice.due > 0 ? 'primary' : 'ghost'} size="sm">
            {practice.due > 0 ? t('progressPage.practiseNow') : t('progressPage.openPractice')}
          </LinkButton>
        </Card>
      </section>

      <section aria-labelledby="modules-title">
        <h2 id="modules-title" className={styles.h2}>
          {t('progressPage.byModule')}
        </h2>
        <ul className={styles.moduleList}>
          {MODULES.map((module) => {
            const moduleState = moduleStats(module.id, state);
            return (
              <li key={module.id} data-accent={module.accent} className={styles.moduleRow}>
                <ProgressRing value={moduleState.ratio} size={36} />
                <div className={styles.moduleText}>
                  <strong dir="auto">{course.moduleTitle(module)}</strong>
                  <span className="muted">
                    {t('progressPage.moduleLessons', { done: moduleState.completed, total: moduleState.total })}
                  </span>
                </div>
                {moduleState.completed === moduleState.total ? (
                  <Badge tone="success">{t('progressPage.complete')}</Badge>
                ) : null}
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="badges-title">
        <h2 id="badges-title" className={styles.h2}>
          {t('progressPage.badgeShelf')}
        </h2>
        <p className="muted" style={{ marginBottom: 'var(--s-2)' }}>
          {t('progressPage.badgesLede')}
        </p>
        <BadgeGallery state={state} />
      </section>

      {certificates.length > 1 ? (
        <section aria-labelledby="certificates-title">
          <h2 id="certificates-title" className={styles.h2}>
            {t('progressPage.certificates')}
          </h2>
          <ul className={styles.certList}>
            {certificates.map((certificate) => (
              <li key={certificate.track} className={styles.certItem} data-earned={certificate.earned}>
                <strong>{t('progressPage.certificateFor', { track: t(`tracks.${certificate.track}`) })}</strong>
                <span className="muted">
                  {certificate.earned && certificate.earnedAt
                    ? formatDate(certificate.earnedAt, language, { year: 'numeric', month: 'long', day: 'numeric' })
                    : t('progressPage.certificateProgress', {
                        done: certificate.completedModules,
                        total: certificate.modules.length,
                      })}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {stats.ratio >= 1 ? (
        <Card pad="lg" className={styles.certificate}>
          <p className="eyebrow">{t('progressPage.certificate')}</p>
          <h2 className={styles.certTitle}>{t('progressPage.certificateTitle')}</h2>
          <p className={styles.certBody}>
            {t('progressPage.certificateBody', {
              name: state.profile.name || t('progressPage.thisLearner'),
              count: ALL_LESSONS.length,
            })}
          </p>
          <p className="muted">
            {formatDate(finishedAt || Date.now(), language, { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          <Mascot pose="cheering" size={96} />
        </Card>
      ) : null}

      <section aria-labelledby="data-title">
        <h2 id="data-title" className={styles.h2}>
          {t('progressPage.yourData')}
        </h2>
        <ProgressData />
      </section>

      <div className="row">
        <LinkButton to="/" variant="primary">
          {t('shell.backToJourney')}
        </LinkButton>
        <Link to="/settings" className="btn btn--ghost">
          {t('nav.settings')}
        </Link>
      </div>

      <p className="muted" style={{ fontSize: 'var(--text--1)' }}>
        {t('progressPage.footnote')}
      </p>
    </div>
  );
}

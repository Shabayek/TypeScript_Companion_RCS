import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  MODULES,
  courseStats,
  getLessonMeta,
  recommendedStart,
  tracksInCourse,
} from '../../content/curriculum';
import { preloadLesson } from '../../content/loader';
import { requiredSteps, type Track } from '../../content/schema';
import { useT, type TFunction } from '../../i18n/t';
import { nextUpLessonId, useJourney } from '../../storage/store';
import { resumeIndex } from '../../storage/model';
import { Badge, Card } from '../../ui/primitives';
import { Button, LinkButton } from '../../ui/Button';
import { lessonsAddedBehind } from '../../storage/newLessons';
import { Mascot, type MascotPose } from '../../ui/Mascot';
import { streakInfo } from '../../storage/motivation';
import { practiceSummary, whenDue } from '../review/queue';
import { JourneyMap } from '../journey/JourneyMap';
import { TodayCard } from '../motivation/TodayCard';
import { TrackTabs, trackPanelId, trackTabId } from '../journey/TrackTabs';
import styles from './home.module.css';
import { useCourse } from '../../content/useCourse';

function greeting(name: string, t: TFunction): string {
  if (!name) return t('home.greetingAnon');
  const hour = new Date().getHours();
  if (hour < 12) return t('home.greetingMorning', { name });
  if (hour < 18) return t('home.greetingAfternoon', { name });
  return t('home.greetingEvening', { name });
}

/** Tess on Home: cheering at the end, waving after a break, sleepy late at night. */
function heroPose(allDone: boolean, returning: boolean): MascotPose {
  if (allDone) return 'cheering';
  if (returning) return 'waving';
  const hour = new Date().getHours();
  return hour >= 21 || hour < 6 ? 'sleepy' : 'idle';
}

export function HomePage() {
  const { t, language } = useT();
  const course = useCourse();
  const state = useJourney((store) => store.state);
  const acknowledgeNewLessons = useJourney((store) => store.acknowledgeNewLessons);
  const added = lessonsAddedBehind(state);
  const mode = state.settings.mode;
  const stats = courseStats(state);
  const nextId = nextUpLessonId(state);
  const next = getLessonMeta(nextId);
  const allDone = stats.completed >= stats.total && stats.total > 0;
  const nextProgress = next ? state.lessons[next.id] : undefined;
  // Where "Continue" really opens: the saved step, not always step 1.
  const nextTotal = next ? requiredSteps(next.steps).length : 0;
  const nextStep = next ? Math.min(resumeIndex(nextProgress, next.steps.length) + 1, nextTotal) : 1;
  const practice = practiceSummary(state);
  const currentModuleId = allDone ? undefined : next?.moduleId;
  const nextModule = MODULES.find((module) => module.id === next?.moduleId);

  // Nothing opened yet, and the course suggested a later start for this learner.
  const nothingStarted = Object.keys(state.lessons).length === 0;
  const suggested =
    nothingStarted && next !== undefined && next.id === recommendedStart(state.profile.experience) && next.id !== MODULES[0]?.lessonIds[0];
  const continueLabel =
    nextProgress !== undefined
      ? t('home.resume')
      : next?.id === MODULES[0]?.lessonIds[0]
        ? t('home.startFirst')
        : t('home.startThis');

  const tracks = tracksInCourse();
  const currentTrack = MODULES.find((module) => module.id === currentModuleId)?.track ?? tracks[0] ?? 'foundations';
  const [track, setTrack] = useState<Track>(currentTrack);
  const shownModules = MODULES.filter((module) => module.track === track);
  const tabbed = tracks.length > 1;

  // Fetch the next lesson's content in the background so "Continue" opens instantly.
  useEffect(() => {
    if (nextId) preloadLesson(nextId, language);
  }, [nextId, language]);

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <div>
          <p className="eyebrow">{greeting(state.profile.name, t)}</p>
          <h1 className={styles.heroTitle}>{allDone ? t('home.titleDone') : t('home.title')}</h1>
          <p className={styles.heroLede}>{allDone ? t('home.ledeDone') : t('home.lede')}</p>
        </div>
        <Mascot pose={heroPose(allDone, streakInfo(state.activity).returning)} size={92} />
      </header>

      {!allDone && next ? (
        <Card pad="lg" className={styles.continue}>
          <div className={styles.continueTop}>
            <Badge tone="accent">{suggested ? t('home.suggestedBadge') : t('home.continueBadge')}</Badge>
            <span className={styles.continueMeta}>
              {t('home.continueMeta', { minutes: next.estMinutes, step: nextStep, total: nextTotal })}
            </span>
          </div>
          <h2 className={styles.continueTitle} dir="auto">
            {course.lessonTitle(next, mode)}
          </h2>
          <p className={styles.continueLede} dir="auto">
            {nextModule ? course.moduleTagline(nextModule) : null}
          </p>
          <div className={styles.continueRow}>
            <LinkButton to={`/learn/${next.id}`} variant="primary" size="lg">
              {continueLabel}
            </LinkButton>
            <span className={styles.progressText}>
              {t('home.lessonsDone', { done: stats.completed, total: stats.total })}
            </span>
          </div>
        </Card>
      ) : null}

      {added.length > 0 ? (
        <Card className={styles.newLessons} aria-labelledby="new-lessons-title">
          <h2 id="new-lessons-title" className={styles.practiceTitle}>
            {t('home.newLessonsTitle')}
          </h2>
          <p className={styles.toolNote}>{t('home.newLessonsBody', { count: added.length })}</p>
          <ul className={styles.newLessonList}>
            {added.slice(0, 4).map((lesson) => (
              <li key={lesson.id}>
                <Link to={`/learn/${lesson.id}`}>
                  <bdi>{course.lessonTitle(lesson, mode)}</bdi>
                </Link>
              </li>
            ))}
          </ul>
          <div className="row">
            <Button variant="ghost" size="sm" onClick={acknowledgeNewLessons}>
              {t('home.newLessonsDismiss')}
            </Button>
          </div>
        </Card>
      ) : null}

      {!state.settings.quiet && state.profile.onboarded ? <TodayCard state={state} /> : null}

      {practice.due > 0 ? (
        <Card className={styles.practice}>
          <div>
            <h2 className={styles.practiceTitle}>{t('practice.stepsReady', { count: practice.due })}</h2>
            <p className={styles.toolNote}>{t('home.practiceNote')}</p>
          </div>
          <LinkButton to="/practice" variant={allDone ? 'primary' : 'ghost'}>
            {t('home.practiseNow')}
          </LinkButton>
        </Card>
      ) : null}

      <section aria-labelledby="journey-title" className={styles.journey}>
        <div className={styles.sectionHead}>
          <h2 id="journey-title">{t('journey.title')}</h2>
          <span className={styles.sectionMeta}>
            {state.settings.unlockAll ? <Badge tone="accent">{t('journey.allUnlocked')}</Badge> : null}
            <span className="muted">
              {t('journey.meta', { modules: MODULES.length, lessons: stats.total })}
            </span>
          </span>
        </div>

        {tabbed ? <TrackTabs tracks={tracks} selected={track} onSelect={setTrack} /> : null}
        <div
          {...(tabbed
            ? { role: 'tabpanel', id: trackPanelId(track), 'aria-labelledby': trackTabId(track) }
            : {})}
        >
          {tabbed ? <p className={styles.trackLede}>{t(`tracks.${track}Tagline`)}</p> : null}
          <JourneyMap
            key={track}
            modules={shownModules}
            state={state}
            mode={mode}
            nextId={nextId}
            currentModuleId={currentModuleId}
          />
        </div>
      </section>

      <section aria-labelledby="tools-title" className={styles.tools}>
        <h2 id="tools-title">{t('home.toolbox')}</h2>
        <div className={styles.toolGrid}>
          <Link to="/playground" className={styles.tool}>
            <span aria-hidden="true">⌨️</span>
            <span>
              <strong>{t('home.toolPlayground')}</strong>
              <span className={styles.toolNote}>{t('home.toolPlaygroundNote')}</span>
            </span>
          </Link>
          <Link to="/arena" className={styles.tool}>
            <span aria-hidden="true">🧩</span>
            <span>
              <strong>{t('home.toolArena')}</strong>
              <span className={styles.toolNote}>{t('home.toolArenaNote')}</span>
            </span>
          </Link>
          <Link to="/practice" className={styles.tool}>
            <span aria-hidden="true">🔁</span>
            <span>
              <strong>{t('home.toolPractice')}</strong>
              <span className={styles.toolNote}>
                {practice.due > 0
                  ? t('home.toolPracticeDue', { count: practice.due })
                  : practice.nextDueAt !== null
                    ? t('home.toolPracticeNext', { when: whenDue(practice.nextDueAt, language) })
                    : t('home.toolPracticeEmpty')}
              </span>
            </span>
          </Link>
          <Link to="/glossary" className={styles.tool}>
            <span aria-hidden="true">📖</span>
            <span>
              <strong>{t('home.toolGlossary')}</strong>
              <span className={styles.toolNote}>{t('home.toolGlossaryNote')}</span>
            </span>
          </Link>
          <Link to="/cheatsheet" className={styles.tool}>
            <span aria-hidden="true">🗂️</span>
            <span>
              <strong>{t('home.toolCheatsheet')}</strong>
              <span className={styles.toolNote}>{t('home.toolCheatsheetNote')}</span>
            </span>
          </Link>
          <Link to="/decoder" className={styles.tool}>
            <span aria-hidden="true">🔎</span>
            <span>
              <strong>{t('home.toolDecoder')}</strong>
              <span className={styles.toolNote}>{t('home.toolDecoderNote')}</span>
            </span>
          </Link>
        </div>
      </section>
    </div>
  );
}

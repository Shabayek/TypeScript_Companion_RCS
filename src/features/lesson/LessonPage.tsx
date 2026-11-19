import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  isLessonUnlocked,
  unfinishedBuildsOn,
  moduleOfLesson,
  nextLessonId,
  previousLessonId,
} from '../../content/curriculum';
import { loc } from '../../content/text';
import {
  isGradedStep,
  requiredSteps,
  stepForEngine,
  type AgeMode,
  type Lesson,
  type Step,
} from '../../content/schema';
import { useEngine } from '../../platform/useEngine';
import { useJourney } from '../../storage/store';
import { resumeIndex } from '../../storage/model';
import { Button, LinkButton } from '../../ui/Button';
import { Card, EmptyState, StepDots } from '../../ui/primitives';
import { useT } from '../../i18n/t';
import { Mascot } from '../../ui/Mascot';
import { Markdown } from '../../ui/Markdown';
import { isOnline, reloadApp, speak, stopSpeaking, supportsSpeech } from '../../platform/capabilities';
import { ErrorDetails } from '../../ui/Boundary';
import { useLesson } from './useLesson';
import { LessonIntro } from './LessonIntro';
import { LessonSummary } from './LessonSummary';
import { ShortcutsDialog } from './ShortcutsDialog';
import { TessReaction } from './TessReaction';
import { useLessonShortcuts } from './useLessonShortcuts';
import { useSound } from '../motivation/useFeedback';
import { xpFromState } from '../../storage/motivation';
import type { LessonFinish } from '../../storage/store';
import { StepView } from './StepView';
import styles from './lesson.module.css';
import { useCourse } from '../../content/useCourse';
import { languageInfo } from '../../i18n/languages';
import { ContentLanguage, textLanguageFor } from '../../content/contentLanguage';

function plainText(markdown: string): string {
  return markdown
    .replace(/`{1,3}[^`]*`{1,3}/g, (match) => match.replace(/`/g, ''))
    .replace(/[*_>#-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** What "Read aloud" says for a step: its prompt, and the body of a reading step. */
function spokenText(step: Step, mode: AgeMode): string {
  const prompt = plainText(loc(step.prompt, mode));
  const body = step.kind === 'read' ? plainText(loc(step.body, mode)) : '';
  if (!body) return prompt;
  // "Which one?. Body" read badly: only add a full stop when one is missing.
  return /[.!?:]$/.test(prompt) ? `${prompt} ${body}` : `${prompt}. ${body}`;
}

export function LessonPage() {
  const { t, language: screenLanguage } = useT();
  const { lessonId = '' } = useParams<{ lessonId: string }>();
  const load = useLesson(lessonId);

  if (load.status === 'missing') {
    return (
      <EmptyState title={t('player.notFoundTitle')} action={<LinkButton to="/">{t('shell.backToJourney')}</LinkButton>}>
        {t('player.notFoundBody')}
      </EmptyState>
    );
  }
  if (load.status === 'failed') return <LessonUnavailable error={load.error} />;
  if (load.status === 'loading') return <LessonLoading />;

  // A fresh player per lesson. The route element is reused when moving from
  // one lesson to the next, and its state (step index, "finished") used to
  // carry over for a frame: the next lesson's celebration could flash, or a
  // step from the wrong position could mount. Keyed by id only: the same
  // lesson in another language keeps its player, step and answers.
  return (
    <ContentLanguage value={textLanguageFor(load.lesson.textLanguage, screenLanguage)}>
      <LessonPlayer key={lessonId} lesson={load.lesson} />
    </ContentLanguage>
  );
}

/** Shown only if loading takes a noticeable moment, so a fast load never flashes. */
function LessonLoading() {
  const { t } = useT();
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 250);
    return () => clearTimeout(timer);
  }, []);
  return (
    <div className={styles.page} aria-busy="true">
      {visible ? <p className="muted" role="status">{t('player.opening')}</p> : null}
    </div>
  );
}

/** The lesson's content could not be downloaded (offline before it was stored, or a deploy mid-session). */
function LessonUnavailable({ error }: { error: Error }) {
  const { t } = useT();
  const offline = !isOnline();
  return (
    <Card pad="lg" className={styles.lockedCard}>
      <Mascot pose="hmm" size={96} />
      <h1 className={styles.doneTitle}>{t('player.didNotLoad')}</h1>
      <p className="muted" style={{ maxWidth: '38ch' }}>
        {offline
          ? t('player.didNotLoadOffline')
          : t('player.didNotLoadOnline')}
      </p>
      <Button variant="primary" onClick={reloadApp}>
        {t('shell.reload')}
      </Button>
      <LinkButton to="/" variant="ghost">
        {t('shell.backToJourney')}
      </LinkButton>
      <ErrorDetails error={error} />
    </Card>
  );
}

function LessonPlayer({ lesson }: { lesson: Lesson }) {
  const state = useJourney((store) => store.state);
  const hydrated = useJourney((store) => store.hydrated);
  const goToStep = useJourney((store) => store.goToStep);
  const recordResult = useJourney((store) => store.recordResult);
  const revealStep = useJourney((store) => store.reveal);
  const finishLesson = useJourney((store) => store.finishLesson);

  // Open straight at the saved step. Saved progress has been read by now: the
  // app shell renders no screen before that.
  const [index, setIndex] = useState(() =>
    hydrated ? resumeIndex(state.lessons[lesson.id], lesson.steps.length) : 0,
  );
  const [finished, setFinished] = useState<LessonFinish | null>(null);
  // The summary a learner left for the "Go further" steps, to come back to.
  const [summaryBeforeBonus, setSummaryBeforeBonus] = useState<LessonFinish | null>(null);
  const engine = useEngine();
  // XP when the lesson opened, for "+N XP" at the end.
  const [xpAtOpen] = useState(() => xpFromState(state));
  // Tess's reaction to the latest answer on this step (cleared on a new step).
  const [reaction, setReaction] = useState<{ correct: boolean; attempt: number } | null>(null);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const sound = useSound();
  const quiet = state.settings.quiet;
  const [hintLevel, setHintLevel] = useState(0);
  const [justRevealed, setJustRevealed] = useState<readonly string[]>([]);
  const [speaking, setSpeaking] = useState(false);

  const mode = state.settings.mode;
  const { t, language } = useT();
  const course = useCourse();
  const module = moduleOfLesson(lesson.id);
  // Read aloud in the lesson's language, or the nearest voice the device has.
  const voices = languageInfo(language).speech;

  // Jumping ahead (every lesson unlocked): name the unfinished lessons this one
  // builds on, once, as a note rather than a barrier. Only for a lesson not
  // yet worked in, judged when it opened.
  const [freshAtOpen] = useState(() => {
    const own = state.lessons[lesson.id];
    return !own || (own.status !== 'completed' && Object.keys(own.steps).length === 0 && own.stepIndex === 0);
  });
  const [buildsOnDismissed, setBuildsOnDismissed] = useState(false);
  const buildsOnNotice = freshAtOpen && !buildsOnDismissed ? unfinishedBuildsOn(lesson.id, state) : [];
  const showIntro = freshAtOpen && index === 0;
  const unlocked = isLessonUnlocked(lesson.id, state);

  useEffect(() => {
    // Record the open lesson and step. The resume point comes from saved
    // progress, so it is only trusted once that progress has been read. A
    // locked lesson (opened from search or a link) is not recorded: it used
    // to gain a "started" entry and become the last lesson.
    if (!hydrated || !unlocked) return;
    const start = resumeIndex(state.lessons[lesson.id], lesson.steps.length);
    setIndex(start);
    goToStep(lesson.id, start);
    // Once per lesson (this component is keyed by lesson), or when progress
    // first becomes available; ordinary progress updates must not re-run this.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  useEffect(() => () => stopSpeaking(), []);

  const rawStep = lesson.steps[index];
  // On a Classic device, a step written for newer phones shows its Classic alternative.
  const step = rawStep ? stepForEngine(rawStep, engine) : undefined;
  const variant = rawStep?.runtime === 'modern' ? (step === rawStep ? 'modern' : 'classic') : undefined;
  // Bonus ("Go further") steps come after the required ones and are offered
  // from the summary; the lesson is finished without them.
  const requiredCount = requiredSteps(lesson.steps).length;
  const inBonus = index >= requiredCount;

  // Settings → "Read aloud": read each step out as it opens. The button in the
  // header works either way.
  const autoRead = state.settings.readAloud && supportsSpeech();
  useEffect(() => {
    if (!autoRead || !unlocked || finished || !step) return;
    setSpeaking(true);
    const started = speak(spokenText(step, mode), () => setSpeaking(false), voices);
    if (!started) setSpeaking(false);
    // Once per step; changing anything else must not restart the voice.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step?.id, finished, autoRead]);

  // Each step is a new screen: move focus to its heading so keyboard and
  // screen-reader users start at the right place instead of the footer. Not
  // on the first render: opening a lesson should not grab focus.
  const focusedIndex = useRef(index);
  useEffect(() => {
    if (index === focusedIndex.current) return;
    focusedIndex.current = index;
    if (!step) return;
    const heading = document.getElementById(`step-title-${step.id}`);
    if (!heading) return;
    heading.setAttribute('tabindex', '-1');
    heading.focus({ preventScroll: false });
  }, [index, step]);

  // Keyboard: Ctrl/⌘+Enter checks everywhere; J/K/H/? in Pro mode.
  const goNextRef = useRef<() => void>(() => undefined);
  const goBackRef = useRef<() => void>(() => undefined);
  useLessonShortcuts(mode === 'pro' && unlocked && !finished, {
    next: () => goNextRef.current(),
    back: () => goBackRef.current(),
    hint: () => setHintLevel((level) => (level === 0 ? 1 : level)),
    help: () => setShortcutsOpen(true),
  });

  const revealed = useMemo(() => {
    if (!step) return false;
    return Boolean(state.lessons[lesson.id]?.steps[step.id]?.revealed) || justRevealed.includes(step.id);
  }, [lesson, step, state.lessons, justRevealed]);

  const dotStates = useMemo(() => {
    const progress = state.lessons[lesson.id];
    const shown = index >= requiredCount ? lesson.steps.slice(requiredCount) : lesson.steps.slice(0, requiredCount);
    return shown.map((item) => {
      const record = progress?.steps[item.id];
      if (record?.solved) return 'done' as const;
      if (record?.practiced) return 'practiced' as const;
      return 'todo' as const;
    });
  }, [lesson, state.lessons, index, requiredCount]);

  if (!unlocked) {
    const previous = previousLessonId(lesson.id);
    return (
      <Card pad="lg" className={styles.lockedCard}>
        <Mascot pose="hmm" size={96} />
        <h1 className={styles.doneTitle}>{t('player.lockedTitle')}</h1>
        <p className="muted" style={{ maxWidth: '34ch' }}>
          {t('player.lockedBody', { title: lesson.title[mode] })}
        </p>
        {previous ? (
          <LinkButton to={`/learn/${previous}`} variant="primary">
            {t('player.previousLesson')}
          </LinkButton>
        ) : null}
        <LinkButton to="/" variant="ghost">
          {t('shell.backToJourney')}
        </LinkButton>
        <p className={styles.unlockHint}>
          {t('unlock.lockedHint')} <Link to="/settings#learning-path">{t('unlock.lockedLink')}</Link>
        </p>
      </Card>
    );
  }

  const nextId = nextLessonId(lesson.id);
  const total = lesson.steps.length;
  const bonusCount = total - requiredCount;
  // The last step of the part being played: the required steps, or the bonus ones.
  const lastIndex = inBonus ? total - 1 : requiredCount - 1;

  const moveTo = (next: number) => {
    setIndex(next);
    setHintLevel(0);
    setReaction(null);
    goToStep(lesson.id, next);
  };

  const goNext = () => {
    if (index < lastIndex) {
      moveTo(index + 1);
      return;
    }
    const result = finishLesson(lesson.id);
    if (!inBonus) sound(result.badges.some((id) => id.startsWith('module:')) ? 'celebrate' : 'complete');
    setFinished(result);
  };

  const startBonus = () => {
    setSummaryBeforeBonus(finished);
    setFinished(null);
    moveTo(requiredCount);
  };

  const goBack = () => {
    if (index === requiredCount && summaryBeforeBonus) {
      // Back from the first bonus step: to the summary it was opened from.
      setFinished(summaryBeforeBonus);
      return;
    }
    const previous = Math.max(0, index - 1);
    setIndex(previous);
    setHintLevel(0);
    setReaction(null);
    goToStep(lesson.id, previous);
  };

  const handleResult = (result: { correct: boolean; revealed: boolean }) => {
    if (!step) return;
    if (result.revealed) {
      setJustRevealed((current) => [...current, step.id]);
    } else {
      sound(result.correct ? 'correct' : 'retry');
      setReaction((current) => ({ correct: result.correct, attempt: (current?.attempt ?? -1) + 1 }));
    }
    recordResult(lesson.id, step.id, result.correct, result.revealed);
  };

  goNextRef.current = goNext;
  goBackRef.current = () => {
    if (index > 0) goBack();
  };

  const handleReveal = () => {
    if (!step) return;
    revealStep(lesson.id, step.id);
    setJustRevealed((current) => [...current, step.id]);
    recordResult(lesson.id, step.id, true, true);
  };

  const readAloud = () => {
    if (!step) return;
    if (speaking) {
      stopSpeaking();
      setSpeaking(false);
      return;
    }
    setSpeaking(true);
    const started = speak(spokenText(step, mode), () => setSpeaking(false), voices);
    if (!started) setSpeaking(false);
  };

  if (finished) {
    return (
      <LessonSummary
        lesson={lesson}
        mode={mode}
        quiet={quiet}
        xpBefore={xpAtOpen}
        xpAfter={xpFromState(state)}
        badges={finished.badges}
        celebrations={finished.celebrations}
        nextId={nextId}
        bonusCount={bonusCount}
        onBonus={startBonus}
      />
    );
  }

  if (!step) return null;

  const hasHint = Boolean(step.hint || step.strongHint);
  // Every graded step offers a way forward: its hint if it has one, and always
  // "Show me the answer". Steps without a hint used to offer neither.
  const showHintButton = hasHint || isGradedStep(step);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.crumbRow}>
          {module ? (
            <Link to={`/module/${module.id}`} className={styles.crumb} style={{ textDecoration: 'none' }}>
              {module.number === 0 ? t('lesson.startHere') : t('lesson.moduleNumber', { number: module.number })} ·{' '}
              <bdi>{course.moduleTitle(module)}</bdi>
            </Link>
          ) : null}
          <span className={styles.crumb} style={{ color: 'var(--ink-muted)' }}>
            {t('lesson.minutes', { count: lesson.estMinutes })}
          </span>
        </div>

        <h1 className={styles.title} dir="auto">
          {lesson.title[mode]}
        </h1>

        <div className={styles.metaRow}>
          <div className="row" style={{ gap: 'var(--s-2)' }}>
            <StepDots
              count={dotStates.length}
              index={inBonus ? index - requiredCount : index}
              states={dotStates}
            />
            <span className={styles.metaText}>
              {inBonus
                ? t('bonus.stepOf', { current: index - requiredCount + 1, total: bonusCount })
                : t('lesson.stepOf', { current: index + 1, total: requiredCount })}
            </span>
          </div>
          <div className="row" style={{ gap: 'var(--s-1)' }}>
            {supportsSpeech() ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={readAloud}
                aria-pressed={speaking}
              >
                {speaking ? t('player.stop') : t('player.readAloud')}
              </Button>
            ) : null}
            {mode === 'pro' ? (
              <Button variant="ghost" size="sm" onClick={() => setShortcutsOpen(true)}>
                {t('shortcuts.open')}
              </Button>
            ) : null}
            <Link to="/" className="btn btn--ghost btn--sm">
              {t('player.exit')}
            </Link>
          </div>
        </div>
      </header>

      {showIntro ? (
        <LessonIntro
          lesson={lesson}
          mode={mode}
          buildsOn={buildsOnNotice}
          onContinue={() => {
            setBuildsOnDismissed(true);
            // The button disappears: keep keyboard focus on the lesson, at its first step.
            requestAnimationFrame(() => {
              const heading = document.getElementById(`step-title-${step.id}`);
              heading?.setAttribute('tabindex', '-1');
              heading?.focus();
            });
          }}
        />
      ) : null}

      <div data-shortcut-scope className="contents">
      <StepView
        key={step.id}
        lesson={lesson}
        step={step}
        mode={mode}
        revealed={revealed}
        onResult={handleResult}
        onReveal={handleReveal}
        variant={variant}
      />
      </div>

      {reaction && !quiet && !revealed ? (
        <TessReaction key={reaction.attempt} correct={reaction.correct} attempt={reaction.attempt} mode={mode} />
      ) : null}

      {revealed && isGradedStep(step) ? (
        <Card className={styles.hintPanel}>
          <strong>{t('player.practisedOpen')}</strong>
          <span className="muted">{t('player.practisedOpenBody')}</span>
        </Card>
      ) : null}

      {hintLevel > 0 && !revealed ? (
        <Card className={styles.hintPanel}>
          {hasHint ? (
            <>
              <strong>{hintLevel === 1 ? t('player.aHint') : t('player.strongerHint')}</strong>
              <Markdown
                text={loc((hintLevel === 1 ? step.hint : step.strongHint) ?? step.hint ?? step.prompt, mode)}
                className=""
              />
            </>
          ) : (
            <>
              <strong>{t('player.stuck')}</strong>
              <span className="muted">{t('player.noHint')}</span>
            </>
          )}
          <div className={styles.hintActions}>
            {hintLevel === 1 && step.strongHint ? (
              <Button size="sm" onClick={() => setHintLevel(2)}>
                {t('player.stillStuck')}
              </Button>
            ) : null}
            <Button size="sm" variant="ghost" onClick={handleReveal}>
              {t('player.showAnswer')}
            </Button>
          </div>
        </Card>
      ) : null}

      <footer className={styles.footer}>
        <Button
          variant="ghost"
          onClick={goBack}
          disabled={index === 0 || (index === requiredCount && !summaryBeforeBonus)}
        >
          {t('player.back')}
        </Button>

        {showHintButton && !revealed && hintLevel === 0 ? (
          <Button variant="ghost" onClick={() => setHintLevel(1)}>
            {hasHint ? t('player.hint') : t('player.stuck')}
          </Button>
        ) : null}

        <span className={styles.footerSpacer} />

        <Button variant="primary" size="lg" onClick={goNext}>
          {index < lastIndex ? t('player.next') : inBonus ? t('bonus.done') : t('player.finish')}
        </Button>
      </footer>
      <ShortcutsDialog open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { isLessonCompleted } from '../../content/curriculum';
import { loc } from '../../content/text';
import type { ReviewOutcome } from '../../storage/review';
import { useJourney } from '../../storage/store';
import { Button, LinkButton } from '../../ui/Button';
import { Card } from '../../ui/primitives';
import { Markdown } from '../../ui/Markdown';
import { Mascot } from '../../ui/Mascot';
import { StepView } from '../lesson/StepView';
import { stepForEngine } from '../../content/schema';
import { useEngine } from '../../platform/useEngine';
import { ContentLanguage, textLanguageFor } from '../../content/contentLanguage';
import lessonStyles from '../lesson/lesson.module.css';
import { loadReviewItem, practiceSummary, sessionKeys, whenDue, type ReviewItem } from './queue';
import { useT } from '../../i18n/t';
import { isOnline, reloadApp } from '../../platform/capabilities';
import { Callout } from '../../ui/primitives';
import styles from './review.module.css';

/**
 * Practice: graded steps come back after a while (see storage/review.ts).
 * A session is a fixed list taken when it starts, so a step answered wrongly
 * does not come straight back in an endless loop; it is due again next time.
 */
export function ReviewPage() {
  const { t, language } = useT();
  const state = useJourney((store) => store.state);
  // A session is a fixed list of card keys, taken when it starts. Their
  // content is loaded (and re-loaded in a new language) by `SessionLoader`.
  const [session, setSession] = useState<{ keys: readonly string[]; extra: boolean } | null>(null);
  const mode = state.settings.mode;

  if (session) {
    return <SessionLoader keys={session.keys} extra={session.extra} onDone={() => setSession(null)} />;
  }

  const summary = practiceSummary(state);
  const story = mode === 'story';

  return (
    <div className={styles.page}>
      <header>
        <p className="eyebrow">{t('review.eyebrow')}</p>
        <h1 className={styles.title}>
          {summary.due > 0 ? t('practice.stepsReady', { count: summary.due }) : t('review.nothingDue')}
        </h1>
        <p className="muted">{story ? t('review.ledeStory') : t('review.lede')}</p>
      </header>

      {summary.total === 0 ? (
        <Card pad="lg" className={styles.empty}>
          <Mascot pose="idle" size={88} />
          <p>{t('review.empty')}</p>
          <LinkButton to="/" variant="primary">
            {t('shell.backToJourney')}
          </LinkButton>
        </Card>
      ) : (
        <Card pad="lg" className={styles.start}>
          <dl className={styles.stats}>
            <div>
              <dt>{t('review.dueNow')}</dt>
              <dd>{summary.due}</dd>
            </div>
            <div>
              <dt>{t('review.inPractice')}</dt>
              <dd>{summary.total}</dd>
            </div>
            <div>
              <dt>{t('review.rememberedWell')}</dt>
              <dd>{summary.strong}</dd>
            </div>
          </dl>
          {summary.due > 0 ? (
            <Button
              variant="primary"
              size="lg"
              onClick={() => setSession({ keys: sessionKeys(state, 'due'), extra: false })}
            >
              {t('review.start')}
            </Button>
          ) : (
            <>
              <p className="muted">
                {summary.nextDueAt !== null ? `${t('review.nextDue', { when: whenDue(summary.nextDueAt, language) })} ` : ''}
                {t('review.anyway')}
              </p>
              <Button
                variant="primary"
                onClick={() => setSession({ keys: sessionKeys(state, 'weakest'), extra: true })}
              >
                {t('review.hardest')}
              </Button>
            </>
          )}
        </Card>
      )}
    </div>
  );
}

type SessionLoad =
  | { status: 'loading' }
  | { status: 'ready'; items: readonly ReviewItem[] }
  | { status: 'failed' };

/**
 * Loads the lessons behind a session's cards, in the language on screen. A
 * language switch re-loads the wording while the session, its position and
 * its results stay where they are.
 */
function SessionLoader({ keys, extra, onDone }: { keys: readonly string[]; extra: boolean; onDone: () => void }) {
  const { t, language } = useT();
  const [load, setLoad] = useState<SessionLoad>({ status: 'loading' });

  useEffect(() => {
    let alive = true;
    Promise.all(keys.map((key) => loadReviewItem(key, language))).then(
      (items) => {
        if (alive) setLoad({ status: 'ready', items: items.filter((item): item is ReviewItem => item !== null) });
      },
      (error: unknown) => {
        console.error('[TypeScript Companion] practice content could not load', error);
        if (alive) setLoad((current) => (current.status === 'ready' ? current : { status: 'failed' }));
      },
    );
    return () => {
      alive = false;
    };
  }, [keys, language]);

  if (load.status === 'failed') {
    return (
      <div className={styles.page}>
        <Callout tone="warn" title={t('review.didNotLoad')}>
          <p>
            {isOnline()
              ? t('review.didNotLoadOnline')
              : t('review.didNotLoadOffline')}
          </p>
          <div className="row" style={{ marginTop: 'var(--s-2)' }}>
            <Button size="sm" variant="primary" onClick={reloadApp}>
              {t('shell.reload')}
            </Button>
            <Button size="sm" variant="ghost" onClick={onDone}>
              {t('review.back')}
            </Button>
          </div>
        </Callout>
      </div>
    );
  }
  if (load.status === 'loading') {
    return <div className={styles.page} aria-busy="true" />;
  }
  return <Session items={load.items} extra={extra} onDone={onDone} />;
}

type CardState = { wrong: number; revealed: boolean; outcome: ReviewOutcome | null; hint: boolean };

const fresh = (): CardState => ({ wrong: 0, revealed: false, outcome: null, hint: false });

function Session({ items, extra, onDone }: { items: readonly ReviewItem[]; extra: boolean; onDone: () => void }) {
  const { t, language } = useT();
  const state = useJourney((store) => store.state);
  const practised = useJourney((store) => store.practised);
  const [index, setIndex] = useState(0);
  const [current, setCurrent] = useState<CardState>(fresh);
  const [results, setResults] = useState<readonly ReviewOutcome[]>([]);
  const [finished, setFinished] = useState(items.length === 0);
  const mode = state.settings.mode;
  const engine = useEngine();

  const item = items[index];

  const settle = (outcome: ReviewOutcome) => {
    if (!item || current.outcome) return;
    practised(item.key, outcome);
    setResults((list) => [...list, outcome]);
    setCurrent((card) => ({ ...card, outcome }));
  };

  const count = useJourney((store) => store.count);
  const next = () => {
    if (index >= items.length - 1) {
      if (results.length > 0) count('practiceSessions');
      setFinished(true);
      return;
    }
    setIndex(index + 1);
    setCurrent(fresh());
  };

  if (finished || !item) {
    const remembered = results.filter((outcome) => outcome === 'remembered').length;
    const again = results.filter((outcome) => outcome === 'forgot').length;
    return (
      <div className={styles.page}>
        <Card pad="lg" className={styles.empty}>
          <Mascot pose="cheering" size={104} />
          <h1 className={styles.title}>{t('review.done')}</h1>
          <p>
            {t('review.donePractised', { count: results.length })}
            {remembered > 0 ? ` ${t('review.doneRemembered', { count: remembered })}` : ''}
            {' '}
            {again > 0 ? t('review.doneAgain', { count: again }) : t('review.doneWaitLonger')}
          </p>
          <div className="row" style={{ justifyContent: 'center' }}>
            <LinkButton to="/" variant="primary">
              {t('shell.backToJourney')}
            </LinkButton>
            <Button variant="ghost" onClick={onDone}>
              {t('review.overview')}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const { lesson } = item;
  const step = stepForEngine(item.step, engine);
  const hint = step.hint ?? step.strongHint;
  const lessonDone = isLessonCompleted(lesson.id, state);

  return (
    <ContentLanguage value={textLanguageFor(lesson.textLanguage, language)}>
    <div className={lessonStyles.page}>
      <header className={lessonStyles.header}>
        <div className={lessonStyles.crumbRow}>
          <span className={lessonStyles.crumb}>{extra ? t('review.extra') : t('review.eyebrow')}</span>
          <span className={lessonStyles.crumb} style={{ color: 'var(--ink-muted)' }}>
            {t('review.position', { current: index + 1, total: items.length })}
          </span>
        </div>
        <p className={styles.from}>
          {t('review.from')}{' '}
          {lessonDone ? (
            <Link to={`/learn/${lesson.id}`}>
              <bdi>{lesson.title[mode]}</bdi>
            </Link>
          ) : (
            <bdi>{lesson.title[mode]}</bdi>
          )}
        </p>
      </header>

      <StepView
        key={`${index}:${item.key}`}
        lesson={lesson}
        step={step}
        mode={mode}
        revealed={current.revealed}
        draftKey={null}
        variant={item.step.runtime === 'modern' ? (step === item.step ? 'modern' : 'classic') : undefined}
        onResult={(result) => {
          if (result.revealed) return;
          if (result.correct) settle(current.wrong > 0 ? 'struggled' : 'remembered');
          else setCurrent((card) => ({ ...card, wrong: card.wrong + 1 }));
        }}
        onReveal={() => {
          settle('forgot');
          setCurrent((card) => ({ ...card, revealed: true }));
        }}
      />

      {current.outcome ? (
        <p className={styles.verdict} role="status">
          {current.outcome === 'remembered'
            ? t('review.remembered')
            : current.outcome === 'struggled'
              ? t('review.struggled')
              : t('review.forgot')}
        </p>
      ) : null}

      {current.hint && !current.revealed ? (
        <Card className={lessonStyles.hintPanel}>
          {hint ? (
            <>
              <strong>{t('player.aHint')}</strong>
              <Markdown text={loc(hint, mode)} className="" />
            </>
          ) : (
            <strong>{t('player.stuck')}</strong>
          )}
          <div className={lessonStyles.hintActions}>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                settle('forgot');
                setCurrent((card) => ({ ...card, revealed: true }));
              }}
            >
              {t('player.showAnswer')}
            </Button>
          </div>
        </Card>
      ) : null}

      <footer className={lessonStyles.footer}>
        <Link to="/" className="btn btn--ghost">
          {t('review.stop')}
        </Link>
        {!current.outcome && !current.hint ? (
          <Button variant="ghost" onClick={() => setCurrent((card) => ({ ...card, hint: true }))}>
            {hint ? t('player.hint') : t('player.stuck')}
          </Button>
        ) : null}
        <span className={lessonStyles.footerSpacer} />
        <Button variant="primary" size="lg" onClick={next}>
          {current.outcome ? (index >= items.length - 1 ? t('review.finish') : t('player.next')) : t('review.skip')}
        </Button>
      </footer>
    </div>
    </ContentLanguage>
  );
}

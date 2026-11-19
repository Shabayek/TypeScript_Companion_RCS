import { Link, useParams } from 'react-router-dom';
import { ARENA_LEVELS, type ArenaLevel, type ArenaPuzzle } from '../../content/arenaLevels';
import type { TypesStep } from '../../content/schema';
import { useT } from '../../i18n/t';
import type { MessageKey } from '../../i18n/messages';
import { useJourney } from '../../storage/store';
import type { ArenaProgress } from '../../storage/types';
import { Button, LinkButton } from '../../ui/Button';
import { Markdown } from '../../ui/Markdown';
import { Badge, Card, EmptyState } from '../../ui/primitives';
import { LazyCodeExercise } from '../exercises/lazyPanels';
import { useCheckShortcut } from '../lesson/useLessonShortcuts';
import { useArena } from './useArena';
import styles from './arena.module.css';

const LEVEL_LABEL: Record<ArenaLevel, MessageKey> = {
  'warm-up': 'arena.levelWarmUp',
  medium: 'arena.levelMedium',
  hard: 'arena.levelHard',
  extreme: 'arena.levelExtreme',
};

function statusOf(progress: ArenaProgress | undefined): 'solved' | 'revealed' | 'tried' | 'new' {
  if (progress?.solved) return 'solved';
  if (progress?.revealed) return 'revealed';
  if ((progress?.attempts ?? 0) > 0) return 'tried';
  return 'new';
}

const STATUS_LABEL = {
  solved: 'arena.statusSolved',
  revealed: 'arena.statusRevealed',
  tried: 'arena.statusTried',
  new: 'arena.statusNew',
} as const satisfies Record<string, MessageKey>;

function Loading() {
  const { t } = useT();
  return (
    <p className="muted" role="status">
      {t('player.opening')}
    </p>
  );
}

/** The Type Challenges arena: every puzzle, by level, with what the learner has done. */
export function ArenaPage() {
  const { t } = useT();
  const load = useArena();
  const arena = useJourney((store) => store.state.arena);

  const puzzles = load.status === 'ready' ? load.puzzles : [];
  const solved = puzzles.filter((puzzle) => arena[puzzle.id]?.solved).length;

  return (
    <div className={styles.page}>
      <header>
        <p className="eyebrow">{t('arena.eyebrow')}</p>
        <h1 className={styles.title}>{t('arena.title')}</h1>
        <p className="muted">{t('arena.lede')}</p>
        {load.status === 'ready' ? (
          <p className={styles.count} data-testid="arena-count">
            {t('arena.solvedCount', { solved, total: puzzles.length })}
          </p>
        ) : null}
      </header>

      {load.status === 'loading' ? <Loading /> : null}
      {load.status === 'failed' ? <p role="alert">{t('arena.failed')}</p> : null}

      {ARENA_LEVELS.map((level) => {
        const ofLevel = puzzles.filter((puzzle) => puzzle.level === level);
        if (ofLevel.length === 0) return null;
        return (
          <section key={level} aria-labelledby={`arena-${level}`} className={styles.level} data-level={level}>
            <h2 id={`arena-${level}`} className={styles.levelTitle}>
              {t(LEVEL_LABEL[level])}
            </h2>
            <ul className={styles.list}>
              {ofLevel.map((puzzle) => {
                const status = statusOf(arena[puzzle.id]);
                return (
                  <li key={puzzle.id}>
                    <Link to={`/arena/${puzzle.id}`} className={styles.puzzle} data-status={status}>
                      <span className={styles.mark} aria-hidden="true">
                        {status === 'solved' ? '✓' : status === 'revealed' ? '👁' : status === 'tried' ? '…' : '○'}
                      </span>
                      <span className={styles.puzzleTitle}>
                        <bdi>{puzzle.title}</bdi>
                      </span>
                      <span className={styles.status}>{t(STATUS_LABEL[status])}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

/** One puzzle: the challenge, an editor graded by type tests, and ways on. */
export function ArenaPuzzlePage() {
  const { t } = useT();
  const { puzzleId = '' } = useParams<{ puzzleId: string }>();
  const load = useArena();
  const recordArena = useJourney((store) => store.recordArena);
  const progress = useJourney((store) => store.state.arena[puzzleId]);
  const mode = useJourney((store) => store.state.settings.mode);
  useCheckShortcut();

  if (load.status === 'loading') return <Loading />;
  const puzzles = load.status === 'ready' ? load.puzzles : [];
  const index = puzzles.findIndex((puzzle) => puzzle.id === puzzleId);
  const puzzle: ArenaPuzzle | undefined = puzzles[index];
  if (!puzzle) {
    return (
      <EmptyState title={t('arena.notFound')} action={<LinkButton to="/arena">{t('arena.all')}</LinkButton>}>
        {t('arena.notFoundBody')}
      </EmptyState>
    );
  }
  const previous = puzzles[index - 1];
  const next = puzzles[index + 1];
  const revealed = Boolean(progress?.revealed);
  const step: TypesStep = {
    id: puzzle.id,
    kind: 'types',
    prompt: puzzle.prompt,
    hint: puzzle.hint,
    explain: puzzle.explain,
    starter: puzzle.starter,
    solution: puzzle.solution,
    typeTests: puzzle.typeTests,
  };

  return (
    <div className={styles.page}>
      <header className={styles.puzzleHeader}>
        <Link to="/arena" className={styles.crumb}>
          {t('arena.title')}
        </Link>
        <div className="row">
          <Badge tone="accent">{t(LEVEL_LABEL[puzzle.level])}</Badge>
          {progress?.solved ? <Badge tone="success">{t('arena.statusSolved')}</Badge> : null}
        </div>
        <h1 className={styles.title}>
          <bdi>{puzzle.title}</bdi>
        </h1>
        <Markdown text={puzzle.prompt.base} />
      </header>

      <div data-shortcut-scope className="contents">
        <LazyCodeExercise
          key={puzzle.id}
          step={step}
          mode={mode}
          revealed={revealed}
          draftKey={`arena:${puzzle.id}`}
          onReveal={() => recordArena(puzzle.id, { correct: true, revealed: true })}
          onResult={(result) => recordArena(puzzle.id, result)}
          fallback={
            <Card role="status" className={styles.loading}>
              {t('player.loadingEditor')}
            </Card>
          }
        />
      </div>

      <details className={styles.hint}>
        <summary>{t('player.hint')}</summary>
        <Markdown text={puzzle.hint.base} className="" />
      </details>

      <footer className={styles.footer}>
        {previous ? (
          <LinkButton to={`/arena/${previous.id}`} variant="ghost">
            {t('arena.previous')}
          </LinkButton>
        ) : (
          <span />
        )}
        {!revealed && !progress?.solved ? (
          <Button variant="ghost" onClick={() => recordArena(puzzle.id, { correct: true, revealed: true })}>
            {t('player.showAnswer')}
          </Button>
        ) : null}
        {next ? (
          <LinkButton to={`/arena/${next.id}`} variant="primary">
            {t('arena.next')}
          </LinkButton>
        ) : (
          <LinkButton to="/arena" variant="primary">
            {t('arena.all')}
          </LinkButton>
        )}
      </footer>
    </div>
  );
}

import { useCallback, useEffect, useRef, useState } from 'react';
import type { AgeMode, Lesson, PlayGame, PlayStep } from '../../content/schema';
import { loc } from '../../content/text';
import { playProgram, usedSteps, type PlayInput } from '../../content/play';
import { runProgram, withNotes, type GradeOutcome } from '../../runner';
import { useJourney } from '../../storage/store';
import { useEngine } from '../../platform/useEngine';
import { Button } from '../../ui/Button';
import { CodeBlock } from '../../ui/CodeBlock';
import { InlineMarkdown } from '../../ui/Markdown';
import { ResultPanel } from '../../ui/ResultPanel';
import { describeRun } from './TryItPanel';
import styles from './exercises.module.css';
import { useT } from '../../i18n/t';
import { formatList } from '../../i18n/messages';
import { AdventureGame, BattleGame, MazeGame, PetGame, Screen, TodoGame, type GameRunner } from './games';

type Quiz = Extract<PlayGame, { type: 'quiz' }>;
type Budget = Extract<PlayGame, { type: 'budget' }>;
type Spinner = Extract<PlayGame, { type: 'spinner' }>;

interface Sources {
  code: readonly string[];
  /** Step numbers (1-based) whose code is the learner's own. */
  yours: readonly number[];
  /** Step numbers that are not solved yet: the example answer is used. */
  examples: readonly number[];
}

/**
 * The learner's code for each step the game uses: their saved code once the
 * step is solved, otherwise the reference solution (said out loud, so nobody
 * thinks the example answer is theirs).
 */
function useSources(lesson: Lesson, step: PlayStep): Sources {
  const drafts = useJourney((store) => store.drafts);
  const progress = useJourney((store) => store.state.lessons[lesson.id]);
  const code: string[] = [];
  const yours: number[] = [];
  const examples: number[] = [];
  for (const used of usedSteps(lesson, step)) {
    const number = lesson.steps.indexOf(used) + 1;
    const draft = drafts[`${lesson.id}:${used.id}`];
    if (progress?.steps[used.id]?.solved && draft !== undefined) {
      code.push(draft);
      yours.push(number);
    } else {
      code.push(used.solution);
      examples.push(number);
    }
  }
  return { code, yours, examples };
}


/** Runs the game program; the output lines are the game's screen. */
function useGameRunner(sources: Sources, driver: string): GameRunner {
  const [lines, setLines] = useState<readonly string[]>([]);
  const [problem, setProblem] = useState<GradeOutcome | null>(null);
  const [running, setRunning] = useState(false);
  const [program, setProgram] = useState('');
  const latest = useRef(0);
  const engine = useEngine();

  const play = useCallback(
    async (input: PlayInput) => {
      const run = (latest.current += 1);
      const source = playProgram(sources.code, input, driver);
      setProgram(source);
      setRunning(true);
      // Types were checked in the steps themselves; the game just runs.
      const result = await runProgram(source, { typeCheck: false, engine });
      if (run !== latest.current) return;
      setRunning(false);
      if (result.status === 'ok') {
        setLines(result.logs);
        setProblem(null);
      } else {
        setLines([]);
        setProblem(withNotes(describeRun(result), result.notes ?? []));
      }
    },
    // The sources are recomputed each render; their text is what matters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sources.code.join('\u0000'), driver, engine],
  );

  return { lines, problem, running, program, play };
}

export function GamePanel({ lesson, step, mode }: { lesson: Lesson; step: PlayStep; mode: AgeMode }) {
  const sources = useSources(lesson, step);
  const runner = useGameRunner(sources, step.driver);
  const { t, language } = useT();
  const list = (numbers: readonly number[]) => formatList(numbers.map(String), language);

  return (
    <div className={styles.wrap}>
      <p className={styles.choiceHint}>
        {sources.yours.length > 0 ? `${t('game.yours', { count: sources.yours.length, steps: list(sources.yours) })} ` : ''}
        {sources.examples.length > 0
          ? t('game.examples', { count: sources.examples.length, steps: list(sources.examples) })
          : ''}
      </p>

      {step.game.type === 'quiz' ? <QuizGame game={step.game} mode={mode} runner={runner} /> : null}
      {step.game.type === 'budget' ? <BudgetGame game={step.game} runner={runner} /> : null}
      {step.game.type === 'spinner' ? <SpinnerGame game={step.game} runner={runner} /> : null}
      {step.game.type === 'maze' ? <MazeGame game={step.game} runner={runner} /> : null}
      {step.game.type === 'pet' ? <PetGame game={step.game} runner={runner} /> : null}
      {step.game.type === 'todo' ? <TodoGame game={step.game} runner={runner} /> : null}
      {step.game.type === 'battle' ? <BattleGame game={step.game} runner={runner} /> : null}
      {step.game.type === 'adventure' ? <AdventureGame game={step.game} runner={runner} /> : null}

      {runner.problem ? (
        <>
          <p className={styles.choiceHint}>{t('game.stopped')}</p>
          <ResultPanel outcome={runner.problem} logs={[]} running={false} />
        </>
      ) : null}

      {runner.program ? (
        <details className={styles.gameCode}>
          <summary>{t('game.seeCode')}</summary>
          <CodeBlock code={runner.program} label="typescript" copy={false} />
        </details>
      ) : null}
    </div>
  );
}

type Runner = GameRunner;

function QuizGame({ game, mode, runner }: { game: Quiz; mode: AgeMode; runner: Runner }) {
  const { t } = useT();
  const [answers, setAnswers] = useState<readonly boolean[]>([]);
  const [picked, setPicked] = useState<number | null>(null);
  const index = answers.length;
  const question = game.questions[index];
  const finished = index >= game.questions.length;

  const pick = (choice: number) => {
    if (picked !== null || !question) return;
    setPicked(choice);
  };

  const next = () => {
    if (picked === null || !question) return;
    const all = [...answers, picked === question.answer];
    setAnswers(all);
    setPicked(null);
    if (all.length >= game.questions.length) void runner.play({ answers: all });
  };

  if (finished) {
    return (
      <div className={styles.wrap}>
        <Screen runner={runner} label={t('game.yourScore')} />
        <div className={styles.actions}>
          <Button variant="primary" onClick={() => setAnswers([])}>
            {t('game.playAgain')}
          </Button>
        </div>
      </div>
    );
  }

  if (!question) return null;
  const right = picked !== null && picked === question.answer;
  return (
    <div className={styles.wrap}>
      <p className={styles.fieldLabel}>
        {t('game.questionOf', { current: index + 1, total: game.questions.length })}
      </p>
      <p className={styles.gameQuestion}>
        <InlineMarkdown text={loc(question.question, mode)} />
      </p>
      <div className={styles.choiceList} role="group" aria-label={t('game.answers')}>
        {question.choices.map((choice, choiceIndex) => {
          const state =
            picked === null ? undefined : choiceIndex === question.answer ? 'correct' : choiceIndex === picked ? 'wrong' : 'muted';
          return (
            <button
              key={choice}
              type="button"
              className="option"
              data-state={state}
              data-selected={picked === choiceIndex}
              aria-pressed={picked === choiceIndex}
              disabled={picked !== null}
              onClick={() => pick(choiceIndex)}
            >
              <span className="option__mark" aria-hidden="true">
                {picked === choiceIndex ? (right ? '✓' : '✗') : ''}
              </span>
              <span className="grow">
                <InlineMarkdown text={choice} />
              </span>
            </button>
          );
        })}
      </div>
      {picked !== null ? (
        <div className={styles.actions}>
          <span role="status">{right ? t('game.right') : t('game.notThisTime')}</span>
          <Button variant="primary" onClick={next}>
            {index + 1 < game.questions.length ? t('game.nextQuestion') : t('game.seeScore')}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function BudgetGame({ game, runner }: { game: Budget; runner: Runner }) {
  const { t } = useT();
  const [budget, setBudget] = useState(String(game.budget));
  const [expenses, setExpenses] = useState<readonly { label: string; amount: number }[]>([]);
  const [label, setLabel] = useState('');
  const [amount, setAmount] = useState('');
  const { play } = runner;

  const budgetNumber = Number(budget);
  const budgetValid = budget.trim() !== '' && Number.isFinite(budgetNumber);

  // The tracker updates as the list changes: every change runs the program.
  useEffect(() => {
    if (!budgetValid) return;
    const timer = setTimeout(() => void play({ budget: budgetNumber, expenses }), 250);
    return () => clearTimeout(timer);
  }, [budgetNumber, budgetValid, expenses, play]);

  const amountNumber = Number(amount);
  const canAdd = label.trim() !== '' && amount.trim() !== '' && Number.isFinite(amountNumber) && amountNumber >= 0;
  const add = (item: { label: string; amount: number }) => setExpenses((current) => [...current, item]);

  return (
    <div className={styles.wrap}>
      <div className={styles.field}>
        <label className={styles.fieldLabel} htmlFor="game-budget">
          {t('game.budget')}
        </label>
        <input
          id="game-budget"
          className="input"
          inputMode="decimal"
          value={budget}
          onChange={(event) => setBudget(event.target.value)}
        />
      </div>

      {/* The totals sit up top, so they stay in view as the list grows. */}
      <Screen runner={runner} label={t('game.yourBudget')} />

      <div className={styles.gameChips} role="group" aria-label={t('game.quickAdd')}>
        {game.suggestions.map((item) => (
          <Button key={item.label} size="sm" onClick={() => add(item)}>
            + {item.label} ({item.amount})
          </Button>
        ))}
      </div>

      <form
        className={styles.gameForm}
        onSubmit={(event) => {
          event.preventDefault();
          if (!canAdd) return;
          add({ label: label.trim(), amount: amountNumber });
          setLabel('');
          setAmount('');
        }}
      >
        <div className={styles.field}>
          <label className={styles.fieldLabel} htmlFor="game-label">
            {t('game.bought')}
          </label>
          <input id="game-label" className="input" value={label} onChange={(event) => setLabel(event.target.value)} />
        </div>
        <div className={styles.field}>
          <label className={styles.fieldLabel} htmlFor="game-amount">
            {t('game.cost')}
          </label>
          <input
            id="game-amount"
            className="input"
            inputMode="decimal"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
          />
        </div>
        <Button type="submit" disabled={!canAdd}>
          {t('game.add')}
        </Button>
      </form>

      {expenses.length > 0 ? (
        <ul className={styles.gameList} aria-label={t('game.expenses')}>
          {expenses.map((item, index) => (
            <li key={index}>
              <span>
                {item.label} · {item.amount}
              </span>
              <Button
                size="sm"
                variant="ghost"
                aria-label={t('game.removeItem', { item: item.label })}
                onClick={() => setExpenses((current) => current.filter((_, at) => at !== index))}
              >
                {t('game.remove')}
              </Button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function SpinnerGame({ game, runner }: { game: Spinner; runner: Runner }) {
  const { t } = useT();
  const [spins, setSpins] = useState<readonly number[] | null>(null);

  const spin = () => {
    const next = game.wheels.map(() => Math.floor(Math.random() * 1000));
    setSpins(next);
    void runner.play({ spins: next });
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.actions}>
        <Button variant="primary" onClick={spin} disabled={runner.running}>
          {spins ? t('game.spinAgain') : t('game.spin')}
        </Button>
        {spins ? (
          <span className="muted">
            {game.wheels.map((wheel, index) => `${wheel} #${spins[index] ?? 0}`).join(' · ')}
          </span>
        ) : null}
      </div>
      {spins ? <Screen runner={runner} label={t('game.yourStory')} /> : null}
    </div>
  );
}

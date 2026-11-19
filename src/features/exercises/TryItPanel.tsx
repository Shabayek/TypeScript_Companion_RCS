import { useState } from 'react';
import { runProgram, withNotes } from '../../runner';
import { problemLines, runtimeLines, withTypeProblems } from '../../runner/grade';
import type { RunResult } from '../../runner/types';
import { Button } from '../../ui/Button';
import { CodeEditor } from '../../ui/CodeEditor';
import { ResultPanel } from '../../ui/ResultPanel';
import { CodeBlock } from '../../ui/CodeBlock';
import type { GradeOutcome } from '../../runner';
import { useJourney } from '../../storage/store';
import { useEngine } from '../../platform/useEngine';
import type { CompilerFlags } from '../../content/schema';
import { msg } from '../../i18n/text';
import { useT } from '../../i18n/t';
import styles from './exercises.module.css';

/** Type problems join an ungraded run too: the code ran, and here is what TypeScript noticed. */
export function withRunTypes(outcome: GradeOutcome, result: RunResult): GradeOutcome {
  const problems = result.typeProblems ?? [];
  if (problems.length === 0 || (result.status !== 'ok' && result.status !== 'runtime-error')) return outcome;
  const typed = withTypeProblems(outcome, problems);
  return outcome.kind === 'pass' ? { ...typed, headline: msg('runner.ranButTypes', { count: problems.length }) } : typed;
}

/** Friendly copy for an ungraded run. */
export function describeRun(result: RunResult): GradeOutcome {
  const base = { pass: false, results: [], logs: [] };
  switch (result.status) {
    case 'compile-error':
      return {
        ...base,
        kind: 'error',
        headline: msg('runner.syntaxFirst'),
        details: problemLines(result.problems ?? []),
      };
    case 'runtime-error':
      return {
        ...base,
        kind: 'error',
        headline: msg('runner.ranThenStopped'),
        details: result.error ? runtimeLines(result.error) : [msg('runner.probablyUndefined')],
      };
    case 'timeout':
      return {
        ...base,
        kind: 'timeout',
        headline: msg('runner.stoppedAfter', { seconds: 2 }),
        details: [
          result.error ?? msg('runner.loopNeverEnds'),
          ...(result.logs.length > 0 ? [msg('runner.timeoutOutput')] : []),
        ],
      };
    case 'unavailable':
      return {
        ...base,
        kind: 'unavailable',
        headline: msg('runner.runnerUnavailable'),
        details: [...(result.problems ?? []).map((problem) => problem.text), msg('runner.runnerUnavailableNote')],
      };
    default:
      return {
        ...base,
        kind: 'pass',
        pass: true,
        // From this run's output (this used to read the previous run's).
        headline: result.logs.length === 0 ? msg('runner.ranClean') : msg('runner.outputBelow'),
        details: [],
      };
  }
}

/**
 * A no-stakes sandbox. Nothing is graded, nothing is stored, and the output pane
 * is the only feedback — which is the point.
 */
export function TryItPanel({
  initialCode,
  minHeight = 180,
  onCodeChange,
  draftKey,
  onRun,
  flags,
  showTypes = false,
}: {
  initialCode: string;
  /** Offer "See the types in your code" under the result (the Playground). */
  showTypes?: boolean;
  /** Compiler flags for the type check (a lesson step's, or the Playground's). */
  flags?: CompilerFlags;
  minHeight?: number;
  onCodeChange?: (code: string) => void;
  /** Told each time the learner runs the code. */
  onRun?: () => void;
  /** Where to keep the learner's changes between visits. */
  draftKey?: string;
}) {
  const { t } = useT();
  const savedDraft = useJourney((store) => (draftKey ? store.drafts[draftKey] : undefined));
  const setDraft = useJourney((store) => store.setDraft);
  const [code, setCodeState] = useState(savedDraft ?? initialCode);
  const setCode = (next: string) => {
    setCodeState(next);
    if (draftKey) setDraft(draftKey, next === initialCode ? null : next);
  };
  const [logs, setLogs] = useState<readonly string[]>([]);
  const [outcome, setOutcome] = useState<GradeOutcome | null>(null);
  const [running, setRunning] = useState(false);
  const engine = useEngine();

  const run = async () => {
    onRun?.();
    setRunning(true);
    setOutcome(null);
    const result = await runProgram(code, { engine, ...(flags ? { flags } : {}) });
    setLogs(result.logs);
    const skipped = result.typeCheckSkipped ? [msg('runner.typeCheckSkippedRun', { reason: result.typeCheckSkipped })] : [];
    setOutcome(withNotes(withRunTypes(describeRun(result), result), [...(result.notes ?? []), ...skipped]));
    setRunning(false);
  };

  return (
    <div className={styles.wrap}>
      <CodeEditor
        value={code}
        onChange={(next) => {
          setCode(next);
          onCodeChange?.(next);
        }}
        ariaLabel={t('exercise.tryItEditor')}
        minHeight={minHeight}
      />
      <div className={styles.codeActions}>
        <Button variant="primary" data-shortcut="check" onClick={() => void run()} disabled={running}>
          {running ? t('exercise.running') : t('exercise.run')}
        </Button>
        <Button variant="ghost" onClick={() => setCode(initialCode)}>
          {t('exercise.reset')}
        </Button>
      </div>
      <ResultPanel outcome={outcome} logs={logs} running={running} />
      {showTypes ? (
        <details className={styles.typesDetails}>
          <summary>{t('playground.seeTypes')}</summary>
          <CodeBlock code={code} label="typescript" copy={false} variant="light" inspect {...(flags ? { flags } : {})} />
        </details>
      ) : null}
    </div>
  );
}

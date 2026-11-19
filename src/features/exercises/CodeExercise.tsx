import { useState } from 'react';
import type { CodeStep, TypesStep, TypeTest } from '../../content/schema';
import { loc } from '../../content/text';
import { gradeCode, gradeTypes, type GradeOutcome } from '../../runner';
import { useEngine } from '../../platform/useEngine';
import { useJourney } from '../../storage/store';
import { Button } from '../../ui/Button';
import { CodeBlock } from '../../ui/CodeBlock';
import { CodeEditor } from '../../ui/CodeEditor';
import { Callout } from '../../ui/primitives';
import { Markdown } from '../../ui/Markdown';
import { ResultPanel } from '../../ui/ResultPanel';
import type { ExerciseProps } from './common';
import styles from './exercises.module.css';
import { useT } from '../../i18n/t';

/** A type challenge's tests as the learner reads them: one commented block. */
export function typeTestsSource(tests: readonly TypeTest[]): string {
  return tests
    .map((test) => {
      const lines = test.code.split('\n');
      const body = test.expect === 'error' ? [...lines.slice(0, -1), '// @ts-expect-error', ...lines.slice(-1)] : lines;
      return [`// ${test.name}`, ...body].join('\n');
    })
    .join('\n\n');
}

export function CodeExercise({ step, mode, onResult, revealed, draftKey }: ExerciseProps<CodeStep | TypesStep>) {
  const { t } = useT();
  const engine = useEngine();
  const savedDraft = useJourney((store) => (draftKey ? store.drafts[draftKey] : undefined));
  const setDraft = useJourney((store) => store.setDraft);
  const [restored] = useState(() => savedDraft !== undefined && savedDraft !== step.starter);
  const [code, setCodeState] = useState(savedDraft ?? step.starter);
  // The learner's code is kept for this step, so Back, Next or a reload do
  // not throw it away (they used to).
  const setCode = (next: string) => {
    setCodeState(next);
    if (draftKey) setDraft(draftKey, next === step.starter ? null : next);
  };
  const [running, setRunning] = useState(false);
  const [logs, setLogs] = useState<readonly string[]>([]);
  const [outcome, setOutcome] = useState<GradeOutcome | null>(null);
  const [showSolution, setShowSolution] = useState(false);

  const run = async () => {
    setRunning(true);
    setOutcome(null);
    const options = { engine, ...(step.compilerFlags ? { flags: step.compilerFlags } : {}) };
    const result =
      step.kind === 'types'
        ? await gradeTypes(code, step.typeTests, step.tests ?? [], step.id, options)
        : await gradeCode(code, step.tests, step.id, options);
    setLogs(result.logs);
    setOutcome(result);
    setRunning(false);
    if (result.kind === 'pass' || result.kind === 'fail') {
      onResult({ correct: result.pass, revealed: false });
    }
  };

  const isUnavailable = outcome?.kind === 'unavailable';

  return (
    <div className={styles.wrap}>
      {restored ? (
        <p className={styles.choiceHint} role="status">
          {t('exercise.restored')}
        </p>
      ) : null}
      {step.kind === 'types' ? (
        <CodeBlock code={typeTestsSource(step.typeTests)} label={t('exercise.typeChecksLabel')} variant="light" copy={false} />
      ) : null}
      <div className={styles.editorFrame}>
        <CodeEditor
          value={code}
          onChange={setCode}
          ariaLabel={t('exercise.yourCode')}
          minHeight={200}
          placeholder={t('exercise.writeHere')}
        />
        <div className={styles.codeActions}>
          <Button variant="primary" data-shortcut="check" onClick={() => void run()} disabled={running}>
            {running ? t('exercise.checking') : step.kind === 'types' ? t('exercise.checkTypes') : t('exercise.runChecks')}
          </Button>
          <Button variant="ghost" onClick={() => setCode(step.starter)}>
            {t('exercise.resetCode')}
          </Button>
          <Button variant="ghost" onClick={() => setShowSolution((value) => !value)}>
            {showSolution ? t('exercise.hideExample') : t('exercise.compareExample')}
          </Button>
        </div>
      </div>

      <ResultPanel outcome={outcome} logs={logs} running={running} />

      {outcome && outcome.pass && step.explain ? (
        <Callout tone="tip" title={t('exercise.thatsTheIdea')}>
          <Markdown text={loc(step.explain, mode)} className="" />
        </Callout>
      ) : null}

      {isUnavailable ? (
        <Callout tone="why" title={t('exercise.paused')}>
          <p>{t('exercise.pausedBody')}</p>
          <div style={{ marginTop: 'var(--s-2)' }}>
            <Button size="sm" onClick={() => onResult({ correct: true, revealed: true })}>
              {t('exercise.markPractised')}
            </Button>
          </div>
        </Callout>
      ) : null}

      {showSolution || revealed ? (
        <CodeBlock
          code={step.solution}
          label={t('exercise.exampleLabel')}
          variant="light"
          inspect
          {...(step.compilerFlags ? { flags: step.compilerFlags } : {})}
        />
      ) : null}

      {revealed && step.explain ? (
        <Callout tone="why" title={t('exercise.whyWorks')}>
          <Markdown text={loc(step.explain, mode)} className="" />
        </Callout>
      ) : null}
    </div>
  );
}

import { useState } from 'react';
import type { PredictTypeStep } from '../../content/schema';
import { loc } from '../../content/text';
import { gradeTypeAnswer, type TypeAnswerVerdict } from '../../runner/typeAnswer';
import { useEngine } from '../../platform/useEngine';
import { CodeBlock } from '../../ui/CodeBlock';
import { Button } from '../../ui/Button';
import { Callout } from '../../ui/primitives';
import { InlineMarkdown, Markdown } from '../../ui/Markdown';
import { renderText } from '../../i18n/text';
import type { ExerciseProps } from './common';
import styles from './exercises.module.css';
import { useT } from '../../i18n/t';

/**
 * "What type does TypeScript give this?" The learner writes a type; the
 * checker on the device decides whether it is exactly the same type, so any
 * correct spelling counts (`number | string` for `string | number`).
 */
export function PredictTypeExercise({ step, mode, onResult, revealed, onReveal }: ExerciseProps<PredictTypeStep>) {
  const { t } = useT();
  const engine = useEngine();
  const [value, setValue] = useState('');
  const [checking, setChecking] = useState(false);
  const [verdict, setVerdict] = useState<TypeAnswerVerdict | null>(null);
  const answered = verdict?.kind === 'right' || revealed;

  const check = async () => {
    if (value.trim() === '' || checking) return;
    setChecking(true);
    const result = await gradeTypeAnswer(step.code, step.target, value, [step.answer, ...(step.alsoAccept ?? [])], {
      engine,
      ...(step.compilerFlags ? { flags: step.compilerFlags } : {}),
    });
    setChecking(false);
    setVerdict(result);
    if (result.kind !== 'unavailable') onResult({ correct: result.kind === 'right', revealed: false });
  };

  return (
    <div className={styles.wrap}>
      {/* "See types" would give the answer away, so it appears once answered. */}
      <CodeBlock
        code={step.code}
        label="typescript"
        copy={false}
        inspect={answered}
        {...(step.compilerFlags ? { flags: step.compilerFlags } : {})}
      />

      <div className={styles.predictRow}>
        <label className={styles.typeLabel} htmlFor={`predict-type-${step.id}`}>
          <InlineMarkdown ui text={t('exercise.typeOf', { name: step.target })} />
        </label>
        <input
          id={`predict-type-${step.id}`}
          className={styles.predictInput}
          dir="ltr"
          value={revealed ? step.answer : value}
          onChange={(event) => {
            setValue(event.target.value);
            if (verdict?.kind !== 'right') setVerdict(null);
          }}
          placeholder={t('exercise.typePlaceholder')}
          readOnly={revealed}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          autoComplete="off"
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              void check();
            }
          }}
        />
        <Button
          variant="primary"
          data-shortcut="check"
          onClick={() => void check()}
          disabled={value.trim() === '' || revealed || checking}
        >
          {checking ? t('exercise.checking') : t('exercise.check')}
        </Button>
      </div>
      <p className={styles.choiceHint}>{t('exercise.typeHint')}</p>

      {verdict?.kind === 'right' ? (
        <Callout tone="tip" title={t('exercise.exactlyRight')}>
          {step.explain ? <Markdown text={loc(step.explain, mode)} className="" /> : null}
          {verdict.actual ? (
            <p>
              {t('exercise.typescriptWrites')} <code dir="ltr">{verdict.actual}</code>
            </p>
          ) : null}
        </Callout>
      ) : null}

      {verdict?.kind === 'wrong' && !revealed ? (
        <Callout tone="warn" title={t('exercise.notQuite')}>
          <p>{verdict.problem ? t('exercise.typeUnreadable', { problem: verdict.problem }) : t('exercise.typeDifferent')}</p>
        </Callout>
      ) : null}

      {verdict?.kind === 'unavailable' && !revealed ? (
        <Callout tone="why" title={t('exercise.paused')}>
          <p>{renderText(verdict.reason, t)}</p>
          <div style={{ marginTop: 'var(--s-2)' }}>
            <Button size="sm" onClick={onReveal}>
              {t('player.showAnswer')}
            </Button>
          </div>
        </Callout>
      ) : null}

      {revealed ? (
        <div className={styles.revealBox}>
          <strong>{t('exercise.theType')}</strong>
          <code dir="ltr">{step.answer}</code>
          {step.explain ? (
            <div style={{ marginTop: 'var(--s-2)' }}>
              <Markdown text={loc(step.explain, mode)} className="" />
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

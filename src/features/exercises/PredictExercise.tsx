import { useState } from 'react';
import type { PredictStep } from '../../content/schema';
import { loc, matchesOutput, predictMiss, type PredictMiss } from '../../content/text';
import { CodeBlock } from '../../ui/CodeBlock';
import { Button } from '../../ui/Button';
import { Callout } from '../../ui/primitives';
import { Markdown } from '../../ui/Markdown';
import type { ExerciseProps } from './common';
import styles from './exercises.module.css';
import { useT } from '../../i18n/t';
import type { MessageKey } from '../../i18n/messages';

type Mode = ExerciseProps<PredictStep>['mode'];

const MISS_KEYS: Record<PredictMiss | 'other', readonly [MessageKey, MessageKey]> = {
  quotes: ['exercise.missQuotes', 'exercise.missQuotesStory'],
  'line-breaks': ['exercise.missLines', 'exercise.missLinesStory'],
  order: ['exercise.missOrder', 'exercise.missOrderStory'],
  incomplete: ['exercise.missIncomplete', 'exercise.missIncompleteStory'],
  extra: ['exercise.missExtra', 'exercise.missExtraStory'],
  other: ['exercise.missOther', 'exercise.missOtherStory'],
};

/** A specific nudge for the common near misses; the generic one otherwise. */
function missMessage(miss: PredictMiss | null, mode: Mode): MessageKey {
  const [plain, story] = MISS_KEYS[miss ?? 'other'];
  return mode === 'story' ? story : plain;
}

export function PredictExercise({ step, mode, onResult, revealed }: ExerciseProps<PredictStep>) {
  const { t } = useT();
  const [value, setValue] = useState('');
  const [state, setState] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [miss, setMiss] = useState<PredictMiss | null>(null);

  const check = () => {
    const correct = matchesOutput(value, step.answer, step.alsoAccept ?? []);
    setState(correct ? 'correct' : 'wrong');
    setMiss(correct ? null : predictMiss(value, step.answer));
    onResult({ correct, revealed: false });
  };

  return (
    <div className={styles.wrap}>
      <CodeBlock
        code={step.code}
        label="typescript"
        copy={false}
        inspect
        {...(step.compilerFlags ? { flags: step.compilerFlags } : {})}
      />

      <div className={styles.predictRow}>
        <label className="sr-only" htmlFor={`predict-${step.id}`}>
          {t('exercise.predictLabel')}
        </label>
        <textarea
          id={`predict-${step.id}`}
          className={styles.predictInput}
          value={revealed ? step.answer : value}
          onChange={(event) => {
            setValue(event.target.value);
            setState('idle');
          }}
          placeholder={t('exercise.predictPlaceholder')}
          readOnly={revealed}
          spellCheck={false}
          rows={3}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
              event.preventDefault();
              check();
            }
          }}
        />
        <Button variant="primary" data-shortcut="check" onClick={check} disabled={value.trim() === '' || revealed}>
          {t('exercise.check')}
        </Button>
      </div>
      <p className={styles.choiceHint}>{t('exercise.predictHint')}</p>

      {state === 'correct' ? (
        <Callout tone="tip" title={t('exercise.exactlyRight')}>
          {step.explain ? (
            <Markdown text={loc(step.explain, mode)} className="" />
          ) : (
            <p>{t('exercise.outputMatches')}</p>
          )}
        </Callout>
      ) : null}

      {state === 'wrong' && !revealed ? (
        <Callout tone="warn" title={miss ? t('exercise.nearlyThere') : t('exercise.notQuite')}>
          <p>{t(missMessage(miss, mode))}</p>
        </Callout>
      ) : null}

      {revealed ? (
        <div className={styles.revealBox}>
          <strong>{t('exercise.theOutput')}</strong>
          <code>{step.answer}</code>
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

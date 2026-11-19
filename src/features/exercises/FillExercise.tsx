import { useMemo, useState } from 'react';
import type { FillStep } from '../../content/schema';
import { loc } from '../../content/text';
import { Button } from '../../ui/Button';
import { Callout } from '../../ui/primitives';
import { Markdown } from '../../ui/Markdown';
import type { ExerciseProps } from './common';
import styles from './exercises.module.css';
import { useT } from '../../i18n/t';

export function FillExercise({ step, mode, onResult, revealed }: ExerciseProps<FillStep>) {
  const parts = useMemo(() => step.template.split('___'), [step.template]);
  const blankCount = Math.max(parts.length - 1, step.answers.length);

  const [filled, setFilled] = useState<string[]>(() => Array.from({ length: blankCount }, () => ''));
  const [checked, setChecked] = useState(false);
  const [solved, setSolved] = useState(false);
  const { t } = useT();
  // A flag, not a sentence: the note is worded when shown (and follows a language switch).
  const [bankNote, setBankNote] = useState(false);

  const setBlank = (index: number, token: string) => {
    setFilled((current) => current.map((value, i) => (i === index ? token : value)));
    setChecked(false);
    setBankNote(false);
  };

  // A tapped token goes into the first empty blank. When every blank is
  // already filled it used to overwrite blank 1 without a word; now the
  // answers stay put and the learner is told how to change one.
  const placeToken = (token: string) => {
    const empty = filled.findIndex((value) => value === '');
    if (empty === -1) {
      setBankNote(true);
      return;
    }
    setBlank(empty, token);
  };

  const check = () => {
    const correct = step.answers.every((answer, index) => filled[index] === answer);
    setChecked(true);
    setSolved(correct);
    onResult({ correct, revealed: false });
  };

  const retry = () => {
    setChecked(false);
    setFilled(Array.from({ length: blankCount }, () => ''));
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.fillCode}>
        {parts.map((part, index) => (
          <span key={index}>
            {part}
            {index < blankCount ? (
              <select
                className={styles.blank}
                aria-label={t('exercise.blank', { n: index + 1 })}
                value={filled[index] ?? ''}
                onChange={(event) => setBlank(index, event.target.value)}
                disabled={solved || revealed}
                data-filled={Boolean(filled[index])}
                data-state={
                  !checked ? undefined : filled[index] === step.answers[index] ? 'correct' : 'wrong'
                }
              >
                <option value="">{t('exercise.blankEmpty')}</option>
                {step.bank.map((token, tokenIndex) => (
                  <option key={`${tokenIndex}-${token}`} value={token}>
                    {token}
                  </option>
                ))}
              </select>
            ) : null}
          </span>
        ))}
      </div>

      <div className={styles.bank} aria-hidden="true">
        {step.bank.map((token, tokenIndex) => (
          <button
            key={`${tokenIndex}-${token}`}
            type="button"
            className={styles.token}
            aria-pressed={filled.includes(token)}
            onClick={() => placeToken(token)}
            disabled={solved || revealed}
            tabIndex={-1}
          >
            {token}
          </button>
        ))}
      </div>

      {bankNote ? (
        <p className={styles.choiceHint} role="status">
          {t('exercise.bankFull')}
        </p>
      ) : null}

      {!solved ? (
        <div className={styles.actions}>
          <Button variant="primary" data-shortcut="check" onClick={check} disabled={filled.some((value) => value === '')}>
            {t('exercise.checkAnswer')}
          </Button>
          {checked && !solved ? <Button onClick={retry}>{t('exercise.tryAgain')}</Button> : null}
        </div>
      ) : null}

      {solved && step.explain ? (
        <Callout tone="tip" title={t('exercise.fillsNeatly')}>
          <Markdown text={loc(step.explain, mode)} className="" />
        </Callout>
      ) : null}

      {checked && !solved ? (
        <div className={styles.feedback}>{t('exercise.fillWrong')}</div>
      ) : null}

      {revealed ? (
        <Callout tone="why" title={t('exercise.answers')}>
          <code>{step.answers.join(', ')}</code>
        </Callout>
      ) : null}
    </div>
  );
}

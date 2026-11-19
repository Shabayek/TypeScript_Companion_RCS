import { useState } from 'react';
import type { CheckStep } from '../../content/schema';
import { loc } from '../../content/text';
import { Markdown } from '../../ui/Markdown';
import { Button } from '../../ui/Button';
import { Callout } from '../../ui/primitives';
import type { ExerciseProps } from './common';
import styles from './exercises.module.css';
import { useT } from '../../i18n/t';

export function CheckExercise({ step, mode, onResult, revealed }: ExerciseProps<CheckStep>) {
  const { t } = useT();
  const [selected, setSelected] = useState<readonly string[]>([]);
  const [checked, setChecked] = useState(false);
  const [solved, setSolved] = useState(false);

  const correctIds = step.choices.filter((choice) => choice.correct).map((choice) => choice.id);

  const isCorrect = (ids: readonly string[]) =>
    ids.length === correctIds.length && correctIds.every((id) => ids.includes(id));

  const toggle = (id: string) => {
    if (checked) return;
    if (step.multi) {
      setSelected((current) =>
        current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
      );
    } else {
      setSelected([id]);
    }
  };

  const check = () => {
    const correct = isCorrect(selected);
    setChecked(true);
    setSolved(correct);
    onResult({ correct, revealed: false });
  };

  const retry = () => {
    setChecked(false);
    setSelected([]);
  };

  const wrongPicks = step.choices.filter(
    (choice) => selected.includes(choice.id) && !choice.correct,
  );

  return (
    <div className={styles.wrap}>
      <fieldset className={styles.choiceList}>
        <legend className="sr-only">{loc(step.prompt, mode)}</legend>
        {step.choices.map((choice) => {
          const isSelected = selected.includes(choice.id);
          // After a check, only the learner's own picks are marked. Marking
          // the unpicked correct option used to hand over the answer after
          // one wrong try; it is shown once solved, or on "Show me the answer".
          const state = solved || revealed
            ? choice.correct
              ? 'correct'
              : isSelected
                ? 'wrong'
                : 'muted'
            : checked && isSelected
              ? choice.correct
                ? 'correct'
                : 'wrong'
              : undefined;
          const mark = !isSelected ? '' : state === 'wrong' ? '✗' : '✓';
          return (
            <button
              key={choice.id}
              type="button"
              className="option"
              data-state={state}
              data-selected={isSelected}
              aria-pressed={isSelected}
              onClick={() => toggle(choice.id)}
              disabled={solved}
            >
              <span className="option__mark" aria-hidden="true">
                {mark}
              </span>
              <span className="grow">
                <Markdown text={loc(choice.text, mode)} className="" />
                {checked && isSelected && state === 'wrong' ? (
                  <span className="sr-only">{` ${t('exercise.notThisOne')}`}</span>
                ) : null}
              </span>
            </button>
          );
        })}
      </fieldset>

      {!checked || revealed ? (
        <div className={styles.actions}>
          <Button variant="primary" data-shortcut="check" onClick={check} disabled={selected.length === 0 || solved}>
            {t('exercise.checkAnswer')}
          </Button>
          {step.multi ? <span className="muted">{t('exercise.chooseEvery')}</span> : null}
        </div>
      ) : null}

      {checked && solved && step.explain ? (
        <Callout tone="tip" title={t('exercise.thatsRight')}>
          <Markdown text={loc(step.explain, mode)} className="" />
        </Callout>
      ) : null}

      {checked && !solved ? (
        <div className={styles.wrap}>
          {wrongPicks.map((choice) =>
            choice.feedback ? (
              <div key={choice.id} className={styles.feedback}>
                <Markdown text={loc(choice.feedback, mode)} className="" />
              </div>
            ) : null,
          )}
          {wrongPicks.length === 0 ? (
            <div className={styles.feedback}>{t('exercise.missingRight')}</div>
          ) : null}
          <div className={styles.actions}>
            <Button onClick={retry}>{t('exercise.tryAgain')}</Button>
          </div>
        </div>
      ) : null}

      {revealed ? (
        <Callout tone="why" title={t('exercise.answer')}>
          <Markdown
            text={step.choices
              .filter((choice) => choice.correct)
              .map((choice) => `- ${loc(choice.text, mode)}`)
              .join('\n')}
            className=""
          />
        </Callout>
      ) : null}
    </div>
  );
}

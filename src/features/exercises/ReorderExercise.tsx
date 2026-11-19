import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import type { ReorderStep } from '../../content/schema';
import { loc, shuffleLines } from '../../content/text';
import { Button } from '../../ui/Button';
import { Callout } from '../../ui/primitives';
import { Markdown } from '../../ui/Markdown';
import type { ExerciseProps } from './common';
import styles from './exercises.module.css';
import { useT } from '../../i18n/t';

/** A line and a stable identity, so two identical lines (two `}`) stay distinct. */
interface Line {
  id: number;
  text: string;
}

type FocusTarget = { id: number; part: 'line' | 'up' | 'down' } | null;

/**
 * Shuffle line identities rather than texts. `shuffleLines` only sees texts, so
 * each shuffled text is matched back to an unused original position.
 */
function shuffledLines(step: ReorderStep): Line[] {
  const unused = step.lines.map((text, id) => ({ id, text }));
  return shuffleLines(step.lines, step.id).map((text) => {
    const index = unused.findIndex((line) => line.text === text);
    const [line] = unused.splice(index, 1);
    return line ?? { id: -1, text };
  });
}

export function ReorderExercise({ step, mode, onResult, revealed }: ExerciseProps<ReorderStep>) {
  const { t } = useT();
  const initial = useMemo(() => shuffledLines(step), [step]);
  const [lines, setLines] = useState<Line[]>(initial);
  const [checked, setChecked] = useState(false);
  const [solved, setSolved] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const [focusTarget, setFocusTarget] = useState<FocusTarget>(null);
  const elements = useRef(new Map<string, HTMLElement>());

  // Moving a line moves its element in the page, which drops keyboard focus.
  // Put focus back on the same line (or arrow button) so a learner can keep
  // pressing ↑ / ↓.
  useEffect(() => {
    if (!focusTarget) return;
    elements.current.get(`${focusTarget.id}:${focusTarget.part}`)?.focus();
  }, [focusTarget, lines]);

  const register = (id: number, part: 'line' | 'up' | 'down') => (element: HTMLElement | null) => {
    const key = `${id}:${part}`;
    if (element) elements.current.set(key, element);
    else elements.current.delete(key);
  };

  const move = (index: number, direction: -1 | 1, part: 'line' | 'up' | 'down') => {
    const target = index + direction;
    if (solved || target < 0 || target >= lines.length) return;
    const moving = lines[index];
    const other = lines[target];
    if (!moving || !other) return;

    const next = [...lines];
    next[index] = other;
    next[target] = moving;
    setLines(next);
    setChecked(false);
    setAnnouncement(t('exercise.moved', { line: moving.text, position: target + 1, total: lines.length }));
    // An arrow button that can no longer move in its direction is disabled;
    // keep focus on the line instead.
    const stillUsable =
      part === 'line' || (part === 'up' ? target > 0 : target < lines.length - 1);
    setFocusTarget({ id: moving.id, part: stillUsable ? part : 'line' });
  };

  const onLineKeyDown = (index: number) => (event: KeyboardEvent<HTMLLIElement>) => {
    if (event.target !== event.currentTarget) return;
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      move(index, -1, 'line');
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      move(index, 1, 'line');
    }
  };

  const check = () => {
    const correct = lines.every((line, index) => line.text === step.lines[index]);
    setChecked(true);
    setSolved(correct);
    onResult({ correct, revealed: false });
  };

  return (
    <div className={styles.wrap}>
      <ol className={styles.reorderList} aria-label={t('exercise.linesOrder')}>
        {lines.map((line, index) => (
          // A keyboard shortcut on the line itself (Tab to it, press ↑ / ↓)
          // for sighted keyboard users. Screen-reader users get the labelled
          // "Move line N up/down" buttons inside the same item, and
          // aria-keyshortcuts announces the keys.
          // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
          <li
            key={line.id}
            ref={register(line.id, 'line')}
            className={styles.reorderItem}
            tabIndex={solved ? -1 : 0}
            aria-keyshortcuts="ArrowUp ArrowDown"
            onKeyDown={onLineKeyDown(index)}
            data-state={!checked ? undefined : line.text === step.lines[index] ? 'correct' : 'wrong'}
          >
            <span className={styles.grip} aria-hidden="true">
              ⠿
            </span>
            <code className={styles.lineText}>{line.text}</code>
            <span className={styles.moveBtns}>
              <button
                type="button"
                ref={register(line.id, 'up')}
                className={styles.moveBtn}
                onClick={() => move(index, -1, 'up')}
                disabled={index === 0 || solved}
                aria-label={t('exercise.moveUp', { n: index + 1 })}
              >
                ↑
              </button>
              <button
                type="button"
                ref={register(line.id, 'down')}
                className={styles.moveBtn}
                onClick={() => move(index, 1, 'down')}
                disabled={index === lines.length - 1 || solved}
                aria-label={t('exercise.moveDown', { n: index + 1 })}
              >
                ↓
              </button>
            </span>
          </li>
        ))}
      </ol>
      <p className="sr-only" role="status" aria-live="polite">
        {announcement}
      </p>

      {!solved ? (
        <div className={styles.actions}>
          <Button variant="primary" data-shortcut="check" onClick={check}>
            {t('exercise.checkOrder')}
          </Button>
          <span className="muted">{t('exercise.reorderHint')}</span>
        </div>
      ) : null}

      {solved && step.explain ? (
        <Callout tone="tip" title={t('exercise.runsInOrder')}>
          <Markdown text={loc(step.explain, mode)} className="" />
        </Callout>
      ) : null}

      {checked && !solved ? (
        <div className={styles.feedback}>{t('exercise.reorderWrong')}</div>
      ) : null}

      {revealed ? (
        <Callout tone="why" title={t('exercise.correctOrder')}>
          <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{step.lines.join('\n')}</pre>
        </Callout>
      ) : null}
    </div>
  );
}

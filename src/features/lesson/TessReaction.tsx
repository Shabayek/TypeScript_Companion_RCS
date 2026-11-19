import { useMemo } from 'react';
import type { AgeMode } from '../../content/schema';
import { useT, type TFunction } from '../../i18n/t';
import { Burst } from '../../ui/Confetti';
import { TessSays } from '../motivation/TessSays';
import styles from './lesson.module.css';

type Key = Parameters<TFunction>[0];
const RIGHT: readonly Key[] = ['tess.right1', 'tess.right2', 'tess.right3', 'tess.right4'];
const WRONG: readonly Key[] = ['tess.wrong1', 'tess.wrong2', 'tess.wrong3'];
const STORY_RIGHT: readonly Key[] = ['tess.storyRight1', 'tess.storyRight2'];
const STORY_WRONG: readonly Key[] = ['tess.storyWrong1', 'tess.storyWrong2'];

/**
 * Tess reacts to an answer: a cheer and a little burst when it is right, a
 * kind nudge when it is not. An echo of the exercise's own feedback, which a
 * screen reader has already announced, so it is hidden from assistive tech.
 */
export function TessReaction({ correct, attempt, mode }: { correct: boolean; attempt: number; mode: AgeMode }) {
  const { t } = useT();
  const line = useMemo(() => {
    const pool = mode === 'story' ? (correct ? STORY_RIGHT : STORY_WRONG) : correct ? RIGHT : WRONG;
    return pool[attempt % pool.length] as Key;
  }, [correct, attempt, mode]);

  return (
    <div className={styles.reaction} data-correct={correct}>
      {correct ? <Burst /> : null}
      <TessSays pose={correct ? 'cheering' : 'thinking'} size={mode === 'story' ? 52 : 40} hidden>
        {t(line)}
      </TessSays>
    </div>
  );
}

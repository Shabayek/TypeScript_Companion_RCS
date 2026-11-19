import { useT } from '../../i18n/t';
import { goalToday, levelFor, streakInfo, xpFromState } from '../../storage/motivation';
import type { ProgressState } from '../../storage/types';
import { Card, ProgressRing } from '../../ui/primitives';
import { LevelBar } from './LevelBar';
import { TessSays } from './TessSays';
import styles from './motivation.module.css';

function Flame({ lit }: { lit: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" focusable="false" className={styles.flame} data-lit={lit}>
      <path d="M12 2c1 4 5 6 5 11a5 5 0 0 1-10 0c0-2 1-4 2-5 0 2 1 3 2 3 0-3-1-6 1-9Z" />
    </svg>
  );
}

/**
 * Today at a glance: the daily goal, the gentle streak, and the level. Kind by
 * design: a break is met with "welcome back", never with a lost streak.
 * Not shown in Quiet mode.
 */
export function TodayCard({ state, now = Date.now() }: { state: ProgressState; now?: number }) {
  const { t } = useT();
  const goal = goalToday(state, now);
  const streak = streakInfo(state.activity, now);
  const level = levelFor(xpFromState(state));
  const story = state.settings.mode === 'story';

  const streakNote = streak.returning
    ? t('motivation.welcomeBack')
    : streak.activeToday
      ? t('motivation.streakKept')
      : t('motivation.streakToday');

  return (
    <Card className={styles.today} data-mode={state.settings.mode}>
      <h2 className={styles.todayTitle}>{t('motivation.today')}</h2>
      <div className={styles.todayGrid}>
        <div className={styles.goal}>
          <ProgressRing value={goal.progress} size={story ? 68 : 56} label={goal.met ? '✓' : `${goal.minutesToday}`} />
          <div>
            <span className={styles.statLabel}>{t('motivation.goalLabel')}</span>
            <strong className={styles.statValue}>
              {goal.met ? t('motivation.goalMet') : t('motivation.goalProgress', { minutes: goal.minutesToday, goal: goal.goalMinutes })}
            </strong>
          </div>
        </div>
        <div className={styles.streak}>
          <Flame lit={streak.activeToday} />
          <div>
            <strong className={styles.statValue}>
              {streak.current > 0 ? t('motivation.streak', { count: streak.current }) : t('motivation.streakNone')}
            </strong>
            <span className={styles.statLabel}>
              {streakNote}
              {streak.current > 0 && streak.restDays > 0 ? ` ${t('motivation.restDays', { count: streak.restDays })}.` : ''}
            </span>
          </div>
        </div>
      </div>
      <LevelBar info={level} compact />
      {story ? (
        <TessSays pose={goal.met ? 'cheering' : streak.returning ? 'waving' : 'idle'} size={52}>
          {goal.met ? t('motivation.storyDone') : t('motivation.storyNudge', { goal: goal.goalMinutes })}
        </TessSays>
      ) : null}
    </Card>
  );
}

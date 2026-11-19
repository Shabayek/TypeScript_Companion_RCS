import { useT } from '../../i18n/t';
import { formatDate } from '../../i18n/messages';
import { dayKey } from '../../storage/model';
import type { ProgressState } from '../../storage/types';
import styles from './progress.module.css';

/**
 * The last seven days as bars, with the daily goal as a line. The numbers are
 * in the text (one list item per day); the bars are decoration.
 */
export function WeekChart({ state, now = Date.now() }: { state: ProgressState; now?: number }) {
  const { t, language } = useT();
  const goal = state.settings.dailyGoal;
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(now);
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() - (6 - i));
    const minutes = Math.floor((state.activity[dayKey(date)]?.ms ?? 0) / 60_000);
    return { date, minutes };
  });
  const top = Math.max(goal, ...days.map((day) => day.minutes)) || 1;

  return (
    <ol className={styles.week} style={{ ['--goal' as string]: `${(goal / top) * 100}%` }}>
      {days.map(({ date, minutes }) => {
        const name = formatDate(date, language, { weekday: 'short' });
        return (
          <li key={date.toISOString()} className={styles.day} data-met={minutes >= goal}>
            <span className={styles.dayBar} aria-hidden="true">
              <span style={{ height: `${Math.min(100, (minutes / top) * 100)}%` }} />
            </span>
            <span className={styles.dayName}>
              {name}
              <span className="sr-only">{`: ${t('lesson.minutes', { count: minutes })}`}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

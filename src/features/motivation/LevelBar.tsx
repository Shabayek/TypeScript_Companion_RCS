import { useT } from '../../i18n/t';
import type { LevelInfo } from '../../storage/motivation';
import { levelTitle } from './levels';
import styles from './motivation.module.css';

/** "Level 3 · Value Wrangler" with a bar to the next level. */
export function LevelBar({ info, compact = false }: { info: LevelInfo; compact?: boolean }) {
  const { t } = useT();
  const percent = Math.round(info.progress * 100);
  const title = levelTitle(info.level, t);
  return (
    <div className={styles.level} data-compact={compact}>
      <div className={styles.levelTop}>
        <span className={styles.levelName}>
          <span className={styles.levelNumber}>{t('motivation.level', { level: info.level })}</span> · {title}
        </span>
        <span className={styles.levelXp}>{t('motivation.xp', { count: info.xp })}</span>
      </div>
      <div
        className={styles.bar}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-label={t('motivation.xpToNext', { count: info.next - info.xp, level: info.level + 1 })}
      >
        <span className={styles.barFill} style={{ width: `${percent}%` }} />
      </div>
      {compact ? null : (
        <span className={styles.levelNext}>{t('motivation.xpToNext', { count: info.next - info.xp, level: info.level + 1 })}</span>
      )}
    </div>
  );
}

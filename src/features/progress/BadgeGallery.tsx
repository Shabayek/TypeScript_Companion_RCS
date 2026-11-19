import { useT } from '../../i18n/t';
import { BADGE_GROUPS, BADGE_LIST, badgeContext, type BadgeGroup } from '../../storage/badges';
import type { ProgressState } from '../../storage/types';
import { badgeKeyDescription, badgeKeyTitle } from '../motivation/levels';
import styles from './progress.module.css';
import { useCourse } from '../../content/useCourse';

const GROUP_KEY: Record<BadgeGroup, 'badges.groupMilestone' | 'badges.groupModule' | 'badges.groupSkill' | 'badges.groupExplorer'> = {
  milestone: 'badges.groupMilestone',
  module: 'badges.groupModule',
  skill: 'badges.groupSkill',
  explorer: 'badges.groupExplorer',
};

/**
 * Every badge, grouped. Earned ones shine; the rest show how far along the
 * learner is ("3 of 10"), so each one reads as an invitation, not a gap.
 */
export function BadgeGallery({ state }: { state: ProgressState }) {
  const { t } = useT();
  const course = useCourse();
  const earned = new Set(state.badges);
  const context = badgeContext(state);

  return (
    <div className={styles.gallery}>
      {BADGE_GROUPS.map((group) => {
        const badges = BADGE_LIST.filter((badge) => badge.group === group);
        if (badges.length === 0) return null;
        const headingId = `badges-${group}`;
        return (
          <section key={group} aria-labelledby={headingId}>
            <h3 id={headingId} className={styles.h3}>
              {t(GROUP_KEY[group])}
              <span className={styles.groupCount}>
                {' '}
                {badges.filter((badge) => earned.has(badge.id)).length}/{badges.length}
              </span>
            </h3>
            <ul className={styles.badgeGrid}>
              {badges.map((badge) => {
                const has = earned.has(badge.id);
                const { value, target } = badge.progress(state, context);
                return (
                  <li
                    key={badge.id}
                    className={styles.badgeItem}
                    data-earned={has}
                    data-accent={badge.module?.accent}
                  >
                    <span className={styles.badgeMark} aria-hidden="true">
                      {badge.icon}
                    </span>
                    <span className={styles.badgeText}>
                      <strong>{badgeKeyTitle(badge.id, t, badge.module ? course.moduleTitle(badge.module) : undefined)}</strong>
                      <span className={styles.badgeDesc}>
                        {badgeKeyDescription(badge.id, t, badge.module ? course.moduleTagline(badge.module) : undefined)}
                      </span>
                      {!has && target > 1 ? (
                        <span className={styles.badgeProgress}>
                          <span className={styles.badgeBar} aria-hidden="true">
                            <span style={{ width: `${Math.round((value / target) * 100)}%` }} />
                          </span>
                          {t('badges.progress', { value, target })}
                        </span>
                      ) : null}
                    </span>
                    <span className="sr-only">{has ? t('badges.earned') : t('badges.notEarned')}</span>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

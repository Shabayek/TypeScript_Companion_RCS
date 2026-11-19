import { useEffect } from 'react';
import { useT, type TFunction } from '../../i18n/t';
import { useCourse } from '../../content/useCourse';
import type { CourseModule } from '../../content/schema';
import { BADGE_BY_ID } from '../../storage/badges';
import { useJourney, type Celebration } from '../../storage/store';
import { Mascot } from '../../ui/Mascot';
import { badgeKeyTitle, levelTitle } from './levels';
import { useSound } from './useFeedback';

export function celebrationText(
  celebration: Celebration,
  t: TFunction,
  moduleTitle: (module: CourseModule) => string = (module) => module.title,
): string {
  switch (celebration.kind) {
    case 'badge': {
      const module = BADGE_BY_ID.get(celebration.id)?.module;
      return t('celebrate.badge', { title: badgeKeyTitle(celebration.id, t, module ? moduleTitle(module) : undefined) });
    }
    case 'level':
      return t('celebrate.level', { level: celebration.level, title: levelTitle(celebration.level, t) });
    case 'goal':
      return t('celebrate.goal', { minutes: celebration.minutes });
    case 'streak':
      return t('celebrate.streak', { days: celebration.days });
  }
}

const SHOWN_MS = 4000;

/**
 * Badges, levels, goals and streak milestones earned anywhere in the app, one
 * at a time, as a short toast. Finishing a lesson celebrates on its own
 * summary screen instead. Nothing is queued in Quiet mode.
 */
export function CelebrationToast() {
  const { t } = useT();
  const course = useCourse();
  const celebration = useJourney((store) => store.celebrations[0]);
  const dismiss = useJourney((store) => store.dismissCelebration);
  const sound = useSound();

  useEffect(() => {
    if (!celebration) return;
    sound('celebrate');
    const timer = setTimeout(dismiss, SHOWN_MS);
    return () => clearTimeout(timer);
    // Once per celebration.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [celebration]);

  if (!celebration) return null;
  return (
    <div className="toast toast--celebrate" role="status">
      <Mascot pose="cheering" size={30} />
      <span>{celebrationText(celebration, t, course.moduleTitle)}</span>
    </div>
  );
}

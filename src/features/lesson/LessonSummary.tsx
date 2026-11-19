import { Link } from 'react-router-dom';
import { getLessonMeta, moduleOfLesson } from '../../content/curriculum';
import type { AgeMode, Lesson } from '../../content/schema';
import { locList } from '../../content/text';
import { useT } from '../../i18n/t';
import { BADGE_BY_ID } from '../../storage/badges';
import { levelFor } from '../../storage/motivation';
import type { Celebration } from '../../storage/store';
import { Button, LinkButton } from '../../ui/Button';
import { Confetti } from '../../ui/Confetti';
import { InlineMarkdown } from '../../ui/Markdown';
import { Mascot } from '../../ui/Mascot';
import { Badge, Card } from '../../ui/primitives';
import { celebrationText } from '../motivation/CelebrationToast';
import { LevelBar } from '../motivation/LevelBar';
import { badgeKeyTitle, levelTitle } from '../motivation/levels';
import styles from './lesson.module.css';
import { useCourse } from '../../content/useCourse';

/**
 * The end of a lesson: what it taught, what it earned, and where to go next.
 * Finishing a whole module gets the bigger celebration. Quiet mode keeps the
 * recap and the way forward, and leaves out points and confetti.
 */
export function LessonSummary({
  lesson,
  mode,
  quiet,
  xpBefore,
  xpAfter,
  badges,
  celebrations,
  nextId,
  bonusCount = 0,
  onBonus,
}: {
  lesson: Lesson;
  mode: AgeMode;
  quiet: boolean;
  xpBefore: number;
  xpAfter: number;
  badges: readonly string[];
  celebrations: readonly Celebration[];
  nextId: string | undefined;
  /** "Go further" steps this lesson offers, started with `onBonus`. */
  bonusCount?: number;
  onBonus?: () => void;
}) {
  const { t } = useT();
  const course = useCourse();
  const module = moduleOfLesson(lesson.id);
  const badgeTitle = (id: string) => {
    const badgeModule = BADGE_BY_ID.get(id)?.module;
    return badgeKeyTitle(id, t, badgeModule ? course.moduleTitle(badgeModule) : undefined);
  };
  const moduleDone = module !== undefined && badges.includes(`module:${module.id}`);
  const recap = locList(lesson.recap, mode);
  const levelUp = celebrations.find((item) => item.kind === 'level');
  const moments = celebrations.filter((item) => item.kind === 'goal' || item.kind === 'streak');
  const skills = (getLessonMeta(lesson.id)?.concepts ?? [])
    .map((id) => course.term(id))
    .filter((entry) => entry !== undefined);

  return (
    <div className={styles.page} data-accent={module?.accent}>
      <Card pad="lg" className={styles.celebration} data-module-done={moduleDone}>
        {quiet ? null : <Confetti pieces={moduleDone ? 24 : 12} accent={moduleDone ? 'var(--module-accent)' : undefined} />}
        <Mascot pose="cheering" size={moduleDone ? 132 : 120} />
        <h1 className={styles.doneTitle}>{moduleDone ? t('summary.moduleDone') : t('summary.lessonDone')}</h1>
        <p className="muted" style={{ margin: 0 }}>
          {moduleDone && module
            ? t('summary.moduleDoneLede', { title: course.moduleTitle(module) })
            : t(mode === 'story' ? 'player.niceGoing' : 'player.done', { title: lesson.title[mode] })}
        </p>

        {quiet ? null : (
          <div className={styles.summaryXp}>
            <strong className={styles.xpGain}>{t('summary.xpEarned', { count: Math.max(0, xpAfter - xpBefore) })}</strong>
            <LevelBar info={levelFor(xpAfter)} compact />
            {levelUp && levelUp.kind === 'level' ? (
              <p className={styles.levelUp}>{t('summary.levelUp', { title: levelTitle(levelUp.level, t) })}</p>
            ) : null}
            {moments.map((moment) => (
              <p key={moment.kind} className={styles.moment}>
                {celebrationText(moment, t)}
              </p>
            ))}
          </div>
        )}

        <ul className={styles.recapList} style={{ textAlign: 'start', maxWidth: '46ch' }}>
          {recap.map((point, i) => (
            <li key={i}>
              <InlineMarkdown text={point} />
            </li>
          ))}
        </ul>

        {skills.length > 0 ? (
          <div className={styles.skills}>
            <p className={styles.introLabel}>{t('summary.skills')}</p>
            <ul className={styles.skillList}>
              {skills.map((entry) => (
                <li key={entry.id}>
                  <Link to={`/glossary?term=${entry.id}`} className={styles.skill}>
                    {entry.term}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {badges.length > 0 ? (
          <div className={styles.badgeRow} aria-label={t('summary.newBadges')} role="group">
            {badges.map((id) => (
              <Badge key={id} tone="warm">
                {`${BADGE_BY_ID.get(id)?.icon ?? '★'} ${badgeTitle(id)}`}
              </Badge>
            ))}
          </div>
        ) : null}

        <div className="row" style={{ justifyContent: 'center' }}>
          {nextId ? (
            <LinkButton to={`/learn/${nextId}`} variant="primary" size="lg">
              {t('player.nextLesson')}
            </LinkButton>
          ) : (
            <LinkButton to="/progress" variant="primary" size="lg">
              {t('player.seeJourney')}
            </LinkButton>
          )}
          <LinkButton to="/" variant="ghost">
            {t('player.journeyMap')}
          </LinkButton>
        </div>
      </Card>

      <Card className={styles.goFurther}>
        <strong>{t('summary.goFurther')}</strong>
        {bonusCount > 0 && onBonus ? (
          <>
            <p className="muted" style={{ margin: 0 }}>
              {t('bonus.summaryBody', { count: bonusCount })}
            </p>
            <div className="row">
              <Button variant="default" onClick={onBonus}>
                {t('bonus.start', { count: bonusCount })}
              </Button>
            </div>
          </>
        ) : (
          <p className="muted" style={{ margin: 0 }}>
            {t('summary.goFurtherBody')}
          </p>
        )}
        <Link to="/playground">{t('summary.openPlayground')}</Link>
      </Card>
    </div>
  );
}

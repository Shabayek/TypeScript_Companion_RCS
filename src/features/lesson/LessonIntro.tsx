import { Link } from 'react-router-dom';
import { getLessonMeta } from '../../content/curriculum';
import { isGradedStep, requiredSteps, type AgeMode, type Lesson, type LessonMeta } from '../../content/schema';
import { locList } from '../../content/text';
import { useT } from '../../i18n/t';
import { Button } from '../../ui/Button';
import { InlineMarkdown } from '../../ui/Markdown';
import { Mascot } from '../../ui/Mascot';
import styles from './lesson.module.css';
import { useCourse } from '../../content/useCourse';

/**
 * Above the first step of a lesson not yet worked in: what it is about, how
 * long it takes, and — when the learner jumped ahead — the unfinished lessons
 * it builds on, as a note rather than a barrier.
 */
export function LessonIntro({
  lesson,
  mode,
  buildsOn,
  onContinue,
}: {
  lesson: Lesson;
  mode: AgeMode;
  buildsOn: readonly LessonMeta[];
  onContinue: () => void;
}) {
  const { t } = useT();
  const course = useCourse();
  const objectives = lesson.objectives ? locList(lesson.objectives, mode) : [];
  const graded = requiredSteps(lesson.steps).filter(isGradedStep).length;
  const ideas = (getLessonMeta(lesson.id)?.concepts ?? [])
    .map((id) => course.term(id))
    .filter((entry) => entry !== undefined)
    .slice(0, 5);

  return (
    <section className={styles.intro} aria-label={mode === 'story' ? t('intro.storyTitle') : t('intro.title')}>
      <div className={styles.introHead}>
        {mode === 'story' ? <Mascot pose="curious" size={44} /> : null}
        <div>
          <h2 className={styles.introTitle}>{mode === 'story' ? t('intro.storyTitle') : t('intro.title')}</h2>
          <p className={styles.introMeta}>{t('intro.meta', { minutes: lesson.estMinutes, steps: graded })}</p>
        </div>
      </div>

      {objectives.length > 0 ? (
        <>
          <p className={styles.introLabel}>{t('intro.objectives')}</p>
          <ul className={styles.introList}>
            {objectives.map((point, i) => (
              <li key={i}>
                <InlineMarkdown text={point} />
              </li>
            ))}
          </ul>
        </>
      ) : ideas.length > 0 ? (
        <p className={styles.introIdeas}>
          <span className={styles.introLabel}>{t('intro.keyIdeas')}: </span>
          {ideas.map((entry, i) => (
            <span key={entry.id}>
              {i > 0 ? ', ' : ''}
              <Link to={`/glossary?term=${entry.id}`}>{entry.term}</Link>
            </span>
          ))}
        </p>
      ) : null}

      {buildsOn.length > 0 ? (
        <div className={styles.introBuildsOn} role="note">
          <p className={styles.introLabel}>{t('buildsOn.title')}</p>
          <ul className={styles.buildsOnList}>
            {buildsOn.map((item) => (
              <li key={item.id}>
                <Link to={`/learn/${item.id}`}>
                  <bdi>{course.lessonTitle(item, mode)}</bdi>
                </Link>
              </li>
            ))}
          </ul>
          <p className={styles.introBody}>{t('buildsOn.body')}</p>
          <Button size="sm" variant="ghost" onClick={onContinue}>
            {t('buildsOn.continue')}
          </Button>
        </div>
      ) : null}
    </section>
  );
}

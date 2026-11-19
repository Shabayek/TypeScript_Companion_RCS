import { COMPILER_FLAGS, type AgeMode, type CompilerFlags, type Lesson, type Step } from '../../content/schema';
import { figureFor, loc, locList } from '../../content/text';
import { Markdown, InlineMarkdown } from '../../ui/Markdown';
import { CodeBlock } from '../../ui/CodeBlock';
import { Callout } from '../../ui/primitives';
import { Figure } from '../../ui/Figures';
import { CheckExercise } from '../exercises/CheckExercise';
import { PredictExercise } from '../exercises/PredictExercise';
import { FillExercise } from '../exercises/FillExercise';
import { ReorderExercise } from '../exercises/ReorderExercise';
import { PredictTypeExercise } from '../exercises/PredictTypeExercise';
import { LazyCodeExercise, LazyGamePanel, LazyTryItPanel } from '../exercises/lazyPanels';
import styles from './lesson.module.css';
import { useT } from '../../i18n/t';

/** The compiler settings a step changes, each with what it means. */
export function FlagsNote({ flags }: { flags: CompilerFlags }) {
  const { t } = useT();
  const set = COMPILER_FLAGS.filter((flag) => typeof flags[flag] === 'boolean');
  if (set.length === 0) return null;
  return (
    <div className={styles.flagsNote} data-testid="compiler-flags">
      <strong>{t('flags.title')}</strong>
      <ul>
        {set.map((flag) => (
          <li key={flag}>
            <code dir="ltr">
              {flag}: {String(flags[flag])}
            </code>{' '}
            <InlineMarkdown ui text={flags[flag] ? t(`flags.${flag}`) : t('flags.off')} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function EditorFallback() {
  const { t } = useT();
  return (
    <div className={styles.editorFallback} role="status">
      {t('player.loadingEditor')}
    </div>
  );
}

export function StepView({
  lesson,
  step,
  mode,
  revealed,
  onResult,
  onReveal,
  draftKey = `${lesson.id}:${step.id}`,
  variant,
}: {
  lesson: Lesson;
  step: Step;
  mode: AgeMode;
  revealed: boolean;
  onResult: (result: { correct: boolean; revealed: boolean }) => void;
  onReveal: () => void;
  /** Where code drafts are kept; `null` keeps none (practice starts fresh). */
  draftKey?: string | null;
  /**
   * For a step written for newer phones: `modern` when it is shown as
   * written, `classic` when this is its Classic alternative.
   */
  variant?: 'modern' | 'classic' | undefined;
}) {
  const { t } = useT();
  const shared = { step, mode, onResult, revealed, onReveal } as const;

  return (
    <article className={styles.stage} aria-labelledby={`step-title-${step.id}`}>
      {step.bonus || variant ? (
        <div className={styles.stepTags}>
          {step.bonus ? <span className={styles.stepTag}>{t('bonus.tag')}</span> : null}
          {variant === 'modern' ? <span className={styles.stepTag}>{t('engine.stepModern')}</span> : null}
          {variant === 'classic' ? <span className={styles.stepTag}>{t('engine.stepClassic')}</span> : null}
        </div>
      ) : null}
      <h2 id={`step-title-${step.id}`} className={styles.prompt}>
        <InlineMarkdown text={loc(step.prompt, mode)} />
      </h2>

      {step.kind === 'read' ? (
        <div className="stack">
          <Markdown text={loc(step.body, mode)} inspect {...(step.compilerFlags ? { flags: step.compilerFlags } : {})} />
          {step.figure ? <Figure id={figureFor(step.figure, mode)} /> : null}
          {step.callout ? (
            <Callout tone={step.callout.tone} title={step.callout.title}>
              <Markdown text={loc(step.callout.body, mode)} className="" />
            </Callout>
          ) : null}
        </div>
      ) : null}

      {step.kind === 'compare' ? (
        <div className="stack">
          {step.body ? <Markdown text={loc(step.body, mode)} /> : null}
          <div className={styles.compare}>
            {[step.left, step.right].map((panel, index) => (
              <div key={index} className={styles.comparePanel}>
                <CodeBlock code={panel.code} label={panel.title} variant="light" copy={false} inspect />
                {panel.caption ? (
                  <p className={styles.caption}>
                    <InlineMarkdown text={loc(panel.caption, mode)} />
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {step.compilerFlags ? <FlagsNote flags={step.compilerFlags} /> : null}

      {step.kind === 'check' ? <CheckExercise {...shared} step={step} /> : null}
      {step.kind === 'predict' ? <PredictExercise {...shared} step={step} /> : null}
      {step.kind === 'fill' ? <FillExercise {...shared} step={step} /> : null}
      {step.kind === 'reorder' ? <ReorderExercise {...shared} step={step} /> : null}
      {step.kind === 'predictType' ? <PredictTypeExercise {...shared} step={step} /> : null}

      {step.kind === 'fix' || step.kind === 'write' || step.kind === 'types' ? (
        <LazyCodeExercise
          {...shared}
          step={step}
          {...(draftKey ? { draftKey } : {})}
          fallback={<EditorFallback />}
        />
      ) : null}

      {step.kind === 'tryIt' ? (
        <div className="stack">
          <LazyTryItPanel
            initialCode={step.code}
            draftKey={`${lesson.id}:${step.id}`}
            {...(step.compilerFlags ? { flags: step.compilerFlags } : {})}
            fallback={<EditorFallback />}
          />
          <p className={styles.caption}>{t('player.notGraded')}</p>
        </div>
      ) : null}

      {step.kind === 'play' ? (
        <LazyGamePanel lesson={lesson} step={step} mode={mode} fallback={<EditorFallback />} />
      ) : null}

      {step.kind === 'recap' ? (
        <div className="stack">
          <Markdown ui text={t('player.shortVersion', { title: lesson.title[mode] })} />
          <ul className={styles.recapList}>
            {locList(step.points, mode).map((point, index) => (
              <li key={index}>
                <InlineMarkdown text={point} />
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </article>
  );
}

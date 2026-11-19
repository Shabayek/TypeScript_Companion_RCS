import { useEffect, useState } from 'react';
import { COMPILER_FLAGS, TRACKS, type CompilerFlag, type CompilerFlags } from '../../content/schema';
import type { GalleryExample } from '../../content/gallery';
import { InlineMarkdown } from '../../ui/Markdown';
import { Card } from '../../ui/primitives';
import { LazyTryItPanel } from '../exercises/lazyPanels';
import { useJourney } from '../../storage/store';
import { useCheckShortcut } from '../lesson/useLessonShortcuts';
import styles from './playground.module.css';
import { useT } from '../../i18n/t';
import type { MessageKey } from '../../i18n/messages';

/**
 * `id` keys the learner's saved draft and must never change (it is the
 * English title the drafts were first saved under); `title` is worded in the
 * learner's language.
 */
const SAMPLES = [
  {
    id: 'Say hello',
    title: 'playground.sayHello',
    code: 'console.log("Hello, world!");',
  },
  {
    id: 'Numbers and text',
    title: 'playground.numbersText',
    code: [
      'const name = "Ada";',
      'const price = 4.5;',
      'const quantity = 3;',
      '',
      'console.log(`${name} owes ${price * quantity}`);',
      'console.log("Half is", price / 2);',
    ].join('\n'),
  },
  {
    id: 'A tiny function',
    title: 'playground.tinyFunction',
    code: [
      'function describeScore(score: number): string {',
      '  if (score >= 90) return "excellent";',
      '  if (score >= 60) return "solid";',
      '  return "keep going";',
      '}',
      '',
      'console.log(describeScore(95));',
      'console.log(describeScore(72));',
      'console.log(describeScore(12));',
    ].join('\n'),
  },
  {
    id: 'Lists and objects',
    title: 'playground.listsObjects',
    code: [
      'const people = [',
      '  { name: "Ada", age: 36 },',
      '  { name: "Sam", age: 17 },',
      '  { name: "Bo", age: 24 },',
      '];',
      '',
      'console.log(people.map(person => person.name));',
      'console.log(people.filter(person => person.age >= 18));',
      'console.log(people.find(person => person.name === "Sam"));',
    ].join('\n'),
  },
] as const satisfies readonly { id: string; title: MessageKey; code: string }[];

/** The gallery is a separate download, fetched when the Playground opens. */
function useGallery(): readonly GalleryExample[] {
  const [gallery, setGallery] = useState<readonly GalleryExample[]>([]);
  useEffect(() => {
    let alive = true;
    import('../../content/gallery').then(
      (module) => {
        if (alive) setGallery(module.GALLERY);
      },
      () => undefined,
    );
    return () => {
      alive = false;
    };
  }, []);
  return gallery;
}

/** Flags a learner can try; `strictNullChecks` and `noImplicitAny` are part of `strict` and switch off instead. */
const TOGGLED_ON: readonly CompilerFlag[] = COMPILER_FLAGS.filter((flag) => flag !== 'strictNullChecks' && flag !== 'noImplicitAny');

export function PlaygroundPage() {
  const { t } = useT();
  const count = useJourney((store) => store.count);
  // Ctrl/⌘+Enter runs the code, as in lessons.
  useCheckShortcut();
  const [sample, setSample] = useState(0);
  const [example, setExample] = useState<string | null>(null);
  const [flags, setFlags] = useState<CompilerFlags>({});
  const gallery = useGallery();
  const picked = example ? gallery.find((item) => item.id === example) : undefined;
  const current = picked
    ? { id: `gallery:${picked.id}`, code: picked.code }
    : (SAMPLES[sample] ?? SAMPLES[0]);
  const flagCount = Object.values(flags).filter(Boolean).length;

  return (
    <div className={styles.page}>
      <header>
        <p className="eyebrow">{t('playground.eyebrow')}</p>
        <h1 className={styles.title}>{t('playground.title')}</h1>
        <p className="muted">{t('playground.lede')}</p>
      </header>

      <div className={styles.samples} role="group" aria-label={t('playground.samples')}>
        {SAMPLES.map((item, index) => (
          <button
            key={item.id}
            type="button"
            className={styles.sample}
            data-selected={!picked && sample === index}
            aria-pressed={!picked && sample === index}
            onClick={() => {
              setSample(index);
              setExample(null);
            }}
          >
            {t(item.title)}
          </button>
        ))}
      </div>

      {gallery.length > 0 ? (
        <label className={styles.gallery}>
          <span className={styles.galleryLabel}>{t('playground.gallery')}</span>
          <select
            className="input"
            value={example ?? ''}
            onChange={(event) => setExample(event.target.value === '' ? null : event.target.value)}
          >
            <option value="">{t('playground.galleryPick')}</option>
            {TRACKS.map((track) => (
              <optgroup key={track} label={t(`tracks.${track}`)}>
                {gallery
                  .filter((item) => item.track === track)
                  .map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.title}
                    </option>
                  ))}
              </optgroup>
            ))}
          </select>
        </label>
      ) : null}

      <details className={styles.flags}>
        <summary>
          {t('playground.flags')}
          {flagCount > 0 ? ` · ${t('playground.flagsOn', { count: flagCount })}` : ''}
        </summary>
        <p className={styles.flagsHint}>{t('playground.flagsHint')}</p>
        <ul className={styles.flagList}>
          {TOGGLED_ON.map((flag) => (
            <li key={flag}>
              {/* The label's text is the flag name and its explanation (expressions the rule cannot see). */}
              {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
              <label className={styles.flag}>
                <input
                  type="checkbox"
                  checked={flags[flag] === true}
                  onChange={(event) => setFlags((current) => ({ ...current, [flag]: event.target.checked }))}
                />
                <span>
                  <code dir="ltr">{flag}</code>
                  <span className={styles.flagNote}>
                    <InlineMarkdown ui text={t(`flags.${flag}`)} />
                  </span>
                </span>
              </label>
            </li>
          ))}
        </ul>
      </details>

      <div data-shortcut-scope className="contents">
        <LazyTryItPanel
          key={current?.id}
          initialCode={current?.code ?? ''}
          draftKey={`playground:${current?.id ?? ''}`}
          onRun={() => count('playgroundRuns')}
          minHeight={240}
          flags={flags}
          showTypes
          fallback={
            <Card className={styles.loading} role="status">
              {t('playground.warming')}
            </Card>
          }
        />
      </div>

      <Card className={styles.note}>
        <strong>{t('playground.noteTitle')}</strong>
        <p>{t('playground.note')}</p>
      </Card>
    </div>
  );
}

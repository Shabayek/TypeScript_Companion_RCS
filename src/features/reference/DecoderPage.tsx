import { useEffect, useState } from 'react';
import { useJourney } from '../../storage/store';
import { useT } from '../../i18n/t';
import { useLazyData } from '../../ui/useLazyData';
import { Card, Callout } from '../../ui/primitives';
import { Button } from '../../ui/Button';
import styles from './reference.module.css';
import { decoderLoader } from './referenceLoaders';

const SAMPLES = [
  "error TS2304: Cannot find name 'totl'.",
  "Type 'string' is not assignable to type 'number'.",
  "Object is possibly 'undefined'.",
  "Property 'toUpperCase' does not exist on type 'number'.",
];

export function DecoderPage() {
  const [text, setText] = useState('');
  const { t, language } = useT();
  const decoder = useLazyData(decoderLoader(language));
  const match = text.trim() === '' || !decoder ? undefined : decoder.decode(text);
  // Each error that gets decoded counts towards the "Error detective" badge.
  const count = useJourney((store) => store.count);
  const matchedId = match?.id;
  useEffect(() => {
    if (matchedId) count('decoderLookups');
  }, [matchedId, count]);

  return (
    <div className={styles.page}>
      <header>
        <p className="eyebrow">{t('reference.eyebrow')}</p>
        <h1 className={styles.title}>{t('reference.decoderTitle')}</h1>
        <p className="muted">{t('reference.decoderLede')}</p>
      </header>

      <div className={styles.decoderGrid}>
        <Card>
          <label className="field">
            <span>{t('reference.errorMessage')}</span>
            <textarea
              className="textarea"
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="error TS2345: Argument of type …"
              dir="ltr"
              rows={6}
            />
          </label>
          <div className="row" style={{ marginTop: 'var(--s-3)' }}>
            {SAMPLES.map((sample) => (
              <Button key={sample} size="sm" variant="ghost" onClick={() => setText(sample)}>
                {t('reference.tryOne')}
              </Button>
            ))}
          </div>
        </Card>

        <Card>
          {text.trim() === '' ? (
            <p className="muted">{t('reference.nothingPasted')}</p>
          ) : match ? (
            <div className={styles.result}>
              <p className="eyebrow">{t('reference.plainEnglish')}</p>
              <h2 className={styles.resultTitle}>{match.title}</h2>
              <dl className={styles.resultdl}>
                <div>
                  <dt>{t('reference.whatItMeans')}</dt>
                  <dd>{match.plain}</dd>
                </div>
                <div>
                  <dt>{t('reference.whatNext')}</dt>
                  <dd>{match.fix}</dd>
                </div>
                {match.example ? (
                  <div>
                    <dt>{t('reference.exampleLabel')}</dt>
                    <dd>
                      <code>{match.example}</code>
                    </dd>
                  </div>
                ) : null}
              </dl>
            </div>
          ) : (
            <Callout tone="why" title={t('reference.noDecoderMatch')}>
              <p>{t('reference.noDecoderMatchBody')}</p>
            </Callout>
          )}
        </Card>
      </div>

      <section aria-labelledby="all-errors">
        <h2 id="all-errors" className={styles.sectionTitle}>
          {t('reference.everyError')}
        </h2>
        <div className={styles.list}>
          {(decoder?.entries ?? []).map((entry) => (
            <details key={entry.id} className={styles.entry}>
              <summary>
                <span className={styles.term}>{entry.title}</span>
                <span className={styles.short}>“{entry.match}”</span>
              </summary>
              <p className={styles.detail}>{entry.plain}</p>
              <p className={styles.detail}>
                <strong>{t('reference.next')}</strong> {entry.fix}
              </p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}

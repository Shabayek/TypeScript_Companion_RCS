import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useCourse } from '../../content/useCourse';
import { CodeBlock } from '../../ui/CodeBlock';
import { EmptyState } from '../../ui/primitives';
import styles from './reference.module.css';
import { useJourney } from '../../storage/store';
import { useT } from '../../i18n/t';

export function GlossaryPage() {
  const [params] = useSearchParams();
  const count = useJourney((store) => store.count);
  const { t } = useT();
  const GLOSSARY = useCourse().glossary;
  const [query, setQuery] = useState('');
  const needle = query.trim().toLowerCase();

  // Command-palette links arrive as ?term=…; open that entry straight away.
  useEffect(() => {
    const term = params.get('term');
    if (!term) return;
    const element = document.getElementById(`glossary-${term}`);
    if (element instanceof HTMLDetailsElement) element.open = true;
    element?.scrollIntoView({ block: 'center' });
    setQuery('');
  }, [params]);

  const entries = useMemo(() => {
    if (!needle) return GLOSSARY;
    return GLOSSARY.filter(
      (entry) =>
        entry.term.toLowerCase().includes(needle) ||
        entry.short.toLowerCase().includes(needle) ||
        entry.detail.toLowerCase().includes(needle),
    );
  }, [needle, GLOSSARY]);

  const jump = (id: string) => {
    const element = document.getElementById(`glossary-${id}`);
    if (element instanceof HTMLDetailsElement) element.open = true;
    element?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  };

  return (
    <div className={styles.page}>
      <header>
        <p className="eyebrow">{t('reference.eyebrow')}</p>
        <h1 className={styles.title}>{t('reference.glossaryTitle')}</h1>
        <p className="muted">{t('reference.glossaryLede', { count: GLOSSARY.length })}</p>
      </header>

      <div className={styles.searchRow}>
        <label className="sr-only" htmlFor="glossary-search">
          {t('reference.searchGlossary')}
        </label>
        <input
          id="glossary-search"
          className="input"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t('reference.searchPlaceholder')}
        />
      </div>

      {entries.length === 0 ? (
        <EmptyState title={t('reference.noMatch')}>{t('reference.noMatchBody')}</EmptyState>
      ) : (
        <div className={styles.list}>
          {entries.map((entry) => (
            <details
              key={entry.id}
              id={`glossary-${entry.id}`}
              className={styles.entry}
              onToggle={(event) => {
                if (event.currentTarget.open) count('glossaryOpens');
              }}
            >
              <summary>
                <span className={styles.term}>{entry.term}</span>
                <span className={styles.short}>{entry.short}</span>
              </summary>
              <p className={styles.detail}>{entry.detail}</p>
              {entry.example ? <CodeBlock code={entry.example} label={t('reference.example')} variant="light" inspect /> : null}
              {entry.related && entry.related.length > 0 ? (
                <div className={styles.related}>
                  <span className={styles.short}>{t('reference.seeAlso')}</span>
                  {entry.related.map((id) => (
                    <button
                      key={id}
                      type="button"
                      className={`btn btn--ghost btn--sm ${styles.relatedLink}`}
                      onClick={() => jump(id)}
                    >
                      {id}
                    </button>
                  ))}
                </div>
              ) : null}
            </details>
          ))}
        </div>
      )}
    </div>
  );
}

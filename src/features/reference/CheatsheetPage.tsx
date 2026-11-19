import { useLazyData } from '../../ui/useLazyData';
import { CodeBlock } from '../../ui/CodeBlock';
import styles from './reference.module.css';
import { useT } from '../../i18n/t';
import { cheatsheetLoader } from './referenceLoaders';

export function CheatsheetPage() {
  const { t, language } = useT();
  const cheatsheet = useLazyData(cheatsheetLoader(language));
  return (
    <div className={styles.page}>
      <header>
        <p className="eyebrow">{t('reference.eyebrow')}</p>
        <h1 className={styles.title}>{t('reference.cheatsheetTitle')}</h1>
        <p className="muted">{t('reference.cheatsheetLede')}</p>
      </header>

      {cheatsheet === null ? (
        <p className="muted" role="status">
          {t('player.opening')}
        </p>
      ) : null}
      {(cheatsheet ?? []).map((section) => (
        <section key={section.id} aria-labelledby={`cheat-${section.id}`}>
          <h2 id={`cheat-${section.id}`} className={styles.sectionTitle}>
            {section.title}
          </h2>
          <div>
            {section.entries.map((entry) => (
              <div key={entry.title} className={styles.cheatEntry}>
                <h3 className={styles.cheatTitle}>{entry.title}</h3>
                <CodeBlock code={entry.code} label="typescript" variant="light" inspect />
                {entry.note ? <p className={styles.cheatNote}>{entry.note}</p> : null}
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

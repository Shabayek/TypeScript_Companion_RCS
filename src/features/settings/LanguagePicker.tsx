import { LANGUAGES, type LanguageInfo } from '../../i18n/languages';
import { useT } from '../../i18n/t';
import { useJourney } from '../../storage/store';
import { hasLessonTranslations } from '../../content/courseText';
import styles from './settings.module.css';

/**
 * Every language, each named in itself ("Deutsch", "العربية"), with its
 * review status. Choosing one only changes the saved setting; the app shell
 * swaps the wording once the new catalogue has loaded, without leaving the
 * current page or step.
 */
export function LanguagePicker({ onPicked }: { onPicked?: (code: string) => void }) {
  const { t } = useT();
  const current = useJourney((store) => store.state.settings.language);
  const patchSettings = useJourney((store) => store.patchSettings);

  const pick = (language: LanguageInfo) => {
    patchSettings({ language: language.code });
    onPicked?.(language.code);
  };

  return (
    <div className={styles.languages} role="radiogroup" aria-label={t('language.title')}>
      {LANGUAGES.map((language) => {
        const selected = language.code === current;
        return (
          <button
            key={language.code}
            type="button"
            role="radio"
            aria-checked={selected}
            className={styles.language}
            data-selected={selected}
            onClick={() => pick(language)}
          >
            <span className={styles.languageName} lang={language.code} dir={language.dir}>
              {language.nativeName}
            </span>
            <span className={styles.languageNote}>
              {language.englishName}
              {language.status === 'preview' ? ` · ${t('language.preview')}` : ''}
              {language.status !== 'source' && !hasLessonTranslations(language.code) ? ` · ${t('language.lessonsEnglish')}` : ''}
            </span>
          </button>
        );
      })}
    </div>
  );
}

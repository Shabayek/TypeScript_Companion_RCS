import { COURSE_LENGTH, MODULES } from '../../content/curriculum';
import { useT } from '../../i18n/t';
import { Card } from '../../ui/primitives';
import { LinkButton } from '../../ui/Button';
import { Mascot } from '../../ui/Mascot';
import styles from './reference.module.css';

export function AboutPage() {
  const { t } = useT();
  return (
    <div className={styles.about}>
      <header>
        <p className="eyebrow">{t('about.eyebrow')}</p>
        <h1 className={styles.title}>{t('about.title')}</h1>
        <p className="muted">{t('about.lede', { lessons: COURSE_LENGTH, modules: MODULES.length })}</p>
      </header>

      <Card className={styles.about}>
        <div className="row" style={{ alignItems: 'flex-start' }}>
          <Mascot pose="thinking" size={72} />
          <div>
            <h2 className={styles.sectionTitle}>{t('about.offlineTitle')}</h2>
            <p className={styles.detail}>{t('about.offline1')}</p>
            <p className={styles.detail}>{t('about.offline2')}</p>
          </div>
        </div>
      </Card>

      <Card className={styles.about}>
        <h2 className={styles.sectionTitle}>{t('about.dataTitle')}</h2>
        <ul className={styles.aboutList}>
          <li>{t('about.data1')}</li>
          <li>{t('about.data2')}</li>
          <li>{t('about.data3')}</li>
          <li>{t('about.data4')}</li>
        </ul>
        <p className={styles.detail}>{t('about.dataBody')}</p>
      </Card>

      <Card className={styles.about}>
        <h2 className={styles.sectionTitle}>{t('about.checkingTitle')}</h2>
        <p className={styles.detail}>{t('about.checking1')}</p>
        <p className={styles.detail}>{t('about.checking2')}</p>
      </Card>

      <Card className={styles.about}>
        <h2 className={styles.sectionTitle}>{t('about.languagesTitle')}</h2>
        <p className={styles.detail}>{t('about.languages')}</p>
      </Card>

      <Card className={styles.about}>
        <h2 className={styles.sectionTitle}>{t('about.androidTitle')}</h2>
        <p className={styles.detail}>{t('about.android')}</p>
        <p className={styles.big} dir="ltr">
          npm run build · npx cap add android · npx cap sync
        </p>
      </Card>

      <Card className={styles.about}>
        <h2 className={styles.sectionTitle}>{t('about.creditsTitle')}</h2>
        <p className={styles.detail}>{t('about.credits')}</p>
      </Card>

      <div className="row">
        <LinkButton to="/" variant="primary">
          {t('shell.backToJourney')}
        </LinkButton>
        <LinkButton to="/glossary" variant="ghost">
          {t('about.glossary')}
        </LinkButton>
      </div>
    </div>
  );
}

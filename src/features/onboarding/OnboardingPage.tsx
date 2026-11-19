import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useJourney } from '../../storage/store';
import { AGE_MODES, EXPERIENCES, type AgeMode, type Experience } from '../../content/schema';
import { MODULES, entryModule } from '../../content/curriculum';
import { useT } from '../../i18n/t';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/primitives';
import { Mascot } from '../../ui/Mascot';
import styles from './onboarding.module.css';
import { LanguagePicker } from '../settings/LanguagePicker';
import { DEFAULT_LANGUAGE, languageInfo, matchLanguage } from '../../i18n/languages';
import { deviceLanguages } from '../../platform/capabilities';
import { useCourse } from '../../content/useCourse';

const MODE_ICON: Record<AgeMode, string> = { story: '🧭', explorer: '🚀', pro: '🛠️' };

const EXPERIENCE_ICON: Record<Experience, string> = { new: '🌱', javascript: '📜', typescript: '🧩' };

export function OnboardingPage() {
  const { t, language } = useT();
  const course = useCourse();
  const navigate = useNavigate();
  const state = useJourney((store) => store.state);
  const patchSettings = useJourney((store) => store.patchSettings);
  const setProfile = useJourney((store) => store.setProfile);

  const [stage, setStage] = useState<0 | 1 | 2 | 3>(0);

  // First run: speak the device's language straight away when the app has it
  // (fr-BE → French, de-LU → German, pt-BR → Portuguese). The choice is shown
  // on the welcome card and can be changed there or in Settings later.
  useEffect(() => {
    if (state.profile.onboarded || state.settings.language !== DEFAULT_LANGUAGE) return;
    const match = matchLanguage(deviceLanguages());
    if (match !== DEFAULT_LANGUAGE) patchSettings({ language: match });
    // Once, when onboarding opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [mode, setMode] = useState<AgeMode>(state.settings.mode);
  const [name, setName] = useState(state.profile.name);
  const [experience, setExperience] = useState<Experience>(state.profile.experience ?? 'new');
  // Suggested from the answer (on for people who already code) until the learner decides.
  const [unlockChoice, setUnlockChoice] = useState<boolean | null>(null);
  const unlock = unlockChoice ?? (state.settings.unlockAll || experience !== 'new');
  const start = unlock ? entryModule(experience) : MODULES[0];
  // Pro readers are offered Quiet mode (no points or streaks); off unless chosen.
  const [quiet, setQuiet] = useState(state.settings.quiet);

  const finish = () => {
    patchSettings({ mode, unlockAll: unlock, quiet: mode === 'pro' ? quiet : state.settings.quiet });
    setProfile({ name: name.trim().slice(0, 40), onboarded: true, experience });
    navigate('/', { replace: true });
  };

  return (
    <div className={styles.page}>
      {stage === 0 ? (
        <Card pad="lg" className={styles.card}>
          <Mascot pose="waving" size={128} />
          <h1 className={styles.title}>{t('onboarding.hello')}</h1>
          <p className={styles.lede}>{t('onboarding.helloLede')}</p>
          <ul className={styles.points}>
            <li>{t('onboarding.point1')}</li>
            <li>{t('onboarding.point2')}</li>
            <li>{t('onboarding.point3')}</li>
          </ul>
          <Button variant="primary" size="lg" block onClick={() => setStage(1)}>
            {t('onboarding.letsStart')}
          </Button>
          <details className={styles.languageChoice}>
            <summary>
              {t('language.title')}: <span lang={language}>{languageInfo(language).nativeName}</span>
            </summary>
            <LanguagePicker />
          </details>
        </Card>
      ) : null}

      {stage === 1 ? (
        <Card pad="lg" className={styles.card}>
          <h1 className={styles.title}>{t('onboarding.whoTitle')}</h1>
          <p className={styles.lede}>{t('onboarding.whoLede')}</p>

          <div className={styles.modes} role="radiogroup" aria-label={t('onboarding.readingMode')}>
            {AGE_MODES.map((option) => {
              const selected = mode === option;
              return (
                <button
                  key={option}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  className={styles.mode}
                  data-selected={selected}
                  onClick={() => setMode(option)}
                >
                  <span className={styles.modeIcon} aria-hidden="true">
                    {MODE_ICON[option]}
                  </span>
                  <span className={styles.modeBody}>
                    <span className={styles.modeTitle}>{t(`onboarding.${option}Title`)}</span>
                    <span className={styles.modeAge}>{t(`onboarding.${option}Age`)}</span>
                    <span className={styles.modeBlurb}>{t(`onboarding.${option}Blurb`)}</span>
                  </span>
                </button>
              );
            })}
          </div>

          <div className={styles.row}>
            <Button variant="ghost" onClick={() => setStage(0)}>
              {t('onboarding.back')}
            </Button>
            <span className={styles.spacer} />
            <Button variant="primary" onClick={() => setStage(2)}>
              {t('onboarding.thatsMe')}
            </Button>
          </div>
        </Card>
      ) : null}

      {stage === 2 ? (
        <Card pad="lg" className={styles.card}>
          <h1 className={styles.title}>{t('onboarding.experienceTitle')}</h1>
          <p className={styles.lede}>{t('onboarding.experienceLede')}</p>

          <div className={styles.modes} role="radiogroup" aria-label={t('onboarding.experienceLabel')}>
            {EXPERIENCES.map((option) => {
              const selected = experience === option;
              return (
                <button
                  key={option}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  className={styles.mode}
                  data-selected={selected}
                  onClick={() => setExperience(option)}
                >
                  <span className={styles.modeIcon} aria-hidden="true">
                    {EXPERIENCE_ICON[option]}
                  </span>
                  <span className={styles.modeBody}>
                    <span className={styles.modeTitle}>{t(`onboarding.${option}Title`)}</span>
                    <span className={styles.modeBlurb}>{t(`onboarding.${option}Blurb`)}</span>
                  </span>
                </button>
              );
            })}
          </div>

          <div className={styles.row}>
            <Button variant="ghost" onClick={() => setStage(1)}>
              {t('onboarding.back')}
            </Button>
            <span className={styles.spacer} />
            <Button variant="primary" onClick={() => setStage(3)}>
              {t('onboarding.continue')}
            </Button>
          </div>
        </Card>
      ) : null}

      {stage === 3 ? (
        <Card pad="lg" className={styles.card}>
          <Mascot pose="thinking" size={104} />
          <h1 className={styles.title}>{t('onboarding.nameTitle')}</h1>
          <p className={styles.lede}>{t('onboarding.nameLede')}</p>
          <label className={styles.label} htmlFor="learner-name">
            {t('onboarding.nameLabel')}
          </label>
          <input
            id="learner-name"
            className="input"
            value={name}
            maxLength={40}
            autoComplete="off"
            onChange={(event) => setName(event.target.value)}
            placeholder={t('onboarding.namePlaceholder')}
          />

          <div className={styles.start}>
            <span className={styles.startLabel}>{t('onboarding.startingPoint')}</span>
            <strong>
              {start
                ? start.number === 0
                  ? `${t('lesson.startHere')} · ${course.moduleTitle(start)}`
                  : t('onboarding.startingModule', { number: start.number, title: course.moduleTitle(start) })
                : null}
            </strong>
            {experience !== 'new' ? (
              <label className={styles.check}>
                <input
                  type="checkbox"
                  checked={unlock}
                  onChange={(event) => setUnlockChoice(event.target.checked)}
                />
                <span>{t('onboarding.unlockSuggestion')}</span>
              </label>
            ) : null}
            {mode === 'pro' ? (
              <label className={styles.check}>
                <input type="checkbox" checked={quiet} onChange={(event) => setQuiet(event.target.checked)} />
                <span>{t('motivationSettings.quietSuggestion')}</span>
              </label>
            ) : null}
          </div>

          <div className={styles.row}>
            <Button variant="ghost" onClick={() => setStage(2)}>
              {t('onboarding.back')}
            </Button>
            <span className={styles.spacer} />
            <Button variant="primary" size="lg" onClick={finish}>
              {t('onboarding.startLearning')}
            </Button>
          </div>
          <p className={styles.note}>
            {mode === 'story' ? t('onboarding.storyNote') : t('onboarding.note')}
          </p>
        </Card>
      ) : null}
    </div>
  );
}

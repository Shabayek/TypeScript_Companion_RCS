import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AGE_MODES, type AgeMode } from '../../content/schema';
import { isPersistentStorageAvailable } from '../../storage/local';
import { useJourney } from '../../storage/store';
import { DAILY_GOALS, ENGINE_SETTINGS, type DailyGoal, type EngineSetting, type TextSize } from '../../storage/types';
import { detectedEngine } from '../../platform/useEngine';
import { playSound, supportsSound, supportsSpeech, speak, stopSpeaking, voiceFor } from '../../platform/capabilities';
import { languageInfo } from '../../i18n/languages';
import { LanguagePicker } from './LanguagePicker';
import { version as APP_VERSION } from '../../../package.json';
import { Button } from '../../ui/Button';
import { Card, Callout } from '../../ui/primitives';
import { Dialog } from '../../ui/Dialog';
import { Mascot } from '../../ui/Mascot';
import { useT } from '../../i18n/t';
import styles from './settings.module.css';

const MODE_LABELS: Record<AgeMode, 'settingsPage.story' | 'settingsPage.explorer' | 'settingsPage.pro'> = {
  story: 'settingsPage.story',
  explorer: 'settingsPage.explorer',
  pro: 'settingsPage.pro',
};

function Segmented<T extends string | number>({
  legend,
  hint,
  value,
  options,
  onChange,
}: {
  legend: string;
  hint?: string;
  value: T;
  options: readonly { value: T; label: string; disabled?: boolean }[];
  onChange: (next: T) => void;
}) {
  return (
    <fieldset className={styles.field}>
      <legend className={styles.legend}>{legend}</legend>
      {hint ? <p className={styles.hint}>{hint}</p> : null}
      <div className={styles.segmented} role="radiogroup" aria-label={legend}>
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <button
              key={String(option.value)}
              type="button"
              role="radio"
              aria-checked={selected}
              className={styles.segment}
              data-selected={selected}
              disabled={option.disabled}
              onClick={() => onChange(option.value)}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

function Toggle({
  label,
  hint,
  checked,
  onChange,
  disabled,
  id,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  id?: string;
}) {
  return (
    <div className={styles.toggleRow}>
      <div>
        <div className={styles.toggleLabel}>{label}</div>
        {hint ? <p className={styles.hint}>{hint}</p> : null}
      </div>
      <button
        type="button"
        role="switch"
        id={id}
        aria-checked={checked}
        aria-label={label}
        className={styles.switch}
        data-on={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
      >
        <span className={styles.switchKnob} aria-hidden="true" />
      </button>
    </div>
  );
}

export function SettingsPage() {
  const state = useJourney((store) => store.state);
  const patchSettings = useJourney((store) => store.patchSettings);
  const reset = useJourney((store) => store.reset);
  const saveFailed = useJourney((store) => store.saveFailed);
  const settings = state.settings;
  const detected = detectedEngine();

  const { t } = useT();
  const location = useLocation();
  const [unlockOpen, setUnlockOpen] = useState(false);
  const learningPath = useRef<HTMLDivElement>(null);

  // Arriving from "unlock every lesson in Settings": bring that switch into view.
  useEffect(() => {
    if (location.hash !== '#learning-path') return;
    learningPath.current?.scrollIntoView({ block: 'center' });
    document.getElementById('unlock-all-switch')?.focus({ preventScroll: true });
  }, [location.hash]);

  const [resetOpen, setResetOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [speaking, setSpeaking] = useState(false);

  // The probe only proves a tiny write works. A real save can still fail when
  // the device is out of space, so a failed save counts too.
  const storageAvailable = isPersistentStorageAvailable();
  const storageOk = storageAvailable && !saveFailed;
  const speechOk = supportsSpeech();
  const soundOk = supportsSound();
  const { language } = useT();
  // The confirmation word in this language; the English one always works too.
  const resetWord = t('settingsPage.resetWord');
  const typed = confirmText.trim().toLocaleUpperCase(language);
  const confirmed = typed === resetWord.toLocaleUpperCase(language) || typed === 'RESET';
  // Read aloud in this language, or the nearest voice the device has.
  const info = languageInfo(language);
  const voice = speechOk ? voiceFor(info.speech) : null;
  const speechFallback =
    speechOk && voice && voice.lang.split('-')[0] !== info.code.split('-')[0]
      ? t('language.readAloudFallback', {
          language: info.nativeName,
          fallback: languageInfo(voice.lang.split('-')[0] ?? 'en').nativeName,
        })
      : null;

  return (
    <div className={styles.page}>
      <header>
        <p className="eyebrow">{t('settingsPage.eyebrow')}</p>
        <h1 className={styles.title}>{t('settingsPage.title')}</h1>
        <p className="muted">{t('settingsPage.lede')}</p>
      </header>

      <Card className={styles.card}>
        <h2 className={styles.h2} id="language-title">
          {t('language.title')}
        </h2>
        <p className={styles.hint}>{t('language.hint')}</p>
        <LanguagePicker />
        {speechFallback ? <p className={styles.hint}>{speechFallback}</p> : null}
      </Card>

      <Card className={styles.card}>
        <Segmented
          legend={t('settingsPage.readingMode')}
          hint={t('settingsPage.readingModeHint')}
          value={settings.mode}
          options={AGE_MODES.map((mode) => ({ value: mode, label: t(MODE_LABELS[mode]) }))}
          onChange={(mode) => patchSettings({ mode })}
        />

        <hr className="divider" />

        <Segmented<TextSize>
          legend={t('settingsPage.textSize')}
          hint={t('settingsPage.textSizeHint')}
          value={settings.textSize}
          options={[
            { value: 1, label: 'A−' },
            { value: 2, label: 'A' },
            { value: 3, label: 'A+' },
            { value: 4, label: 'A++' },
            { value: 5, label: 'A+++' },
          ]}
          onChange={(textSize) => patchSettings({ textSize })}
        />
        <p className={styles.preview}>
          {t('settingsPage.preview')}
        </p>

        <Segmented
          legend={t('settingsPage.font')}
          hint={t('settingsPage.fontHint')}
          value={settings.font}
          options={[
            { value: 'standard', label: t('settingsPage.fontStandard') },
            { value: 'dyslexia', label: t('settingsPage.fontDyslexia') },
          ]}
          onChange={(font) => patchSettings({ font })}
        />

        <hr className="divider" />

        <Segmented
          legend={t('settingsPage.theme')}
          value={settings.theme}
          options={[
            { value: 'auto', label: t('settingsPage.matchDevice') },
            { value: 'light', label: t('settingsPage.light') },
            { value: 'dark', label: t('settingsPage.dark') },
          ]}
          onChange={(theme) => patchSettings({ theme })}
        />

        <Segmented
          legend={t('settingsPage.motion')}
          value={settings.reduceMotion}
          options={[
            { value: 'auto', label: t('settingsPage.matchDevice') },
            { value: 'on', label: t('settingsPage.reduce') },
            { value: 'off', label: t('settingsPage.full') },
          ]}
          onChange={(reduceMotion) => patchSettings({ reduceMotion })}
        />
      </Card>

      <div id="learning-path" ref={learningPath}>
        <Card className={styles.card}>
          <h2 className={styles.h2}>{t('unlock.sectionTitle')}</h2>
          <Toggle
            id="unlock-all-switch"
            label={t('unlock.toggle')}
            hint={settings.unlockAll ? t('unlock.hintOn') : t('unlock.hintOff')}
            checked={settings.unlockAll}
            onChange={(next) => {
              // Turning it on asks once; turning it off is immediate and loses nothing.
              if (next) setUnlockOpen(true);
              else patchSettings({ unlockAll: false });
            }}
          />
        </Card>
      </div>

      <Card className={styles.card}>
        <Segmented<EngineSetting>
          legend={t('engine.title')}
          hint={t('engine.hint')}
          value={settings.engine === 'modern' && detected === 'classic' ? 'auto' : settings.engine}
          options={ENGINE_SETTINGS.map((value) => ({
            value,
            label: t(`engine.${value}`),
            disabled: value === 'modern' && detected === 'classic',
          }))}
          onChange={(engine) => patchSettings({ engine })}
        />
        <p className={styles.hint} data-testid="engine-status">
          {detected === 'classic'
            ? t('engine.detectedClassic')
            : settings.engine === 'classic'
              ? t('engine.classicChosen')
              : t('engine.detectedModern')}
        </p>
      </Card>

      <Card className={styles.card}>
        <h2 className={styles.h2}>{t('motivationSettings.title')}</h2>
        <Toggle
          label={t('motivationSettings.quiet')}
          hint={t('motivationSettings.quietHint')}
          checked={settings.quiet}
          onChange={(quiet) => patchSettings({ quiet })}
        />
        {settings.quiet ? null : (
          <>
            <Segmented<DailyGoal>
              legend={t('motivationSettings.goal')}
              hint={t('motivationSettings.goalHint')}
              value={settings.dailyGoal}
              options={DAILY_GOALS.map((minutes) => ({
                value: minutes,
                label: t('motivationSettings.goalOption', { count: minutes }),
              }))}
              onChange={(dailyGoal) => patchSettings({ dailyGoal })}
            />
            <Toggle
              label={t('motivationSettings.sound')}
              hint={t('motivationSettings.soundHint')}
              checked={settings.sound && soundOk}
              disabled={!soundOk}
              onChange={(sound) => {
                patchSettings({ sound });
                if (sound) playSound('correct');
              }}
            />
            {settings.sound && soundOk ? (
              <div className="row">
                <Button size="sm" variant="ghost" onClick={() => playSound('complete')}>
                  {t('motivationSettings.soundTest')}
                </Button>
              </div>
            ) : null}
          </>
        )}
      </Card>

      <Card className={styles.card}>
        <Toggle
          label={t('settingsPage.mascot')}
          hint={t('settingsPage.mascotHint')}
          checked={settings.mascot}
          onChange={(mascot) => patchSettings({ mascot })}
        />
        <hr className="divider" />
        <Toggle
          label={t('settingsPage.readAloud')}
          hint={
            speechOk
              ? t('settingsPage.readAloudHint')
              : t('settingsPage.readAloudMissing')
          }
          checked={settings.readAloud && speechOk}
          disabled={!speechOk}
          onChange={(readAloud) => patchSettings({ readAloud })}
        />
        {speechOk ? (
          <div className="row">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                if (speaking) {
                  stopSpeaking();
                  setSpeaking(false);
                  return;
                }
                setSpeaking(true);
                const started = speak(t('settingsPage.voiceSample'), () => setSpeaking(false), languageInfo(language).speech);
                if (!started) setSpeaking(false);
              }}
            >
              {speaking ? t('settingsPage.stopVoice') : t('settingsPage.testVoice')}
            </Button>
          </div>
        ) : null}
      </Card>

      <Card className={styles.card}>
        <div className={styles.storageRow}>
          <Mascot pose={storageOk ? 'idle' : 'hmm'} size={56} />
          <div>
            <strong>{storageOk ? t('settingsPage.saved') : t('settingsPage.notSaved')}</strong>
            <p className={styles.hint} style={{ margin: 0 }}>
              {storageOk
                ? t('settingsPage.savedBody')
                : storageAvailable
                  ? t('settingsPage.quotaBody')
                  : t('settingsPage.blockedBody')}
            </p>
          </div>
        </div>
      </Card>

      <Card className={styles.card}>
        <h2 className={styles.h2}>{t('settingsPage.reference')}</h2>
        <div className={styles.linkList}>
          <Link to="/glossary">{t('settingsPage.glossary')}</Link>
          <Link to="/cheatsheet">{t('settingsPage.cheatsheet')}</Link>
          <Link to="/decoder">{t('settingsPage.decoder')}</Link>
          <Link to="/about">{t('settingsPage.about')}</Link>
        </div>
      </Card>

      <Card className={styles.card}>
        <h2 className={styles.h2}>{t('settingsPage.startOver')}</h2>
        <p className={styles.hint}>{t('settingsPage.startOverBody')}</p>
        <Button variant="danger" onClick={() => setResetOpen(true)} className={styles.dangerButton}>
          {t('settingsPage.resetAll')}
        </Button>
      </Card>

      <p className={styles.version}>{t('settingsPage.version', { version: APP_VERSION })}</p>

      <Dialog
        open={unlockOpen}
        onClose={() => setUnlockOpen(false)}
        title={t('unlock.dialogTitle')}
        footer={
          <div className="row">
            <Button variant="ghost" onClick={() => setUnlockOpen(false)}>
              {t('unlock.cancel')}
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                patchSettings({ unlockAll: true });
                setUnlockOpen(false);
              }}
            >
              {t('unlock.confirm')}
            </Button>
          </div>
        }
      >
        <div className={styles.dialogText}>
          <p>{t('unlock.dialogBody')}</p>
          <p>{t('unlock.dialogBody2')}</p>
        </div>
      </Dialog>

      <Dialog
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        title={t('settingsPage.resetTitle')}
        footer={
          <div className="row">
            <Button variant="ghost" onClick={() => setResetOpen(false)}>
              {t('settingsPage.keepProgress')}
            </Button>
            <Button
              variant="danger"
              disabled={!confirmed}
              onClick={() => {
                reset();
                stopSpeaking();
                setConfirmText('');
                setResetOpen(false);
              }}
            >
              {t('settingsPage.resetEverything')}
            </Button>
          </div>
        }
      >
        <Callout tone="warn" title={t('settingsPage.cannotUndo')}>
          <p>{t('settingsPage.resetBody', { word: resetWord })}</p>
        </Callout>
        <label className="field" style={{ marginTop: 'var(--s-3)' }}>
          <span>{t('settingsPage.typeWord', { word: resetWord })}</span>
          <input
            className="input"
            value={confirmText}
            onChange={(event) => setConfirmText(event.target.value)}
            autoComplete="off"
            spellCheck={false}
          />
        </label>
      </Dialog>
    </div>
  );
}

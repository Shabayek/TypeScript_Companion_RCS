import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  applyAppearance,
  installBackGuard,
  isOnline,
  reloadApp,
  watchConnectivity,
  watchSystemTheme,
  watchUncaughtErrors,
  applyLanguage,
} from '../platform/capabilities';
import { Boundary, ErrorDetails } from '../ui/Boundary';
import { applyUpdate, isUpdateReady, subscribeToUpdates } from './registerServiceWorker';
import { startPersistence, useJourney } from '../storage/store';
import { CommandPalette } from '../features/command/CommandPalette';
import { CelebrationToast } from '../features/motivation/CelebrationToast';
import { LanguagePicker } from '../features/settings/LanguagePicker';
import { Dialog } from '../ui/Dialog';
import { languageInfo } from '../i18n/languages';
import { activateLanguage, t as translate, useT } from '../i18n/t';
import styles from './app.module.css';

/** Shown in place of a screen that crashed; the header and navigation stay. */
function ScreenCrashed({ error, onRetry }: { error: Error; onRetry: () => void }) {
  const { t } = useT();
  return (
    <div className="card card--pad-lg" style={{ maxWidth: '36rem', margin: 'var(--s-6) auto' }}>
      <h1 style={{ fontSize: 'var(--text-3)' }}>{t('shell.screenProblem')}</h1>
      <p style={{ color: 'var(--ink-soft)', marginTop: 'var(--s-2)' }}>{t('shell.screenProblemBody')}</p>
      <div className="row" style={{ marginTop: 'var(--s-4)' }}>
        <button type="button" className="btn btn--primary" onClick={onRetry}>
          {t('shell.tryAgain')}
        </button>
        <NavLink to="/" className="btn btn--ghost">
          {t('shell.backToJourney')}
        </NavLink>
        <button type="button" className="btn btn--ghost" onClick={reloadApp}>
          {t('shell.reload')}
        </button>
      </div>
      <ErrorDetails error={error} />
    </div>
  );
}

/** At most one "something went wrong" toast in this window. */
const UNCAUGHT_TOAST_GAP_MS = 10_000;

function GlobeIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M3 12h18M12 3c2.6 2.6 3.9 5.6 3.9 9s-1.3 6.4-3.9 9M12 3C9.4 5.6 8.1 8.6 8.1 12s1.3 6.4 3.9 9"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false">
      <path
        d="M4 11.5 12 4l8 7.5V20a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false">
      <rect x="3.5" y="4.5" width="17" height="15" rx="3" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M10 9.2 15 12l-5 2.8z" fill="currentColor" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false">
      <path d="M4 20V6M10 20V10M16 20v-6M22 20V4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
      <circle cx="10.5" cy="10.5" r="6.2" fill="none" stroke="currentColor" strokeWidth="1.9" />
      <path d="m15.4 15.4 4.4 4.4" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  );
}

function CogIcon() {
  return (
    <svg viewBox="0 0 24 24" width="21" height="21" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="3.2" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.5 5.5l1.7 1.7M16.8 16.8l1.7 1.7M18.5 5.5l-1.7 1.7M7.2 16.8l-1.7 1.7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function AppShell() {
  const location = useLocation();
  const hydrated = useJourney((store) => store.hydrated);
  const hydrate = useJourney((store) => store.hydrate);
  const settings = useJourney((store) => store.state.settings);
  const onboarded = useJourney((store) => store.state.profile.onboarded);

  const [paletteOpen, setPaletteOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastUncaughtToast = useRef(0);
  const updateReady = useSyncExternalStore(subscribeToUpdates, isUpdateReady);
  const [updateDismissed, setUpdateDismissed] = useState(false);

  const say = (message: string, ms = 4200) => {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), ms);
  };

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => startPersistence(), []);

  // Errors outside rendering (a button handler, a timer, a promise) used to
  // fail silently. Say something calm once, instead of nothing or a crash.
  useEffect(
    () =>
      watchUncaughtErrors((error) => {
        console.error('[TypeScript Companion] uncaught error', error);
        const now = Date.now();
        if (now - lastUncaughtToast.current < UNCAUGHT_TOAST_GAP_MS) return;
        lastUncaughtToast.current = now;
        say(translate('shell.uncaught'), 5000);
      }),
    [],
  );

  useEffect(() => {
    applyAppearance(settings);
  }, [settings]);

  // The saved language drives the screen. Switching keeps the page, the step
  // and everything typed: only the wording changes, once it has loaded.
  const { t, language, dir } = useT();
  const languageCode = language.split('-')[0]?.toUpperCase() ?? '';
  useEffect(() => {
    void activateLanguage(settings.language);
  }, [settings.language]);
  useEffect(() => applyLanguage(language, dir), [language, dir]);

  useEffect(() => watchSystemTheme(() => applyAppearance(settings)), [settings]);

  useEffect(() => {
    const stop = watchConnectivity((online) => {
      say(
        online
          ? translate('shell.online')
          : translate('shell.offline'),
      );
    });
    if (!isOnline()) say(translate('shell.offline'), 6000);
    return stop;
  }, []);

  useEffect(() => {
    const stop = installBackGuard(() => {
      say(translate('shell.backToLeave'), 3000);
    });
    return stop;
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setPaletteOpen((open) => !open);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  useEffect(() => {
    setAnnouncement('');
    const timer = setTimeout(() => {
      const heading = document.querySelector<HTMLElement>('main h1');
      setAnnouncement(heading?.textContent?.trim() ?? translate('shell.pageChanged'));
      window.scrollTo({ top: 0, behavior: 'auto' });
    }, 60);
    return () => clearTimeout(timer);
  }, [location.pathname, hydrated]);

  const forceOnboarding = hydrated && !onboarded && location.pathname !== '/onboarding';
  // A lesson is a focused screen: its own footer (Back, Hint, Next) sticks to
  // the bottom. The app's bottom navigation also stuck there and covered it,
  // so on phones Next sat under the bar. The header (home, search, settings)
  // and the lesson's Exit link stay available.
  // Practice is the same kind of screen.
  const inLesson = location.pathname.startsWith('/learn/') || location.pathname === '/practice';

  return (
    <div className="app-shell">
      {/* Focus the content directly. Following href="#main" would change the
          URL hash, which the hash router reads as a route: the learner landed
          on "That page isn't here" in the middle of a lesson. */}
      <a
        className="skip-link"
        href="#main"
        onClick={(event) => {
          event.preventDefault();
          document.getElementById('main')?.focus();
        }}
      >
        {t('shell.skip')}
      </a>

      <header className={styles.header}>
        <div className={styles.headerInner}>
          {/* Named by its visible text (plus "home" for screen readers); an
              aria-label that left out visible text failed WCAG 2.5.3. */}
          <NavLink to="/" className={styles.brand ?? ''}>
            <span className={styles.brandMark} aria-hidden="true">
              TS
            </span>
            <span className={styles.brandText}>{t('app.name')}</span>
            <span className="sr-only">{` ${t('shell.home')}`}</span>
          </NavLink>

          <div className={styles.headerActions}>
            {/* On phones the label is hidden, so the button is named explicitly
                (it had no accessible name at all there). */}
            <button
              type="button"
              className={styles.pillButton}
              onClick={() => setPaletteOpen(true)}
              aria-haspopup="dialog"
              aria-label={t('shell.jumpTo')}
              aria-keyshortcuts="Control+K"
            >
              <SearchIcon />
              <span className={styles.pillLabel} aria-hidden="true">
                {t('shell.jumpTo')}
              </span>
              <kbd className={styles.kbd} aria-hidden="true">
                Ctrl K
              </kbd>
            </button>
            <button
              type="button"
              className={`${styles.iconLink} ${styles.langButton}`}
              onClick={() => setLanguageOpen(true)}
              aria-haspopup="dialog"
              // The name starts with the visible short code (WCAG 2.5.3), so
              // "AR" can be spoken to voice control even in Arabic.
              aria-label={`${languageCode}, ${t('language.button')}: ${languageInfo(language).nativeName}`}
            >
              <GlobeIcon />
              <span className={styles.langCode} aria-hidden="true">
                {languageCode}
              </span>
            </button>
            <NavLink
              to="/settings"
              className={({ isActive }) =>
                [styles.iconLink, isActive ? styles.iconLinkActive : ''].filter(Boolean).join(' ')
              }
              aria-label={t('nav.settings')}
            >
              <CogIcon />
            </NavLink>
          </div>
        </div>
      </header>

      <main className="app-main" id="main" tabIndex={-1} aria-busy={!hydrated}>
        {/* No screen renders until saved progress has been read. A screen
            that mounted earlier saw the empty default state, and anything it
            saved overwrote the learner's real progress. */}
        {!hydrated ? (
          <p className="sr-only" role="status">
            {t('shell.loading')}
          </p>
        ) : forceOnboarding ? null : (
          // One broken screen must not take the header and navigation with it.
          // Navigating elsewhere clears the error.
          <Boundary
            label={`screen ${location.pathname}`}
            resetKey={location.pathname}
            fallback={(error, reset) => <ScreenCrashed error={error} onRetry={reset} />}
          >
            <Outlet />
          </Boundary>
        )}
        {forceOnboarding ? (
          <div className={styles.gate}>
            <p>{t('shell.gate')}</p>
            <NavLink to="/onboarding" className="btn btn--primary">
              {t('shell.gateButton')}
            </NavLink>
          </div>
        ) : null}
      </main>

      {inLesson ? null : (
        <nav className={styles.bottomNav} aria-label={t('shell.mainNav')}>
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              [styles.navItem, isActive ? styles.navItemActive : ''].filter(Boolean).join(' ')
            }
          >
            <HomeIcon />
            <span>{t('nav.journey')}</span>
          </NavLink>
          <NavLink
            to="/playground"
            className={({ isActive }) =>
              [styles.navItem, isActive ? styles.navItemActive : ''].filter(Boolean).join(' ')
            }
          >
            <PlayIcon />
            <span>{t('nav.playground')}</span>
          </NavLink>
          <NavLink
            to="/progress"
            className={({ isActive }) =>
              [styles.navItem, isActive ? styles.navItemActive : ''].filter(Boolean).join(' ')
            }
          >
            <ChartIcon />
            <span>{t('nav.progress')}</span>
          </NavLink>
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              [styles.navItem, isActive ? styles.navItemActive : ''].filter(Boolean).join(' ')
            }
          >
            <CogIcon />
            <span>{t('nav.settings')}</span>
          </NavLink>
        </nav>
      )}

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />

      <Dialog open={languageOpen} onClose={() => setLanguageOpen(false)} title={t('language.dialogTitle')}>
        <p className="muted" style={{ marginTop: 0 }}>
          {t('language.hint')}
        </p>
        <LanguagePicker onPicked={() => setLanguageOpen(false)} />
      </Dialog>

      <p className="sr-only" role="status" aria-live="polite">
        {announcement}
      </p>

      <div className="toast-stack">
        {updateReady && !updateDismissed ? (
          // Never switch versions mid-lesson on our own: offer it, and let the
          // learner choose the moment. Reloading keeps progress and the step.
          <div className="toast toast--action" role="status">
            <span>{t('shell.updateReady')}</span>
            <button type="button" className="btn btn--primary btn--sm" onClick={applyUpdate}>
              {t('shell.updateReload')}
            </button>
            <button type="button" className="btn btn--ghost btn--sm toast__later" onClick={() => setUpdateDismissed(true)}>
              {t('shell.updateLater')}
            </button>
          </div>
        ) : null}

        {toast ? (
          <div className="toast" role="status">
            {toast}
          </div>
        ) : null}

        <CelebrationToast />
      </div>
    </div>
  );
}

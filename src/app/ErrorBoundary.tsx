import { Component, type ErrorInfo, type ReactNode } from 'react';
import { goHomeWithoutRouter, markErrorHandled, reloadApp } from '../platform/capabilities';
import { ErrorDetails } from '../ui/Boundary';
import { t } from '../i18n/t';

interface State {
  error: Error | null;
}

/**
 * A last resort, around the whole app. Screens and editor panels have their
 * own boundaries (see `ui/Boundary.tsx`), so this only shows when the app
 * shell itself fails. It offers a calm way forward instead of a blank white
 * screen — which is especially important inside a WebView, where there is no
 * address bar to recover from.
 */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: unknown): State {
    return { error: error instanceof Error ? error : new Error(String(error)) };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    markErrorHandled(error);
    // Local only: no telemetry, by design.
    console.error('[TypeScript Companion] render failed', error, info.componentStack);
  }

  private readonly goHome = () => {
    // Try to recover in place first: go to the journey map and render again.
    // If the failure is permanent, this screen simply comes back.
    goHomeWithoutRouter();
    this.setState({ error: null });
  };

  override render(): ReactNode {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="app-shell">
        <main className="app-main" id="main" role="main">
          <div className="card" style={{ maxWidth: '36rem', margin: '10vh auto', padding: 'var(--s-6)' }}>
            <h1 style={{ fontSize: 'var(--text-3)' }}>{t('shell.crashTitle')}</h1>
            <p style={{ color: 'var(--ink-soft)', marginTop: 'var(--s-2)' }}>{t('shell.crashBody')}</p>
            <div className="row" style={{ marginTop: 'var(--s-4)' }}>
              <button type="button" className="btn btn--primary" onClick={this.goHome}>
                {t('shell.backToJourney')}
              </button>
              <button type="button" className="btn btn--ghost" onClick={reloadApp}>
                {t('shell.reload')}
              </button>
            </div>
            <ErrorDetails error={error} />
          </div>
        </main>
      </div>
    );
  }
}

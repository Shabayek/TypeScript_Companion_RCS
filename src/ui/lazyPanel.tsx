import { useEffect, useState, type ComponentType, type ReactNode } from 'react';
import { isOnline, reloadApp } from '../platform/capabilities';
import { Boundary, ErrorDetails } from './Boundary';
import { Button } from './Button';
import { Callout } from './primitives';
import { useT } from '../i18n/t';
import type { MessageKey } from '../i18n/messages';

type Status<P> =
  | { kind: 'loading' }
  | { kind: 'ready'; Component: ComponentType<P> }
  | { kind: 'failed'; error: Error };

/**
 * Lazily loads a heavy part of the UI (the code editor) as its own chunk, and
 * keeps a failed download *local*.
 *
 * `React.lazy` was used before. A chunk that failed to download (a dropped
 * connection, a tab left open across a deploy, an incomplete offline cache)
 * rejected inside it, nothing near it caught the error, and the whole app was
 * replaced by the crash screen. Here a failure shows a small message in place
 * of the panel while the rest of the screen keeps working.
 *
 * Recovery is a reload, on request. Browsers remember a failed module import,
 * so importing the same chunk again in the same page fails without even
 * trying the network; only a fresh page load can fetch it. Reloading is safe
 * for progress, and the learner returns to the same step.
 */
/** How a panel is named: in the log (English), and in the learner's language when it fails. */
export interface PanelNames {
  log: string;
  notLoaded: MessageKey;
  crashed: MessageKey;
}

export function lazyPanel<P extends object>(
  load: () => Promise<ComponentType<P>>,
  names: PanelNames,
): ComponentType<P & { fallback?: ReactNode }> {
  const what = names.log;
  let loaded: ComponentType<P> | null = null;
  let inflight: Promise<ComponentType<P>> | null = null;

  const get = (): Promise<ComponentType<P>> => {
    if (loaded) return Promise.resolve(loaded);
    inflight ??= load().then(
      (component) => {
        loaded = component;
        return component;
      },
      (error: unknown) => {
        inflight = null;
        throw error;
      },
    );
    return inflight;
  };

  function LazyPanel(props: P & { fallback?: ReactNode }) {
    const [status, setStatus] = useState<Status<P>>(() =>
      loaded ? { kind: 'ready', Component: loaded } : { kind: 'loading' },
    );

    useEffect(() => {
      if (status.kind !== 'loading') return;
      let alive = true;
      get().then(
        (Component) => {
          if (alive) setStatus({ kind: 'ready', Component });
        },
        (error: unknown) => {
          console.error(`[TypeScript Companion] ${what} could not load`, error);
          if (alive) {
            setStatus({ kind: 'failed', error: error instanceof Error ? error : new Error(String(error)) });
          }
        },
      );
      return () => {
        alive = false;
      };
    }, [status.kind]);

    if (status.kind === 'failed') return <PanelUnavailable title={names.notLoaded} error={status.error} />;
    if (status.kind === 'loading') return <>{props.fallback ?? null}</>;

    const { Component } = status;
    return (
      <Boundary
        label={what}
        fallback={(error, reset) => <PanelCrashed title={names.crashed} error={error} onRetry={reset} />}
      >
        <Component {...props} />
      </Boundary>
    );
  }

  LazyPanel.displayName = `LazyPanel(${what})`;
  return LazyPanel;
}

/** The panel's code could not be downloaded. */
function PanelUnavailable({ title, error }: { title: MessageKey; error: Error }) {
  const { t } = useT();
  const offline = !isOnline();
  return (
    <Callout tone="warn" title={t(title)}>
      <p>{offline ? t('ui.panelOffline') : t('ui.panelFailed')}</p>
      <div className="row" style={{ marginTop: 'var(--s-2)' }}>
        <Button size="sm" variant="primary" onClick={reloadApp}>
          {t('ui.reload')}
        </Button>
      </div>
      <ErrorDetails error={error} />
    </Callout>
  );
}

/** The panel loaded, then failed while drawing itself. */
function PanelCrashed({ title, error, onRetry }: { title: MessageKey; error: Error; onRetry: () => void }) {
  const { t } = useT();
  return (
    <Callout tone="warn" title={t(title)}>
      <p>{t('ui.panelCrashedBody')}</p>
      <div className="row" style={{ marginTop: 'var(--s-2)' }}>
        <Button size="sm" variant="primary" onClick={onRetry}>
          {t('ui.tryAgain')}
        </Button>
        <Button size="sm" variant="ghost" onClick={reloadApp}>
          {t('ui.reload')}
        </Button>
      </div>
      <ErrorDetails error={error} />
    </Callout>
  );
}

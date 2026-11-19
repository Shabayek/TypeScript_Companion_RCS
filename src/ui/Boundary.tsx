import { Component, type ErrorInfo, type ReactNode } from 'react';
import { markErrorHandled } from '../platform/capabilities';
import { useT } from '../i18n/t';

interface BoundaryProps {
  children: ReactNode;
  /** What to show instead of the children; `reset` re-renders them. */
  fallback: (error: Error, reset: () => void) => ReactNode;
  /** When this value changes, a caught error is cleared (e.g. the route). */
  resetKey?: unknown;
  /** Where the failure happened, for the local console log. */
  label: string;
}

interface BoundaryState {
  error: Error | null;
}

function asError(value: unknown): Error {
  return value instanceof Error ? value : new Error(String(value));
}

/**
 * A local error boundary. It keeps one broken part of the app (a screen, an
 * editor panel) from taking everything else down with it. The app-wide
 * boundary in `app/ErrorBoundary.tsx` remains the last resort.
 */
export class Boundary extends Component<BoundaryProps, BoundaryState> {
  override state: BoundaryState = { error: null };

  static getDerivedStateFromError(error: unknown): BoundaryState {
    return { error: asError(error) };
  }

  override componentDidCatch(error: unknown, info: ErrorInfo): void {
    markErrorHandled(error);
    // Local only: no telemetry, by design.
    console.error(`[TypeScript Companion] ${this.props.label} failed`, error, info.componentStack);
  }

  override componentDidUpdate(previous: BoundaryProps): void {
    if (this.state.error && !Object.is(previous.resetKey, this.props.resetKey)) {
      this.setState({ error: null });
    }
  }

  private readonly reset = () => {
    this.setState({ error: null });
  };

  override render(): ReactNode {
    const { error } = this.state;
    if (!error) return this.props.children;
    return this.props.fallback(error, this.reset);
  }
}

/** Technical details, folded away: useful to a parent or teacher, not a learner. */
export function ErrorDetails({ error }: { error: Error }) {
  const { t } = useT();
  return (
    <details className="error-details">
      <summary>{t('ui.technicalDetails')}</summary>
      <pre dir="ltr">{error.message || String(error)}</pre>
    </details>
  );
}

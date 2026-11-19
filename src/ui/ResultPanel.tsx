import type { GradeOutcome } from '../runner';
import { Mascot } from './Mascot';
import { useT } from '../i18n/t';
import { renderText } from '../i18n/text';

const TONE: Record<GradeOutcome['kind'], { icon: string; color: string; bg: string }> = {
  pass: { icon: '✓', color: 'var(--success)', bg: 'var(--success-soft)' },
  fail: { icon: '✎', color: 'var(--warn)', bg: 'var(--warn-soft)' },
  error: { icon: '!', color: 'var(--warn)', bg: 'var(--warn-soft)' },
  timeout: { icon: '⏱', color: 'var(--warn)', bg: 'var(--warn-soft)' },
  unavailable: { icon: 'i', color: 'var(--ink-muted)', bg: 'var(--surface-2)' },
};

export function ResultPanel({
  outcome,
  logs,
  running,
}: {
  outcome: GradeOutcome | null;
  logs: readonly string[];
  running?: boolean;
}) {
  // Results are kept as messages and worded here, so a language switch
  // re-words a result already on screen.
  const { t } = useT();
  if (running) {
    return (
      <div className="result-panel" role="status" aria-live="polite">
        <div className="row">
          <span className="spinner" aria-hidden="true" />
          <span>
            {t('runner.checking')}
            <span className="muted" style={{ display: 'block', fontSize: 'var(--text--1)' }}>
              {t('runner.checkingNote')}
            </span>
          </span>
        </div>
      </div>
    );
  }

  if (!outcome && logs.length === 0) {
    return (
      <div className="result-panel result-panel--idle">
        <div className="row" style={{ alignItems: 'flex-start' }}>
          <Mascot pose="idle" size={48} />
          <p className="muted" style={{ margin: 0 }}>
            {t('runner.idle')}
          </p>
        </div>
      </div>
    );
  }

  const tone = outcome ? TONE[outcome.kind] : TONE.pass;

  return (
    <div
      className="result-panel"
      role="status"
      aria-live="polite"
      style={{ borderColor: tone.color, background: tone.bg }}
    >
      <div className="row" style={{ alignItems: 'flex-start', gap: 'var(--s-3)' }}>
        <span
          aria-hidden="true"
          style={{
            width: 26,
            height: 26,
            flex: '0 0 auto',
            borderRadius: '50%',
            display: 'grid',
            placeItems: 'center',
            background: tone.color,
            color: 'var(--paper)',
            fontWeight: 800,
            fontSize: 14,
          }}
        >
          {tone.icon}
        </span>
        <div style={{ flex: 1 }}>
          {outcome ? <p style={{ fontWeight: 700, margin: 0 }}>{renderText(outcome.headline, t)}</p> : null}
          {outcome && outcome.details.length > 0 ? (
            <ul className="result-list">
              {outcome.details.map((detail, index) => (
                <li key={index} className="result-list__item" style={{ color: 'var(--ink-soft)' }}>
                  {renderText(detail, t)}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>

      {logs.length > 0 ? (
        <div className="result-logs">
          <div className="eyebrow">{t('runner.output')}</div>
          <pre dir="ltr">{logs.join('\n')}</pre>
        </div>
      ) : null}
    </div>
  );
}

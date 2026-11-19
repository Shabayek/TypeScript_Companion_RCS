import type { ReactNode } from 'react';
import { useT } from '../i18n/t';

type Tone = 'tip' | 'warn' | 'gotcha' | 'why';

const ICONS: Record<Tone, 'ui.calloutTip' | 'ui.calloutWarn' | 'ui.calloutGotcha' | 'ui.calloutWhy'> = {
  tip: 'ui.calloutTip',
  warn: 'ui.calloutWarn',
  gotcha: 'ui.calloutGotcha',
  why: 'ui.calloutWhy',
};

export function Card({
  children,
  className = '',
  pad = 'md',
  role,
  as: Tag = 'div',
}: {
  children: ReactNode;
  className?: string | undefined;
  pad?: 'md' | 'lg';
  role?: string | undefined;
  as?: 'div' | 'section' | 'article' | 'li';
}) {
  return (
    <Tag
      role={role}
      className={['card', pad === 'lg' ? 'card--pad-lg' : '', className].filter(Boolean).join(' ')}
    >
      {children}
    </Tag>
  );
}

export function Badge({
  children,
  tone = 'default',
  title,
}: {
  children: ReactNode;
  tone?: 'default' | 'accent' | 'warm' | 'success';
  title?: string | undefined;
}) {
  return (
    <span className={['badge', tone !== 'default' ? `badge--${tone}` : ''].filter(Boolean).join(' ')} title={title}>
      {children}
    </span>
  );
}

export function Callout({
  tone = 'tip',
  title,
  children,
}: {
  tone?: Tone;
  title?: string;
  children: ReactNode;
}) {
  const { t } = useT();
  return (
    <div className={`callout callout--${tone}`} role="note">
      <div>
        <div className="callout__title">{title ?? t(ICONS[tone])}</div>
        <div>{children}</div>
      </div>
    </div>
  );
}

export function ProgressRing({
  value,
  size = 44,
  label,
}: {
  /** 0..1 */
  value: number;
  size?: number;
  label?: string;
}) {
  const { t } = useT();
  const clamped = Math.max(0, Math.min(1, value));
  const stroke = 5;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped);

  return (
    <span className="progress-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle
          className="progress-ring__track"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
        />
        <circle
          className="progress-ring__value"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <span className="progress-ring__label" aria-hidden="true">
        {label ?? `${Math.round(clamped * 100)}`}
      </span>
      <span className="sr-only">{t('ui.percentComplete', { percent: Math.round(clamped * 100) })}</span>
    </span>
  );
}

export function StepDots({
  count,
  index,
  states,
}: {
  count: number;
  index: number;
  states: readonly ('todo' | 'done' | 'practiced')[];
}) {
  return (
    <div className="dots" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <span
          key={i}
          className="dot"
          data-state={i === index ? 'current' : (states[i] ?? 'todo')}
        />
      ))}
    </div>
  );
}

export function EmptyState({
  title,
  children,
  art,
  action,
}: {
  title: string;
  children?: ReactNode;
  art?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      {art ? <div className="empty-state__art">{art}</div> : null}
      <h2 style={{ color: 'var(--ink)' }}>{title}</h2>
      {children ? <p style={{ marginTop: '0.5rem' }}>{children}</p> : null}
      {action ? <div style={{ marginTop: '1rem' }}>{action}</div> : null}
    </div>
  );
}

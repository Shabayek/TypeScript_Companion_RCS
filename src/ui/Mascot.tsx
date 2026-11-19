import { useJourney } from '../storage/store';

export type MascotPose = 'idle' | 'thinking' | 'cheering' | 'hmm' | 'waving' | 'sleepy' | 'curious';

const MOUTHS: Record<MascotPose, string> = {
  idle: 'M62 96 Q80 108 98 96',
  thinking: 'M70 99 Q80 103 90 99',
  cheering: 'M60 92 Q80 114 100 92 Z',
  hmm: 'M68 100 L92 100',
  waving: 'M62 96 Q80 110 98 96',
  sleepy: 'M72 100 Q80 104 88 100',
  curious: 'M74 98 Q80 106 86 98 Q80 94 74 98 Z',
};

const EYES: Record<MascotPose, { left: string; right: string }> = {
  idle: { left: 'M60 78 q6 -6 12 0', right: 'M88 78 q6 -6 12 0' },
  thinking: { left: 'M60 78 q6 -6 12 0', right: 'M88 76 q6 -3 12 0' },
  cheering: { left: 'M60 80 q6 -9 12 0', right: 'M88 80 q6 -9 12 0' },
  hmm: { left: 'M60 78 L72 78', right: 'M88 74 L100 78' },
  waving: { left: 'M60 78 q6 -6 12 0', right: 'M88 78 q6 -6 12 0' },
  sleepy: { left: 'M60 80 q6 4 12 0', right: 'M88 80 q6 4 12 0' },
  curious: { left: 'M60 76 q6 -8 12 0', right: 'M88 78 q6 -3 12 0' },
};

/** Arm paths, [left, right], by pose. */
const ARMS: Partial<Record<MascotPose, readonly [string, string]>> = {
  cheering: ['M52 118 L36 104', 'M108 118 L124 104'],
  waving: ['M52 120 L38 128', 'M108 118 L126 98'],
  curious: ['M52 120 L38 128', 'M108 118 L118 106'],
};
const RESTING_ARMS = ['M52 120 L38 128', 'M108 120 L122 128'] as const;

/**
 * Tess, the very small type-checking robot. Decorative: always `aria-hidden`,
 * because every message she carries is also written in the surrounding text.
 */
export function Mascot({
  pose = 'idle',
  size = 96,
  className,
}: {
  pose?: MascotPose;
  size?: number;
  className?: string;
}) {
  // Settings → "Tess the mascot". Purely decorative, so hiding her removes
  // nothing a learner needs.
  const visible = useJourney((store) => store.state.settings.mascot);
  if (!visible) return null;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 160 160"
      className={className}
      aria-hidden="true"
      focusable="false"
      data-pose={pose}
    >
      <ellipse cx="80" cy="150" rx="34" ry="5" fill="var(--ink)" opacity="0.09" />
      {/* antenna */}
      <line x1="80" y1="30" x2="80" y2="46" stroke="var(--accent-strong)" strokeWidth="4" strokeLinecap="round" />
      <circle cx="80" cy="24" r="7" fill="var(--warm)" />
      {/* head */}
      <rect x="40" y="44" width="80" height="64" rx="22" fill="var(--accent)" />
      <rect x="48" y="52" width="64" height="44" rx="15" fill="var(--surface)" opacity="0.94" />
      {/* eyes */}
      <path d={EYES[pose].left} stroke="var(--ink)" strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d={EYES[pose].right} stroke="var(--ink)" strokeWidth="5" fill="none" strokeLinecap="round" />
      {/* mouth */}
      <path
        d={MOUTHS[pose]}
        stroke="var(--ink)"
        strokeWidth="4"
        fill={pose === 'cheering' || pose === 'curious' ? 'var(--warm)' : 'none'}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* cheeks */}
      <circle cx="52" cy="90" r="4" fill="var(--warm)" opacity="0.55" />
      <circle cx="108" cy="90" r="4" fill="var(--warm)" opacity="0.55" />
      {/* body */}
      <rect x="52" y="112" width="56" height="30" rx="14" fill="var(--accent-strong)" />
      <rect x="66" y="122" width="28" height="8" rx="4" fill="var(--paper)" opacity="0.55" />
      {/* arms */}
      <path d={(ARMS[pose] ?? RESTING_ARMS)[0]} stroke="var(--accent-strong)" strokeWidth="7" strokeLinecap="round" />
      <path
        d={(ARMS[pose] ?? RESTING_ARMS)[1]}
        stroke="var(--accent-strong)"
        strokeWidth="7"
        strokeLinecap="round"
        className={pose === 'waving' ? 'mascot-wave' : undefined}
      />
      {/* a sleepy "z", a curious question mark */}
      {pose === 'sleepy' ? (
        <text x="118" y="50" fontSize="20" fontWeight="700" fill="var(--ink-muted)" fontFamily="var(--font-ui)">
          z
        </text>
      ) : null}
      {pose === 'curious' ? (
        <text x="120" y="46" fontSize="24" fontWeight="800" fill="var(--warm)" fontFamily="var(--font-ui)">
          ?
        </text>
      ) : null}
    </svg>
  );
}

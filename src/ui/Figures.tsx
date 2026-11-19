import type { FigureId } from '../content/schema';
import { useT } from '../i18n/t';

const label = {
  fontFamily: 'var(--font-ui)',
  fontSize: 12,
  fontWeight: 600,
  fill: 'var(--ink-soft)',
};

const mono = { fontFamily: 'var(--font-mono)', fontSize: 13, fill: 'var(--ink)' };

/**
 * Splits a label in two when it is longer than `max` characters: at the
 * space (or after the hyphen) nearest its middle.
 */
export function wrapLabel(text: string, max: number): string[] {
  if (text.length <= max) return [text];
  const middle = text.length / 2;
  let best = -1;
  for (let i = 1; i < text.length - 1; i += 1) {
    const breakable = text[i] === ' ' || text[i - 1] === '-';
    if (breakable && (best < 0 || Math.abs(i - middle) < Math.abs(best - middle))) best = i;
  }
  if (best < 0) return [text];
  return text[best] === ' ' ? [text.slice(0, best), text.slice(best + 1)] : [text.slice(0, best), text.slice(best)];
}

/**
 * A centred label of one or two lines (SVG text does not wrap by itself).
 * A line still longer than `max` characters (one long word) is drawn
 * smaller, so it stays inside its shape in every language.
 */
function Label({
  x,
  y,
  text,
  max,
  style,
}: {
  x: number;
  y: number;
  text: string;
  max: number;
  style: { fontSize: number } & Record<string, unknown>;
}) {
  const lines = wrapLabel(text, max);
  const longest = Math.max(...lines.map((line) => line.length));
  const fontSize = longest > max ? Math.max(6, (style.fontSize * max) / longest) : style.fontSize;
  return (
    <text x={x} y={y} textAnchor="middle" style={{ ...style, fontSize }}>
      {lines.map((line, index) => (
        <tspan key={index} x={x} dy={index === 0 ? (lines.length > 1 ? -5 : 0) : 11}>
          {line}
        </tspan>
      ))}
    </text>
  );
}

/**
 * Small geometric diagrams, drawn by hand, in the app's own palette. They are
 * decorative reinforcement for the prose, so each one is `aria-hidden`.
 */
export function Figure({ id }: { id: FigureId }) {
  const { t } = useT();
  return (
    <svg
      // The geometry reads left to right in every language; only the words change.
      direction="ltr"
      viewBox="0 0 320 150"
      role="img"
      aria-hidden="true"
      focusable="false"
      style={{ width: '100%', maxWidth: 420, height: 'auto' }}
    >
      {id === 'first-code' && (
        <>
          <rect x="20" y="18" width="180" height="112" rx="12" fill="var(--surface-2)" stroke="var(--line-strong)" />
          <rect x="20" y="18" width="180" height="22" rx="11" fill="var(--surface-3)" />
          <text x="36" y="62" style={mono}>console.log(</text>
          <text x="36" y="84" style={{ ...mono, fill: 'var(--success)' }}>"hello"</text>
          <text x="36" y="106" style={mono}>);</text>
          <path d="M210 74h34" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" />
          <path d="M240 68l8 6-8 6" fill="none" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" />
          <rect x="256" y="56" width="48" height="36" rx="8" fill="var(--accent-soft)" />
          <text x="280" y="79" textAnchor="middle" style={mono}>hello</text>
          <text x="110" y="146" textAnchor="middle" style={label}>{t('figure.codeInWordsOut')}</text>
        </>
      )}

      {id === 'type-check' && (
        <>
          <circle cx="86" cy="70" r="42" fill="var(--accent-soft)" stroke="var(--accent)" strokeWidth="2" />
          <text x="86" y="76" textAnchor="middle" style={mono}>42</text>
          <text x="86" y="126" textAnchor="middle" style={label}>{t('figure.aValue')}</text>
          <path d="M140 70h44" stroke="var(--line-strong)" strokeWidth="2" strokeDasharray="5 5" />
          <rect x="196" y="38" width="104" height="64" rx="12" fill="var(--surface)" stroke="var(--accent)" strokeWidth="2" />
          <text x="248" y="66" textAnchor="middle" style={mono}>number</text>
          <path d="M232 84l10 10 20-22" stroke="var(--success)" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <text x="248" y="126" textAnchor="middle" style={label}>{t('figure.itsType')}</text>
        </>
      )}

      {id === 'let-const' && (
        <>
          <rect x="18" y="30" width="136" height="80" rx="12" fill="var(--warn-soft)" stroke="var(--warm)" />
          <text x="34" y="58" style={{ ...mono, fontWeight: 700 }}>let</text>
          <text x="34" y="82" style={{ ...label, fontSize: 11 }}>{t('figure.changesLater')}</text>
          <path d="M74 88l24-14" stroke="var(--warm)" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M92 74h8v8" fill="none" stroke="var(--warm)" strokeWidth="2.5" strokeLinecap="round" />
          <rect x="166" y="30" width="136" height="80" rx="12" fill="var(--success-soft)" stroke="var(--success)" />
          <text x="182" y="58" style={{ ...mono, fontWeight: 700 }}>const</text>
          <text x="182" y="82" style={{ ...label, fontSize: 11 }}>{t('figure.staysPut')}</text>
          <path d="M238 82l8-8 8 8-8 8z" fill="none" stroke="var(--success)" strokeWidth="2.5" />
        </>
      )}

      {id === 'branch' && (
        <>
          <rect x="124" y="12" width="72" height="34" rx="9" fill="var(--surface-2)" stroke="var(--line-strong)" />
          <text x="160" y="34" textAnchor="middle" style={label}>{t('figure.aQuestion')}</text>
          <path d="M160 46v18M160 64H70v34M160 64h90v34" stroke="var(--line-strong)" strokeWidth="2" fill="none" />
          <rect x="24" y="98" width="92" height="36" rx="9" fill="var(--accent-soft)" stroke="var(--accent)" />
          <text x="70" y="121" textAnchor="middle" style={label}>{t('figure.yes')}</text>
          <rect x="204" y="98" width="92" height="36" rx="9" fill="var(--surface-2)" stroke="var(--line-strong)" />
          <text x="250" y="121" textAnchor="middle" style={label}>{t('figure.no')}</text>
        </>
      )}

      {id === 'array' && (
        <>
          {[0, 1, 2, 3].map((i) => (
            <rect key={i} x={38 + i * 66} y="46" width="56" height="56" rx="10" fill={i === 1 ? 'var(--accent-soft)' : 'var(--surface-2)'} stroke={i === 1 ? 'var(--accent)' : 'var(--line-strong)'} strokeWidth="2" />
          ))}
          {['apples', 'pears', 'plums', 'figs'].map((word, i) => (
            <text key={word} x={66 + i * 66} y="80" textAnchor="middle" style={{ ...label, fontSize: 10 }}>{word}</text>
          ))}
          {[0, 1, 2, 3].map((i) => (
            <text key={i} x={66 + i * 66} y="128" textAnchor="middle" style={{ ...label, fontSize: 10 }}>[{i}]</text>
          ))}
          <text x="66" y="34" textAnchor="middle" style={{ ...label, fontSize: 10, fill: 'var(--accent)' }}>{t('figure.index1')}</text>
        </>
      )}

      {id === 'object' && (
        <>
          <rect x="70" y="20" width="180" height="106" rx="14" fill="var(--surface)" stroke="var(--accent)" strokeWidth="2" />
          <text x="90" y="50" style={mono}>name:</text>
          <text x="160" y="50" style={{ ...mono, fill: 'var(--success)' }}>"Ada"</text>
          <text x="90" y="78" style={mono}>age:</text>
          <text x="160" y="78" style={{ ...mono, fill: 'var(--warm)' }}>36</text>
          <text x="90" y="106" style={mono}>ready:</text>
          <text x="160" y="106" style={{ ...mono, fill: 'var(--indigo)' }}>true</text>
        </>
      )}

      {id === 'function' && (
        <>
          <rect x="30" y="52" width="58" height="40" rx="10" fill="var(--warn-soft)" stroke="var(--warm)" />
          <text x="59" y="78" textAnchor="middle" style={label}>{t('figure.input')}</text>
          <path d="M92 72h40" stroke="var(--line-strong)" strokeWidth="2" strokeDasharray="4 4" />
          <rect x="136" y="26" width="62" height="92" rx="12" fill="var(--accent-soft)" stroke="var(--accent)" strokeWidth="2" />
          <text x="167" y="78" textAnchor="middle" style={label}>{t('figure.recipe')}</text>
          <path d="M202 72h40" stroke="var(--line-strong)" strokeWidth="2" strokeDasharray="4 4" />
          <rect x="246" y="52" width="56" height="40" rx="10" fill="var(--success-soft)" stroke="var(--success)" />
          <text x="274" y="78" textAnchor="middle" style={label}>{t('figure.result')}</text>
        </>
      )}

      {id === 'union' && (
        <>
          <rect x="18" y="40" width="84" height="60" rx="12" fill="var(--accent-soft)" stroke="var(--accent)" />
          <text x="60" y="76" textAnchor="middle" style={mono}>string</text>
          <text x="126" y="76" textAnchor="middle" style={{ ...mono, fontSize: 18 }}>|</text>
          <rect x="146" y="40" width="84" height="60" rx="12" fill="var(--warm-soft)" stroke="var(--warm)" />
          <text x="188" y="76" textAnchor="middle" style={mono}>number</text>
          <rect x="244" y="46" width="62" height="48" rx="10" fill="var(--surface-2)" stroke="var(--line-strong)" />
          <text x="275" y="76" textAnchor="middle" style={{ ...label, fontSize: 9 }}>{t('figure.either')}</text>
        </>
      )}

      {id === 'narrow' && (
        <>
          <rect x="24" y="28" width="272" height="94" rx="14" fill="var(--surface-2)" stroke="var(--line-strong)" />
          <text x="42" y="56" style={{ ...mono, fontSize: 11 }}>if (typeof value === "string")</text>
          <rect x="42" y="70" width="110" height="34" rx="8" fill="var(--accent-soft)" stroke="var(--accent)" />
          <text x="97" y="92" textAnchor="middle" style={{ ...label, fontSize: 10 }}>{t('figure.nowString')}</text>
          <text x="170" y="92" style={{ ...label, fontSize: 11 }}>{t('figure.insideHere')}</text>
        </>
      )}

      {id === 'promise' && (
        <>
          <rect x="20" y="52" width="80" height="44" rx="10" fill="var(--surface-2)" stroke="var(--line-strong)" />
          <text x="60" y="79" textAnchor="middle" style={label}>{t('figure.ask')}</text>
          <path d="M104 74h52" stroke="var(--line-strong)" strokeWidth="2" strokeDasharray="5 5" />
          <text x="130" y="62" textAnchor="middle" style={{ ...label, fontSize: 9 }}>{t('figure.later')}</text>
          <rect x="160" y="52" width="70" height="44" rx="10" fill="var(--warn-soft)" stroke="var(--warm)" />
          <text x="195" y="79" textAnchor="middle" style={label}>{t('figure.wait')}</text>
          <path d="M234 74h38" stroke="var(--line-strong)" strokeWidth="2" strokeDasharray="5 5" />
          <rect x="276" y="52" width="30" height="44" rx="10" fill="var(--success-soft)" stroke="var(--success)" />
          <path d="M284 74l6 6 12-14" stroke="var(--success)" strokeWidth="3" fill="none" strokeLinecap="round" />
        </>
      )}

      {id === 'venn-union' && (
        <>
          <circle cx="124" cy="68" r="50" fill="var(--accent-soft)" stroke="var(--accent)" strokeWidth="2" />
          <circle cx="196" cy="68" r="50" fill="var(--warm-soft)" stroke="var(--warm)" strokeWidth="2" fillOpacity="0.85" />
          <text x="104" y="73" textAnchor="middle" style={mono}>string</text>
          <text x="216" y="73" textAnchor="middle" style={mono}>number</text>
          <text x="160" y="136" textAnchor="middle" style={{ ...mono, fontWeight: 700 }}>string | number</text>
          <text x="160" y="148" textAnchor="middle" style={{ ...label, fontSize: 10 }}>{t('figure.eitherOne')}</text>
        </>
      )}

      {id === 'venn-intersection' && (
        <>
          <defs>
            <clipPath id="figure-venn-left">
              <circle cx="122" cy="62" r="58" />
            </clipPath>
          </defs>
          <circle cx="122" cy="62" r="58" fill="var(--surface-2)" stroke="var(--accent)" strokeWidth="2" />
          <circle cx="198" cy="62" r="58" fill="var(--surface-2)" stroke="var(--warm)" strokeWidth="2" fillOpacity="0.6" />
          <circle cx="198" cy="62" r="58" fill="var(--success-soft)" stroke="var(--success)" strokeWidth="2.5" clipPath="url(#figure-venn-left)" />
          <Label x={100} y={66} text={t('figure.hasName')} max={9} style={{ ...label, fontSize: 10 }} />
          <Label x={220} y={66} text={t('figure.hasAge')} max={9} style={{ ...label, fontSize: 10 }} />
          <Label x={160} y={66} text={t('figure.both')} max={6} style={{ ...label, fontSize: 9, fill: 'var(--ink)' }} />
          <text x="160" y="136" textAnchor="middle" style={{ ...mono, fontWeight: 700 }}>Named &amp; Aged</text>
          <text x="160" y="148" textAnchor="middle" style={{ ...label, fontSize: 10 }}>{t('figure.bothAtOnce')}</text>
        </>
      )}

      {id === 'mapped' && (
        <>
          <text x="160" y="20" textAnchor="middle" style={{ ...mono, fontSize: 12, fill: 'var(--accent)' }}>[K in keyof T]?: T[K]</text>
          <rect x="6" y="34" width="122" height="72" rx="12" fill="var(--surface)" stroke="var(--line-strong)" strokeWidth="2" />
          <text x="16" y="63" style={{ ...mono, fontSize: 12 }}>name: string</text>
          <text x="16" y="87" style={{ ...mono, fontSize: 12 }}>age: number</text>
          <path d="M136 70h40" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" />
          <path d="M172 64l8 6-8 6" fill="none" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" />
          <rect x="186" y="34" width="128" height="72" rx="12" fill="var(--accent-soft)" stroke="var(--accent)" strokeWidth="2" />
          <text x="196" y="63" style={{ ...mono, fontSize: 12 }}>name?: string</text>
          <text x="196" y="87" style={{ ...mono, fontSize: 12 }}>age?: number</text>
          <text x="160" y="134" textAnchor="middle" style={label}>{t('figure.everyKey')}</text>
        </>
      )}

      {id === 'conditional' && (
        <>
          <rect x="74" y="10" width="172" height="34" rx="9" fill="var(--surface-2)" stroke="var(--line-strong)" />
          <text x="160" y="32" textAnchor="middle" style={{ ...mono, fontSize: 12 }}>T extends string ?</text>
          <path d="M160 44v16M160 60H78v30M160 60h84v30" stroke="var(--line-strong)" strokeWidth="2" fill="none" />
          <rect x="22" y="90" width="112" height="40" rx="9" fill="var(--success-soft)" stroke="var(--success)" />
          <text x="78" y="108" textAnchor="middle" style={{ ...label, fontSize: 10 }}>{t('figure.yes')}</text>
          <text x="78" y="123" textAnchor="middle" style={{ ...mono, fontSize: 12 }}>"text"</text>
          <rect x="188" y="90" width="112" height="40" rx="9" fill="var(--warn-soft)" stroke="var(--warm)" />
          <text x="244" y="108" textAnchor="middle" style={{ ...label, fontSize: 10 }}>{t('figure.no')}</text>
          <text x="244" y="123" textAnchor="middle" style={{ ...mono, fontSize: 12 }}>"other"</text>
        </>
      )}

      {id === 'event-loop' && (
        <>
          {[
            { x: 8, fill: 'var(--accent-soft)', stroke: 'var(--accent)', text: t('figure.yourCode') },
            { x: 112, fill: 'var(--success-soft)', stroke: 'var(--success)', text: t('figure.promiseJobs') },
            { x: 216, fill: 'var(--warn-soft)', stroke: 'var(--warm)', text: t('figure.timers') },
          ].map((lane, i) => (
            <g key={lane.x}>
              <rect x={lane.x} y="40" width="96" height="60" rx="12" fill={lane.fill} stroke={lane.stroke} strokeWidth="2" />
              <circle cx={lane.x + 48} cy="40" r="12" fill="var(--surface)" stroke={lane.stroke} strokeWidth="2" />
              <text x={lane.x + 48} y="45" textAnchor="middle" style={{ ...label, fontSize: 13, fill: 'var(--ink)' }}>{i + 1}</text>
              <Label x={lane.x + 48} y={76} text={lane.text} max={13} style={{ ...label, fontSize: 10 }} />
            </g>
          ))}
          <path d="M104 70h8M208 70h8" stroke="var(--line-strong)" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M264 104c0 26-208 26-208 0" stroke="var(--line-strong)" strokeWidth="2" fill="none" strokeDasharray="5 5" />
          <text x="160" y="140" textAnchor="middle" style={label}>{t('figure.loopOrder')}</text>
        </>
      )}

      {id === 'journey' && (
        <>
          <path d="M30 118c40 0 34-58 74-58s34 58 74 58 34-58 74-58 26 22 38 30" stroke="var(--accent)" strokeWidth="3" fill="none" strokeDasharray="6 6" strokeLinecap="round" />
          {[30, 104, 178, 252, 300].map((cx, i) => (
            <circle key={cx} cx={cx} cy={i % 2 === 0 ? 116 : 58} r="9" fill={i < 2 ? 'var(--success)' : 'var(--surface)'} stroke="var(--accent)" strokeWidth="2.5" />
          ))}
          <text x="160" y="142" textAnchor="middle" style={label}>{t('figure.smallSteps')}</text>
        </>
      )}
    </svg>
  );
}

import { useState, type ReactNode } from 'react';
import { copyText } from '../platform/capabilities';
import { useEngine } from '../platform/useEngine';
import type { CompilerFlags } from '../content/schema';
import type { TypeSpan } from '../runner/typecheckCore';
import { inspectTypes } from '../runner/typecheckClient';
import { tokenise } from './tokens';
import { useT } from '../i18n/t';
import { renderText, type Text } from '../i18n/text';

/** A run of characters with one highlight class, maybe a name with a known type. */
interface Piece {
  text: string;
  cls: string;
  /** Index into the type spans, for a name that can be tapped. */
  span?: number;
}

/**
 * Splits highlighted code into lines of pieces (a token such as a comment or
 * a template string can span several lines). Each line is rendered as its
 * own block so long lines wrap with a hanging indent instead of being cut
 * off. With type spans, each name becomes its own piece.
 */
export function codeLines(code: string, spans: readonly TypeSpan[] = []): Piece[][] {
  const cls: string[] = [];
  for (const token of tokenise(code)) for (let i = 0; i < token.text.length; i += 1) cls.push(token.cls);
  const owner = new Array<number | undefined>(code.length).fill(undefined);
  spans.forEach((span, index) => {
    for (let i = Math.max(0, span.start); i < Math.min(code.length, span.end); i += 1) owner[i] = index;
  });

  const lines: Piece[][] = [[]];
  let current: Piece | null = null;
  for (let i = 0; i < code.length; i += 1) {
    const char = code[i] ?? '';
    if (char === '\n') {
      lines.push([]);
      current = null;
      continue;
    }
    const pieceCls = cls[i] ?? '';
    const span = owner[i];
    if (current && current.cls === pieceCls && current.span === span) {
      current.text += char;
    } else {
      current = { text: char, cls: pieceCls, ...(span !== undefined ? { span } : {}) };
      lines[lines.length - 1]?.push(current);
    }
  }
  return lines;
}

/** Wrapped parts of a line start two columns deeper than the line itself. */
function hangingIndent(line: readonly Piece[]): { paddingLeft: string; textIndent: string } {
  const text = line.map((piece) => piece.text).join('');
  const depth = (text.match(/^ */)?.[0].length ?? 0) + 2;
  return { paddingLeft: `${depth}ch`, textIndent: `-${depth}ch` };
}

type Inspection =
  | { status: 'off' }
  | { status: 'loading' }
  | { status: 'ready'; spans: TypeSpan[] }
  | { status: 'failed'; reason: Text };

export function CodeBlock({
  code,
  label,
  variant = 'dark',
  copy = true,
  inspect = false,
  flags,
  children,
}: {
  code: string;
  label?: string;
  variant?: 'dark' | 'light';
  copy?: boolean;
  /**
   * Offer "See types": tap a name and TypeScript's checker, running on the
   * device, says what type it has.
   */
  inspect?: boolean;
  /** Compiler flags for that check (a step's). */
  flags?: CompilerFlags;
  children?: ReactNode;
}) {
  const { t } = useT();
  const engine = useEngine();
  const [copied, setCopied] = useState(false);
  // What was inspected, and for which code, engine and flags: anything else
  // (new code, another engine) starts switched off again.
  const inspectedKey = JSON.stringify([code, engine, flags ?? {}]);
  const [state, setState] = useState<{ key: string; inspection: Inspection; selected: number | null }>({
    key: '',
    inspection: { status: 'off' },
    selected: null,
  });
  const current = state.key === inspectedKey ? state : { key: inspectedKey, inspection: { status: 'off' } as Inspection, selected: null };
  const inspection = current.inspection;
  const selected = current.selected;
  const setInspection = (update: (previous: Inspection) => Inspection) =>
    setState((previous) => {
      const base = previous.key === inspectedKey ? previous.inspection : ({ status: 'off' } as Inspection);
      return { key: inspectedKey, inspection: update(base), selected: previous.key === inspectedKey ? previous.selected : null };
    });
  const setSelected = (index: number | null) =>
    setState((previous) => ({ ...previous, key: inspectedKey, selected: index }));

  const handleCopy = () => {
    void copyText(code).then((ok) => {
      if (!ok) return;
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    });
  };

  const toggleTypes = () => {
    if (inspection.status !== 'off') {
      setState({ key: inspectedKey, inspection: { status: 'off' }, selected: null });
      return;
    }
    setInspection(() => ({ status: 'loading' }));
    void inspectTypes(code, { engine, ...(flags ? { flags } : {}) })
      .then(
        (result) =>
          setInspection((current) =>
            current.status !== 'loading'
              ? current
              : result.ok
                ? { status: 'ready', spans: result.value }
                : { status: 'failed', reason: result.reason },
          ),
        () => setInspection(() => ({ status: 'failed', reason: t('codeTypes.failed') })),
      );
  };

  const spans = inspection.status === 'ready' ? inspection.spans : [];
  const chosen = selected !== null ? spans[selected] : undefined;
  const showBar = Boolean(label || copy || inspect);

  return (
    <div className={`codeblock${variant === 'light' ? ' codeblock--light' : ''}`}>
      {showBar && (
        <div className="codeblock__bar">
          <span className="codeblock__label">{label ?? 'typescript'}</span>
          <span className="codeblock__actions">
            {inspect ? (
              <button
                type="button"
                className="btn btn--ghost btn--sm"
                aria-pressed={inspection.status !== 'off'}
                onClick={toggleTypes}
                style={{ color: 'inherit' }}
              >
                {t('codeTypes.toggle')}
              </button>
            ) : null}
            {copy ? (
              <button type="button" className="btn btn--ghost btn--sm" onClick={handleCopy} style={{ color: 'inherit' }}>
                {copied ? t('ui.copied') : t('ui.copy')}
              </button>
            ) : null}
          </span>
        </div>
      )}
      {/* A code sample can scroll horizontally, and scrollable content must be
          reachable by keyboard (WCAG 2.1.1). That is why a non-interactive
          <pre> takes focus here. */}
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex */}
      <pre tabIndex={0} dir="ltr" aria-label={label ? t('ui.codeOf', { label }) : t('ui.codeExample')}>
        <code>
          {codeLines(code, spans).map((line, lineIndex) => (
            <span key={lineIndex} className="codeblock__line" style={hangingIndent(line)}>
              {line.length === 0
                ? '\n'
                : line.map((piece, index) =>
                    piece.span !== undefined ? (
                      <button
                        key={index}
                        type="button"
                        className={`codeblock__name ${piece.cls}`}
                        aria-pressed={selected === piece.span}
                        onClick={() => setSelected(piece.span ?? null)}
                      >
                        {piece.text}
                      </button>
                    ) : piece.cls ? (
                      <span key={index} className={piece.cls}>
                        {piece.text}
                      </span>
                    ) : (
                      <span key={index}>{piece.text}</span>
                    ),
                  )}
            </span>
          ))}
        </code>
      </pre>
      {inspection.status !== 'off' ? (
        <div className="codeblock__types" role="status" aria-live="polite">
          {inspection.status === 'loading' ? t('codeTypes.loading') : null}
          {inspection.status === 'failed' ? renderText(inspection.reason, t) : null}
          {inspection.status === 'ready' ? (
            chosen ? (
              <code dir="ltr" className="codeblock__type">
                {chosen.display}
              </code>
            ) : spans.length > 0 ? (
              t('codeTypes.tapAName')
            ) : (
              t('codeTypes.none')
            )
          ) : null}
        </div>
      ) : null}
      {children}
    </div>
  );
}

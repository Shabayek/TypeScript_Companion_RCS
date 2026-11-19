import { useRef, useState, type KeyboardEvent } from 'react';
import type { EditorView } from '@codemirror/view';
import { cursorCharLeft, cursorCharRight, indentMore, undo } from '@codemirror/commands';
import { useT } from '../i18n/t';
import type { Messages } from '../i18n/messages';

/**
 * A row of the symbols code needs but phone keyboards hide two pages deep.
 * Shown only on touch screens (see `.symbolbar` in ui.css). Each button edits
 * the editor at the cursor and keeps the editor focused, so the on-screen
 * keyboard stays open.
 */
/** `id` names the key through the message catalogue (`symbol.<id>`). */
type Key =
  | { label: string; id: SymbolId; insert: string; caret?: number }
  | { label: string; id: SymbolId; run: (view: EditorView) => boolean };

type SymbolId = keyof Messages['symbol'];

export const SYMBOL_KEYS: readonly Key[] = [
  { label: '↶', id: 'undo', run: undo },
  { label: '←', id: 'left', run: cursorCharLeft },
  { label: '→', id: 'right', run: cursorCharRight },
  { label: 'Tab', id: 'tab', run: indentMore },
  { label: '{ }', id: 'curly', insert: '{}', caret: 1 },
  { label: '( )', id: 'round', insert: '()', caret: 1 },
  { label: '[ ]', id: 'square', insert: '[]', caret: 1 },
  { label: '" "', id: 'double', insert: '""', caret: 1 },
  { label: ';', id: 'semicolon', insert: ';' },
  { label: ':', id: 'colon', insert: ':' },
  { label: '=', id: 'equals', insert: '=' },
  { label: '=>', id: 'arrow', insert: '=> ' },
  { label: '.', id: 'dot', insert: '.' },
  { label: ',', id: 'comma', insert: ',' },
  { label: "' '", id: 'single', insert: "''", caret: 1 },
  { label: '` `', id: 'backticks', insert: '``', caret: 1 },
  { label: '${ }', id: 'slot', insert: '${}', caret: 2 },
  { label: '<', id: 'less', insert: '<' },
  { label: '>', id: 'greater', insert: '>' },
  { label: '+', id: 'plus', insert: '+' },
  { label: '-', id: 'minus', insert: '-' },
  { label: '*', id: 'times', insert: '*' },
  { label: '/', id: 'slash', insert: '/' },
  { label: '!', id: 'not', insert: '!' },
  { label: '?', id: 'question', insert: '?' },
  { label: '|', id: 'bar', insert: '|' },
  { label: '&', id: 'ampersand', insert: '&' },
];

/** Insert at the cursor; a pair wraps the selection, or puts the cursor inside. */
export function applyKey(view: EditorView, key: Key): void {
  if ('run' in key) {
    key.run(view);
  } else {
    const { from, to } = view.state.selection.main;
    const caret = key.caret ?? key.insert.length;
    const selected = view.state.sliceDoc(from, to);
    if (key.caret !== undefined && selected !== '') {
      const open = key.insert.slice(0, caret);
      const close = key.insert.slice(caret);
      view.dispatch({
        changes: { from, to, insert: open + selected + close },
        selection: { anchor: from + open.length, head: from + open.length + selected.length },
        userEvent: 'input',
      });
    } else {
      view.dispatch({
        changes: { from, to, insert: key.insert },
        selection: { anchor: from + caret },
        userEvent: 'input',
      });
    }
  }
  view.focus();
}

export function SymbolBar({ getView }: { getView: () => EditorView | null }) {
  const { t } = useT();
  const [active, setActive] = useState(0);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);

  // Toolbar pattern: one tab stop, arrow keys move between buttons.
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const last = SYMBOL_KEYS.length - 1;
    const next =
      event.key === 'ArrowRight' ? (active === last ? 0 : active + 1)
      : event.key === 'ArrowLeft' ? (active === 0 ? last : active - 1)
      : event.key === 'Home' ? 0
      : event.key === 'End' ? last
      : null;
    if (next === null) return;
    event.preventDefault();
    setActive(next);
    buttons.current[next]?.focus();
  };

  return (
    <div className="symbolbar" role="toolbar" aria-label={t('ui.symbols')} onKeyDown={onKeyDown}>
      {SYMBOL_KEYS.map((key, index) => (
        <button
          key={key.id}
          ref={(element) => {
            buttons.current[index] = element;
          }}
          type="button"
          className="symbolbar__key"
          aria-label={t(`symbol.${key.id}`)}
          title={t(`symbol.${key.id}`)}
          tabIndex={index === active ? 0 : -1}
          // Keep focus (and the on-screen keyboard) in the editor.
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => {
            setActive(index);
            const view = getView();
            if (view) applyKey(view, key);
          }}
        >
          {key.label}
        </button>
      ))}
    </div>
  );
}

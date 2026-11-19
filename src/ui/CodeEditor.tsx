import { useEffect, useRef } from 'react';
import { Compartment, EditorState } from '@codemirror/state';
import {
  EditorView,
  drawSelection,
  highlightActiveLine,
  highlightActiveLineGutter,
  highlightSpecialChars,
  keymap,
  lineNumbers,
  placeholder as placeholderExt,
} from '@codemirror/view';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { bracketMatching, indentOnInput } from '@codemirror/language';
import { javascript } from '@codemirror/lang-javascript';
import { SymbolBar } from './SymbolBar';
import { t } from '../i18n/t';

const theme = EditorView.theme({
  '&': {
    fontSize: '0.9rem',
    backgroundColor: 'var(--surface)',
    color: 'var(--ink)',
    borderRadius: 'var(--r-md)',
    border: '1.5px solid var(--line-strong)',
    overflow: 'hidden',
  },
  '&.cm-focused': { outline: '3px solid var(--accent)', outlineOffset: '2px' },
  '.cm-content': {
    fontFamily: 'var(--font-mono)',
    padding: '0.6rem 0',
    caretColor: 'var(--accent-strong)',
  },
  '.cm-scroller': { lineHeight: '1.6', overflow: 'auto' },
  '.cm-gutters': {
    backgroundColor: 'var(--surface-2)',
    color: 'var(--ink-muted)',
    border: 'none',
    borderRight: '1px solid var(--line)',
    fontFamily: 'var(--font-mono)',
  },
  '.cm-activeLine': { backgroundColor: 'var(--editor-active-line)' },
  '.cm-activeLineGutter': { backgroundColor: 'var(--surface-3)' },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground': {
    backgroundColor: 'var(--editor-selection)',
  },
});

const readOnlyCompartment = new Compartment();

export function CodeEditor({
  value,
  onChange,
  readOnly = false,
  ariaLabel,
  minHeight = 160,
  placeholder,
}: {
  value: string;
  onChange?: (next: string) => void;
  readOnly?: boolean;
  ariaLabel?: string;
  minHeight?: number;
  placeholder?: string;
}) {
  // Read once, when the editor is made: the label is part of its DOM.
  const fallbackLabel = t('ui.codeEditor');
  const host = useRef<HTMLDivElement>(null);
  const view = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!host.current) return;
    const state = EditorState.create({
      doc: value,
      extensions: [
        lineNumbers(),
        highlightActiveLineGutter(),
        highlightSpecialChars(),
        history(),
        drawSelection(),
        indentOnInput(),
        bracketMatching(),
        highlightActiveLine(),
        javascript({ typescript: true }),
        // Ctrl/⌘+Enter belongs to the page: it runs the checks (see
        // useCheckShortcut). Claim it here so it never inserts a blank line.
        keymap.of([{ key: 'Mod-Enter', run: () => true }, ...defaultKeymap, ...historyKeymap, indentWithTab]),
        EditorView.lineWrapping,
        theme,
        // The whole box is the editor (tapping the empty part focuses it).
        EditorView.theme({ '.cm-content, .cm-gutter': { minHeight: `${minHeight - 4}px` } }),
        readOnlyCompartment.of(EditorState.readOnly.of(readOnly)),
        placeholderExt(placeholder ?? ''),
        EditorView.contentAttributes.of({ 'aria-label': ariaLabel ?? fallbackLabel, 'aria-multiline': 'true' }),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) onChangeRef.current?.(update.state.doc.toString());
        }),
      ],
    });

    const instance = new EditorView({ state, parent: host.current });
    view.current = instance;
    return () => {
      instance.destroy();
      view.current = null;
    };
    // Intentionally mounted once per step; external value sync is handled below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const instance = view.current;
    if (!instance) return;
    const current = instance.state.doc.toString();
    if (current !== value) {
      instance.dispatch({ changes: { from: 0, to: current.length, insert: value } });
    }
  }, [value]);

  useEffect(() => {
    const instance = view.current;
    if (!instance) return;
    instance.dispatch({
      effects: readOnlyCompartment.reconfigure(EditorState.readOnly.of(readOnly)),
    });
  }, [readOnly]);

  return (
    <div className="code-editor">
      {/* Code reads left to right in every language, Arabic included. */}
      <div ref={host} dir="ltr" />
      {readOnly ? null : <SymbolBar getView={() => view.current} />}
    </div>
  );
}

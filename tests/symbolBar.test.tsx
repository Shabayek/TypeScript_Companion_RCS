import { describe, expect, it } from 'vitest';
import { EditorState, EditorSelection } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { history } from '@codemirror/commands';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SYMBOL_KEYS, applyKey } from '../src/ui/SymbolBar';
import { CodeEditor } from '../src/ui/CodeEditor';
import { t } from '../src/i18n/t';

const key = (name: string) => {
  const found = SYMBOL_KEYS.find((item) => t(`symbol.${item.id}`) === name);
  if (!found) throw new Error(name);
  return found;
};

function editor(doc: string, from: number, to = from) {
  return new EditorView({
    state: EditorState.create({ doc, selection: EditorSelection.single(from, to), extensions: [history()] }),
    parent: document.body,
  });
}

describe('symbol bar', () => {
  it('types a symbol at the cursor', () => {
    const view = editor('let x  1', 6);
    applyKey(view, key('Equals'));
    expect(view.state.doc.toString()).toBe('let x = 1');
    expect(view.state.selection.main.head).toBe(7);
    view.destroy();
  });

  it('puts the cursor inside a pair', () => {
    const view = editor('f', 1);
    applyKey(view, key('Round brackets'));
    expect(view.state.doc.toString()).toBe('f()');
    expect(view.state.selection.main.head).toBe(2);
    applyKey(view, key('Template slot'));
    expect(view.state.doc.toString()).toBe('f(${})');
    expect(view.state.selection.main.head).toBe(4);
    view.destroy();
  });

  it('wraps selected text in a pair', () => {
    const view = editor('say hi', 4, 6);
    applyKey(view, key('Double quotes'));
    expect(view.state.doc.toString()).toBe('say "hi"');
    expect(view.state.sliceDoc(view.state.selection.main.from, view.state.selection.main.to)).toBe('hi');
    view.destroy();
  });

  it('has one tab stop and arrow-key movement, and hides on read-only editors', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<CodeEditor value="x" onChange={() => undefined} />);
    const bar = screen.getByRole('toolbar', { name: 'Symbols' });
    const buttons = screen.getAllByRole('button');
    expect(buttons.filter((button) => button.tabIndex === 0)).toHaveLength(1);
    buttons[0]?.focus();
    await user.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(buttons[1]);
    await user.keyboard('{End}');
    expect(document.activeElement).toBe(buttons[buttons.length - 1]);
    expect(bar).toBeInTheDocument();

    rerender(<CodeEditor value="x" readOnly />);
    expect(screen.queryByRole('toolbar', { name: 'Symbols' })).toBeNull();
  });
});

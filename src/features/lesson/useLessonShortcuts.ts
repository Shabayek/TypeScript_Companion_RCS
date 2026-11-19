import { useEffect, useRef } from 'react';

/**
 * Ctrl/⌘ + Enter presses the check (or run) button, marked
 * `data-shortcut="check"`, inside the element marked `data-shortcut-scope`.
 *
 * Listens on the way *down* (capture), so the code editor never sees the key:
 * on Android, CodeMirror turns Enter into a new line from the DOM change
 * rather than from its keymap, so claiming the key in the editor is not
 * enough to stop a blank line appearing.
 */
export function useCheckShortcut(enabled = true): void {
  useEffect(() => {
    if (!enabled) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Enter' || !(event.ctrlKey || event.metaKey)) return;
      if (document.querySelector('[role="dialog"]')) return;
      const scope = document.querySelector('[data-shortcut-scope]');
      const button = scope?.querySelector<HTMLButtonElement>('[data-shortcut="check"]:not(:disabled)');
      if (!button) return;
      event.preventDefault();
      event.stopPropagation();
      button.click();
    };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [enabled]);
}

export interface LessonShortcutHandlers {
  next: () => void;
  back: () => void;
  hint: () => void;
  help: () => void;
}

/** Typing somewhere: letters belong to the text, not to shortcuts. */
function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  return Boolean(target.closest('input, textarea, select, [contenteditable="true"], .cm-editor'));
}

/**
 * Keyboard shortcuts in a lesson.
 *
 * - Ctrl/⌘ + Enter, in every mode and even in the code editor: check or run
 *   the current exercise (`useCheckShortcut`).
 * - Pro mode only, and never while typing: J next, K back, H hint, ? help.
 *
 * Nothing fires while a dialog is open.
 */
export function useLessonShortcuts(letters: boolean, handlers: LessonShortcutHandlers): void {
  const latest = useRef(handlers);
  latest.current = handlers;
  useCheckShortcut();

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented || document.querySelector('[role="dialog"]')) return;
      if (!letters || event.ctrlKey || event.metaKey || event.altKey || isTyping(event.target)) return;
      const key = event.key.toLowerCase();
      const action =
        key === 'j' ? latest.current.next : key === 'k' ? latest.current.back : key === 'h' ? latest.current.hint : event.key === '?' ? latest.current.help : null;
      if (!action) return;
      event.preventDefault();
      action();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [letters]);
}

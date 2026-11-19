import type { MessageKey, MessageParams } from './messages';

/**
 * Text that is translated when it is shown, not when it is made.
 *
 * Code results (a grading verdict, a friendly explanation of an error) are
 * computed once but may be read after the learner switches language. Keeping
 * them as message keys means the result on screen changes language with
 * everything else. A plain string is shown as it is: the compiler's own
 * words, a runtime error message, the learner's output.
 *
 * Deliberately free of the message catalogue itself, so the compiler and
 * sandbox workers can create messages without bundling any wording.
 */
export type Text = string | Msg;

export interface Msg {
  key: MessageKey;
  params?: Readonly<Record<string, string | number | Text>>;
}

export function msg(key: MessageKey, params?: Msg['params']): Msg {
  return params ? { key, params } : { key };
}

export type Translate = (key: MessageKey, params?: MessageParams) => string;

/** The text in the language `t` speaks (nested messages resolved first). */
export function renderText(text: Text, t: Translate): string {
  if (typeof text === 'string') return text;
  if (!text.params) return t(text.key);
  const params: Record<string, string | number> = {};
  for (const [name, value] of Object.entries(text.params)) {
    params[name] = typeof value === 'object' ? renderText(value, t) : value;
  }
  return t(text.key, params);
}


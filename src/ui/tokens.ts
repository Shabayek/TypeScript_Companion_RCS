/**
 * A very small TypeScript-flavoured highlighter. It exists so lesson code is
 * readable without shipping a syntax-highlighting dependency, and it renders
 * as React spans — never innerHTML — so snippets cannot inject markup.
 */

export interface Token {
  text: string;
  cls: string;
}

const KEYWORDS = new Set([
  'const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'switch',
  'case', 'break', 'continue', 'new', 'class', 'extends', 'implements', 'import', 'export',
  'from', 'default', 'async', 'await', 'try', 'catch', 'finally', 'throw', 'typeof',
  'instanceof', 'in', 'of', 'as', 'readonly', 'public', 'private', 'protected', 'static',
  'get', 'set', 'do', 'yield', 'delete', 'void',
]);

const TYPES = new Set([
  'string', 'number', 'boolean', 'any', 'unknown', 'never', 'object', 'symbol', 'bigint',
  'interface', 'type', 'enum', 'null', 'undefined', 'true', 'false', 'Array', 'Promise',
]);

const PATTERN = new RegExp(
  [
    '(\\/\\*[\\s\\S]*?\\*\\/|\\/\\/[^\\n]*)', // 1 comment
    '(`(?:\\\\[\\s\\S]|[^`\\\\])*`|"(?:\\\\[\\s\\S]|[^"\\\\])*"|\'(?:\\\\[\\s\\S]|[^\'\\\\])*\')', // 2 string
    '\\b(\\d+(?:\\.\\d+)?)\\b', // 3 number
    '\\b([A-Za-z_$][\\w$]*)\\b', // 4 word
  ].join('|'),
  'g',
);

export function tokenise(code: string): Token[] {
  const tokens: Token[] = [];
  let last = 0;
  let match: RegExpExecArray | null;

  while ((match = PATTERN.exec(code)) !== null) {
    if (match.index > last) {
      tokens.push({ text: code.slice(last, match.index), cls: '' });
    }
    const [full, comment, string, number, word] = match;
    if (comment) tokens.push({ text: full, cls: 'tok-com' });
    else if (string) tokens.push({ text: full, cls: 'tok-str' });
    else if (number) tokens.push({ text: full, cls: 'tok-num' });
    else if (word) {
      const after = code.slice(match.index + full.length);
      let cls = '';
      if (KEYWORDS.has(word)) cls = 'tok-kw';
      else if (TYPES.has(word)) cls = 'tok-type';
      else if (after.startsWith('(')) cls = 'tok-fn';
      tokens.push({ text: full, cls });
    }
    last = match.index + full.length;
  }

  if (last < code.length) tokens.push({ text: code.slice(last), cls: '' });
  return tokens;
}

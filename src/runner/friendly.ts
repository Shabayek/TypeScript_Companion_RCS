/**
 * Plain-language explanations for the messages beginners meet first.
 *
 * The compiler and the browser speak to programmers: a child who forgot the
 * quotes around `Hello, world` was told "The constant "world" must be
 * initialized". Each rule below recognises one classic message and says what
 * to do about it. The exact message is still shown underneath — reading real
 * errors is a skill the course teaches.
 */

const CURLY_DOUBLE = /[\u201C\u201D\u201E\u201F\u2033]/g;
const CURLY_SINGLE = /[\u2018\u2019\u201A\u201B\u2032]/g;

/** True when the code contains quotes a phone keyboard typed as curly quotes. */
export function hasCurlyQuotes(code: string): boolean {
  return /[\u201C\u201D\u201E\u201F\u2033\u2018\u2019\u201A\u201B\u2032]/.test(code);
}

/** Curly quotes (“ ” ‘ ’) turned into the straight quotes code uses (" '). */
export function straightenQuotes(code: string): string {
  return code.replace(CURLY_DOUBLE, '"').replace(CURLY_SINGLE, "'");
}

import { msg, type Msg } from '../i18n/text';

export const CURLY_QUOTES_NOTE: Msg = msg('runner.curlyQuotes');

interface Rule {
  pattern: RegExp;
  explain: (match: RegExpMatchArray) => Msg;
}

const g = (match: RegExpMatchArray, index: number) => match[index] ?? '';

/**
 * The classic way to get what each ES2022+ feature does, for the message a
 * Classic device shows (see docs/android.md). Code, so never translated.
 */
export const CLASSIC_WAY: Readonly<Record<string, string>> = {
  at: 'items[items.length - 1]',
  findLast: '[...items].reverse().find(…)',
  findLastIndex: 'a for loop from the end',
  toSorted: '[...items].sort(…)',
  toReversed: '[...items].reverse()',
  toSpliced: 'const copy = [...items]; copy.splice(…)',
  with: 'const copy = [...items]; copy[index] = value',
  hasOwn: 'Object.prototype.hasOwnProperty.call(object, key)',
  structuredClone: 'JSON.parse(JSON.stringify(value))',
};

const MODERN_NAMES = 'at|findLast|findLastIndex|toSorted|toReversed|toSpliced|with|hasOwn|groupBy|isWellFormed|toWellFormed|withResolvers|fromAsync';

function newerFeature(name: string): Msg {
  const instead = CLASSIC_WAY[name];
  return instead ? msg('friendly.newerFeatureInstead', { name, instead }) : msg('friendly.newerFeature', { name });
}

const RULES: readonly Rule[] = [
  { pattern: /Unexpected "[\u201C\u201D\u2018\u2019]"/, explain: () => msg('friendly.curlyQuote') },
  {
    // const greeting = Hello, world;  →  The constant "world" must be initialized
    pattern: /The constant "([^"]+)" must be initialized/,
    explain: (match) => msg('friendly.constNeedsValue', { name: g(match, 1) }),
  },
  { pattern: /Unterminated string literal/, explain: () => msg('friendly.unterminatedString') },
  { pattern: /Unterminated template literal/, explain: () => msg('friendly.unterminatedTemplate') },
  { pattern: /Unexpected end of file/, explain: () => msg('friendly.unexpectedEnd') },
  {
    pattern: /Expected "([^"]+)" but found end of file/,
    explain: (match) => msg('friendly.endsTooEarly', { token: g(match, 1) }),
  },
  {
    pattern: /Expected "([^"]+)" but found "([^"]+)"/,
    explain: (match) => msg('friendly.missingBefore', { expected: g(match, 1), found: g(match, 2) }),
  },
  {
    pattern: /Expected identifier but found "([^"]+)"/,
    explain: (match) => msg('friendly.nameMissing', { found: g(match, 1) }),
  },
  { pattern: /Unexpected "([})\]])"/, explain: (match) => msg('friendly.extraBracket', { bracket: g(match, 1) }) },
  { pattern: /Unexpected "([^"]+)"/, explain: (match) => msg('friendly.outOfPlace', { token: g(match, 1) }) },
  // TypeScript's type checker.
  {
    pattern: /Argument of type '(.+)' is not assignable to parameter of type '(.+)'/,
    explain: (match) => msg('friendly.argumentType', { given: g(match, 1), expected: g(match, 2) }),
  },
  {
    pattern: /Type '(.+)' is not assignable to type '(.+)'/,
    explain: (match) => msg('friendly.assignType', { given: g(match, 1), expected: g(match, 2) }),
  },
  {
    // A Classic device's library has no ES2022+ methods: TS2550.
    pattern: /Property '(.+)' does not exist on type '.+'\. Do you need to change your target library\?/,
    explain: (match) => newerFeature(g(match, 1)),
  },
  { pattern: /Cannot find name '(structuredClone)'/, explain: (match) => newerFeature(g(match, 1)) },
  {
    pattern: /Property '(.+)' does not exist on type '(.+)'/,
    explain: (match) => msg('friendly.noProperty', { property: g(match, 1), type: g(match, 2) }),
  },
  {
    // TypeScript's own advice here (change 'lib', install @types/node) is for
    // project setups, not for this app.
    pattern: /Cannot find name '(document|window|alert|prompt|localStorage|fetch)'/,
    explain: (match) => msg('friendly.noWebPage', { name: g(match, 1) }),
  },
  {
    pattern: /Cannot find name '(require|process|module|__dirname|Buffer)'/,
    explain: (match) => msg('friendly.noNode', { name: g(match, 1) }),
  },
  { pattern: /Cannot find name '(.+)'/, explain: (match) => msg('friendly.cannotFindName', { name: g(match, 1) }) },
  { pattern: /'(.+)' is possibly 'undefined'/, explain: (match) => msg('friendly.possiblyUndefined', { name: g(match, 1) }) },
  { pattern: /'(.+)' is possibly 'null'/, explain: (match) => msg('friendly.possiblyNull', { name: g(match, 1) }) },
  {
    pattern: /Parameter '(.+)' implicitly has an 'any' type/,
    explain: (match) => msg('friendly.implicitAny', { name: g(match, 1) }),
  },
  {
    pattern: /Expected (\d+(?:-\d+)?) arguments?, but got (\d+)/,
    explain: (match) => msg('friendly.argumentCount', { expected: g(match, 1), given: g(match, 2) }),
  },
  { pattern: /Function lacks ending return statement|must return a value/, explain: () => msg('friendly.missingReturn') },
  {
    pattern: /This comparison appears to be unintentional because the types '(.+)' and '(.+)' have no overlap/,
    explain: (match) => msg('friendly.noOverlap', { left: g(match, 1), right: g(match, 2) }),
  },
  // Errors while the program runs.
  { pattern: /ReferenceError: (structuredClone) is not defined/, explain: (match) => newerFeature(g(match, 1)) },
  { pattern: /ReferenceError: (\S+) is not defined/, explain: (match) => msg('friendly.notDefined', { name: g(match, 1) }) },
  { pattern: /TypeError: Assignment to constant variable/, explain: () => msg('friendly.assignConst') },
  {
    pattern: /TypeError: Cannot read properties of (undefined|null) \(reading '([^']+)'\)/,
    explain: (match) => msg('friendly.readOfNothing', { value: g(match, 1), property: g(match, 2) }),
  },
  {
    pattern: new RegExp(`TypeError: (?:\\S+\\.)?(${MODERN_NAMES}) is not a function`),
    explain: (match) => newerFeature(g(match, 1)),
  },
  { pattern: /TypeError: (\S+) is not a function/, explain: (match) => msg('friendly.notAFunction', { name: g(match, 1) }) },
  { pattern: /RangeError: Maximum call stack size exceeded/, explain: () => msg('friendly.stackOverflow') },
];

/**
 * A plain-language explanation for a classic message, or null for the rest.
 * Only raw text (what the compiler or the engine said) is recognised; the
 * app's own messages are already plain.
 */
export function explainMessage(message: string | Msg): Msg | null {
  if (typeof message !== 'string') return null;
  for (const rule of RULES) {
    const match = message.match(rule.pattern);
    if (match) return rule.explain(match);
  }
  return null;
}

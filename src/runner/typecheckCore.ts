import type * as TS from 'typescript';
import type { CompilerFlags, Engine, TypeTest } from '../content/schema';

/**
 * TypeScript's real type checker, set up the same way for the learner's code
 * in the browser (typecheck.worker.ts) and for course content at build time
 * (scripts/validateContent.ts). Until this existed, the course taught types
 * but never checked them: a type mistake that did not change the output
 * passed every exercise.
 *
 * Besides plain checking it answers the questions the type exercises ask:
 * the type of a name (tap-to-see-type, predict-the-type) and whether type
 * tests pass (type challenges).
 */

export interface TypeProblem {
  text: string;
  line: number;
  column: number;
  /** TypeScript's error number, e.g. 2322. */
  code: number;
}

/** How to check: which device engine's library, and any per-step compiler flags. */
export interface CheckOptions {
  engine?: Engine;
  flags?: CompilerFlags;
}

/** The learner's file. */
export const PROGRAM_FILE = '/program.ts';

/**
 * What the sandbox provides, described for the checker. Nothing else exists
 * at run time: no DOM, no Node. (The ES library supplies the language.)
 *
 * The type-test helpers are declared here too, so type challenges and
 * predict-the-type steps can use them without importing anything. Learner
 * files are modules, so a learner's own `Equal` simply shadows this one.
 */
export const SANDBOX_FILE = '/sandbox.d.ts';
export const SANDBOX_DECLARATIONS = `
interface Console {
  log(...data: any[]): void;
  info(...data: any[]): void;
  warn(...data: any[]): void;
  error(...data: any[]): void;
  debug(...data: any[]): void;
  table(data: any): void;
}
declare var console: Console;
declare function setTimeout(handler: (...args: any[]) => void, timeout?: number, ...args: any[]): number;
declare function clearTimeout(id: number | undefined): void;
declare function setInterval(handler: (...args: any[]) => void, timeout?: number, ...args: any[]): number;
declare function clearInterval(id: number | undefined): void;
declare function queueMicrotask(callback: () => void): void;
/** True when X and Y are exactly the same type. */
type Equal<X, Y> = (<T>() => T extends X ? 1 : 2) extends (<T>() => T extends Y ? 1 : 2) ? true : false;
type NotEqual<X, Y> = true extends Equal<X, Y> ? false : true;
/** Compiles only when T is true. */
type Expect<T extends true> = T;
type ExpectFalse<T extends false> = T;
`;

/** Only on Modern devices: a web API that older WebViews lack. */
export const MODERN_FILE = '/sandbox-modern.d.ts';
export const MODERN_DECLARATIONS = `
declare function structuredClone<T>(value: T): T;
`;

/**
 * The library each engine mode checks against (no DOM): Classic devices run
 * JavaScript up to ES2021, Modern ones up to ES2023.
 */
export const LIB_ROOTS: Readonly<Record<Engine, string>> = {
  classic: 'lib.es2021.d.ts',
  modern: 'lib.es2023.d.ts',
};

/** The safe default: what every device runs. */
export const DEFAULT_ENGINE: Engine = 'classic';

export function compilerOptions(ts: typeof TS, options: CheckOptions = {}): TS.CompilerOptions {
  const engine = options.engine ?? DEFAULT_ENGINE;
  return {
    target: ts.ScriptTarget.ES2020,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    // Every learner file is its own module: names such as `name` or `total`
    // cannot clash with anything global, and top-level await is allowed.
    moduleDetection: ts.ModuleDetectionKind.Force,
    lib: [LIB_ROOTS[engine]],
    types: [],
    strict: true,
    noEmit: true,
    skipLibCheck: true,
    noUnusedLocals: false,
    noUnusedParameters: false,
    ...cleanFlags(options.flags),
  };
}

/** Only the known flags, as booleans: content and requests cannot smuggle other options in. */
function cleanFlags(flags: CompilerFlags | undefined): CompilerFlags {
  const out: Record<string, boolean> = {};
  if (!flags) return out;
  for (const name of FLAG_NAMES) {
    const value = flags[name];
    if (typeof value === 'boolean') out[name] = value;
  }
  return out as CompilerFlags;
}

const FLAG_NAMES: readonly (keyof CompilerFlags)[] = [
  'noUncheckedIndexedAccess',
  'exactOptionalPropertyTypes',
  'noImplicitReturns',
  'noPropertyAccessFromIndexSignature',
  'noImplicitOverride',
  'noFallthroughCasesInSwitch',
  'strictNullChecks',
  'noImplicitAny',
];

function optionsKey(options: CheckOptions): string {
  return JSON.stringify([options.engine ?? DEFAULT_ENGINE, cleanFlags(options.flags)]);
}

/** A name in the code with the type TypeScript gives it (tap-to-see-type). */
export interface TypeSpan {
  /** Offsets in the code, end exclusive. */
  start: number;
  end: number;
  /** TypeScript's own description, e.g. `const total: number`. */
  display: string;
}

/** What the learner wrote for a predict-the-type step, judged. */
export interface TypeAnswer {
  correct: boolean;
  /** The type as TypeScript writes it, or null when the name is not declared. */
  actual: string | null;
  /** Why the answer could not be read as a type (TypeScript's words). */
  answerProblem?: string;
}

export interface TypeTestResult {
  name: string;
  pass: boolean;
  /** TypeScript's words when a test fails; `@expected-error` when an error was expected but none came. */
  detail?: string;
}

export interface TypeTestOutcome {
  /** Problems in the learner's own code. */
  problems: TypeProblem[];
  results: TypeTestResult[];
}

/** Token for "this line was supposed to be an error" (worded by the app). */
export const EXPECTED_ERROR = '@expected-error';
/** Token for "the code has a syntax error, so no test could be judged". */
export const SYNTAX_FIRST = '@syntax-first';

/** At most this many names get a type in one inspection (a very long sample stays fast). */
export const MAX_TYPE_SPANS = 400;

/** The checker keeps a few option sets warm; older ones are dropped. */
const MAX_SERVICES = 4;

/**
 * A reusable checker. Library files are parsed once and shared between
 * checks, so after the first check a new one takes milliseconds.
 *
 * `libs` maps library file names ("lib.es5.d.ts") to their text.
 */
export function createTypeChecker(ts: typeof TS, libs: ReadonlyMap<string, string>) {
  const files = new Map<string, string>([
    [SANDBOX_FILE, SANDBOX_DECLARATIONS],
    [MODERN_FILE, MODERN_DECLARATIONS],
  ]);
  for (const [name, text] of libs) files.set(`/${name}`, text);
  const registry = ts.createDocumentRegistry();
  // One counter for every service: the shared registry keeps parsed files by
  // name and version, so two services must never reuse a version number for
  // different program text (one would be handed the other's code).
  let versions = 0;
  const services = new Map<string, { set: (code: string) => void; service: TS.LanguageService }>();

  function serviceFor(options: CheckOptions) {
    const key = optionsKey(options);
    const existing = services.get(key);
    if (existing) {
      // Most recently used last.
      services.delete(key);
      services.set(key, existing);
      return existing;
    }
    const engine = options.engine ?? DEFAULT_ENGINE;
    const settings = compilerOptions(ts, options);
    const scriptFiles = engine === 'modern' ? [PROGRAM_FILE, SANDBOX_FILE, MODERN_FILE] : [PROGRAM_FILE, SANDBOX_FILE];
    let program = '';
    let version = 0;
    const host: TS.LanguageServiceHost = {
      getCompilationSettings: () => settings,
      getScriptFileNames: () => scriptFiles,
      getScriptVersion: (fileName) => (fileName === PROGRAM_FILE ? String(version) : '1'),
      getScriptSnapshot: (fileName) => {
        const text = fileName === PROGRAM_FILE ? program : files.get(fileName);
        return text === undefined ? undefined : ts.ScriptSnapshot.fromString(text);
      },
      getCurrentDirectory: () => '/',
      getDefaultLibFileName: () => `/${LIB_ROOTS[engine]}`,
      fileExists: (fileName) => fileName === PROGRAM_FILE || files.has(fileName),
      readFile: (fileName) => (fileName === PROGRAM_FILE ? program : files.get(fileName)),
    };
    const entry = {
      service: ts.createLanguageService(host, registry),
      set(code: string) {
        if (code === program) return;
        program = code;
        versions += 1;
        version = versions;
      },
    };
    services.set(key, entry);
    while (services.size > MAX_SERVICES) {
      const oldest = services.keys().next().value;
      if (oldest === undefined) break;
      services.get(oldest)?.service.dispose();
      services.delete(oldest);
    }
    return entry;
  }

  function diagnose(code: string, options: CheckOptions) {
    const entry = serviceFor(options);
    entry.set(code);
    const syntactic = entry.service.getSyntacticDiagnostics(PROGRAM_FILE);
    const semantic = entry.service.getSemanticDiagnostics(PROGRAM_FILE);
    const source = entry.service.getProgram()?.getSourceFile(PROGRAM_FILE);
    const toProblem = (diagnostic: TS.Diagnostic): TypeProblem & { start: number } => {
      const start = diagnostic.start ?? 0;
      const position = source ? source.getLineAndCharacterOfPosition(start) : { line: 0, character: 0 };
      return {
        text: ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n').split('\n')[0] ?? '',
        line: position.line + 1,
        column: position.character + 1,
        code: diagnostic.code,
        start,
      };
    };
    const errors = (list: readonly TS.Diagnostic[]) =>
      list.filter((diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error).map(toProblem);
    const syntax = errors(syntactic);
    return { syntax, all: [...syntax, ...errors(semantic)], entry, source };
  }

  const strip = ({ text, line, column, code }: TypeProblem): TypeProblem => ({ text, line, column, code });

  /** The first declaration of `name`, in source order. */
  function findDeclaration(source: TS.SourceFile, name: string): TS.NamedDeclaration | undefined {
    let found: TS.NamedDeclaration | undefined;
    const visit = (node: TS.Node): void => {
      if (found) return;
      if (
        (ts.isVariableDeclaration(node) ||
          ts.isParameter(node) ||
          ts.isFunctionDeclaration(node) ||
          ts.isTypeAliasDeclaration(node) ||
          ts.isInterfaceDeclaration(node) ||
          ts.isClassDeclaration(node)) &&
        node.name !== undefined &&
        ts.isIdentifier(node.name) &&
        node.name.text === name
      ) {
        found = node;
        return;
      }
      ts.forEachChild(node, visit);
    };
    visit(source);
    return found;
  }

  function isTypeDeclaration(node: TS.Node): boolean {
    return ts.isTypeAliasDeclaration(node) || ts.isInterfaceDeclaration(node);
  }

  function isTopLevel(node: TS.Node): boolean {
    let current = node.parent;
    while (current && !ts.isSourceFile(current)) {
      if (!ts.isVariableDeclarationList(current) && !ts.isVariableStatement(current)) return false;
      current = current.parent;
    }
    return true;
  }

  function typeOf(code: string, target: string, options: CheckOptions): { kind: 'value' | 'type'; text: string } | null {
    const entry = serviceFor(options);
    entry.set(code);
    const program = entry.service.getProgram();
    const source = program?.getSourceFile(PROGRAM_FILE);
    if (!program || !source) return null;
    const declaration = findDeclaration(source, target);
    if (!declaration?.name) return null;
    const checker = program.getTypeChecker();
    const type = checker.getTypeAtLocation(declaration.name);
    const kind = isTypeDeclaration(declaration) ? 'type' : 'value';
    const flags =
      ts.TypeFormatFlags.NoTruncation | (kind === 'type' ? ts.TypeFormatFlags.InTypeAlias : ts.TypeFormatFlags.None);
    return { kind, text: checker.typeToString(type, declaration, flags) };
  }

  return {
    /** Every type error in the code. */
    check(code: string, options: CheckOptions = {}): TypeProblem[] {
      return diagnose(code, options).all.map(strip);
    },

    /** The type of every name in the code, for tap-to-see-type. */
    inspect(code: string, options: CheckOptions = {}): TypeSpan[] {
      const entry = serviceFor(options);
      entry.set(code);
      const source = entry.service.getProgram()?.getSourceFile(PROGRAM_FILE);
      if (!source) return [];
      const spans: TypeSpan[] = [];
      const visit = (node: TS.Node): void => {
        if (spans.length >= MAX_TYPE_SPANS) return;
        if (ts.isIdentifier(node)) {
          const start = node.getStart(source);
          const info = entry.service.getQuickInfoAtPosition(PROGRAM_FILE, start);
          const display = info ? ts.displayPartsToString(info.displayParts).trim() : '';
          if (display) spans.push({ start, end: node.getEnd(), display: display.slice(0, 1500) });
          return;
        }
        ts.forEachChild(node, visit);
      };
      visit(source);
      return spans;
    },

    /** The type TypeScript gives `target`, written out. */
    typeOf(code: string, target: string, options: CheckOptions = {}): { kind: 'value' | 'type'; text: string } | null {
      return typeOf(code, target, options);
    },

    /**
     * Whether `answer` is exactly the type of `target`. Identity, not
     * assignability: `string` is not accepted for `"a" | "b"`, while
     * `number | string` is accepted for `string | number`.
     */
    matchType(code: string, target: string, answer: string, options: CheckOptions = {}): TypeAnswer {
      const found = typeOf(code, target, options);
      if (!found) return { correct: false, actual: null };
      const { source } = diagnose(code, options);
      const declaration = source ? findDeclaration(source, target) : undefined;
      const hasTypeParameters =
        declaration !== undefined &&
        (ts.isTypeAliasDeclaration(declaration) || ts.isInterfaceDeclaration(declaration)) &&
        (declaration.typeParameters?.length ?? 0) > 0;
      // A name at the top level is compared directly; anything else (a local,
      // a parameter) through the type as TypeScript writes it.
      const reference =
        declaration && isTopLevel(declaration) && !hasTypeParameters
          ? found.kind === 'type'
            ? target
            : `typeof ${target}`
          : found.text;
      const base = `${code}\n;\n`;
      const answerLine = base.split('\n').length;
      const probe =
        `${base}type __CompanionAnswer = (\n${answer}\n);\n` +
        `type __CompanionTarget = ${reference};\n` +
        `type __CompanionCheck = Expect<Equal<__CompanionAnswer, __CompanionTarget>>;\n`;
      const problems = diagnose(probe, options).all;
      const answerLines = answer.split('\n').length;
      const inAnswer = problems.find((problem) => problem.line >= answerLine && problem.line <= answerLine + answerLines + 1);
      if (inAnswer) return { correct: false, actual: found.text, answerProblem: inAnswer.text };
      const after = problems.filter((problem) => problem.start >= base.length);
      return { correct: after.length === 0, actual: found.text };
    },

    /** Runs a type challenge's tests against the learner's code. */
    typeTests(code: string, tests: readonly TypeTest[], options: CheckOptions = {}): TypeTestOutcome {
      const lines = [...code.split('\n'), ''];
      const learnerLines = lines.length;
      const ranges = tests.map((test) => {
        const from = lines.length + 1;
        // An expected error is expected on the test's last line; any lines
        // before it set things up and must compile.
        const testLines = test.code.split('\n');
        if (test.expect === 'error') lines.push(...testLines.slice(0, -1), '// @ts-expect-error', testLines[testLines.length - 1] ?? '');
        else lines.push(...testLines);
        return { from, to: lines.length };
      });
      const { syntax, all } = diagnose(lines.join('\n'), options);
      // Problems in the learner's code, and any syntax error (an unclosed
      // brace in the learner's code is often only noticed further down).
      const problems = all
        .filter((problem) => problem.line <= learnerLines || syntax.includes(problem))
        .map(strip);
      const results = tests.map((test, index): TypeTestResult => {
        if (syntax.length > 0) return { name: test.name, pass: false, detail: SYNTAX_FIRST };
        const range = ranges[index] ?? { from: 0, to: -1 };
        const own = all.filter((problem) => problem.line >= range.from && problem.line <= range.to);
        if (own.length === 0) return { name: test.name, pass: true };
        const unused = own.find((problem) => problem.code === 2578);
        if (unused) return { name: test.name, pass: false, detail: EXPECTED_ERROR };
        return { name: test.name, pass: false, detail: own[0]?.text ?? '' };
      });
      return { problems, results };
    },
  };
}

export type TypeChecker = ReturnType<typeof createTypeChecker>;

import { L, LL, c, md } from '../authoring';
import type { Lesson } from '../schema';

export const M18_LESSONS: readonly Lesson[] = [
  {
    id: 'm18-l01-strict-flags',
    moduleId: 'm18',
    order: 1,
    title: {
      story: 'Stricter rules that catch more mistakes',
      explorer: 'Strict compiler flags',
      pro: 'Beyond strict: the flags worth turning on',
    },
    estMinutes: 9,
    difficulty: 3,
    concepts: ['compiler-flag', 'optional', 'class', 'return'],
    objectives: LL(
      ['Know what `strict` turns on, and which useful flags it leaves off.', 'Fix code under `exactOptionalPropertyTypes`, `noImplicitReturns` and `noImplicitOverride`.', 'Decide which flags a project should use.'],
      ['Know what the strict settings are.', 'Fix code when stricter rules are switched on.', 'Choose rules for your own projects.'],
    ),
    steps: [
      {
        id: 'read',
        kind: 'read',
        prompt: L('`strict` is the start, not the end.', 'TypeScript has extra rules you can switch on.'),
        body: L(
          md(
            '`"strict": true` switches on a family of checks: `strictNullChecks`, `noImplicitAny`, `strictFunctionTypes`, `strictBindCallApply`, `strictPropertyInitialization`, `useUnknownInCatchVariables` and more. Several valuable flags are **not** part of it:',
            '- `noUncheckedIndexedAccess`: index reads may be `undefined`.\n- `exactOptionalPropertyTypes`: `x?: T` means "may be missing", not "may be `undefined`".\n- `noImplicitReturns`: every path must return.\n- `noImplicitOverride`: overriding a method requires `override`.\n- `noPropertyAccessFromIndexSignature`: dynamic keys need brackets.',
            'In each exercise below, one flag is switched on. Fix the code it catches.',
          ),
          md(
            'TypeScript has a "strict" switch that turns on lots of careful checks. But there are even more careful rules you can add.',
            'Each exercise below switches on one extra rule. Fix what it finds!',
          ),
          md(
            'Adopting a flag in an existing codebase: enable it, count the errors, fix mechanically where possible (e.g. add `override`), and use `@ts-expect-error` sparingly to stage the rest. `exactOptionalPropertyTypes` and `noUncheckedIndexedAccess` are the most disruptive and the most valuable for data-heavy code; libraries should be compatible with consumers that enable them.',
            '`@tsconfig/strictest` bundles a recommended set. Flags are per project; in this course each step can switch them on individually.',
          ),
        ),
      },
      {
        id: 'exact',
        kind: 'fix',
        compilerFlags: { exactOptionalPropertyTypes: true },
        prompt: L('With `exactOptionalPropertyTypes`, you cannot set `theme` to `undefined`. Make `reset` remove the property instead.', 'With this rule, a "maybe" label cannot be set to `undefined`. Make `reset` remove `theme` completely.'),
        hint: L('Destructure it away: `const { theme, ...rest } = settings; return rest;`.', 'Take `theme` out with `const { theme, ...rest } = settings;` and give back `rest`.'),
        starter: c(
          'type Settings = { theme?: "light" | "dark"; fontSize?: number };',
          '',
          'function reset(settings: Settings): Settings {',
          '  return { ...settings, theme: undefined };',
          '}',
        ),
        solution: c(
          'type Settings = { theme?: "light" | "dark"; fontSize?: number };',
          '',
          'function reset(settings: Settings): Settings {',
          '  const { theme, ...rest } = settings;',
          '  return rest;',
          '}',
        ),
        tests: [
          { name: 'theme is gone', call: '"theme" in reset({ theme: "dark", fontSize: 14 })', expect: 'false' },
          { name: 'the rest stays', call: 'reset({ theme: "dark", fontSize: 14 })', expect: '{"fontSize":14}' },
        ],
        explain: L(
          'A property set to `undefined` still exists (`"theme" in settings` is true), which can override defaults when objects are merged. The flag makes "missing" and "undefined" different types.',
          'A label holding `undefined` is still there! Removing it is what "missing" really means.',
          'Under the flag, `theme?: T` excludes explicit `undefined` unless written `theme?: T | undefined`; this matters for spreads, `in` checks and `Object.keys`.',
        ),
      },
      {
        id: 'returns',
        kind: 'fix',
        compilerFlags: { noImplicitReturns: true },
        prompt: L('With `noImplicitReturns`, every path must return. Return `"keep going"` when the score is 50 or less.', 'With this rule, every path must give something back. Give back "keep going" for low scores.'),
        hint: L('Add a final `return "keep going";`.', 'Add `return "keep going";` at the end.'),
        starter: c(
          'function label(score: number): string | undefined {',
          '  if (score > 90) return "great";',
          '  if (score > 50) return "good";',
          '}',
        ),
        solution: c(
          'function label(score: number): string | undefined {',
          '  if (score > 90) return "great";',
          '  if (score > 50) return "good";',
          '  return "keep going";',
          '}',
        ),
        tests: [
          { name: 'great', call: 'label(95)', expect: 'great' },
          { name: 'low scores', call: 'label(10)', expect: 'keep going' },
        ],
        explain: L('The return type allowed `undefined`, so falling off the end was silently accepted. The flag asks you to say what happens there.', 'Before, the low-score path gave back nothing, by accident. Now it is on purpose.', 'TS7030 flags paths that end without `return` when others return a value.'),
      },
      {
        id: 'override',
        kind: 'fix',
        compilerFlags: { noImplicitOverride: true },
        prompt: L('With `noImplicitOverride`, replacing a parent’s method needs the `override` keyword. Add it.', 'With this rule, you must say `override` when you replace a parent’s method.'),
        hint: L('Write `override describe(): string`.', 'Put `override` in front of `describe` in `Child`.'),
        starter: c(
          'class Base {',
          '  describe(): string {',
          '    return "base";',
          '  }',
          '}',
          '',
          'class Child extends Base {',
          '  describe(): string {',
          '    return "child";',
          '  }',
          '}',
        ),
        solution: c(
          'class Base {',
          '  describe(): string {',
          '    return "base";',
          '  }',
          '}',
          '',
          'class Child extends Base {',
          '  override describe(): string {',
          '    return "child";',
          '  }',
          '}',
        ),
        tests: [{ name: 'child', call: 'new Child().describe()', expect: 'child' }],
        explain: L('`override` documents intent, and if the base method is renamed, TypeScript reports that nothing is being overridden any more.', 'Now, if the parent’s method changes name, TypeScript will notice.', 'With the flag, `override` is required (TS4114) and an `override` of a non-existent member is an error (TS4113), catching silent breakage on refactors.'),
      },
      {
        id: 'recap',
        kind: 'recap',
        prompt: L('The short version.', 'What you learned.'),
        points: LL(
          ['`strict` is a family of checks, but not all of them.', '`exactOptionalPropertyTypes`, `noImplicitReturns` and `noImplicitOverride` catch real bugs.', 'Turn flags on one at a time in existing code.'],
          ['"strict" switches on lots of rules.', 'Extra rules catch even more mistakes.', 'Add them one at a time.'],
          ['Know the strict family and what it omits.', 'Adopt disruptive flags incrementally.', 'Libraries should work under consumers’ flags.'],
        ),
      },
    ],
    recap: LL(
      ['Choose compiler flags deliberately.', 'Extra flags catch real bugs.', 'Migrate one flag at a time.'],
      ['Stricter rules find more mistakes.', 'Switch them on one by one.', 'Your code gets safer.'],
      ['A flag policy is part of a codebase’s design.', '`@tsconfig/strictest` as a baseline.', 'Stage migrations.'],
    ),
  },

  {
    id: 'm18-l02-declaration-files',
    moduleId: 'm18',
    order: 2,
    title: {
      story: 'Labels for code without labels',
      explorer: 'Declaration files and declare',
      pro: 'Ambient declarations and .d.ts files',
    },
    estMinutes: 7,
    difficulty: 3,
    concepts: ['declaration-file', 'annotation', 'module'],
    objectives: LL(
      ['Describe code that exists without TypeScript types, with `declare`.', 'Know what goes in a `.d.ts` file.', 'Write a declaration for a global.'],
      ['Describe code that has no labels.', 'Know what a "labels only" file is.', 'Write labels for a global thing.'],
    ),
    steps: [
      {
        id: 'read',
        kind: 'read',
        prompt: L('Types for code TypeScript cannot see.', 'Labels for things TypeScript cannot see.'),
        body: L(
          md(
            'Sometimes code exists, but not as TypeScript: a script tag on the page, a JavaScript library. `declare` tells TypeScript "this exists; here is its type", without creating anything:',
            '```ts\ndeclare const APP_VERSION: string;\ndeclare function track(event: string, data?: Record<string, string>): void;\n```',
            'A **`.d.ts` file** holds only declarations: no values, no code that runs. Libraries ship them next to their JavaScript (`index.js` + `index.d.ts`), and DefinitelyTyped provides them for libraries that do not (`npm install -D @types/lodash`).',
          ),
          md(
            'Sometimes a helper comes from somewhere else, like a tool the web page already has. TypeScript cannot see it, so it complains.',
            '`declare` is like writing a label for it: "there is a thing called `track`, and this is how you use it". The label makes no code; it only describes.',
          ),
          md(
            'Ambient declarations (`declare const/function/class/namespace/module`, and `declare global { … }` inside modules) introduce types without emit. `.d.ts` files are produced with `declaration: true` (or `isolatedDeclarations` for fast parallel emit) and consumed via `types`/`typesVersions` in `package.json`.',
            'Module augmentation (`declare module "lib" { interface Options { … } }`) extends third-party types; it only works inside a module that imports or exports something. Keep hand-written declarations minimal and tested with type tests.',
          ),
        ),
      },
      {
        id: 'analytics',
        kind: 'types',
        prompt: L(
          'The page provides a global `analytics` object. Declare it: `track(event: string, data?: Record<string, string>): void`.',
          'The web page already has an `analytics` helper. Write its label with `declare`, so TypeScript knows how to use it.',
        ),
        hint: L('`declare const analytics: { track(event: string, data?: Record<string, string>): void };`', 'Write `declare const analytics: { track(…): void };` with the right inputs.'),
        starter: c('// The page adds `analytics` with a <script> tag. Describe it here.', '', 'function signUp(plan: string): void {', '  analytics.track("signup", { plan });', '}'),
        solution: c(
          '// The page adds `analytics` with a <script> tag. Describe it here.',
          'declare const analytics: {',
          '  track(event: string, data?: Record<string, string>): void;',
          '};',
          '',
          'function signUp(plan: string): void {',
          '  analytics.track("signup", { plan });',
          '}',
        ),
        typeTests: [
          { name: 'an event on its own', code: 'analytics.track("login");' },
          { name: 'an event name must be text', code: 'analytics.track(42);', expect: 'error' },
          { name: 'data values must be text', code: 'analytics.track("buy", { amount: 3 });', expect: 'error' },
        ],
        explain: L('Nothing was created: `declare` only told TypeScript what the page provides, so calls are now checked.', 'The label makes no new code. It just lets TypeScript check how you use `analytics`.', 'Ambient `declare const` has no emit; the type is trusted, so keep it accurate (and test it, as here).'),
      },
      {
        id: 'dts',
        kind: 'check',
        prompt: L('What may a `.d.ts` file contain?', 'What goes in a labels-only file?'),
        hint: L('Does anything in it run?', 'Does any of it run?'),
        explain: L('Only types and declarations: interfaces, type aliases, `declare` statements. No values and no running code.', 'Only labels. Nothing in it runs.', 'Declaration files are type-only; implementation bodies and initialisers are errors (TS1183, TS1039).'),
        choices: [
          { id: 'types', text: L('Types and declarations only'), correct: true },
          { id: 'code', text: L('Functions with their code, so they run faster'), correct: false, feedback: L('Nothing in a `.d.ts` file runs; the JavaScript lives elsewhere.', 'No code runs from that file.') },
        ],
      },
      {
        id: 'recap',
        kind: 'recap',
        prompt: L('The short version.', 'What you learned.'),
        points: LL(
          ['`declare` describes something that exists without creating it.', '`.d.ts` files contain only declarations.', 'Libraries ship them, or DefinitelyTyped provides them.'],
          ['`declare` writes a label for something that exists.', 'Labels-only files never run.', 'Many libraries come with label files.'],
          ['Ambient declarations, augmentation, `declare global`.', 'Emit with `declaration`/`isolatedDeclarations`.', 'Test hand-written declarations.'],
        ),
      },
    ],
    recap: LL(
      ['Type what you cannot see with `declare`.', 'Keep declarations accurate: they are trusted.', 'Prefer maintained types when available.'],
      ['Labels for hidden things.', 'Labels must be right.', 'Use ready-made labels when you can.'],
      ['Declarations are an API surface.', 'Trust but test.', 'Know `@types` and augmentation.'],
    ),
  },

  {
    id: 'm18-l03-modules-imports',
    moduleId: 'm18',
    order: 3,
    title: {
      story: 'How files find each other',
      explorer: 'Type-only imports and ES modules',
      pro: 'Modules, type-only imports and resolution',
    },
    estMinutes: 7,
    difficulty: 3,
    concepts: ['module', 'import', 'export', 'compiler-flag'],
    objectives: LL(
      ['Use `import type` for imports that are only types.', 'Tell ES modules and CommonJS apart.', 'Know what `moduleResolution` and `verbatimModuleSyntax` do.'],
      ['Borrow only labels from another file.', 'Know the two ways files share code.', 'Know how TypeScript finds files.'],
    ),
    steps: [
      {
        id: 'read',
        kind: 'read',
        prompt: L('Imports that vanish, and imports that load.', 'Some imports bring code; some bring only labels.'),
        body: L(
          md(
            '```ts\nimport type { User } from "./user";        // erased: only a type\nimport { loadUser, type Role } from "./api"; // loadUser stays, Role is erased\nexport type { User };\n```',
            'Two module systems exist: **ES modules** (`import`/`export`, the standard) and **CommonJS** (`require`/`module.exports`, older Node). Modern projects use ES modules.',
            'TypeScript also has to find the files: `moduleResolution: "bundler"` for projects built by Vite or esbuild, `"nodenext"` for code run directly by Node.',
          ),
          md(
            'Files share code with `import` and `export`. Some imports bring real code; others bring only labels (types), and those disappear when the code runs.',
            '`import type` says "only labels, please", so it never loads the other file.',
          ),
          md(
            'With `verbatimModuleSyntax` (recommended, TS 5.0), imports and exports are emitted exactly as written unless marked `type`, so single-file transpilers (esbuild, SWC, Babel, Node’s type stripping) behave like `tsc`; it supersedes `isolatedModules`, `importsNotUsedAsValues` and `preserveValueImports`.',
            '`moduleResolution: "nodenext"` enforces Node’s rules (explicit `.js` extensions in relative imports, `package.json` `exports`, `type: "module"`); `"bundler"` relaxes extensions but respects `exports`. CommonJS/ESM interop (`esModuleInterop`, default imports of CJS) is a common source of runtime-only errors.',
          ),
        ),
      },
      {
        id: 'compare',
        kind: 'compare',
        prompt: L('The same module, two systems.', 'Two ways for files to share.'),
        left: {
          title: 'ES modules',
          code: c('// math.ts', 'export function add(a: number, b: number) {', '  return a + b;', '}', '', '// app.ts', 'import { add } from "./math.js";'),
          caption: L('The standard: static, analysable, works in browsers and Node.', 'The modern way, used everywhere today.'),
        },
        right: {
          title: 'CommonJS',
          code: c('// math.js', 'module.exports.add = function (a, b) {', '  return a + b;', '};', '', '// app.js', 'const { add } = require("./math");'),
          caption: L('The older Node system: dynamic, still common in existing packages.', 'The older way, still found in many old projects.'),
        },
      },
      {
        id: 'erased',
        kind: 'check',
        prompt: L('With `verbatimModuleSyntax`, which import is removed from the JavaScript?', 'Which import disappears when the code runs?'),
        hint: L('Which one is marked as types only?', 'Which one says it only brings labels?'),
        explain: L('`import type` is always erased. A plain `import` is kept as written, even if you only use types from it.', 'The `import type` one disappears. The others stay.', 'Under `verbatimModuleSyntax`, only `type`-marked imports are elided; unmarked imports of types are an error (TS1484) so the intent is explicit.'),
        choices: [
          { id: 'type', text: L('`import type { User } from "./user";`'), correct: true },
          { id: 'plain', text: L('`import { loadUser } from "./api";`'), correct: false, feedback: L('That imports a value, which is kept.', 'That brings real code, so it stays.') },
        ],
      },
      {
        id: 'resolution',
        kind: 'check',
        prompt: L('Your code runs directly in Node as ES modules. Which `moduleResolution`?', 'Your code runs straight in Node. How should TypeScript find files?'),
        hint: L('Which setting follows Node’s own rules, including file extensions?', 'Which one copies Node’s rules exactly?'),
        explain: L('`"nodenext"` checks imports the way Node will run them, including `.js` extensions in relative paths.', '"nodenext" copies Node’s rules, so what TypeScript accepts really works in Node.', '`nodenext` models Node’s ESM/CJS dual resolution; `bundler` is for code a bundler transforms.'),
        choices: [
          { id: 'nodenext', text: L('`"nodenext"`'), correct: true },
          { id: 'bundler', text: L('`"bundler"`'), correct: false, feedback: L('That is for code built by a bundler, which is more forgiving than Node.', 'That one is for code that a build tool bundles first.') },
        ],
      },
      {
        id: 'recap',
        kind: 'recap',
        prompt: L('The short version.', 'What you learned.'),
        points: LL(
          ['`import type` imports only types and is always erased.', 'ES modules are the standard; CommonJS is the older Node system.', '`moduleResolution` decides how imports find files.'],
          ['Some imports bring only labels.', 'Two ways to share code: new and old.', 'TypeScript needs to know how files are found.'],
          ['Use `verbatimModuleSyntax`.', '`nodenext` for Node, `bundler` for bundled apps.', 'Watch CJS/ESM interop.'],
        ),
      },
    ],
    recap: LL(
      ['Mark type-only imports.', 'Prefer ES modules.', 'Match resolution to how code runs.'],
      ['Labels-only imports vanish.', 'Use the modern way.', 'Tell TypeScript how files are found.'],
      ['Explicit module syntax for single-file tools.', 'Resolution mirrors the runtime.', 'Interop needs care.'],
    ),
  },

  {
    id: 'm18-l04-runtime-validation',
    moduleId: 'm18',
    order: 4,
    title: {
      story: 'Reusable checkers',
      explorer: 'Composable runtime validators',
      pro: 'Composable validators: types and checks from one source',
    },
    estMinutes: 9,
    difficulty: 3,
    concepts: ['type-predicate', 'unknown', 'generic', 'function-type'],
    objectives: LL(
      ['Write small validators as type predicates.', 'Combine them with higher-order functions like `arrayOf`.', 'Get the checked type for free from the validator.'],
      ['Make small checkers.', 'Combine them into bigger checkers.', 'Let TypeScript learn from them.'],
    ),
    steps: [
      {
        id: 'read',
        kind: 'read',
        prompt: L('Small checks that snap together.', 'Checkers that snap together like building blocks.'),
        body: L(
          md(
            'A **validator** is a type predicate over `unknown`. Small ones combine into bigger ones:',
            '```ts\ntype Validator<T> = (value: unknown) => value is T;\n\nconst isString: Validator<string> = (value): value is string => typeof value === "string";\nconst isNumber: Validator<number> = (value): value is number => typeof value === "number";\n\nfunction arrayOf<T>(item: Validator<T>): Validator<T[]> {\n  return (value): value is T[] => Array.isArray(value) && value.every(item);\n}\n\nconst isScores = arrayOf(isNumber); // Validator<number[]>\n```',
            'Each combination both checks at runtime *and* tells TypeScript the resulting type.',
          ),
          md(
            'A checker answers "is this the right kind?" and teaches TypeScript at the same time.',
            'Small checkers snap together: a "list of numbers" checker is made from a "number" checker.',
          ),
          md(
            'Validators as predicates compose via higher-order functions (`arrayOf`, `optional`, `union`, `object`); the static type flows from the combinators, so runtime checks and types cannot drift. This is the core idea of schema libraries; Module 19 builds the `Infer<typeof schema>` side of it.',
            'Prefer returning parsed values (or `Result`) over booleans when you need error messages or transformations.',
          ),
        ),
      },
      {
        id: 'array-of',
        kind: 'types',
        prompt: L('Write `arrayOf`: it turns a validator for `T` into a validator for `T[]`.', 'Make `arrayOf`: it turns a "number checker" into a "list of numbers checker".'),
        hint: L('Return `(value): value is T[] => Array.isArray(value) && value.every(item)`.', 'Give back a new checker: is it a list, and does every item pass `item`?'),
        starter: c(
          'type Validator<T> = (value: unknown) => value is T;',
          '',
          'const isNumber: Validator<number> = (value): value is number => typeof value === "number";',
          '',
          'function arrayOf<T>(item: Validator<T>): (value: unknown) => boolean {',
          '  return (value) => Array.isArray(value);',
          '}',
        ),
        solution: c(
          'type Validator<T> = (value: unknown) => value is T;',
          '',
          'const isNumber: Validator<number> = (value): value is number => typeof value === "number";',
          '',
          'function arrayOf<T>(item: Validator<T>): Validator<T[]> {',
          '  return (value): value is T[] => Array.isArray(value) && value.every(item);',
          '}',
        ),
        typeTests: [
          { name: 'narrows to number[]', code: 'const isScores = arrayOf(isNumber);\ndeclare const input: unknown;\nif (isScores(input)) {\n  type T1 = Expect<Equal<typeof input, number[]>>;\n}' },
          { name: 'nests', code: 'const isGrid = arrayOf(arrayOf(isNumber));\ndeclare const grid: unknown;\nif (isGrid(grid)) {\n  type T2 = Expect<Equal<typeof grid, number[][]>>;\n}' },
        ],
        tests: [
          { name: 'numbers pass', call: 'arrayOf(isNumber)([1, 2, 3])', expect: 'true' },
          { name: 'a string fails', call: 'arrayOf(isNumber)([1, "2"])', expect: 'false' },
          { name: 'not an array', call: 'arrayOf(isNumber)("123")', expect: 'false' },
        ],
        explain: L('The returned function is itself a validator, so it narrows, and can be composed again (`arrayOf(arrayOf(isNumber))`).', 'The new checker teaches TypeScript too, and can be snapped onto yet another.', 'Higher-order predicates preserve narrowing through composition.'),
      },
      {
        id: 'optional',
        kind: 'write',
        prompt: L('Write `optional`: a validator that also accepts `undefined`.', 'Make `optional`: a checker that also says yes to `undefined`.'),
        starter: c(
          'type Validator<T> = (value: unknown) => value is T;',
          '',
          'const isString: Validator<string> = (value): value is string => typeof value === "string";',
          '',
          'function optional<T>(item: Validator<T>): Validator<T | undefined> {',
          '  return (value): value is T | undefined => item(value);',
          '}',
        ),
        solution: c(
          'type Validator<T> = (value: unknown) => value is T;',
          '',
          'const isString: Validator<string> = (value): value is string => typeof value === "string";',
          '',
          'function optional<T>(item: Validator<T>): Validator<T | undefined> {',
          '  return (value): value is T | undefined => value === undefined || item(value);',
          '}',
        ),
        tests: [
          { name: 'undefined passes', call: 'optional(isString)(undefined)', expect: 'true' },
          { name: 'a string passes', call: 'optional(isString)("hi")', expect: 'true' },
          { name: 'null fails', call: 'optional(isString)(null)', expect: 'false' },
        ],
        hint: L('`value === undefined || item(value)`.', 'Say yes if it is `undefined`, otherwise ask `item`.'),
        explain: L('`null` is not `undefined`: an optional field may be missing, but not `null` unless you say so.', 'Missing is fine; `null` is something else.', 'Distinguish absent from null; model `nullable` separately.'),
      },
      {
        id: 'recap',
        kind: 'recap',
        prompt: L('The short version.', 'What you learned.'),
        points: LL(
          ['A validator is a type predicate over `unknown`.', 'Higher-order functions combine validators.', 'The type comes from the validator, so they cannot disagree.'],
          ['Checkers answer and teach at the same time.', 'Small checkers snap into big ones.', 'TypeScript learns from all of them.'],
          ['Composable predicates.', 'One source for runtime and static types.', 'The basis of schema libraries.'],
        ),
      },
    ],
    recap: LL(
      ['Build validation from small, typed pieces.', 'Compose instead of repeating.', 'Types follow checks.'],
      ['Snap checkers together.', 'Check once, trust afterwards.', 'TypeScript learns as you check.'],
      ['Composable runtime validation.', 'Predicates preserve narrowing.', 'Schemas generalise this.'],
    ),
  },

  {
    id: 'm18-l05-escape-hatches',
    moduleId: 'm18',
    order: 5,
    title: {
      story: 'Emergency exits, used with care',
      explorer: 'Escape hatches: any, as, ! and @ts-expect-error',
      pro: 'Escape hatches and migrating JavaScript with judgement',
    },
    estMinutes: 8,
    difficulty: 3,
    concepts: ['any', 'type-assertion', 'non-null-assertion', 'migration'],
    objectives: LL(
      ['Know what `any`, `as`, `!` and `@ts-expect-error` each give up.', 'Replace a risky `!` with a real check.', 'Migrate JavaScript to TypeScript step by step.'],
      ['Know the emergency exits and what they cost.', 'Swap a risky shortcut for a real check.', 'Move old code to TypeScript bit by bit.'],
    ),
    steps: [
      {
        id: 'read',
        kind: 'read',
        prompt: L('Every escape hatch switches off some checking.', 'Emergency exits are useful, but they switch off safety checks.'),
        body: L(
          md(
            '- `any`: turns checking off for a value, and everything it touches.\n- `value as Type`: "trust me, it is this type" (no check at runtime).\n- `value!`: "trust me, it is not `null` or `undefined`".\n- `// @ts-expect-error`: "the next line has an error, on purpose"; it complains when the error goes away.\n- `// @ts-ignore`: silences the next line forever, even after the error is fixed: avoid.',
            'When moving JavaScript to TypeScript, these help you start, with `allowJs`, `checkJs` and JSDoc types, then tighten file by file.',
          ),
          md(
            'Escape hatches are like emergency exits: sometimes you need one, but an alarm should go off.',
            '`!` means "trust me, it is there". If you are wrong, the program breaks when it runs.',
          ),
          md(
            'Assertions are unchecked; double assertions (`as unknown as T`) bypass even the overlap check. Prefer narrowing, validation, and precise types; confine unavoidable assertions to small, tested helpers. `@ts-expect-error` is self-cleaning, `@ts-ignore` is not; lint both (`@typescript-eslint/ban-ts-comment` with descriptions).',
            'Migration: enable `allowJs` + `checkJs` for JSDoc-typed checking, rename files incrementally, start with non-strict and turn flags on per directory (project references) or per line with `@ts-expect-error` budgets.',
          ),
        ),
      },
      {
        id: 'predict',
        kind: 'predict',
        prompt: L('A double `as` compiles. What prints?', 'TypeScript was told a lie. What will it show?'),
        hint: L('`as` changes nothing at runtime: `count` is still the string `"5"`.', 'The label says number, but inside the box it is still the word "5".'),
        code: c('const count = "5" as unknown as number;', 'console.log(count + 1);'),
        answer: '51',
        explain: L('TypeScript believed it was a number; at runtime `"5" + 1` joins text. Assertions never convert values.', 'The box really held a word, so 1 was glued on: "51".', 'Assertions are erased; `+` with a string operand concatenates.'),
      },
      {
        id: 'bang',
        kind: 'fix',
        prompt: L('`firstLongWord` crashes when no word is long enough. Remove the `!` and return `""` in that case.', '`firstLongWord` breaks when no word is long. Remove the `!` and give back `""` instead.'),
        hint: L('Store the `find` result, check for `undefined`, then upper-case it.', 'Keep what `find` gives back. If it is `undefined`, give back `""`.'),
        starter: c(
          'function firstLongWord(text: string): string {',
          '  return text.split(" ").find((word) => word.length > 3)!.toUpperCase();',
          '}',
        ),
        solution: c(
          'function firstLongWord(text: string): string {',
          '  const word = text.split(" ").find((candidate) => candidate.length > 3);',
          '  return word === undefined ? "" : word.toUpperCase();',
          '}',
        ),
        tests: [
          { name: 'finds one', call: 'firstLongWord("a lovely day")', expect: 'LOVELY' },
          { name: 'none long enough', call: 'firstLongWord("a b c")', expect: '' },
        ],
        explain: L('`find` can return `undefined`, and `!` hid that from TypeScript. A real check handles it.', 'The `!` hid a real problem. Checking makes it safe.', 'Non-null assertions silence TS2532/18048 without runtime protection.'),
      },
      {
        id: 'expect',
        kind: 'check',
        prompt: L('A test deliberately passes a wrong type. Which comment should mark that line?', 'A test breaks the rules on purpose. Which note should go above that line?'),
        hint: L('Which one complains if the error later disappears?', 'Which note notices when it is not needed any more?'),
        explain: L('`@ts-expect-error`: it documents the intended error, and reports when the line stops being an error, so it never goes stale.', '`@ts-expect-error` tells you when it is no longer needed.', 'TS2578 on an unused `@ts-expect-error` keeps suppressions honest; the type challenges in this course use exactly that.'),
        choices: [
          { id: 'expect', text: L('`// @ts-expect-error`'), correct: true },
          { id: 'ignore', text: L('`// @ts-ignore`'), correct: false, feedback: L('It silences the line forever, even once the error is gone.', 'It hides the line forever, even when it is not needed.') },
          { id: 'any', text: L('Cast the argument with `as any`'), correct: false, feedback: L('That hides the error without saying it is intended, and spreads `any`.', 'That hides the problem and spreads "anything goes".') },
        ],
      },
      {
        id: 'recap',
        kind: 'recap',
        prompt: L('The short version.', 'What you learned.'),
        points: LL(
          ['`any`, `as` and `!` switch checks off; use them rarely and deliberately.', 'Replace `!` with a real check where you can.', 'Prefer `@ts-expect-error` to `@ts-ignore`.'],
          ['Emergency exits switch off safety checks.', 'A real check beats "trust me".', 'Use the note that tells you when it is not needed.'],
          ['Assertions are unchecked: contain them.', 'Self-cleaning suppressions only.', 'Migrate incrementally with `checkJs`.'],
        ),
      },
    ],
    recap: LL(
      ['Escape hatches have a cost.', 'Prefer narrowing and validation.', 'Leave suppressions that expire.'],
      ['Use emergency exits rarely.', 'Check instead of trusting.', 'Keep notes honest.'],
      ['Judgement over dogma.', 'Measure and shrink `any`.', 'Migration is a process.'],
    ),
  },
];

# Authoring a lesson

Lessons are typed data, not HTML. This keeps the content portable, lets the validator prove that every exercise is solvable, and means a missing translation voice degrades instead of breaking the screen.

The three places you will touch:

| File | Purpose |
| --- | --- |
| `src/content/lessons/mNN.ts` | The lesson data, one exported array per module |
| `src/content/curriculum.ts` | Module order, track, titles, and the list of lesson ids |
| `src/content/glossary.ts` | Every `concept` id used by a lesson must exist here |
| `src/content/generated/catalog.ts` | **Generated** — run `npm run content:catalog` after any lesson change |

Lesson content is **not** part of the app's main bundle. The journey map, search, progress and practice read a small generated catalog (titles, minutes, step ids and kinds); a lesson's steps are downloaded with its module when it opens (`src/content/loader.ts`). So after adding or editing a lesson, run:

```powershell
npm run content:catalog    # rewrites src/content/generated/catalog.ts
```

`npm run validate:content` and the unit tests fail with "out of date … run `npm run content:catalog`" when you forget.

**Lesson ids never change, and neither do step ids.** Saved progress, the learner's code drafts and their practice schedule are stored by lesson id and step id (`lessonId:stepId`), so an id is a permanent key, not a position. Renaming a step quietly drops its practice card and draft. A lesson added later gets a new id (for example `m03-l05-loops`, which sits second in Module 3) and its place comes from the module's `lessonIds` list. A lesson the learner has already worked in stays open even when a new lesson is inserted before it.

## 1. The shape of a lesson

```ts
import { L, LL, c, md } from '../authoring';
import type { Lesson } from '../schema';

// L(base, story?, pro?) and LL(base, story?, pro?): the second argument is the
// Story wording (about 7–12), the third is Pro. Story is required for every
// text a learner reads; Pro for reading bodies, explanations and recaps; every
// graded step needs a hint.
export const M08_LESSONS: readonly Lesson[] = [
  {
    id: 'm08-l01-maps',
    moduleId: 'm08',
    order: 1,
    title: {
      story: 'A treasure map for your data',
      explorer: 'Maps: keyed collections',
      pro: 'Map, WeakMap, and insertion order',
    },
    estMinutes: 7,
    prereqs: ['m03-l02-objects'],
    concepts: ['object', 'map-collection'],
    steps: [
      {
        id: 'read',
        kind: 'read',
        prompt: L('Objects use names. Maps use any key.', 'A Map is a box with labelled drawers.'),
        body: L(
          md(
            'An object is fine when the keys are known in advance. A **Map** is better when the keys arrive at runtime.',
            '```ts\nconst scores = new Map<string, number>();\nscores.set("Ada", 3);\nscores.get("Ada"); // 3\n```',
          ),
          md(
            'A **Map** is like a box of drawers. You stick a label on a drawer and put something inside.',
            '```ts\nconst scores = new Map<string, number>();\nscores.set("Ada", 3);\nscores.get("Ada"); // 3\n```',
          ),
          md(
            '`Map<K, V>` accepts keys of any type, compared with SameValueZero (so `NaN` finds `NaN`), and iterates in insertion order. Prefer it to an object for dynamic keys: no prototype keys, a real `size`, and no string coercion of keys.',
            '```ts\nconst scores = new Map<string, number>();\nscores.set("Ada", 3);\nscores.get("Ada"); // number | undefined\n```',
          ),
        ),
        callout: {
          tone: 'tip',
          title: 'One honest difference',
          body: L(
            'A Map remembers the order keys were added. An object does not promise that.',
            'A Map remembers which drawer you filled first.',
          ),
        },
      },
      {
        id: 'check-key',
        kind: 'check',
        prompt: L('When is a Map the better choice?', 'When should you use a Map?'),
        hint: L(
          'Think about where the key names come from: your code, or the data?',
          'Do you know the labels before the program starts?',
        ),
        choices: [
          {
            id: 'runtime',
            text: L('When the keys are only known while the program runs.'),
            correct: true,
          },
          {
            id: 'always',
            text: L('Always — a Map is newer, so it is always better.'),
            correct: false,
            feedback: L(
              'Newer is not the same as better. For a fixed shape, an object is simpler to read.',
              'New is not always better. If you know the labels already, an object is simpler.',
            ),
          },
        ],
        explain: L(
          'Maps shine when key names are data, not part of the program’s shape.',
          'Maps are best when the labels only arrive while the program runs.',
          'Use an object (or a `Record<K, V>`) for a fixed, known shape; use a `Map` when keys are runtime data.',
        ),
      },
      {
        id: 'write-score',
        kind: 'write',
        prompt: L('Write `addScore` so it adds one point for a name and returns the Map.', 'Make `addScore` add one point for a name.'),
        hint: L('Read the old score with `get` (it may be missing), add one, and `set` it.', 'Get the old score, add one, and put it back with `set`.'),
        starter: c(
          'function addScore(scores: Map<string, number>, name: string): Map<string, number> {',
          '  // your code',
          '  return scores;',
          '}',
        ),
        solution: c(
          'function addScore(scores: Map<string, number>, name: string): Map<string, number> {',
          '  scores.set(name, (scores.get(name) ?? 0) + 1);',
          '  return scores;',
          '}',
        ),
        tests: [
          { name: 'stores a first score', call: 'addScore(new Map(), "Ada").get("Ada")', expect: '1' },
          { name: 'increments an existing score', call: 'addScore(addScore(new Map(), "Ada"), "Ada").get("Ada")', expect: '2' },
        ],
        explain: L(
          '`?? 0` handles the missing first score without a special case.',
          '`?? 0` means "no score yet? start from 0".',
          '`get` returns `number | undefined`; `?? 0` narrows it to `number` without treating a stored `0` as missing.',
        ),
      },
      {
        id: 'recap',
        kind: 'recap',
        prompt: L('The short version.', 'What you learned.'),
        points: LL(
          ['A Map takes keys of any type.', 'Use `set` and `get`.', 'A missing key returns `undefined`.'],
          ['A Map is a box of labelled drawers.', '`set` puts in; `get` takes out.', 'An empty drawer gives `undefined`.'],
          ['`Map<K, V>`: any key type, insertion order.', '`get` is `V | undefined`.', 'Objects for fixed shapes, Maps for runtime keys.'],
        ),
      },
    ],
    recap: LL(
      ['Maps are for keys that arrive at runtime.', '`set` writes; `get` reads.', 'Missing keys return `undefined`.'],
      ['A Map is a box of labelled drawers.', '`set` puts in; `get` takes out.', 'An empty drawer gives `undefined`.'],
      ['Reach for `Map` when keys are data.', 'Handle `V | undefined` from `get`.', 'Insertion order is guaranteed.'],
    ),
  },
];
```

Then register it:

```ts
// src/content/curriculum.ts
{
  id: 'm08',
  number: 8,
  track: 'intermediate', // 'foundations' | 'intermediate' | 'advanced', in that order
  title: 'Maps & More',
  tagline: 'Keyed collections and the last useful corners.',
  accent: 'sky',
  lessonIds: ['m08-l01-maps'],
},
```

Then three more registrations:

1. Export the module from `src/content/lessons/index.ts` (that file flattens the per-module arrays into `LESSONS`, for scripts and tests).
2. Add its loader to `MODULE_LOADERS` in `src/content/loader.ts`, so the app can download it:

   ```ts
   m08: () => import('./lessons/m08').then((file) => file.M08_LESSONS),
   ```

3. Run `npm run content:catalog`.

A test checks that every module has exactly one loader returning exactly its lessons, and that no app file imports lesson files directly (which would pull all content back into the main bundle).

Optional module field: `entryFor`, the backgrounds (`'javascript'`, `'typescript'`) for which this module is the suggested starting point after onboarding. Each background may be claimed by one module at most (the validator checks this); `typescript` falls back to the `javascript` entry.

Optional lesson fields: `difficulty` (1 gentle, 2 steady, 3 stretching; default 1) and `objectives` (a `LocList` of "you will be able to…" points; Story wording required).

### Translations

Lesson wording can be translated without touching the lesson file: overlays in `src/content/locales/<language>/` address lessons, steps and choices **by id** (see `docs/translating.md`). That is one more reason ids never change. When you change the English wording of a step, its translations go stale; when you change a fenced code block, the translation check flags every translation that still has the old code.

## 2. Reading modes and fallback

`Loc` carries `base` plus optional `story`, `explorer`, and `pro` variants.

| Mode | Resolves to |
| --- | --- |
| Story | `story` → `explorer` → `base` |
| Explorer | `explorer` → `base` |
| Pro | `pro` → `base` |

So you can write the shared `base` voice first and enrich a mode later without going back to every step.

**Story mode is required, everywhere.** Story mode is for the youngest learners (about 7–12), so everything they read needs a `story` variant: prompts, bodies, callouts, compare captions, hints, strong hints, explanations, choice feedback, step recaps and the lesson recap. `npm run validate:content` fails on any that is missing. Choice *texts* are exempt (they are mostly code, the same for everyone).

**Pro mode is required for the teaching texts.** Pro is for people who already program. Every reading `body`, every `explain`, every recap step's `points` and the lesson `recap` need a `pro` variant (the validator enforces it). Prompts, hints, callouts and choice feedback may share the base wording. Explorer variants stay optional.

Writing for Story mode:

- Short sentences and concrete pictures: a program is a recipe for a robot, a variable is a labelled box, an object is a bag of labelled things, a union is "this or that".
- Keep code names exactly as they appear in code (`map`, `const`), but explain jargon instead of using it: "the `? :` question", not "ternary"; "look first with `typeof`", not "narrowing".
- The second argument of `L(...)` / `LL(...)` is the **Story** wording and the third is **Pro**. Adult wording in the second slot is shown to children.

Writing for Pro mode:

- Assume another language, not TypeScript. Be precise and brief: name the semantics (IEEE 754 doubles, ToBoolean, microtasks, structural typing) and the sharp edges (`-7 % 3`, `[1] !== [1]`, shallow spread).
- Name the compiler flag or error code when there is one (`noUncheckedIndexedAccess`, TS2322), and check it against the TypeScript version in `package.json`.
- Say what a professional would do differently in real code (integer cents, `unknown` at boundaries, exhaustive `never` checks), without changing what the exercise asks.

The authoring helpers are deliberately compact:

```ts
L('Shared wording', 'Story wording', 'Pro wording');   // Loc
LL(['Shared point'], ['Story point'], ['Pro point']);  // LocList
md('Paragraph one.', 'Paragraph two.');
c('const a = 1;', 'const b = 2;');                     // code, no escaped backticks
bullets('First', 'Second');
```

`explorer` is not a helper argument; write it directly when a lesson needs a distinct middle voice:

```ts
prompt: { base: 'Objects group values.', explorer: 'Objects are records with named fields.' }
```

The validator rejects empty variants. If a variant exists, it must say something.

## 3. Step kinds

Every step is one screen and one idea. A lesson must contain **4–7 required steps**; the player is designed for that rhythm, and the validator enforces it. Up to three optional **bonus** steps may follow (see [Bonus steps](#bonus-steps-go-further)); they are not counted.

| Kind | Required fields | Notes |
| --- | --- | --- |
| `read` | `body` | Optional `figure` (an id, or one per mode: `{ base: 'promise', pro: 'event-loop' }`) and `callout`. Diagrams: `first-code`, `type-check`, `let-const`, `branch`, `array`, `object`, `function`, `union`, `narrow`, `promise`, `journey`, `venn-union`, `venn-intersection`, `mapped`, `conditional`, `event-loop` |
| `compare` | `left`, `right` (`title`, `code`, optional `caption`) | Both code samples are syntax-checked |
| `check` | `choices` with at least one `correct` | Add `multi: true` for multi-select |
| `predict` | `code`, `answer` | `alsoAccept` holds alternatives; comparison ignores case, trailing spaces, and blank edge lines. The code is run at build time and `answer` must match its real output. It must type-check unless it breaks a type rule on purpose: then set `typeErrors: 'intended'` and say so in `explain` |
| `fill` | `template` with `___`, `bank`, `answers` | Blank count must equal answers; every answer must be in the bank; the assembled code is syntax-checked |
| `reorder` | `lines` in the correct order | The player shuffles deterministically and never starts solved |
| `fix` / `write` | `starter`, `solution`, `tests` | The solution must pass its tests *and* type-check. A `write` starter must type-check; a `fix` starter may contain the (type) error to fix |
| `types` | `starter`, `solution`, `typeTests` | A type challenge, graded by TypeScript's checker. Optional runtime `tests` run too. See [Type challenges](#type-challenges-types) |
| `predictType` | `code`, `target`, `answer` | "What type does TypeScript give `target`?" Any spelling of the *identical* type is right. See [Predict the type](#predict-the-type-predicttype) |
| `tryIt` | `code` | Seeded playground, not graded. Must run cleanly and type-check |
| `play` | `uses`, `game`, `driver` | A Studio game, not graded: the learner plays what they built, running their own code. See below |
| `recap` | `points` (`LocList`) | Last required step, three short lines |

Any step may also set:

| Field | Meaning |
| --- | --- |
| `bonus: true` | A "Go further" step, offered from the lesson summary. Not needed to finish the lesson |
| `compilerFlags` | Compiler options for this step's type checks, e.g. `{ noUncheckedIndexedAccess: true }`. The step shows which are on |
| `runtime: 'modern'` + `classic` | The step runs ES2022+ JavaScript; `classic` is what older phones show instead. See [Modern and Classic devices](#modern-and-classic-devices) |

### Type challenges (`types`)

The learner edits `starter` until every type test passes. Each test is one or more TypeScript statements placed after the learner's code. `Equal<A, B>`, `NotEqual<A, B>`, `Expect<T>` and `ExpectFalse<T>` are always available:

```ts
{
  id: 'box',
  kind: 'types',
  bonus: true,
  prompt: L('Finish `Box<T>` so every type check passes.', 'Fix the `Box` label so all the checks are happy.'),
  hint: L('The box should hold a value of the type it was given.'),
  starter: c('type Box<T> = {', '  value: unknown;', '};'),
  solution: c('type Box<T> = {', '  value: T;', '};'),
  typeTests: [
    { name: 'a box of numbers holds a number', code: 'type T1 = Expect<Equal<Box<number>["value"], number>>;' },
    // `expect: 'error'`: the line must NOT compile (checked with @ts-expect-error, so one line only).
    { name: 'a box of numbers refuses text', code: 'const wrong: Box<number> = { value: "3" };', expect: 'error' },
  ],
}
```

The validator checks that the `solution` passes every test with no type error of its own, that the `starter` does not, and that an `error` test is a single line. The learner sees the tests (read-only) above the editor, and each result names the test that failed in plain words ("the type is not the one this check expects yet", "TypeScript should reject this line, but it accepts it").

### Predict the type (`predictType`)

```ts
{
  id: 'narrowed',
  kind: 'predictType',
  prompt: L('The `boolean` case has already returned. What type does TypeScript give `rest`?'),
  hint: L('Start from `string | number | boolean` and remove what the `if` has dealt with.'),
  code: c('function describe(value: string | number | boolean): string {', '  if (typeof value === "boolean") return "yes/no";', '  const rest = value;', '  return String(rest);', '}'),
  target: 'rest',            // a variable, parameter, function, type alias or interface declared in `code`
  answer: 'string | number', // shown on reveal
}
```

The learner's answer is compared by the checker for **identity** (`Equal<Answer, typeof rest>`), not assignability: `number | string` is right, `string` is not, and neither is `any`. `alsoAccept` lists spellings to accept without the checker (for example when it cannot start); the validator confirms each one *is* the type. Note that identity is strict about shape: `{ a: 1 } & { b: 2 }` is not identical to `{ a: 1; b: 2 }`, so pick targets whose type has one natural spelling, or list the others in `alsoAccept`. "See types" stays hidden on this step until it is answered.

### Bonus steps ("Go further")

`bonus: true` steps come **after** every required step (after the recap). Finishing the recap finishes the lesson as usual; the summary then offers "Try the bonus step(s)", and a bonus step's Back returns to the summary. Solving one earns XP and counts for badges like any step, but is never needed for completion, certificates or the path. Keep them genuinely optional: a stretch for curious or advanced learners, such as a type challenge or a stricter compiler flag.

### Compiler flags

`compilerFlags` switches on (or, to show what they catch, off) one of: `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitReturns`, `noPropertyAccessFromIndexSignature`, `noImplicitOverride`, `noFallthroughCasesInSwitch`, `strictNullChecks`, `noImplicitAny`. They apply to the step's grading, its "See types", and the validator's checks. Anything else is rejected.

### Modern and Classic devices

The app runs on Android WebViews from version 90 (see `docs/android.md`). **Classic** engines run JavaScript up to ES2021; **Modern** ones (110+) also have ES2022 and ES2023 (`.at()`, `Object.hasOwn`, `structuredClone`, `toSorted`, `toReversed`, `toSpliced`, `with`, `findLast`, `findLastIndex`). Every ordinary step must work on Classic: the validator type-checks it against the ES2021 library and runs it with the ES2022+ built-ins removed.

A step that needs a newer feature says so, and brings what older phones show instead:

```ts
{
  id: 'last',
  kind: 'predict',
  runtime: 'modern',
  prompt: L('`.at()` counts from the end when the number is negative. What prints?'),
  code: c('const queue = ["Ada", "Bo", "Cy"];', 'console.log(queue.at(-1));'),
  answer: 'Cy',
  classic: {
    kind: 'predict',
    prompt: L('`queue.length - 1` is the position of the last item. What prints?'),
    code: c('const queue = ["Ada", "Bo", "Cy"];', 'console.log(queue[queue.length - 1]);'),
    answer: 'Cy',
  },
}
```

The alternative keeps the step's id, so progress, practice cards and badges are the same on either device. It can be any kind that teaches the same idea: a `predict` or `check` using the output recorded on a modern engine, a `compare` of the new way with the classic way, or a `write` solved with the classic equivalent. The validator checks that:

- the modern step really needs a modern engine (its code does not type-check on Classic), and runs on the Modern library and runtime;
- the `classic` alternative exists, is graded exactly when the original is, and passes every check on the Classic library and runtime;
- only steps that run code (`predict`, `fix`, `write`, `types`, `predictType`, `tryIt`, `play`) are marked modern.

Lessons with a modern step are labelled on the journey ("uses newer-phone features", or "Classic versions included" on an older phone), and the step itself is tagged.

### Studio games (`play`)

A `play` step turns a project's functions into something to play. The program that runs is the learner's code from the `uses` steps (their saved code once a step is solved, otherwise the reference solution, and the screen says which), then `const input = <what the player did>;`, then your `driver`. Whatever the driver prints is the game's screen.

```ts
{
  id: 'play',
  kind: 'play',
  prompt: L('Play it: your functions keep the score.', 'Play your game!', 'Run it end to end.'),
  uses: ['score', 'percent'],              // earlier write/fix steps, in program order
  game: { type: 'quiz', questions: [ /* { question: L(…, …), choices: […], answer: 1 } */ ] },
  driver: c(
    'let score = 0;',
    'for (const isCorrect of input.answers) score = scoreAnswer(isCorrect, score);',
    'console.log(`Final score: ${score}`);',
  ),
}
```

| `game.type` | The player sees | `input` the driver gets |
| --- | --- | --- |
| `quiz` | One question at a time; the score is computed when the quiz ends | `{ answers: boolean[] }` |
| `budget` | A budget, quick-add suggestions and a Bought/Cost form; re-runs on every change | `{ budget: number, expenses: { label, amount }[] }` |
| `spinner` | A Spin button | `{ spins: number[] }`, one random whole number (0–999) per wheel |
| `maze` | Level buttons, arrow buttons to plan the robot's moves, a Run button, then the robot moving frame by frame | `{ level, maze: string[], moves: ("up"\|"down"\|"left"\|"right")[] }`. Print `@grid row/row/…` for every frame (`#` wall, `.` floor, `R` robot, `*` star) |
| `pet` | A name field, Feed / Play / Rest / Wait buttons, three meters and a diary | `{ name, actions: ("feed"\|"play"\|"rest"\|"wait")[] }`. Print `@pet {"hunger":…,"energy":…,"fun":…,"mood":"…"}` after each action (0–100) |
| `todo` | A to-do list with add, tick, remove and "clear finished" | `{ actions: TodoAction[] }` (`add` / `toggle` / `remove` / `clearDone`). Print `@todos [{"id":…,"text":"…","done":…}]` with the current list |
| `battle` | Two health bars and a button per move | `{ moves: string[], seed: number }`. Print `@hp {"hero":…,"rival":…,"max":…}` after each turn |
| `adventure` | A story log, a command box and suggested commands | `{ commands: string[] }`. Print what happens |

A line printed as `@tag payload` is data for the game's screen and is not shown as text; every other line is. The program re-runs with the whole input after each thing the player does (the maze runs when Run is pressed), so the driver is a plain fold over the player's actions. The validator runs every game with a sample input and checks the data lines the screen needs are printed (valid JSON where JSON is expected), and that every maze level is rectangular and solvable.

The validator checks that every `uses` id is an earlier `write`/`fix` step of the same lesson, that quizzes have at least two questions with a Story version and a valid `answer`, and that the program built from the reference solutions and a sample input type-checks, runs cleanly and prints something. When a later step repeats an earlier function (as `remaining` repeats `totalSpent`), list only the later step, so nothing is declared twice.

**Every graded step needs a `hint`** (the validator enforces it); `strongHint` is optional. The player always offers "Show me the answer" after the hints; a revealed answer counts as **practised**, not **solved**. A hint points at the idea without giving the answer away.

Every graded step also becomes a **practice card** once the learner answers it (see `src/storage/review.ts`): right first time, it comes back in 3 days; after a retry, tomorrow; with the answer opened, straight away. Practice shows the step on its own, outside its lesson, so a graded step should make sense without the step before it: restate what the prompt needs instead of saying "as above".

## 4. Writing graded tests

A graded step has a reference `solution` and one or more tests:

```ts
tests: [
  {
    name: 'adds two numbers',
    call: 'add(2, 3)',
    expect: '5',
  },
  {
    name: 'keeps text intact',
    call: 'greet("Ada")',
    expect: 'Hello, Ada',
  },
]
```

How a test runs:

1. The learner's code is compiled by the in-app compiler (`esbuild-wasm`, via `src/runner/transform.ts`). `export` is allowed; `import` is not, because the playground runs one file on its own. Curly quotes from phone keyboards are straightened when the code would not compile otherwise.
2. At the same time, **TypeScript's type checker** reads it (`src/runner/typecheckCore.ts`: strict, the ES2021 library on Classic devices or ES2023 on Modern ones, no DOM, each program its own module, plus declarations for `console` and timers, and the step's `compilerFlags`). Type problems mean "not yet", even when every test passes.
3. It runs in a fresh throwaway worker, inside one function, with dangerous globals shadowed and a 2-second hard limit. Timers and promises get up to 70% of that time to finish, so asynchronous output is shown.
4. Each `call` is evaluated as an expression **in the same scope as the learner's code**, after it has run, so it can use any function, constant or class the learner declared. A `call` that returns a promise is awaited.
5. The result is converted to text with one canonical rule:
   - strings stay verbatim;
   - numbers and booleans use `String(value)`;
   - `undefined` becomes `'undefined'`, `null` becomes `'null'`;
   - arrays and objects become `JSON.stringify(value)` (no spaces);
   - functions become `[function name]`.

Output is capped at 1,000 lines / 100,000 characters (2,000 per line), and the learner is told when it was cut off.

Keep `expect` values small and readable. Prefer a test that names the idea over five tests that repeat it. Avoid relying on floating-point formatting you have not checked.

At build time, `npm run validate:content` grades every exercise with **that same pipeline**: the same compile step, the same sandbox program (hosted in Node by `scripts/sandboxNode.ts`) and the same type checker (`scripts/typecheckNode.ts`). It fails when:

- the `solution` does not compile, throws, runs out of time, fails any of its tests, or has a type error;
- the `starter` already passes every test with clean types (the exercise would ask nothing);
- a `write` starter has a type error (learners should start from a clean skeleton);
- a `predict` answer is not what the code prints, or a `tryIt` snippet does not run cleanly;
- a `types` solution fails a type test or its starter already passes them all; a `predictType` answer (or an `alsoAccept` spelling) is not exactly the target's type;
- a step uses an ES2022+ feature without `runtime: 'modern'` and a `classic` alternative (ordinary steps are checked on the Classic engine).

That is intentional: learners should never meet an unsolvable, or an already-solved, exercise.

## 5. Glossary concepts

Every id in `concepts` must exist in `src/content/glossary.ts`:

```ts
{
  id: 'map-collection', // ids are unique: 'map' is already the array method
  term: 'Map',
  short: 'A collection that keeps keys of any type and remembers insertion order.',
  detail: 'Use `map.set(key, value)` to write and `map.get(key)` to read. A missing key returns `undefined`, not an error.',
  example: 'const scores = new Map<string, number>();',
}
```

Keep `short` to one friendly sentence — it is what the command palette and tooltips show. `detail` can be longer. `example` is optional but useful.

## 6. Content voice

- Second person, present tense, short sentences.
- Define a term the first time it appears, then link to it through `concepts`.
- One new idea per lesson; one idea per step.
- Examples use varied, inclusive names and everyday situations. Metric units.
- Comments in code are teaching text, never noise.
- Every code sample must be valid TypeScript under strict settings.
- No emoji as controls. A small celebration glyph is fine.
- Failure copy names what happened, why, and the next small action. Never "Wrong".
- Success copy names the skill, not the person.

## 7. Checklist before committing a lesson

```powershell
npm run validate:content   # quick: just the content checks
npm run check              # everything: typecheck, lint, tests, build, Android scan
```

Also check by hand:

- Read the lesson in all three modes. Does each voice make sense, even where it falls back? Read Story mode as a 9-year-old would: any word they would not know?
- Tab through every exercise. Can you complete it without a mouse?
- Try a plausible wrong answer. Is the feedback specific and kind?
- Try revealing the answer. Does the step become "practised" rather than "solved"?
- On a phone width (360 px), no horizontal scrolling; long code lines wrap. (`playwright/lesson-layout.spec.ts` checks every step, in all three modes, for clipped code, a page wider than the screen and a reachable Next button.)
- Code in reading text goes in a fenced block (` ```ts `) on its own paragraph; it is shown as a real code block, highlighted and wrapped.
- The new concept appears in the glossary and the command palette after a reload.

If a lesson is not ready, cut it rather than shipping a thin one. A finished short lesson beats a long half-finished one.

## 8. Tracks and the advanced modules

Modules belong to a track (`foundations`, `intermediate`, `advanced`) in `src/content/curriculum.ts`; tracks run in order. A module claimed by an experience (`entryFor`) is where onboarding suggests that learner starts: Module 5 for people who know JavaScript, Module 8 for people who already write TypeScript.

Story mode is written in full for every track, Advanced included, with child-sized metaphors that keep the real code: a conditional type is a *sorting hat*, `infer` a *detective*, a mapped type a *stamp machine*, a branded type a *name tag*, a recursive type *dolls inside dolls*. Read each Story text as a 9-year-old would.

Type-level lessons mostly use `types` steps (graded by type tests) and `predictType` steps; runtime behaviour still gets `write`/`fix` steps with tests.

## 9. The arena and the Playground gallery

- **Arena** (`src/content/arena.ts`): each puzzle has an `id` (never changes: it keys progress and drafts), a `level` (`warm-up`, `medium`, `hard`, `extreme`), a `title`, a `prompt`, a `hint`, a `starter`, a `solution`, `typeTests` and an `explain`. It is graded exactly like a `types` step and checked by `validate:content` the same way (solution passes, starter does not). Texts are single-voice.
- **Gallery** (`src/content/gallery.ts`): runnable examples by track. Each must type-check and run cleanly on the Classic engine and print something; the content check runs them. The `id` keys the learner's draft.

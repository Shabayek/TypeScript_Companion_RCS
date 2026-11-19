import { L, LL, bullets, c, md } from '../authoring';
import type { Lesson } from '../schema';

export const M06_LESSONS: readonly Lesson[] = [
  {
    id: 'm06-l01-modules',
    moduleId: 'm06',
    order: 1,
    title: {
      story: 'Splitting a big program into rooms',
      explorer: 'Modules: import and export',
      pro: 'Module boundaries and explicit exports',
    },
    estMinutes: 6,
    concepts: ['module', 'import', 'export'],
    steps: [
      {
        id: 'read',
        kind: 'read',
        prompt: L(
          'One file, one job. Share only what is needed.',
          'One file, one job. Share only what others need.',
        ),
        body: L(
          md(
            'A **module** is a file with its own scope. Nothing leaks out unless you `export` it, and nothing comes in unless you `import` it.',
            '```ts\n// math.ts\nexport function add(a: number, b: number): number {\n  return a + b;\n}\n\n// app.ts\nimport { add } from "./math";\n```',
            'That boundary is a feature. A reader of `app.ts` can see exactly where `add` came from, and a name in one module cannot silently collide with a name in another.',
            'Keep the exported surface small. The fewer things a module promises, the more freely you can change what is inside it.',
          ),
          md(
            'A big program is easier in smaller rooms. Each room is a file.',
            'Doors are `export` (letting something out) and `import` (bringing something in).',
            'If you do not open a door, nobody can see inside the room.',
          ),
          md(
            'Each ES module has its own top-level scope and is evaluated once, on first import; imports are live, read-only bindings. Prefer named exports to `default`: names stay consistent across files and refactor well.',
            'Use `import type { User } from "./user"` for type-only imports. They are erased completely, which avoids runtime cycles and side effects; `verbatimModuleSyntax` makes the distinction mandatory.',
            'A module\'s exports are its API: everything exported is something you have promised not to break.',
          ),
        ),
      },
      {
        id: 'compare',
        kind: 'compare',
        prompt: L('One long file, or two focused ones.', 'One long file, or two small ones?'),
        left: {
          title: 'One file',
          code: c(
            'function add(a: number, b: number) {',
            '  return a + b;',
            '}',
            '',
            'function showTotal() {',
            '  console.log(add(2, 3));',
            '}',
          ),
          caption: L(
            'Fine for a demo. Painful at four hundred lines.',
            'Fine for something small. Hard work when it gets long.',
          ),
        },
        right: {
          title: 'Two modules',
          code: c(
            '// math.ts',
            'export function add(a: number, b: number) {',
            '  return a + b;',
            '}',
            '',
            '// app.ts',
            'import { add } from "./math";',
          ),
          caption: L(
            'Each file can be read, tested and changed on its own.',
            'Each file can be read, tested and changed by itself.',
          ),
        },
      },
      {
        id: 'spot',
        kind: 'check',
        prompt: L('What does `export` do?', 'What does `export` do?'),
        hint: L(
          '`export` and `import` come as a pair. What does one file have to do so another can `import` from it?',
          'Think of sharing: what lets another file use something from this one?',
        ),
        explain: L(
          'It makes a value importable from other modules. Everything else stays private to the file.',
          'It lets other files use the value. Everything else stays private inside the file, like a room with a closed door.',
          '`export` adds a binding to the module\'s public interface. Modules never write to the global object, which is what ended the era of script-tag globals.',
        ),
        choices: [
          {
            id: 'publish',
            text: L('Makes a value available to other modules'),
            correct: true,
          },
          {
            id: 'run',
            text: L('Runs the file immediately'),
            correct: false,
            feedback: L(
              'Importing runs a file, but `export` itself only publishes a value.',
              'Bringing a file in runs it, but `export` only shares a value.',
            ),
          },
          {
            id: 'global',
            text: L('Puts the value on the global object'),
            correct: false,
            feedback: L(
              'That is what modules exist to avoid. Exports are explicit, not global.',
              'Putting things everywhere is what files are meant to avoid. You choose what to share.',
            ),
          },
        ],
      },
      {
        id: 'reorder',
        kind: 'reorder',
        prompt: L('Put the file back in a working order.', 'Put the file back in the right order.'),
        hint: L(
          'Imports come first. A function must be declared before the line that calls it runs.',
          'Start with the `import`. Make the function before you use it.',
        ),
        lines: [
          'import { add } from "./math";',
          'function showTotal(): void {',
          '  const total = add(2, 3);',
          '  console.log(total);',
          '}',
          'showTotal();',
        ],
        explain: L(
          'Imports go at the top so the dependency is visible immediately. The function is declared, then called at the bottom.',
          'The `import` goes at the top, so you can see what the file needs. Then the function is made, and at the bottom it is used.',
          '`import` declarations are resolved before the module body runs, wherever they appear; convention puts them first so dependencies are visible. The function declaration is then called at the bottom.',
        ),
      },
      {
        id: 'recap',
        kind: 'recap',
        prompt: L('The short version.', 'What you learned.'),
        points: LL(
          [
          'A module is a file with its own scope.',
          '`export` publishes; `import` brings in.',
          'Small public surfaces are easier to change.',
        ],
          [
            'A module is a file with its own private space.',
            '`export` shares; `import` brings in.',
            'Share only what is needed.',
          ],
          [
            'Modules have a private top-level scope and are evaluated once.',
            'Prefer named exports; use `import type` for types.',
            'Every export is a public API commitment.',
          ],
        ),
      },
      {
        id: 'type-import',
        kind: 'check',
        bonus: true,
        prompt: L('Go further: what does `import type { User } from "./user";` do?', 'A challenge: what does `import type` mean?'),
        hint: L('Think about what is left once the types are erased.', 'Types disappear when the code runs. What happens to an import of only types?'),
        explain: L(
          '`import type` brings in types only. It is removed completely from the JavaScript, so it can never load a file or create a dependency cycle at runtime.',
          'It borrows only labels (types). When the code runs, that line is gone.',
          'Type-only imports are always elided; with `verbatimModuleSyntax`, regular imports are kept as written, so `import type` (or inline `type` modifiers) is how you mark type-only dependencies.',
        ),
        choices: [
          { id: 'erased', text: L('Imports only the type; the line disappears from the JavaScript'), correct: true },
          { id: 'loads', text: L('Loads the module, then copies its types'), correct: false, feedback: L('Nothing is loaded at runtime: types do not exist there.', 'Nothing is loaded when the code runs. Types are gone by then.') },
          { id: 'faster', text: L('It is the same as `import`, just shorter to type'), correct: false, feedback: L('A normal `import` may load the module at runtime. `import type` never does.', 'A normal import can load a file. `import type` never does.') },
        ],
      },
    ],
    recap: LL(
      [
      'Files are modules with private scope.',
      'Exports are promises to other files.',
      'Import only what you use.',
    ],
      [
        'Files keep their things private.',
        '`export` is a promise to other files.',
        'Only `import` what you use.',
      ],
      [
        'Keep modules cohesive and their exports minimal.',
        'Type-only imports disappear at build time.',
        'Avoid import cycles; move shared code into its own module.',
      ],
    ),
  },

  {
    id: 'm06-l02-errors',
    moduleId: 'm06',
    order: 2,
    title: {
      story: 'When things go wrong',
      explorer: 'Errors and try / catch',
      pro: 'Failure handling with try/catch',
    },
    estMinutes: 7,
    concepts: ['error', 'try-catch'],
    steps: [
      {
        id: 'read',
        kind: 'read',
        prompt: L(
          'Plan for the bad case, not just the good one.',
          'Plan for when things go wrong, not just for when they go right.',
        ),
        body: L(
          md(
            'Some failures are expected: a file is missing, text is not valid JSON, a network request times out. `try` / `catch` lets you keep going instead of stopping the whole program.',
            '```ts\ntry {\n  return JSON.parse(text);\n} catch {\n  return null;\n}\n```',
            'Two habits make this useful:',
            bullets(
              'Only wrap the risky line, not the whole function.',
              'Do something meaningful in `catch` — log, retry, or return a safe value. Swallowing an error silently is how bugs become mysteries.',
            ),
          ),
          md(
            'Sometimes things go wrong: the text is not valid, the file is missing.',
            '`try` is where you put the risky bit. `catch` is your plan B.',
            'Without a plan, the whole program stops.',
          ),
          md(
            'In a `catch` clause the error is typed `unknown` (`useUnknownInCatchVariables`, part of `strict`), because anything can be thrown. Narrow with `error instanceof Error` before reading `.message`.',
            'Keep `try` blocks small so you only catch the failure you expect, and re-throw what you cannot handle. `finally` runs either way and is the place for cleanup.',
            'For expected failures, consider returning a result instead of throwing: `{ ok: true; value: T } | { ok: false; error: string }`. The compiler then makes every caller handle the failure case.',
          ),
        ),
      },
      {
        id: 'compare',
        kind: 'compare',
        prompt: L('The same bad input, two outcomes.', 'The same bad input, two endings.'),
        left: {
          title: 'No plan',
          code: c(
            'function readCount(json: string): number {',
            '  const data = JSON.parse(json);',
            '  return data.count;',
            '}',
            '',
            'readCount("not json"); // throws',
          ),
          caption: L(
            'One bad string stops everything downstream.',
            'One bad bit of text stops everything after it.',
          ),
        },
        right: {
          title: 'With a plan',
          code: c(
            'function readCount(json: string): number {',
            '  try {',
            '    return JSON.parse(json).count ?? 0;',
            '  } catch {',
            '    return 0;',
            '  }',
            '}',
          ),
          caption: L(
            'Bad input becomes a boring zero instead of an outage.',
            'The bad text just becomes 0, and the program keeps going.',
          ),
        },
      },
      {
        id: 'spot',
        kind: 'check',
        prompt: L('Where does the risky line belong?', 'Where does the risky line go?'),
        hint: L(
          '`catch` only handles errors thrown inside its matching `try` block.',
          '`try` is the safety net. Where should the risky line be?',
        ),
        explain: L(
          'Inside `try`. `catch` only runs when something in `try` throws.',
          'Inside `try`. `catch` only runs if something inside `try` goes wrong.',
          'Only exceptions thrown while the `try` block runs reach `catch`. Code outside it is unprotected, and an error thrown inside `catch` propagates as usual.',
        ),
        choices: [
          { id: 'try', text: L('Inside the `try` block'), correct: true },
          { id: 'catch', text: L('Inside the `catch` block'), correct: false, feedback: L(
            '`catch` runs after a failure, so it cannot prevent it.',
            '`catch` runs after something goes wrong, so it cannot stop it from happening.',
          ) },
          { id: 'outside', text: L('Outside both blocks'), correct: false, feedback: L(
            'Then nothing catches the failure.',
            'Then nothing is there to catch the problem.',
          ) },
        ],
      },
      {
        id: 'write',
        kind: 'write',
        prompt: L(
          'Write `readCount` so bad JSON gives 0 instead of crashing.',
          'Make `readCount` give 0 for bad text, instead of breaking.',
        ),
        starter: c(
          'function readCount(json: string): number {',
          '  // try to parse, fall back to 0',
          '  return 0;',
          '}',
        ),
        solution: c(
          'function readCount(json: string): number {',
          '  try {',
          '    const data = JSON.parse(json);',
          '    return data.count ?? 0;',
          '  } catch {',
          '    return 0;',
          '  }',
          '}',
        ),
        tests: [
          { name: 'valid JSON', call: 'readCount(\'{"count":5}\')', expect: '5' },
          { name: 'not JSON at all', call: 'readCount("nope")', expect: '0' },
          { name: 'missing the count', call: 'readCount("{}")', expect: '0' },
        ],
        hint: L(
          '`JSON.parse` throws on bad input, so wrap it in `try` and return 0 from `catch`.',
          '`JSON.parse` breaks on bad text, so put it inside `try`, and give back 0 in `catch`.',
        ),
      },
      {
        id: 'recap',
        kind: 'recap',
        prompt: L('The short version.', 'What you learned.'),
        points: LL(
          [
          '`try` holds the risky code; `catch` runs on failure.',
          'Return a safe value so callers can keep going.',
          'Never swallow an error without a decision.',
        ],
          [
            '`try` holds the risky code; `catch` runs if it goes wrong.',
            'Give back a safe answer so the program can keep going.',
            'Always decide what to do when something breaks.',
          ],
          [
            'A caught error is `unknown`: narrow it before use.',
            'Small `try` blocks; re-throw what you cannot handle; `finally` for cleanup.',
            'A result type makes failure part of the signature.',
          ],
        ),
      },
      {
        id: 'parse-age',
        kind: 'write',
        bonus: true,
        prompt: L(
          'Go further: write `parseAge`: a whole number from 0 to 150, or throw an `Error` with the message `"Not an age: <text>"`.',
          'A challenge: make `parseAge` turn text into an age, or throw an error if it is not a real age.',
        ),
        starter: c('function parseAge(text: string): number {', '  return Number(text);', '}'),
        solution: c(
          'function parseAge(text: string): number {',
          '  const age = Number(text);',
          '  if (!Number.isInteger(age) || age < 0 || age > 150 || text.trim() === "") {',
          '    throw new Error(`Not an age: ${text}`);',
          '  }',
          '  return age;',
          '}',
        ),
        tests: [
          { name: 'a real age', call: 'parseAge("36")', expect: '36' },
          { name: 'not a number', call: '(() => { try { return parseAge("ten"); } catch (error) { return error instanceof Error ? error.message : "?"; } })()', expect: 'Not an age: ten' },
          { name: 'too old', call: '(() => { try { return parseAge("900"); } catch (error) { return error instanceof Error ? error.message : "?"; } })()', expect: 'Not an age: 900' },
          { name: 'empty text', call: '(() => { try { return parseAge(""); } catch (error) { return error instanceof Error ? error.message : "?"; } })()', expect: 'Not an age: ' },
        ],
        hint: L(
          '`Number(text)` gives `NaN` for words. `Number.isInteger` is false for `NaN` and decimals. Watch out: `Number("")` is `0`.',
          'Turn the text into a number. If it is not a whole number from 0 to 150 (or the text is empty), `throw new Error(...)`.',
        ),
        explain: L(
          'Throw at the boundary, where bad input arrives, so the rest of the program only ever sees real ages.',
          'Checking the text as soon as it arrives means the rest of your code can trust the age.',
          '`Number("")` is `0` and `Number(" 7 ")` is `7`, so validate the text as well as the number. In TypeScript, `catch (error)` gives `unknown`: narrow with `instanceof Error`.',
        ),
      },
    ],
    recap: LL(
      [
      'Failures are part of the design.',
      'Wrap the risky line, not everything.',
      '`catch` must do something useful.',
    ],
      [
        'Things going wrong is part of the plan.',
        'Put only the risky line inside `try`.',
        '`catch` must do something useful.',
      ],
      [
        'Exceptions for the unexpected, results for the expected.',
        'Never swallow an error without a decision.',
        'Narrow `unknown` errors with `instanceof Error`.',
      ],
    ),
  },

  {
    id: 'm06-l03-promises',
    moduleId: 'm06',
    order: 3,
    title: {
      story: 'Waiting without stopping',
      explorer: 'Promises and async / await',
      pro: 'Promises, async functions and ordering',
    },
    estMinutes: 7,
    concepts: ['promise', 'async-await', 'function'],
    steps: [
      {
        id: 'read',
        kind: 'read',
        prompt: L('A promise is a value that arrives later.', 'A promise is an answer that arrives later.'),
        body: L(
          md(
            'Some work takes time. A **promise** represents a result that is not ready yet.',
            '```ts\nasync function load() {\n  const data = await getData();\n  return data.items;\n}\n```',
            '`async` marks a function that will pause at `await`. The pause does not block the rest of the program: other work continues while it waits.',
            'The part that catches people out is ordering. Code after an `await` runs later, even if the promise is already resolved.',
          ),
          md(
            'A promise is a note that says "your answer is coming".',
            '`await` means "wait here, but let everything else keep going".',
            'It does not freeze the page. It only pauses this one function.',
          ),
          md(
            'A `Promise<T>` is pending, fulfilled with a `T`, or rejected. An `async` function always returns a promise; `await` suspends that function and resumes it in a microtask once the promise settles.',
            'Microtasks (promise reactions) run after the current synchronous code and before the next task (timers, I/O, events). That is why `.then` callbacks run after the rest of the current script, yet before `setTimeout(…, 0)`.',
            'Consecutive `await`s serialise independent work: start both and wait together with `Promise.all([a(), b()])`, or `Promise.allSettled` when one failure should not discard the others. An unhandled rejection is a bug: always `await` or `.catch`.',
          ),
        ),
        figure: { base: 'promise', pro: 'event-loop' },
      },
      {
        id: 'predict',
        kind: 'predict',
        prompt: L('Look closely at the order.', 'Look carefully at the order!'),
        hint: L(
          'Code inside `.then(...)` runs after the current code has finished, even if the promise is already resolved.',
          'The `.then` part waits its turn. It runs after the lines below it.',
        ),
        code: c(
          'console.log("one");',
          'Promise.resolve("two").then(value => console.log(value));',
          'console.log("three");',
        ),
        answer: c('one', 'three', 'two'),
        explain: L(
          '`.then` schedules its callback for after the current code finishes. So `three` prints before `two`, even though the promise was already resolved.',
          '`.then` says "do this later, when you are free". So "three" is shown before "two", even though the promise was ready straight away.',
          'The `.then` reaction is queued as a microtask, which only runs once the current synchronous script has finished. So `three` logs before `two`, even though the promise was already fulfilled.',
        ),
      },
      {
        id: 'compare',
        kind: 'compare',
        prompt: L('Two ways to wait.', 'Two ways to wait.'),
        left: {
          title: '.then',
          code: c(
            'getUser().then(user => {',
            '  return getOrders(user.id);',
            '}).then(orders => {',
            '  console.log(orders.length);',
            '});',
          ),
          caption: L('Works, but the flow reads sideways.', 'This works, but you read it sideways.'),
        },
        right: {
          title: 'async / await',
          code: c(
            'async function showOrderCount() {',
            '  const user = await getUser();',
            '  const orders = await getOrders(user.id);',
            '  console.log(orders.length);',
            '}',
          ),
          caption: L(
            'Top to bottom, like synchronous code.',
            'You read it from top to bottom, like normal code.',
          ),
        },
      },
      {
        id: 'spot',
        kind: 'check',
        prompt: L(
          'What does `await` do to the rest of the app?',
          'What does `await` do to the rest of the app?',
        ),
        hint: L(
          '`await` is only allowed in `async` functions. What does it pause: that function, or everything?',
          'Think of waiting for a friend: do you stop the whole world, or just wait yourself?',
        ),
        explain: L(
          'It pauses only the async function. Other events, clicks and renders continue while the value is pending.',
          'It pauses only this one function. The rest of the app — clicks, buttons, drawing — keeps going while it waits.',
          '`await` hands control back to the event loop; the rest of the async function resumes later as a microtask. Nothing else is blocked in the meantime.',
        ),
        choices: [
          {
            id: 'freeze',
            text: L('Freezes the whole page until the value arrives'),
            correct: false,
            feedback: L(
              'That would be a blocking wait. JavaScript avoids that on purpose.',
              'That would freeze everything. JavaScript avoids that on purpose.',
            ),
          },
          {
            id: 'pause',
            text: L('Pauses this function while other work continues'),
            correct: true,
          },
          {
            id: 'convert',
            text: L('Turns the promise into a plain value immediately'),
            correct: false,
            feedback: L(
              'It waits for the value; it cannot make it arrive sooner.',
              'It waits for the answer. It cannot make it arrive faster.',
            ),
          },
        ],
      },
      {
        id: 'recap',
        kind: 'recap',
        prompt: L('The short version.', 'What you learned.'),
        points: LL(
          [
          'A promise is a future value.',
          '`await` pauses one function, not the whole program.',
          'Code after an `await` runs later than you might expect.',
        ],
          [
            'A promise is an answer that comes later.',
            '`await` pauses one function, not the whole program.',
            'Code after an `await` can run later than you think.',
          ],
          [
            'A promise is pending, fulfilled or rejected.',
            '`await` resumes in a microtask, after the current synchronous code.',
            'Run independent work concurrently with `Promise.all`.',
          ],
        ),
      },
      {
        id: 'loop-order',
        kind: 'predict',
        bonus: true,
        prompt: L('Go further: a timer, a promise and plain code. What prints?', 'A challenge: a timer, a promise and normal code. What will it show, in order?'),
        hint: L(
          'Plain code runs first, then promise callbacks, then timers, even a timer of 0 ms.',
          'First the normal lines, then the promise jobs, then the timers — even a timer with 0.',
        ),
        code: c(
          'console.log("a");',
          'setTimeout(() => console.log("d"), 0);',
          'Promise.resolve().then(() => console.log("c"));',
          'console.log("b");',
        ),
        answer: c('a', 'b', 'c', 'd'),
        explain: L(
          'Promise callbacks (microtasks) run as soon as the current code finishes; timers wait for the next turn of the event loop.',
          'Promise jobs jump the queue ahead of timers. So "c" comes before "d".',
          'After the script, the microtask queue is drained (`c`) before the next macrotask (the timer, `d`). That is why `await` continuations run before `setTimeout(fn, 0)`.',
        ),
      },
    ],
    recap: LL(
      [
      'Promises represent work in progress.',
      '`async`/`await` reads like normal code.',
      'Ordering is not the same as line order.',
    ],
      [
        'A promise is work that is still happening.',
        '`async` and `await` read like normal code.',
        'What runs first is not always the line on top.',
      ],
      [
        'Microtasks run before timers; line order is not execution order.',
        'Handle every rejection.',
        '`Promise.all` for concurrency, `allSettled` for partial failure.',
      ],
    ),
  },

  {
    id: 'm06-l04-classes',
    moduleId: 'm06',
    order: 4,
    title: {
      story: 'Blueprints for objects',
      explorer: 'Classes, when they help, when they do not',
      pro: 'Classes, encapsulation and judgement',
    },
    estMinutes: 7,
    concepts: ['class', 'method', 'property', 'object'],
    steps: [
      {
        id: 'read',
        kind: 'read',
        prompt: L(
          'A class is a blueprint; an instance is the thing built from it.',
          'A class is a plan. An instance is the thing built from the plan.',
        ),
        body: L(
          md(
            'A **class** bundles data with the functions that work on it:',
            '```ts\nclass Counter {\n  private value = 0;\n\n  increment(): number {\n    this.value += 1;\n    return this.value;\n  }\n}\n\nconst counter = new Counter();\ncounter.increment(); // 1\n```',
            '`private` keeps `value` from being changed from outside, so the class controls its own rules.',
            'Be honest about when this helps. A class earns its place when there is **identity and state that must change together** — a game character, an editor session, a connection. For plain data, an object and a few pure functions is usually simpler and easier to test.',
          ),
          md(
            'A class is a blueprint for making objects. `new Counter()` builds one from the blueprint.',
            'The blueprint can keep secrets: `private` means "only this class may touch it".',
            'For plain data, a plain object is simpler. Classes are for things that change over time.',
          ),
          md(
            'TypeScript adds access modifiers (`private`, `protected`, `public`), `readonly` fields, parameter properties and `implements` checks to classes. `private` is compile-time only; JavaScript\'s `#field` is enforced at runtime.',
            'Classes are still typed structurally: any object with the same public members is assignable to the class type, unless the class has `private` or `#` members, which makes it effectively nominal.',
            'Reach for a class when identity and mutable state must stay consistent together. For data plus transformations, plain objects and pure functions are easier to test and to serialise.',
          ),
        ),
      },
      {
        id: 'compare',
        kind: 'compare',
        prompt: L('The same behaviour, two styles.', 'The same job, two styles.'),
        left: {
          title: 'Object + functions',
          code: c(
            'const counter = { value: 0 };',
            '',
            'function increment(state: { value: number }) {',
            '  state.value += 1;',
            '  return state.value;',
            '}',
          ),
          caption: L(
            'Simple, testable, no `this`. Great for plain data.',
            'Simple and easy to test. Great for plain information.',
          ),
        },
        right: {
          title: 'Class',
          code: c(
            'class Counter {',
            '  private value = 0;',
            '  increment(): number {',
            '    this.value += 1;',
            '    return this.value;',
            '  }',
            '}',
          ),
          caption: L(
            'Protects its own state. Worth it when there are several rules to keep.',
            'Looks after its own insides. Worth it when there are rules to keep.',
          ),
        },
      },
      {
        id: 'fill',
        kind: 'fill',
        prompt: L('Build one instance.', 'Build one counter from the plan.'),
        hint: L(
          'Which keyword creates an instance from a class?',
          'Which word builds something new from a plan?',
        ),
        template: c('class Counter {', '  value = 0;', '}', '', 'const counter = ___ Counter();'),
        bank: ['new', 'class', 'make', 'create'],
        answers: ['new'],
        explain: L(
          '`new` creates an instance from the class blueprint.',
          '`new` builds a real thing from the class plan.',
          '`new` creates an object whose prototype is `Counter.prototype` and runs the constructor, here just the field initialiser. Calling a class without `new` throws a `TypeError`.',
        ),
      },
      {
        id: 'write',
        kind: 'write',
        prompt: L(
          'Finish the `Counter` class so `increment()` adds one and returns the new value.',
          'Finish `Counter` so `increment()` adds one and gives back the new number.',
        ),
        starter: c(
          'class Counter {',
          '  private value = 0;',
          '',
          '  increment(): number {',
          '    // add one, then return the value',
          '    return this.value;',
          '  }',
          '}',
        ),
        solution: c(
          'class Counter {',
          '  private value = 0;',
          '',
          '  increment(): number {',
          '    this.value += 1;',
          '    return this.value;',
          '  }',
          '}',
        ),
        tests: [
          { name: 'first increment', call: 'new Counter().increment()', expect: '1' },
          {
            name: 'two increments share state',
            call: '(() => { const c = new Counter(); c.increment(); return c.increment(); })()',
            expect: '2',
          },
          {
            name: 'each instance is separate',
            call: '(() => { const a = new Counter(); a.increment(); const b = new Counter(); return b.increment(); })()',
            expect: '1',
          },
        ],
        hint: L(
          'Use `this.value += 1;` before the `return`.',
          'Write `this.value += 1;` before the `return`.',
        ),
        explain: L(
          'Each instance gets its own `value`. That is the difference between a class and a shared object.',
          'Every counter you build gets its own `value`. That is what a class is for.',
          'Every instance gets its own `value`, initialised when it is constructed. `private` blocks outside writes at compile time; use `#value` if you need the guarantee at runtime too.',
        ),
      },
      {
        id: 'recap',
        kind: 'recap',
        prompt: L('The short version.', 'What you learned.'),
        points: LL(
          [
          'A class is a blueprint; `new` builds an instance.',
          '`this` refers to the instance the method was called on.',
          'Prefer plain data and functions unless state and rules belong together.',
        ],
          [
            'A class is a plan; `new` builds a thing from it.',
            '`this` means "the thing this belongs to".',
            'Plain information and functions are often enough.',
          ],
          [
            '`new` builds an instance; field initialisers run for each one.',
            '`private` is compile-time; `#private` is enforced at runtime.',
            'Classes with private members behave nominally.',
          ],
        ),
      },
      {
        id: 'wallet',
        kind: 'write',
        bonus: true,
        prompt: L(
          'Go further: finish `Wallet`: a private `#coins` field, `add(n)` and a `coins` getter. Adding a negative amount throws.',
          'A challenge: finish the `Wallet` class. Nobody outside may touch the coins directly!',
        ),
        starter: c(
          'class Wallet {',
          '  // a private field for the coins',
          '  add(amount: number): void {}',
          '  get coins(): number {',
          '    return 0;',
          '  }',
          '}',
        ),
        solution: c(
          'class Wallet {',
          '  #coins = 0;',
          '  add(amount: number): void {',
          '    if (amount < 0) throw new Error("Cannot add a negative amount");',
          '    this.#coins += amount;',
          '  }',
          '  get coins(): number {',
          '    return this.#coins;',
          '  }',
          '}',
        ),
        tests: [
          { name: 'adds up', call: '(() => { const w = new Wallet(); w.add(3); w.add(4); return w.coins; })()', expect: '7' },
          { name: 'refuses negatives', call: '(() => { const w = new Wallet(); try { w.add(-1); } catch { return "refused"; } return "accepted"; })()', expect: 'refused' },
          { name: 'starts empty', call: 'new Wallet().coins', expect: '0' },
        ],
        hint: L('Declare `#coins = 0;`, change it in `add` with `this.#coins += amount`, and return it from the getter.', 'Write `#coins = 0;` at the top. `add` adds to `this.#coins`, and the getter gives it back.'),
        explain: L(
          'A `#` field is truly private: code outside the class cannot read or change it, so every change goes through `add`, which checks it.',
          'The `#` makes the coins secret. The only way in is `add`, and `add` checks the amount.',
          '`#private` fields are enforced at runtime (unlike TypeScript’s `private`, which is erased). A getter exposes a read-only view, so the invariant lives in one method.',
        ),
      },
    ],
    recap: LL(
      [
      'Classes bundle state and behaviour.',
      '`new` makes an instance; `private` protects internals.',
      'Use them with judgement, not by default.',
    ],
      [
        'Classes keep information and actions together.',
        '`new` builds one; `private` keeps its insides safe.',
        'Use them when they help, not every time.',
      ],
      [
        'Use a class for identity, state and the rules that keep them consistent.',
        'Prefer `#private` when encapsulation must hold at runtime.',
        'Otherwise, default to data and functions.',
      ],
    ),
  },
];

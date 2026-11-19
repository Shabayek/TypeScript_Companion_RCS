import { L, LL, c, md } from '../authoring';
import type { Lesson } from '../schema';

export const M08_LESSONS: readonly Lesson[] = [
  {
    id: 'm08-l01-function-types',
    moduleId: 'm08',
    order: 1,
    title: {
      story: 'Describing a machine’s plug',
      explorer: 'Function types and callbacks',
      pro: 'Function type expressions and contextual typing',
    },
    estMinutes: 7,
    difficulty: 2,
    concepts: ['function-type', 'callback', 'annotation', 'void'],
    objectives: LL(
      ['Write a function’s type: `(value: number) => string`.', 'Let TypeScript type a callback’s parameters from where it is used.', 'Know what a `void` callback may return.'],
      ['Describe what a machine takes and gives back.', 'Let TypeScript fill in the labels for you.', 'Know what `void` means for a machine you hand over.'],
    ),
    steps: [
      {
        id: 'read',
        kind: 'read',
        prompt: L('A function has a type, like any value.', 'A machine has a shape too: what goes in, what comes out.'),
        body: L(
          md(
            'Functions are values, so they have types. A **function type** lists the parameters and the return type:',
            '```ts\ntype Formatter = (value: number) => string;\n\nconst asPrice: Formatter = (value) => `€${value.toFixed(2)}`;\n\nfunction formatAll(values: number[], format: Formatter): string[] {\n  return values.map(format);\n}\n```',
            'Notice `(value) => …` has no annotation: TypeScript already knows `value` is a `number`, because the function is going into a `Formatter` slot. That is **contextual typing**, and it is why callbacks rarely need annotations.',
          ),
          md(
            'A machine’s type says what goes in and what comes out: `(value: number) => string` means "a number goes in, words come out".',
            'When you give a machine to another machine, TypeScript already knows what goes in, so you do not have to write the labels again.',
          ),
          md(
            'A function type expression `(a: A, b: B) => R` is structural: parameter names are documentation, and a function with *fewer* parameters is assignable (extra arguments are ignored at runtime). Parameters are checked bivariantly for methods but contravariantly for function-typed properties under `strictFunctionTypes`.',
            'Contextual typing flows the expected type into arrow parameters, so annotate at the boundary (the `Formatter` alias or the parameter) and let callbacks infer. A `void` return type in a *callback* position means "the return value is ignored", so `(n) => arr.push(n)` is accepted where `(n: number) => void` is expected.',
            'For call signatures with properties, use an object type: `{ (value: number): string; label: string }`.',
          ),
        ),
      },
      {
        id: 'infer',
        kind: 'predictType',
        prompt: L('What type does TypeScript give `labels`?', 'What is the type of `labels`?'),
        hint: L('`map` collects whatever the function returns. What does a `Formatter` return?', 'Each number goes through `shout`. What kind of thing comes out each time?'),
        code: c(
          'type Formatter = (value: number) => string;',
          'const shout: Formatter = (value) => `${value}!`;',
          'const labels = [1, 2, 3].map(shout);',
          'console.log(labels);',
        ),
        target: 'labels',
        answer: 'string[]',
        alsoAccept: ['Array<string>'],
        explain: L(
          'Each number goes through a `Formatter`, which returns a `string`, so the result is a `string[]`.',
          'Numbers go in and words come out, so you get a list of words: `string[]`.',
          '`map<U>` infers `U` from the callback’s return type, here `string` from the `Formatter` alias.',
        ),
      },
      {
        id: 'fits',
        kind: 'check',
        multi: true,
        prompt: L('Which of these can be passed where `(value: number) => void` is expected? Pick all that fit.', 'Which machines fit a slot that says `(value: number) => void`? Pick all that fit.'),
        hint: L('A callback may use fewer parameters than offered, and a `void` callback’s return value is ignored.', 'A machine can ignore things it is given, and whatever it gives back is thrown away.'),
        explain: L(
          'Both one-parameter functions fit: the return value of a `void` callback is ignored. A function that *needs* two parameters does not fit, because only one will be given.',
          'Machines with one input fit, even if they give something back (it is ignored). The one that needs two inputs will not get them.',
          'Assignability of function types: fewer parameters is fine, more required parameters is not; and any return type is assignable to a `void` return in this position.',
        ),
        choices: [
          { id: 'log', text: L('`(n) => console.log(n)`'), correct: true },
          { id: 'double', text: L('`(n) => n * 2`'), correct: true },
          {
            id: 'two',
            text: L('`(a: number, b: number) => a + b`'),
            correct: false,
            feedback: L('It requires two parameters, but callers will only pass one.', 'It needs two inputs, but it would only get one.'),
          },
        ],
      },
      {
        id: 'greeter',
        kind: 'write',
        prompt: L(
          'Write `makeGreeter`: it takes a greeting and returns a function that greets a name, so `makeGreeter("Hi")("Ada")` is `"Hi, Ada!"`.',
          'Make `makeGreeter`, a machine that builds greeting machines: `makeGreeter("Hi")("Ada")` gives `"Hi, Ada!"`.',
        ),
        starter: c(
          'type Greeter = (name: string) => string;',
          '',
          'function makeGreeter(greeting: string): Greeter {',
          '  return (name) => name;',
          '}',
        ),
        solution: c(
          'type Greeter = (name: string) => string;',
          '',
          'function makeGreeter(greeting: string): Greeter {',
          '  return (name) => `${greeting}, ${name}!`;',
          '}',
        ),
        tests: [
          { name: 'hi', call: 'makeGreeter("Hi")("Ada")', expect: 'Hi, Ada!' },
          { name: 'hello', call: 'makeGreeter("Hello")("world")', expect: 'Hello, world!' },
          { name: 'reusable', call: '(() => { const hey = makeGreeter("Hey"); return [hey("Bo"), hey("Cy")]; })()', expect: '["Hey, Bo!","Hey, Cy!"]' },
        ],
        hint: L(
          'Return an arrow function that uses both `greeting` and `name` in a template literal.',
          'Give back a little arrow machine that puts `greeting` and `name` together with backticks.',
        ),
        explain: L(
          'The return type `Greeter` types `name` for you, and the inner function remembers `greeting` (a closure).',
          'Because the slot says `Greeter`, TypeScript already knows `name` is text. And the little machine remembers the greeting.',
          'The declared return type contextually types the returned arrow; the closure captures `greeting`. Returning functions is how you build configurable behaviour without classes.',
        ),
      },
      {
        id: 'listener',
        kind: 'fix',
        prompt: L('`log` does not fit the `Listener` type. Fix its parameter.', 'The `log` machine has the wrong plug. Fix its input label.'),
        hint: L('A `Listener` receives a `string`. What does `log` say it receives?', 'The slot says a word goes in. What does `log` say goes in?'),
        starter: c(
          'type Listener = (message: string) => void;',
          '',
          'function notify(listeners: Listener[], message: string): number {',
          '  listeners.forEach((listener) => listener(message));',
          '  return listeners.length;',
          '}',
          '',
          'const log: Listener = (message: number) => console.log(message);',
        ),
        solution: c(
          'type Listener = (message: string) => void;',
          '',
          'function notify(listeners: Listener[], message: string): number {',
          '  listeners.forEach((listener) => listener(message));',
          '  return listeners.length;',
          '}',
          '',
          'const log: Listener = (message) => console.log(message);',
        ),
        tests: [{ name: 'notifies one listener', call: 'notify([log], "saved")', expect: '1' }],
        explain: L(
          'Removing the wrong annotation lets contextual typing give `message` the right type, `string`. Writing `(message: string)` works too.',
          'Once the wrong label is gone, TypeScript fills in the right one by itself.',
          'A parameter annotation that contradicts the context is an error (a `string` cannot be passed to a `number` parameter). Dropping it lets the context supply `string`.',
        ),
      },
      {
        id: 'recap',
        kind: 'recap',
        prompt: L('The short version.', 'What you learned.'),
        points: LL(
          ['A function type is `(params) => returnType`.', 'Callbacks get their parameter types from the context.', 'A `void` callback’s return value is ignored.'],
          ['A machine’s type says what goes in and what comes out.', 'TypeScript fills in labels for machines you hand over.', 'Machines can return machines.'],
          ['Function types are structural; fewer parameters are assignable.', 'Annotate at boundaries, infer inside.', '`void` in callback position ignores returns.'],
        ),
      },
    ],
    recap: LL(
      ['Name function types with a `type` alias.', 'Let contextual typing do the work for callbacks.', 'Functions can return functions.'],
      ['Machines have types too.', 'Let TypeScript fill in the labels.', 'A machine can build machines.'],
      ['Model behaviour with function types.', 'Prefer contextual typing to repeated annotations.', 'Closures capture configuration.'],
    ),
  },

  {
    id: 'm08-l02-overloads',
    moduleId: 'm08',
    order: 2,
    title: {
      story: 'One machine, two different answers',
      explorer: 'Function overloads',
      pro: 'Overload signatures and when to avoid them',
    },
    estMinutes: 7,
    difficulty: 2,
    concepts: ['overload', 'function-type', 'union'],
    objectives: LL(
      ['Write overload signatures when the return type depends on the argument type.', 'Know callers see only the overloads.', 'Prefer a union or a generic when that is enough.'],
      ['Give a machine two ways to be used.', 'Know which way TypeScript picks.', 'Keep it simple when one way is enough.'],
    ),
    steps: [
      {
        id: 'read',
        kind: 'read',
        prompt: L('Overloads: several signatures, one body.', 'One machine, several ways to use it.'),
        body: L(
          md(
            'Sometimes what a function returns depends on what you give it. **Overloads** list each way of calling it, followed by one implementation:',
            '```ts\nfunction parse(input: string): number;\nfunction parse(input: string[]): number[];\nfunction parse(input: string | string[]): number | number[] {\n  return Array.isArray(input) ? input.map(Number) : Number(input);\n}\n\nconst one = parse("4");          // number\nconst many = parse(["1", "2"]);  // number[]\n```',
            'Callers only see the first two lines. The third signature belongs to the body and must be compatible with all of them.',
          ),
          md(
            'Some machines give different things back depending on what you put in. Put in one word, get one number. Put in a list of words, get a list of numbers.',
            'Overloads are a list of "ways to use this machine". TypeScript picks the first way that fits.',
          ),
          md(
            'Overload resolution tries the signatures top to bottom and picks the first match, so order from most to least specific. The implementation signature is not callable from outside; it must be assignable from each overload, and TypeScript does not check that each overload’s return type matches what the body returns for that input, so keep the body honest.',
            'Reach for overloads only when the return type depends on the argument *type* in a way a union cannot express. If the relationship is "same type in, same type out", a generic is simpler; if it is "any of these, same result", a union parameter is enough.',
          ),
        ),
      },
      {
        id: 'pick',
        kind: 'predictType',
        prompt: L('Which overload does `many` use? What type does it get?', 'Which way of using `parse` is chosen for `many`? What type does it get?'),
        hint: L('The argument is an array of strings. Which signature accepts that?', 'A list of words goes in. Which way of using `parse` takes a list?'),
        code: c(
          'function parse(input: string): number;',
          'function parse(input: string[]): number[];',
          'function parse(input: string | string[]): number | number[] {',
          '  return Array.isArray(input) ? input.map(Number) : Number(input);',
          '}',
          'const many = parse(["1", "2"]);',
          'console.log(many);',
        ),
        target: 'many',
        answer: 'number[]',
        alsoAccept: ['Array<number>'],
        explain: L(
          'The second overload matches a `string[]`, so `many` is `number[]`, not the vague `number | number[]` of the body.',
          'A list went in, so the second way is used, and a list of numbers comes out.',
          'The call resolves against the overload list, never the implementation signature, so callers get the precise `number[]`.',
        ),
      },
      {
        id: 'double',
        kind: 'types',
        prompt: L(
          'Add overloads to `double` so a string gives a `string` and a number gives a `number`.',
          'Teach `double` two ways: a word in gives a word out, a number in gives a number out.',
        ),
        hint: L(
          'Add two signatures above the implementation: `function double(value: string): string;` and `function double(value: number): number;`.',
          'Write two extra lines above the machine: one for words and one for numbers, each ending with `;`.',
        ),
        strongHint: L(
          'The implementation stays as it is; the two overload lines go directly above it.',
          'Keep the machine as it is. Just add the two lines above it.',
        ),
        starter: c(
          'function double(value: string | number): string | number {',
          '  return typeof value === "string" ? value + value : value * 2;',
          '}',
        ),
        solution: c(
          'function double(value: string): string;',
          'function double(value: number): number;',
          'function double(value: string | number): string | number {',
          '  return typeof value === "string" ? value + value : value * 2;',
          '}',
        ),
        typeTests: [
          { name: 'text gives text', code: 'const a = double("ab");\ntype T1 = Expect<Equal<typeof a, string>>;' },
          { name: 'a number gives a number', code: 'const b = double(21);\ntype T2 = Expect<Equal<typeof b, number>>;' },
          { name: 'anything else is refused', code: 'double(true);', expect: 'error' },
        ],
        tests: [
          { name: 'doubles text', call: 'double("ab")', expect: 'abab' },
          { name: 'doubles a number', call: 'double(21)', expect: '42' },
        ],
        explain: L(
          'With overloads, each caller gets the exact type for what they passed. Without them, every caller had to narrow `string | number` again.',
          'Now TypeScript knows: words in, words out; numbers in, numbers out.',
          'This is the canonical overload use case: a return type correlated with the argument type. A generic `T extends string | number` would not work here, because `value * 2` is not a `T`.',
        ),
      },
      {
        id: 'when',
        kind: 'check',
        prompt: L('`len(value: string | unknown[]): number` returns a number either way. Do you need overloads?', '`len` always gives back a number, whatever goes in. Does it need two ways?'),
        hint: L('Overloads earn their keep when the *return type* changes with the input.', 'Does the answer change kind depending on what goes in?'),
        explain: L(
          'No: the return type is always `number`, so a union parameter says everything. Overloads would just be more to read.',
          'No. It always gives a number, so one simple way is enough.',
          'A union parameter suffices when the output does not depend on which member was passed. Overloads also degrade when callers hold a union (`len(x)` with `x: string | unknown[]` would match neither overload).',
        ),
        choices: [
          { id: 'no', text: L('No, a union parameter is enough'), correct: true },
          {
            id: 'yes',
            text: L('Yes, one overload per input type'),
            correct: false,
            feedback: L('The return type never changes, so overloads add nothing but lines.', 'The answer is always a number, so extra ways add nothing.'),
          },
        ],
      },
      {
        id: 'recap',
        kind: 'recap',
        prompt: L('The short version.', 'What you learned.'),
        points: LL(
          ['Overloads list the ways to call a function, then one implementation.', 'Callers see only the overloads, tried in order.', 'Use them only when the return type depends on the input type.'],
          ['Overloads are ways to use one machine.', 'TypeScript picks the first way that fits.', 'If the answer is always the same kind, you do not need them.'],
          ['Order overloads from specific to general.', 'The implementation signature is invisible to callers.', 'Prefer unions or generics when they express the relationship.'],
        ),
      },
    ],
    recap: LL(
      ['Overloads connect input types to output types.', 'Write them above one implementation.', 'Do not use them when a union will do.'],
      ['One machine can have several ways to be used.', 'Each way says what comes out.', 'Keep it simple when you can.'],
      ['Overloads model correlated parameter/return types.', 'Keep the body honest: it is not checked per overload.', 'Prefer generics for "same type in, same type out".'],
    ),
  },

  {
    id: 'm08-l03-type-predicates',
    moduleId: 'm08',
    order: 3,
    title: {
      story: 'Teaching TypeScript to look inside',
      explorer: 'Type predicates: value is Type',
      pro: 'User-defined type guards',
    },
    estMinutes: 7,
    difficulty: 2,
    concepts: ['type-predicate', 'narrowing', 'union', 'unknown'],
    objectives: LL(
      ['Write a function whose result narrows a type: `value is string`.', 'Use it in `if` and in `filter`.', 'Know that TypeScript trusts a predicate, right or wrong.'],
      ['Make your own "is it a …?" checker.', 'Use it to sort things out.', 'Know that TypeScript believes what your checker says.'],
    ),
    steps: [
      {
        id: 'read',
        kind: 'read',
        prompt: L('Your own checks can narrow types.', 'You can teach TypeScript a new way to look inside the box.'),
        body: L(
          md(
            '`typeof` and `in` narrow types. So can your own function, if its return type is a **type predicate**:',
            '```ts\ntype Fish = { swim: () => string };\ntype Bird = { fly: () => string };\n\nfunction isFish(pet: Fish | Bird): pet is Fish {\n  return "swim" in pet;\n}\n\nfunction move(pet: Fish | Bird): string {\n  return isFish(pet) ? pet.swim() : pet.fly();\n}\n```',
            'When `isFish(pet)` is true, TypeScript knows `pet` is a `Fish`; otherwise it is a `Bird`. A plain `boolean` return type would not teach it anything.',
          ),
          md(
            'Sometimes you want your own "is it a fish?" checker. If the checker says `pet is Fish`, TypeScript believes it.',
            'After the check says yes, TypeScript knows it is a fish and lets you use `swim`. If it says no, it must be the bird.',
          ),
          md(
            'A user-defined type guard `(x: A) => x is B` (where `B` is assignable to `A`) narrows the argument in the true branch and, for unions, to the remaining members in the false branch. `Array.prototype.filter` has an overload taking a predicate, so `xs.filter(isFish)` is `Fish[]`.',
            'Since TS 5.5, predicates are also *inferred* for simple function bodies without a return annotation, e.g. `(x) => x !== undefined`. Writing one explicitly documents intent.',
            'The body is not verified: a predicate is an unchecked assertion with a boolean interface. Keep guards small and test them.',
          ),
        ),
      },
      {
        id: 'filtered',
        kind: 'predictType',
        prompt: L('What type does `names` have after filtering with the predicate?', 'After the checker sorts them, what type is `names`?'),
        hint: L('`isDefined` promises `value is T`. `filter` uses that promise to change the element type.', 'The checker throws away the empty ones, and it tells TypeScript so.'),
        code: c(
          'function isDefined<T>(value: T | undefined): value is T {',
          '  return value !== undefined;',
          '}',
          'const maybe: (string | undefined)[] = ["Ada", undefined, "Bo"];',
          'const names = maybe.filter(isDefined);',
          'console.log(names);',
        ),
        target: 'names',
        answer: 'string[]',
        alsoAccept: ['Array<string>'],
        explain: L(
          '`filter` has a special version for type predicates: the result keeps only the `T` part, so `undefined` is gone from the type too.',
          'The checker removed the empty ones, and told TypeScript. So the list is just words now.',
          '`filter<S extends T>(pred: (value: T) => value is S): S[]` narrows the element type; a plain `boolean` callback would leave `(string | undefined)[]`.',
        ),
      },
      {
        id: 'guard',
        kind: 'types',
        prompt: L('Change `isFish` so it narrows: its return type must be a type predicate.', 'Make `isFish` teach TypeScript: change what it says it gives back.'),
        hint: L('Replace `boolean` with `pet is Fish`.', 'Instead of `boolean`, write `pet is Fish`.'),
        starter: c(
          'type Fish = { swim: () => string };',
          'type Bird = { fly: () => string };',
          '',
          'function isFish(pet: Fish | Bird): boolean {',
          '  return "swim" in pet;',
          '}',
        ),
        solution: c(
          'type Fish = { swim: () => string };',
          'type Bird = { fly: () => string };',
          '',
          'function isFish(pet: Fish | Bird): pet is Fish {',
          '  return "swim" in pet;',
          '}',
        ),
        typeTests: [
          { name: 'narrows in an if', code: 'declare const pet: Fish | Bird;\nif (isFish(pet)) {\n  type T1 = Expect<Equal<typeof pet, Fish>>;\n}' },
          { name: 'the else branch is a Bird', code: 'declare const other: Fish | Bird;\nif (!isFish(other)) {\n  type T2 = Expect<Equal<typeof other, Bird>>;\n}' },
          { name: 'filter keeps only fish', code: 'declare const pets: (Fish | Bird)[];\nconst fish = pets.filter(isFish);\ntype T3 = Expect<Equal<typeof fish, Fish[]>>;' },
        ],
        tests: [
          { name: 'a fish', call: 'isFish({ swim: () => "splash" })', expect: 'true' },
          { name: 'a bird', call: 'isFish({ fly: () => "flap" })', expect: 'false' },
        ],
        explain: L(
          'Same body, same runtime behaviour; only the return type changed. Now TypeScript learns from every call.',
          'The checker works exactly the same. But now TypeScript listens to it.',
          'The predicate connects the boolean result to a narrowing of `pet`; the runtime code is identical, which is also why nothing checks the body agrees with the claim.',
        ),
      },
      {
        id: 'trust',
        kind: 'check',
        prompt: L('`function isString(x: unknown): x is string { return true; }` What happens?', 'What if a checker always says yes, even for numbers?'),
        hint: L('Does TypeScript check that the body matches the promise?', 'Does TypeScript double-check your checker?'),
        explain: L(
          'It compiles. TypeScript trusts a type predicate, so a wrong one makes wrong code type-check, and it fails at runtime instead. Keep predicates simple and tested.',
          'TypeScript believes your checker, even when it is wrong! So a lying checker causes problems later.',
          'Type predicates are unchecked assertions. Prefer inferred predicates or small, tested guards; for untrusted data, validate structurally (schema libraries do this).',
        ),
        choices: [
          { id: 'compiles', text: L('It compiles, and TypeScript believes it'), correct: true },
          {
            id: 'error',
            text: L('TypeScript reports that the body does not check anything'),
            correct: false,
            feedback: L('Nothing compares the body with the promise. That is the risk.', 'TypeScript does not check the inside of your checker.'),
          },
        ],
      },
      {
        id: 'recap',
        kind: 'recap',
        prompt: L('The short version.', 'What you learned.'),
        points: LL(
          ['`value is Type` as a return type makes a function narrow.', 'It works in `if` and in `filter`.', 'TypeScript trusts the predicate, so keep it correct.'],
          ['Your own checker can teach TypeScript.', 'It works with `if` and with `filter`.', 'TypeScript believes your checker, so make it right.'],
          ['User-defined guards narrow both branches for unions.', '`filter` has a predicate overload.', 'Predicates are unchecked; prefer inferred ones (TS 5.5+).'],
        ),
      },
    ],
    recap: LL(
      ['Type predicates teach TypeScript your own checks.', 'They narrow in conditions and in `filter`.', 'They are trusted, not verified.'],
      ['Make your own "is it a …?" checkers.', 'They help sort lists.', 'Make sure they tell the truth.'],
      ['Guards: `(x: A) => x is B`.', 'Inferred predicates for simple bodies.', 'Test guards; they are assertions.'],
    ),
  },

  {
    id: 'm08-l04-assertion-functions',
    moduleId: 'm08',
    order: 4,
    title: {
      story: 'Stop if something is wrong',
      explorer: 'Assertion functions',
      pro: 'Assertion signatures: asserts value is T',
    },
    estMinutes: 6,
    difficulty: 2,
    concepts: ['assertion-function', 'type-predicate', 'narrowing', 'error'],
    objectives: LL(
      ['Write a function that throws when a check fails.', 'Give it an `asserts` return type so TypeScript narrows after the call.', 'Choose between a predicate and an assertion.'],
      ['Make a checker that stops everything if something is wrong.', 'After it, TypeScript knows the check passed.', 'Pick the right kind of checker.'],
    ),
    steps: [
      {
        id: 'read',
        kind: 'read',
        prompt: L('Check, or throw: then TypeScript knows.', 'A checker that stops the program when something is wrong.'),
        body: L(
          md(
            'A type predicate returns `true` or `false`. An **assertion function** returns nothing: it throws when the check fails. Its return type tells TypeScript what is true *after* the call:',
            '```ts\nfunction assertIsString(value: unknown): asserts value is string {\n  if (typeof value !== "string") {\n    throw new TypeError(`Expected a string, got ${typeof value}`);\n  }\n}\n\nconst input: unknown = "hello";\nassertIsString(input);\ninput.toUpperCase(); // fine: input is a string now\n```',
            'A shorter form, `asserts condition`, says "if this returns, the condition was true".',
          ),
          md(
            'Some checkers do not answer yes or no. They just stop everything if something is wrong, like a referee blowing a whistle.',
            'If the program gets past the checker, the check must have passed. TypeScript knows that, so after the line it treats the value as the right type.',
          ),
          md(
            '`asserts x is T` narrows `x` for the rest of the scope after the call; `asserts cond` narrows by the truthiness of the argument expression. The function must return `void` (or throw), and the call target must be declared with an explicit type (a function declaration, or a `const` with an annotated type), or TypeScript reports TS2775.',
            'Use predicates when both branches matter (`if (isX(v)) … else …`) and assertions for invariants that should stop execution (parsing, test helpers, internal preconditions). Node’s `assert` module and testing libraries use exactly these signatures.',
          ),
        ),
      },
      {
        id: 'predict',
        kind: 'predict',
        prompt: L('What prints?', 'What will it show?'),
        hint: L('`1 + 1 === 3` is false, so `assert` throws before `"fine"` is printed.', '1 + 1 is not 3, so the checker stops everything before "fine".'),
        code: c(
          'function assert(condition: unknown, message: string): asserts condition {',
          '  if (!condition) throw new Error(message);',
          '}',
          '',
          'const total = 1 + 1;',
          'try {',
          '  assert(total === 3, "Maths is broken");',
          '  console.log("fine");',
          '} catch (error) {',
          '  console.log(error instanceof Error ? error.message : "?");',
          '}',
        ),
        answer: 'Maths is broken',
        explain: L(
          'The assertion fails, so it throws and the next line never runs. `catch` prints the message.',
          'The checker blew the whistle, so "fine" never happened. The catch part prints the message instead.',
          'An assertion is just a function that may throw; the `asserts` signature only affects control-flow analysis after a successful return.',
        ),
      },
      {
        id: 'number',
        kind: 'types',
        prompt: L(
          'Write `assertIsNumber`: it throws a `TypeError` saying `Expected a number, got <type>` unless the value is a number, and TypeScript narrows after the call.',
          'Make `assertIsNumber`: if the value is not a number, throw a `TypeError` ("Expected a number, got …"). After it, TypeScript must know it is a number.',
        ),
        hint: L(
          'Return type: `asserts value is number`. Body: `if (typeof value !== "number") throw new TypeError(...)`.',
          'Say `asserts value is number` as the return type, and throw a `TypeError` when `typeof value` is not `"number"`.',
        ),
        starter: c('function assertIsNumber(value: unknown): void {', '  // throw unless value is a number', '}'),
        solution: c(
          'function assertIsNumber(value: unknown): asserts value is number {',
          '  if (typeof value !== "number") {',
          '    throw new TypeError(`Expected a number, got ${typeof value}`);',
          '  }',
          '}',
        ),
        typeTests: [
          { name: 'narrows after the call', code: 'declare const input: unknown;\nassertIsNumber(input);\ntype T1 = Expect<Equal<typeof input, number>>;' },
        ],
        tests: [
          { name: 'accepts a number', call: '(() => { assertIsNumber(5); return "ok"; })()', expect: 'ok' },
          {
            name: 'rejects text',
            call: '(() => { try { assertIsNumber("5"); return "no error"; } catch (error) { return error instanceof TypeError ? error.message : "wrong error"; } })()',
            expect: 'Expected a number, got string',
          },
        ],
        explain: L(
          'The `asserts` return type is the contract: if the function returns at all, `value` is a number. The throw is what makes it true.',
          'Getting past the checker means the value really is a number. The throw makes sure of that.',
          'The narrowing applies to the argument expression in the caller’s scope after the call. Throwing `TypeError` (rather than a bare `Error`) lets callers distinguish validation failures.',
        ),
      },
      {
        id: 'choose',
        kind: 'check',
        prompt: L('You need to handle both cases: draw a circle, or draw a square. Predicate or assertion?', 'You want to do one thing for circles and another for squares. Which checker?'),
        hint: L('An assertion throws in the "no" case. Do you want to stop, or to do something else?', 'Do you want the program to stop, or to do the other thing?'),
        explain: L(
          'A predicate: `if (isCircle(shape)) … else …` keeps both branches. An assertion is for "this must be true, or stop".',
          'The yes/no checker, so you can do one thing or the other. The whistle-blower would stop everything.',
          'Predicates branch; assertions enforce invariants. Using an assertion for ordinary branching turns expected cases into exceptions.',
        ),
        choices: [
          { id: 'predicate', text: L('A type predicate (`shape is Circle`)'), correct: true },
          {
            id: 'assertion',
            text: L('An assertion function (`asserts shape is Circle`)'),
            correct: false,
            feedback: L('An assertion throws for squares, but squares are a normal case here.', 'That would stop the program for every square!'),
          },
        ],
      },
      {
        id: 'recap',
        kind: 'recap',
        prompt: L('The short version.', 'What you learned.'),
        points: LL(
          ['An assertion function throws when a check fails.', '`asserts value is T` narrows after the call.', 'Predicates branch; assertions stop.'],
          ['Some checkers stop everything if something is wrong.', 'After them, TypeScript knows the check passed.', 'Use yes/no checkers when both answers are normal.'],
          ['`asserts x is T` and `asserts cond` narrow subsequent code.', 'Call targets need explicit types (TS2775).', 'Use assertions for invariants, not control flow.'],
        ),
      },
    ],
    recap: LL(
      ['Assertion functions turn runtime checks into type knowledge.', 'They return nothing and throw on failure.', 'Use them for things that must be true.'],
      ['Whistle-blower checkers stop bad values.', 'After them, TypeScript trusts the value.', 'Pick the right kind of checker.'],
      ['Assertions: validation at boundaries, preconditions, test helpers.', 'They compose with predicates.', 'Mind TS2775 for arrow functions.'],
    ),
  },
];

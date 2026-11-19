import { L, LL, c, md } from '../authoring';
import type { Lesson } from '../schema';

export const M11_LESSONS: readonly Lesson[] = [
  {
    id: 'm11-l01-constraints',
    moduleId: 'm11',
    order: 1,
    title: {
      story: 'Any kind, as long as it can…',
      explorer: 'Generic constraints',
      pro: 'Constraining type parameters with extends',
    },
    estMinutes: 7,
    difficulty: 2,
    concepts: ['constraint', 'generic', 'inference'],
    objectives: LL(
      ['Require something of a type parameter with `extends`.', 'Keep the caller’s exact type while using what the constraint promises.', 'See why a plain parameter type loses information.'],
      ['Say "any kind, as long as it has a length".', 'Give back exactly the kind that came in.', 'See why that matters.'],
    ),
    steps: [
      {
        id: 'read',
        kind: 'read',
        prompt: L('Generics with requirements.', 'Any kind of thing, as long as it can do something.'),
        body: L(
          md(
            'A bare `<T>` can be anything, so the body cannot use any of its properties. A **constraint** says what `T` must have:',
            '```ts\nfunction longest<T extends { length: number }>(a: T, b: T): T {\n  return a.length >= b.length ? a : b;\n}\n\nlongest("apple", "fig");   // string\nlongest([1, 2], [3]);      // number[]\nlongest(10, 20);           // error: numbers have no length\n```',
            'Why not just `a: { length: number }`? Then the result would be a `{ length: number }` too, and callers would lose the fact that it is a string or an array.',
          ),
          md(
            'Sometimes a machine works on any kind of thing, as long as it has a certain part. `longest` works on anything with a length: words, lists…',
            '`T extends { length: number }` means "any kind, as long as it has a length". And what comes out is the same kind that went in.',
          ),
          md(
            'A constraint bounds the type parameter: inside the body, `T` is assignable to the constraint, so its members are usable; at call sites, arguments must satisfy it, and `T` is inferred as the specific argument type. Without the generic, the return type degrades to the constraint itself.',
            'Constraints can reference other parameters (`K extends keyof T`) and can be recursive. Keep them minimal: require only what the body uses.',
          ),
        ),
      },
      {
        id: 'longest',
        kind: 'types',
        prompt: L(
          'Make `longest` generic with a constraint, so it returns the same type it was given.',
          'Make `longest` give back the same kind of thing it was given, for anything with a length.',
        ),
        hint: L('`function longest<T extends { length: number }>(a: T, b: T): T`.', 'Add `<T extends { length: number }>` after the name, and use `T` for both inputs and the output.'),
        starter: c(
          'function longest(a: { length: number }, b: { length: number }): { length: number } {',
          '  return a.length >= b.length ? a : b;',
          '}',
        ),
        solution: c(
          'function longest<T extends { length: number }>(a: T, b: T): T {',
          '  return a.length >= b.length ? a : b;',
          '}',
        ),
        typeTests: [
          { name: 'strings give a string', code: 'declare const first: string;\ndeclare const second: string;\nconst word = longest(first, second);\ntype T1 = Expect<Equal<typeof word, string>>;' },
          { name: 'arrays give an array', code: 'const list = longest([1, 2], [3]);\ntype T2 = Expect<Equal<typeof list, number[]>>;' },
          { name: 'numbers are refused', code: 'longest(10, 20);', expect: 'error' },
        ],
        tests: [
          { name: 'longer word', call: 'longest("apple", "fig")', expect: 'apple' },
          { name: 'longer list', call: 'longest([1], [2, 3])', expect: '[2,3]' },
        ],
        explain: L(
          'The body may use `.length` because of the constraint, and callers get their own type back.',
          'Inside, you can use `.length`. Outside, whatever went in comes back out.',
          '`T` is inferred per call and bounded by the constraint; the non-generic version’s return type was the constraint, erasing the caller’s type.',
        ),
      },
      {
        id: 'why',
        kind: 'check',
        prompt: L('With the old `a: { length: number }` version, what type did `longest("a", "bc")` return?', 'With the old version, what did TypeScript know about the answer?'),
        hint: L('Look at the old return type annotation.', 'What did the old machine say it gives back?'),
        explain: L(
          'Just `{ length: number }`: TypeScript no longer knew it was a string, so `.toUpperCase()` on the result would be an error.',
          'Only "something with a length". It forgot it was a word!',
          'Without a type parameter the return type is the declared structural type, so the relationship between input and output is lost.',
        ),
        choices: [
          { id: 'shape', text: L('`{ length: number }`, and it forgot it was a string'), correct: true },
          {
            id: 'string',
            text: L('`string`'),
            correct: false,
            feedback: L('Only a generic can carry the input type through to the output.', 'Only a generic machine remembers what went in.'),
          },
        ],
      },
      {
        id: 'recap',
        kind: 'recap',
        prompt: L('The short version.', 'What you learned.'),
        points: LL(
          ['`T extends Something` requires `T` to have what `Something` has.', 'The body can use those members; callers keep their exact type.', 'Require only what the body needs.'],
          ['"Any kind, as long as it has…" is a constraint.', 'What comes out is the same kind that went in.', 'Ask only for what you need.'],
          ['Constraints bound inference and enable member access.', 'They can reference other parameters.', 'Minimal constraints maximise reuse.'],
        ),
      },
    ],
    recap: LL(
      ['Constrain type parameters with `extends`.', 'Return `T` to preserve the caller’s type.', 'Keep constraints minimal.'],
      ['Generic machines can have requirements.', 'They still remember what went in.', 'Do not ask for too much.'],
      ['Bounded polymorphism in TypeScript.', 'Generic return types preserve information.', 'Minimal structural requirements.'],
    ),
  },

  {
    id: 'm11-l02-keyof-indexed',
    moduleId: 'm11',
    order: 2,
    title: {
      story: 'The list of labels, and what is behind each',
      explorer: 'keyof and indexed access types',
      pro: 'keyof, T[K] and key-safe accessors',
    },
    estMinutes: 8,
    difficulty: 3,
    concepts: ['keyof', 'indexed-access', 'generic', 'constraint'],
    objectives: LL(
      ['Get the keys of a type as a union with `keyof`.', 'Look up a property’s type with `T[K]`.', 'Write functions that only accept real keys.'],
      ['Get the list of labels of a shape.', 'Look up what kind of thing is behind a label.', 'Only allow real labels.'],
    ),
    steps: [
      {
        id: 'read',
        kind: 'read',
        prompt: L('Types can list keys and look up properties.', 'Ask a shape: what are your labels?'),
        body: L(
          md(
            '`keyof T` is the union of `T`’s property names; `T[K]` is the type of property `K`:',
            '```ts\ntype User = { id: number; name: string };\ntype UserKey = keyof User;     // "id" | "name"\ntype Name = User["name"];      // string\n\nfunction get<T, K extends keyof T>(object: T, key: K): T[K] {\n  return object[key];\n}\n\nget({ id: 1, name: "Ada" }, "name"); // string\nget({ id: 1, name: "Ada" }, "age");  // error: not a key\n```',
            '`K extends keyof T` ties the key to the object, and `T[K]` gives back the right type for that key.',
          ),
          md(
            '`keyof` asks a shape for its list of labels. For a user with an `id` and a `name`, it is `"id" | "name"`.',
            '`User["name"]` asks: what kind of thing is behind the `name` label? The answer is `string`.',
            'Together they make a machine that only accepts real labels, and knows what comes back.',
          ),
          md(
            '`keyof` produces `string | number | symbol` literal unions (index signatures contribute `string | number`). Indexed access `T[K]` distributes over unions of keys (`User["id" | "name"]` is `number | string`) and works with `number` on arrays (`T[number]`).',
            'The pattern `<T, K extends keyof T>(obj: T, key: K): T[K]` correlates the key and the result per call. It is the basis of `Pick`, property-path helpers, typed event maps and form libraries.',
          ),
        ),
      },
      {
        id: 'keys',
        kind: 'predictType',
        prompt: L('What is `Keys`?', 'What are the labels of `User`?'),
        hint: L('`keyof` gives a union of the property names, as string literal types.', 'List the labels, joined with `|`, each in quotes.'),
        code: c('type User = { id: number; name: string; admin: boolean };', 'type Keys = keyof User;'),
        target: 'Keys',
        answer: '"id" | "name" | "admin"',
        explain: L(
          '`keyof User` is the union of its three property names. Add a property to `User` and `Keys` grows with it.',
          'The three labels, joined with `|`. If the shape gets a new label, the list grows by itself.',
          'A union of string literal types; order is irrelevant for identity, which is why any order is accepted.',
        ),
      },
      {
        id: 'pluck',
        kind: 'types',
        prompt: L(
          'Make `pluck` type-safe: the key must be a real key of the items, and the result is an array of that property’s type.',
          'Make `pluck` safe: only real labels allowed, and TypeScript knows what kind of list comes back.',
        ),
        hint: L('`function pluck<T, K extends keyof T>(items: T[], key: K): T[K][]`.', 'Use `<T, K extends keyof T>`, take `items: T[]` and `key: K`, and give back `T[K][]`.'),
        strongHint: L('The body can stay the same: `return items.map((item) => item[key]);`.', 'Only the first line changes; the inside stays the same.'),
        starter: c(
          'function pluck(items: any[], key: string): unknown[] {',
          '  return items.map((item) => item[key]);',
          '}',
        ),
        solution: c(
          'function pluck<T, K extends keyof T>(items: T[], key: K): T[K][] {',
          '  return items.map((item) => item[key]);',
          '}',
        ),
        typeTests: [
          { name: 'names are strings', code: 'const names = pluck([{ name: "Ada", age: 36 }], "name");\ntype T1 = Expect<Equal<typeof names, string[]>>;' },
          { name: 'ages are numbers', code: 'const ages = pluck([{ name: "Ada", age: 36 }], "age");\ntype T2 = Expect<Equal<typeof ages, number[]>>;' },
          { name: 'unknown keys are refused', code: 'pluck([{ name: "Ada" }], "nmae");', expect: 'error' },
        ],
        tests: [{ name: 'plucks names', call: 'pluck([{ name: "Ada" }, { name: "Bo" }], "name")', expect: '["Ada","Bo"]' }],
        explain: L(
          'The typo `"nmae"` is now a compile error, and the result type follows the key you pass.',
          'Now spelling mistakes are caught, and TypeScript knows names are words and ages are numbers.',
          '`K extends keyof T` rejects invalid keys; `T[K][]` maps the chosen key to its element type. The `any` version compiled every typo.',
        ),
      },
      {
        id: 'recap',
        kind: 'recap',
        prompt: L('The short version.', 'What you learned.'),
        points: LL(
          ['`keyof T` is the union of `T`’s keys.', '`T[K]` is the type of property `K`.', '`K extends keyof T` makes key parameters safe.'],
          ['`keyof` lists a shape’s labels.', '`T["label"]` looks up what is behind a label.', 'Safe machines only take real labels.'],
          ['Indexed access distributes over key unions.', '`T[number]` for array elements.', 'Correlate key and value types per call.'],
        ),
      },
    ],
    recap: LL(
      ['Let types talk about other types’ keys.', 'Replace `any` accessors with `K extends keyof T`.', 'Typos become errors.'],
      ['Shapes know their own labels.', 'Only real labels are allowed.', 'Spelling mistakes get caught.'],
      ['`keyof` + indexed access = key-safe APIs.', 'The foundation of mapped and utility types.', 'No more stringly-typed property access.'],
    ),
  },

  {
    id: 'm11-l03-generic-classes',
    moduleId: 'm11',
    order: 3,
    title: {
      story: 'A box that remembers what it holds',
      explorer: 'Generic interfaces and classes',
      pro: 'Generic interfaces, classes and containers',
    },
    estMinutes: 8,
    difficulty: 2,
    concepts: ['generic', 'class', 'interface'],
    objectives: LL(
      ['Write a generic interface like `Box<T>`.', 'Write a generic class, a `Stack<T>`.', 'Know what a container’s methods return.'],
      ['Make a box that remembers what kind of thing it holds.', 'Build a stack of plates in code.', 'Know what you get back.'],
    ),
    steps: [
      {
        id: 'read',
        kind: 'read',
        prompt: L('Interfaces and classes can take type parameters too.', 'A container that remembers what kind of thing it holds.'),
        body: L(
          md(
            'Type parameters work on interfaces and classes, which is how containers stay precise:',
            '```ts\ninterface Box<T> {\n  value: T;\n}\n\nclass Stack<T> {\n  #items: T[] = [];\n  push(item: T): void {\n    this.#items.push(item);\n  }\n  pop(): T | undefined {\n    return this.#items.pop();\n  }\n  get size(): number {\n    return this.#items.length;\n  }\n}\n\nconst plates = new Stack<string>();\nplates.push("blue");\nplates.push(3); // error: not a string\n```',
          ),
          md(
            'A stack is like a pile of plates: you put plates on top and take them off the top.',
            '`Stack<string>` is a pile that only holds words. Try to put a number on it and TypeScript says no.',
          ),
          md(
            'Class type parameters are in scope for instance members (not static ones). They are usually inferred from constructor arguments (`new Box(3)` is `Box<number>`) or given explicitly when nothing is passed (`new Stack<string>()`).',
            'Expose the minimum: `pop(): T | undefined` is honest about emptiness; a `readonly` view (`ReadonlyArray<T>`) keeps internals safe. Standard containers (`Map<K, V>`, `Set<T>`, `Promise<T>`) are exactly such generic interfaces.',
          ),
        ),
      },
      {
        id: 'stack',
        kind: 'types',
        prompt: L(
          'Make `Stack` generic: `push` takes a `T`, `pop` returns `T | undefined`, and `size` is the number of items.',
          'Make `Stack` remember what kind of thing it holds: `push` takes that kind, `pop` gives it back (or `undefined`).',
        ),
        hint: L('`class Stack<T>`, store `#items: T[]`, and use `T` in `push` and `pop`.', 'Add `<T>` after `Stack`, keep a list `#items: T[] = []`, and use `T` in `push` and `pop`.'),
        starter: c(
          'class Stack {',
          '  #items: unknown[] = [];',
          '  push(item: unknown): void {',
          '    this.#items.push(item);',
          '  }',
          '  pop(): unknown {',
          '    return this.#items.pop();',
          '  }',
          '  get size(): number {',
          '    return this.#items.length;',
          '  }',
          '}',
        ),
        solution: c(
          'class Stack<T> {',
          '  #items: T[] = [];',
          '  push(item: T): void {',
          '    this.#items.push(item);',
          '  }',
          '  pop(): T | undefined {',
          '    return this.#items.pop();',
          '  }',
          '  get size(): number {',
          '    return this.#items.length;',
          '  }',
          '}',
        ),
        typeTests: [
          { name: 'pop gives the item type', code: 'const numbers = new Stack<number>();\nconst top = numbers.pop();\ntype T1 = Expect<Equal<typeof top, number | undefined>>;' },
          { name: 'push checks the item', code: 'new Stack<number>().push("three");', expect: 'error' },
        ],
        tests: [
          { name: 'last in, first out', call: '(() => { const s = new Stack(); s.push("a"); s.push("b"); return s.pop(); })()', expect: 'b' },
          { name: 'size', call: '(() => { const s = new Stack(); s.push(1); s.push(2); return s.size; })()', expect: '2' },
          { name: 'empty pop', call: 'new Stack().pop()', expect: 'undefined' },
        ],
        explain: L(
          '`Stack<number>` only accepts numbers and gives numbers back, so callers never need a cast.',
          'A number pile only takes numbers, and you always know you get numbers back.',
          'The class type parameter threads through the private storage and both methods; `T | undefined` from `pop` mirrors `Array.prototype.pop`.',
        ),
      },
      {
        id: 'infer',
        kind: 'predictType',
        prompt: L('What type does `box` get?', 'What type is `box`?'),
        hint: L('The type parameter is inferred from what is passed to the constructor.', 'What goes into the box tells TypeScript what kind of box it is.'),
        code: c('class Box<T> {', '  constructor(public value: T) {}', '}', 'const box = new Box(["a", "b"]);'),
        target: 'box',
        answer: 'Box<string[]>',
        explain: L(
          'TypeScript infers `T` as `string[]` from the constructor argument, so `box` is a `Box<string[]>`.',
          'A list of words went in, so it is a box of lists of words.',
          'Constructor arguments drive class type-parameter inference, just like function calls.',
        ),
      },
      {
        id: 'recap',
        kind: 'recap',
        prompt: L('The short version.', 'What you learned.'),
        points: LL(
          ['Interfaces and classes can have type parameters.', 'A generic container returns exactly what you put in.', 'Type arguments are inferred from constructor arguments, or written out.'],
          ['Boxes and piles can remember what kind of thing they hold.', 'You always know what you get back.', 'TypeScript often works the kind out for you.'],
          ['Class generics scope over instance members.', 'Honest return types (`T | undefined`).', 'The standard library is built this way.'],
        ),
      },
    ],
    recap: LL(
      ['Generic containers keep their contents’ type.', 'Infer type arguments when you can.', 'Be honest about emptiness.'],
      ['A box knows what is inside.', 'A pile knows what kind of plates.', 'Empty piles give `undefined`.'],
      ['Parametric containers.', 'Constructor-driven inference.', '`Map`, `Set` and `Promise` are generic interfaces.'],
    ),
  },

  {
    id: 'm11-l04-defaults-multiple',
    moduleId: 'm11',
    order: 4,
    title: {
      story: 'Two kinds at once',
      explorer: 'Several type parameters, and defaults',
      pro: 'Multiple type parameters and defaults',
    },
    estMinutes: 7,
    difficulty: 2,
    concepts: ['generic', 'tuple', 'type-parameter-default'],
    objectives: LL(
      ['Use two type parameters when two types vary independently.', 'Give a type parameter a default.', 'Write `zip`, pairing two lists.'],
      ['Handle two different kinds at once.', 'Give a kind a default, like a spare.', 'Pair up two lists.'],
    ),
    steps: [
      {
        id: 'read',
        kind: 'read',
        prompt: L('Two things can vary independently.', 'Sometimes two different kinds go together.'),
        body: L(
          md(
            'Use one type parameter per type that can vary. A pair of two different things needs two:',
            '```ts\nfunction pair<A, B>(first: A, second: B): [A, B] {\n  return [first, second];\n}\npair("Ada", 36); // [string, number]\n```',
            'A type parameter can have a **default**, used when it is not given and cannot be inferred:',
            '```ts\ntype Pair<A, B = A> = [A, B];\ntype Point = Pair<number>;        // [number, number]\ntype Entry = Pair<string, number>; // [string, number]\n```',
          ),
          md(
            'Some machines handle two kinds of thing at once: a name and an age, a word and a number. They need two placeholders, like `<A, B>`.',
            'A placeholder can have a spare (a default): `B = A` means "if you do not say, use the same kind as A".',
          ),
          md(
            'Each type parameter should appear at least twice in a signature (inputs and outputs) to earn its place. Defaults (`<T = string>`) apply when a type argument is omitted and inference has no candidates; they may reference earlier parameters. Required parameters cannot follow defaulted ones.',
            'Partial type-argument inference does not exist: supplying one argument means supplying all non-defaulted ones, which is why libraries sometimes curry (`create<State>()(…)`).',
          ),
        ),
      },
      {
        id: 'default',
        kind: 'predictType',
        prompt: L('What is `Point`?', 'What type is `Point`?'),
        hint: L('`B` was not given, so it takes its default: `A`.', 'The second kind was not given, so it uses the spare: the same as the first.'),
        code: c('type Pair<A, B = A> = [A, B];', 'type Point = Pair<number>;'),
        target: 'Point',
        answer: '[number, number]',
        explain: L(
          '`B` defaults to `A`, so `Pair<number>` is `[number, number]`.',
          'The spare kind is "the same as the first", so both are numbers.',
          'Defaults are resolved at instantiation; `B = A` refers to the earlier parameter.',
        ),
      },
      {
        id: 'zip',
        kind: 'types',
        prompt: L(
          'Write `zip`: pair up items from two lists, as `[A, B][]`, stopping at the shorter list.',
          'Make `zip` pair up two lists, like a zip on a coat: `[1, 2]` and `["a", "b"]` give `[[1, "a"], [2, "b"]]`.',
        ),
        hint: L('`function zip<A, B>(left: A[], right: B[]): [A, B][]`; loop to the shorter length and push `[left[i], right[i]]`.', 'Use `<A, B>`. Go through the shorter list and make a pair from each position.'),
        starter: c('function zip(left: unknown[], right: unknown[]): unknown[] {', '  return [];', '}'),
        solution: c(
          'function zip<A, B>(left: A[], right: B[]): [A, B][] {',
          '  const pairs: [A, B][] = [];',
          '  const length = Math.min(left.length, right.length);',
          '  for (let i = 0; i < length; i++) {',
          '    pairs.push([left[i] as A, right[i] as B]);',
          '  }',
          '  return pairs;',
          '}',
        ),
        typeTests: [{ name: 'pairs of both types', code: 'const zipped = zip([1, 2], ["a", "b"]);\ntype T1 = Expect<Equal<typeof zipped, [number, string][]>>;' }],
        tests: [
          { name: 'pairs up', call: 'zip([1, 2], ["a", "b"])', expect: '[[1,"a"],[2,"b"]]' },
          { name: 'stops at the shorter list', call: 'zip([1, 2, 3], ["a"])', expect: '[[1,"a"]]' },
          { name: 'empty', call: 'zip([], [])', expect: '[]' },
        ],
        explain: L(
          'Two type parameters keep both element types, so the result is a precise list of pairs.',
          'TypeScript remembers both kinds, so it knows each pair is a number and a word.',
          'Independent parameters `A` and `B` each appear in an input and the output. The `as A` is needed only because indexing is typed `A` already (or `A | undefined` with `noUncheckedIndexedAccess`).',
        ),
      },
      {
        id: 'recap',
        kind: 'recap',
        prompt: L('The short version.', 'What you learned.'),
        points: LL(
          ['Use one type parameter per independent type.', '`<B = A>` gives a default.', 'Defaults apply when nothing is given or inferred.'],
          ['Two kinds need two placeholders.', 'A placeholder can have a spare.', 'Zips pair up lists.'],
          ['Each parameter should relate inputs to outputs.', 'Defaults may reference earlier parameters.', 'No partial inference: curry if needed.'],
        ),
      },
    ],
    recap: LL(
      ['Several type parameters for several varying types.', 'Defaults for the common case.', 'Every parameter should earn its place.'],
      ['Placeholders for each kind.', 'Spares for when nobody says.', 'Keep it simple.'],
      ['Multi-parameter generics.', 'Defaults and their resolution.', 'Avoid unused or single-use parameters.'],
    ),
  },

  {
    id: 'm11-l05-inference',
    moduleId: 'm11',
    order: 5,
    title: {
      story: 'How TypeScript guesses the kind',
      explorer: 'How generic inference works',
      pro: 'Type-argument inference and const type parameters',
    },
    estMinutes: 7,
    difficulty: 3,
    concepts: ['inference', 'generic', 'literal-type', 'as-const'],
    objectives: LL(
      ['Predict what TypeScript infers for a type parameter.', 'Write type arguments yourself when nothing can be inferred.', 'Keep exact values with a `const` type parameter.'],
      ['Guess what TypeScript guesses.', 'Tell it the kind when it cannot guess.', 'Make it remember exact words.'],
    ),
    steps: [
      {
        id: 'read',
        kind: 'read',
        prompt: L('TypeScript infers type arguments from what you pass.', 'TypeScript guesses the kind from what you give it.'),
        body: L(
          md(
            'You rarely write type arguments: TypeScript infers them from the arguments.',
            '```ts\nfunction identity<T>(value: T): T {\n  return value;\n}\nconst a = identity(42);      // 42 (a const keeps the literal)\nlet b = identity(42);        // number\nconst c = identity<string>("hi"); // written out\nconst scores = new Map<string, number>(); // nothing to infer from: write it\n```',
            'A **`const` type parameter** keeps literal values exactly, like `as const` at the call site:',
            '```ts\nfunction keep<const T>(value: T): T {\n  return value;\n}\nconst pair = keep(["a", "b"]); // readonly ["a", "b"]\n```',
          ),
          md(
            'You do not usually say the kind: TypeScript guesses it from what you give the machine.',
            'If there is nothing to guess from (like an empty Map), you tell it: `new Map<string, number>()`.',
            'A `const` placeholder makes TypeScript remember the exact words you gave it.',
          ),
          md(
            'Inference collects candidates for each type parameter from arguments (and from the contextual return type), then picks a best common type; literal candidates widen unless the declaration context preserves them (a `const` binding, a constraint involving primitives, or a `const` type parameter).',
            'Write type arguments explicitly only when inference has no candidates (empty collections, `useState<T[]>([])`) or picks a wider type than you want. TS 5.0 `const T` applies const-assertion inference to array and object literal arguments; TS 5.4 `NoInfer<T>` blocks a position from contributing candidates.',
          ),
        ),
      },
      {
        id: 'literal',
        kind: 'predictType',
        prompt: L('What type does `n` get?', 'What type is `n`?'),
        hint: L('`n` is a `const`, and `T` is inferred from the argument `42`.', '`n` can never change, and the machine gives back exactly what it got.'),
        code: c('function identity<T>(value: T): T {', '  return value;', '}', 'const n = identity(42);'),
        target: 'n',
        answer: '42',
        explain: L(
          'For a `const`, TypeScript keeps the literal: `T` is `42`. With `let n = identity(42)`, it would widen to `number`.',
          'Because `n` is a `const`, TypeScript remembers the exact number, 42.',
          'The literal candidate `42` is kept because the result lands in a `const` declaration; a mutable `let` would widen it.',
        ),
      },
      {
        id: 'const-t',
        kind: 'types',
        prompt: L(
          'Change `keep` so `keep(["a", "b"])` is typed `readonly ["a", "b"]`, not `string[]`.',
          'Make `keep` remember the exact words it was given.',
        ),
        hint: L('Add `const` before the type parameter: `function keep<const T>(value: T): T`.', 'Write `<const T>` instead of `<T>`.'),
        starter: c('function keep<T>(value: T): T {', '  return value;', '}'),
        solution: c('function keep<const T>(value: T): T {', '  return value;', '}'),
        typeTests: [
          { name: 'keeps the exact list', code: 'const kept = keep(["a", "b"]);\ntype T1 = Expect<Equal<typeof kept, readonly ["a", "b"]>>;' },
          { name: 'keeps exact object values', code: 'const config = keep({ mode: "dark" });\ntype T2 = Expect<Equal<typeof config, { readonly mode: "dark" }>>;' },
        ],
        explain: L(
          'The caller no longer needs to write `as const`: the function asks for exact inference itself.',
          'Now the machine always remembers the exact words.',
          '`const` type parameters apply const-context inference to literal arguments (readonly tuples, literal properties). Useful for route tables, option lists and builders.',
        ),
      },
      {
        id: 'explicit',
        kind: 'check',
        prompt: L('When should you write the type argument yourself?', 'When do you need to tell TypeScript the kind?'),
        hint: L('When is there nothing for TypeScript to infer from?', 'When is there nothing to guess from?'),
        explain: L(
          'An empty collection gives nothing to infer from, so `new Map()` would be `Map<any, any>`. Write `new Map<string, number>()`.',
          'An empty Map has nothing inside to guess from, so you say the kinds.',
          'With no inference candidates, type parameters fall back to their constraint (often `unknown`, or `any` for some library types). Supply them explicitly.',
        ),
        choices: [
          { id: 'empty', text: L('`const scores = new Map<string, number>();`, an empty collection'), correct: true },
          {
            id: 'always',
            text: L('Always, to be safe: `identity<number>(42)`'),
            correct: false,
            feedback: L('That repeats what inference already knows, and it widens `42` to `number`.', 'TypeScript already knows. Writing it is just extra.'),
          },
        ],
      },
      {
        id: 'recap',
        kind: 'recap',
        prompt: L('The short version.', 'What you learned.'),
        points: LL(
          ['Type arguments are inferred from the arguments you pass.', 'Write them when there is nothing to infer from.', '`<const T>` keeps exact literal values.'],
          ['TypeScript guesses the kind from what you give it.', 'Tell it when there is nothing to guess from.', '`const` makes it remember exact values.'],
          ['Inference collects and widens candidates per context.', 'Explicit arguments for empty inputs.', '`const T` and `NoInfer` tune inference.'],
        ),
      },
    ],
    recap: LL(
      ['Let inference work; help it only when it cannot.', 'Literal types survive in `const` contexts.', '`const` type parameters for exact arguments.'],
      ['TypeScript is good at guessing.', 'Help it when it cannot guess.', 'Exact words need `const`.'],
      ['Understand widening to predict inference.', 'Annotate empty collections.', 'Design APIs that infer well.'],
    ),
  },
];

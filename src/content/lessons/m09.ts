import { L, LL, c, md } from '../authoring';
import type { Lesson } from '../schema';

export const M09_LESSONS: readonly Lesson[] = [
  {
    id: 'm09-l01-tuples-readonly',
    moduleId: 'm09',
    order: 1,
    title: {
      story: 'Short fixed lists, and lists you cannot change',
      explorer: 'Tuples and readonly arrays',
      pro: 'Tuples, labelled elements and readonly arrays',
    },
    estMinutes: 7,
    difficulty: 2,
    concepts: ['tuple', 'readonly', 'array', 'destructuring'],
    objectives: LL(
      ['Type a fixed-length array with a type per position: a tuple.', 'Label tuple positions for readers.', 'Promise not to change an array with `readonly`.'],
      ['Make short lists where each spot has its own type.', 'Give each spot a name.', 'Lock a list so nobody changes it.'],
    ),
    steps: [
      {
        id: 'read',
        kind: 'read',
        prompt: L('Some arrays have a fixed shape.', 'Some lists always have the same spots.'),
        body: L(
          md(
            'A **tuple** is an array with a fixed length and a type for each position:',
            '```ts\ntype Entry = [word: string, count: number];\nconst entry: Entry = ["apple", 3];\nconst [word, count] = entry; // string, number\n```',
            'The labels (`word`, `count`) are only for readers and editors; they do not change the type.',
            'A `readonly` array cannot be changed through that name: no `push`, no `sort`, no assigning `list[0]`. Use it for parameters you promise not to touch:',
            '```ts\nfunction total(prices: readonly number[]): number {\n  return prices.reduce((sum, price) => sum + price, 0);\n}\n```',
          ),
          md(
            'A tuple is a short list where each spot has its own job. `["apple", 3]` could mean "the word apple, counted 3 times".',
            'A `readonly` list is locked: you can look, but you cannot add, remove or swap things.',
          ),
          md(
            'Tuple types fix arity and per-index types; labels improve tooling only, and optional (`[a: string, b?: number]`) and rest (`[string, ...number[]]`) elements exist. Array literals infer arrays, not tuples, unless contextually typed, annotated, or written `as const`.',
            '`readonly T[]` (alias `ReadonlyArray<T>`) removes mutating methods and index assignment; `T[]` is assignable to `readonly T[]` but not the reverse. It is compile-time only: nothing is frozen at runtime (that is `Object.freeze`).',
            'Return a tuple when the positions are obvious from context (`useState`), otherwise prefer an object with named properties.',
          ),
        ),
      },
      {
        id: 'position',
        kind: 'predictType',
        prompt: L('What type does `count` get?', 'What type is `count`?'),
        hint: L('The function returns `[string, number]`, and `count` is position 1.', 'Spot 0 is a word and spot 1 is a number. Which spot is `count`?'),
        code: c(
          'function entry(word: string, times: number): [string, number] {',
          '  return [word, times];',
          '}',
          'const pair = entry("apple", 3);',
          'const count = pair[1];',
          'console.log(count);',
        ),
        target: 'count',
        answer: 'number',
        explain: L(
          'Each position of a tuple has its own type, so index 1 is a `number` (index 0 would be a `string`).',
          'Spot 1 holds the number, so `count` is a number.',
          'Indexing a tuple with a literal index yields that element’s type; an out-of-range literal index is an error (TS2493).',
        ),
      },
      {
        id: 'minmax',
        kind: 'write',
        prompt: L('Write `minMax`: the smallest and largest value, as a `[min, max]` tuple.', 'Make `minMax` give back the smallest and the biggest number, as a pair.'),
        starter: c('function minMax(values: number[]): [min: number, max: number] {', '  return [0, 0];', '}'),
        solution: c('function minMax(values: number[]): [min: number, max: number] {', '  return [Math.min(...values), Math.max(...values)];', '}'),
        tests: [
          { name: 'mixed', call: 'minMax([3, 1, 2])', expect: '[1,3]' },
          { name: 'one value', call: 'minMax([7])', expect: '[7,7]' },
          { name: 'negatives', call: 'minMax([-5, 10, 0])', expect: '[-5,10]' },
        ],
        hint: L('`Math.min(...values)` and `Math.max(...values)`, returned in a two-element array.', 'Spread the numbers into `Math.min` and `Math.max`, and give both back in `[ ]`.'),
        explain: L(
          'The labelled tuple return type tells callers which is which: `const [low, high] = minMax(scores);`.',
          'The pair has names, so anyone using it knows which number is the smallest.',
          'The labelled tuple documents the positions and destructures naturally. For an empty input this returns `[Infinity, -Infinity]`; decide whether that is acceptable or return `undefined`.',
        ),
      },
      {
        id: 'add',
        kind: 'fix',
        prompt: L('`addItem` must not change the list it was given. Fix it without changing its types.', '`addItem` is not allowed to change the locked list. Fix it!'),
        hint: L('`push` does not exist on a `readonly` array. Return a new array with spread instead.', 'You cannot `push` into a locked list. Make a new list with `[...list, item]`.'),
        starter: c(
          'function addItem(list: readonly string[], item: string): readonly string[] {',
          '  list.push(item);',
          '  return list;',
          '}',
        ),
        solution: c('function addItem(list: readonly string[], item: string): readonly string[] {', '  return [...list, item];', '}'),
        tests: [
          { name: 'adds the item', call: 'addItem(["tea"], "cake")', expect: '["tea","cake"]' },
          { name: 'the original is unchanged', call: '(() => { const list = ["tea"]; addItem(list, "cake"); return list; })()', expect: '["tea"]' },
        ],
        explain: L(
          '`readonly` turned a hidden side effect into a type error. Spread builds the new list and leaves the caller’s alone.',
          'The lock caught the mistake, and the copy keeps the first list safe.',
          '`ReadonlyArray` lacks `push`, so the mutation is a compile error (TS2339). Returning a copy makes the function pure.',
        ),
      },
      {
        id: 'recap',
        kind: 'recap',
        prompt: L('The short version.', 'What you learned.'),
        points: LL(
          ['A tuple fixes the length and the type of each position.', 'Labels make tuples readable.', '`readonly` arrays cannot be changed through that name.'],
          ['Tuples are short lists with a job for each spot.', 'Spots can have names.', 'Locked lists cannot be changed.'],
          ['Tuples: per-index types, optional and rest elements.', 'Prefer objects when positions are not obvious.', '`readonly` is compile-time; `Object.freeze` is runtime.'],
        ),
      },
    ],
    recap: LL(
      ['Use tuples for small, obvious pairs.', 'Mark array parameters `readonly` when you do not change them.', 'Return copies instead of changing inputs.'],
      ['Pairs are great for two things that go together.', 'Lock lists you only look at.', 'Make copies instead of changing things.'],
      ['Tuples for positional results, objects otherwise.', '`readonly` parameters document and enforce non-mutation.', 'Mutable arrays widen to readonly, not back.'],
    ),
  },

  {
    id: 'm09-l02-as-const',
    moduleId: 'm09',
    order: 2,
    title: {
      story: 'Freezing the exact words',
      explorer: 'as const and literal types',
      pro: 'Const assertions and deriving unions from values',
    },
    estMinutes: 7,
    difficulty: 2,
    concepts: ['as-const', 'literal-type', 'union', 'readonly'],
    objectives: LL(
      ['Keep exact values in types with `as const`.', 'Derive a union type from a list of values.', 'Know `as const` changes types, not runtime behaviour.'],
      ['Tell TypeScript to remember the exact words.', 'Make a type from a list.', 'Know that nothing is really frozen.'],
    ),
    steps: [
      {
        id: 'read',
        kind: 'read',
        prompt: L('`as const` keeps the exact values.', '`as const` tells TypeScript to remember the exact words.'),
        body: L(
          md(
            'Normally TypeScript widens values in arrays and objects, because they could change: `["small", "large"]` is a `string[]`. Add `as const` and it keeps the exact values, read-only:',
            '```ts\nconst SIZES = ["small", "medium", "large"] as const;\n// readonly ["small", "medium", "large"]\n\ntype Size = (typeof SIZES)[number];\n// "small" | "medium" | "large"\n```',
            'Now the list of values and the type can never disagree: add a size to the array and the type follows.',
          ),
          md(
            'Usually TypeScript thinks "this list has some words in it". With `as const` it thinks "this list has exactly these words, and they never change".',
            'Then you can make a type from the list: only those words are allowed.',
          ),
          md(
            'A const assertion infers the narrowest type: literal types, `readonly` tuples instead of arrays, `readonly` properties, recursively. `(typeof X)[number]` indexes the tuple type to get the union of its elements; `(typeof OBJ)[keyof typeof OBJ]` does the same for object values.',
            'It is purely a type-level operation: the runtime object is not frozen. Combine with `satisfies` (`{…} as const satisfies Config`) to validate shape while keeping literals. TS 5.0’s `const` type parameters apply the same inference to generic arguments.',
          ),
        ),
      },
      {
        id: 'exact',
        kind: 'predictType',
        prompt: L('What type does TypeScript give `DIRECTIONS`?', 'What is the type of `DIRECTIONS`?'),
        hint: L('`as const` keeps each exact string, keeps the order, and makes it read-only.', 'It remembers both words, in order, and locks the list.'),
        code: c('const DIRECTIONS = ["up", "down"] as const;', 'console.log(DIRECTIONS.length);'),
        target: 'DIRECTIONS',
        answer: 'readonly ["up", "down"]',
        explain: L(
          'Without `as const` it would be `string[]`. With it, a read-only tuple of the two exact strings.',
          'Without `as const`, TypeScript would only know "some words". Now it knows exactly which two.',
          'Const assertions produce readonly tuple types with literal element types, and `length` becomes the literal `2`.',
        ),
      },
      {
        id: 'sizes',
        kind: 'types',
        prompt: L(
          'Make `Size` exactly `"small" | "medium" | "large"`, derived from the `SIZES` list so they can never disagree.',
          'Make the `Size` type come from the `SIZES` list, so only those three words are allowed.',
        ),
        hint: L('Add `as const` to the array, then `type Size = (typeof SIZES)[number];`.', 'Put `as const` after the list. Then `type Size = (typeof SIZES)[number];`.'),
        starter: c('const SIZES = ["small", "medium", "large"];', '', 'type Size = string;'),
        solution: c('const SIZES = ["small", "medium", "large"] as const;', '', 'type Size = (typeof SIZES)[number];'),
        typeTests: [
          { name: 'exactly the three sizes', code: 'type T1 = Expect<Equal<Size, "small" | "medium" | "large">>;' },
          { name: 'refuses other sizes', code: 'const huge: Size = "huge";', expect: 'error' },
          { name: 'the list cannot change', code: 'SIZES.push("huge");', expect: 'error' },
        ],
        explain: L(
          '`typeof SIZES` is the tuple type, and indexing it with `number` gives the union of everything in it.',
          'The type is made from the list, so if you add a size to the list, the type learns it too.',
          'Single source of truth: the runtime array drives the type. The same pattern powers option lists, routes and event names.',
        ),
      },
      {
        id: 'frozen',
        kind: 'predict',
        prompt: L('Is an `as const` object frozen when the code runs? What prints?', 'Is the `as const` object really frozen? What will it show?'),
        hint: L('`as const` only changes what TypeScript knows. Types disappear before the code runs.', 'Types vanish when the code runs. Does `as const` do anything then?'),
        code: c('const config = { retries: 3 } as const;', 'console.log(Object.isFrozen(config));', 'console.log(Object.isFrozen(Object.freeze({ retries: 3 })));'),
        answer: c('false', 'true'),
        explain: L(
          '`as const` is erased: at runtime it is an ordinary object. `Object.freeze` is what freezes objects while the program runs.',
          'Nothing is frozen when the code runs. `as const` only tells TypeScript. `Object.freeze` is the real lock.',
          'Type assertions have no emit. For runtime immutability use `Object.freeze` (shallow), whose return type is `Readonly<T>`.',
        ),
      },
      {
        id: 'recap',
        kind: 'recap',
        prompt: L('The short version.', 'What you learned.'),
        points: LL(
          ['`as const` keeps exact values and makes them read-only.', '`(typeof LIST)[number]` turns a list into a union type.', 'It changes types only; nothing is frozen at runtime.'],
          ['`as const` remembers the exact words.', 'A type can be made from a list.', 'It is only for TypeScript, not a real lock.'],
          ['Const assertions infer the narrowest readonly types.', 'Derive types from values for a single source of truth.', 'Pair with `satisfies` for validated literals.'],
        ),
      },
    ],
    recap: LL(
      ['Write values once, derive types from them.', '`as const` for exact, read-only data.', '`Object.freeze` when it must be frozen at runtime too.'],
      ['Write the list once, and let the type follow.', '`as const` means "exactly these".', 'Real locks need `Object.freeze`.'],
      ['`as const` + indexed access = value-driven unions.', 'Compile-time only.', 'Works recursively on nested literals.'],
    ),
  },

  {
    id: 'm09-l03-index-signatures-record',
    moduleId: 'm09',
    order: 3,
    title: {
      story: 'Dictionaries with any words',
      explorer: 'Index signatures and Record',
      pro: 'Index signatures, Record<K, V> and unchecked index access',
    },
    estMinutes: 7,
    difficulty: 2,
    concepts: ['index-signature', 'record-type', 'object', 'optional'],
    objectives: LL(
      ['Type an object with keys you do not know in advance.', 'Use `Record<Keys, Value>` for a fixed set of keys.', 'Handle keys that might be missing.'],
      ['Make dictionaries with any words as keys.', 'Make a dictionary that must have every key.', 'Be careful: a word might not be in the dictionary.'],
    ),
    steps: [
      {
        id: 'read',
        kind: 'read',
        prompt: L('When you do not know the keys in advance.', 'A dictionary where you do not know the words yet.'),
        body: L(
          md(
            'An **index signature** types an object whose keys are not known in advance:',
            '```ts\nconst stock: { [item: string]: number } = { pens: 12, ink: 0 };\nstock.paper = 500; // any string key is allowed\n```',
            '`Record<K, V>` says the same thing more briefly, and with a union of keys it requires *every* key:',
            '```ts\ntype Fruit = "apple" | "pear";\nconst prices: Record<Fruit, number> = { apple: 1, pear: 2 }; // both required\nconst counts: Record<string, number> = {};                 // any keys\n```',
            'Careful: reading `counts["kiwi"]` is typed `number`, even though it is `undefined` at runtime. Check first, or use `?? 0`.',
          ),
          md(
            'Sometimes you do not know which words will be in your dictionary. `Record<string, number>` means "any word can be a key, and each one holds a number".',
            'With a list of allowed words, like `Record<"apple" | "pear", number>`, every word must be there.',
            'Careful: if you look up a word that is not there, you get `undefined`, even though TypeScript says number.',
          ),
          md(
            '`Record<K, V>` is the mapped type `{ [P in K]: V }`: with a finite literal union it is exhaustive and closed; with `string` it is an index signature. Index signatures with `string` keys also admit numeric keys; template literal pattern signatures (`[key: `data-${string}`]: string`) are allowed too.',
            'By default, indexed reads are typed `V` rather than `V | undefined`. `noUncheckedIndexedAccess` makes them honest, at the cost of narrowing everywhere. `noPropertyAccessFromIndexSignature` additionally forces bracket syntax for non-declared keys, making dynamic access visible. For frequent add/delete or non-string keys, prefer `Map`.',
          ),
        ),
      },
      {
        id: 'tally',
        kind: 'write',
        prompt: L('Write `tally`: count the votes for each name in a `Record<string, number>`.', 'Make `tally` count how many votes each name got.'),
        starter: c('function tally(votes: string[]): Record<string, number> {', '  const counts: Record<string, number> = {};', '  return counts;', '}'),
        solution: c(
          'function tally(votes: string[]): Record<string, number> {',
          '  const counts: Record<string, number> = {};',
          '  for (const name of votes) {',
          '    counts[name] = (counts[name] ?? 0) + 1;',
          '  }',
          '  return counts;',
          '}',
        ),
        tests: [
          { name: 'counts votes', call: 'tally(["Ada", "Bo", "Ada"])', expect: '{"Ada":2,"Bo":1}' },
          { name: 'no votes', call: 'tally([])', expect: '{}' },
        ],
        hint: L('For each name: `counts[name] = (counts[name] ?? 0) + 1;`.', 'For each name, take the count so far (or 0), add one, and put it back.'),
        explain: L(
          '`?? 0` handles names not counted yet. TypeScript would not have warned you without it, because the read is typed `number`.',
          '`?? 0` means "if this name is new, start at 0".',
          'The read `counts[name]` is `number` by type but `undefined` at runtime for a new key; `??` handles it regardless of compiler flags.',
        ),
      },
      {
        id: 'prices',
        kind: 'types',
        prompt: L(
          'Make `prices` a `Record<Fruit, number>` so every fruit must have a price, then add the missing one (a plum costs 3).',
          'Make sure every fruit has a price: use `Record<Fruit, number>`, then add the plum (it costs 3).',
        ),
        hint: L('Change the annotation to `Record<Fruit, number>`; TypeScript then tells you `plum` is missing.', 'Change the type to `Record<Fruit, number>`. TypeScript will tell you the plum is missing.'),
        starter: c('type Fruit = "apple" | "pear" | "plum";', '', 'const prices: Record<string, number> = { apple: 1, pear: 2 };'),
        solution: c('type Fruit = "apple" | "pear" | "plum";', '', 'const prices: Record<Fruit, number> = { apple: 1, pear: 2, plum: 3 };'),
        typeTests: [
          { name: 'one price per fruit', code: 'type T1 = Expect<Equal<typeof prices, Record<Fruit, number>>>;' },
          { name: 'no unknown fruit', code: 'prices.mango;', expect: 'error' },
        ],
        tests: [{ name: 'a plum costs 3', call: 'prices.plum', expect: '3' }],
        explain: L(
          'With a union of keys, `Record` is a checklist: forget a fruit and TypeScript reports which one. Add a fruit to `Fruit` later and every price list must follow.',
          'Now the type is a checklist: every fruit must be there, and no made-up fruits are allowed.',
          'A finite-key `Record` is a closed, exhaustive object type (missing keys are TS2741, extra keys TS2353), which is how lookup tables stay in sync with unions.',
        ),
      },
      {
        id: 'stock',
        kind: 'fix',
        compilerFlags: { noUncheckedIndexedAccess: true },
        prompt: L('With `noUncheckedIndexedAccess` on, `stockOf` no longer compiles. Return 0 for unknown items.', 'With a stricter setting, TypeScript says an item might be missing. Give back 0 when it is.'),
        hint: L('`stock[item]` is now `number | undefined`. Use `?? 0`.', 'The item might not be there. Use `?? 0` to give back 0 instead.'),
        starter: c('function stockOf(stock: Record<string, number>, item: string): number {', '  return stock[item];', '}'),
        solution: c('function stockOf(stock: Record<string, number>, item: string): number {', '  return stock[item] ?? 0;', '}'),
        tests: [
          { name: 'a known item', call: 'stockOf({ pens: 12 }, "pens")', expect: '12' },
          { name: 'an unknown item', call: 'stockOf({ pens: 12 }, "ink")', expect: '0' },
        ],
        explain: L(
          'The flag made the type tell the truth (`number | undefined`), and the bug (returning `undefined` for unknown items) became a compile error.',
          'The stricter setting found a real bug: unknown items used to give back nothing at all.',
          'Under `noUncheckedIndexedAccess`, index-signature reads include `undefined`; `??` both narrows and supplies the default. Most strict codebases enable this flag.',
        ),
      },
      {
        id: 'recap',
        kind: 'recap',
        prompt: L('The short version.', 'What you learned.'),
        points: LL(
          ['`{ [key: string]: V }` and `Record<string, V>` allow any key.', '`Record<"a" | "b", V>` requires every key.', 'Reading a missing key gives `undefined`: check it.'],
          ['`Record<string, number>` is a dictionary with any words.', 'With a list of words, every word must be there.', 'A missing word gives `undefined`.'],
          ['`Record` over a literal union is exhaustive and closed.', 'Enable `noUncheckedIndexedAccess` for honest reads.', 'Use `Map` for dynamic keys with frequent updates.'],
        ),
      },
    ],
    recap: LL(
      ['Index signatures for open-ended keys.', '`Record` with a union for complete lookup tables.', 'Always handle missing keys.'],
      ['Dictionaries can have any words.', 'Checklists must have every word.', 'Look before you trust a lookup.'],
      ['Open vs closed key sets.', 'Honest index reads with the flag.', 'Lookup tables that track unions.'],
    ),
  },

  {
    id: 'm09-l04-intersections',
    moduleId: 'm09',
    order: 4,
    title: {
      story: 'Both at once',
      explorer: 'Intersections and extending',
      pro: 'Intersection types versus interface extension',
    },
    estMinutes: 6,
    difficulty: 2,
    concepts: ['intersection', 'interface', 'type-alias', 'union'],
    objectives: LL(
      ['Combine types with `&`.', 'Compare `&` with `interface … extends`.', 'Spot impossible combinations (`never`).'],
      ['Glue two shapes together with `&`.', 'See how `extends` does something similar.', 'Spot shapes that can never exist.'],
    ),
    steps: [
      {
        id: 'read',
        kind: 'read',
        prompt: L('`A & B` has everything from both.', '`&` glues two shapes together.'),
        body: L(
          md(
            'A union (`A | B`) is *one or the other*. An **intersection** (`A & B`) is *both at once*: a value must have every property of `A` and of `B`.',
            '```ts\ntype Named = { name: string };\ntype Aged = { age: number };\ntype Person = Named & Aged;\n\nconst ada: Person = { name: "Ada", age: 36 };\n```',
            '`interface Person extends Named, Aged {}` does nearly the same. The difference shows on conflicts: `extends` reports them; `&` quietly makes an impossible type.',
          ),
          md(
            'A union means "this OR that". An intersection, written `&`, means "this AND that, both at once".',
            'A `Named & Aged` thing must have a name AND an age.',
          ),
          md(
            'Intersections of object types merge members; intersections of incompatible primitives reduce to `never` (`string & number`), and a property whose types conflict becomes `never`, making the whole object uninhabitable without an error at the declaration.',
            '`interface X extends A, B` checks compatibility eagerly (TS2430) and is cached by name, which also helps compile times on large codebases. Intersections shine for mixing in capabilities (`T & { id: string }`) and branded types (`string & { __brand: "Email" }`).',
          ),
        ),
        figure: { base: 'venn-intersection', story: 'venn-intersection' },
      },
      {
        id: 'impossible',
        kind: 'predictType',
        prompt: L('The two `id` types disagree. What type is `Id`?', 'Both shapes have an `id`, but of different kinds. What type is `Id`?'),
        hint: L('A value would need an `id` that is a string *and* a number at the same time.', 'Can anything be a word and a number at the same time?'),
        code: c(
          'type WithTextId = { id: string };',
          'type WithNumberId = { id: number };',
          'type Both = WithTextId & WithNumberId;',
          'type Id = Both["id"];',
        ),
        target: 'Id',
        answer: 'never',
        explain: L(
          'Nothing is both a string and a number, so the property type is `never`, and no real object can be a `Both`. No error appears until you try to make one.',
          'Nothing can be a word and a number at once, so the answer is `never`: "impossible".',
          '`string & number` reduces to `never`, and the property conflict is silent at the type declaration. `interface` extension would have reported TS2430 instead.',
        ),
      },
      {
        id: 'employee',
        kind: 'types',
        prompt: L('Make `Employee` a `Person` plus a `team: string`, using `&`.', 'Make an `Employee` shape: everything a `Person` has, plus a `team`.'),
        hint: L('`type Employee = Person & { team: string };`', 'Glue `Person` and `{ team: string }` together with `&`.'),
        starter: c('type Person = { name: string; age: number };', '', 'type Employee = Person;'),
        solution: c('type Person = { name: string; age: number };', '', 'type Employee = Person & { team: string };'),
        typeTests: [
          { name: 'has everything', code: 'const ada: Employee = { name: "Ada", age: 36, team: "Engines" };' },
          { name: 'an employee is a person', code: 'const asPerson: Person = ada;' },
          { name: 'the team is required', code: 'const bo: Employee = { name: "Bo", age: 20 };', expect: 'error' },
        ],
        explain: L(
          'An `Employee` has every property of both parts, and can be used anywhere a `Person` is expected.',
          'An Employee has everything from both shapes, so it also counts as a Person.',
          'Intersections are subtypes of each constituent, so `Employee` is assignable to `Person`.',
        ),
      },
      {
        id: 'which',
        kind: 'check',
        prompt: L('Which tells you about a conflicting property at the place you declare the type?', 'Which way tells you straight away when two shapes disagree?'),
        hint: L('One of them reports the conflict; the other quietly makes an impossible type.', 'One of them complains right away. The other stays quiet.'),
        explain: L(
          '`interface … extends` reports incompatible members immediately. `&` silently produces `never` for the conflicting property.',
          '`extends` complains straight away. `&` stays quiet and makes an impossible shape.',
          'Interface extension checks assignability of the derived interface to each base (TS2430); intersections are computed lazily and never error by themselves.',
        ),
        choices: [
          { id: 'extends', text: L('`interface Both extends A, B {}`'), correct: true },
          {
            id: 'and',
            text: L('`type Both = A & B`'),
            correct: false,
            feedback: L('An intersection with a conflict is just an impossible type, with no error where it is declared.', '`&` does not complain. It just makes an impossible shape.'),
          },
        ],
      },
      {
        id: 'recap',
        kind: 'recap',
        prompt: L('The short version.', 'What you learned.'),
        points: LL(
          ['`A & B` has every property of both.', '`interface … extends` does the same and reports conflicts.', 'Conflicting properties become `never`.'],
          ['`&` means "both at once".', '`extends` is similar, and it warns you about problems.', 'Impossible shapes become `never`.'],
          ['Intersections merge object members and reduce conflicting primitives to `never`.', 'Prefer `extends` for object hierarchies.', 'Use `&` for mixins and brands.'],
        ),
      },
    ],
    recap: LL(
      ['Union: one or the other. Intersection: both.', 'Prefer `extends` when building shapes from shapes.', 'Watch for silent `never`.'],
      ['`|` is "or", `&` is "and".', 'Grow shapes with `extends`.', 'Some shapes are impossible.'],
      ['`&` for composition, `extends` for hierarchies.', 'Conflicts: eager errors versus silent `never`.', 'Intersections underpin branding.'],
    ),
  },

  {
    id: 'm09-l05-satisfies',
    moduleId: 'm09',
    order: 5,
    title: {
      story: 'Checked, but still exact',
      explorer: 'The satisfies operator',
      pro: 'satisfies: validation without widening',
    },
    estMinutes: 6,
    difficulty: 3,
    concepts: ['satisfies', 'annotation', 'inference', 'record-type'],
    objectives: LL(
      ['See how an annotation widens a value’s type.', 'Check a value against a type with `satisfies` and keep the precise type.', 'Choose between annotation and `satisfies`.'],
      ['See how a label can make TypeScript forget details.', 'Check something without forgetting.', 'Pick the right one.'],
    ),
    steps: [
      {
        id: 'read',
        kind: 'read',
        prompt: L('Check a value without losing its details.', 'Check a value, and still remember every detail.'),
        body: L(
          md(
            'An annotation makes the variable’s type *exactly* the annotated type, so details are lost:',
            '```ts\ntype Palette = Record<string, string | number[]>;\n\nconst a: Palette = { red: [255, 0, 0], green: "#0f0" };\na.green.toUpperCase(); // error: might be number[]\n\nconst b = { red: [255, 0, 0], green: "#0f0" } satisfies Palette;\nb.green.toUpperCase(); // fine: TypeScript knows it is a string\n```',
            '`satisfies` checks the value against the type (typos and wrong values are still errors) but keeps the type TypeScript inferred.',
          ),
          md(
            'When you put a label on a box, TypeScript only remembers the label. It forgets what is really inside.',
            '`satisfies` means "check that this fits the rules", but TypeScript still remembers exactly what you put in.',
          ),
          md(
            '`expr satisfies T` checks assignability of `expr` to `T` (with excess property checks and contextual typing from `T`) without changing the expression’s type. An annotation replaces the inferred type with `T`.',
            'Use annotations when you want the declared type to be the contract (public APIs, mutable variables you will reassign), `satisfies` for configuration objects, lookup tables and literals whose precise keys and values you want to keep. `as const satisfies T` keeps literal types as well.',
          ),
        ),
      },
      {
        id: 'kept',
        kind: 'predictType',
        prompt: L('What type does `green` get?', 'What type is `green`?'),
        hint: L('`satisfies` checks the object but keeps what was actually written.', 'The check passes, and TypeScript still remembers what is inside.'),
        code: c(
          'type Palette = Record<string, string | number[]>;',
          'const colors = { red: [255, 0, 0], green: "#00ff00" } satisfies Palette;',
          'const green = colors.green;',
          'console.log(green.toUpperCase());',
        ),
        target: 'green',
        answer: 'string',
        explain: L(
          'With `satisfies`, `colors.green` keeps its inferred type, `string`. With an annotation it would be `string | number[]`, and `toUpperCase` would be an error.',
          'TypeScript remembers that green is a word, so `toUpperCase` is fine.',
          'The expression’s inferred type survives: `{ red: number[]; green: string }`, checked against `Palette` but not widened to it.',
        ),
      },
      {
        id: 'routes',
        kind: 'types',
        prompt: L(
          'Use `satisfies` instead of the annotation, so `routes` only has the keys it really has, and every value must still be a string.',
          'Swap the label for `satisfies`, so TypeScript remembers exactly which routes exist.',
        ),
        hint: L('`const routes = { home: "/", about: "/about" } satisfies Record<string, string>;`', 'Remove `: Record<string, string>` and write `satisfies Record<string, string>` after the object.'),
        starter: c('const routes: Record<string, string> = {', '  home: "/",', '  about: "/about",', '};'),
        solution: c('const routes = {', '  home: "/",', '  about: "/about",', '} satisfies Record<string, string>;'),
        typeTests: [
          { name: 'knows the keys', code: 'type T1 = Expect<Equal<keyof typeof routes, "home" | "about">>;' },
          { name: 'a typo is an error', code: 'routes.abuot;', expect: 'error' },
          { name: 'values must be strings', code: 'const bad = { home: 1 } satisfies Record<string, string>;', expect: 'error' },
        ],
        explain: L(
          'The annotation made every string key valid, so the typo `routes.abuot` compiled. `satisfies` keeps the real keys and still checks the values.',
          'With the label, any made-up route was allowed. With `satisfies`, only the real ones are.',
          'Annotating with `Record<string, string>` erased the key set; `satisfies` validates values while preserving `{ home: string; about: string }`.',
        ),
      },
      {
        id: 'recap',
        kind: 'recap',
        prompt: L('The short version.', 'What you learned.'),
        points: LL(
          ['An annotation replaces the inferred type.', '`satisfies` checks the value and keeps the inferred type.', 'Use it for config objects and lookup tables.'],
          ['A label makes TypeScript forget details.', '`satisfies` checks and still remembers.', 'Great for settings and lists of things.'],
          ['`satisfies` = assignability check without widening.', 'Annotate contracts; `satisfies` literals.', '`as const satisfies T` for literal-preserving validation.'],
        ),
      },
    ],
    recap: LL(
      ['Annotation: this variable *is* this type.', '`satisfies`: this value *fits* this type.', 'Keep precise types for the code that uses them.'],
      ['A label is what the box is.', '`satisfies` is a check that it fits.', 'Remembering details helps later.'],
      ['Choose between declared and inferred types deliberately.', '`satisfies` keeps excess-property checks.', 'Ideal for configuration objects.'],
    ),
  },
];

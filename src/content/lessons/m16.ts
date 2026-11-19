import { L, LL, c, md } from '../authoring';
import type { Lesson } from '../schema';

export const M16_LESSONS: readonly Lesson[] = [
  {
    id: 'm16-l01-conditional-types',
    moduleId: 'm16',
    order: 1,
    title: {
      story: 'The sorting hat for types',
      explorer: 'Conditional types',
      pro: 'Conditional types: T extends U ? X : Y',
    },
    estMinutes: 8,
    difficulty: 3,
    concepts: ['conditional-type', 'generic', 'literal-type'],
    objectives: LL(
      ['Choose between two types with `T extends U ? X : Y`.', 'Chain conditions for several cases.', 'Use a conditional type in a type challenge.'],
      ['Sort types into houses, like a sorting hat.', 'Ask several questions in a row.', 'Solve a type puzzle.'],
    ),
    steps: [
      {
        id: 'read',
        kind: 'read',
        prompt: L('A ternary for types.', 'The sorting hat: it looks at a type and picks a house.'),
        body: L(
          md(
            'A **conditional type** picks one of two types, depending on whether a type fits another:',
            '```ts\ntype IsText<T> = T extends string ? "yes" : "no";\n\ntype A = IsText<"hello">; // "yes"\ntype B = IsText<42>;      // "no"\n\ntype Describe<T> =\n  T extends string ? "text" :\n  T extends number ? "number" :\n  "something else";\n```',
            'Read `extends` here as "fits into": `"hello"` fits into `string`, so the first branch is chosen. It is a question asked while the code is being checked, not while it runs.',
          ),
          md(
            'Imagine a sorting hat for types. You put a type under the hat, and the hat asks: "Are you a kind of text?" If yes, it says "text". If no, it asks the next question.',
            'The hat works while TypeScript is checking your code, before anything runs.',
          ),
          md(
            '`T extends U ? X : Y` resolves when `T` is known; for a generic `T` it stays deferred until instantiation. Assignability (not equality) drives the choice, so `never` and `any` behave specially: `any` yields the union of both branches, and a naked `never` distributes to `never` (next lessons).',
            'Conditional types are the `if` of type-level programming; with `infer` and recursion they make the type system Turing-complete, which is powerful and easy to overuse: prefer the simplest type that documents intent.',
          ),
        ),
        figure: 'conditional',
      },
      {
        id: 'house',
        kind: 'predictType',
        prompt: L('Which branch does `Describe<42>` take?', 'Which house does the hat pick for `42`?'),
        hint: L('Is `42` a `string`? If not, is it a `number`?', 'Is 42 text? No. Is it a number?'),
        code: c(
          'type Describe<T> =',
          '  T extends string ? "text" :',
          '  T extends number ? "number" :',
          '  "something else";',
          'type Answer = Describe<42>;',
        ),
        target: 'Answer',
        answer: '"number"',
        explain: L('`42` does not fit `string`, but it fits `number`, so the second branch wins.', '42 is not text, but it is a number, so the hat says "number".', 'The literal `42` is assignable to `number`; nested conditionals are evaluated top-down.'),
      },
      {
        id: 'is-array',
        kind: 'types',
        prompt: L(
          'Write `IsArray<T>`: `true` if `T` is an array, otherwise `false`.',
          'Make a sorting hat `IsArray<T>` that says `true` for lists and `false` for everything else.',
        ),
        hint: L('`type IsArray<T> = T extends unknown[] ? true : false;`', 'Ask: does `T` fit `unknown[]` (a list of anything)? Yes → `true`, no → `false`.'),
        starter: c('type IsArray<T> = false;'),
        solution: c('type IsArray<T> = T extends readonly unknown[] ? true : false;'),
        typeTests: [
          { name: 'a list of numbers', code: 'type T1 = Expect<Equal<IsArray<number[]>, true>>;' },
          { name: 'a read-only tuple', code: 'type T2 = Expect<Equal<IsArray<readonly [1, 2]>, true>>;' },
          { name: 'a string is not', code: 'type T3 = Expect<Equal<IsArray<string>, false>>;' },
          { name: 'an object is not', code: 'type T4 = Expect<Equal<IsArray<{ length: 2 }>, false>>;' },
        ],
        explain: L(
          '`readonly unknown[]` matches every array and tuple, including read-only ones; a plain `unknown[]` would say `false` for `readonly [1, 2]`.',
          'Lists of any kind fit `readonly unknown[]`, even locked lists. Other things do not.',
          'Mutable arrays are assignable to readonly ones, not the reverse, so the readonly form is the widest array pattern.',
        ),
      },
      {
        id: 'name-of',
        kind: 'types',
        prompt: L(
          'Write `TypeName<T>`: `"string"`, `"number"`, `"boolean"`, `"function"` or `"object"`, like `typeof` at runtime.',
          'Make `TypeName<T>` say which kind a type is: "string", "number", "boolean", "function" or "object".',
        ),
        hint: L(
          'Chain the questions: `T extends string ? "string" : T extends number ? "number" : …`. Functions fit `(...args: never[]) => unknown`.',
          'Ask one question after another, like a chain of sorting hats.',
        ),
        starter: c('type TypeName<T> = "object";'),
        solution: c(
          'type TypeName<T> =',
          '  T extends string ? "string" :',
          '  T extends number ? "number" :',
          '  T extends boolean ? "boolean" :',
          '  T extends (...args: never[]) => unknown ? "function" :',
          '  "object";',
        ),
        typeTests: [
          { name: 'string', code: 'type T1 = Expect<Equal<TypeName<"hi">, "string">>;' },
          { name: 'number', code: 'type T2 = Expect<Equal<TypeName<3>, "number">>;' },
          { name: 'boolean', code: 'type T3 = Expect<Equal<TypeName<true>, "boolean">>;' },
          { name: 'function', code: 'type T4 = Expect<Equal<TypeName<() => void>, "function">>;' },
          { name: 'object', code: 'type T5 = Expect<Equal<TypeName<{ a: 1 }>, "object">>;' },
        ],
        explain: L(
          'Order matters: the first question that fits wins, just like `if … else if`.',
          'The hat asks questions in order, and stops at the first "yes".',
          'Function types are matched with `(...args: never[]) => unknown`, the widest callable pattern under `strictFunctionTypes` (parameters are contravariant, so `never[]` accepts any parameter list).',
        ),
      },
      {
        id: 'recap',
        kind: 'recap',
        prompt: L('The short version.', 'What you learned.'),
        points: LL(
          ['`T extends U ? X : Y` chooses a type.', '"Extends" means "fits into".', 'Chain conditions for several cases; order matters.'],
          ['A sorting hat for types.', 'It asks "do you fit?" and picks a house.', 'Questions are asked in order.'],
          ['Assignability drives the branch.', 'Deferred for generic `T`.', 'Keep type-level logic as simple as possible.'],
        ),
      },
    ],
    recap: LL(
      ['Conditional types are `if` for types.', 'They run while checking, not while running.', 'First match wins.'],
      ['The hat sorts types.', 'It works before the code runs.', 'Ask good questions.'],
      ['Type-level branching.', 'Deferred resolution.', 'Prefer simple types.'],
    ),
  },

  {
    id: 'm16-l02-infer',
    moduleId: 'm16',
    order: 2,
    title: {
      story: 'The type detective',
      explorer: 'infer: pulling types out',
      pro: 'Extracting types with infer',
    },
    estMinutes: 8,
    difficulty: 3,
    concepts: ['infer', 'conditional-type', 'function-type', 'promise'],
    objectives: LL(
      ['Capture part of a type with `infer` inside a conditional type.', 'Build your own `ReturnType`.', 'Unwrap arrays and promises.'],
      ['Send a detective to find a hidden type.', 'Find what a machine gives back.', 'Find what is inside a list or a promise.'],
    ),
    steps: [
      {
        id: 'read',
        kind: 'read',
        prompt: L('`infer` names a piece of a type so you can use it.', 'The detective finds a type hidden inside another type.'),
        body: L(
          md(
            'Inside the `extends` of a conditional type, `infer X` says "whatever is in this position, call it `X`":',
            '```ts\ntype ElementOf<T> = T extends (infer Item)[] ? Item : never;\ntype A = ElementOf<string[]>; // string\n\ntype MyReturnType<F> = F extends (...args: never[]) => infer R ? R : never;\ntype B = MyReturnType<() => number>; // number\n```',
            'This is exactly how the built-in `ReturnType`, `Parameters` and `Awaited` work.',
          ),
          md(
            'A type detective looks at a type and finds something hidden inside. "This is a list… of what? Aha! Of strings!"',
            '`infer` is the detective’s notebook: it writes down what it found under a name, so you can use it.',
          ),
          md(
            '`infer` declares a type variable bound by pattern matching against the checked type; it is only allowed in the `extends` clause of a conditional type. Multiple candidates for the same variable produce a union (in covariant positions) or an intersection (in contravariant ones).',
            'Since TS 4.7, `infer X extends C` constrains the captured type (e.g. parse a number literal out of a template). Patterns must be shaped like the input: tuples for positional extraction, function types for signatures, template literals for strings.',
          ),
        ),
      },
      {
        id: 'element',
        kind: 'predictType',
        prompt: L('What is `Found`?', 'What did the detective find?'),
        hint: L('`infer Item` captures what the array holds.', 'The list holds something. What?'),
        code: c('type ElementOf<T> = T extends (infer Item)[] ? Item : never;', 'type Found = ElementOf<boolean[]>;'),
        target: 'Found',
        answer: 'boolean',
        explain: L('`boolean[]` matches `(infer Item)[]` with `Item = boolean`.', 'It is a list of yes/no values, so the detective found `boolean`.', 'Pattern matching binds `Item` to the element type.'),
      },
      {
        id: 'return',
        kind: 'types',
        prompt: L('Build `MyReturnType<F>`: the type a function returns.', 'Send the detective to find what a machine gives back: build `MyReturnType<F>`.'),
        hint: L('`F extends (...args: never[]) => infer R ? R : never`.', 'Match any machine `(...args: never[]) => infer R`, then give back `R`.'),
        starter: c('type MyReturnType<F> = unknown;'),
        solution: c('type MyReturnType<F> = F extends (...args: never[]) => infer R ? R : never;'),
        typeTests: [
          { name: 'a number', code: 'type T1 = Expect<Equal<MyReturnType<() => number>, number>>;' },
          { name: 'with parameters', code: 'type T2 = Expect<Equal<MyReturnType<(a: string, b: boolean) => string[]>, string[]>>;' },
          { name: 'a real function', code: 'function make() { return { ok: true }; }\ntype T3 = Expect<Equal<MyReturnType<typeof make>, { ok: boolean }>>;' },
          { name: 'not a function', code: 'type T4 = Expect<Equal<MyReturnType<string>, never>>;' },
        ],
        explain: L(
          'The pattern describes "a function, returning something"; `infer R` names the something.',
          'The detective matched "a machine that gives back something" and wrote down the something.',
          '`never[]` parameters make the pattern match any function under contravariance; the built-in uses `any` for the same purpose.',
        ),
      },
      {
        id: 'unwrap',
        kind: 'types',
        prompt: L(
          'Build `Unwrap<T>`: the value inside a `Promise`, or inside an array; anything else stays as it is.',
          'Build `Unwrap<T>`: look inside a promise or a list and find what is in it. Anything else stays the same.',
        ),
        hint: L(
          'Two conditions: `T extends Promise<infer V> ? V : T extends (infer E)[] ? E : T`.',
          'First ask "is it a promise of something?", then "is it a list of something?", otherwise keep `T`.',
        ),
        starter: c('type Unwrap<T> = T;'),
        solution: c('type Unwrap<T> = T extends Promise<infer V> ? V : T extends (infer E)[] ? E : T;'),
        typeTests: [
          { name: 'a promise', code: 'type T1 = Expect<Equal<Unwrap<Promise<string>>, string>>;' },
          { name: 'an array', code: 'type T2 = Expect<Equal<Unwrap<number[]>, number>>;' },
          { name: 'anything else', code: 'type T3 = Expect<Equal<Unwrap<boolean>, boolean>>;' },
        ],
        explain: L('Each branch is a different pattern with its own `infer`.', 'The detective checks two places in turn.', 'Chained conditionals with different `infer` patterns; `Awaited` additionally recurses and handles thenables.'),
      },
      {
        id: 'recap',
        kind: 'recap',
        prompt: L('The short version.', 'What you learned.'),
        points: LL(
          ['`infer X` captures part of a type in a conditional type.', 'The pattern must look like the input: arrays, functions, promises.', '`ReturnType`, `Parameters` and `Awaited` are built this way.'],
          ['The detective finds hidden types.', 'It matches a pattern and writes down what it finds.', 'The built-in helpers use the same trick.'],
          ['Pattern matching over type structure.', 'Only in `extends` clauses.', '`infer X extends C` constrains captures.'],
        ),
      },
    ],
    recap: LL(
      ['Extract types with patterns.', 'Build the utilities yourself to understand them.', 'Keep patterns shaped like the input.'],
      ['Detectives find types inside types.', 'Lists, machines, promises.', 'Now you know how the helpers work.'],
      ['`infer` enables type-level destructuring.', 'Variance affects multiple candidates.', 'Foundation for template parsing.'],
    ),
  },

  {
    id: 'm16-l03-distributive',
    moduleId: 'm16',
    order: 3,
    title: {
      story: 'The hat sorts each one separately',
      explorer: 'Distributive conditional types',
      pro: 'Distribution over unions, and how to stop it',
    },
    estMinutes: 8,
    difficulty: 3,
    concepts: ['conditional-type', 'union', 'never'],
    objectives: LL(
      ['See a conditional type apply to each member of a union.', 'Build `Exclude` and `Extract` yourself.', 'Turn distribution off with `[T]`.'],
      ['See the hat sort each member of a group on its own.', 'Build your own sieve.', 'Make the hat look at the whole group at once.'],
    ),
    steps: [
      {
        id: 'read',
        kind: 'read',
        prompt: L('Unions are handled one member at a time.', 'Given a group, the hat sorts each one separately.'),
        body: L(
          md(
            'When the checked type is a bare type parameter and you pass a union, the condition runs **for each member**, and the results are joined into a union again:',
            '```ts\ntype ToArray<T> = T extends unknown ? T[] : never;\ntype A = ToArray<string | number>; // string[] | number[]\n\ntype MyExclude<T, U> = T extends U ? never : T;\ntype B = MyExclude<"a" | "b" | "c", "a">; // "b" | "c"\n```',
            '`never` in a union disappears, which is how `MyExclude` drops members. To treat the union as one whole, wrap both sides in brackets: `[T] extends [unknown] ? T[] : never` gives `(string | number)[]`.',
          ),
          md(
            'If you put a whole group under the sorting hat, it sorts each one separately, then puts the answers back together.',
            'A sieve works like that: each member is either kept or turned into `never`, which means "gone".',
          ),
          md(
            'Distribution happens when the check type is a naked type parameter instantiated with a union; `never` distributes to `never` (an empty union), which surprises people: `IsNever<T> = T extends never ? true : false` gives `never` for `never`. Wrapping in a one-tuple (`[T] extends [never]`) disables distribution.',
            'Distribution is what makes `Exclude`, `Extract`, `NonNullable` and distributive `Omit` work; disabling it is needed when you reason about the union as a whole.',
          ),
        ),
      },
      {
        id: 'to-array',
        kind: 'predictType',
        prompt: L('What is `Result`?', 'What comes out of the hat?'),
        hint: L('Each member of the union becomes its own array.', 'Each kind becomes its own list.'),
        code: c('type ToArray<T> = T extends unknown ? T[] : never;', 'type Result = ToArray<string | number>;'),
        target: 'Result',
        answer: 'string[] | number[]',
        explain: L(
          'The condition ran once for `string` and once for `number`, giving two array types: a list of only strings, or a list of only numbers. Without distribution it would be `(string | number)[]`, a list that mixes both.',
          'Each kind went under the hat by itself, so you get a list type for each.',
          'Distribution maps each constituent. Beware `boolean`: it is `true | false`, so `ToArray<boolean>` is `false[] | true[]`.',
        ),
      },
      {
        id: 'exclude',
        kind: 'types',
        prompt: L('Build `MyExclude<T, U>` and `MyExtract<T, U>` yourself.', 'Build your own sieves: `MyExclude` takes members out, `MyExtract` keeps only the matching ones.'),
        hint: L('`MyExclude<T, U> = T extends U ? never : T`; `MyExtract` swaps the branches.', 'For each member: if it fits `U`, throw it away (`never`), else keep it. `MyExtract` does the opposite.'),
        starter: c('type MyExclude<T, U> = T;', 'type MyExtract<T, U> = T;'),
        solution: c('type MyExclude<T, U> = T extends U ? never : T;', 'type MyExtract<T, U> = T extends U ? T : never;'),
        typeTests: [
          { name: 'exclude one', code: 'type T1 = Expect<Equal<MyExclude<"a" | "b" | "c", "a">, "b" | "c">>;' },
          { name: 'exclude by kind', code: 'type T2 = Expect<Equal<MyExclude<string | number | boolean, string>, number | boolean>>;' },
          { name: 'extract', code: 'type T3 = Expect<Equal<MyExtract<"a" | 1 | "b" | 2, string>, "a" | "b">>;' },
        ],
        explain: L('Each member is tested on its own; `never` results vanish from the union.', 'Each member is checked alone, and "gone" ones disappear.', 'Distribution plus `never` absorption in unions.'),
      },
      {
        id: 'is-never',
        kind: 'types',
        prompt: L(
          'Fix `IsNever<T>` so `IsNever<never>` is `true`. (Hint: stop distribution.)',
          'Fix `IsNever<T>` so it says `true` for `never`. The trick: put `T` in brackets.',
        ),
        hint: L('Wrap both sides: `[T] extends [never] ? true : false`.', 'Write `[T] extends [never]` instead of `T extends never`.'),
        starter: c('type IsNever<T> = T extends never ? true : false;'),
        solution: c('type IsNever<T> = [T] extends [never] ? true : false;'),
        typeTests: [
          { name: 'never is never', code: 'type T1 = Expect<Equal<IsNever<never>, true>>;' },
          { name: 'a string is not', code: 'type T2 = Expect<Equal<IsNever<string>, false>>;' },
          { name: 'a union is not', code: 'type T3 = Expect<Equal<IsNever<"a" | "b">, false>>;' },
        ],
        explain: L(
          '`never` is an empty union, so distributing over it runs the condition zero times and gives `never`, not `true`. Brackets make TypeScript check it as a whole.',
          '`never` is an empty group, so the hat never gets to say anything! Brackets make it look at the whole thing.',
          'Distribution over the empty union yields `never`; the one-tuple wrapper makes the check non-distributive.',
        ),
      },
      {
        id: 'recap',
        kind: 'recap',
        prompt: L('The short version.', 'What you learned.'),
        points: LL(
          ['A conditional over a bare `T` runs once per union member.', '`never` results disappear, which is how `Exclude` works.', '`[T] extends [U]` stops distribution.'],
          ['The hat sorts each member separately.', '"Gone" members vanish.', 'Brackets make it look at the whole group.'],
          ['Distribution on naked type parameters.', '`never` distributes to `never`.', 'One-tuples disable distribution.'],
        ),
      },
    ],
    recap: LL(
      ['Distribution maps over unions.', 'Filter unions with `never`.', 'Stop it with brackets when needed.'],
      ['Groups are sorted one by one.', 'Sieves make things vanish.', 'Brackets keep groups together.'],
      ['Know when distribution applies.', 'Handle `never` explicitly.', 'Build utilities from first principles.'],
    ),
  },

  {
    id: 'm16-l04-mapped-types',
    moduleId: 'm16',
    order: 4,
    title: {
      story: 'The stamp machine',
      explorer: 'Mapped types',
      pro: 'Mapped types and modifiers',
    },
    estMinutes: 8,
    difficulty: 3,
    concepts: ['mapped-type', 'keyof', 'readonly', 'optional'],
    objectives: LL(
      ['Build a type by going through keys: `{ [K in keyof T]: … }`.', 'Add and remove `readonly` and `?` with `+` and `-`.', 'Write your own `Partial`, `Readonly` and `Mutable`.'],
      ['Build a stamp machine that stamps every label.', 'Add or remove "maybe" and "locked" stamps.', 'Build your own shape machines.'],
    ),
    steps: [
      {
        id: 'read',
        kind: 'read',
        prompt: L('Go through the keys, build a property for each.', 'A stamp machine goes along every label and stamps it.'),
        body: L(
          md(
            'A **mapped type** loops over a set of keys and produces a property for each:',
            '```ts\ntype Flags<T> = { [K in keyof T]: boolean };\ntype UserFlags = Flags<{ name: string; age: number }>; // { name: boolean; age: boolean }\n\ntype MyPartial<T> = { [K in keyof T]?: T[K] };\ntype MyReadonly<T> = { readonly [K in keyof T]: T[K] };\ntype Mutable<T> = { -readonly [K in keyof T]: T[K] };   // removes readonly\ntype Complete<T> = { [K in keyof T]-?: T[K] };          // removes ?\n```',
          ),
          md(
            'A stamp machine takes a shape and goes along every label, stamping it: "maybe", "locked", or "change this to yes/no".',
            '`[K in keyof T]` means "for every label K of T". `T[K]` is what was behind that label.',
          ),
          md(
            'Mapped types over `keyof T` are homomorphic: they preserve the original modifiers (optional/readonly) unless changed with `+`/`-`, and distribute over union `T`. They also map tuples and arrays element-wise (`MyReadonly<[1, 2]>` is `readonly [1, 2]`).',
            'The key source can be any union (`[K in "a" | "b"]`), which is how `Record` is defined. Combine with `as` clauses (next lesson) to rename or filter keys.',
          ),
        ),
        figure: 'mapped',
      },
      {
        id: 'flags',
        kind: 'predictType',
        prompt: L('What is `Checks`?', 'What does the stamp machine make?'),
        hint: L('Every key stays; every value type becomes `boolean`.', 'Same labels, but every one now holds yes or no.'),
        code: c('type Flags<T> = { [K in keyof T]: boolean };', 'type Checks = Flags<{ email: string; phone: string }>;'),
        target: 'Checks',
        answer: '{ email: boolean; phone: boolean }',
        explain: L('The mapped type keeps the keys and replaces each value type.', 'Same labels, all stamped with `boolean`.', 'Homomorphic mapping over `keyof T` with a constant value type.'),
      },
      {
        id: 'mine',
        kind: 'types',
        prompt: L('Build `MyPartial<T>` and `Mutable<T>` (removes `readonly`).', 'Build two stamp machines: `MyPartial` stamps "maybe", `Mutable` removes the "locked" stamp.'),
        hint: L('`{ [K in keyof T]?: T[K] }` and `{ -readonly [K in keyof T]: T[K] }`.', 'Use `?` after the key for "maybe", and `-readonly` in front to remove the lock.'),
        starter: c('type MyPartial<T> = T;', 'type Mutable<T> = T;'),
        solution: c('type MyPartial<T> = { [K in keyof T]?: T[K] };', 'type Mutable<T> = { -readonly [K in keyof T]: T[K] };'),
        typeTests: [
          { name: 'partial', code: 'type T1 = Expect<Equal<MyPartial<{ a: number; b: string }>, { a?: number; b?: string }>>;' },
          { name: 'mutable', code: 'type T2 = Expect<Equal<Mutable<{ readonly id: number; name: string }>, { id: number; name: string }>>;' },
          { name: 'mutable can be written', code: 'declare const frozen: Mutable<Readonly<{ count: number }>>;\nfrozen.count = 2;' },
        ],
        explain: L('`?` and `readonly` are modifiers; `-` removes one, and `+` (or nothing) adds it.', 'Stamps can be added or removed.', 'Modifier arithmetic on homomorphic mapped types.'),
      },
      {
        id: 'nullable',
        kind: 'types',
        prompt: L('Build `Nullable<T>`: every property may also be `null`.', 'Build a stamp machine that lets every label also hold `null`.'),
        hint: L('`{ [K in keyof T]: T[K] | null }`.', 'Keep each label, and add `| null` to what it holds.'),
        starter: c('type Nullable<T> = T;'),
        solution: c('type Nullable<T> = { [K in keyof T]: T[K] | null };'),
        typeTests: [
          { name: 'adds null', code: 'type T1 = Expect<Equal<Nullable<{ name: string; age: number }>, { name: string | null; age: number | null }>>;' },
          { name: 'keeps optional properties optional', code: 'type T2 = Expect<Equal<Nullable<{ nick?: string }>, { nick?: string | null }>>;' },
        ],
        explain: L('Homomorphic mapping keeps modifiers, so optional properties stay optional.', 'Maybe-labels stay maybe-labels.', 'Modifiers are preserved by `keyof T` mappings.'),
      },
      {
        id: 'recap',
        kind: 'recap',
        prompt: L('The short version.', 'What you learned.'),
        points: LL(
          ['`{ [K in keyof T]: … }` builds a property for every key.', '`T[K]` is the original property type.', '`+`/`-` add or remove `readonly` and `?`.'],
          ['Stamp machines go along every label.', '`T[K]` is what was behind the label.', 'Stamps can be added or removed.'],
          ['Homomorphic mapped types preserve modifiers.', 'They map arrays and tuples too.', '`Record` is a mapped type over a key union.'],
        ),
      },
    ],
    recap: LL(
      ['Mapped types transform every property.', 'Utility types are just mapped types.', 'Modifiers are under your control.'],
      ['Build your own shape machines.', 'Stamp every label.', 'Add or remove "maybe" and "locked".'],
      ['Mapped types are type-level `map`.', 'Modifiers and homomorphism.', 'Compose with conditional types.'],
    ),
  },

  {
    id: 'm16-l05-key-remapping',
    moduleId: 'm16',
    order: 5,
    title: {
      story: 'Renaming labels with the stamp machine',
      explorer: 'Key remapping with as',
      pro: 'Key remapping and filtering in mapped types',
    },
    estMinutes: 8,
    difficulty: 3,
    concepts: ['mapped-type', 'template-literal-type', 'conditional-type'],
    objectives: LL(
      ['Rename keys in a mapped type with `as`.', 'Drop keys by remapping them to `never`.', 'Build `Getters<T>` and `PickByValue<T, V>`.'],
      ['Teach the stamp machine to rename labels.', 'Make it throw some labels away.', 'Build a getter maker.'],
    ),
    steps: [
      {
        id: 'read',
        kind: 'read',
        prompt: L('`as` renames or filters keys.', 'The stamp machine can write new names on the labels.'),
        body: L(
          md(
            'An `as` clause after the key computes a new key:',
            '```ts\ntype Getters<T> = {\n  [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K];\n};\ntype UserGetters = Getters<{ name: string; age: number }>;\n// { getName: () => string; getAge: () => number }\n\ntype OnlyStrings<T> = {\n  [K in keyof T as T[K] extends string ? K : never]: T[K];\n};\n```',
            'Remapping a key to `never` drops it: that is how you filter properties by their type.',
          ),
          md(
            'The stamp machine can also write a new name on each label: "name" becomes "getName".',
            'If it writes "never" on a label, that label is thrown away. That is how you keep only some labels.',
          ),
          md(
            'Key remapping (TS 4.1) evaluates the `as` type per key; the result may be any property-key type, and `never` removes the entry. `string & K` narrows `keyof T` (which can include numbers and symbols) for template literals. Remapped mapped types are no longer homomorphic, so modifiers are not preserved automatically.',
          ),
        ),
      },
      {
        id: 'getters',
        kind: 'types',
        prompt: L('Build `Getters<T>`: for each property `x`, a method `getX(): T["x"]`.', 'Build a getter maker: for each label `x`, make `getX`, a machine that gives back what is behind `x`.'),
        hint: L('Remap each key with `as` and a template literal type: `` [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K] ``.', 'Use `as` with a template: `` `get${Capitalize<string & K>}` ``.'),
        starter: c('type Getters<T> = { [K in keyof T]: () => T[K] };'),
        solution: c('type Getters<T> = {', '  [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K];', '};'),
        typeTests: [
          { name: 'renamed getters', code: 'type T1 = Expect<Equal<Getters<{ name: string; age: number }>, { getName: () => string; getAge: () => number }>>;' },
          { name: 'the old names are gone', code: 'declare const getters: Getters<{ name: string }>;\ngetters.name;', expect: 'error' },
        ],
        explain: L('The `as` clause builds each new key from the old one with a template literal type.', 'Each label gets a new name, made from the old one.', '`Capitalize` is an intrinsic string manipulation type; `string & K` excludes symbol keys.'),
      },
      {
        id: 'pick-by-value',
        kind: 'types',
        prompt: L('Build `PickByValue<T, V>`: only the properties whose type fits `V`.', 'Build a filter: keep only the labels whose value fits `V`.'),
        hint: L('`[K in keyof T as T[K] extends V ? K : never]: T[K]`.', 'Keep the key `K` when `T[K]` fits `V`; otherwise write `never` to drop it.'),
        starter: c('type PickByValue<T, V> = T;'),
        solution: c('type PickByValue<T, V> = {', '  [K in keyof T as T[K] extends V ? K : never]: T[K];', '};'),
        typeTests: [
          { name: 'only strings', code: 'type T1 = Expect<Equal<PickByValue<{ a: string; b: number; c: string }, string>, { a: string; c: string }>>;' },
          { name: 'only functions', code: 'type T2 = Expect<Equal<keyof PickByValue<{ run(): void; id: number }, () => void>, "run">>;' },
        ],
        explain: L('Mapping a key to `never` removes it, so the condition decides which properties survive.', 'Labels stamped "never" are thrown away.', 'Filtering via remapping to `never`.'),
      },
      {
        id: 'recap',
        kind: 'recap',
        prompt: L('The short version.', 'What you learned.'),
        points: LL(
          ['`as` in a mapped type computes a new key.', 'Remapping to `never` drops the property.', 'Template literal types build new names.'],
          ['The stamp machine can rename labels.', '"never" throws a label away.', 'New names can be built from old ones.'],
          ['Key remapping (`as`) per key.', 'Filtering by value type.', 'Not homomorphic: modifiers are not kept.'],
        ),
      },
    ],
    recap: LL(
      ['Rename and filter keys with `as`.', 'Build APIs like getters from data types.', 'Combine with conditionals.'],
      ['Rename labels, throw some away.', 'Build getters from shapes.', 'Mix with the sorting hat.'],
      ['Key remapping enables type-level API generation.', '`never` filters.', 'Watch modifiers.'],
    ),
  },

  {
    id: 'm16-l06-template-literal-types',
    moduleId: 'm16',
    order: 6,
    title: {
      story: 'The label maker',
      explorer: 'Template literal types',
      pro: 'Template literal types and string parsing',
    },
    estMinutes: 8,
    difficulty: 3,
    concepts: ['template-literal-type', 'infer', 'union'],
    objectives: LL(
      ['Build string patterns with template literal types.', 'Combine unions into every possible string.', 'Pull pieces out of a string type with `infer`.'],
      ['Make labels from patterns.', 'Mix and match words.', 'Read pieces out of a label.'],
    ),
    steps: [
      {
        id: 'read',
        kind: 'read',
        prompt: L('Strings can be types, built from patterns.', 'A label maker for types.'),
        body: L(
          md(
            '```ts\ntype Size = "small" | "large";\ntype Colour = "red" | "blue";\ntype Style = `${Size}-${Colour}`; // "small-red" | "small-blue" | "large-red" | "large-blue"\n\ntype EventName<T extends string> = `on${Capitalize<T>}`;\ntype Handlers = EventName<"click" | "close">; // "onClick" | "onClose"\n\ntype ParamOf<T> = T extends `${string}:${infer P}` ? P : never;\ntype Id = ParamOf<"/users/:id">; // "id"\n```',
            'Unions inside a template combine every way; `infer` inside a template reads a piece back out.',
          ),
          md(
            'A label maker prints labels from a pattern: `${Size}-${Colour}` makes every mix: small-red, small-blue, large-red, large-blue.',
            'And the detective can read a label: from "/users/:id" it finds "id".',
          ),
          md(
            'Template literal types produce the cross product of interpolated unions (beware combinatorial blow-up; TypeScript caps unions at 100,000 members). Intrinsics `Uppercase`, `Lowercase`, `Capitalize` and `Uncapitalize` transform literals.',
            'Pattern matching with `infer` in templates is greedy from the left for the first placeholder; recursion parses whole strings (Module 19’s router does exactly that).',
          ),
        ),
      },
      {
        id: 'combine',
        kind: 'predictType',
        prompt: L('What is `Cell`?', 'What labels does the label maker make?'),
        hint: L('Every letter is combined with every digit.', 'Each letter with each number.'),
        code: c('type Letter = "a" | "b";', 'type Digit = 1 | 2;', 'type Cell = `${Letter}${Digit}`;'),
        target: 'Cell',
        answer: '"a1" | "a2" | "b1" | "b2"',
        explain: L('A template with unions produces every combination: 2 × 2 = 4 strings.', 'Each letter with each number: four labels.', 'Cross product of the interpolated unions.'),
      },
      {
        id: 'handlers',
        kind: 'types',
        prompt: L('Build `Handlers<Events>`: for each event name `e`, an optional `onE` method.', 'Build `Handlers`: for each event name like "click", a "maybe" label `onClick` holding a machine.'),
        hint: L('A mapped type over `Events`, renaming each key with `` as `on${Capitalize<K>}` ``, each one `?: () => void`.', 'Go through each event name `K` and rename it to `` `on${Capitalize<K>}` ``, as a "maybe" machine.'),
        starter: c('type Handlers<Events extends string> = {};'),
        solution: c('type Handlers<Events extends string> = {', '  [K in Events as `on${Capitalize<K>}`]?: () => void;', '};'),
        typeTests: [
          { name: 'the handler names', code: 'type T1 = Expect<Equal<keyof Handlers<"click" | "close">, "onClick" | "onClose">>;' },
          { name: 'all optional', code: 'const none: Handlers<"click"> = {};' },
          { name: 'only real events', code: 'const wrong: Handlers<"click"> = { onHover: () => {} };', expect: 'error' },
        ],
        explain: L('The keys are computed from the event names, so adding an event adds its handler slot.', 'New events get new handler labels automatically.', 'Key remapping over a string-literal union with `Capitalize`.'),
      },
      {
        id: 'param',
        kind: 'types',
        prompt: L('Build `ParamName<T>`: from `"/users/:id"`, get `"id"`; with no `:`, `never`.', 'Send the detective into a label: from "/users/:id", find "id".'),
        hint: L('`T extends `${string}:${infer Name}` ? Name : never`.', 'Match "anything, then a colon, then the name", and give back the name.'),
        starter: c('type ParamName<T extends string> = never;'),
        solution: c('type ParamName<T extends string> = T extends `${string}:${infer Name}` ? Name : never;'),
        typeTests: [
          { name: 'one parameter', code: 'type T1 = Expect<Equal<ParamName<"/users/:id">, "id">>;' },
          { name: 'another', code: 'type T2 = Expect<Equal<ParamName<"/posts/:slug">, "slug">>;' },
          { name: 'no parameter', code: 'type T3 = Expect<Equal<ParamName<"/about">, never>>;' },
        ],
        explain: L('`infer` in a template reads the piece after the colon. Module 19 builds a whole router type this way.', 'The detective found the name after the colon.', 'Template literal pattern matching; recursion handles multiple parameters.'),
      },
      {
        id: 'recap',
        kind: 'recap',
        prompt: L('The short version.', 'What you learned.'),
        points: LL(
          ['Template literal types build string patterns.', 'Unions inside combine every way.', '`infer` inside a template reads pieces out.'],
          ['The label maker makes labels from patterns.', 'It mixes every word with every other.', 'The detective can read labels too.'],
          ['Cross products and intrinsic string types.', 'Pattern matching over strings.', 'Mind union size limits.'],
        ),
      },
    ],
    recap: LL(
      ['Model string formats as types.', 'Generate names from names.', 'Parse string types with `infer`.'],
      ['Labels from patterns.', 'New names from old.', 'Reading labels with the detective.'],
      ['String-level type programming.', 'Typed routes, events and CSS.', 'Recursion for full parsers.'],
    ),
  },
];

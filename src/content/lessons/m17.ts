import { L, LL, c, md } from '../authoring';
import type { Lesson } from '../schema';

export const M17_LESSONS: readonly Lesson[] = [
  {
    id: 'm17-l01-recursive-types',
    moduleId: 'm17',
    order: 1,
    title: {
      story: 'Dolls inside dolls',
      explorer: 'Recursive types',
      pro: 'Recursive types: Json, DeepReadonly and depth',
    },
    estMinutes: 8,
    difficulty: 3,
    concepts: ['recursive-type', 'mapped-type', 'conditional-type'],
    objectives: LL(
      ['Write a type that refers to itself, like `Json`.', 'Make every level read-only with a recursive mapped type.', 'Know that recursion has limits.'],
      ['Make a type that contains itself, like dolls inside dolls.', 'Lock every level, all the way down.', 'Know that it has to stop somewhere.'],
    ),
    steps: [
      {
        id: 'read',
        kind: 'read',
        prompt: L('Types can contain themselves.', 'Like a doll with a smaller doll inside, and another inside that.'),
        body: L(
          md(
            'Some data is nested to any depth. A **recursive type** mentions itself:',
            '```ts\ntype Json =\n  | string\n  | number\n  | boolean\n  | null\n  | Json[]\n  | { [key: string]: Json };\n\ntype DeepReadonly<T> = {\n  readonly [K in keyof T]: T[K] extends object ? DeepReadonly<T[K]> : T[K];\n};\n```',
            'A JSON value is text, a number, true/false, null, a list *of JSON values*, or an object *of JSON values*. `DeepReadonly` applies itself to every nested object.',
          ),
          md(
            'Think of Russian dolls: each doll can have another doll inside, and that one another. A JSON value can hold other JSON values inside it, as deep as you like.',
            '`DeepReadonly` locks the outside doll, then opens it and locks the one inside, and so on, all the way down.',
          ),
          md(
            'Type aliases may be recursive through object types, arrays, tuples and (since 4.1) conditional types. Instantiation depth is limited (about 50 for non-tail-recursive conditionals, 1,000 for tail-recursive ones since 4.5); past that you get TS2589 "Type instantiation is excessively deep".',
            'Recursive mapped types handle arrays and tuples homomorphically; functions are objects too, so guard them (`T[K] extends (...args: never[]) => unknown ? T[K] : …`) when it matters.',
          ),
        ),
      },
      {
        id: 'json',
        kind: 'types',
        prompt: L('Define `Json`: text, numbers, booleans, `null`, and arrays and objects of `Json`.', 'Make the `Json` type: words, numbers, yes/no, `null`, and lists and objects full of more `Json`.'),
        hint: L('A union that mentions `Json[]` and `{ [key: string]: Json }`.', 'List the simple kinds with `|`, then add `Json[]` and `{ [key: string]: Json }`.'),
        starter: c('type Json = unknown;'),
        solution: c('type Json =', '  | string', '  | number', '  | boolean', '  | null', '  | Json[]', '  | { [key: string]: Json };'),
        typeTests: [
          { name: 'nested data', code: 'const ok: Json = { name: "Ada", tags: ["x", 1, true, null], address: { city: "Paris" } };' },
          { name: 'no functions', code: 'const fn: Json = { run: () => 1 };', expect: 'error' },
          { name: 'no undefined', code: 'const missing: Json = { value: undefined };', expect: 'error' },
          { name: 'no dates', code: 'const when: Json = new Date();', expect: 'error' },
        ],
        explain: L('The type describes exactly what `JSON.stringify` keeps: functions, `undefined` and `Date` objects are not JSON.', 'Only things that JSON can really hold are allowed.', 'A precise `Json` type documents serialisability; `Date` fails because its methods are not `Json`.'),
      },
      {
        id: 'deep',
        kind: 'types',
        prompt: L('Build `DeepReadonly<T>`: nothing at any depth can be changed.', 'Build `DeepReadonly`: lock every doll, all the way down.'),
        hint: L('`{ readonly [K in keyof T]: T[K] extends object ? DeepReadonly<T[K]> : T[K] }`.', 'Lock each label, and if what is behind it is an object, lock that too (using `DeepReadonly` again).'),
        starter: c('type DeepReadonly<T> = Readonly<T>;'),
        solution: c('type DeepReadonly<T> = {', '  readonly [K in keyof T]: T[K] extends object ? DeepReadonly<T[K]> : T[K];', '};'),
        typeTests: [
          { name: 'reading is fine', code: 'declare const config: DeepReadonly<{ server: { port: number }; tags: string[] }>;\nconst port: number = config.server.port;' },
          { name: 'the top is locked', code: 'declare const a: DeepReadonly<{ server: { port: number } }>;\na.server = { port: 1 };', expect: 'error' },
          { name: 'deeper is locked too', code: 'declare const b: DeepReadonly<{ server: { port: number } }>;\nb.server.port = 1;', expect: 'error' },
          { name: 'arrays are locked', code: 'declare const d: DeepReadonly<{ tags: string[] }>;\nd.tags.push("x");', expect: 'error' },
        ],
        explain: L('`Readonly` only locks the top level; the recursive version reaches every nested object and array.', 'The plain lock only locked the outside doll. Now every doll is locked.', 'The homomorphic mapped type also maps arrays to readonly arrays, so `push` disappears.'),
      },
      {
        id: 'limit',
        kind: 'check',
        prompt: L('What happens if a recursive type goes too deep?', 'What if the dolls go on forever?'),
        hint: L('TypeScript has to stop somewhere.', 'Can TypeScript open dolls forever?'),
        explain: L('TypeScript stops and reports "Type instantiation is excessively deep and possibly infinite" (TS2589). Keep recursion shallow or tail-recursive.', 'TypeScript gives up and says it is too deep. So it has to stop somewhere.', 'Depth limits guard the checker; tail-recursive conditional types get a much higher limit.'),
        choices: [
          { id: 'error', text: L('TypeScript reports that the type is too deep'), correct: true },
          { id: 'hang', text: L('The editor freezes forever'), correct: false, feedback: L('There is a limit, precisely so that does not happen.', 'TypeScript has a limit, so it does not freeze.') },
        ],
      },
      {
        id: 'recap',
        kind: 'recap',
        prompt: L('The short version.', 'What you learned.'),
        points: LL(
          ['A recursive type refers to itself.', '`Json` and `DeepReadonly` are classic examples.', 'Recursion depth is limited.'],
          ['Types can hold themselves, like dolls.', 'You can lock every doll.', 'It must stop somewhere.'],
          ['Recursion through objects, arrays and conditionals.', 'Depth limits and TS2589.', 'Guard functions in deep mapped types.'],
        ),
      },
    ],
    recap: LL(
      ['Model nested data with recursive types.', 'Apply transformations at every depth.', 'Mind the limits.'],
      ['Dolls inside dolls.', 'Lock all the way down.', 'Keep it reasonable.'],
      ['Recursive aliases are first-class.', 'Deep utilities need care.', 'Prefer tail recursion.'],
    ),
  },

  {
    id: 'm17-l02-branded-types',
    moduleId: 'm17',
    order: 2,
    title: {
      story: 'Name tags for look-alike values',
      explorer: 'Branded types',
      pro: 'Branded (nominal) types for look-alike primitives',
    },
    estMinutes: 8,
    difficulty: 3,
    concepts: ['branded-type', 'intersection', 'type-predicate'],
    objectives: LL(
      ['Tell apart values that are all strings: user ids, order ids, emails.', 'Create branded values only through a checking function.', 'Know brands exist only in types.'],
      ['Put name tags on things that look the same.', 'Only hand out name tags after checking.', 'Know the tag is only for TypeScript.'],
    ),
    steps: [
      {
        id: 'read',
        kind: 'read',
        prompt: L('Same shape, different meaning.', 'Two keys can look the same but open different doors.'),
        body: L(
          md(
            'TypeScript is structural: any `string` fits any other `string`. So a user id can be passed where an order id is expected. A **brand** makes them different:',
            '```ts\ntype UserId = string & { readonly __brand: "UserId" };\ntype OrderId = string & { readonly __brand: "OrderId" };\n\nfunction toOrderId(raw: string): OrderId {\n  return raw as OrderId; // the only place that creates one\n}\n\nfunction loadOrder(id: OrderId) { /* … */ }\nloadOrder(userId);              // error: a UserId is not an OrderId\nloadOrder(toOrderId("o-42"));   // fine\n```',
          ),
          md(
            'Two keys can look exactly the same, but one opens the front door and the other the shed. TypeScript sees two strings and cannot tell them apart.',
            'A brand is a name tag: "this string is an order id". Only a special machine hands out the tag, after checking.',
          ),
          md(
            'Branding simulates nominal typing with an intersection of the primitive and a phantom property; no such property exists at runtime, so the only way in is an assertion inside a constructor function, which should validate (a "smart constructor"). `unique symbol` brands avoid clashing brand names across libraries.',
            'Use brands for ids, units (`Meters` vs `Feet`), validated strings (`Email`, `NonEmptyString`) and sanitised HTML. They cost nothing at runtime.',
          ),
        ),
      },
      {
        id: 'ids',
        kind: 'types',
        prompt: L('Brand `UserId` and `OrderId` so they cannot be mixed up.', 'Put name tags on `UserId` and `OrderId` so they cannot be mixed up.'),
        hint: L('`type OrderId = string & { readonly __brand: "OrderId" };` (and the same for `UserId`); `toOrderId` returns `raw as OrderId`.', 'Add `& { readonly __brand: "OrderId" }` to each type, and use `as OrderId` inside `toOrderId`.'),
        starter: c(
          'type UserId = string;',
          'type OrderId = string;',
          '',
          'function toOrderId(raw: string): OrderId {',
          '  return raw;',
          '}',
          '',
          'function loadOrder(id: OrderId): string {',
          '  return `loading ${id}`;',
          '}',
        ),
        solution: c(
          'type UserId = string & { readonly __brand: "UserId" };',
          'type OrderId = string & { readonly __brand: "OrderId" };',
          '',
          'function toOrderId(raw: string): OrderId {',
          '  return raw as OrderId;',
          '}',
          '',
          'function loadOrder(id: OrderId): string {',
          '  return `loading ${id}`;',
          '}',
        ),
        typeTests: [
          { name: 'an order id works', code: 'const text: string = loadOrder(toOrderId("o-42"));' },
          { name: 'a user id is refused', code: 'declare const user: UserId;\nloadOrder(user);', expect: 'error' },
          { name: 'a plain string is refused', code: 'loadOrder("o-42");', expect: 'error' },
          { name: 'still usable as a string', code: 'declare const order: OrderId;\nconst upper: string = order.toUpperCase();' },
        ],
        tests: [{ name: 'nothing changes at runtime', call: 'loadOrder(toOrderId("o-42"))', expect: 'loading o-42' }],
        explain: L('The brand only exists in types: at runtime an `OrderId` is a plain string. Mixing ids up is now a compile error.', 'The tag is only for TypeScript, but it stops mix-ups before they happen.', 'Phantom intersections give nominal behaviour at zero cost; `toOrderId` is the single audited assertion.'),
      },
      {
        id: 'email',
        kind: 'write',
        prompt: L('Write `toEmail`: return the text as an `Email` if it has exactly one `@` with text on both sides, otherwise `null`.', 'Make `toEmail`: only hand out the Email tag if the text has one `@` with something on each side.'),
        starter: c(
          'type Email = string & { readonly __brand: "Email" };',
          '',
          'function toEmail(text: string): Email | null {',
          '  return null;',
          '}',
        ),
        solution: c(
          'type Email = string & { readonly __brand: "Email" };',
          '',
          'function toEmail(text: string): Email | null {',
          '  const parts = text.split("@");',
          '  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;',
          '  return text as Email;',
          '}',
        ),
        tests: [
          { name: 'a real address', call: 'toEmail("ada@example.com")', expect: 'ada@example.com' },
          { name: 'no @', call: 'toEmail("ada.example.com")', expect: 'null' },
          { name: 'two @', call: 'toEmail("a@b@c")', expect: 'null' },
          { name: 'nothing before @', call: 'toEmail("@example.com")', expect: 'null' },
        ],
        hint: L('`split("@")` must give exactly two non-empty parts; then `return text as Email`.', 'Split at `@`. You need exactly two pieces, neither empty. Then give back `text as Email`.'),
        explain: L('A smart constructor: the only way to get an `Email` is through the check, so every `Email` in the program has passed it.', 'Only checked addresses get the Email tag.', 'Validation plus a single cast; downstream code can require `Email` instead of re-validating strings.'),
      },
      {
        id: 'recap',
        kind: 'recap',
        prompt: L('The short version.', 'What you learned.'),
        points: LL(
          ['A brand (`string & { __brand: … }`) makes look-alike values different.', 'Create branded values only in a checking function.', 'Brands cost nothing at runtime.'],
          ['Name tags tell look-alike values apart.', 'Only a checking machine hands out tags.', 'Tags are only for TypeScript.'],
          ['Nominal typing via phantom intersections.', 'Smart constructors own the assertion.', 'Use for ids, units and validated strings.'],
        ),
      },
    ],
    recap: LL(
      ['Brand ids and validated values.', 'One constructor per brand.', 'Compile-time safety, runtime strings.'],
      ['Tag things that look alike.', 'Check before tagging.', 'Tags stop mix-ups.'],
      ['Phantom types for domain safety.', 'Centralise assertions.', 'Zero-cost abstractions.'],
    ),
  },

  {
    id: 'm17-l03-variance',
    moduleId: 'm17',
    order: 3,
    title: {
      story: 'Which boxes fit into which',
      explorer: 'Variance: when generic types fit',
      pro: 'Variance, soundness and in/out annotations',
    },
    estMinutes: 9,
    difficulty: 3,
    concepts: ['variance', 'generic', 'function-type'],
    objectives: LL(
      ['Know when `Box<Dog>` fits where `Box<Animal>` is expected.', 'See why function parameters go the other way.', 'Annotate type parameters with `in` and `out`.'],
      ['Know when a box of dogs counts as a box of animals.', 'See why a dog-only vet is not an animal vet.', 'Mark which way a box works.'],
    ),
    steps: [
      {
        id: 'read',
        kind: 'read',
        prompt: L('Things you read from, and things you give to.', 'A box you take from, and a box you put into.'),
        body: L(
          md(
            'If every `Dog` is an `Animal`, is a `Dog[]` an `Animal[]`? TypeScript says yes (arrays are **covariant**). That is convenient, but not fully safe: through the `Animal[]` name you could push a cat into the list of dogs.',
            'Functions go the other way for their parameters (**contravariant**): a function that handles any `Animal` can stand in for one that handles `Dog`s, but not the reverse.',
            '```ts\ninterface Producer<out T> { make(): T }        // only gives T out\ninterface Consumer<in T> { take(value: T): void } // only takes T in\n```',
          ),
          md(
            'A bag of dogs is a bag of animals, when you only take things out. But if someone puts a cat into it through the "animals" label, the dog bag now has a cat!',
            'A vet who treats any animal can treat your dog. A dog-only vet cannot treat every animal. So "takers" work the other way round.',
          ),
          md(
            'Variance is how subtyping of `F<T>` follows subtyping of `T`: covariant (outputs), contravariant (inputs), invariant (both), bivariant (either, unsound). TypeScript infers variance structurally; arrays and method parameters are deliberately unsound (covariant/bivariant) for ergonomics, while function-typed properties are checked contravariantly under `strictFunctionTypes`.',
            'Explicit `in`/`out` annotations (TS 4.7) document intent, speed up checking of complex types and are verified against the structure (TS2636 if they contradict it).',
          ),
        ),
      },
      {
        id: 'predict',
        kind: 'predict',
        prompt: L('TypeScript accepts this. What prints?', 'TypeScript says this is fine. What will it show?'),
        hint: L('`animals` and `dogs` are the same array. The cat has no `bark`.', 'Both names point at the same list, and a cat got in.'),
        code: c(
          'type Animal = { name: string };',
          'type Dog = Animal & { bark: () => string };',
          '',
          'const dogs: Dog[] = [{ name: "Rex", bark: () => "woof" }];',
          'const animals: Animal[] = dogs;',
          'animals.push({ name: "Tom the cat" });',
          'console.log(dogs.length, typeof dogs[1]?.bark);',
        ),
        answer: '2 undefined',
        explain: L('Array covariance let a non-dog into `dogs`. TypeScript trades this hole for convenience; `readonly Animal[]` would have closed it.', 'A cat got into the dog list through the "animals" name, and cats cannot bark.', 'Mutable arrays are unsoundly covariant; readonly arrays are soundly covariant because they cannot be written.'),
      },
      {
        id: 'which',
        kind: 'check',
        prompt: L('Under `strict`, which assignment is an error?', 'Which one does TypeScript refuse?'),
        hint: L('A handler must cope with everything its slot may pass in.', 'Can a dog-only vet treat every animal?'),
        explain: L('A `Dog`-only handler cannot stand in for an `Animal` handler: it might be called with a cat. The reverse is fine.', 'The dog-only vet cannot be the animal vet. The animal vet can treat dogs, though.', '`strictFunctionTypes` checks function-typed parameters contravariantly.'),
        choices: [
          { id: 'narrow', text: L('`const handleAnimal: (a: Animal) => void = (d: Dog) => d.bark();`'), correct: true },
          { id: 'wide', text: L('`const handleDog: (d: Dog) => void = (a: Animal) => console.log(a.name);`'), correct: false, feedback: L('That one is fine: a handler for any animal can handle dogs.', 'That is fine: the animal vet can treat dogs.') },
        ],
      },
      {
        id: 'annotate',
        kind: 'types',
        prompt: L('The `in`/`out` annotations are the wrong way round. Fix them.', 'The "give" and "take" marks are swapped. Fix them!'),
        hint: L('`Producer` only returns `T` (`out`); `Consumer` only receives `T` (`in`).', 'The maker gives things out; the taker takes things in.'),
        starter: c(
          'type Animal = { name: string };',
          'type Dog = Animal & { bark: () => string };',
          '',
          'interface Producer<in T> {',
          '  make(): T;',
          '}',
          'interface Consumer<out T> {',
          '  take(value: T): void;',
          '}',
        ),
        solution: c(
          'type Animal = { name: string };',
          'type Dog = Animal & { bark: () => string };',
          '',
          'interface Producer<out T> {',
          '  make(): T;',
          '}',
          'interface Consumer<in T> {',
          '  take(value: T): void;',
          '}',
        ),
        typeTests: [
          { name: 'a dog maker is an animal maker', code: 'declare const dogMaker: Producer<Dog>;\nconst animalMaker: Producer<Animal> = dogMaker;' },
          { name: 'an animal taker can take dogs', code: 'declare const animalTaker: Consumer<Animal>;\nconst dogTaker: Consumer<Dog> = animalTaker;' },
          { name: 'not the other way', code: 'declare const takesDogs: Consumer<Dog>;\nconst takesAnimals: Consumer<Animal> = takesDogs;', expect: 'error' },
        ],
        explain: L('`out` for positions you read from, `in` for positions you write to. TypeScript checks the annotation matches how `T` is used.', 'Makers give out; takers take in. TypeScript checks you marked them right.', 'Variance annotations are verified against structural usage (TS2636) and then used for assignability.'),
      },
      {
        id: 'recap',
        kind: 'recap',
        prompt: L('The short version.', 'What you learned.'),
        points: LL(
          ['Outputs are covariant: `Producer<Dog>` fits `Producer<Animal>`.', 'Inputs are contravariant: `Consumer<Animal>` fits `Consumer<Dog>`.', 'Mutable arrays are covariant, which is convenient but not fully safe.'],
          ['Boxes you take from: dogs count as animals.', 'Boxes you put into: it works the other way.', 'Editable lists can let the wrong thing in.'],
          ['Variance follows data flow.', '`in`/`out` document and enforce it.', 'Prefer readonly collections in APIs.'],
        ),
      },
    ],
    recap: LL(
      ['Reading: covariant. Writing: contravariant. Both: invariant.', 'Use `readonly` to make arrays safe.', 'Annotate variance on complex generics.'],
      ['Take-out boxes and put-in boxes work differently.', 'Lock lists to stay safe.', 'Mark which way a box works.'],
      ['Understand the deliberate unsoundness.', 'Readonly for sound covariance.', 'Explicit variance for clarity and speed.'],
    ),
  },

  {
    id: 'm17-l04-noinfer-const',
    moduleId: 'm17',
    order: 4,
    title: {
      story: 'Do not guess from that one!',
      explorer: 'NoInfer and const type parameters',
      pro: 'Controlling inference: NoInfer<T> and const T',
    },
    estMinutes: 7,
    difficulty: 3,
    concepts: ['inference', 'generic', 'literal-type'],
    objectives: LL(
      ['See a wrong argument widen a type parameter instead of being an error.', 'Block inference from one parameter with `NoInfer<T>`.', 'Keep exact literals with `const T`.'],
      ['See how a wrong guess sneaks in.', 'Tell TypeScript not to guess from one input.', 'Keep exact words.'],
    ),
    steps: [
      {
        id: 'read',
        kind: 'read',
        prompt: L('Decide where TypeScript infers from.', 'Tell TypeScript which inputs to guess from.'),
        body: L(
          md(
            'TypeScript infers a type parameter from *every* place it appears, so a mistake can widen it instead of being reported:',
            '```ts\nfunction pick<T extends string>(options: T[], initial: T): T { return initial; }\npick(["light", "dark"], "blue"); // no error: T became "light" | "dark" | "blue"\n\nfunction safePick<T extends string>(options: T[], initial: NoInfer<T>): T { return initial; }\nsafePick(["light", "dark"], "blue"); // error: "blue" is not "light" | "dark"\n```',
            '`NoInfer<T>` (TypeScript 5.4) means "check this against `T`, but do not use it to work `T` out".',
          ),
          md(
            'TypeScript guesses the kind from all the inputs, so a wrong one ("blue") gets added to the guess instead of being caught!',
            '`NoInfer` says: "do not guess from this input; only check it".',
          ),
          md(
            '`NoInfer<T>` is an intrinsic marker that removes its position from inference candidates while preserving `T` for checking. Typical uses: default values, fallbacks, and "one of these" parameters. Combine with `const T` to infer exact literal unions from the authoritative argument only.',
          ),
        ),
      },
      {
        id: 'pick',
        kind: 'types',
        prompt: L('Make `pick` reject an `initial` that is not one of the `options`.', 'Make `pick` refuse a starting choice that is not in the list.'),
        hint: L('Change `initial: T` to `initial: NoInfer<T>`.', 'Wrap the type of `initial` in `NoInfer< >`.'),
        starter: c('function pick<T extends string>(options: T[], initial: T): T {', '  return options.includes(initial) ? initial : (options[0] ?? initial);', '}'),
        solution: c('function pick<T extends string>(options: T[], initial: NoInfer<T>): T {', '  return options.includes(initial) ? initial : (options[0] ?? initial);', '}'),
        typeTests: [
          { name: 'a real option', code: 'const mode = pick(["light", "dark"], "dark");\ntype T1 = Expect<Equal<typeof mode, "light" | "dark">>;' },
          { name: 'a wrong option is an error', code: 'pick(["light", "dark"], "blue");', expect: 'error' },
        ],
        tests: [{ name: 'picks', call: 'pick(["light", "dark"], "dark")', expect: 'dark' }],
        explain: L('`T` is now inferred from `options` only, and `initial` is checked against it, so "blue" is caught.', 'Now TypeScript guesses only from the list, and checks the starting choice.', 'Inference candidates come solely from `options`; `initial` is checked post-inference.'),
      },
      {
        id: 'routes',
        kind: 'types',
        prompt: L('Make `defineRoutes` keep the exact route names, so `go` only accepts those.', 'Make `defineRoutes` remember the exact route names.'),
        hint: L('Use a `const` type parameter: `function defineRoutes<const T extends readonly string[]>(routes: T): T`.', 'Write `<const T extends readonly string[]>`.'),
        starter: c('function defineRoutes<T extends readonly string[]>(routes: T): T {', '  return routes;', '}', '', 'const routes = defineRoutes(["home", "about"]);', 'type Route = (typeof routes)[number];'),
        solution: c('function defineRoutes<const T extends readonly string[]>(routes: T): T {', '  return routes;', '}', '', 'const routes = defineRoutes(["home", "about"]);', 'type Route = (typeof routes)[number];'),
        typeTests: [
          { name: 'exact names', code: 'type T1 = Expect<Equal<Route, "home" | "about">>;' },
          { name: 'unknown routes refused', code: 'const nope: Route = "contact";', expect: 'error' },
        ],
        explain: L('The caller writes a plain array; `const T` makes TypeScript infer `readonly ["home", "about"]`.', 'Now the exact names are remembered, without `as const` at every call.', '`const` type parameters apply const-context inference; the `readonly` constraint is needed to admit readonly tuples.'),
      },
      {
        id: 'recap',
        kind: 'recap',
        prompt: L('The short version.', 'What you learned.'),
        points: LL(
          ['Type parameters are inferred from every place they appear.', '`NoInfer<T>` checks a parameter without inferring from it.', '`const T` keeps exact literals.'],
          ['TypeScript guesses from every input.', '`NoInfer` says "just check this one".', '`const` keeps exact words.'],
          ['Control inference sites deliberately.', '`NoInfer` for defaults and fallbacks.', '`const T` plus readonly constraints.'],
        ),
      },
    ],
    recap: LL(
      ['Choose which arguments drive inference.', 'Catch mistakes that would widen types.', 'Keep literals exact when they matter.'],
      ['Guide TypeScript’s guesses.', 'Catch wrong choices.', 'Remember exact words.'],
      ['Inference design is API design.', 'Intrinsics: `NoInfer`.', 'Const type parameters.'],
    ),
  },

  {
    id: 'm17-l05-return-strategies',
    moduleId: 'm17',
    order: 5,
    title: {
      story: 'Three ways to say what comes out',
      explorer: 'Generic, overload or conditional return types',
      pro: 'Choosing between generics, overloads and conditional return types',
    },
    estMinutes: 8,
    difficulty: 3,
    concepts: ['conditional-type', 'overload', 'generic'],
    objectives: LL(
      ['Make a return type depend on an argument with a conditional type.', 'Compare it with overloads and plain generics.', 'Pick the simplest that works.'],
      ['Make what comes out depend on what goes in.', 'Compare three ways of doing it.', 'Pick the easiest.'],
    ),
    steps: [
      {
        id: 'read',
        kind: 'read',
        prompt: L('Three tools for "the output depends on the input".', 'Three ways to say what comes out.'),
        body: L(
          md(
            '```ts\n// 1. Generic: the same type comes back\nfunction first<T>(items: T[]): T | undefined { return items[0]; }\n\n// 2. Overloads: a fixed list of cases\nfunction parse(kind: "number", text: string): number;\nfunction parse(kind: "boolean", text: string): boolean;\n\n// 3. Conditional return type: a rule over a type parameter\nfunction parseAs<K extends "number" | "boolean">(kind: K, text: string): K extends "number" ? number : boolean {\n  return (kind === "number" ? Number(text) : text === "true") as K extends "number" ? number : boolean;\n}\n```',
            'A conditional return type needs a cast inside: TypeScript cannot check the body against a type that depends on an unresolved `K`.',
          ),
          md(
            'Sometimes what comes out of a machine depends on what you put in. There are three ways to tell TypeScript.',
            'The simplest: "the same kind comes back". Then: a list of cases. Then: a rule, like the sorting hat.',
          ),
          md(
            'Prefer, in order: a generic passthrough (fully checked), overloads (checked per call, body unchecked per overload), conditional return types (expressive and composable, but the implementation needs assertions because TypeScript does not narrow type parameters from control flow, although TS 5.8 narrows some return expressions).',
            'Conditional return types compose better when callers themselves are generic; overloads give nicer errors and hovers for a small, fixed set of cases.',
          ),
        ),
      },
      {
        id: 'parse',
        kind: 'types',
        prompt: L('Give `parseAs` a conditional return type: `number` for `"number"`, `boolean` for `"boolean"`.', 'Make `parseAs` say: "number" gives a number, "boolean" gives a yes/no.'),
        hint: L('Return type `K extends "number" ? number : boolean`, and cast the body’s result to it.', 'Use the sorting hat as the return type, and `as` the same type on the result.'),
        starter: c(
          'function parseAs<K extends "number" | "boolean">(kind: K, text: string): number | boolean {',
          '  return kind === "number" ? Number(text) : text === "true";',
          '}',
        ),
        solution: c(
          'type Parsed<K> = K extends "number" ? number : boolean;',
          '',
          'function parseAs<K extends "number" | "boolean">(kind: K, text: string): Parsed<K> {',
          '  return (kind === "number" ? Number(text) : text === "true") as Parsed<K>;',
          '}',
        ),
        typeTests: [
          { name: 'a number', code: 'const n = parseAs("number", "5");\ntype T1 = Expect<Equal<typeof n, number>>;' },
          { name: 'a boolean', code: 'const b = parseAs("boolean", "true");\ntype T2 = Expect<Equal<typeof b, boolean>>;' },
          { name: 'other kinds refused', code: 'parseAs("date", "2030-01-01");', expect: 'error' },
        ],
        tests: [
          { name: 'parses a number', call: 'parseAs("number", "5")', expect: '5' },
          { name: 'parses a boolean', call: 'parseAs("boolean", "true")', expect: 'true' },
        ],
        explain: L('Callers get the precise type; the single `as` inside is the price of a return type TypeScript cannot verify on its own.', 'Now each way of using it gives the right kind back.', 'The assertion is unavoidable for conditional return types over unresolved `K`; keep it in one place.'),
      },
      {
        id: 'choose',
        kind: 'check',
        prompt: L('`identity(value)` returns exactly what it gets. Which tool?', 'A machine gives back exactly what it gets. Which way is best?'),
        hint: L('Which one needs no cast and no list of cases?', 'Which is the simplest?'),
        explain: L('A plain generic: `function identity<T>(value: T): T`. Fully checked, nothing to maintain.', 'The simple "same kind comes back" generic.', 'Generic passthrough expresses the relation exactly with no unchecked code.'),
        choices: [
          { id: 'generic', text: L('A generic: `<T>(value: T): T`'), correct: true },
          { id: 'conditional', text: L('A conditional return type'), correct: false, feedback: L('Possible, but it adds a cast for nothing.', 'Too complicated for this.') },
          { id: 'overloads', text: L('One overload per possible type'), correct: false, feedback: L('There are infinitely many types; a generic covers them all.', 'There would be too many!') },
        ],
      },
      {
        id: 'recap',
        kind: 'recap',
        prompt: L('The short version.', 'What you learned.'),
        points: LL(
          ['Generic passthrough: simplest and fully checked.', 'Overloads: a short fixed list of cases.', 'Conditional return types: a rule, with a cast inside.'],
          ['Same kind back: use a generic.', 'A few fixed cases: overloads.', 'A rule: the sorting hat.'],
          ['Prefer generics, then overloads, then conditionals.', 'Confine assertions to one line.', 'Composability versus error messages.'],
        ),
      },
    ],
    recap: LL(
      ['Start with the simplest typing that works.', 'Escalate only when needed.', 'Keep unchecked casts contained.'],
      ['Pick the easiest way.', 'Use rules only when needed.', 'Keep `as` in one place.'],
      ['API typing strategies have trade-offs.', 'Know what the checker verifies.', 'Contain assertions.'],
    ),
  },

  {
    id: 'm17-l06-event-emitter',
    moduleId: 'm17',
    order: 6,
    title: {
      story: 'A message board with rules',
      explorer: 'A type-safe event emitter',
      pro: 'A type-safe event emitter from an event map',
    },
    estMinutes: 10,
    difficulty: 3,
    concepts: ['generic', 'keyof', 'indexed-access', 'mapped-type', 'tuple'],
    objectives: LL(
      ['Describe events and their data with an event map type.', 'Type `on` and `emit` with `K extends keyof Events`.', 'Make wrong event names and wrong data compile errors.'],
      ['Write down every message and what it carries.', 'Make sure listeners get the right data.', 'Catch wrong message names.'],
    ),
    steps: [
      {
        id: 'read',
        kind: 'read',
        prompt: L('An event map ties names to data.', 'A message board where every message has rules.'),
        body: L(
          md(
            'Untyped emitters (`on(name: string, fn: (...args: any[]) => void)`) accept typos and wrong data. An **event map** type fixes that:',
            '```ts\ntype AppEvents = {\n  login: [user: string];\n  logout: [];\n  progress: [done: number, total: number];\n};\n\nclass Emitter<Events extends Record<string, unknown[]>> {\n  on<K extends keyof Events>(name: K, listener: (...args: Events[K]) => void): void { /* … */ }\n  emit<K extends keyof Events>(name: K, ...args: Events[K]): void { /* … */ }\n}\n\nconst events = new Emitter<AppEvents>();\nevents.on("progress", (done, total) => console.log(done / total)); // both numbers\nevents.emit("login", "ada");\nevents.emit("login", 42);   // error\nevents.emit("logni", "ada"); // error\n```',
          ),
          md(
            'Imagine a message board. Each kind of message has a name ("login") and carries some data (who logged in).',
            'The rules list every message name and its data. Then TypeScript stops anyone sending a message with a wrong name or the wrong data.',
          ),
          md(
            'The map’s values are tuples, so `...args: Events[K]` types rest parameters with labels and arity. `K extends keyof Events` correlates the name with its payload per call. Internally, a mapped type `{ [K in keyof Events]?: Listener<K>[] }` keeps storage typed without `any`.',
            'This is the pattern behind typed DOM event maps (`HTMLElementEventMap`), Node’s typed `EventEmitter`, and most state libraries’ subscribe APIs.',
          ),
        ),
      },
      {
        id: 'emitter',
        kind: 'types',
        prompt: L(
          'Type `Emitter` with an event map: `on` and `emit` only accept real event names, with exactly that event’s data.',
          'Give the message board rules: only real message names, and only the right data for each.',
        ),
        hint: L(
          'Make the class generic: `class Emitter<Events extends Record<string, unknown[]>>`, then `on<K extends keyof Events>(name: K, listener: (...args: Events[K]) => void)` and `emit<K extends keyof Events>(name: K, ...args: Events[K])`.',
          'Add `<Events extends Record<string, unknown[]>>` to the class. Then `on` and `emit` use `K extends keyof Events` and `Events[K]` for the data.',
        ),
        strongHint: L(
          'Store listeners as `{ [K in keyof Events]?: ((...args: Events[K]) => void)[] }`, and push with `(this.#listeners[name] ??= []).push(listener)`.',
          'Keep the listeners in an object with one list per message name.',
        ),
        starter: c(
          'class Emitter {',
          '  #listeners: Record<string, ((...args: unknown[]) => void)[]> = {};',
          '  on(name: string, listener: (...args: unknown[]) => void): void {',
          '    (this.#listeners[name] ??= []).push(listener);',
          '  }',
          '  emit(name: string, ...args: unknown[]): void {',
          '    for (const listener of this.#listeners[name] ?? []) listener(...args);',
          '  }',
          '}',
        ),
        solution: c(
          'class Emitter<Events extends Record<string, unknown[]>> {',
          '  #listeners: { [K in keyof Events]?: ((...args: Events[K]) => void)[] } = {};',
          '',
          '  on<K extends keyof Events>(name: K, listener: (...args: Events[K]) => void): void {',
          '    (this.#listeners[name] ??= []).push(listener);',
          '  }',
          '',
          '  emit<K extends keyof Events>(name: K, ...args: Events[K]): void {',
          '    for (const listener of this.#listeners[name] ?? []) listener(...args);',
          '  }',
          '}',
        ),
        typeTests: [
          {
            name: 'listeners get typed data',
            code: 'type AppEvents = { login: [user: string]; progress: [done: number, total: number] };\nconst events = new Emitter<AppEvents>();\nevents.on("progress", (done, total) => {\n  type T1 = Expect<Equal<typeof done, number>>;\n  type T2 = Expect<Equal<typeof total, number>>;\n});',
          },
          { name: 'wrong data is refused', code: 'new Emitter<{ login: [user: string] }>().emit("login", 42);', expect: 'error' },
          { name: 'unknown events are refused', code: 'new Emitter<{ login: [user: string] }>().on("logni", () => {});', expect: 'error' },
          { name: 'the right call compiles', code: 'new Emitter<{ login: [user: string] }>().emit("login", "ada");' },
        ],
        tests: [
          {
            name: 'delivers to every listener, in order',
            call: '(() => { const events = new Emitter(); const seen = []; events.on("ping", (n) => seen.push("a" + n)); events.on("ping", (n) => seen.push("b" + n)); events.emit("ping", 1); events.emit("ping", 2); return seen; })()',
            expect: '["a1","b1","a2","b2"]',
          },
          { name: 'no listeners is fine', call: '(() => { new Emitter().emit("nothing"); return "ok"; })()', expect: 'ok' },
        ],
        explain: L(
          'The runtime code barely changed; the types now tie each event name to its data, so typos and wrong payloads fail to compile.',
          'The board works the same, but now TypeScript enforces the rules.',
          'Correlating `K` across parameters via `Events[K]`; the mapped storage type keeps the implementation free of `any`.',
        ),
      },
      {
        id: 'tuples',
        kind: 'check',
        prompt: L('Why are the event payloads written as tuples, like `[done: number, total: number]`?', 'Why is each message’s data written as a list like `[done: number, total: number]`?'),
        hint: L('Look at how `emit` and the listener receive the data.', 'Look at how the data is handed to the listener.'),
        explain: L(
          'A tuple types a rest parameter: `...args: Events[K]` becomes exactly two numbers, with names, so listeners can take `(done, total)`.',
          'The list says exactly how many pieces of data there are, and what kind each one is.',
          'Tuple types give rest parameters a precise arity, per-position types and labels (shown in editor hints).',
        ),
        choices: [
          { id: 'rest', text: L('They type `...args`: how many values, and the type of each'), correct: true },
          { id: 'faster', text: L('Tuples are faster than objects at runtime'), correct: false, feedback: L('The payload is passed as separate arguments; the tuple exists only in the types.', 'It is only about types, not speed.') },
        ],
      },
      {
        id: 'recap',
        kind: 'recap',
        prompt: L('The short version.', 'What you learned.'),
        points: LL(
          ['An event map type lists event names and their data as tuples.', '`K extends keyof Events` ties each call’s name to its data.', 'Typos and wrong data become compile errors.'],
          ['The rules list every message and its data.', 'Listeners always get the right data.', 'Wrong names are caught.'],
          ['Tuple-valued maps type rest parameters.', 'Per-call correlation via generics.', 'Mapped storage avoids `any`.'],
        ),
      },
    ],
    recap: LL(
      ['Describe events once, in a map.', 'Let generics connect names and payloads.', 'The same pattern powers many libraries.'],
      ['Write the rules once.', 'TypeScript checks every message.', 'Real libraries work like this.'],
      ['Event maps are a core advanced pattern.', 'Tuples for payloads.', 'No `any`, even inside.'],
    ),
  },
];

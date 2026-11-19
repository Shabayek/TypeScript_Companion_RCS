import { L, LL, c, md } from '../authoring';
import type { Lesson } from '../schema';

export const M12_LESSONS: readonly Lesson[] = [
  {
    id: 'm12-l01-partial-required-readonly',
    moduleId: 'm12',
    order: 1,
    title: {
      story: 'Shape changers: maybe, must and locked',
      explorer: 'Partial, Required and Readonly',
      pro: 'Modifier utilities: Partial, Required, Readonly',
    },
    estMinutes: 7,
    difficulty: 2,
    concepts: ['utility-type', 'optional', 'readonly', 'spread'],
    objectives: LL(
      ['Make every property optional with `Partial<T>`, for updates.', 'Make every property required with `Required<T>`.', 'Lock an object type with `Readonly<T>`.'],
      ['Turn every label into a "maybe" label.', 'Turn every "maybe" into a "must".', 'Lock a shape so nothing can change.'],
    ),
    steps: [
      {
        id: 'read',
        kind: 'read',
        prompt: L('Utility types build new types from old ones.', 'Machines that change shapes.'),
        body: L(
          md(
            'TypeScript ships **utility types** that transform a type you already have:',
            '```ts\ntype User = { id: number; name: string; email: string };\n\ntype UserChanges = Partial<User>;   // every property optional\ntype FullUser = Required<UserChanges>; // every property required again\ntype FrozenUser = Readonly<User>;      // no property can be reassigned\n\nfunction update(user: User, changes: Partial<User>): User {\n  return { ...user, ...changes };\n}\n```',
            '`Partial` is perfect for "change some of these fields": the caller passes only what changes.',
          ),
          md(
            'TypeScript has machines that change shapes. You give them a shape, and they give you a new one.',
            '`Partial` makes every label a "maybe": you only fill in the ones you want to change. `Readonly` locks every label so nothing can be changed.',
          ),
          md(
            'These are homomorphic mapped types: `Partial<T> = { [K in keyof T]?: T[K] }`, `Required<T>` removes `?` with `-?`, and `Readonly<T>` adds `readonly`. They are shallow: nested objects keep their own modifiers (a `DeepPartial` needs recursion).',
            'For updates, `Partial<T>` pairs with spread; note that without `exactOptionalPropertyTypes`, `{ name: undefined }` is a valid partial and would overwrite a value with `undefined` when spread.',
          ),
        ),
      },
      {
        id: 'partial',
        kind: 'predictType',
        prompt: L('What is `Changes`? Write it out as an object type.', 'Write out the shape of `Changes`.'),
        hint: L('Every property of `Settings` stays, but each gets a `?`.', 'Same labels, but each one becomes a "maybe" with `?`.'),
        code: c('type Settings = { theme: string; fontSize: number };', 'type Changes = Partial<Settings>;'),
        target: 'Changes',
        answer: '{ theme?: string; fontSize?: number }',
        explain: L(
          '`Partial` keeps every property and makes it optional. TypeScript shows it as `{ theme?: string | undefined; fontSize?: number | undefined }`, which is the same type.',
          'Same labels, all "maybe" now.',
          'The mapped type adds the `?` modifier; under default settings `?: T` and `?: T | undefined` are identical, which is why both spellings are accepted.',
        ),
      },
      {
        id: 'update',
        kind: 'write',
        prompt: L('Write `updateUser`: the user with the given changes applied, as a new object.', 'Make `updateUser` give back a new user with the changes put in.'),
        starter: c(
          'type User = { id: number; name: string; email: string };',
          '',
          'function updateUser(user: User, changes: Partial<User>): User {',
          '  return user;',
          '}',
        ),
        solution: c(
          'type User = { id: number; name: string; email: string };',
          '',
          'function updateUser(user: User, changes: Partial<User>): User {',
          '  return { ...user, ...changes };',
          '}',
        ),
        tests: [
          {
            name: 'changes the name only',
            call: 'updateUser({ id: 1, name: "Ada", email: "ada@example.com" }, { name: "Ada L." })',
            expect: '{"id":1,"name":"Ada L.","email":"ada@example.com"}',
          },
          {
            name: 'no changes',
            call: 'updateUser({ id: 2, name: "Bo", email: "bo@example.com" }, {})',
            expect: '{"id":2,"name":"Bo","email":"bo@example.com"}',
          },
        ],
        hint: L('Spread the user first, then the changes: later properties win.', 'Copy the user with `...user`, then put the changes on top with `...changes`.'),
        explain: L(
          'Spread order matters: properties from `changes` come last, so they win. The original user is untouched.',
          'The changes go on top, so they win. The old user stays the same.',
          'Object spread is a shallow merge with right-biased precedence; the return type `User` still holds because `Partial<User>`’s defined properties have `User`’s types.',
        ),
      },
      {
        id: 'locked',
        kind: 'types',
        prompt: L('Make `freeze` return a `Readonly` version, so reassigning a property of the result is an error.', 'Make `freeze` give back a locked version: changing it must be an error.'),
        hint: L('Change the return type to `Readonly<Point>`; `Object.freeze` already returns that.', 'Say the machine gives back `Readonly<Point>`.'),
        starter: c(
          'type Point = { x: number; y: number };',
          '',
          'function freeze(point: Point): Point {',
          '  return Object.freeze({ ...point });',
          '}',
        ),
        solution: c(
          'type Point = { x: number; y: number };',
          '',
          'function freeze(point: Point): Readonly<Point> {',
          '  return Object.freeze({ ...point });',
          '}',
        ),
        typeTests: [
          { name: 'reading is fine', code: 'const origin = freeze({ x: 0, y: 0 });\nconst sum: number = origin.x + origin.y;' },
          { name: 'writing is an error', code: 'freeze({ x: 0, y: 0 }).x = 5;', expect: 'error' },
        ],
        tests: [{ name: 'keeps the values', call: 'freeze({ x: 1, y: 2 })', expect: '{"x":1,"y":2}' }],
        explain: L(
          'Now the type matches reality: the object is frozen at runtime, and TypeScript forbids writing to it.',
          'The object really is locked, and now TypeScript knows it too.',
          '`Object.freeze` returns `Readonly<T>`; annotating the wider mutable type discarded that information.',
        ),
      },
      {
        id: 'recap',
        kind: 'recap',
        prompt: L('The short version.', 'What you learned.'),
        points: LL(
          ['`Partial<T>` makes every property optional: great for updates.', '`Required<T>` makes them all required.', '`Readonly<T>` forbids reassigning properties.'],
          ['`Partial` turns labels into "maybe".', '`Required` turns them into "must".', '`Readonly` locks them.'],
          ['Modifier utilities are homomorphic mapped types.', 'They are shallow.', 'Mind `undefined` in partial updates.'],
        ),
      },
    ],
    recap: LL(
      ['Derive types instead of rewriting them.', '`Partial` for changes, `Readonly` for promises.', 'They only affect the top level.'],
      ['Shape machines save writing shapes twice.', 'Maybe, must, and locked.', 'They only change the top labels.'],
      ['Utility types compose.', 'Shallow by design.', 'Pair `Partial` updates with spread.'],
    ),
  },

  {
    id: 'm12-l02-pick-omit',
    moduleId: 'm12',
    order: 2,
    title: {
      story: 'Keep some labels, drop others',
      explorer: 'Pick and Omit',
      pro: 'Pick, Omit and deriving view types',
    },
    estMinutes: 6,
    difficulty: 2,
    concepts: ['utility-type', 'keyof', 'object'],
    objectives: LL(
      ['Keep some properties with `Pick<T, Keys>`.', 'Drop some with `Omit<T, Keys>`.', 'Derive view types (like a public profile) from one source type.'],
      ['Keep only the labels you want.', 'Throw away the labels you do not want.', 'Make a smaller shape from a big one.'],
    ),
    steps: [
      {
        id: 'read',
        kind: 'read',
        prompt: L('Smaller shapes from a bigger one.', 'Cut a big shape down to size.'),
        body: L(
          md(
            '`Pick` keeps the keys you list; `Omit` keeps all the others:',
            '```ts\ntype User = { id: number; name: string; email: string; password: string };\n\ntype Summary = Pick<User, "id" | "name">;   // { id: number; name: string }\ntype PublicUser = Omit<User, "password">;    // everything but password\n```',
            'Derived types stay in sync: add a field to `User` and `PublicUser` gets it automatically, while `password` can never leak into it.',
          ),
          md(
            '`Pick` is like choosing stickers to keep: "I want the id and the name".',
            '`Omit` is the opposite: "everything except the password".',
            'Add a new label to the big shape, and the smaller shapes update by themselves.',
          ),
          md(
            '`Pick<T, K extends keyof T>` requires real keys; `Omit<T, K extends keyof any>` does not, so a typo in `Omit` silently omits nothing. A stricter `StrictOmit<T, K extends keyof T> = Omit<T, K>` catches that.',
            '`Omit` over a union is not distributive (`Omit<A | B, "x">` keeps only common keys); use `T extends unknown ? Omit<T, K> : never` for a distributive version.',
          ),
        ),
      },
      {
        id: 'keys',
        kind: 'predictType',
        prompt: L('What are the keys of `PublicUser`?', 'Which labels does `PublicUser` have?'),
        hint: L('`Omit` keeps every key except `password`.', 'Everything except the password.'),
        code: c(
          'type User = { id: number; name: string; email: string; password: string };',
          'type PublicUser = Omit<User, "password">;',
          'type PublicKeys = keyof PublicUser;',
        ),
        target: 'PublicKeys',
        answer: '"id" | "name" | "email"',
        explain: L('`Omit` removed `password`, so three keys are left.', 'The password label is gone; three labels are left.', '`keyof Omit<T, K>` is `Exclude<keyof T, K>`.'),
      },
      {
        id: 'card',
        kind: 'types',
        prompt: L(
          'Define `Card` as the `name` and `avatar` of a `Profile`, and `PublicProfile` as everything but `phone`, both derived from `Profile`.',
          'Make `Card` (only name and avatar) and `PublicProfile` (everything but the phone), both cut from `Profile`.',
        ),
        hint: L('`type Card = Pick<Profile, "name" | "avatar">;` and `type PublicProfile = Omit<Profile, "phone">;`', 'Use `Pick` for the card and `Omit` for the public profile.'),
        starter: c(
          'type Profile = { id: number; name: string; avatar: string; phone: string };',
          '',
          'type Card = Profile;',
          'type PublicProfile = Profile;',
        ),
        solution: c(
          'type Profile = { id: number; name: string; avatar: string; phone: string };',
          '',
          'type Card = Pick<Profile, "name" | "avatar">;',
          'type PublicProfile = Omit<Profile, "phone">;',
        ),
        typeTests: [
          { name: 'a card is just name and avatar', code: 'type T1 = Expect<Equal<Card, { name: string; avatar: string }>>;' },
          { name: 'no phone in public', code: 'type T2 = Expect<Equal<keyof PublicProfile, "id" | "name" | "avatar">>;' },
          { name: 'a phone cannot sneak in', code: 'const leak: PublicProfile = { id: 1, name: "Ada", avatar: "a.png", phone: "555" };', expect: 'error' },
        ],
        explain: L(
          'Both are derived, so renaming or adding a field in `Profile` updates them, and the phone number cannot leak into the public view.',
          'Cut from the big shape, so they always stay in step with it.',
          'Excess property checks reject the `phone` literal against `PublicProfile`; deriving view types prevents drift between DTOs.',
        ),
      },
      {
        id: 'typo',
        kind: 'check',
        prompt: L('`Omit<User, "pasword">` (a typo). What happens?', 'What if you misspell the label in `Omit`?'),
        hint: L('Does `Omit` require its keys to exist on the type?', 'Does `Omit` check the spelling?'),
        explain: L(
          'Nothing warns you: `Omit` accepts any key, so it omits nothing and `password` stays. `Pick` would have caught it.',
          'No warning at all! The password stays. `Pick` would notice the mistake, `Omit` does not.',
          '`Omit`’s `K extends keyof any` allows unknown keys by design; define a strict variant or use `satisfies` on key lists when it matters.',
        ),
        choices: [
          { id: 'silent', text: L('It compiles, and `password` is still there'), correct: true },
          {
            id: 'error',
            text: L('TypeScript reports the unknown key'),
            correct: false,
            feedback: L('That is true for `Pick`, not for `Omit`.', '`Pick` would. `Omit` does not check.'),
          },
        ],
      },
      {
        id: 'recap',
        kind: 'recap',
        prompt: L('The short version.', 'What you learned.'),
        points: LL(
          ['`Pick<T, K>` keeps the listed keys.', '`Omit<T, K>` drops them.', 'Derived types stay in sync with their source.'],
          ['`Pick` keeps the labels you choose.', '`Omit` throws away the ones you name.', 'Small shapes follow the big one.'],
          ['`Pick` checks keys; `Omit` does not.', '`Omit` is not distributive over unions.', 'Derive DTOs from domain types.'],
        ),
      },
    ],
    recap: LL(
      ['One source type, many derived views.', '`Pick` to include, `Omit` to exclude.', 'Watch for typos in `Omit`.'],
      ['Make small shapes from big ones.', 'Keep or throw away labels.', 'Spell carefully with `Omit`.'],
      ['View types via `Pick`/`Omit`.', 'Key checking differs.', 'Distribute over unions explicitly.'],
    ),
  },

  {
    id: 'm12-l03-returntype-parameters',
    moduleId: 'm12',
    order: 3,
    title: {
      story: 'Reading a machine’s label',
      explorer: 'ReturnType, Parameters and Awaited',
      pro: 'Function utilities: ReturnType, Parameters, Awaited',
    },
    estMinutes: 7,
    difficulty: 3,
    concepts: ['utility-type', 'function-type', 'promise', 'async-await'],
    objectives: LL(
      ['Get a function’s return type with `ReturnType<typeof fn>`.', 'Get its parameters as a tuple with `Parameters`.', 'Unwrap a promise type with `Awaited`.'],
      ['Ask a machine what it gives back.', 'Ask what it needs.', 'Look inside a promise.'],
    ),
    steps: [
      {
        id: 'read',
        kind: 'read',
        prompt: L('Types can be read off functions.', 'Read the label on a machine.'),
        body: L(
          md(
            'Sometimes the function is the source of truth. Read types off it instead of writing them twice:',
            '```ts\nfunction createUser(name: string, age: number) {\n  return { id: Date.now(), name, age };\n}\n\ntype User = ReturnType<typeof createUser>;      // { id: number; name: string; age: number }\ntype CreateArgs = Parameters<typeof createUser>; // [name: string, age: number]\n\nasync function loadUser() { return createUser("Ada", 36); }\ntype Loaded = Awaited<ReturnType<typeof loadUser>>; // User, not Promise<User>\n```',
            '`typeof createUser` turns the value (the function) into its type first; the utilities then pick it apart.',
          ),
          md(
            'A machine has a label saying what goes in and what comes out. `ReturnType` reads the "comes out" part; `Parameters` reads the "goes in" part.',
            'An async machine gives back a promise. `Awaited` looks inside the promise, at what you finally get.',
          ),
          md(
            '`ReturnType<F>` and `Parameters<F>` are conditional types using `infer` (you will write them yourself in Module 16). For overloaded functions they use the *last* overload. `Awaited<T>` recursively unwraps thenables, mirroring `await`.',
            'Use them when a library does not export the types you need (`Parameters<typeof fetch>[1]`), or to keep wrappers in sync (`(...args: Parameters<typeof f>) => ReturnType<typeof f>`).',
          ),
        ),
      },
      {
        id: 'awaited',
        kind: 'predictType',
        prompt: L('What is `Loaded`?', 'What do you finally get from `loadScore`?'),
        hint: L('`ReturnType` of an async function is a `Promise<…>`; `Awaited` unwraps it.', 'The async machine gives a promise. `Awaited` looks inside.'),
        code: c('async function loadScore() {', '  return 42;', '}', 'type Loaded = Awaited<ReturnType<typeof loadScore>>;'),
        target: 'Loaded',
        answer: 'number',
        explain: L('`ReturnType` gives `Promise<number>`, and `Awaited` unwraps it to `number`.', 'The promise holds a number, so `Awaited` gives `number`.', 'Async functions return `Promise<T>`; `Awaited` mirrors `await`’s unwrapping at the type level.'),
      },
      {
        id: 'wrap',
        kind: 'types',
        prompt: L(
          'Type `logged` so it takes exactly the same arguments as `greet` and returns the same type, using `Parameters` and `ReturnType`.',
          'Make `logged` take the same inputs as `greet` and give back the same thing, by reading `greet`’s label.',
        ),
        hint: L(
          '`function logged(...args: Parameters<typeof greet>): ReturnType<typeof greet>`.',
          'Use `...args: Parameters<typeof greet>` for the inputs and `ReturnType<typeof greet>` for the output.',
        ),
        starter: c(
          'function greet(name: string, excited: boolean): string {',
          '  return excited ? `Hi, ${name}!` : `Hi, ${name}.`;',
          '}',
          '',
          'function logged(...args: unknown[]): unknown {',
          '  console.log("calling greet");',
          '  return greet(args[0] as string, args[1] as boolean);',
          '}',
        ),
        solution: c(
          'function greet(name: string, excited: boolean): string {',
          '  return excited ? `Hi, ${name}!` : `Hi, ${name}.`;',
          '}',
          '',
          'function logged(...args: Parameters<typeof greet>): ReturnType<typeof greet> {',
          '  console.log("calling greet");',
          '  return greet(...args);',
          '}',
        ),
        typeTests: [
          { name: 'same result type', code: 'const text = logged("Ada", true);\ntype T1 = Expect<Equal<typeof text, string>>;' },
          { name: 'same arguments', code: 'logged("Ada");', expect: 'error' },
          { name: 'argument types checked', code: 'logged(42, true);', expect: 'error' },
        ],
        tests: [{ name: 'still greets', call: 'logged("Ada", true)', expect: 'Hi, Ada!' }],
        explain: L(
          'Change `greet`’s parameters and `logged` follows automatically. No copy to forget.',
          'If `greet` changes, `logged` changes with it.',
          '`Parameters` yields a labelled tuple, so the rest parameter `...args` preserves names and arity; spreading it back into `greet` type-checks without casts.',
        ),
      },
      {
        id: 'recap',
        kind: 'recap',
        prompt: L('The short version.', 'What you learned.'),
        points: LL(
          ['`ReturnType<typeof fn>` is what `fn` returns.', '`Parameters<typeof fn>` is a tuple of its parameter types.', '`Awaited<T>` unwraps promises.'],
          ['`ReturnType` reads what comes out.', '`Parameters` reads what goes in.', '`Awaited` looks inside a promise.'],
          ['Function utilities are conditional types with `infer`.', 'Overloads: the last signature wins.', 'Great for wrappers and untyped library internals.'],
        ),
      },
    ],
    recap: LL(
      ['Let functions be the source of truth for their types.', 'Combine `Awaited` and `ReturnType` for async code.', 'Wrappers stay in sync.'],
      ['Read labels instead of copying them.', 'Promises can be looked inside.', 'Copies never go out of date.'],
      ['Derive types from values with `typeof`.', 'Unwrap promises with `Awaited`.', 'Keep higher-order wrappers precise.'],
    ),
  },

  {
    id: 'm12-l04-exclude-extract',
    moduleId: 'm12',
    order: 4,
    title: {
      story: 'Sieves for types',
      explorer: 'Exclude, Extract and NonNullable',
      pro: 'Filtering unions: Exclude, Extract, NonNullable',
    },
    estMinutes: 6,
    difficulty: 3,
    concepts: ['utility-type', 'union', 'conditional-type'],
    objectives: LL(
      ['Remove members from a union with `Exclude`.', 'Keep only matching members with `Extract`.', 'Remove `null` and `undefined` with `NonNullable`.'],
      ['Take things out of a "this or that".', 'Keep only the things that match.', 'Throw out the empty ones.'],
    ),
    steps: [
      {
        id: 'read',
        kind: 'read',
        prompt: L('Filter a union like a list.', 'A sieve for types.'),
        body: L(
          md(
            'These utilities filter the members of a union:',
            '```ts\ntype Status = "draft" | "published" | "archived";\ntype Live = Exclude<Status, "archived">;              // "draft" | "published"\n\ntype Event = { type: "click"; x: number } | { type: "key"; key: string };\ntype Click = Extract<Event, { type: "click" }>;      // the click member\n\ntype MaybeName = string | null | undefined;\ntype Name = NonNullable<MaybeName>;                   // string\n```',
          ),
          md(
            'A union is like a bag of choices. These tools are sieves:',
            '`Exclude` takes some choices out. `Extract` keeps only the ones that match. `NonNullable` throws away the empty ones (`null` and `undefined`).',
          ),
          md(
            'They are distributive conditional types: `Exclude<T, U> = T extends U ? never : T` is applied to each member of `T`, and `never` members vanish from the result. `Extract` is the complement; `NonNullable<T> = T & {}` (since TS 4.8).',
            '`Extract<Union, { type: "click" }>` is the idiomatic way to name one member of a discriminated union without repeating it.',
          ),
        ),
      },
      {
        id: 'exclude',
        kind: 'predictType',
        prompt: L('What is `Live`?', 'What is left in `Live`?'),
        hint: L('Start with all three and take out `"archived"`.', 'Take "archived" out of the bag.'),
        code: c('type Status = "draft" | "published" | "archived";', 'type Live = Exclude<Status, "archived">;'),
        target: 'Live',
        answer: '"draft" | "published"',
        explain: L('`Exclude` removes the members assignable to `"archived"`.', '"archived" is gone; the other two stay.', 'Each member is tested against `"archived"` and mapped to `never` or itself.'),
      },
      {
        id: 'pick-member',
        kind: 'types',
        prompt: L(
          'Name the members: `KeyEvent` is the `"key"` member of `AppEvent`, and `PointerEvents` is every member except it.',
          'Use sieves: `KeyEvent` keeps only the key event; `PointerEvents` keeps all the others.',
        ),
        hint: L('`Extract<AppEvent, { type: "key" }>` and `Exclude<AppEvent, { type: "key" }>`.', 'Keep with `Extract`, remove with `Exclude`, both with `{ type: "key" }`.'),
        starter: c(
          'type AppEvent =',
          '  | { type: "click"; x: number; y: number }',
          '  | { type: "key"; key: string }',
          '  | { type: "scroll"; delta: number };',
          '',
          'type KeyEvent = AppEvent;',
          'type PointerEvents = AppEvent;',
        ),
        solution: c(
          'type AppEvent =',
          '  | { type: "click"; x: number; y: number }',
          '  | { type: "key"; key: string }',
          '  | { type: "scroll"; delta: number };',
          '',
          'type KeyEvent = Extract<AppEvent, { type: "key" }>;',
          'type PointerEvents = Exclude<AppEvent, { type: "key" }>;',
        ),
        typeTests: [
          { name: 'the key member', code: 'type T1 = Expect<Equal<KeyEvent, { type: "key"; key: string }>>;' },
          { name: 'the other two', code: 'type T2 = Expect<Equal<PointerEvents["type"], "click" | "scroll">>;' },
        ],
        explain: L(
          'Both are derived from `AppEvent`, so adding an event type updates them automatically.',
          'The sieves work on the bag of events, so they stay up to date.',
          'Filtering by a partial shape works because each member is tested for assignability to `{ type: "key" }`.',
        ),
      },
      {
        id: 'nonnull',
        kind: 'predictType',
        prompt: L('What is `Name`?', 'What is left in `Name`?'),
        hint: L('`NonNullable` removes `null` and `undefined`.', 'Throw away the empty ones.'),
        code: c('type MaybeName = string | null | undefined;', 'type Name = NonNullable<MaybeName>;'),
        target: 'Name',
        answer: 'string',
        explain: L('Only `string` survives once `null` and `undefined` are removed.', 'Only the word kind is left.', '`NonNullable<T>` is `T & {}`, which drops `null` and `undefined` from a union.'),
      },
      {
        id: 'recap',
        kind: 'recap',
        prompt: L('The short version.', 'What you learned.'),
        points: LL(
          ['`Exclude<U, X>` removes members; `Extract<U, X>` keeps matching ones.', 'Both work with partial shapes like `{ type: "key" }`.', '`NonNullable` removes `null` and `undefined`.'],
          ['Sieves take things out or keep things in.', 'They can match by a label, like `type`.', '`NonNullable` throws out the empty ones.'],
          ['Distributive conditional types filter unions.', '`never` members disappear.', 'Name union members with `Extract`.'],
        ),
      },
    ],
    recap: LL(
      ['Filter unions instead of rewriting them.', 'Name one member of a tagged union with `Extract`.', 'Strip `null` with `NonNullable`.'],
      ['Use sieves on "this or that" types.', 'Keep your types in step.', 'Empty ones can be thrown out.'],
      ['Union filtering utilities.', 'Distributivity over naked type parameters.', 'Preparing for conditional types (M16).'],
    ),
  },

  {
    id: 'm12-l05-combining-utilities',
    moduleId: 'm12',
    order: 5,
    title: {
      story: 'Shape machines working together',
      explorer: 'Combining utility types',
      pro: 'Composing utilities into API types',
    },
    estMinutes: 7,
    difficulty: 3,
    concepts: ['utility-type', 'record-type', 'generic'],
    objectives: LL(
      ['Build the types of a create/update API from one model.', 'Nest utilities: `Partial<Omit<User, "id">>`.', 'Read a composed type from the inside out.'],
      ['Chain shape machines together.', 'Make the shapes for "new" and "change".', 'Read a long type from the inside out.'],
    ),
    steps: [
      {
        id: 'read',
        kind: 'read',
        prompt: L('Utilities compose.', 'Shape machines can be chained.'),
        body: L(
          md(
            'A typical API needs several shapes of the same thing. Derive them all from one model:',
            '```ts\ntype User = { id: number; name: string; email: string; createdAt: string };\n\ntype NewUser = Omit<User, "id" | "createdAt">;   // what a client sends to create\ntype UserUpdate = Partial<NewUser>;              // what a client sends to update\ntype UsersById = Readonly<Record<number, User>>; // a lookup table\n```',
            'Read nested utilities from the inside out: `Partial<Omit<User, "id">>` is "User without id, then everything optional".',
          ),
          md(
            'You can chain shape machines: first cut off some labels, then make the rest "maybe".',
            'Read them from the inside out, like opening boxes inside boxes.',
          ),
          md(
            'Composition keeps one model authoritative and every transport shape derived from it, so a renamed field breaks every affected call site at compile time. When a composed type gets unreadable in hovers, give it a name or flatten it with a helper such as `type Simplify<T> = { [K in keyof T]: T[K] } & {}`.',
            'Be deliberate about what the server owns (ids, timestamps) and model it with `Omit`, rather than making everything optional.',
          ),
        ),
      },
      {
        id: 'api',
        kind: 'types',
        prompt: L(
          'Define `NewTask` (a `Task` without `id` and `done`) and `TaskUpdate` (any of `NewTask`’s fields, all optional).',
          'Make `NewTask` (a task without `id` and `done`) and `TaskUpdate` (any of those fields, all "maybe").',
        ),
        hint: L('`type NewTask = Omit<Task, "id" | "done">;` and `type TaskUpdate = Partial<NewTask>;`', 'First cut off `id` and `done` with `Omit`; then make everything "maybe" with `Partial`.'),
        starter: c(
          'type Task = { id: number; title: string; due: string; done: boolean };',
          '',
          'type NewTask = Task;',
          'type TaskUpdate = Task;',
        ),
        solution: c(
          'type Task = { id: number; title: string; due: string; done: boolean };',
          '',
          'type NewTask = Omit<Task, "id" | "done">;',
          'type TaskUpdate = Partial<NewTask>;',
        ),
        typeTests: [
          { name: 'a new task has a title and a due date', code: 'const fresh: NewTask = { title: "Write tests", due: "2030-01-01" };' },
          { name: 'no id on a new task', code: 'const withId: NewTask = { id: 1, title: "x", due: "y" };', expect: 'error' },
          { name: 'an update can change just one field', code: 'const rename: TaskUpdate = { title: "Write more tests" };' },
          { name: 'an update cannot change the id', code: 'const hack: TaskUpdate = { id: 7 };', expect: 'error' },
        ],
        explain: L(
          'The server owns `id` and `done`; clients can neither send nor change them. Add a field to `Task` and both shapes follow.',
          'Only the right labels can be sent. If `Task` grows, the other shapes grow too.',
          'Excess property checks on the object literals enforce ownership of server-managed fields; the types remain derived from one model.',
        ),
      },
      {
        id: 'apply',
        kind: 'write',
        prompt: L('Write `applyUpdate`: the task with an update applied.', 'Make `applyUpdate` give back the task with the changes put in.'),
        starter: c(
          'type Task = { id: number; title: string; due: string; done: boolean };',
          'type TaskUpdate = Partial<Omit<Task, "id" | "done">>;',
          '',
          'function applyUpdate(task: Task, update: TaskUpdate): Task {',
          '  return task;',
          '}',
        ),
        solution: c(
          'type Task = { id: number; title: string; due: string; done: boolean };',
          'type TaskUpdate = Partial<Omit<Task, "id" | "done">>;',
          '',
          'function applyUpdate(task: Task, update: TaskUpdate): Task {',
          '  return { ...task, ...update };',
          '}',
        ),
        tests: [
          {
            name: 'renames',
            call: 'applyUpdate({ id: 1, title: "a", due: "mon", done: false }, { title: "b" })',
            expect: '{"id":1,"title":"b","due":"mon","done":false}',
          },
        ],
        hint: L('Spread the task, then the update.', 'Copy the task, then put the update on top.'),
        explain: L(
          'Because `TaskUpdate` cannot contain `id` or `done`, the spread can never change them.',
          'The update cannot touch `id` or `done`, so they stay safe.',
          'The type of `update` guarantees the spread cannot overwrite server-owned fields (modulo explicit `undefined` values without `exactOptionalPropertyTypes`).',
        ),
      },
      {
        id: 'read-type',
        kind: 'predictType',
        prompt: L('Read it inside out: what is `Draft`?', 'Open the boxes from the inside: what is `Draft`?'),
        hint: L('First `Pick` keeps `title` and `due`; then `Partial` makes them optional.', 'First keep `title` and `due`; then make them "maybe".'),
        code: c('type Task = { id: number; title: string; due: string; done: boolean };', 'type Draft = Partial<Pick<Task, "title" | "due">>;'),
        target: 'Draft',
        answer: '{ title?: string; due?: string }',
        explain: L('Inside out: pick two fields, then make both optional.', 'Two labels kept, both "maybe".', 'Homomorphic mapped types compose; the result is `{ title?: string; due?: string }`.'),
      },
      {
        id: 'recap',
        kind: 'recap',
        prompt: L('The short version.', 'What you learned.'),
        points: LL(
          ['Derive every API shape from one model.', 'Nest utilities and read them inside out.', 'Use `Omit` for fields the server owns.'],
          ['Chain shape machines together.', 'Read from the inside out.', 'Some labels belong to the server.'],
          ['One model, many derived transport types.', 'Name or simplify composed types for readability.', 'Model ownership explicitly.'],
        ),
      },
    ],
    recap: LL(
      ['One source of truth for each model.', 'Compose utilities for create, update and views.', 'Name composed types well.'],
      ['One big shape, many small ones.', 'Chain the shape machines.', 'Keep names clear.'],
      ['Type-level composition scales API design.', 'Derived types catch drift at compile time.', 'Simplify hovers with helper types.'],
    ),
  },
];

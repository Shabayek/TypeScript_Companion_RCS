import { L, LL, bullets, c, md } from '../authoring';
import type { Lesson } from '../schema';

export const M05_LESSONS: readonly Lesson[] = [
  {
    id: 'm05-l01-type-vs-interface',
    moduleId: 'm05',
    order: 1,
    title: {
      story: 'Naming a shape',
      explorer: 'type and interface',
      pro: 'type aliases versus interfaces',
    },
    estMinutes: 6,
    concepts: ['interface', 'type-alias', 'object', 'annotation'],
    steps: [
      {
        id: 'read',
        kind: 'read',
        prompt: L('Two ways to name the shape of an object.', 'Two ways to give a shape a name.'),
        body: L(
          md(
            '`interface` and `type` both name a shape:',
            '```ts\ninterface User {\n  readonly id: string;\n  name: string;\n  age?: number;\n}\n\ntype Status = "open" | "closed";\n```',
            'The practical rule: **`type` when you need a union**, `interface` for object shapes that other files will extend. Pick one per project and stay consistent — mixing them for no reason costs readers a decision every time.',
            'Once a shape has a name, you use it like any other type. That is the real win: `User` appears in five signatures, and it changes in one place.',
          ),
          md(
            'A shape can have a name. Instead of repeating "a thing with a name and an age", you call it `User`.',
            '`interface` and `type` both do this job. Use `type` when the thing can be one of several options, like `"open" | "closed"`.',
          ),
          md(
            '`interface` declarations are open: two declarations with the same name merge, which is how libraries add to global types. `type` aliases are closed and can name anything: unions, tuples, mapped and conditional types.',
            'For object shapes the two are largely interchangeable, and both are structural. `interface ... extends` reports conflicting members clearly, while an intersection (`A & B`) can quietly produce `never` properties. Choose a convention and let a lint rule enforce it (`@typescript-eslint/consistent-type-definitions`).',
            '`readonly` and `?` work the same way in both.',
          ),
        ),
        figure: { base: 'venn-union', pro: 'venn-intersection' },
      },
      {
        id: 'compare',
        kind: 'compare',
        prompt: L('Same shape, two keywords.', 'The same shape, two words.'),
        left: {
          title: 'interface',
          code: c(
            'interface User {',
            '  name: string;',
            '  age?: number;',
            '}',
          ),
          caption: L(
            'Good for object shapes that other code will extend.',
            'Good for shapes that other code will add to later.',
          ),
        },
        right: {
          title: 'type',
          code: c(
            'type User = {',
            '  name: string;',
            '  age?: number;',
            '};',
          ),
          caption: L(
            'Same shape, and it can also be a union when needed.',
            'The same shape — and it can also mean "this or that".',
          ),
        },
      },
      {
        id: 'spot',
        kind: 'check',
        prompt: L('Which one can describe a union?', 'Which one can say "this or that"?'),
        hint: L(
          'A union (`A | B`) is not an object shape. Which keyword can name things that are not objects?',
          'One of them only describes bags with labels. The other can name anything.',
        ),
        explain: L(
          'Only `type` can name a union, because a union is not an object shape.',
          'Only `type` can say "this or that", because "this or that" is not the shape of a bag.',
          'A union is not an object type, so only a `type` alias can name it. Interfaces describe object (and function or constructor) shapes only.',
        ),
        choices: [
          { id: 'iface', text: L('`interface`'), correct: false, feedback: L(
            'Interfaces describe object shapes. They cannot be a union.',
            '`interface` describes the shape of a bag. It cannot say "this or that".',
          ) },
          { id: 'alias', text: L('`type`'), correct: true },
        ],
      },
      {
        id: 'fill',
        kind: 'fill',
        prompt: L('Name this union.', 'Give this "this or that" a name.'),
        hint: L(
          'The right side is a union, not an object in braces. Which keyword allows that?',
          'It is "this or that", not a bag shape. Which word can name it?',
        ),
        template: c('___ Status = "open" | "closed";'),
        bank: ['type', 'interface', 'class', 'const'],
        answers: ['type'],
        explain: L(
          'A union needs `type`. `interface` expects an object body in braces.',
          '"Open or closed" needs `type`. `interface` wants a bag shape in `{ }`.',
          '`type` introduces an alias for any type expression. `Status` is a union of string literal types, so `"open"` and `"closed"` are the only values it accepts.',
        ),
      },
      {
        id: 'write',
        kind: 'write',
        prompt: L(
          'Write `labelFor` so it returns the name, plus the age in brackets when there is one.',
          'Make `labelFor` give back the name, and the age in brackets if there is one.',
        ),
        starter: c(
          'interface Person {',
          '  name: string;',
          '  age?: number;',
          '}',
          '',
          'function labelFor(person: Person): string {',
          '  // age may be missing',
          '  return person.name;',
          '}',
        ),
        solution: c(
          'interface Person {',
          '  name: string;',
          '  age?: number;',
          '}',
          '',
          'function labelFor(person: Person): string {',
          '  return person.age === undefined ? person.name : `${person.name} (${person.age})`;',
          '}',
        ),
        tests: [
          { name: 'with age', call: 'labelFor({ name: "Ada", age: 36 })', expect: 'Ada (36)' },
          { name: 'without age', call: 'labelFor({ name: "Sam" })', expect: 'Sam' },
          { name: 'age zero is real', call: 'labelFor({ name: "Bo", age: 0 })', expect: 'Bo (0)' },
        ],
        hint: L(
          'Check `person.age === undefined` rather than `if (person.age)`, because 0 is a real age.',
          'Check `person.age === undefined`, not just `if (person.age)`, because 0 is a real age.',
        ),
        explain: L(
          'Comparing with `undefined` keeps `0` working. A truthiness check would silently drop it — a classic bug.',
          'Checking for `undefined` keeps an age of 0 working. `if (person.age)` would treat 0 as "no age" — a sneaky mistake.',
          '`age === undefined` narrows precisely, where a truthiness check would treat `0` as missing. With `exactOptionalPropertyTypes`, TypeScript even tells an absent `age` apart from `age: undefined`.',
        ),
      },
      {
        id: 'fix-shape',
        kind: 'fix',
        prompt: L(
          '`rex` does not match the `Pet` shape. Rex is 3 years old: fix the object so TypeScript and the check are both happy.',
          'Rex is missing something the Pet label asks for. Rex is 3. Add it!',
        ),
        starter: c(
          'interface Pet {',
          '  name: string;',
          '  age: number;',
          '}',
          '',
          'const rex: Pet = { name: "Rex" };',
          '',
          'function describePet(pet: Pet): string {',
          '  return `${pet.name} is ${pet.age}`;',
          '}',
        ),
        solution: c(
          'interface Pet {',
          '  name: string;',
          '  age: number;',
          '}',
          '',
          'const rex: Pet = { name: "Rex", age: 3 };',
          '',
          'function describePet(pet: Pet): string {',
          '  return `${pet.name} is ${pet.age}`;',
          '}',
        ),
        tests: [{ name: 'describes Rex', call: 'describePet(rex)', expect: 'Rex is 3' }],
        hint: L(
          'Read the interface: which property does `rex` not have yet?',
          'The Pet label lists a name and an age. Rex only has a name.',
        ),
        strongHint: L('Add `age: 3` inside the object.', 'Write `age: 3` next to the name.'),
        explain: L(
          'An interface is a promise about a shape. TypeScript checked the promise, found the missing `age`, and said so before `describePet` could print "Rex is undefined".',
          'The label said every pet has an age. The checker looked, found none, and told you before anything went wrong.',
          'TS2741 (`Property \'age\' is missing`) is structural typing at work: the literal lacks a required member of `Pet`, and the mismatch is reported at the assignment rather than wherever `age` is first read.',
        ),
      },
      {
        id: 'recap',
        kind: 'recap',
        prompt: L('The short version.', 'What you learned.'),
        points: LL(
          [
          '`interface` and `type` both name shapes.',
          '`type` is required for unions.',
          'Name a shape once; use the name everywhere.',
        ],
          [
            '`interface` and `type` both give a shape a name.',
            'Only `type` can say "this or that".',
            'Name a shape once, then use the name everywhere.',
          ],
          [
            'Interfaces merge and extend; type aliases can name any type.',
            'Both are structural for object shapes.',
            'Pick one convention and enforce it with a lint rule.',
          ],
        ),
      },
      {
        id: 'extends',
        kind: 'types',
        bonus: true,
        prompt: L(
          'Go further: make `Employee` extend `Person`, adding a `team: string`.',
          'A challenge: make the `Employee` shape grow out of the `Person` shape, with a `team` added.',
        ),
        hint: L('`interface Employee extends Person { team: string }`.', 'Write `interface Employee extends Person` and add `team: string` inside.'),
        starter: c('interface Person {', '  name: string;', '}', '', 'interface Employee {', '  name: string;', '}'),
        solution: c('interface Person {', '  name: string;', '}', '', 'interface Employee extends Person {', '  team: string;', '}'),
        typeTests: [
          { name: 'has a team', code: 'const ada: Employee = { name: "Ada", team: "Engines" };' },
          { name: 'an employee is a person', code: 'const person: Person = ada;' },
          { name: 'team is required', code: 'const bo: Employee = { name: "Bo" };', expect: 'error' },
        ],
        explain: L(
          '`extends` copies every member of `Person` into `Employee`. An `Employee` can be used anywhere a `Person` is expected.',
          'An Employee has everything a Person has, plus a team. So every Employee is also a Person.',
          'Interface extension creates a subtype; conflicting members are reported at the declaration, which is the main ergonomic advantage over intersections.',
        ),
      },
    ],
    recap: LL(
      [
      'Name shapes, do not repeat them.',
      '`type` for unions, `interface` for extensible objects.',
      'Consistency beats cleverness.',
    ],
      [
        'Give shapes a name instead of writing them again and again.',
        '`type` for "this or that", `interface` for bag shapes.',
        'Pick one way and stick to it.',
      ],
      [
        '`type` for unions, tuples and computed types.',
        '`interface` where declaration merging or `extends` helps.',
        'Name a shared shape once and reference it everywhere.',
      ],
    ),
  },

  {
    id: 'm05-l02-unions-narrowing',
    moduleId: 'm05',
    order: 2,
    title: {
      story: 'This or that',
      explorer: 'Unions, literal types and narrowing',
      pro: 'Union types and control-flow narrowing',
    },
    estMinutes: 7,
    concepts: ['union', 'literal-type', 'narrowing', 'type'],
    steps: [
      {
        id: 'read',
        kind: 'read',
        prompt: L('A union says "one of these".', '"This or that": a box that can hold one kind or another.'),
        body: L(
          md(
            'A **union** allows more than one type: `string | number`. A **literal type** narrows to exact values: `"small" | "medium" | "large"`.',
            'Inside a union you may only use what all members share. To use something specific, **narrow** first:',
            '```ts\nfunction format(value: string | number) {\n  if (typeof value === "string") return value.toUpperCase();\n  return value.toFixed(2);\n}\n```',
            'This is not ceremony. At runtime the value really might be either one, and the check is what makes the code correct.',
          ),
          md(
            'A union means "it could be this, or that". Like a box that holds a pencil or a pen.',
            'You have to look inside before you use it. That look is called **narrowing**.',
            'A literal type is a short list of allowed words: `"small" | "medium"`. Nothing else fits.',
          ),
          md(
            'A union `A | B` admits a value of either type, and until you narrow, only the members every constituent shares are available. TypeScript narrows along control flow: `typeof`, `instanceof`, `in`, equality with literals, truthiness, and user-defined type predicates.',
            'Discriminated unions, object types that share a literal `kind` field, are the idiomatic way to model variants:',
            '```ts\ntype Shape =\n  | { kind: "circle"; r: number }\n  | { kind: "square"; side: number };\n```',
            'A `switch` on `shape.kind` narrows each branch to one member. Prefer narrowing to `as` assertions, which the compiler does not verify.',
          ),
        ),
        figure: 'narrow',
      },
      {
        id: 'predict',
        kind: 'predict',
        prompt: L('What prints?', 'What will it show?'),
        hint: L(
          '`typeof value === "string"` is true for "hello" and false for 4. Follow each call into its branch.',
          'For "hello", the box holds a word. For 4, it holds a number. Which path does each take?',
        ),
        code: c(
          'function describe(value: string | number): string {',
          '  if (typeof value === "string") {',
          '    return "text:" + value.length;',
          '  }',
          '  return "number:" + (value + 1);',
          '}',
          '',
          'console.log(describe("hello"));',
          'console.log(describe(4));',
        ),
        answer: c('text:5', 'number:5'),
        explain: L(
          'The `typeof` check splits the function in two. Text takes the first branch; a number takes the second and becomes 5.',
          'The `typeof` check looks inside the box. Words take the first path; a number takes the second and becomes 5.',
          '`typeof value === "string"` narrows `value` to `string` inside the first branch; after that branch returns, control-flow analysis narrows it to `number` for the rest of the function.',
        ),
      },
      {
        id: 'spot',
        kind: 'check',
        prompt: L(
          'Which function is safe for `string | number`?',
          'Which machine is safe for a word *or* a number?',
        ),
        hint: L(
          'Which version checks the type before calling a string-only method?',
          'Numbers cannot be made into capital letters. Which machine checks first?',
        ),
        explain: L(
          'Only the version that checks with `typeof` can call `.toUpperCase()` safely. The other would crash when given a number.',
          'Only the one that looks first with `typeof` can safely use `.toUpperCase()`. The other would break when given a number.',
          'Calling `.toUpperCase()` on `string | number` is TS2339 (`Property \'toUpperCase\' does not exist on type \'string | number\'`), because `number` has no such method. Only the narrowed version type-checks.',
        ),
        choices: [
          {
            id: 'unsafe',
            text: L('`function f(v: string | number) { return v.toUpperCase(); }`'),
            correct: false,
            feedback: L(
              'Numbers do not have `toUpperCase`. This compiles only if you cast, and crashes at runtime.',
              'Numbers cannot do `toUpperCase`. This one would break when it gets a number.',
            ),
          },
          {
            id: 'safe',
            text: L('`function f(v: string | number) { return typeof v === "string" ? v.toUpperCase() : String(v); }`'),
            correct: true,
          },
        ],
      },
      {
        id: 'narrowed',
        kind: 'predictType',
        prompt: L(
          'The `boolean` case has already returned. What type does TypeScript give `rest`?',
          'The yes-or-no case has already left the machine. What could `rest` still be?',
        ),
        hint: L(
          'Start from `string | number | boolean` and remove what the `if` has already dealt with.',
          'The box could hold a word, a number or a yes/no. Which one has already gone?',
        ),
        strongHint: L(
          'Two types are left, joined with `|`.',
          'Two kinds are left. Join them with `|`.',
        ),
        code: c(
          'function describe(value: string | number | boolean): string {',
          '  if (typeof value === "boolean") {',
          '    return value ? "yes" : "no";',
          '  }',
          '  const rest = value;',
          '  return String(rest);',
          '}',
        ),
        target: 'rest',
        answer: 'string | number',
        explain: L(
          'After the `boolean` branch returns, TypeScript knows `value` can only be a `string` or a `number`. Narrowing removes the cases you have already handled.',
          'The yes/no case left early, so only a word or a number can still be in the box. TypeScript keeps track of that for you.',
          'Control-flow analysis: the early `return` removes `boolean` from the union for the rest of the function, so `rest` is `string | number`. The order inside a union does not matter.',
        ),
      },
      {
        id: 'write',
        kind: 'write',
        prompt: L(
          'Write `formatId` so a string or a number both come back with a leading `#`.',
          'Make `formatId` give back a `#` in front, for a word or a number.',
        ),
        starter: c(
          'function formatId(id: string | number): string {',
          '  // a template literal handles both',
          '  return "";',
          '}',
        ),
        solution: c(
          'function formatId(id: string | number): string {',
          '  return `#${id}`;',
          '}',
        ),
        tests: [
          { name: 'number', call: 'formatId(7)', expect: '#7' },
          { name: 'string', call: 'formatId("A1")', expect: '#A1' },
        ],
        hint: L(
          'Template literals convert both types into text, so no branching is needed here.',
          'Backticks turn words and numbers into text, so you do not need to check which one it is.',
        ),
        explain: L(
          'Where every member of the union supports the same operation, you do not need to narrow. `String()` and template literals accept both.',
          'When both kinds can do the same thing, you do not need to look inside first. Backticks work for words and numbers.',
          'A template literal accepts any type, so both constituents work without narrowing. Narrow only when you need a member that not every constituent has.',
        ),
      },
      {
        id: 'recap',
        kind: 'recap',
        prompt: L('The short version.', 'What you learned.'),
        points: LL(
          [
          'A union allows several types; a literal type allows exact values.',
          'Narrow with `typeof`, `in`, or an equality check before using type-specific methods.',
          'Prefer narrowing to casting.',
        ],
          [
            'A "this or that" type allows several kinds; `"small" | "medium"` allows only those exact words.',
            'Look inside with `typeof` before using something only one kind can do.',
            'Looking first is better than pretending.',
          ],
          [
            'Only shared members are available on a union.',
            'Narrow with `typeof`, `in`, `instanceof`, literal equality or a type predicate.',
            'Model variants as discriminated unions; avoid `as`.',
          ],
        ),
      },
      {
        id: 'area',
        kind: 'write',
        bonus: true,
        prompt: L(
          'Go further: write `area` for a discriminated union of shapes, using `shape.kind`.',
          'A challenge: make `area` work for circles and squares, by checking `shape.kind`.',
        ),
        starter: c(
          'type Shape =',
          '  | { kind: "circle"; radius: number }',
          '  | { kind: "square"; side: number };',
          '',
          'function area(shape: Shape): number {',
          '  return 0;',
          '}',
        ),
        solution: c(
          'type Shape =',
          '  | { kind: "circle"; radius: number }',
          '  | { kind: "square"; side: number };',
          '',
          'function area(shape: Shape): number {',
          '  switch (shape.kind) {',
          '    case "circle":',
          '      return Math.round(Math.PI * shape.radius ** 2);',
          '    case "square":',
          '      return shape.side * shape.side;',
          '  }',
          '}',
        ),
        tests: [
          { name: 'square', call: 'area({ kind: "square", side: 3 })', expect: '9' },
          { name: 'circle, rounded', call: 'area({ kind: "circle", radius: 2 })', expect: '13' },
        ],
        hint: L('`switch (shape.kind)`: inside `case "circle"`, TypeScript knows `shape.radius` exists.', 'Check `shape.kind`. Inside the circle case, TypeScript lets you use `shape.radius`.'),
        explain: L(
          'Checking the shared `kind` field narrows `shape` to one member of the union, so its own properties become available.',
          'Looking at `kind` tells TypeScript which shape it is, so it knows which numbers the shape has.',
          'A discriminated (tagged) union narrows on the literal discriminant; with every case returning, the switch is exhaustive and needs no default.',
        ),
      },
    ],
    recap: LL(
      [
      '`string | number` means either.',
      'Check first, then use the specific member.',
      'Literal unions make typos impossible.',
    ],
      [
        '`string | number` means a word or a number.',
        'Look first, then use it.',
        'A list of allowed words stops spelling mistakes.',
      ],
      [
        'A union says "one of"; narrowing proves which.',
        'Discriminated union + `switch` + `never` = exhaustive handling.',
        'Type assertions are unchecked promises: keep them rare.',
      ],
    ),
  },

  {
    id: 'm05-l03-optional-unknown',
    moduleId: 'm05',
    order: 3,
    title: {
      story: 'Empty boxes and mystery boxes',
      explorer: 'Optional values, readonly, and unknown',
      pro: 'Optionality, readonly, and the any/unknown distinction',
    },
    estMinutes: 7,
    concepts: ['optional', 'readonly', 'unknown', 'any', 'narrowing'],
    steps: [
      {
        id: 'read',
        kind: 'read',
        prompt: L('Missing values are normal. Plan for them.', 'Sometimes a box is empty. Plan for it.'),
        body: L(
          md(
            'An **optional** property may not exist: `age?: number`. Reading it gives `number | undefined`, so you must handle that case.',
            '`readonly` stops reassignment and documents intent: `readonly id: string`.',
            'And the important one: **`unknown`** versus **`any`**.',
            bullets(
              '`any` switches checking off. Everything after it is unchecked.',
              '`unknown` says "I do not know yet", and forces you to check before use.',
            ),
            'When data comes from outside your program — a file, a form, a network — it is genuinely unknown. Say so, then narrow.',
          ),
          md(
            'Some boxes might be empty. An optional value is a box with a `?`, and you have to check inside before using it.',
            '`unknown` is a mystery box: you must look inside before using what is in it.',
            '`any` is a box that says "do not bother looking". That is how mistakes hide.',
          ),
          md(
            '`age?: number` means the property may be absent, so under `strictNullChecks` reading it yields `number | undefined`. Handle that with `?.`, `??` or an explicit check.',
            '`readonly` exists only at compile time; nothing is frozen at runtime. For arrays, `ReadonlyArray<T>` removes the mutating methods from the type.',
            '`any` switches checking off, and it spreads: anything derived from it is `any` too. `unknown` is the type-safe top type: you must narrow it (with `typeof`, `Array.isArray` or a schema validator) before using it. Type external input, such as `JSON.parse`, `fetch` or `localStorage`, as `unknown` and validate it at the boundary.',
          ),
        ),
      },
      {
        id: 'spot',
        kind: 'check',
        prompt: L(
          'Which is safer for data you did not create?',
          'Which is safer for things you did not make yourself?',
        ),
        hint: L(
          'One of them makes you check the value before using it. The other skips all checking.',
          'One makes you look inside the mystery box first. Which one?',
        ),
        explain: L(
          '`unknown` forces a check before use. `any` lets you call anything on it, including things that will crash.',
          '`unknown` is a mystery box: you must check it before you use it. `any` lets you do anything, even things that will break.',
          '`unknown` accepts any value but allows no operation until it is narrowed; `any` allows every operation and disables checking downstream. Use `unknown` at trust boundaries.',
        ),
        choices: [
          {
            id: 'any',
            text: L('`any`'),
            correct: false,
            feedback: L(
              '`any` turns off checking, so a wrong call compiles and fails later.',
              '`any` switches off the checking, so a mistake only shows up later.',
            ),
          },
          {
            id: 'unknown',
            text: L('`unknown`'),
            correct: true,
          },
        ],
      },
      {
        id: 'fix',
        kind: 'fix',
        prompt: L(
          '`readName` crashes when the name is missing. Guard the empty case.',
          '`readName` breaks when there is no name. Handle the empty case.',
        ),
        starter: c(
          'function readName(user: { name?: string }): string {',
          '  return user.name.toUpperCase();',
          '}',
        ),
        solution: c(
          'function readName(user: { name?: string }): string {',
          '  return (user.name ?? "ANON").toUpperCase();',
          '}',
        ),
        tests: [
          { name: 'a real name', call: 'readName({ name: "ada" })', expect: 'ADA' },
          { name: 'a missing name', call: 'readName({})', expect: 'ANON' },
        ],
        hint: L(
          'Use `??` to supply a fallback, then uppercase the result.',
          'Use `??` to give a spare value, then make it capital letters.',
        ),
        explain: L(
          '`??` only falls back for `null` and `undefined`. Unlike `||`, it keeps `0` and `""` as real values.',
          '`??` uses the spare value only when the box is empty (`null` or `undefined`). It keeps 0 and empty words as real values.',
          '`??` substitutes only for `null` or `undefined`; `||` would also replace `""`. `user.name?.toUpperCase() ?? "ANON"` is an equivalent spelling.',
        ),
      },
      {
        id: 'write',
        kind: 'write',
        prompt: L(
          'Write `describeUser`. Return the nickname when it exists, otherwise the name. Never return an empty string.',
          'Make `describeUser`: give back the nickname if there is one, otherwise the name. Never give back empty words.',
        ),
        starter: c(
          'interface User {',
          '  readonly name: string;',
          '  nickname?: string;',
          '}',
          '',
          'function describeUser(user: User): string {',
          '  return user.name;',
          '}',
        ),
        solution: c(
          'interface User {',
          '  readonly name: string;',
          '  nickname?: string;',
          '}',
          '',
          'function describeUser(user: User): string {',
          '  return user.nickname ? user.nickname : user.name;',
          '}',
        ),
        tests: [
          { name: 'prefers nickname', call: 'describeUser({ name: "Ada", nickname: "A" })', expect: 'A' },
          { name: 'falls back to name', call: 'describeUser({ name: "Ada" })', expect: 'Ada' },
          {
            name: 'empty nickname falls back',
            call: 'describeUser({ name: "Ada", nickname: "" })',
            expect: 'Ada',
          },
        ],
        hint: L(
          'A ternary: use `user.nickname` when it is truthy, otherwise `user.name`.',
          'Use `? :`: pick `user.nickname` if it has letters, otherwise `user.name`.',
        ),
        explain: L(
          'Here truthiness is the right check, because an empty nickname is not useful. For numbers, prefer `=== undefined`.',
          'Here "has letters" is the right check, because an empty nickname is no use. For numbers, check for `undefined` instead.',
          'Truthiness is intended here: an empty nickname should fall back. For numeric optionals, compare with `undefined`, because `0` is valid data.',
        ),
      },
      {
        id: 'recap',
        kind: 'recap',
        prompt: L('The short version.', 'What you learned.'),
        points: LL(
          [
          '`?` makes a property optional, and its type includes `undefined`.',
          '`readonly` prevents reassignment.',
          '`unknown` forces a check; `any` hides problems.',
        ],
          [
            '`?` means the thing might be missing.',
            '`readonly` means it can never be changed.',
            '`unknown` makes you check; `any` hides problems.',
          ],
          [
            '`?` adds `undefined` to the property type.',
            '`readonly` is compile-time only.',
            '`unknown` at the boundaries, then narrow; never `any`.',
          ],
        ),
      },
      {
        id: 'first-letter',
        kind: 'fix',
        bonus: true,
        compilerFlags: { noUncheckedIndexedAccess: true },
        prompt: L(
          'With `noUncheckedIndexedAccess` on, `names[0]` might be `undefined`. Make `initial` return `"?"` for an empty list.',
          'With this stricter setting, TypeScript knows the list might be empty. Give back `"?"` when there is no first name.',
        ),
        hint: L(
          'Store `names[0]` in a variable, check it against `undefined`, and return early.',
          'Put `names[0]` in a box first. If the box is empty (`undefined`), give back `"?"`.',
        ),
        starter: c(
          'function initial(names: string[]): string {',
          '  const first = names[0];',
          '  return first.charAt(0).toUpperCase();',
          '}',
        ),
        solution: c(
          'function initial(names: string[]): string {',
          '  const first = names[0];',
          '  if (first === undefined) return "?";',
          '  return first.charAt(0).toUpperCase();',
          '}',
        ),
        tests: [
          { name: 'first name', call: 'initial(["ada", "bo"])', expect: 'A' },
          { name: 'empty list', call: 'initial([])', expect: '?' },
        ],
        explain: L(
          'Without the flag, TypeScript types `names[0]` as `string`, and an empty list crashes at run time. The flag makes the type honest (`string | undefined`), so the check is required.',
          'Normally TypeScript trusts that `names[0]` is there. The stricter setting says "it might be missing", so you check, and the empty list no longer breaks.',
          '`noUncheckedIndexedAccess` adds `undefined` to every index read (`T[number]` and index signatures). It is off in `strict`, but catches a whole class of out-of-range bugs; the narrowing it forces is one `if`.',
        ),
      },
    ],
    recap: LL(
      [
      'Optional values must be handled.',
      '`??` is safer than `||` for real values like 0.',
      'Say `unknown`, then narrow.',
    ],
      [
        'Things that might be missing must be handled.',
        '`??` is safer than `||` when 0 is a real answer.',
        'Say `unknown`, then look inside.',
      ],
      [
        'Model absence explicitly and handle it with `?.` and `??`.',
        'Validate external data, starting from `unknown`.',
        '`any` is contagious; `unknown` is honest.',
      ],
    ),
  },

  {
    id: 'm05-l04-generics',
    moduleId: 'm05',
    order: 4,
    title: {
      story: 'One tool, many kinds',
      explorer: 'Generics without the theory',
      pro: 'Type parameters in practice',
    },
    estMinutes: 6,
    concepts: ['generic', 'array', 'function', 'annotation'],
    steps: [
      {
        id: 'read',
        kind: 'read',
        prompt: L(
          'A generic keeps whatever type it was given.',
          'A generic machine works for any kind of thing, and remembers which kind.',
        ),
        body: L(
          md(
            'Without generics you either duplicate a function or lose its type:',
            '```ts\nfunction firstOf<T>(items: T[]): T | undefined {\n  return items[0];\n}\n```',
            '`T` is a placeholder for whatever type the caller uses. Give it strings and `T` is `string`; give it numbers and `T` is `number`. The type travels through instead of becoming `any`.',
            'That is the whole idea. You do not need the theory to use it well — name it after what it holds, and let the caller supply it.',
          ),
          md(
            'A generic is a tool that keeps the kind of thing you gave it.',
            'Give it a list of words and it gives back a word. Give it a list of numbers and it gives back a number. It never muddles them.',
          ),
          md(
            'A type parameter is inferred from the arguments at each call: `firstOf(["a"])` instantiates `T` as `string`. Write it out (`firstOf<number>([])`) only when there is nothing to infer from.',
            'Constrain a parameter with `extends` to require what the body needs: `function longest<T extends { length: number }>(a: T, b: T): T`. The constraint lets the body use `.length` while still returning the caller\'s exact type.',
            'A useful test: a type parameter that appears only once in a signature is probably unnecessary; use the concrete type or `unknown` instead.',
          ),
        ),
      },
      {
        id: 'compare',
        kind: 'compare',
        prompt: L('Two nearly identical functions.', 'Two machines that are almost the same.'),
        left: {
          title: 'Duplicated',
          code: c(
            'function firstString(items: string[]): string | undefined {',
            '  return items[0];',
            '}',
            '',
            'function firstNumber(items: number[]): number | undefined {',
            '  return items[0];',
            '}',
          ),
          caption: L(
            'Same body twice, and a third copy next week.',
            'The same machine written twice — and a third copy next week.',
          ),
        },
        right: {
          title: 'Generic',
          code: c('function firstOf<T>(items: T[]): T | undefined {', '  return items[0];', '}'),
          caption: L(
            'One body, and the return type follows the input.',
            'One machine, and what comes out has the same kind as what went in.',
          ),
        },
      },
      {
        id: 'fill',
        kind: 'fill',
        prompt: L('Name the type parameter.', 'Name the "any kind" placeholder.'),
        hint: L(
          'The placeholder must match the name used in `T[]` and `T | undefined`.',
          'Look at the rest of the line: which letter is used as the kind?',
        ),
        template: c('function firstOf<___>(items: T[]): T | undefined {', '  return items[0];', '}'),
        bank: ['T', 'type', 'any', 'Item'],
        answers: ['T'],
        explain: L(
          '`T` is the conventional name, and it must match the `T[]` and `T` used in the body. `any` would erase the type.',
          '`T` is the usual name, and it must match the `T[]` and `T` in the machine. `any` would forget the kind.',
          'Declaring `T` in `<…>` is what makes the other `T`s refer to a type parameter instead of an unknown name. Using `any` instead would break the link between what goes in and what comes out.',
        ),
      },
      {
        id: 'write',
        kind: 'write',
        prompt: L(
          'Write `firstItem` as a generic that returns the first item, or `undefined`.',
          'Make `firstItem` a generic machine that gives back the first thing, or `undefined`.',
        ),
        starter: c(
          'function firstItem<T>(items: T[]): T | undefined {',
          '  // index 0',
          '  return undefined;',
          '}',
        ),
        solution: c(
          'function firstItem<T>(items: T[]): T | undefined {',
          '  return items[0];',
          '}',
        ),
        tests: [
          { name: 'numbers', call: 'firstItem([1, 2, 3])', expect: '1' },
          { name: 'strings', call: 'firstItem(["a", "b"])', expect: 'a' },
          { name: 'empty', call: 'firstItem([])', expect: 'undefined' },
        ],
        hint: L(
          'Return `items[0]`. The generic type makes it come back as the same kind as the list.',
          'Give back `items[0]`. The `<T>` makes it come back as the same kind as the list.',
        ),
      },
      {
        id: 'recap',
        kind: 'recap',
        prompt: L('The short version.', 'What you learned.'),
        points: LL(
          [
          '`<T>` is a placeholder type filled in by the caller.',
          'Generics preserve type information instead of erasing it.',
          'Reach for one when you are duplicating a function per type.',
        ],
          [
            '`<T>` is a placeholder for "whatever kind you give it".',
            'A generic remembers the kind instead of forgetting it.',
            'Use one when you would otherwise copy a machine for each kind.',
          ],
          [
            'Type parameters are inferred at each call.',
            '`extends` constrains what `T` must support.',
            'A type parameter used only once is a smell.',
          ],
        ),
      },
      {
        id: 'box',
        kind: 'types',
        bonus: true,
        prompt: L(
          'A type challenge: finish `Box<T>` so every type check below passes.',
          'A puzzle for the type checker: fix the `Box` label so all the checks below are happy.',
        ),
        hint: L(
          'The box should hold a value of the type it was given, not `unknown`.',
          'Whatever kind goes in, the box should remember it. Which letter stands for that kind?',
        ),
        strongHint: L('Use the type parameter: `value: T;`', 'Write `value: T;` inside the box.'),
        starter: c(
          '// A box that holds one value, of any type.',
          'type Box<T> = {',
          '  value: unknown;',
          '};',
          '',
          'function box<T>(value: T): Box<T> {',
          '  return { value };',
          '}',
        ),
        solution: c(
          '// A box that holds one value, of any type.',
          'type Box<T> = {',
          '  value: T;',
          '};',
          '',
          'function box<T>(value: T): Box<T> {',
          '  return { value };',
          '}',
        ),
        typeTests: [
          { name: 'a box of numbers holds a number', code: 'type T1 = Expect<Equal<Box<number>["value"], number>>;' },
          {
            name: 'box("hi") is a box of strings',
            code: 'const hi = box("hi");\ntype T2 = Expect<Equal<typeof hi, Box<string>>>;',
          },
          { name: 'a box of numbers refuses text', code: 'const wrong: Box<number> = { value: "3" };', expect: 'error' },
          { name: 'a box is never empty', code: 'const empty: Box<number> = {};', expect: 'error' },
        ],
        explain: L(
          '`value: T` ties what the box holds to the type it was made with. `unknown` accepted anything, so a box of numbers happily held text.',
          'With `T` inside, a box of numbers only holds numbers. `unknown` let anything in, even words.',
          'A type test is compile-time only: `Expect<Equal<A, B>>` fails to compile unless `A` and `B` are identical, and a line marked `@ts-expect-error` must not compile. Type-level libraries are tested exactly like this.',
        ),
      },
    ],
    recap: LL(
      [
      'Generics keep the type you put in.',
      '`<T>` goes before the parameter list.',
      'Use them to remove duplication, not to look clever.',
    ],
      [
        'Generic machines keep the kind you put in.',
        '`<T>` goes before the brackets.',
        'Use them to avoid copies, not to look clever.',
      ],
      [
        'Generics relate input types to output types.',
        'Constrain with `extends` instead of widening to `any`.',
        'Let inference do the instantiating.',
      ],
    ),
  },
];

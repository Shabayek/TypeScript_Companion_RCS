import { L, LL, bullets, c, md } from '../authoring';
import type { Lesson } from '../schema';

export const M03_LESSONS: readonly Lesson[] = [
  {
    id: 'm03-l01-arrays',
    moduleId: 'm03',
    order: 1,
    title: {
      story: 'Lists of things',
      explorer: 'Arrays: ordered lists',
      pro: 'Arrays, indexing and basic operations',
    },
    estMinutes: 6,
    concepts: ['array', 'index', 'mutation'],
    steps: [
      {
        id: 'read',
        kind: 'read',
        prompt: L('An array is a list, numbered from zero.', 'An array is a list. Counting starts at zero!'),
        body: L(
          md(
            'An **array** holds values in order:',
            '```ts\nconst fruits = ["apple", "pear", "fig"];\n```',
            'Positions are counted from `0`. `fruits[0]` is `"apple"`, and `fruits.length` is `3`.',
            '`fruits.push("plum")` adds to the end — and **changes the original array**. That is a mutation. `[...fruits, "plum"]` makes a new array instead and leaves the first one alone.',
          ),
          md(
            'An array is a list in square brackets: `["apple", "pear"]`.',
            'Counting starts at zero, which takes a while to get used to. The first item is `[0]`, the second is `[1]`.',
            '`.length` tells you how many items there are.',
          ),
          md(
            'Arrays are zero-indexed and grow as needed. Reading past the end returns `undefined` instead of throwing, yet by default TypeScript types `fruits[5]` as `string`, not `string | undefined`. Turn on `noUncheckedIndexedAccess` to make that honest.',
            '`push`, `pop`, `splice`, `sort` and `reverse` mutate in place. Spread (`[...a, x]`) and the newer `toSorted`, `toReversed` and `with` return copies, which matters whenever the array is shared (UI state, for instance).',
            '`string[]` and `Array<string>` are the same type; `readonly string[]` removes the mutating methods from the type.',
          ),
        ),
        figure: 'array',
      },
      {
        id: 'predict',
        kind: 'predict',
        prompt: L('What prints?', 'What will it show?'),
        hint: L(
          'Index `0` is the first item. `.length` is how many items there are.',
          'The first fruit is at spot 0, the second at spot 1, the third at spot 2.',
        ),
        code: c(
          'const fruits = ["apple", "pear", "fig"];',
          'console.log(fruits[0]);',
          'console.log(fruits.length);',
          'console.log(fruits[2]);',
        ),
        answer: c('apple', '3', 'fig'),
        explain: L(
          'Index 0 is the first item, so `[2]` is the third. There is no index 3, which is why `.length` is how you count.',
          'Spot 0 is the first fruit, so spot 2 is the third. There is no spot 3 — that is why we count with `.length`.',
          'Indices run from `0` to `length - 1`, so `fruits[2]` is the last element. `fruits[3]` would be `undefined` at runtime, and only `noUncheckedIndexedAccess` makes the type say so.',
        ),
      },
      {
        id: 'last',
        kind: 'predict',
        // `.at()` is ES2022: older phones get the classic version below.
        runtime: 'modern',
        prompt: L(
          '`.at()` counts from the end when the number is negative. What prints?',
          '`.at()` can count backwards from the end! What will it show?',
        ),
        hint: L(
          '`.at(0)` is the first item, like `[0]`. `.at(-1)` is the last one, `.at(-2)` the one before it.',
          '`.at(0)` is the first one. A minus number starts from the other end: `-1` is the very last.',
        ),
        code: c(
          'const queue = ["Ada", "Bo", "Cy"];',
          'console.log(queue.at(0));',
          'console.log(queue.at(-1));',
        ),
        answer: c('Ada', 'Cy'),
        explain: L(
          '`.at(-1)` is the last item, whatever the length. It is newer JavaScript (2022), so older phones do not have it; there, `queue[queue.length - 1]` does the same job.',
          '`-1` means "the last one", however long the list is. It is quite new, so older phones use `queue[queue.length - 1]` instead.',
          '`Array.prototype.at` (ES2022) accepts negative indices relative to the end, and its return type is `T | undefined` even without `noUncheckedIndexedAccess`. On engines before ES2022, `queue[queue.length - 1]` is the equivalent.',
        ),
        classic: {
          kind: 'predict',
          prompt: L(
            '`queue.length - 1` is the position of the last item. What prints?',
            '`queue.length - 1` is the spot of the very last one. What will it show?',
          ),
          hint: L(
            'There are 3 items, so `queue.length - 1` is `2`: the third item.',
            'The list has 3 names, and 3 - 1 is 2. Which name is at spot 2?',
          ),
          code: c(
            'const queue = ["Ada", "Bo", "Cy"];',
            'console.log(queue[0]);',
            'console.log(queue[queue.length - 1]);',
          ),
          answer: c('Ada', 'Cy'),
          explain: L(
            '`queue.length - 1` always points at the last item. Newer phones also have a shortcut, `queue.at(-1)`, which does the same thing.',
            '`length - 1` always finds the last one. Newer phones have a shortcut for it, `queue.at(-1)`.',
            'Indexing with `length - 1` works on every engine. ES2022 added `queue.at(-1)` for the same read; this device runs the Classic engine, so the lesson shows the portable form.',
          ),
        },
      },
      {
        id: 'fill',
        kind: 'fill',
        prompt: L('Read the first item.', 'Get the first fruit.'),
        hint: L(
          'Arrays are numbered from zero, not one.',
          'Counting in a list starts at 0, not 1.',
        ),
        template: c('const fruits = ["apple", "pear", "fig"];', 'const first = fruits[___];'),
        bank: ['0', '1', '3', 'first'],
        answers: ['0'],
        explain: L(
          'Arrays start at 0, so the first item is at index `0`.',
          'Lists start counting at 0, so the first fruit is at spot `0`.',
          'Index `0` is the first element. To read the last one, `fruits[fruits.length - 1]` works on every engine; ES2022 engines also have `fruits.at(-1)`.',
        ),
      },
      {
        id: 'write',
        kind: 'write',
        prompt: L(
          'Write `secondItem` so it returns the second item of a list.',
          'Make `secondItem` give back the second thing in a list.',
        ),
        starter: c(
          'function secondItem(list: string[]): string | undefined {',
          '  // index 1, not 2',
          '  return undefined;',
          '}',
        ),
        solution: c(
          'function secondItem(list: string[]): string | undefined {',
          '  return list[1];',
          '}',
        ),
        tests: [
          { name: 'three items', call: 'secondItem(["a", "b", "c"])', expect: 'b' },
          { name: 'one item gives undefined', call: 'secondItem(["a"])', expect: 'undefined' },
        ],
        hint: L('The second item lives at index 1.', 'The second thing is at spot 1.'),
        explain: L(
          'Returning a missing index gives `undefined`, which is why the return type says `string | undefined`.',
          'If a list is too short, asking for a missing spot gives `undefined` (nothing). That is why the label says `string | undefined`.',
          '`list[1]` is `undefined` when the list has fewer than two items. The explicit `string | undefined` return type says so honestly, and forces callers to handle it.',
        ),
      },
      {
        id: 'recap',
        kind: 'recap',
        prompt: L('The short version.', 'What you learned.'),
        points: LL(
          [
          'Arrays are ordered lists in square brackets.',
          'Indexing starts at 0; `.length` counts items.',
          '`push` mutates; spread copies.',
        ],
          [
            'An array is a list in square brackets.',
            'Counting starts at 0; `.length` says how many.',
            '`push` changes the list; `...` makes a copy.',
          ],
          [
            'Zero-indexed; reading out of range gives `undefined`, not an error.',
            '`noUncheckedIndexedAccess` types index reads as `T | undefined`.',
            'Know which methods mutate (`push`, `sort`) and which copy (spread, `toSorted`).',
          ],
        ),
      },
      {
        id: 'mixed',
        kind: 'predictType',
        bonus: true,
        prompt: L('Go further: what type does TypeScript give `mixed`?', 'A challenge: what is the type of `mixed`?'),
        hint: L('The array holds numbers and strings, so each item is one or the other.', 'The list has numbers and words. Each item is a number or a word.'),
        code: c('const mixed = [1, "two", 3];', 'console.log(mixed.length);'),
        target: 'mixed',
        answer: '(string | number)[]',
        alsoAccept: ['Array<string | number>', '(number | string)[]', 'Array<number | string>'],
        explain: L(
          'TypeScript infers an array of a union: every item is a `string` or a `number`, in any order.',
          'Each item could be a number or a word, so the list type is `(string | number)[]`.',
          'Array literal inference takes the best common type of the elements (here a union) and widens literals. `as const` would infer the tuple `readonly [1, "two", 3]` instead.',
        ),
      },
    ],
    recap: LL(
      [
      'Arrays keep values in order.',
      '`[0]` is the first item, `[1]` the second.',
      '`push` changes the original; spread makes a copy.',
    ],
      [
        'Arrays keep things in order.',
        '`[0]` is the first thing, `[1]` the second.',
        '`push` changes the list; `...` copies it.',
      ],
      [
        'Arrays are ordered, zero-indexed and mutable by default.',
        'Type index reads honestly: `T | undefined`.',
        'Copy instead of mutating shared arrays; `readonly T[]` enforces it.',
      ],
    ),
  },

  {
    id: 'm03-l05-loops',
    moduleId: 'm03',
    order: 2,
    title: {
      story: 'Doing it again',
      explorer: 'Loops: doing things again',
      pro: 'Loops: for, for...of and while',
    },
    estMinutes: 7,
    concepts: ['loop', 'array', 'index'],
    steps: [
      {
        id: 'read',
        kind: 'read',
        prompt: L('A loop runs the same code again and again.', 'A loop tells the robot: do it again!'),
        body: L(
          md(
            'Writing `console.log` ten times is tiring. A **loop** repeats code for you.',
            '```ts\nfor (let i = 1; i <= 3; i++) {\n  console.log(i);\n}\n```',
            'A `for` loop has three parts: where to start (`let i = 1`), when to keep going (`i <= 3`), and what to do after each round (`i++`, "add one").',
            'To visit every item in an array, `for...of` is simpler: `for (const fruit of fruits) { … }`.',
            '`while (condition) { … }` repeats as long as the condition is true. If it never becomes false, the loop never ends — this app stops it after two seconds.',
          ),
          md(
            'Writing the same line ten times is boring. A **loop** does it for you.',
            '```ts\nfor (let i = 1; i <= 3; i++) {\n  console.log(i);\n}\n```',
            'This loop counts: start at 1, keep going while `i` is 3 or less, and add one each time (`i++`).',
            'To visit every thing in a list, use `for...of`: `for (const fruit of fruits) { … }` — "for each fruit in the list".',
            'Careful: a loop that never stops keeps going forever. If that happens, this app stops it after two seconds.',
          ),
          md(
            'Three forms cover almost every loop: the counting `for (init; test; update)`, `for...of` over any *iterable* (arrays, strings, `Map`, `Set`), and `while` when the number of rounds is unknown. `break` leaves the loop; `continue` skips to the next round.',
            '`for...in` walks *enumerable property keys* as strings, inherited ones included. Keep it for plain objects, where `Object.entries` is usually clearer anyway.',
            '`let` in a `for` header creates a fresh binding per iteration, so a closure created inside the loop sees that round\'s value (with `var`, they all share one). This app stops a runaway loop after two seconds; real runtimes do not.',
          ),
        ),
        callout: {
          tone: 'tip',
          title: 'Loops and list tools',
          body: L(
            'Later you will meet `map`, `filter` and `find`. They are loops with a job already built in, and often shorter — but every one of them is a loop underneath.',
            'Later you will meet `map`, `filter` and `find`. They are loops with a job built in. Underneath, they are all loops!',
          ),
        },
      },
      {
        id: 'predict',
        kind: 'predict',
        prompt: L('What does this loop print?', 'What will the loop show?'),
        hint: L(
          'Start with `i = 1`. Each round prints `i`, then adds one, until `i <= 3` is false.',
          'Start at 1. Show it, add one, and go again — stop when you pass 3.',
        ),
        code: c('for (let i = 1; i <= 3; i++) {', '  console.log(i);', '}', 'console.log("done");'),
        answer: c('1', '2', '3', 'done'),
        explain: L(
          'The loop runs for 1, 2 and 3. When `i` becomes 4, `i <= 3` is false, the loop ends, and the line after it runs once.',
          'The loop shows 1, 2 and 3. At 4 it stops, and then "done" is shown once.',
          'The test `i <= 3` runs before every round, including the one that fails when `i` is `4`. Control then continues after the loop, which is why `done` prints exactly once.',
        ),
      },
      {
        id: 'fill',
        kind: 'fill',
        prompt: L('Visit every fruit in the list.', 'Visit every fruit in the list.'),
        hint: L(
          'You want each *value* in the array, not its positions. Which keyword gives you the values?',
          'You want each fruit itself, not its spot number. Which small word does that?',
        ),
        template: c('const fruits = ["apple", "pear", "fig"];', 'for (const fruit ___ fruits) {', '  console.log(fruit);', '}'),
        bank: ['of', 'in', 'from', '='],
        answers: ['of'],
        explain: L(
          '`for...of` visits each value of the array. (`for...in` exists too, but it walks over keys — for an array, `"0"`, `"1"`, `"2"` — which is rarely what you want.)',
          '`for...of` gives you each fruit, one by one. (`in` gives the spot numbers instead, which is not what we want here.)',
          '`for...of` uses the iteration protocol and yields values. `for...in` would yield the keys `"0"`, `"1"` and `"2"`, as strings.',
        ),
      },
      {
        id: 'try',
        kind: 'tryIt',
        prompt: L(
          'A countdown with `while`. Change the start number, or make it count up — then run it.',
          'A countdown! Change the start number, then press Run.',
        ),
        code: c('let count = 3;', 'while (count > 0) {', '  console.log(count);', '  count--;', '}', 'console.log("Lift off!");'),
      },
      {
        id: 'write',
        kind: 'write',
        prompt: L(
          'Write `sumTo` so it adds up every whole number from 1 to `n`. `sumTo(3)` is 1 + 2 + 3 = 6.',
          'Make `sumTo` add up all the numbers from 1 to `n`. `sumTo(3)` is 1 + 2 + 3 = 6.',
        ),
        hint: L(
          'Start `total` at 0. Loop `i` from 1 to `n` (use `<=`), adding `i` to `total` each round.',
          'Start with `total` at 0. Count from 1 to `n` with a loop, and add each number to `total`.',
        ),
        strongHint: L(
          '`for (let i = 1; i <= n; i++) { total += i; }` — then `return total;`.',
          'Write `for (let i = 1; i <= n; i++) { total += i; }` and then `return total;`.',
        ),
        starter: c('function sumTo(n: number): number {', '  let total = 0;', '  // add each number from 1 to n', '  return total;', '}'),
        solution: c(
          'function sumTo(n: number): number {',
          '  let total = 0;',
          '  for (let i = 1; i <= n; i++) {',
          '    total += i;',
          '  }',
          '  return total;',
          '}',
        ),
        tests: [
          { name: 'sumTo(3)', call: 'sumTo(3)', expect: '6' },
          { name: 'sumTo(1)', call: 'sumTo(1)', expect: '1' },
          { name: 'sumTo(10)', call: 'sumTo(10)', expect: '55' },
          { name: 'nothing to add', call: 'sumTo(0)', expect: '0' },
        ],
        explain: L(
          '`total` collects the answer while `i` walks from 1 to `n`. With `n = 0` the condition is false at once, so the loop body never runs and 0 comes back.',
          '`total` is the box that collects the sum. When `n` is 0, the loop does not run at all, so the answer stays 0.',
          'An accumulator loop: `total` holds the running sum. The closed form `n * (n + 1) / 2` is O(1), but this loop is the pattern you reuse for everything `reduce` does.',
        ),
      },
      {
        id: 'recap',
        kind: 'recap',
        prompt: L('The short version.', 'What you learned.'),
        points: LL(
          [
            '`for (let i = 1; i <= n; i++)` counts; `for (const item of list)` visits each item.',
            '`while` repeats while a condition is true.',
            'A loop must be able to stop: something has to change each round.',
          ],
          [
            'A `for` loop counts; `for...of` visits every thing in a list.',
            '`while` keeps going while something is true.',
            'Every loop needs a way to stop.',
          ],
          [
            '`for` to count, `for...of` for iterables, `while` for an unknown number of rounds.',
            '`for...in` walks string keys; avoid it on arrays.',
            '`let` in a `for` header gives each round its own binding.',
          ],
        ),
      },
      {
        id: 'fizzbuzz',
        kind: 'write',
        bonus: true,
        prompt: L(
          'Go further: write `fizzBuzz(n)`: the numbers 1 to `n` as strings, but `"Fizz"` for multiples of 3, `"Buzz"` for 5, `"FizzBuzz"` for both.',
          'A challenge: count from 1 to `n`, but say Fizz for threes, Buzz for fives and FizzBuzz for both!',
        ),
        starter: c('function fizzBuzz(n: number): string[] {', '  const out: string[] = [];', '  return out;', '}'),
        solution: c(
          'function fizzBuzz(n: number): string[] {',
          '  const out: string[] = [];',
          '  for (let i = 1; i <= n; i++) {',
          '    if (i % 15 === 0) out.push("FizzBuzz");',
          '    else if (i % 3 === 0) out.push("Fizz");',
          '    else if (i % 5 === 0) out.push("Buzz");',
          '    else out.push(String(i));',
          '  }',
          '  return out;',
          '}',
        ),
        tests: [
          { name: 'up to 5', call: 'fizzBuzz(5)', expect: '["1","2","Fizz","4","Buzz"]' },
          { name: 'the fifteenth', call: 'fizzBuzz(15)[14]', expect: 'FizzBuzz' },
          { name: 'none', call: 'fizzBuzz(0)', expect: '[]' },
        ],
        hint: L('Loop from 1 to `n`. Check 15 first (both), then 3, then 5, else `String(i)`.', 'Count with a loop. Check "both" first (15), then 3, then 5. Otherwise add the number as text.'),
        explain: L('The order matters: test "both" before the single cases, or 15 would stop at "Fizz".', 'If you check 3 first, 15 would only say "Fizz". So "both" goes first.', 'Check the most specific condition first; `i % 15` is equivalent to `i % 3 === 0 && i % 5 === 0` because 3 and 5 are coprime.'),
      },
    ],
    recap: LL(
      [
        'Loops repeat code: `for`, `for...of`, `while`.',
        'Each round must move towards the end, or the loop never stops.',
        '`map`, `filter` and `find` are loops with a job built in.',
      ],
      [
        'Loops do things again and again.',
        'A loop needs a way to stop.',
        '`map`, `filter` and `find` are loops in disguise.',
      ],
      [
        'Choose the loop by what you walk: indices, values, or a condition.',
        'Every loop needs something that moves it towards its exit.',
        '`map`, `filter` and `reduce` say common loops declaratively.',
      ],
    ),
  },

  {
    id: 'm03-l02-objects',
    moduleId: 'm03',
    order: 2,
    title: {
      story: 'Bundles of facts',
      explorer: 'Objects and properties',
      pro: 'Object literals and property access',
    },
    estMinutes: 6,
    concepts: ['object', 'property'],
    steps: [
      {
        id: 'read',
        kind: 'read',
        prompt: L('An object groups named values.', 'An object is a bag of labelled things.'),
        body: L(
          md(
            'Where an array is a list, an **object** is a bundle of named values:',
            '```ts\nconst user = { name: "Ada", age: 36, ready: true };\n```',
            'Read a value with a dot: `user.name`. Change it with `user.age = 37`.',
            'Objects can hold other objects, which is how real data usually looks: `user.address.city`.',
          ),
          md(
            'An object is a bag of labelled things. A person has a name, an age, and a favourite colour — three labels in one bag.',
            'You reach into the bag with a dot: `person.name`.',
          ),
          md(
            'An object literal\'s type is inferred from its shape: `{ name: string; age: number; ready: boolean }`. TypeScript checks shapes, not names, so any value with the right properties fits (structural typing).',
            'Objects are reference values. Assigning or passing one shares it, so a change made through one reference is visible through all of them; `const` does not prevent that.',
            'Excess property checks apply only to fresh object literals: `const u: User = { name: "Ada", extra: 1 }` is an error, but the same object passed via a variable is not.',
          ),
        ),
        figure: 'object',
      },
      {
        id: 'predict',
        kind: 'predict',
        prompt: L('What prints?', 'What will it show?'),
        hint: L(
          'The first line reads a property. The third line replaces `age` before the last line reads it.',
          'First the name is shown. Then the age goes up by one before it is shown.',
        ),
        code: c(
          'const user = { name: "Ada", age: 36 };',
          'console.log(user.name);',
          'user.age = user.age + 1;',
          'console.log(user.age);',
        ),
        answer: c('Ada', '37'),
        explain: L(
          'The first line reads `name`. Then `age` is replaced with one more than before, so the second print is 37.',
          'First we read the `name`. Then `age` gets one more than before, so the second line shows 37.',
          'A property write mutates the object in place; the `const` binding still points at the same object. That is allowed: `const` constrains the binding, not the value.',
        ),
      },
      {
        id: 'fill',
        kind: 'fill',
        prompt: L('Reach the nested value.', 'Reach into the bag inside the bag.'),
        hint: L(
          '`city` is not a property of `user` directly. Which property of `user` contains it?',
          'The city is inside another bag. What is that bag called?',
        ),
        template: c(
          'const user = { name: "Ada", address: { city: "Lagos" } };',
          'const city = user.___.city;',
        ),
        bank: ['address', 'name', 'city', 'user'],
        answers: ['address'],
        explain: L(
          '`city` lives inside `address`, so you walk through `address` first: `user.address.city`.',
          '`city` is inside `address`, so you go through `address` first: `user.address.city`.',
          'Member access chains left to right: `user.address` yields the inner object, then `.city` reads from it. If `address` could be missing, `user.address?.city` gives `undefined` instead of throwing.',
        ),
      },
      {
        id: 'write',
        kind: 'write',
        prompt: L(
          'Write `fullName` so it joins a person’s first and last name with a space.',
          'Make `fullName` put the first and last name together, with a space between.',
        ),
        starter: c(
          'function fullName(person: { first: string; last: string }): string {',
          '  // use a template literal',
          '  return "";',
          '}',
        ),
        solution: c(
          'function fullName(person: { first: string; last: string }): string {',
          '  return `${person.first} ${person.last}`;',
          '}',
        ),
        tests: [
          {
            name: 'Ada Lovelace',
            call: 'fullName({ first: "Ada", last: "Lovelace" })',
            expect: 'Ada Lovelace',
          },
          { name: 'single short name', call: 'fullName({ first: "Bo", last: "Li" })', expect: 'Bo Li' },
        ],
        hint: L(
          'A template literal with `person.first`, a space, and `person.last`.',
          'Use backticks with `person.first`, a space, and `person.last`.',
        ),
      },
      {
        id: 'recap',
        kind: 'recap',
        prompt: L('The short version.', 'What you learned.'),
        points: LL(
          [
          'Objects group named values.',
          'Dot access reads and writes properties.',
          'Nested objects are reached one dot at a time.',
        ],
          [
            'An object is a bag of labelled things.',
            'A dot reads or changes one thing in the bag.',
            'Bags can hold bags: go one dot at a time.',
          ],
          [
            'Object types are structural: shape, not name.',
            'Objects are shared by reference; `const` does not freeze them.',
            'Excess property checks apply to fresh literals only.',
          ],
        ),
      },
      {
        id: 'shape',
        kind: 'predictType',
        bonus: true,
        prompt: L('Go further: what type does TypeScript infer for `point`?', 'A challenge: what is the type of `point`?'),
        hint: L('Write it as an object type with the two property names and their types.', 'Write `{ ... }` with both labels and what kind of value each holds.'),
        code: c('const point = { x: 3, y: 4 };', 'console.log(point.x + point.y);'),
        target: 'point',
        answer: '{ x: number; y: number }',
        alsoAccept: ['{ x: number, y: number }', '{ y: number; x: number }'],
        explain: L(
          'The properties can be changed later, so they widen to `number` even though the object is a `const`.',
          'The numbers inside could still change, so their type is just `number`.',
          '`const` only fixes the binding; object properties are mutable and widen. `as const` would give `{ readonly x: 3; readonly y: 4 }`.',
        ),
      },
    ],
    recap: LL(
      [
      'Objects are labelled bundles.',
      '`user.name` reads; `user.age = 37` writes.',
      'Nesting is normal: `user.address.city`.',
    ],
      [
        'Objects are bags of labelled things.',
        '`user.name` reads; `user.age = 37` changes.',
        'Bags in bags are normal: `user.address.city`.',
      ],
      [
        'TypeScript types objects by their shape.',
        'A change through one reference is visible through all of them.',
        'Use `?.` for nested access that may be missing.',
      ],
    ),
  },

  {
    id: 'm03-l03-destructuring-spread',
    moduleId: 'm03',
    order: 3,
    title: {
      story: 'Unpacking and copying',
      explorer: 'Destructuring and spread',
      pro: 'Destructuring, rest and immutable updates',
    },
    estMinutes: 6,
    concepts: ['destructuring', 'spread', 'object', 'array'],
    steps: [
      {
        id: 'read',
        kind: 'read',
        prompt: L(
          'Take what you need, copy what you change.',
          'Take out what you need. Copy before you change.',
        ),
        body: L(
          md(
            '**Destructuring** unpacks values into names:',
            '```ts\nconst { name, age } = user;\nconst [first, ...rest] = fruits;\n```',
            '**Spread** copies the contents of one object or array into another:',
            '```ts\nconst older = { ...user, age: 37 };\nconst more = [...fruits, "plum"];\n```',
            'That second line is the important habit: make a changed copy instead of editing the original. Code that does not surprise the reader is worth more than code that saves a character.',
          ),
          md(
            'Destructuring is unpacking a bag straight into your hands: `const { name } = user;`.',
            'Spread is copying everything out of one bag into a new one, then adding something: `{ ...user, age: 37 }`.',
            'The old bag is untouched. That is why it is safe.',
          ),
          md(
            'Destructuring binds properties or elements to names, with defaults (`const { age = 0 } = user`) and renaming (`const { name: label } = user`). Rest collects the remainder: `const { id, ...others } = user`.',
            'Spread copies are **shallow**: `{ ...user }` is a new top-level object, but nested objects are still shared. Use `structuredClone` when you really need a deep copy.',
            'Later properties win: `{ ...user, age: 37 }` overrides `age`, whereas in `{ age: 37, ...user }` the spread would overwrite it.',
          ),
        ),
      },
      {
        id: 'compare',
        kind: 'compare',
        prompt: L('Changing one property, two ways.', 'Two ways to change one thing.'),
        left: {
          title: 'Mutating',
          code: c('user.age = 37;', '', '// user has changed;', '// anyone else holding it sees 37'),
          caption: L(
            'Works — but every other reference to `user` changes too.',
            'This works — but every part of the program that uses `user` sees the change.',
          ),
        },
        right: {
          title: 'Copying',
          code: c('const older = { ...user, age: 37 };', '', '// user is still 36'),
          caption: L(
            'A new object, one property different. Nothing else moves.',
            'A new copy with one thing different. The original stays the same.',
          ),
        },
      },
      {
        id: 'predict',
        kind: 'predict',
        prompt: L('Does the original change?', 'Does the first one change?'),
        hint: L(
          '`{ ...user, age: 37 }` builds a *new* object. Which object does each line print from?',
          '`...` makes a copy. The change goes into the copy, not the original.',
        ),
        code: c(
          'const user = { name: "Ada", age: 36 };',
          'const older = { ...user, age: 37 };',
          'console.log(user.age);',
          'console.log(older.age);',
        ),
        answer: c('36', '37'),
        explain: L(
          'Spread made a copy, then `age: 37` replaced the age in the copy only. `user` never changed.',
          '`...user` made a copy, and `age: 37` changed only the copy. The original `user` is still 36.',
          'The spread creates a new object, then `age: 37` overrides that property on the copy. The original is untouched because none of its properties was written; nested objects, though, would still be shared.',
        ),
      },
      {
        id: 'write',
        kind: 'write',
        prompt: L(
          'Write `withDiscount` so it returns a new item with the price reduced by a percentage. Leave the original alone.',
          'Make `withDiscount` give back a new item with a cheaper price. Leave the first one alone.',
        ),
        starter: c(
          'function withDiscount(',
          '  item: { name: string; price: number },',
          '  percent: number,',
          '): { name: string; price: number } {',
          '  // copy, then change one value',
          '  return item;',
          '}',
        ),
        solution: c(
          'function withDiscount(',
          '  item: { name: string; price: number },',
          '  percent: number,',
          '): { name: string; price: number } {',
          '  return { ...item, price: item.price * (1 - percent / 100) };',
          '}',
        ),
        tests: [
          {
            name: '25% off 200',
            call: 'withDiscount({ name: "Pen", price: 200 }, 25)',
            expect: '{"name":"Pen","price":150}',
          },
          {
            name: 'the original is untouched',
            call: '(() => { const item = { name: "Pen", price: 200 }; withDiscount(item, 50); return item.price; })()',
            expect: '200',
          },
        ],
        hint: L(
          'Spread `item` into a new object, then override `price`.',
          'Copy `item` with `...` into a new object, then give it a new `price`.',
        ),
        strongHint: L(
          '`return { ...item, price: item.price * (1 - percent / 100) };`',
          'Write `return { ...item, price: item.price * (1 - percent / 100) };`',
        ),
      },
      {
        id: 'recap',
        kind: 'recap',
        prompt: L('The short version.', 'What you learned.'),
        points: LL(
          [
          'Destructuring pulls values out by name or position.',
          'Spread copies contents into a new array or object.',
          'Prefer copying when you change one property of shared data.',
        ],
          [
            'Unpacking takes values out by name or by place.',
            '`...` copies things into a new list or bag.',
            'Make a copy when you change something that others use too.',
          ],
          [
            'Destructuring supports defaults, renaming and rest.',
            'Spread makes a shallow copy; nested values stay shared.',
            'Property order decides which value wins.',
          ],
        ),
      },
      {
        id: 'swap',
        kind: 'write',
        bonus: true,
        prompt: L('Go further: write `swap` for a pair, using destructuring.', 'A challenge: make `swap` turn `[1, 2]` into `[2, 1]`.'),
        starter: c('function swap(pair: [number, string]): [string, number] {', '  return ["", 0];', '}'),
        solution: c('function swap(pair: [number, string]): [string, number] {', '  const [first, second] = pair;', '  return [second, first];', '}'),
        tests: [
          { name: 'swaps', call: 'swap([1, "one"])', expect: '["one",1]' },
          { name: 'swaps again', call: 'swap([2, "two"])', expect: '["two",2]' },
        ],
        hint: L('`const [first, second] = pair;` then return them the other way round.', 'Unpack the pair into two names, then give them back in the other order.'),
        explain: L(
          '`[number, string]` is a *tuple*: an array with a fixed length and a type for each position. Destructuring names the positions.',
          'A tuple is a short list where each spot has its own type. Unpacking gives each spot a name.',
          'Tuple types carry per-position types and a fixed length; destructuring preserves them, so `first` is `number` and `second` is `string`.',
        ),
      },
    ],
    recap: LL(
      [
      '`const { a, b } = obj` and `const [x, y] = list`.',
      '`{ ...obj, key: value }` copies then overrides.',
      'Immutable updates prevent whole classes of bugs.',
    ],
      [
        '`const { a, b } = obj` and `const [x, y] = list` unpack.',
        '`{ ...obj, key: value }` copies, then changes one thing.',
        'Copying keeps other parts of the program safe.',
      ],
      [
        'Update immutably: `{ ...obj, key: value }`.',
        'Copies are shallow; `structuredClone` for a deep copy.',
        'Immutable updates turn "did it change?" into a reference comparison.',
      ],
    ),
  },

  {
    id: 'm03-l04-map-filter-find',
    moduleId: 'm03',
    order: 4,
    title: {
      story: 'Three helpful list tools',
      explorer: 'map, filter and find',
      pro: 'Higher-order array methods',
    },
    estMinutes: 7,
    concepts: ['map', 'filter', 'find', 'callback', 'array'],
    steps: [
      {
        id: 'read',
        kind: 'read',
        prompt: L('Transform, keep, or pick.', 'Change every item, keep some, or find one.'),
        body: L(
          md(
            'Three methods cover most list work:',
            bullets(
              '**`.map`** transforms every item — the result has the same length.',
              '**`.filter`** keeps the items that pass a test — the result can be shorter.',
              '**`.find`** returns the first match, or `undefined`.',
            ),
            'Each one takes a **callback**: a function you hand over, which the array calls once per item.',
            '```ts\nprices.map(p => p * 2);\nprices.filter(p => p > 10);\npeople.find(p => p.id === 3);\n```',
          ),
          md(
            'Three tools do almost all list work:',
            bullets(
              '`.map` changes every item.',
              '`.filter` keeps only some items.',
              '`.find` grabs the first one it likes.',
            ),
            'You give each tool a small rule, and it follows that rule for every item.',
          ),
          md(
            '`map`, `filter` and `find` are higher-order methods that never mutate the source array, and they are fully typed: `map` infers the new element type from the callback, and `find` returns `T | undefined`.',
            'A plain boolean callback leaves `filter`\'s element type unchanged. To narrow it, use a type predicate: `items.filter((x): x is string => typeof x === "string")` gives `string[]`. (TypeScript 5.5 and later infer simple predicates like this one.)',
            'Each call in a chain allocates an intermediate array. That rarely matters, and clarity usually beats a hand-fused loop.',
          ),
        ),
      },
      {
        id: 'spot',
        kind: 'check',
        prompt: L('Which one gives you a single item back?', 'Which one gives back just one thing?'),
        hint: L(
          'Two of them always return a new array. One stops at the first match.',
          'Two of them give back a list. One stops when it finds what it looks for.',
        ),
        explain: L(
          '`find` returns one item — or `undefined` when nothing matches.',
          '`find` gives back one item — or `undefined` if nothing matches.',
          '`find` returns the first element for which the callback is truthy, or `undefined`; `findIndex` returns its index, or `-1`. `map` and `filter` always return arrays.',
        ),
        choices: [
          { id: 'map', text: L('`.map`'), correct: false, feedback: L(
            '`map` always returns an array.',
            '`map` always gives back a whole list.',
          ) },
          { id: 'filter', text: L('`.filter`'), correct: false, feedback: L(
            '`filter` returns an array too, possibly a shorter one.',
            '`filter` gives back a list too, maybe a shorter one.',
          ) },
          { id: 'find', text: L('`.find`'), correct: true },
        ],
      },
      {
        id: 'predict',
        kind: 'predict',
        prompt: L('What prints?', 'What will it show?'),
        hint: L(
          '`map` returns a new array with each item changed. `filter` returns only the items that pass the test.',
          '`map` changes each number. `filter` keeps only the even ones.',
        ),
        code: c(
          'const numbers = [1, 2, 3, 4];',
          'console.log(numbers.map(n => n * 10));',
          'console.log(numbers.filter(n => n % 2 === 0));',
        ),
        answer: c('[10,20,30,40]', '[2,4]'),
        explain: L(
          '`map` multiplies each item, keeping four items. `filter` keeps only even numbers. Printing an array shows it in brackets.',
          '`map` multiplies every number by 10, so there are still four. `filter` keeps only the even numbers. Lists are shown in square brackets.',
          '`map` keeps the length; `filter` keeps only the elements whose callback returned truthy. This app prints arrays compactly, as `[10,20,30,40]`; Node and browser consoles add spaces.',
        ),
      },
      {
        id: 'write',
        kind: 'write',
        prompt: L(
          'Write `namesOf` (every name) and `adults` (people aged 18 or over).',
          'Make `namesOf` (every name) and `adults` (people who are 18 or older).',
        ),
        starter: c(
          'function namesOf(people: { name: string }[]): string[] {',
          '  return [];',
          '}',
          '',
          'function adults(people: { name: string; age: number }[]) {',
          '  return [];',
          '}',
        ),
        solution: c(
          'function namesOf(people: { name: string }[]): string[] {',
          '  return people.map(person => person.name);',
          '}',
          '',
          'function adults(people: { name: string; age: number }[]) {',
          '  return people.filter(person => person.age >= 18);',
          '}',
        ),
        tests: [
          {
            name: 'names',
            call: 'namesOf([{ name: "Ada" }, { name: "Sam" }])',
            expect: '["Ada","Sam"]',
          },
          {
            name: 'only adults',
            call: 'adults([{ name: "Ada", age: 36 }, { name: "Kid", age: 9 }]).length',
            expect: '1',
          },
          {
            name: 'the adult is kept',
            call: 'adults([{ name: "Ada", age: 36 }, { name: "Kid", age: 9 }])[0].name',
            expect: 'Ada',
          },
        ],
        hint: L(
          'One method per function: `map` for names, `filter` for age.',
          'Use `map` to get the names, and `filter` to keep the grown-ups.',
        ),
      },
      {
        id: 'recap',
        kind: 'recap',
        prompt: L('The short version.', 'What you learned.'),
        points: LL(
          [
          '`map` transforms, `filter` keeps, `find` picks one.',
          'All three take a callback that runs once per item.',
          '`find` can return `undefined`, so check it.',
        ],
          [
            '`map` changes, `filter` keeps, `find` picks one.',
            'Each one runs your little function once for every item.',
            '`find` can give back `undefined`, so check it.',
          ],
          [
            '`map`: same length, new element type; `filter`: a subset; `find`: `T | undefined`.',
            'None of them mutate the source.',
            'Type predicates let `filter` narrow the element type.',
          ],
        ),
      },
      {
        id: 'adults',
        kind: 'write',
        bonus: true,
        prompt: L(
          'Go further: write `adultNames`: the names of people aged 18 or over, in alphabetical order.',
          'A challenge: make `adultNames` give back the grown-ups’ names, in ABC order.',
        ),
        starter: c('type Person = { name: string; age: number };', '', 'function adultNames(people: Person[]): string[] {', '  return [];', '}'),
        solution: c(
          'type Person = { name: string; age: number };',
          '',
          'function adultNames(people: Person[]): string[] {',
          '  return people',
          '    .filter((person) => person.age >= 18)',
          '    .map((person) => person.name)',
          '    .sort((a, b) => a.localeCompare(b));',
          '}',
        ),
        tests: [
          {
            name: 'adults only, sorted',
            call: 'adultNames([{ name: "Zoe", age: 30 }, { name: "Max", age: 12 }, { name: "Ada", age: 36 }])',
            expect: '["Ada","Zoe"]',
          },
          { name: 'nobody', call: 'adultNames([])', expect: '[]' },
        ],
        hint: L('`filter` the adults, `map` to names, then `sort((a, b) => a.localeCompare(b))`.', 'First keep the grown-ups, then take their names, then sort them with `localeCompare`.'),
        explain: L(
          'Each step hands a new array to the next. `map` already made a fresh array, so sorting it changes nothing the caller owns.',
          'Each tool makes a new list for the next one. Sorting the new list is safe.',
          'Chaining keeps each transformation pure; `localeCompare` gives a locale-aware comparator (pass a locale for deterministic results across devices).',
        ),
      },
    ],
    recap: LL(
      [
      '`map` → new array, same length.',
      '`filter` → new array, shorter.',
      '`find` → one item or `undefined`.',
    ],
      [
        '`map` → a new list, same length.',
        '`filter` → a new list, maybe shorter.',
        '`find` → one thing, or `undefined`.',
      ],
      [
        'Prefer declarative array methods to hand-written loops.',
        'Handle `find`\'s `undefined` explicitly.',
        'Use a type predicate when `filter` should narrow.',
      ],
    ),
  },

  {
    id: 'm03-l06-array-toolkit',
    moduleId: 'm03',
    order: 6,
    title: {
      story: 'More list tools',
      explorer: 'The array toolkit: sort, some, every, reduce',
      pro: 'Sorting, predicates and folding',
    },
    estMinutes: 7,
    difficulty: 2,
    concepts: ['array', 'sort', 'some-every', 'reduce', 'mutation'],
    objectives: LL(
      ['Sort numbers correctly with a comparator.', 'Ask yes/no questions of a whole list with `some` and `every`.', 'Add a list up with `reduce`.'],
      ['Put a list in the right order.', 'Ask "is any of them…?" and "are all of them…?"', 'Add a whole list up into one number.'],
    ),
    steps: [
      {
        id: 'read',
        kind: 'read',
        prompt: L('Four more tools for lists.', 'Four new tools for your lists.'),
        body: L(
          md(
            '```ts\nconst scores = [40, 100, 9];\nscores.sort((a, b) => a - b);        // [9, 40, 100]\nscores.some((s) => s >= 90);          // true: at least one\nscores.every((s) => s >= 10);         // false: not all\nscores.includes(40);                  // true\nscores.reduce((sum, s) => sum + s, 0); // 149\n```',
            '`sort` needs a **comparator**: a function that says which of two items comes first (a negative number means `a` first). Without one, it compares items as **text**, so `100` comes before `9`.',
            'Careful: `sort` **changes the array** it is called on. Sort a copy when the original must stay as it was: `[...scores].sort(...)`.',
          ),
          md(
            '`sort` puts a list in order. Give it a little rule: `(a, b) => a - b` means "smallest first".',
            '`some` asks "is at least one of them…?" and `every` asks "are all of them…?". Both answer `true` or `false`.',
            '`reduce` walks along the list and keeps a running total, like counting coins into a jar.',
            'Watch out: `sort` changes your list! Copy it first with `[...list]` if you want to keep the old order.',
          ),
          md(
            '`Array.prototype.sort` sorts **in place** and returns the same array; without a comparator it converts elements to strings and compares UTF-16 code units, which is why `[10, 9, 1].sort()` is `[1, 10, 9]`. The comparator returns a negative number, zero or a positive number; `a - b` is ascending for numbers, and `a.localeCompare(b)` for text. Since ES2019, `sort` is stable.',
            '`some` and `every` short-circuit, and `every` on an empty array is `true` (vacuous truth). `reduce(fn, initial)` is a left fold; always pass the initial value, or an empty array throws and the accumulator type is inferred from the element type.',
            'ES2023 adds non-mutating `toSorted`, `toReversed` and `with`. On engines without them, copy first: `[...xs].sort(cmp)`.',
          ),
        ),
      },
      {
        id: 'predict',
        kind: 'predict',
        prompt: L('Sorting without a rule. What prints?', 'Sorting with no rule… what will it show?'),
        hint: L(
          'Without a comparator, `sort` compares the numbers as text: "1", "10", "9", like words in a dictionary.',
          'Without a rule, `sort` treats the numbers like words. In a dictionary, "10" comes before "9" because "1" comes before "9".',
        ),
        code: c(
          'const numbers = [10, 9, 1];',
          'console.log([...numbers].sort());',
          'console.log([...numbers].sort((a, b) => a - b));',
        ),
        answer: c('[1,10,9]', '[1,9,10]'),
        alsoAccept: ['[1, 10, 9]\n[1, 9, 10]'],
        explain: L(
          'The default order is text order. Give `sort` a comparator for numbers: `(a, b) => a - b`.',
          'Without a rule, numbers get sorted like words. With `(a, b) => a - b` they are sorted like numbers.',
          'The default comparison is by string code units. A numeric comparator fixes it; for descending order use `b - a`.',
        ),
      },
      {
        id: 'fill',
        kind: 'fill',
        prompt: L('Did everyone pass (50 or more)?', 'Did everybody get at least 50?'),
        hint: L('You want `true` only when the test is true for *all* the scores.', 'Which tool asks "are ALL of them…?"'),
        template: c('const scores = [72, 55, 90];', 'const allPassed = scores.___((score) => score >= 50);'),
        bank: ['every', 'some', 'filter', 'map'],
        answers: ['every'],
        explain: L(
          '`every` answers "all of them?"; `some` would answer "at least one?". `filter` and `map` give back arrays, not a yes or no.',
          '`every` means "all of them". `some` means "at least one". The others give back lists, not a yes or no.',
          '`every` is the universal quantifier, `some` the existential one; both return `boolean` and stop early.',
        ),
      },
      {
        id: 'total',
        kind: 'write',
        prompt: L('Write `total` with `reduce`: it adds up all the prices.', 'Make `total` add up all the prices, using `reduce`.'),
        starter: c('function total(prices: number[]): number {', '  // start the running total at 0', '  return 0;', '}'),
        solution: c('function total(prices: number[]): number {', '  return prices.reduce((sum, price) => sum + price, 0);', '}'),
        tests: [
          { name: 'three prices', call: 'total([2, 3, 5])', expect: '10' },
          { name: 'one price', call: 'total([7])', expect: '7' },
          { name: 'empty basket', call: 'total([])', expect: '0' },
        ],
        hint: L(
          '`prices.reduce((sum, price) => sum + price, 0)`: the `0` is where the running total starts.',
          'Use `prices.reduce((sum, price) => sum + price, 0)`. The `0` is the empty jar you start with.',
        ),
        explain: L(
          'The second argument, `0`, is the starting value. It also makes an empty list give `0` instead of an error.',
          'Starting with 0 means an empty basket costs 0, instead of breaking.',
          'With an initial value, `reduce` is total over empty arrays and the accumulator is typed from it (`number`). Without one, `[].reduce(f)` throws a `TypeError`.',
        ),
      },
      {
        id: 'top',
        kind: 'write',
        prompt: L(
          'Write `topThree`: the three highest scores, highest first, **without changing** the list it is given.',
          'Make `topThree` give back the three best scores, best first, and leave the original list alone.',
        ),
        starter: c('function topThree(scores: number[]): number[] {', '  return scores.sort((a, b) => b - a).slice(0, 3);', '}'),
        solution: c('function topThree(scores: number[]): number[] {', '  return [...scores].sort((a, b) => b - a).slice(0, 3);', '}'),
        tests: [
          { name: 'best three, best first', call: 'topThree([50, 90, 70, 100])', expect: '[100,90,70]' },
          { name: 'fewer than three', call: 'topThree([3, 8])', expect: '[8,3]' },
          {
            name: 'the original list is unchanged',
            call: '(() => { const scores = [5, 1, 9, 7]; topThree(scores); return scores; })()',
            expect: '[5,1,9,7]',
          },
        ],
        hint: L(
          'The starter sorts the original array. Copy it first with `[...scores]`, then sort the copy.',
          'The starter mixes up the real list. Make a copy with `[...scores]` and sort the copy instead.',
        ),
        explain: L(
          'Copy, then sort: the caller’s array keeps its order. `b - a` sorts from highest to lowest.',
          'Copying first keeps the original list safe. `b - a` means "biggest first".',
          'Mutating an argument is a surprising side effect for callers. `[...xs].sort(cmp)` is the portable non-mutating sort; on ES2023 engines, `xs.toSorted(cmp)` says the same thing directly.',
        ),
      },
      {
        id: 'recap',
        kind: 'recap',
        prompt: L('The short version.', 'What you learned.'),
        points: LL(
          ['`sort` needs a comparator for numbers, and it changes the array.', '`some` and `every` answer yes/no questions about a whole list.', '`reduce(fn, start)` folds a list into one value.'],
          ['`sort` needs a rule, and it changes your list.', '`some` = at least one, `every` = all of them.', '`reduce` adds things up into one value.'],
          ['Default `sort` compares strings; pass a comparator and copy first.', '`every([])` is `true`; both predicates short-circuit.', 'Always give `reduce` an initial value.'],
        ),
      },
      {
        id: 'to-sorted',
        kind: 'predict',
        bonus: true,
        runtime: 'modern',
        prompt: L('Go further: `toSorted` sorts a copy. What prints?', 'A challenge: `toSorted` sorts a copy. What will it show?'),
        hint: L('`toSorted` returns a new, sorted array and leaves `original` alone.', '`toSorted` makes a sorted copy. The first list stays as it was.'),
        code: c(
          'const original = [3, 1, 2];',
          'const sorted = original.toSorted((a, b) => a - b);',
          'console.log(sorted);',
          'console.log(original);',
        ),
        answer: c('[1,2,3]', '[3,1,2]'),
        explain: L(
          '`toSorted` (2023) is `sort` without the surprise: the original keeps its order.',
          '`toSorted` is a newer tool that never changes your list.',
          '`toSorted`, `toReversed`, `toSpliced` and `with` are the ES2023 copy-returning counterparts of the mutating methods.',
        ),
        classic: {
          kind: 'predict',
          prompt: L('Sorting a copy made with spread. What prints?', 'Sorting a copy. What will it show?'),
          hint: L('`[...original]` is a new array; sorting it leaves `original` alone.', '`[...original]` is a copy. Sorting the copy does not touch the first list.'),
          code: c(
            'const original = [3, 1, 2];',
            'const sorted = [...original].sort((a, b) => a - b);',
            'console.log(sorted);',
            'console.log(original);',
          ),
          answer: c('[1,2,3]', '[3,1,2]'),
          explain: L(
            'Copy, then sort. Newer phones also have `original.toSorted(...)`, which does both in one go.',
            'Copy first, then sort. Newer phones have a shortcut called `toSorted`.',
            'The spread copy is the portable equivalent of ES2023 `toSorted`, which this device’s engine does not provide.',
          ),
        },
      },
    ],
    recap: LL(
      ['Give `sort` a comparator, and sort a copy when the original matters.', 'Use `some` and `every` for yes/no questions.', 'Use `reduce` with a starting value to total a list.'],
      ['Give `sort` a rule, and copy first.', '`some` and `every` answer yes or no.', '`reduce` adds a list up.'],
      ['Know which array methods mutate.', 'Predicates short-circuit; `every([])` is vacuously true.', 'Folds need an explicit seed.'],
    ),
  },

  {
    id: 'm03-l07-map-and-set',
    moduleId: 'm03',
    order: 7,
    title: {
      story: 'Labelled drawers and no-copies bags',
      explorer: 'Map and Set',
      pro: 'Map, Set and keyed collections',
    },
    estMinutes: 7,
    difficulty: 2,
    concepts: ['map-collection', 'set', 'generic', 'array'],
    objectives: LL(
      ['Store values by key with a `Map`.', 'Keep unique values with a `Set`.', 'Count things with a `Map<string, number>`.'],
      ['Keep things in labelled drawers.', 'Keep a bag with no copies.', 'Count how many times each word appears.'],
    ),
    steps: [
      {
        id: 'read',
        kind: 'read',
        prompt: L('Two collections made for looking things up.', 'Two new kinds of collection.'),
        body: L(
          md(
            'A **Map** stores values under keys:',
            '```ts\nconst ages = new Map<string, number>();\nages.set("Ada", 36);\nages.get("Ada");   // 36\nages.get("Bo");    // undefined\nages.has("Ada");   // true\nages.size;         // 1\n```',
            'A **Set** keeps each value once, however many times you add it:',
            '```ts\nconst tags = new Set(["ts", "js", "ts"]);\ntags.size;          // 2\ntags.has("js");     // true\nconst unique = [...tags]; // ["ts", "js"]\n```',
            'Notice `get` can return `undefined`: the key might not be there. TypeScript makes you handle that.',
          ),
          md(
            'A **Map** is a chest of drawers with labels. You put a value in the drawer labelled "Ada" and find it again by that label.',
            'A **Set** is a bag that never keeps copies. Put "ts" in twice and it is still only in there once.',
            'If you ask for a drawer that does not exist, you get `undefined`: nothing there.',
          ),
          md(
            '`Map<K, V>` keys by SameValueZero equality, so any value (objects included) can be a key, insertion order is preserved, and `size` is O(1). Prefer it to a plain object for dynamic keys: no prototype keys, no string coercion of keys, and fast add/delete.',
            '`get` returns `V | undefined`; narrow with `has` plus a check, or use `??`. `Set<T>` gives O(1) membership and de-duplication: `[...new Set(xs)]` keeps first occurrences in order.',
            'Neither serialises with `JSON.stringify` (both print `{}`); convert with `Object.fromEntries(map)` or `[...set]`. ES2025 adds set algebra (`union`, `intersection`), not yet on every engine.',
          ),
        ),
      },
      {
        id: 'predict',
        kind: 'predict',
        prompt: L('What prints?', 'What will it show?'),
        hint: L(
          'The Set drops the second `"cat"`. The Map has `"cat"` but not `"dog"`.',
          'The bag keeps only one "cat". The chest has a "cat" drawer but no "dog" drawer.',
        ),
        code: c(
          'const pets = new Set(["cat", "fish", "cat"]);',
          'console.log(pets.size);',
          'const legs = new Map<string, number>([["cat", 4], ["fish", 0]]);',
          'console.log(legs.get("cat"), legs.get("dog"));',
        ),
        answer: c('2', '4 undefined'),
        explain: L(
          'A Set keeps one of each value, so the size is 2. A missing key gives `undefined`.',
          'The bag has two different pets. The "dog" drawer does not exist, so you get `undefined`.',
          'Set membership de-duplicates by SameValueZero; `Map.get` for an absent key is `undefined`, reflected in its `V | undefined` return type.',
        ),
      },
      {
        id: 'choose',
        kind: 'check',
        prompt: L('You need to count how often each word appears in a text. Which fits best?', 'You want to count how many times each word appears. Which is best?'),
        hint: L('You need to go from a word to a number, and add new words as they turn up.', 'You need a label (the word) and a number for each label.'),
        explain: L(
          'A `Map<string, number>` maps each word to its count and handles any word, including ones like `"constructor"` that clash with object properties.',
          'A Map is perfect: each word is a label, and its drawer holds the count.',
          '`Map<string, number>` is the idiomatic counter: dynamic keys, no prototype collisions, `size` for the number of distinct words.',
        ),
        choices: [
          { id: 'map', text: L('A `Map<string, number>`'), correct: true },
          { id: 'set', text: L('A `Set<string>`'), correct: false, feedback: L('A Set knows *which* words appear, but not how many times.', 'A bag knows which words are there, but not how many of each.') },
          { id: 'array', text: L('A `string[]`'), correct: false, feedback: L('A plain list can hold the words, but counting means searching it again and again.', 'A list would work, but you would have to count by hand each time.') },
        ],
      },
      {
        id: 'count',
        kind: 'write',
        prompt: L('Write `countWords`: a Map from each word to how often it appears.', 'Make `countWords` count each word with a Map.'),
        starter: c(
          'function countWords(words: string[]): Map<string, number> {',
          '  const counts = new Map<string, number>();',
          '  // for each word: previous count (or 0) plus one',
          '  return counts;',
          '}',
        ),
        solution: c(
          'function countWords(words: string[]): Map<string, number> {',
          '  const counts = new Map<string, number>();',
          '  for (const word of words) {',
          '    counts.set(word, (counts.get(word) ?? 0) + 1);',
          '  }',
          '  return counts;',
          '}',
        ),
        tests: [
          { name: 'counts repeats', call: '[...countWords(["a", "b", "a"]).entries()]', expect: '[["a",2],["b",1]]' },
          { name: 'count of one word', call: 'countWords(["hi", "hi", "hi"]).get("hi")', expect: '3' },
          { name: 'no words', call: 'countWords([]).size', expect: '0' },
        ],
        hint: L(
          'Loop with `for (const word of words)`. `counts.get(word) ?? 0` is the count so far; set it to that plus one.',
          'Go through each word. `counts.get(word) ?? 0` is how many you have so far (0 if none). Put back that number plus one.',
        ),
        explain: L(
          '`?? 0` turns "not counted yet" (`undefined`) into 0, which also satisfies the type checker.',
          '`?? 0` means "if the drawer is empty, start at 0".',
          '`get` returns `number | undefined`; `?? 0` narrows it to `number` without a non-null assertion. The Map keeps first-insertion order for the entries.',
        ),
      },
      {
        id: 'unique',
        kind: 'write',
        prompt: L('Write `unique`: the list without repeats, in first-seen order.', 'Make `unique` give back the list with no copies.'),
        starter: c('function unique(items: string[]): string[] {', '  return items;', '}'),
        solution: c('function unique(items: string[]): string[] {', '  return [...new Set(items)];', '}'),
        tests: [
          { name: 'drops repeats', call: 'unique(["red", "blue", "red", "green", "blue"])', expect: '["red","blue","green"]' },
          { name: 'already unique', call: 'unique(["a", "b"])', expect: '["a","b"]' },
          { name: 'empty', call: 'unique([])', expect: '[]' },
        ],
        hint: L('Put the items in a `Set`, then spread it back into an array: `[...new Set(items)]`.', 'Pour the list into a no-copies bag (`new Set(items)`), then tip it out into a list with `[...]`.'),
        explain: L(
          'A Set keeps the first of each value, in order; spreading turns it back into an array.',
          'The bag throws copies away and remembers the order things went in.',
          '`[...new Set(xs)]` is the idiomatic O(n) de-duplication for primitives (objects are compared by reference).',
        ),
      },
      {
        id: 'recap',
        kind: 'recap',
        prompt: L('The short version.', 'What you learned.'),
        points: LL(
          ['`Map<K, V>` stores values by key; `get` may return `undefined`.', '`Set<T>` keeps each value once.', '`[...new Set(items)]` removes repeats.'],
          ['A Map is a chest of labelled drawers.', 'A Set is a bag with no copies.', 'Empty drawers give `undefined`, so check first.'],
          ['Prefer `Map` to objects for dynamic keys.', 'Handle `V | undefined` from `get` with `??` or a check.', 'Convert Maps and Sets before `JSON.stringify`.'],
        ),
      },
    ],
    recap: LL(
      ['Use `Map` to look values up by key.', 'Use `Set` for uniqueness and fast "is it in there?" checks.', 'Missing keys give `undefined`: handle it.'],
      ['Maps have labelled drawers.', 'Sets never keep copies.', 'Always check a drawer might be empty.'],
      ['Keyed collections beat objects for dynamic keys.', 'Membership checks on a Set are O(1).', 'Mind serialisation: Maps and Sets are not JSON.'],
    ),
  },
];

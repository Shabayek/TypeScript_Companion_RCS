import { L, LL, bullets, c, md } from '../authoring';
import type { Lesson } from '../schema';

export const M01_LESSONS: readonly Lesson[] = [
  {
    id: 'm01-l01-strings',
    moduleId: 'm01',
    order: 1,
    title: {
      story: 'Strings: the words',
      explorer: 'Strings, and what you can do with them',
      pro: 'String values and operations',
    },
    estMinutes: 5,
    concepts: ['string', 'operator', 'variable'],
    steps: [
      {
        id: 'read',
        kind: 'read',
        prompt: L('A string is text in quotes.', 'Words in code are called strings. They go in quotes.'),
        body: L(
          md(
            'A **string** is text. You write it inside quotes, and it can be as short as `""` or as long as a paragraph.',
            'Strings come with useful tools attached:',
            bullets(
              '`.length` counts the characters.',
              '`.toUpperCase()` returns a shouting copy.',
              '`.includes("x")` asks whether a piece of text is inside.',
            ),
            'None of those tools change the original. They hand you a new string.',
          ),
          md(
            'A string is text wearing a pair of quotes, like `"hello"`.',
            'Strings come with tools. `.length` counts letters. `.toUpperCase()` shouts the text back.',
            'The tools give you a **new** string. The old one stays exactly as it was.',
          ),
          md(
            '`string` is an immutable primitive: every method returns a new value. `.length`, `.toUpperCase()`, `.includes()`, `.slice()`, `.trim()` and `.split()` cover most daily work.',
            'Concatenation with `+` converts the other operand to a string (`"n=" + 1` is `"n=1"`). Convenient, and also where `"36" + 1 === "361"` comes from: one more reason to keep numbers and strings apart in your types.',
            'Strings compare by value: two strings with the same characters are `===`.',
          ),
        ),
      },
      {
        id: 'predict',
        kind: 'predict',
        prompt: L('`+` joins text. What prints?', '`+` sticks words together. What will it show?'),
        hint: L(
          'First the two pieces are joined into one word. Then `.length` counts it, and the next line prints the word.',
          'First the two words become one. Then the robot counts its letters, and then shows the word.',
        ),
        code: c(
          'const word = "Type" + "Script";',
          'console.log(word.length);',
          'console.log(word);',
        ),
        answer: c('10', 'TypeScript'),
        explain: L(
          '`+` glues the two pieces into `TypeScript`. Counting the letters gives 10, and then the word itself prints.',
          '`+` sticks "Type" and "Script" into `TypeScript`. That has 10 letters, and then the word itself is shown.',
          'Concatenation produces `"TypeScript"`, ten UTF-16 code units. The two `console.log` calls print in statement order: the length first, then the string.',
        ),
      },
      {
        id: 'spot',
        kind: 'check',
        prompt: L('Which line gives you a string?', 'Which line makes a string?'),
        hint: L(
          'Strings are text in quotes. Look for the quotes.',
          'Look for the one with quotes around it.',
        ),
        explain: L(
          'Quotes make a string. `7` is a number, and `true` is a boolean.',
          'Quotes make a string. `7` on its own is a number, and `true` is a yes-or-no value.',
          'The literal decides the type: quotes make a `string`, a bare numeral a `number`, `true` a `boolean`. On a `const`, TypeScript infers the literal types `"7"`, `7` and `true`.',
        ),
        choices: [
          { id: 'a', text: L('`const x = 7;`'), correct: false, feedback: L(
            'That is a number. No quotes.',
            'That is a number. There are no quotes.',
          ) },
          { id: 'b', text: L('`const x = "7";`'), correct: true },
          { id: 'c', text: L('`const x = true;`'), correct: false, feedback: L(
            'That is a boolean: true or false.',
            'That is a yes-or-no value (a boolean): true or false.',
          ) },
        ],
      },
      {
        id: 'write',
        kind: 'write',
        prompt: L(
          'Write `greet` so it returns `Hello, ` followed by the name.',
          'Make `greet` give back `Hello, ` and then the name.',
        ),
        starter: c('function greet(name: string): string {', '  // finish this line', '  return "";', '}'),
        solution: c('function greet(name: string): string {', '  return "Hello, " + name;', '}'),
        entry: 'greet',
        tests: [
          { name: 'greet("Ada")', call: 'greet("Ada")', expect: 'Hello, Ada' },
          { name: 'greet("Sam")', call: 'greet("Sam")', expect: 'Hello, Sam' },
          { name: 'works with an empty name', call: 'greet("")', expect: 'Hello, ' },
        ],
        hint: L(
          'You need a return statement that joins the greeting and the parameter.',
          'Use `return` and `+` to stick "Hello, " and `name` together.',
        ),
        strongHint: L(
          '`return "Hello, " + name;` — the space after the comma matters.',
          'Write `return "Hello, " + name;` — keep the space after the comma.',
        ),
        explain: L(
          '`+` joins two strings into one. The parameter `name` is already a string, so no conversion is needed.',
          '`+` sticks two strings into one. `name` is already a string, so they fit together.',
          'Both operands are `string`, so `+` is plain concatenation and the return type would be inferred as `string` anyway. The annotation documents the contract and catches a wrong branch early.',
        ),
      },
      {
        id: 'recap',
        kind: 'recap',
        prompt: L('The short version.', 'What you learned.'),
        points: LL(
          [
          'Strings are text in quotes.',
          '`+` joins strings; `.length` counts characters.',
          'String tools return a new string; they do not change the old one.',
        ],
          [
            'Strings are words in quotes.',
            '`+` sticks strings together; `.length` counts letters.',
            'String tools make a new string. The old one stays the same.',
          ],
          [
            '`string` is an immutable primitive; its methods return new strings.',
            '`+` concatenates and converts the other operand to a string.',
            'Strings compare by value with `===`.',
          ],
        ),
      },
    ],
    recap: LL(
      [
      'Strings are text inside quotes.',
      'Use `.length`, `.toUpperCase()` and `+`.',
      'Tools return new text instead of changing the original.',
    ],
      [
        'Words in code are strings, in quotes.',
        '`.length`, `.toUpperCase()` and `+` are string tools.',
        'The tools make new words and leave the old ones alone.',
      ],
      [
        'Treat strings as values: no method mutates them.',
        'Keep numbers and strings apart in your types to avoid accidental concatenation.',
        'Know the core methods: `length`, `includes`, `slice`, `trim`, `split`.',
      ],
    ),
  },

  {
    id: 'm01-l02-numbers',
    moduleId: 'm01',
    order: 2,
    title: {
      story: 'Numbers that count',
      explorer: 'Numbers and arithmetic',
      pro: 'Numeric values, operators and rounding',
    },
    estMinutes: 5,
    concepts: ['number', 'operator'],
    steps: [
      {
        id: 'read',
        kind: 'read',
        prompt: L('Numbers are numbers. No quotes.', 'Numbers are just numbers. No quotes!'),
        body: L(
          md(
            'TypeScript has one **number** type for whole numbers and decimals alike: `7`, `-3`, `2.5`.',
            'The operators are the ones you already know: `+ - * /`. There is also `%`, which gives the remainder: `10 % 3` is `1`.',
            'A decimal answer is normal. `7 / 2` is `3.5`, not `3`. If you need a whole number, ask for one: `Math.round(7 / 2)`.',
          ),
          md(
            'Numbers do not wear quotes. `7` is a number. `"7"` is text that happens to look like one.',
            'You can add `+`, subtract `-`, multiply `*`, and divide `/`.',
            'Dividing does not throw away the decimal: half of 7 is 3.5.',
          ),
          md(
            '`number` is an IEEE 754 double: there is no separate integer type. Integers are exact up to `Number.MAX_SAFE_INTEGER` (2^53 − 1); beyond that, use `bigint` (`10n`).',
            'Division never truncates: `7 / 2` is `3.5`. `Math.floor`, `Math.trunc` and `Math.round` give integers and differ on negative numbers. `%` is a remainder, not a modulo: `-7 % 3` is `-1`.',
            'Floating point is binary, so `0.1 + 0.2` is `0.30000000000000004`. For money, store integer cents and format at the edges.',
          ),
        ),
      },
      {
        id: 'predict',
        kind: 'predict',
        prompt: L('What do these two lines print?', 'What will these two lines show?'),
        hint: L(
          '`/` divides and keeps any decimal part. `%` gives the remainder after dividing.',
          '`/` shares a number out. `%` says how much is left over.',
        ),
        code: c('console.log(7 / 2);', 'console.log(10 % 3);'),
        answer: c('3.5', '1'),
        explain: L(
          'Division keeps the decimal part, so `7 / 2` is `3.5`. `%` gives the remainder after dividing: 10 fits 3 threes, with 1 left over.',
          '`7 / 2` shares 7 into two equal parts: 3.5 each. `%` tells you what is left over: 10 makes three groups of 3, with 1 left.',
          '`/` is floating-point division, so `7 / 2` is `3.5`. `%` is the remainder with the sign of the dividend: `10 % 3` is `1`, and `-10 % 3` would be `-1`.',
        ),
      },
      {
        id: 'fill',
        kind: 'fill',
        prompt: L('Fill in the operator that halves a number.', 'Pick the sign that cuts a number in half.'),
        hint: L(
          'Halving means dividing by 2. Which operator divides?',
          'Cutting in half means sharing between 2. Which sign shares?',
        ),
        template: c('const half = 10 ___ 2;', 'console.log(half); // 5'),
        bank: ['/', '*', '+', '-'],
        answers: ['/'],
        explain: L(
          'Division is `/`. `10 / 2` is `5`.',
          'Dividing uses `/`. `10 / 2` is `5`.',
          '`/` always produces a double; `10 / 2` is exactly `5` because the result is representable. Use `Math.trunc(a / b)` when you need integer division.',
        ),
      },
      {
        id: 'write',
        kind: 'write',
        prompt: L(
          'Write `area` so it returns width multiplied by height.',
          'Make `area` give back the width times the height.',
        ),
        starter: c(
          'function area(width: number, height: number): number {',
          '  // return the area',
          '  return 0;',
          '}',
        ),
        solution: c(
          'function area(width: number, height: number): number {',
          '  return width * height;',
          '}',
        ),
        tests: [
          { name: 'area(3, 4)', call: 'area(3, 4)', expect: '12' },
          { name: 'area(2, 2)', call: 'area(2, 2)', expect: '4' },
          { name: 'handles decimals', call: 'area(1.5, 2)', expect: '3' },
        ],
        hint: L(
          'Multiply the two parameters and return the result.',
          'Multiply the two numbers with `*` and give back the answer with `return`.',
        ),
      },
      {
        id: 'recap',
        kind: 'recap',
        prompt: L('The short version.', 'What you learned.'),
        points: LL(
          [
          'Numbers need no quotes.',
          '`+ - * /` work as expected; `%` gives the remainder.',
          'Division keeps decimals unless you round.',
        ],
          [
            'Numbers do not need quotes.',
            '`+ - * /` work like in maths; `%` finds what is left over.',
            'Dividing can give a number with a dot, like 3.5.',
          ],
          [
            'One `number` type, a 64-bit float; `bigint` for larger integers.',
            '`/` never truncates; `%` keeps the sign of the dividend.',
            'Round deliberately, and store money as integer cents.',
          ],
        ),
      },
      {
        id: 'average',
        kind: 'write',
        bonus: true,
        prompt: L('Go further: write `average` so it rounds to one decimal place.', 'A challenge: make `average` give the middle value, rounded to one decimal.'),
        starter: c('function average(values: number[]): number {', '  return 0;', '}'),
        solution: c(
          'function average(values: number[]): number {',
          '  if (values.length === 0) return 0;',
          '  let sum = 0;',
          '  for (const value of values) sum += value;',
          '  return Math.round((sum / values.length) * 10) / 10;',
          '}',
        ),
        tests: [
          { name: 'whole result', call: 'average([2, 4, 6])', expect: '4' },
          { name: 'one decimal', call: 'average([1, 2])', expect: '1.5' },
          { name: 'rounded', call: 'average([1, 1, 2])', expect: '1.3' },
          { name: 'empty list', call: 'average([])', expect: '0' },
        ],
        hint: L(
          'Add the values, divide by `values.length`, then `Math.round(x * 10) / 10` keeps one decimal. Guard the empty list first.',
          'Add them all up and divide by how many there are. To keep one decimal: times 10, round, divide by 10. An empty list gives 0.',
        ),
        explain: L(
          '`Math.round` only rounds to whole numbers, so scale up by 10, round, and scale back down.',
          'Rounding works on whole numbers, so we make the number 10 times bigger, round it, then make it small again.',
          '`Math.round(x * 10) / 10` rounds half-up at one decimal; for display prefer `toFixed(1)` (a string) or `Intl.NumberFormat`, and remember binary floating point cannot represent most decimals exactly.',
        ),
      },
    ],
    recap: LL(
      [
      'Numbers are written bare: `7`, not `"7"`.',
      '`%` is the remainder operator.',
      'Round on purpose with `Math.round`.',
    ],
      [
        'Write numbers without quotes: `7`, not `"7"`.',
        '`%` finds what is left over.',
        '`Math.round` turns 3.5 into a whole number.',
      ],
      [
        '`number` is a double; integers are exact only up to 2^53 − 1.',
        '`0.1 + 0.2 !== 0.3`: compare with a tolerance, or use integers.',
        '`Math.round`, `Math.floor` and `Math.trunc` differ on negatives.',
      ],
    ),
  },

  {
    id: 'm01-l03-let-and-const',
    moduleId: 'm01',
    order: 3,
    title: {
      story: 'Boxes that change, boxes that do not',
      explorer: 'let, const, and letting TypeScript guess',
      pro: 'Bindings, immutability and inference',
    },
    estMinutes: 6,
    concepts: ['let', 'const', 'inference', 'annotation', 'variable'],
    steps: [
      {
        id: 'read',
        kind: 'read',
        prompt: L('Use `const` unless the value changes.', 'Use `const` unless the value will change.'),
        body: L(
          md(
            'Two words create a name: `const` and `let`.',
            bullets(
              '`const` means this name always points at this value.',
              '`let` means the value will be replaced later.',
            ),
            'Start with `const`. It is true more often than people expect, and it tells the next reader something useful.',
            'You almost never need to write the type. `const age = 36` already tells TypeScript it is a number. That is **inference**, and it is usually better than a hand-written **annotation**.',
          ),
          md(
            '`const` boxes never get a new thing put inside. `let` boxes can be emptied and refilled.',
            'Most boxes never need to change, so start with `const`. If you later find out you need to swap the value, change the word to `let`.',
            'You also do not need to write the type. The computer can see that `36` is a number.',
          ),
          md(
            '`const` prevents *reassignment* of the binding, not mutation of the value: a `const` array can still be `push`ed. `let` and `const` are block-scoped and unusable before their declaration (the temporal dead zone); avoid `var`, which is function-scoped and hoisted.',
            'Inference is flow-based. `const city = "Lagos"` has the literal type `"Lagos"`; `let city = "Lagos"` widens to `string`, because it may change. That difference is what makes literal unions work (Module 5).',
            'Annotate where inference cannot see intent (parameters, exported functions, public APIs) and let it handle locals.',
          ),
        ),
        figure: 'let-const',
      },
      {
        id: 'compare',
        kind: 'compare',
        prompt: L('Same value, two levels of detail.', 'The same box, with a label and without.'),
        left: {
          title: 'Annotated',
          code: c('const city: string = "Lagos";'),
          caption: L(
            'Correct, but the type is already obvious from the value.',
            'This works, but the label is not needed: the value already says it is a number.',
          ),
        },
        right: {
          title: 'Inferred',
          code: c('const city = "Lagos";'),
          caption: L(
            'Shorter, and just as safe. Add annotations at the edges of functions instead.',
            'Shorter, and just as safe. TypeScript works the label out for you.',
          ),
        },
      },
      {
        id: 'choose',
        kind: 'check',
        prompt: L('Which one should be `const`?', 'Which ones are right?'),
        hint: L(
          'Ask of each line: is the value ever replaced later? `const` cannot be reassigned.',
          'Does the value change later? `const` boxes can never change.',
        ),
        explain: L(
          '`host` never changes, so `const` says so. `count` is replaced on the next line, so it needs `let`.',
          '`host` never changes, so it is a `const`. `count` gets a new value on the next line, so it needs `let`.',
          '`host` is never reassigned, so `const` documents and enforces that. `count` is reassigned and needs `let`. The third option does not compile: TS2588, `Cannot assign to \'total\' because it is a constant`.',
        ),
        choices: [
          {
            id: 'host',
            text: L('`const host = "localhost";` — never reassigned'),
            correct: true,
          },
          {
            id: 'count',
            text: L('`let count = 0; count = count + 1;` — reassigned'),
            correct: true,
          },
          {
            id: 'wrong',
            text: L("`const total = 0; total = total + 5;`"),
            correct: false,
            feedback: L(
              'That is an error: `const` cannot be reassigned. Use `let` if the total really changes.',
              'This breaks: a `const` box cannot get a new value. Use `let` if it changes.',
            ),
          },
        ],
        multi: true,
      },
      {
        id: 'predict',
        kind: 'predict',
        prompt: L('What prints?', 'What will it show?'),
        hint: L(
          'Follow `score` line by line: what is it after the second line? `bonus` takes that value.',
          'Follow the box `score`: 5, then add 2. `bonus` copies it.',
        ),
        code: c('let score = 5;', 'score = score + 2;', 'const bonus = score;', 'console.log(bonus);'),
        answer: '7',
        explain: L(
          '`score` starts at 5, then becomes 7. `bonus` copies that 7.',
          '`score` starts at 5, then becomes 7. `bonus` gets a copy of that 7.',
          'Numbers are primitives, copied by value: `bonus` receives `7`, and later changes to `score` would not affect it. Objects behave differently; they are shared by reference (Module 3).',
        ),
      },
      {
        id: 'write',
        kind: 'write',
        prompt: L(
          'Write `totalFor` so it returns price × quantity.',
          'Make `totalFor` give back the price times how many.',
        ),
        starter: c(
          'function totalFor(price: number, quantity: number): number {',
          '  // use a const for the total',
          '  return 0;',
          '}',
        ),
        solution: c(
          'function totalFor(price: number, quantity: number): number {',
          '  const total = price * quantity;',
          '  return total;',
          '}',
        ),
        tests: [
          { name: 'totalFor(2.5, 4)', call: 'totalFor(2.5, 4)', expect: '10' },
          { name: 'totalFor(3, 3)', call: 'totalFor(3, 3)', expect: '9' },
          { name: 'totalFor(0, 5)', call: 'totalFor(0, 5)', expect: '0' },
        ],
        hint: L(
          'Create a `const` holding the multiplication, then return it.',
          'Make a `const` that holds the multiplication, then `return` it.',
        ),
      },
      {
        id: 'recap',
        kind: 'recap',
        prompt: L('The short version.', 'What you learned.'),
        points: LL(
          [
          '`const` for values that stay; `let` for values that change.',
          'Let TypeScript infer types from the value.',
          'Annotate function parameters and return types, not local variables.',
        ],
          [
            '`const` for boxes that stay the same; `let` for boxes that change.',
            'TypeScript can work out the label from the value.',
            'Functions get labels for what goes in and what comes out.',
          ],
          [
            '`const` forbids reassignment, not mutation.',
            '`let` and `const` are block-scoped; leave `var` behind.',
            '`const` infers literal types, `let` widens; annotate the boundaries.',
          ],
        ),
      },
      {
        id: 'literal',
        kind: 'predictType',
        bonus: true,
        prompt: L('Go further: what type does TypeScript give `city`?', 'A challenge: what type does TypeScript give `city`?'),
        hint: L(
          'A `const` can never change, so TypeScript can be more precise than `string`.',
          '`city` can never change. So TypeScript knows exactly which word is in it.',
        ),
        code: c('const city = "Lagos";', 'let town = "Accra";', 'console.log(city, town);'),
        target: 'city',
        answer: '"Lagos"',
        explain: L(
          'A `const` gets the *literal* type `"Lagos"`: that exact text and nothing else. The `let` gets `string`, because it may change later.',
          '`city` is a `const`, so its type is exactly `"Lagos"`. `town` is a `let`, so it could change: its type is just `string`.',
          'Literal widening: `const` declarations keep the literal type, while mutable `let` bindings widen to the primitive. `as const` extends the same idea to objects and arrays.',
        ),
      },
    ],
    recap: LL(
      [
      'Reach for `const` first.',
      '`let` is for values that are genuinely replaced.',
      'Inference handles the obvious cases; annotate the edges.',
    ],
      [
        'Pick `const` first.',
        'Use `let` only when the value really changes.',
        'TypeScript often guesses the label for you.',
      ],
      [
        'Default to `const`; use `let` only for real reassignment.',
        'Inference gives `const` a literal type and widens `let`.',
        'Annotate parameters and exports; let locals infer.',
      ],
    ),
  },

  {
    id: 'm01-l04-template-literals',
    moduleId: 'm01',
    order: 4,
    title: {
      story: 'Text with holes in it',
      explorer: 'Template literals',
      pro: 'Template literals and interpolation',
    },
    estMinutes: 5,
    concepts: ['template-literal', 'string'],
    steps: [
      {
        id: 'read',
        kind: 'read',
        prompt: L('Backticks let you drop values into text.', 'Backticks let you put values inside words.'),
        body: L(
          md(
            'A **template literal** uses backticks instead of quotes. Inside it, `${...}` runs a small expression and puts the result into the text.',
            '```ts\nconst name = "Ada";\nconst message = `Hi, ${name}!`;\n```',
            'Compared with `"Hi, " + name + "!"`, the template version keeps the shape of the sentence visible. For anything with more than one value, prefer it.',
          ),
          md(
            'Backticks are special quotes with a slot in them. Whatever you put in the `${...}` slot gets printed inside the sentence.',
            '```ts\nconst name = "Ada";\nconst message = `Hi, ${name}!`;\n```',
            'This is much tidier than gluing pieces together with `+`.',
          ),
          md(
            'Template literals (backticks) support interpolation with `${expr}` and literal line breaks. Each value is converted to a string much like `String(value)`, so an object becomes `"[object Object]"`: format it yourself, for example with `JSON.stringify`.',
            'Any expression works inside `${…}`, including calls and ternaries, but keep it short; a named variable reads better than logic inside a string.',
            'TypeScript also has *template literal types*, such as ``type Id = `user-${number}` ``, which reuse the same syntax at the type level.',
          ),
        ),
      },
      {
        id: 'predict',
        kind: 'predict',
        prompt: L('What is printed?', 'What will it show?'),
        hint: L(
          'Replace each `${...}` with the value of the name inside it. Keep every other character as written.',
          'Fill each hole `${...}` with what is in the box of that name.',
        ),
        code: c(
          'const name = "Ada";',
          'const score = 7;',
          'console.log(`${name} scored ${score} points`);',
        ),
        answer: 'Ada scored 7 points',
        explain: L(
          'Each `${...}` is replaced by the value inside it. The rest of the text, including the spaces, stays exactly as written.',
          'Each `${...}` is a hole. The value fills the hole, and the other words stay just as they are.',
          'Each `${…}` is evaluated and converted to a string; the literal text around it, whitespace included, is kept verbatim. The number `7` becomes `"7"`.',
        ),
      },
      {
        id: 'fill',
        kind: 'fill',
        prompt: L('Put the name into the sentence.', 'Put the name into the sentence.'),
        hint: L(
          'The value lives in a variable. Which variable holds the name?',
          'Which box holds "Sam"? Put its name in the hole.',
        ),
        template: c('const name = "Sam";', 'const message = `Hello, ${___}!`;'),
        bank: ['name', '"name"', 'Sam', 'message'],
        answers: ['name'],
        explain: L(
          'Inside `${...}` you write an expression, not a string. `name` refers to the variable; `"name"` would print the word "name".',
          'Inside `${...}` you write the box name, without quotes. `name` means "what is in the box"; `"name"` would just show the word name.',
          'The content of `${…}` is an expression evaluated in the current scope, so `name` resolves to the binding. A string literal there, `${"name"}`, would just insert that text.',
        ),
      },
      {
        id: 'write',
        kind: 'write',
        prompt: L(
          'Write `label` so it returns `Ada scored 7 points`.',
          'Make `label` give back `Ada scored 7 points`.',
        ),
        starter: c(
          'function label(name: string, score: number): string {',
          '  // one template literal is enough',
          '  return "";',
          '}',
        ),
        solution: c(
          'function label(name: string, score: number): string {',
          '  return `${name} scored ${score} points`;',
          '}',
        ),
        tests: [
          { name: 'label("Ada", 7)', call: 'label("Ada", 7)', expect: 'Ada scored 7 points' },
          { name: 'label("Sam", 0)', call: 'label("Sam", 0)', expect: 'Sam scored 0 points' },
        ],
        hint: L(
          'Use backticks, and put each parameter inside its own `${...}`.',
          'Use backticks, and put each value in its own `${...}` hole.',
        ),
        strongHint: L(
          '`return `${name} scored ${score} points`;`',
          'Write return, then backticks around: `${name} scored ${score} points`.',
        ),
      },
      {
        id: 'recap',
        kind: 'recap',
        prompt: L('The short version.', 'What you learned.'),
        points: LL(
          [
          'Backticks make a template literal.',
          '`${...}` inserts a value into the text.',
          'Any expression works inside the braces, including maths.',
        ],
          [
            'Backticks make text with holes.',
            '`${...}` is a hole for a value.',
            'You can even do maths inside a hole.',
          ],
          [
            'Backticks enable interpolation and multi-line strings.',
            '`${expr}` evaluates any expression and converts the result to a string.',
            'Objects become `[object Object]`; format them explicitly.',
          ],
        ),
      },
      {
        id: 'greeting-type',
        kind: 'types',
        bonus: true,
        prompt: L(
          'Go further: template literals work for types too. Make `Greeting` accept only text that starts with `"Hello, "`.',
          'A challenge: types can have holes too! Make `Greeting` only allow words that start with `"Hello, "`.',
        ),
        hint: L('Use a template literal type: `` `Hello, ${string}` ``.', 'Write the type with backticks and a hole: `` `Hello, ${string}` ``.'),
        starter: c('type Greeting = string;'),
        solution: c('type Greeting = `Hello, ${string}`;'),
        typeTests: [
          { name: 'a proper greeting', code: 'const ok: Greeting = "Hello, Ada";' },
          { name: 'another one', code: 'const also: Greeting = "Hello, world";' },
          { name: 'refuses other text', code: 'const rude: Greeting = "Hi Ada";', expect: 'error' },
        ],
        explain: L(
          'A template literal *type* describes a pattern of text. `${string}` is a hole that any text fits.',
          'The type has a hole, just like a template literal. Any words fit in the hole, but the start must be "Hello, ".',
          'Template literal types (TS 4.1) compose literal and primitive types into string patterns; they power typed routes, CSS units and event names.',
        ),
      },
    ],
    recap: LL(
      [
      'Backticks, not quotes.',
      '`${...}` is the slot for a value.',
      'Templates read better than long `+` chains.',
    ],
      [
        'Use backticks, not quotes.',
        '`${...}` is the hole for a value.',
        'Holes are easier to read than lots of `+`.',
      ],
      [
        'Prefer template literals to `+` chains whenever values are involved.',
        'Keep interpolated expressions small.',
        'Template literal *types* reuse the syntax at the type level.',
      ],
    ),
  },

  {
    id: 'm01-l05-string-methods',
    moduleId: 'm01',
    order: 5,
    title: {
      story: 'Word tools',
      explorer: 'String methods',
      pro: 'String methods and immutability',
    },
    estMinutes: 6,
    concepts: ['string', 'string-method', 'immutability'],
    objectives: LL(
      ['Measure and search text with `length` and `includes`.', 'Cut text with `slice`, split it with `split`, glue it with `join`.', 'Tidy text with `trim` and case changes.'],
      ['Count letters and look for words.', 'Cut words up and glue them back together.', 'Tidy up messy text.'],
    ),
    steps: [
      {
        id: 'read',
        kind: 'read',
        prompt: L('Text comes with its own tools.', 'Words come with a toolbox!'),
        body: L(
          md(
            'Every string has **methods**: small tools you call with a dot.',
            '```ts\nconst title = "  Hello, TypeScript  ";\ntitle.length;          // 21\ntitle.trim();          // "Hello, TypeScript"\ntitle.includes("Type"); // true\ntitle.trim().slice(0, 5); // "Hello"\n"a,b,c".split(",");    // ["a", "b", "c"]\n["a", "b"].join(" + ");  // "a + b"\n```',
            'One rule to remember: these tools **never change the original string**. They give you back a new one, so keep the result in a variable or use it straight away.',
          ),
          md(
            'Words have tools you can use with a dot: `word.length` counts the letters, `word.toUpperCase()` makes them BIG.',
            '`slice` cuts out a piece, `split` chops a sentence into a list, and `join` glues a list back into one piece of text.',
            'The tools never change your word. They make a new one for you, like a photocopier.',
          ),
          md(
            'Strings are immutable primitives: every method returns a new string, and `s.toUpperCase()` on its own line is a no-op. Chain the calls instead: `input.trim().toLowerCase()`.',
            '`slice(start, end)` takes an exclusive end and accepts negative indices from the end. `split` with a string or regex returns `string[]`, and `join` is its inverse. `includes`, `startsWith` and `endsWith` return booleans; `indexOf` returns `-1` when nothing is found.',
            '`length` counts UTF-16 code units, not characters: `"👋".length` is `2`. For user-visible characters, iterate with `for…of` or use `Intl.Segmenter`.',
          ),
        ),
      },
      {
        id: 'predict',
        kind: 'predict',
        prompt: L('What prints?', 'What will it show?'),
        hint: L(
          '`trim` removes the spaces at both ends first. `slice(0, 4)` keeps positions 0, 1, 2 and 3.',
          'First the spaces at the ends are swept away. Then `slice(0, 4)` keeps the first four letters.',
        ),
        code: c(
          'const word = "  TypeScript  ";',
          'console.log(word.trim().length);',
          'console.log(word.trim().slice(0, 4));',
          'console.log("red,green,blue".split(",").join(" + "));',
        ),
        answer: c('10', 'Type', 'red + green + blue'),
        explain: L(
          '`"TypeScript"` has 10 letters once the spaces are gone; `slice(0, 4)` stops *before* index 4; `split` makes a list and `join` glues it back with a new separator.',
          'Without the spaces, "TypeScript" has 10 letters. `slice(0, 4)` stops just before spot 4. `split` cuts at the commas and `join` glues the pieces back with " + ".',
          '`trim` strips leading and trailing whitespace (10 code units remain), `slice` uses a half-open range `[0, 4)`, and `split(",").join(" + ")` is the idiomatic replace-all for a fixed separator.',
        ),
      },
      {
        id: 'spot',
        kind: 'check',
        prompt: L('What does `name.toUpperCase();` on its own line do to `name`?', 'What happens to `name` after `name.toUpperCase();`?'),
        hint: L('String methods give back a new string. Does anything catch it here?', 'The tool makes a new word. Is the new word kept anywhere?'),
        explain: L(
          'Nothing changes: the upper-case copy is made and thrown away. Write `name = name.toUpperCase()` (with `let`) or use the result directly.',
          'Nothing happens to `name`! The BIG copy is made and then forgotten. Keep it: `const loud = name.toUpperCase();`.',
          'Strings are immutable, so the call returns a new value that is discarded. Linters can flag this (`no-unused-expressions`); assign or return the result.',
        ),
        choices: [
          { id: 'changes', text: L('`name` becomes upper case'), correct: false, feedback: L('Strings never change in place. The method returns a new string.', 'The word itself never changes. The tool makes a new one.') },
          { id: 'nothing', text: L('Nothing: the new string is thrown away'), correct: true },
          { id: 'error', text: L('It is an error'), correct: false, feedback: L('It runs fine; it just has no effect.', 'No error: it just does nothing useful.') },
        ],
      },
      {
        id: 'initials',
        kind: 'write',
        prompt: L(
          'Write `initials` so `"Ada Lovelace"` gives `"AL"`. Extra spaces must not matter.',
          'Make `initials` turn `"Ada Lovelace"` into `"AL"`. Extra spaces should not matter.',
        ),
        starter: c(
          'function initials(fullName: string): string {',
          '  // split into words, keep the first letter of each',
          '  return fullName;',
          '}',
        ),
        solution: c(
          'function initials(fullName: string): string {',
          '  return fullName',
          '    .split(" ")',
          '    .filter((part) => part !== "")',
          '    .map((part) => part.slice(0, 1).toUpperCase())',
          '    .join("");',
          '}',
        ),
        tests: [
          { name: 'two names', call: 'initials("Ada Lovelace")', expect: 'AL' },
          { name: 'extra spaces', call: 'initials("  grace   hopper ")', expect: 'GH' },
          { name: 'one name', call: 'initials("linus")', expect: 'L' },
        ],
        hint: L(
          '`split(" ")` gives the words (and some empty strings when there are extra spaces). Drop the empty ones, take `slice(0, 1)` of each, upper-case it, then `join("")`.',
          'Chop the name at the spaces with `split(" ")`. Throw away the empty pieces, take the first letter of each piece with `slice(0, 1)`, make it BIG, and glue them with `join("")`.',
        ),
        explain: L(
          'A chain of small tools reads like a recipe: split, drop empties, take the first letter, upper-case, join.',
          'Each tool does one small job, one after another: chop, tidy, pick, make big, glue.',
          'Method chaining over the intermediate `string[]` keeps each step pure. `slice(0, 1)` is safer than `[0]` here: on an empty string it returns `""` rather than `undefined`.',
        ),
      },
      {
        id: 'recap',
        kind: 'recap',
        prompt: L('The short version.', 'What you learned.'),
        points: LL(
          ['`length`, `includes`, `slice`, `split`, `join`, `trim` and case changes cover most text work.', 'String methods return new strings; the original never changes.', 'Chain small steps: `text.trim().toLowerCase()`.'],
          ['Words have tools: count, look for, cut, chop, glue, tidy.', 'The tools make new words; your word never changes.', 'You can use tools one after another.'],
          ['Strings are immutable; every method returns a new value.', '`slice` takes a half-open range and negative indices.', '`length` counts UTF-16 code units, not visible characters.'],
        ),
      },
      {
        id: 'slug',
        kind: 'write',
        bonus: true,
        prompt: L(
          'Go further: write `slugify` so `"  Hello Big World! "` becomes `"hello-big-world"`.',
          'A challenge: make `slugify` turn `"  Hello Big World! "` into `"hello-big-world"`.',
        ),
        starter: c('function slugify(title: string): string {', '  return title;', '}'),
        solution: c(
          'function slugify(title: string): string {',
          '  return title',
          '    .trim()',
          '    .toLowerCase()',
          '    .replace(/[^a-z0-9 ]/g, "")',
          '    .split(" ")',
          '    .filter((word) => word !== "")',
          '    .join("-");',
          '}',
        ),
        tests: [
          { name: 'spaces become dashes', call: 'slugify("  Hello Big World! ")', expect: 'hello-big-world' },
          { name: 'punctuation goes', call: 'slugify("TypeScript, in 2025?")', expect: 'typescript-in-2025' },
          { name: 'already a slug', call: 'slugify("done")', expect: 'done' },
        ],
        hint: L(
          'Trim, lower-case, remove anything that is not a letter, digit or space with `replace(/[^a-z0-9 ]/g, "")`, then split on spaces, drop empties and join with `"-"`.',
          'Tidy the ends, make it small letters, remove the punctuation with `replace(/[^a-z0-9 ]/g, "")`, then chop at spaces and glue with dashes.',
        ),
        explain: L(
          'A regular expression (`/[^a-z0-9 ]/g`) describes "anything that is not a lowercase letter, digit or space", and `replace` with the `g` flag removes every match.',
          '`/[^a-z0-9 ]/g` is a pattern that means "anything that is not a small letter, a number or a space". `replace` throws all of those away.',
          'Character classes with `^` negate; the `g` flag replaces all matches. `replaceAll` (ES2021) needs either a string or a global regex.',
        ),
      },
    ],
    recap: LL(
      ['Strings have methods for measuring, searching, cutting and tidying.', 'They always return a new string.', 'Chain them to build clear recipes.'],
      ['Words have a toolbox.', 'The tools make new words and leave yours alone.', 'Use tools one after another.'],
      ['Treat strings as immutable values.', 'Prefer `slice` to the legacy `substr`.', 'Mind code units versus characters.'],
    ),
  },
];

import { L, LL, bullets, c, md } from '../authoring';
import type { Lesson } from '../schema';

export const M02_LESSONS: readonly Lesson[] = [
  {
    id: 'm02-l01-comparing',
    moduleId: 'm02',
    order: 1,
    title: {
      story: 'Is it bigger? Is it the same?',
      explorer: 'Comparisons that answer true or false',
      pro: 'Equality and relational operators',
    },
    estMinutes: 5,
    concepts: ['comparison', 'boolean', 'operator'],
    steps: [
      {
        id: 'read',
        kind: 'read',
        prompt: L(
          'Comparisons produce `true` or `false`.',
          'Asking "is this bigger?" gives back yes or no: `true` or `false`.',
        ),
        body: L(
          md(
            'Six symbols answer questions:',
            bullets(
              '`===` is exactly equal',
              '`!==` is not equal',
              '`<` and `>` are less and greater',
              '`<=` and `>=` include the boundary',
            ),
            'Use `===`, not `==`. The single `=` assigns a value; the double `==` converts types before comparing, so `0 == ""` is `true`. That is almost never what you meant.',
          ),
          md(
            'A question has an answer: `true` or `false`. Comparison symbols ask questions.',
            '`===` asks "are these exactly the same?" `>` asks "is the left one bigger?"',
            'Careful with `=`. One equals sign **puts a value in**. Two (`==`) is a sloppy comparison. Three (`===`) is the careful one.',
          ),
          md(
            '`===` and `!==` compare without type coercion. `==` follows the loose-equality algorithm, so `0 == ""`, `null == undefined` and `"1" == 1` are all `true`. Its one idiomatic use is `x == null`, which matches both `null` and `undefined`.',
            'Objects and arrays compare by reference: `[1] === [1]` is `false`, so compare contents or an id. `NaN` equals nothing, itself included; use `Number.isNaN`.',
            'TypeScript reports comparisons that can never be true, such as a `number` against a `string` (TS2367), which catches most coercion bugs before they run.',
          ),
        ),
      },
      {
        id: 'predict',
        kind: 'predict',
        prompt: L('Careful: one comparison is loose.', 'Careful: one of these checks is sloppy.'),
        hint: L(
          '`===` compares value *and* type. `==` converts the string to a number before comparing.',
          '`===` is strict: a number and a word are never the same. `==` is sloppy: it changes `"3"` into `3` first.',
        ),
        code: c('console.log(3 === "3");', 'console.log(3 == "3");'),
        answer: c('false', 'true'),
        // Comparing a number with a string is the point of this step.
        typeErrors: 'intended',
        explain: L(
          '`===` also checks the type, and a number is not a string. `==` converts `"3"` into `3` and then agrees — which is why we avoid it. TypeScript even warns about both lines: a number and a string can never be the same, so comparing them is almost always a mistake.',
          '`===` checks the kind of value too, and a number is not a word, so it says false. `==` turns `"3"` into `3` first and then says true — that is why we use `===`. TypeScript even warns you: a number and a word can never be the same.',
          '`===` compares type and value, so a number never equals a string. `==` converts `"3"` to `3` first. TypeScript flags both lines with TS2367 (the types have no overlap), which is how it removes this whole class of bug.',
        ),
      },
      {
        id: 'spot',
        kind: 'check',
        prompt: L('Which comparison is `true`?', 'Which one is `true`?'),
        hint: L(
          'Check each one carefully: `>=` includes equal values, `>` does not, and `===` also compares the type.',
          '`>=` means "bigger or the same". `>` means only "bigger".',
        ),
        explain: L(
          '`5 >= 5` is true because `>=` includes equality.',
          '`5 >= 5` means "5 is bigger than or the same as 5". It is the same, so it is true.',
          '`>=` is inclusive, so `5 >= 5` is `true`. `"5" === 5` is `false` because nothing is converted, and `4 > 4` is `false` by definition.',
        ),
        choices: [
          { id: 'a', text: L('`"5" === 5`'), correct: false, feedback: L(
            'Different types, so `===` says false.',
            'A word and a number are different kinds, so `===` says false.',
          ) },
          { id: 'b', text: L('`5 >= 5`'), correct: true },
          { id: 'c', text: L('`4 > 4`'), correct: false, feedback: L(
            '`>` is strict. `4` is not greater than `4`.',
            '`>` means "bigger than". 4 is not bigger than 4.',
          ) },
        ],
      },
      {
        id: 'fill',
        kind: 'fill',
        prompt: L('Allow exactly 18 and older.', 'Let in people who are 18 or older.'),
        hint: L(
          'An 18-year-old must be allowed in, so the boundary is included. Which operator includes it?',
          '18 must count too. Pick the sign that means "bigger or the same".',
        ),
        template: c('if (age ___ 18) {', '  console.log("adult");', '}'),
        bank: ['>=', '>', '=', '==='],
        answers: ['>='],
        explain: L(
          '`>` would reject an 18-year-old. `>=` includes 18. `=` would assign instead of compare.',
          '`>` would say no to someone who is exactly 18. `>=` says yes to 18 too. One `=` on its own puts a value in a box instead of comparing.',
          '`>=` makes the boundary inclusive. Off-by-one mistakes at boundaries are among the most common logic bugs, so test the exact boundary value (18 here) on purpose.',
        ),
      },
      {
        id: 'recap',
        kind: 'recap',
        prompt: L('The short version.', 'What you learned.'),
        points: LL(
          [
          'Comparisons return booleans.',
          '`===` checks value and type; `==` converts first.',
          '`>=` includes the boundary, `>` does not.',
        ],
          [
            'Comparing gives back `true` or `false`.',
            '`===` checks the value and the kind; `==` is sloppy.',
            '`>=` includes the number itself, `>` does not.',
          ],
          [
            'Equality and relational operators return `boolean`.',
            '`===` never converts; `==` does (keep only the `x == null` idiom).',
            'Objects compare by reference; `NaN` equals nothing.',
          ],
        ),
      },
      {
        id: 'which-type',
        kind: 'predictType',
        bonus: true,
        prompt: L('Go further: what type does `isAdult` have?', 'A challenge: what type does `isAdult` have?'),
        hint: L('A comparison always answers yes or no.', 'A comparison always answers yes or no. What type is that?'),
        code: c('const age = 17;', 'const isAdult = age >= 18;', 'console.log(isAdult);'),
        target: 'isAdult',
        answer: 'boolean',
        explain: L(
          'Every comparison produces a `boolean`. TypeScript does not work out that `17 >= 18` is `false` at the type level.',
          'Comparisons always give `true` or `false`, which is the `boolean` type.',
          'Relational operators are typed `boolean`; TypeScript does not constant-fold, even when both operands are literal types.',
        ),
      },
    ],
    recap: LL(
      [
      'Comparisons answer true or false.',
      'Use `===` and `!==`.',
      'Watch the boundary: `>=` versus `>`.',
    ],
      [
        'Comparing answers yes or no.',
        'Use `===` and `!==`.',
        'Watch the edge: `>=` or `>`?',
      ],
      [
        'Use `===` and `!==`; reserve `== null` for null-or-undefined checks.',
        'Objects compare by reference; compare contents explicitly.',
        'Test the boundary value of every comparison.',
      ],
    ),
  },

  {
    id: 'm02-l02-if-else',
    moduleId: 'm02',
    order: 2,
    title: {
      story: 'Choosing a path',
      explorer: 'if, else if, else',
      pro: 'Branching and early exit',
    },
    estMinutes: 6,
    concepts: ['comparison', 'truthiness', 'guard-clause'],
    steps: [
      {
        id: 'read',
        kind: 'read',
        prompt: L('Only the first matching branch runs.', 'Only the first path that matches is taken.'),
        body: L(
          md(
            'An `if` asks a question. If the answer is true, its block runs. Otherwise the next `else if` gets a turn, and `else` catches everything left.',
            '```ts\nif (score >= 90) {\n  return "gold";\n} else if (score >= 60) {\n  return "silver";\n} else {\n  return "bronze";\n}\n```',
            'The branches are checked **in order** and only the first true one runs. That ordering is the logic.',
          ),
          md(
            'Code can choose a path, like a path in the woods.',
            '```ts\nif (score >= 90) {\n  return "gold";\n} else if (score >= 60) {\n  return "silver";\n} else {\n  return "bronze";\n}\n```',
            'Check the first question. If it is true, take that path and ignore the rest.',
          ),
          md(
            'An `if` / `else if` chain tests its conditions top to bottom and runs the first block whose condition is truthy; the rest are skipped. Order conditions from most to least specific, or a broad one will shadow a narrow one.',
            'An early `return` (a guard clause) removes nesting: after a branch returns, the code below can assume its condition was false. TypeScript narrows types with exactly that reasoning (Module 5).',
            'With `noImplicitReturns`, the compiler also reports a function in which some paths return a value and others fall off the end.',
          ),
        ),
        figure: 'branch',
      },
      {
        id: 'predict',
        kind: 'predict',
        prompt: L('Which branch runs?', 'Which path will the code take?'),
        hint: L(
          'Check the conditions from the top. The first one that is true wins, and the rest are skipped.',
          'Start at the top. Is 72 at least 90? No. Is it at least 60?',
        ),
        code: c(
          'const score = 72;',
          'if (score >= 90) {',
          '  console.log("gold");',
          '} else if (score >= 60) {',
          '  console.log("silver");',
          '} else {',
          '  console.log("bronze");',
          '}',
        ),
        answer: 'silver',
        explain: L(
          '72 is not enough for gold, but it clears 60. The second branch runs and the rest are skipped.',
          '72 is not enough for gold, but it is more than 60. So the silver path runs, and the others are skipped.',
          'Conditions are tested in order: `72 >= 90` is false, `72 >= 60` is true, so `silver` is logged and the `else` block is never evaluated.',
        ),
      },
      {
        id: 'reorder',
        kind: 'reorder',
        prompt: L('Put the function back in a working order.', 'Put the lines back in the right order.'),
        hint: L(
          'The function header comes first and its closing brace last. The `if` block sits inside, before the final return.',
          'Start with the line that says `function`. Finish with the last `}`.',
        ),
        lines: [
          'function result(score: number): string {',
          '  if (score >= 60) {',
          '    return "pass";',
          '  }',
          '  return "fail";',
          '}',
        ],
        explain: L(
          'The function opens, the condition runs, and the early `return` exits when it passes. Without a match, the last line returns `"fail"`.',
          'The function starts, the check comes next, and `return "pass"` leaves early. If the check fails, the last line gives back `"fail"`.',
          'The early `return` exits as soon as the condition holds; the final `return` is the fall-through. Every path returns a `string`, which the return annotation requires.',
        ),
      },
      {
        id: 'write',
        kind: 'write',
        prompt: L(
          'Write `describeTemperature`: below 10 is `cold`, below 25 is `mild`, anything else is `hot`.',
          'Make `describeTemperature`: under 10 is `cold`, under 25 is `mild`, the rest is `hot`.',
        ),
        starter: c(
          'function describeTemperature(c: number): string {',
          '  // one if, one more if, then the rest',
          '  return "";',
          '}',
        ),
        solution: c(
          'function describeTemperature(c: number): string {',
          '  if (c < 10) return "cold";',
          '  if (c < 25) return "mild";',
          '  return "hot";',
          '}',
        ),
        tests: [
          { name: '4 degrees is cold', call: 'describeTemperature(4)', expect: 'cold' },
          { name: '10 degrees is mild', call: 'describeTemperature(10)', expect: 'mild' },
          { name: '18 degrees is mild', call: 'describeTemperature(18)', expect: 'mild' },
          { name: '30 degrees is hot', call: 'describeTemperature(30)', expect: 'hot' },
        ],
        hint: L(
          'Check the coldest case first and return immediately. The last line needs no condition.',
          'Check the coldest first and give back the word straight away. The last line needs no check.',
        ),
      },
      {
        id: 'recap',
        kind: 'recap',
        prompt: L('The short version.', 'What you learned.'),
        points: LL(
          [
          'Branches are checked in order; only the first true one runs.',
          '`else` catches whatever is left.',
          'An early `return` keeps the rest of the function flat.',
        ],
          [
            'The checks go in order; only the first true one runs.',
            '`else` catches everything that is left.',
            '`return` can leave a function early.',
          ],
          [
            'Conditions are tested in order; the first truthy one wins.',
            'Order them from most to least specific.',
            'Guard clauses flatten code and feed TypeScript\'s narrowing.',
          ],
        ),
      },
      {
        id: 'grade',
        kind: 'write',
        bonus: true,
        prompt: L(
          'Go further: write `grade`: `"A"` for 90 and up, `"B"` for 75 and up, `"C"` for 50 and up, otherwise `"F"`.',
          'A challenge: make `grade` give a letter: A (90+), B (75+), C (50+), otherwise F.',
        ),
        starter: c('function grade(score: number): "A" | "B" | "C" | "F" {', '  return "F";', '}'),
        solution: c(
          'function grade(score: number): "A" | "B" | "C" | "F" {',
          '  if (score >= 90) return "A";',
          '  if (score >= 75) return "B";',
          '  if (score >= 50) return "C";',
          '  return "F";',
          '}',
        ),
        tests: [
          { name: 'top mark', call: 'grade(95)', expect: 'A' },
          { name: 'exactly 75', call: 'grade(75)', expect: 'B' },
          { name: 'a pass', call: 'grade(50)', expect: 'C' },
          { name: 'not yet', call: 'grade(49)', expect: 'F' },
        ],
        hint: L('Check from the highest band down, returning as soon as one fits.', 'Start with the best mark and work down. Give back the first letter that fits.'),
        explain: L(
          'Checking from the top down means each `if` only needs one comparison. The return type lists the four possible letters, so a typo like `"E"` would be an error.',
          'Going from the top down keeps each check simple. And the letter type stops typos.',
          'Ordered guard clauses avoid range conditions like `score >= 75 && score < 90`. The literal-union return type documents and enforces the codomain.',
        ),
      },
    ],
    recap: LL(
      [
      'Order of branches is part of the logic.',
      'Only the first true branch runs.',
      'Return early to avoid deep nesting.',
    ],
      [
        'The order of the checks matters.',
        'Only the first true path runs.',
        'Leaving early keeps code simple.',
      ],
      [
        'Branch order is semantics.',
        'Prefer early returns to nesting.',
        'Turn on `noImplicitReturns` to catch missing paths.',
      ],
    ),
  },

  {
    id: 'm02-l03-truthiness',
    moduleId: 'm02',
    order: 3,
    title: {
      story: 'What counts as yes?',
      explorer: 'Truthiness and the ternary',
      pro: 'Coercion, falsy values and conditional expressions',
    },
    estMinutes: 5,
    concepts: ['truthiness', 'ternary'],
    steps: [
      {
        id: 'read',
        kind: 'read',
        prompt: L(
          'Some values count as false even when they are not `false`.',
          'Some values count as "no", even though they are not `false`.',
        ),
        body: L(
          md(
            'Conditions do not need a real boolean. They accept any value, then decide:',
            '**Falsy:** `false`, `0`, `""`, `null`, `undefined`, `NaN`.',
            '**Everything else is truthy** — including `"0"`, `"false"`, and `[]`.',
            'For a quick either/or, the **ternary** gives you a value instead of a branch: `const label = count === 1 ? "item" : "items";`',
          ),
          md(
            'In an `if`, some values act like "no". Empty text, zero, and nothing at all.',
            'Everything else acts like "yes" — even the text `"0"`, which surprises almost everyone.',
            'The ternary is a tiny if/else that gives you back a value: `count === 1 ? "item" : "items"`.',
          ),
          md(
            'A condition converts its value with ToBoolean. The falsy values are `false`, `0`, `-0`, `0n`, `""`, `null`, `undefined` and `NaN`; everything else, including `"0"`, `[]` and `{}`, is truthy.',
            'A truthiness check treats "missing" and "empty or zero" alike: `if (count)` skips a legitimate `0`. When only `null` or `undefined` should count as missing, use `!= null`, `=== undefined` or `??` (Module 5).',
            'The conditional operator `a ? b : c` is an expression, so it composes; nested ternaries quickly stop being readable.',
          ),
        ),
      },
      {
        id: 'spot',
        kind: 'check',
        prompt: L('Which of these are falsy?', 'Which of these count as "no"?'),
        hint: L(
          'Falsy values are `false`, `0`, `""`, `null`, `undefined` and `NaN`. Text that is not empty is never falsy.',
          'Zero and empty words count as no. Any word with letters counts as yes.',
        ),
        explain: L(
          '`0` and `""` are falsy. `"0"` and `"false"` are non-empty text, so they are truthy.',
          '`0` and `""` (empty words) count as no. `"0"` and `"false"` have letters in them, so they count as yes.',
          '`0` and `""` are falsy; `"0"` and `"false"` are non-empty strings and therefore truthy. ToBoolean never looks at what a string says.',
        ),
        multi: true,
        choices: [
          { id: 'zero', text: L('`0`'), correct: true },
          { id: 'empty', text: L('`""`'), correct: true },
          {
            id: 'zero-string',
            text: L('`"0"`'),
            correct: false,
            feedback: L(
              'It is text with one character in it. Non-empty text is truthy.',
              'This is a word with one letter in it. Words that are not empty count as yes.',
            ),
          },
          {
            id: 'false-string',
            text: L('`"false"`'),
            correct: false,
            feedback: L(
              'The word "false" is still a non-empty string, so it counts as true.',
              'The word "false" still has letters, so it counts as yes.',
            ),
          },
        ],
      },
      {
        id: 'predict',
        kind: 'predict',
        prompt: L('Zero is falsy. What prints?', 'Zero counts as no. What will it show?'),
        hint: L(
          '`a ? b : c` gives `b` when `a` is truthy and `c` when it is falsy. Is `0` truthy?',
          'The `? :` question picks the first answer for yes, the second for no. Does 0 count as yes?',
        ),
        code: c('const n = 0;', 'console.log(n ? "yes" : "no");'),
        answer: 'no',
        explain: L(
          '`0` is falsy, so the ternary picks the value after the colon.',
          '`0` counts as no, so the `? :` question picks the answer after the colon.',
          '`0` is falsy, so the conditional expression evaluates its third operand. If `0` is valid data in your domain, test `n !== 0` or `n === undefined` explicitly instead.',
        ),
      },
      {
        id: 'write',
        kind: 'write',
        prompt: L(
          'Write `pluralise`: `1` stays singular, anything else gets an `s`.',
          'Make `pluralise`: `1` stays as it is, anything else gets an `s`.',
        ),
        starter: c(
          'function pluralise(count: number, word: string): string {',
          '  // one ternary is enough',
          '  return word;',
          '}',
        ),
        solution: c(
          'function pluralise(count: number, word: string): string {',
          '  return count === 1 ? word : word + "s";',
          '}',
        ),
        tests: [
          { name: 'one cat', call: 'pluralise(1, "cat")', expect: 'cat' },
          { name: 'three cats', call: 'pluralise(3, "cat")', expect: 'cats' },
          { name: 'zero cats', call: 'pluralise(0, "cat")', expect: 'cats' },
        ],
        hint: L(
          'Compare `count` with 1, then choose between `word` and `word + "s"`.',
          'Ask "is count 1?" with `? :`, and choose between `word` and `word + "s"`.',
        ),
      },
      {
        id: 'recap',
        kind: 'recap',
        prompt: L('The short version.', 'What you learned.'),
        points: LL(
          [
          '`0`, `""`, `null`, `undefined`, `NaN` and `false` are falsy.',
          'Non-empty text is always truthy, even `"false"`.',
          'A ternary produces a value; an `if` produces a branch.',
        ],
          [
            '`0`, `""`, `null`, `undefined`, `NaN` and `false` count as no.',
            'Words with letters always count as yes — even `"false"`.',
            'The `? :` question picks one of two answers.',
          ],
          [
            'Falsy: `false`, `0`, `-0`, `0n`, `""`, `null`, `undefined`, `NaN`.',
            'Truthiness treats zero and empty as missing.',
            '`?:` is an expression; keep it one level deep.',
          ],
        ),
      },
      {
        id: 'nullish',
        kind: 'predict',
        bonus: true,
        prompt: L('Go further: `||` versus `??`. What prints?', 'A challenge: `||` and `??` look alike. What will it show?'),
        hint: L(
          '`||` falls back for *any* falsy value, including `0`. `??` falls back only for `null` and `undefined`.',
          '`||` gives up on 0 too. `??` only gives up when there is really nothing (null or undefined).',
        ),
        code: c(
          'function volume(saved: number | null): string {',
          '  return `${saved || 50} / ${saved ?? 50}`;',
          '}',
          'console.log(volume(0));',
          'console.log(volume(null));',
        ),
        answer: c('50 / 0', '50 / 50'),
        explain: L(
          'A saved volume of `0` is real, but `||` treats it as missing. `??` keeps it.',
          'Volume 0 means "silent", and that is a real choice! `||` throws it away, `??` keeps it.',
          '`??` tests for nullish (`null | undefined`) rather than falsy, so it is the right default operator for numbers, empty strings and `false`.',
        ),
      },
    ],
    recap: LL(
      [
      'Falsy: `false`, `0`, `""`, `null`, `undefined`, `NaN`.',
      '`"0"` is truthy because it is not empty.',
      'Use a ternary when both answers are short.',
    ],
      [
        'These count as no: `false`, `0`, `""`, `null`, `undefined`, `NaN`.',
        '`"0"` counts as yes, because it is not empty.',
        'Use `? :` when both answers are short.',
      ],
      [
        'Know the eight falsy values.',
        'Check explicitly when `0` or `""` are valid data.',
        'Ternaries for values, `if` for control flow.',
      ],
    ),
  },

  {
    id: 'm02-l04-switch-and-guards',
    moduleId: 'm02',
    order: 4,
    title: {
      story: 'Many doors, and one early exit',
      explorer: 'switch, default, and guard clauses',
      pro: 'Multi-way branching and early returns',
    },
    estMinutes: 6,
    concepts: ['switch', 'guard-clause', 'return'],
    steps: [
      {
        id: 'read',
        kind: 'read',
        prompt: L(
          '`switch` is for several fixed options.',
          '`switch` is for choosing between a few fixed options.',
        ),
        body: L(
          md(
            'When you are choosing between a handful of known values, `switch` reads better than a ladder of `else if`.',
            '```ts\nswitch (size) {\n  case "small": return "S";\n  case "medium": return "M";\n  default: return "?";\n}\n```',
            'Each `case` is compared with `===`. `default` catches anything unmatched. Because each branch returns, no `break` is needed.',
          ),
          md(
            '`switch` is a row of doors. Each `case` is a door with a name on it. `default` is the door for everyone else.',
            'If you `return` straight away, you never need to remember `break`.',
          ),
          md(
            '`switch` compares with strict equality (`===`). A case falls through to the next one unless it `return`s, `break`s or `throw`s; turn on `noFallthroughCasesInSwitch` to make an accidental fall-through a compile error.',
            'Over a union of literal types, each `case` narrows the value, and a `default` that assigns it to `never` makes the switch *exhaustive*: add a member to the union and every switch that forgets it stops compiling.',
            '```ts\ndefault: {\n  const unreachable: never = size;\n  return unreachable;\n}\n```',
          ),
        ),
      },
      {
        id: 'compare',
        kind: 'compare',
        prompt: L('The same logic, two shapes.', 'The same idea, two shapes.'),
        left: {
          title: 'Nested if',
          code: c(
            'function ship(user: User | null) {',
            '  if (user) {',
            '    if (user.address) {',
            '      if (user.address.city) {',
            '        return sendTo(user.address.city);',
            '      }',
            '    }',
            '  }',
            '  return null;',
            '}',
          ),
          caption: L(
            'Each condition pushes the main work further right.',
            'Each check pushes the main work further to the right.',
          ),
        },
        right: {
          title: 'Guard clauses',
          code: c(
            'function ship(user: User | null) {',
            '  if (!user) return null;',
            '  if (!user.address) return null;',
            '  if (!user.address.city) return null;',
            '  return sendTo(user.address.city);',
            '}',
          ),
          caption: L(
            'Odd cases leave early; the happy path stays flat.',
            'The odd cases leave early, so the main path stays straight.',
          ),
        },
      },
      {
        id: 'fill',
        kind: 'fill',
        prompt: L('Catch every value that is not red.', 'Catch every colour that is not red.'),
        hint: L(
          'A `switch` has a special branch for "none of the cases". What is it called?',
          'There is one door for "everything else". What is its name?',
        ),
        template: c(
          'switch (color) {',
          '  case "red": return "stop";',
          '  ___ : return "go";',
          '}',
        ),
        bank: ['default', 'else', 'case', 'other'],
        answers: ['default'],
        explain: L(
          '`default` is the branch for every value that matched no `case`.',
          '`default` is the door for every value that no `case` matched.',
          '`default` runs when no `case` matches under `===`. It does not have to be last, but last is where readers expect it.',
        ),
      },
      {
        id: 'write',
        kind: 'write',
        prompt: L(
          'Write `sizeCode` using a `switch`: small → `S`, medium → `M`, large → `L`, anything else → `?`.',
          'Make `sizeCode` with a `switch`: small → `S`, medium → `M`, large → `L`, anything else → `?`.',
        ),
        starter: c(
          'function sizeCode(size: string): string {',
          '  // use switch and return from each case',
          '  return "?";',
          '}',
        ),
        solution: c(
          'function sizeCode(size: string): string {',
          '  switch (size) {',
          '    case "small": return "S";',
          '    case "medium": return "M";',
          '    case "large": return "L";',
          '    default: return "?";',
          '  }',
          '}',
        ),
        tests: [
          { name: 'small', call: 'sizeCode("small")', expect: 'S' },
          { name: 'medium', call: 'sizeCode("medium")', expect: 'M' },
          { name: 'large', call: 'sizeCode("large")', expect: 'L' },
          { name: 'unknown size', call: 'sizeCode("huge")', expect: '?' },
        ],
        hint: L(
          'Start with `switch (size) {`, then one `case` per value, and a `default` at the end.',
          'Start with `switch (size) {`, then one `case` for each size, and `default` at the end.',
        ),
      },
      {
        id: 'recap',
        kind: 'recap',
        prompt: L('The short version.', 'What you learned.'),
        points: LL(
          [
          '`switch` is for a set of known options.',
          '`default` handles everything unmatched.',
          'Guard clauses keep the main path readable.',
        ],
          [
            '`switch` picks between a few known options.',
            '`default` catches everything else.',
            'Leaving early keeps the main path easy to read.',
          ],
          [
            '`switch` uses `===`; cases fall through without `return` or `break`.',
            '`noFallthroughCasesInSwitch` turns an accidental fall-through into an error.',
            'A `never` check in `default` makes a switch over a union exhaustive.',
          ],
        ),
      },
      {
        id: 'fallthrough',
        kind: 'fix',
        bonus: true,
        compilerFlags: { noFallthroughCasesInSwitch: true },
        prompt: L(
          'Go further: with `noFallthroughCasesInSwitch` on, TypeScript catches the bug in `price`. Fix it.',
          'A challenge: a stricter setting spots a bug in `price`. Fix it!',
        ),
        hint: L('The `"small"` case runs straight on into `"large"`. End it with `return` or `break`.', 'The small case forgets to stop, so it carries on into the large one. Add a `return`.'),
        starter: c(
          'function price(size: "small" | "large"): number {',
          '  let total = 0;',
          '  switch (size) {',
          '    case "small":',
          '      total = 2;',
          '    case "large":',
          '      total = 3;',
          '  }',
          '  return total;',
          '}',
        ),
        solution: c(
          'function price(size: "small" | "large"): number {',
          '  let total = 0;',
          '  switch (size) {',
          '    case "small":',
          '      total = 2;',
          '      break;',
          '    case "large":',
          '      total = 3;',
          '  }',
          '  return total;',
          '}',
        ),
        tests: [
          { name: 'small', call: 'price("small")', expect: '2' },
          { name: 'large', call: 'price("large")', expect: '3' },
        ],
        explain: L(
          'Without `break`, a `case` falls through into the next one, so a small drink cost 3. The flag turns that classic bug into an error.',
          'Without `break`, the small case ran into the large case too. The stricter setting makes TypeScript point that out.',
          '`noFallthroughCasesInSwitch` reports TS7029 for non-empty cases that fall through. Intentional fallthrough is still possible with empty cases stacked together.',
        ),
      },
    ],
    recap: LL(
      [
      'Use `switch` for fixed lists of options.',
      '`default` is not optional in real code.',
      'Return early instead of nesting three deep.',
    ],
      [
        'Use `switch` for a short list of options.',
        'Always add a `default`.',
        'Leave early instead of nesting deep.',
      ],
      [
        'Prefer `switch` to long `else if` ladders on one value.',
        'Make switches over unions exhaustive with `never`.',
        'Guard clauses keep the main path unindented.',
      ],
    ),
  },
];

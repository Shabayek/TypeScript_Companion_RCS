import { L, LL, bullets, c, md } from '../authoring';
import type { Lesson } from '../schema';

export const M00_LESSONS: readonly Lesson[] = [
  {
    id: 'm00-l01-code-is-instructions',
    moduleId: 'm00',
    order: 1,
    title: {
      story: 'What is a program?',
      explorer: 'What a program actually is',
      pro: 'Programs as instructions',
    },
    estMinutes: 4,
    concepts: ['program', 'instruction', 'javascript'],
    steps: [
      {
        id: 'read',
        kind: 'read',
        prompt: L(
          'A program is a list of instructions, in order.',
          'A program is a list of steps — like a recipe for a robot.',
          'A program is an ordered list of instructions with no implicit steps.',
        ),
        body: L(
          md(
            'When you ask a computer to do something, it needs every step spelled out. A **program** is that list of steps.',
            'People are good at filling gaps. Ask someone to "make tea" and they will find a cup, boil water, and stop when it is done. A computer will not. It does exactly what is written, including the mistakes.',
            'The program below has one instruction. It says: show these words on the screen.',
          ),
          md(
            'A program is a list of steps, like a recipe for a robot. A robot has no idea what "make tea" means. You have to tell it every single step.',
            'The program below has one step. It says: show these words.',
          ),
          md(
            'A program is an ordered sequence of instructions with no implicit steps. Ambiguity is a bug.',
            'The program below contains a single instruction: write these characters to standard output.',
          ),
        ),
        figure: 'first-code',
        callout: {
          tone: 'tip',
          title: 'The big idea',
          body: L(
            'Order matters. Swap two steps and the program does something different — or breaks.',
            'Order matters. If you swap two steps, the robot does something else — or gets stuck.',
          ),
        },
      },
      {
        id: 'compare',
        kind: 'compare',
        prompt: L('The same steps, written two ways.', 'Two ways to write the same steps.'),
        body: L(
          'A recipe and a program are cousins. Both are a list. Only one is written for something that never guesses.',
          'A recipe and a program are like cousins. Both are lists of steps. But a program is for a robot, and robots never guess.',
        ),
        left: {
          title: 'For a person',
          code: c('1. Boil water', '2. Add pasta', '3. Wait 9 minutes', '4. Drain'),
          caption: L(
            'A person fills in the small stuff without being told.',
            'A person knows the little things without being told.',
          ),
        },
        right: {
          title: 'For a computer',
          code: c(
            'boilWater();',
            'addPasta();',
            'waitMinutes(9);',
            'drain();',
          ),
          caption: L(
            'Every step is named. Nothing is left to chance.',
            'Every step has a name. Nothing is left out.',
          ),
        },
      },
      {
        id: 'spot',
        kind: 'check',
        prompt: L('Which of these is a program?', 'Which one is a program?'),
        hint: L(
          'Look for the one that is written as an instruction a computer can follow, exactly as it is.',
          'Which one could a robot follow right away, with no guessing?',
        ),
        explain: L(
          'A program is instructions. A photo is data, and "water the plants" is a task someone still has to write down as steps.',
          'A program is a list of steps. A photo is just a picture. "Water the plants" is a job — someone still has to turn it into steps.',
          'A program is executable instructions; the other two are data and an unspecified task. `console.log("hi")` is a complete program: one statement with one observable side effect, a line written to the console.',
        ),
        choices: [
          {
            id: 'task',
            text: L('Water the plants'),
            correct: false,
            feedback: L(
              'That is a goal, not a program yet. Someone still has to turn it into steps.',
              'Close! But who waters them, how much, and when? The robot needs the steps.',
            ),
          },
          {
            id: 'code',
            text: L('`console.log("hi");`'),
            correct: true,
          },
          {
            id: 'photo',
            text: L('A photo of a dog'),
            correct: false,
            feedback: L(
              'A photo is data. It is something a program might look at, not instructions.',
              'A photo is a picture, not steps. A program might look at a photo, but it is not a program.',
            ),
          },
        ],
      },
      {
        id: 'predict',
        kind: 'predict',
        prompt: L('What does this print?', 'What will the robot show?'),
        hint: L(
          'The computer runs the lines from top to bottom, one at a time. Each `console.log` prints one line.',
          'The robot reads from the top. Each `console.log` shows one line.',
        ),
        code: c('console.log("one");', 'console.log("two");'),
        answer: c('one', 'two'),
        explain: L(
          'Instructions run top to bottom. The first line prints `one`, then the second prints `two`, each on its own line.',
          'The robot reads from the top. `one` first, then `two`.',
          'Statements execute sequentially, and each `console.log` call writes one line (it appends the newline for you). Nothing is reordered at this level; that only starts with asynchronous code in Module 6.',
        ),
      },
      {
        id: 'recap',
        kind: 'recap',
        prompt: L('The short version.', 'What you learned.'),
        points: LL(
          [
            'A program is a list of instructions, run in order.',
            'Computers do exactly what is written — including mistakes.',
            '`console.log(...)` shows something on the screen.',
          ],
          [
            'A program is a list of steps for a machine.',
            'Robots never guess. You write every step.',
            '`console.log(...)` shows words on the screen.',
          ],
          [
            'A program is an ordered sequence of statements, executed top to bottom.',
            'The machine infers nothing: a missing or wrong step is a bug, not a gap it fills.',
            '`console.log` writes a line to the console, your first debugging tool.',
          ],
        ),
      },
    ],
    recap: LL(
      [
        'A program is an ordered list of instructions.',
        'Order matters more than you expect.',
        '`console.log` is how a program shows you something.',
      ],
      [
        'A program is a list of steps for a machine.',
        'The order of the steps matters.',
        '`console.log` shows words on the screen.',
      ],
      [
        'Execution is sequential and literal.',
        'Ordering is semantics: reorder two statements and you have a different program.',
        '`console.log` is the simplest observable side effect.',
      ],
    ),
  },

  {
    id: 'm00-l02-why-typescript',
    moduleId: 'm00',
    order: 2,
    title: {
      story: 'Why the extra labels?',
      explorer: 'Why TypeScript exists',
      pro: 'What TypeScript adds to JavaScript',
    },
    estMinutes: 5,
    concepts: ['typescript', 'javascript', 'type'],
    steps: [
      {
        id: 'read',
        kind: 'read',
        prompt: L(
          'TypeScript is JavaScript with labels.',
          'TypeScript is JavaScript with name tags.',
          'TypeScript is JavaScript plus a static type layer.',
        ),
        body: L(
          md(
            'JavaScript works. So why does TypeScript exist?',
            'Because a label saves an argument later. In TypeScript you write what kind of thing a value is — text, a number, true/false — and a **checker** reads those labels before the program runs.',
            'The checker is the whole point. It finds contradictions while you type, instead of at 2am when a user clicks the wrong button.',
          ),
          md(
            'JavaScript already works. So why add labels?',
            'Imagine every box in your room had to be opened to find out what is inside. Annoying, right?',
            'TypeScript puts a label on each box: "this one holds numbers". Now you can find the mistake before you open anything.',
          ),
          md(
            'TypeScript is a superset of JavaScript with an erasable type layer. Types are checked at compile time and then removed: the runtime artefact is plain JavaScript.',
            'That has two consequences worth internalising. Types cost nothing at runtime, and they cannot save you from bad data arriving over a network. They protect the edges you control.',
          ),
        ),
        figure: 'type-check',
      },
      {
        id: 'compare',
        kind: 'compare',
        prompt: L('The same code, with and without labels.', 'The same code, with labels and without.'),
        left: {
          title: 'JavaScript',
          code: c(
            'function priceWithTax(amount) {',
            '  return amount * 1.2;',
            '}',
            '',
            'priceWithTax("8");',
          ),
          caption: L(
            'This runs. It quietly produces `"8" * 1.2`, which is a number, not a crash.',
            'This runs — but it quietly mixes up text and numbers.',
          ),
        },
        right: {
          title: 'TypeScript',
          code: c(
            'function priceWithTax(amount: number) {',
            '  return amount * 1.2;',
            '}',
            '',
            'priceWithTax("8"); // error before running',
          ),
          caption: L(
            'The label says numbers only, so the mistake is caught immediately.',
            'The label says "numbers only", so the mix-up is spotted straight away.',
          ),
        },
      },
      {
        id: 'what',
        kind: 'check',
        prompt: L('What does TypeScript add to JavaScript?', 'What does TypeScript add?'),
        hint: L(
          'Think about the word "type": what could a checker look at before anything runs?',
          'TypeScript adds labels. What could labels help you check?',
        ),
        explain: L(
          'TypeScript adds types: labels that a checker verifies before the program runs. The labels disappear when it runs.',
          'TypeScript adds labels, called types. A checker reads them before the program runs, and finds mix-ups early.',
          'TypeScript adds a static type system. The compiler (here esbuild, elsewhere `tsc`) strips the annotations, so there is no runtime cost and no runtime checking: types are a compile-time proof, not a guard.',
        ),
        choices: [
          {
            id: 'speed',
            text: L('It makes programs run faster'),
            correct: false,
            feedback: L(
              'Not quite. Types are removed before running, so they cannot make the program faster.',
              'Not this one. The labels are taken away before the program runs, so they cannot make it faster.',
            ),
          },
          {
            id: 'labels',
            text: L('It checks the kinds of values before the program runs'),
            correct: true,
          },
          {
            id: 'browser',
            text: L('It makes JavaScript work in browsers'),
            correct: false,
            feedback: L(
              'JavaScript already works in browsers. TypeScript compiles down to it.',
              'JavaScript already works in browsers. TypeScript turns into JavaScript.',
            ),
          },
        ],
      },
      {
        id: 'fill',
        kind: 'fill',
        prompt: L('Label the value as a number.', 'Give the box the label "number".'),
        hint: L(
          '`36` has no quotes, so it is not text. Which label fits a value like that?',
          '36 is a number, not words. Pick the label for numbers.',
        ),
        template: c('const age: ___ = 36;', 'console.log(age + 1);'),
        bank: ['number', 'string', 'boolean', 'text'],
        answers: ['number'],
        explain: L(
          '`36` is a number, so the label is `number`. The label goes after the name, before the `=`.',
          'The box holds 36. The label says **number**. So we write `number`.',
          'Annotation syntax is `name: Type`, after the binding. On a `const` it is redundant (`const age = 36` infers the literal type `36`), but it is exactly the syntax you will write on parameters, where nothing can be inferred.',
        ),
      },
      {
        id: 'fix-type',
        kind: 'fix',
        prompt: L(
          'This runs and prints 36, and the check agrees — but TypeScript says the label and the value do not match. Fix the value so TypeScript is happy too.',
          'This works and prints 36. But the checker is not happy: the label says number, and the box holds text. Fix it!',
        ),
        starter: c('const age: number = "36";', 'console.log(age);'),
        solution: c('const age: number = 36;', 'console.log(age);'),
        tests: [{ name: 'age holds 36', call: 'age', expect: '36' }],
        hint: L(
          'Look at the right side of the `=`. Is `"36"` a number there, or text?',
          'Numbers have no quotes. Text has quotes.',
        ),
        strongHint: L('Remove the quotes: `36` is a number, `"36"` is text.', 'Take the quotes away from 36.'),
        explain: L(
          'The output looked the same, but `"36"` is text. TypeScript caught the mix-up before it could cause trouble — one day someone writes `age + 1` and gets `"361"`.',
          'It printed 36 both times, but one 36 was text! The checker spotted it before it caused trouble.',
          'At runtime `"36"` and `36` print identically, so an output-based check cannot tell them apart; the type checker can. TS2322 (`Type \'string\' is not assignable to type \'number\'`) is the error you will see most, and here it flags the bug before `age + 1` quietly concatenates to `"361"`.',
        ),
      },
      {
        id: 'recap',
        kind: 'recap',
        prompt: L('The short version.', 'What you learned.'),
        points: LL(
          [
          'TypeScript is JavaScript plus type labels.',
          'A checker reads the labels before the program runs.',
          'The labels disappear when the code runs, so they cost nothing.',
        ],
          [
            'TypeScript is JavaScript with labels.',
            'A checker reads the labels before the program runs.',
            'The labels go away when the program runs.',
          ],
          [
            'TypeScript is a typed superset of JavaScript: valid JavaScript is (almost always) valid TypeScript.',
            'Checking happens at compile time; the emitted code is plain JavaScript with the types erased.',
            'Erasure means zero runtime cost, and zero runtime protection for data from outside.',
          ],
        ),
      },
    ],
    recap: LL(
      [
        'TypeScript is JavaScript with type labels.',
        'The checker reads the labels before you run anything.',
        'Labels are removed at runtime — they are for humans and tools.',
      ],
      [
        'TypeScript = JavaScript + labels.',
        'The checker looks at the labels first.',
        'It finds mix-ups before they cause trouble.',
      ],
      [
        'TypeScript = JavaScript + types.',
        'Types are checked, then erased.',
        'You still need to validate data you did not create.',
      ],
    ),
  },

  {
    id: 'm00-l03-first-program',
    moduleId: 'm00',
    order: 3,
    title: {
      story: 'Your first program',
      explorer: 'Your first running program',
      pro: 'Hello, world — and the first failure',
    },
    estMinutes: 5,
    concepts: ['string', 'variable', 'console'],
    steps: [
      {
        id: 'read',
        kind: 'read',
        prompt: L('Text goes inside quotes.', 'Words go inside quotes.'),
        body: L(
          md(
            'To show words, wrap them in quotes and hand them to `console.log`.',
            '`console.log` is a mouth. Whatever you put inside the brackets, it says out loud.',
            'Quotes are not decoration. They are how you tell the computer "this is text, not a name".',
          ),
          md(
            'A **string** is text. Every string wears a pair of quotes like a coat: `"hello"`.',
            '`console.log` is a mouth. Whatever you put inside the brackets, it says out loud.',
          ),
          md(
            'String literals can use double quotes, single quotes or backticks. They produce the same `string` type; backticks add interpolation and line breaks (Module 1).',
            '`console.log` accepts any number of arguments and prints them separated by spaces. In this app its output is captured from a sandboxed worker and shown under the editor.',
            'An unterminated string literal is a *syntax* error: the parser fails, so nothing runs, not even the lines before it. A runtime error is different: the earlier lines have already executed.',
          ),
        ),
        figure: 'first-code',
      },
      {
        id: 'try',
        kind: 'tryIt',
        prompt: L('Change the words and run it.', 'Change the words, then press Run.'),
        code: c('console.log("Hello, world!");', 'console.log("I am learning TypeScript.");'),
      },
      {
        id: 'predict',
        kind: 'predict',
        prompt: L('Two lines, one after the other. What prints?', 'Two lines. What will they show?'),
        hint: L(
          '`+` joins two pieces of text into one. `.length` counts characters.',
          'The first line joins two bits of text. The second counts the letters in "otter".',
        ),
        code: c(
          'const animal = "otter";',
          'console.log("My favourite is an " + animal);',
          'console.log(animal.length);',
        ),
        answer: c('My favourite is an otter', '5'),
        explain: L(
          '`+` joins text together. `.length` counts the characters in a string, and "otter" has five.',
          '`+` sticks text together. `.length` counts the letters: o-t-t-e-r is five.',
          '`+` with a string operand concatenates. `.length` counts UTF-16 code units, not characters: identical for plain text, but `"👍".length` is 2.',
        ),
      },
      {
        id: 'fix',
        kind: 'fix',
        prompt: L(
          'One quote is missing. Fix it so the program runs.',
          'One quote is missing. Find it and fix it!',
        ),
        starter: c('const greeting = "Hello, world;', 'console.log(greeting);'),
        solution: c('const greeting = "Hello, world";', 'console.log(greeting);'),
        tests: [{ name: 'greeting holds the right text', call: 'greeting', expect: 'Hello, world' }],
        hint: L(
          'Count the quotes on the first line. There should be two.',
          'Count the quotes on the first line. There should be two.',
        ),
        explain: L(
          'Every quote needs a partner. Until they match, the computer is still waiting for the end of the text — so nothing runs at all.',
          'Quotes come in pairs. Until the second one is there, the computer keeps waiting for the words to end, so nothing runs.',
          'The scanner reports an unterminated string literal (TS1002) and the file never compiles, so no statement runs. Syntax errors are all-or-nothing; runtime errors are not.',
        ),
      },
      {
        id: 'recap',
        kind: 'recap',
        prompt: L('The short version.', 'What you learned.'),
        points: LL(
          [
          'Text lives inside quotes.',
          '`console.log(...)` shows a value.',
          '`+` joins text; `.length` counts characters.',
        ],
          [
            'Words live inside quotes.',
            '`console.log(...)` shows something on the screen.',
            '`+` sticks words together; `.length` counts letters.',
          ],
          [
            'String literals: `"…"`, `\'…\'` or backticks, all of type `string`.',
            '`console.log(a, b)` prints its arguments separated by a space.',
            '`+` concatenates when either operand is a string; `.length` counts UTF-16 code units.',
          ],
        ),
      },
    ],
    recap: LL(
      [
      'Strings are text inside quotes.',
      '`console.log` shows what you give it.',
      'An unclosed quote stops the whole program.',
    ],
      [
        'Words in code go inside quotes.',
        '`console.log` shows what you give it.',
        'A missing quote stops the whole program.',
      ],
      [
        'Pick one quote style and let a formatter enforce it.',
        'A syntax error stops compilation: nothing runs.',
        '`.length` is code units, not user-visible characters.',
      ],
    ),
  },

  {
    id: 'm00-l04-reading-errors',
    moduleId: 'm00',
    order: 4,
    title: {
      story: 'Errors are directions',
      explorer: 'Reading errors without fear',
      pro: 'Diagnosing the first error',
    },
    estMinutes: 5,
    concepts: ['error', 'string'],
    steps: [
      {
        id: 'read',
        kind: 'read',
        prompt: L(
          'An error is a signpost, not a scolding.',
          'An error is a signpost, not a telling-off.',
          'An error is data about a failed assumption.',
        ),
        body: L(
          md(
            'Every programmer sees errors all day. They are not a sign that you are bad at this. They are the computer telling you where it got confused.',
            'Read three things, in this order:',
            bullets(
              '**What** it says happened.',
              '**Where** it says the line is.',
              '**What** you expected instead.',
            ),
            'That is usually enough to find it. If it is not, the line above the reported line is the next place to look.',
          ),
          md(
            'Everyone sees errors. Everyone. People who write code for a living see them dozens of times a day.',
            'An error is the computer saying: "I got stuck here." That is helpful, not mean.',
            'Read it in three steps: what happened, which line, and what you meant to happen.',
          ),
          md(
            'A diagnostic has a stable shape: a code (`TS2304`), a message and a location. The code is searchable and the message is usually precise, so read it literally before guessing.',
            'Fix the first error first. Later errors are often consequences of it (one missing brace can cause a cascade), and fixing the first frequently clears the rest.',
            'Tell three classes apart: **syntax** errors (the parser gave up), **type** errors (well-formed code that contradicts its own types) and **runtime** errors (it compiled, then an operation failed). This app labels each one differently.',
          ),
        ),
      },
      {
        id: 'compare',
        kind: 'compare',
        prompt: L('The same error, twice.', 'The same error, two ways.'),
        left: {
          title: 'What you see',
          code: c("error TS2304: Cannot find name 'totl'.", '', 'at line 4'),
        },
        right: {
          title: 'What it means',
          code: c(
            'Line 4 uses a name called totl.',
            'Nothing by that name exists here.',
            '',
            'Likely: a typo for "total".',
          ),
          caption: L(
            'The message already contains the answer. It just needs translating.',
            'The message already has the answer. It just needs reading slowly.',
          ),
        },
      },
      {
        id: 'meaning',
        kind: 'check',
        prompt: L(
          'The error says `Cannot find name "total"`. What does that mean?',
          'The error says `Cannot find name "total"`. What does it mean?',
        ),
        hint: L(
          '"Cannot find" is the important part: what is it looking for, and why might it be missing?',
          'The computer says it cannot find something. What is it looking for?',
        ),
        explain: L(
          'The compiler reached a name it does not know. Either it is misspelled, or it is declared somewhere this line cannot see.',
          'The computer found a name it does not know. Maybe it is spelled wrong, or it was never made.',
          'TS2304 means name resolution failed: no binding with that name is in scope at this point. The usual causes are a typo, a missing import, or a `let`/`const` declared inside an inner block.',
        ),
        choices: [
          {
            id: 'wrong',
            text: L('The value of `total` is the wrong type'),
            correct: false,
            feedback: L(
              'That would be a different message: "not assignable to type".',
              'That would be a different message, one about the wrong kind of value.',
            ),
          },
          {
            id: 'missing',
            text: L('There is no `total` declared where this line can see it'),
            correct: true,
          },
          {
            id: 'slow',
            text: L('The program is too slow'),
            correct: false,
            feedback: L(
              'Speed is not something the compiler checks. This is about a name.',
              'The computer does not complain about speed here. This is about a name.',
            ),
          },
        ],
      },
      {
        id: 'predict',
        kind: 'predict',
        prompt: L('What prints before the program finishes?', 'What will this show?'),
        hint: L(
          '`.toUpperCase()` returns a copy in capital letters. `.length` counts the characters.',
          'The first line makes the name big. The second counts its letters.',
        ),
        code: c(
          'const name = "Ada";',
          'console.log(name.toUpperCase());',
          'console.log(name.length);',
        ),
        answer: c('ADA', '3'),
        explain: L(
          '`.toUpperCase()` makes a shouting copy of the text. `.length` counts characters: A, d, a — three.',
          '`.toUpperCase()` makes the letters big, like shouting. `.length` counts them: A, d, a — three.',
          'String methods never mutate: `toUpperCase()` returns a new string and `name` is unchanged, so `.length` is still 3. Strings are immutable primitives.',
        ),
      },
      {
        id: 'recap',
        kind: 'recap',
        prompt: L('The short version.', 'What you learned.'),
        points: LL(
          [
          'Errors are directions: what, where, and what you expected.',
          'Read the first line of the message, then the line number.',
          'A "cannot find name" error is almost always a typo or a scope problem.',
        ],
          [
            'Errors are clues: what went wrong, and where.',
            'Read the first line of the message, then the line number.',
            '"Cannot find name" usually means a typo.',
          ],
          [
            'A diagnostic is code + message + location; read all three.',
            'Fix the first error first; later ones are often a cascade.',
            'TS2304 (`Cannot find name`) is resolution: a typo, a missing import, or scope.',
          ],
        ),
      },
    ],
    recap: LL(
      [
      'Errors are information, not judgement.',
      'Check what, where, and what you meant.',
      'The line above the error is often the real culprit.',
    ],
      [
        'Errors are clues, not telling-offs.',
        'Read what went wrong and where.',
        'Often the real mistake is on the line just before.',
      ],
      [
        'Errors are precise data; read them literally.',
        'Separate syntax, type and runtime failures: each needs a different fix.',
        'When the reported line looks fine, check the line before it.',
      ],
    ),
  },
];

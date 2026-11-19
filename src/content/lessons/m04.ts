import { L, LL, bullets, c, md } from '../authoring';
import type { Lesson } from '../schema';

export const M04_LESSONS: readonly Lesson[] = [
  {
    id: 'm04-l01-functions',
    moduleId: 'm04',
    order: 1,
    title: {
      story: 'Little machines you can reuse',
      explorer: 'Your first useful functions',
      pro: 'Function declarations, parameters and returns',
    },
    estMinutes: 6,
    concepts: ['function', 'parameter', 'argument', 'return', 'pure-function'],
    steps: [
      {
        id: 'read',
        kind: 'read',
        prompt: L(
          'A function is a named recipe with one result.',
          'A function is a little machine with a name. Put something in, get something out.',
        ),
        body: L(
          md(
            'A **function** takes some inputs, does some work, and hands back a value:',
            '```ts\nfunction double(n: number): number {\n  return n * 2;\n}\n\ndouble(4); // 8\n```',
            'The name in brackets is a **parameter**. The value you pass is an **argument**. The `: number` after the brackets is the return type.',
            'A function with no `return` hands back `undefined`. That is legal, and usually not what someone meant.',
          ),
          md(
            'A function is a small machine. You put something in, it does one job, and it gives something back.',
            '```ts\nfunction double(n: number): number {\n  return n * 2;\n}\n```',
            'You build the machine once. After that, you can use it as many times as you like.',
          ),
          md(
            'Always annotate parameters (a declaration gives nothing to infer them from) and the return types of anything exported. Under `strict` (`noImplicitAny`), an unannotated parameter is an error instead of a silent `any`.',
            'A function without `return` returns `undefined`, typed `void`. Function declarations are hoisted, so they can be called above the line that defines them; `const` arrow functions cannot.',
            'Arity is checked: too few or too many arguments is a compile error, whereas plain JavaScript quietly passes `undefined` for the missing ones.',
          ),
        ),
        figure: 'function',
      },
      {
        id: 'predict',
        kind: 'predict',
        prompt: L('What prints?', 'What will it show?'),
        hint: L(
          'Run the body of `double` once for each call, with `n` set to the value in the brackets.',
          'The machine doubles whatever you give it. What is double 4? Double 0?',
        ),
        code: c(
          'function double(n: number): number {',
          '  return n * 2;',
          '}',
          '',
          'console.log(double(4));',
          'console.log(double(0));',
        ),
        answer: c('8', '0'),
        explain: L(
          'Each call runs the same body with a different argument. Four becomes eight; zero stays zero.',
          'Each time, the machine does the same job with a new number. 4 becomes 8, and 0 stays 0.',
          'Each call gets its own `n`; nothing persists between calls. A pure function like `double` always maps the same input to the same output, which is what makes it trivial to test.',
        ),
      },
      {
        id: 'fill',
        kind: 'fill',
        prompt: L('Hand the value back out.', 'Give the answer back.'),
        hint: L(
          'Which keyword sends a value back out of a function?',
          'Which word gives the answer back?',
        ),
        template: c('function double(n: number): number {', '  ___ n * 2;', '}'),
        bank: ['return', 'console.log', 'const', 'yield'],
        answers: ['return'],
        explain: L(
          '`return` is what passes a value back to whoever called the function.',
          '`return` hands the answer back to whoever used the machine.',
          '`return` ends the call and yields the value. With a declared return type of `number`, leaving it out is a compile error (TS2355: the function must return a value).',
        ),
      },
      {
        id: 'write',
        kind: 'write',
        prompt: L(
          'Write `add` so it returns the sum of two numbers.',
          'Make `add` give back the two numbers added together.',
        ),
        starter: c(
          'function add(a: number, b: number): number {',
          '  // one line is enough',
          '  return 0;',
          '}',
        ),
        solution: c('function add(a: number, b: number): number {', '  return a + b;', '}'),
        tests: [
          { name: 'add(2, 3)', call: 'add(2, 3)', expect: '5' },
          { name: 'add(-1, 1)', call: 'add(-1, 1)', expect: '0' },
          { name: 'add(1.5, 2.5)', call: 'add(1.5, 2.5)', expect: '4' },
        ],
        hint: L('Return `a + b`.', 'Give back `a + b` with `return`.'),
      },
      {
        id: 'recap',
        kind: 'recap',
        prompt: L('The short version.', 'What you learned.'),
        points: LL(
          [
          'A function is a reusable recipe with a name.',
          'Parameters are the slots; arguments are the values you pass.',
          '`return` hands a value back.',
        ],
          [
            'A function is a machine with a name that you can use again and again.',
            'What goes in is named in the brackets.',
            '`return` gives the answer back.',
          ],
          [
            'Annotate parameters; annotate return types on exported functions.',
            'No `return` means `undefined` (typed `void`).',
            'The number of arguments is checked at compile time.',
          ],
        ),
      },
      {
        id: 'signature',
        kind: 'predictType',
        bonus: true,
        prompt: L('Go further: what is the type of the function `double`?', 'A challenge: what type is the machine `double`?'),
        hint: L('A function type looks like `(parameter: Type) => ReturnType`.', 'Machine types look like `(input: Type) => OutputType`.'),
        code: c('function double(n: number) {', '  return n * 2;', '}', 'console.log(double(4));'),
        target: 'double',
        answer: '(n: number) => number',
        alsoAccept: ['(x: number) => number', '(value: number) => number'],
        explain: L(
          'The return type `number` is inferred from `n * 2`. Parameter names in a function type are only labels.',
          'TypeScript works out that doubling a number gives a number.',
          'Return types are inferred from `return` expressions; parameter names in function types do not affect assignability, only the positions and types do.',
        ),
      },
    ],
    recap: LL(
      [
      'Functions name a piece of work.',
      'Parameters in, `return` out.',
      'No `return` means `undefined`.',
    ],
      [
        'Functions are machines with names.',
        'Things go in; `return` gives the answer out.',
        'No `return` means the answer is `undefined`.',
      ],
      [
        'A signature is a contract: parameter types in, return type out.',
        'Declarations are hoisted; `const` functions are not.',
        'Pure functions are the easiest code to test.',
      ],
    ),
  },

  {
    id: 'm04-l02-arrow-functions',
    moduleId: 'm04',
    order: 2,
    title: {
      story: 'The short way to write a machine',
      explorer: 'Return types and arrow functions',
      pro: 'Arrow functions and explicit return types',
    },
    estMinutes: 6,
    concepts: ['arrow-function', 'annotation', 'return', 'function'],
    steps: [
      {
        id: 'read',
        kind: 'read',
        prompt: L(
          '`=>` is the same idea in fewer words.',
          '`=>` makes the same kind of machine, with fewer words.',
        ),
        body: L(
          md(
            'An **arrow function** is a shorter spelling of the same thing:',
            '```ts\nconst double = (n: number): number => n * 2;\n```',
            'With no braces, the expression after `=>` is returned automatically. Add braces and you must write `return` yourself.',
            'Write the return type on purpose. It is a small contract that catches mistakes inside the function before they reach the caller.',
          ),
          md(
            'Arrows are a quick way to write a machine: `const double = (n) => n * 2;`.',
            'If there are no curly braces, the answer comes back automatically. No `return` needed.',
          ),
          md(
            'Arrow functions differ from declarations in more than spelling: they have no own `this`, `arguments` or `prototype`, and cannot be called with `new`. That lexical `this` is why they are the default for callbacks.',
            'A concise body (`=> expr`) returns the expression. To return an object literal, wrap it in parentheses, `() => ({ ok: true })`; otherwise the braces are read as a block.',
            'An explicit return type stops inference from widening an accidental result (say, `number | undefined`) and reports the mistake in the function that made it, not in its callers.',
          ),
        ),
      },
      {
        id: 'compare',
        kind: 'compare',
        prompt: L('Same function, two shapes.', 'One machine, two ways to write it.'),
        left: {
          title: 'Declaration',
          code: c(
            'function square(n: number): number {',
            '  return n * n;',
            '}',
          ),
          caption: L('Clear, and easy to read in a stack trace.', 'Clear, with its name at the front.'),
        },
        right: {
          title: 'Arrow',
          code: c('const square = (n: number): number => n * n;'),
          caption: L(
            'Shorter. Common when passing a function to another function.',
            'Shorter. Handy when you give a machine to another machine.',
          ),
        },
      },
      {
        id: 'spot',
        kind: 'check',
        prompt: L(
          'Which arrow function actually returns a value?',
          'Which arrow machine really gives an answer back?',
        ),
        hint: L(
          'An arrow function with braces needs an explicit `return`; without braces it returns the expression.',
          'Look at the `{ }`. With them, you need the word `return`.',
        ),
        explain: L(
          'Without braces, the expression is returned. `{ n * 2 }` is a block, so it returns `undefined`.',
          'Without `{ }`, the answer is given back by itself. With `{ }` you must write `return`, or the answer is `undefined`.',
          '`=> { n * 2 }` is a block body whose expression statement is discarded, so the function returns `undefined` (typed `void`). `->` is not JavaScript syntax at all.',
        ),
        choices: [
          { id: 'implicit', text: L('`const f = (n: number) => n * 2;`'), correct: true },
          {
            id: 'block',
            text: L('`const f = (n: number) => { n * 2 };`'),
            correct: false,
            feedback: L(
              'Braces make a block. A block with no `return` gives `undefined`.',
              'The `{ }` make a block. Without `return` inside, it gives back `undefined`.',
            ),
          },
          {
            id: 'wrong-arrow',
            text: L('`const f = (n: number) -> n * 2;`'),
            correct: false,
            feedback: L(
              'Arrow functions use `=>`, with an equals sign.',
              'Arrows are written `=>`, with an equals sign.',
            ),
          },
        ],
      },
      {
        id: 'write',
        kind: 'write',
        prompt: L(
          'Write `square` as an arrow function with a return type.',
          'Make `square` as an arrow machine with an answer label.',
        ),
        starter: c('const square = (n: number) => {', '  // return n * n', '};'),
        solution: c('const square = (n: number): number => n * n;'),
        tests: [
          { name: 'square(4)', call: 'square(4)', expect: '16' },
          { name: 'square(0)', call: 'square(0)', expect: '0' },
          { name: 'square(-3)', call: 'square(-3)', expect: '9' },
        ],
        hint: L(
          'Drop the braces and put `n * n` straight after `=>`.',
          'Take away the `{ }` and write `n * n` straight after `=>`.',
        ),
      },
      {
        id: 'recap',
        kind: 'recap',
        prompt: L('The short version.', 'What you learned.'),
        points: LL(
          [
          '`=>` is the short form of a function.',
          'No braces means the expression is returned.',
          'Annotate the return type; it catches real bugs.',
        ],
          [
            '`=>` is the short way to make a function.',
            'With no `{ }`, the answer comes back by itself.',
            'A label for the answer helps catch mistakes.',
          ],
          [
            'Arrow functions have lexical `this` and no `arguments`.',
            'A concise body returns its expression; wrap an object literal in `()`.',
            'An explicit return type keeps errors where they start.',
          ],
        ),
      },
      {
        id: 'twice',
        kind: 'write',
        bonus: true,
        prompt: L('Go further: write `twice`: it takes a function and returns a new function that calls it two times.', 'A challenge: make `twice`, a machine that makes a machine run two times!'),
        starter: c('function twice(fn: (n: number) => number): (n: number) => number {', '  return fn;', '}'),
        solution: c('function twice(fn: (n: number) => number): (n: number) => number {', '  return (n) => fn(fn(n));', '}'),
        tests: [
          { name: 'add one twice', call: 'twice((n) => n + 1)(5)', expect: '7' },
          { name: 'double twice', call: 'twice((n) => n * 2)(3)', expect: '12' },
        ],
        hint: L('Return an arrow function: `(n) => fn(fn(n))`.', 'Give back a new arrow machine that feeds the answer of `fn` into `fn` again.'),
        explain: L(
          '`twice` returns a function, so its return type is a function type. The inner `n` is typed from that return type.',
          '`twice` builds a new machine and hands it back. Cool!',
          'A higher-order function returning a closure; the returned arrow’s parameter is contextually typed by the declared return type.',
        ),
      },
    ],
    recap: LL(
      [
      'Arrow functions are just shorter functions.',
      'Braces need `return`; no braces return automatically.',
      'Write the return type — it is a contract.',
    ],
      [
        'Arrow functions are just shorter functions.',
        '`{ }` need `return`; without them, the answer comes back by itself.',
        'Write the answer label — it is a promise.',
      ],
      [
        'Use arrow functions for callbacks and small helpers.',
        'Write `() => ({ … })` to return an object literal.',
        'Declare return types on public functions.',
      ],
    ),
  },

  {
    id: 'm04-l03-defaults-rest',
    moduleId: 'm04',
    order: 3,
    title: {
      story: 'Optional and endless inputs',
      explorer: 'Default values, optional parameters and rest',
      pro: 'Defaults, optional parameters, rest args',
    },
    estMinutes: 6,
    concepts: ['parameter', 'optional', 'annotation', 'function'],
    steps: [
      {
        id: 'read',
        kind: 'read',
        prompt: L(
          'Parameters can have a fallback, or accept many values.',
          'A machine can have a spare value, or take as many things as you like.',
        ),
        body: L(
          md(
            'Three small tools make functions more forgiving:',
            bullets(
              'A **default** fills in when the argument is `undefined`: `function greet(name = "friend")`.',
              'An **optional** parameter is marked with `?`: `shout?: boolean`. Its type becomes `boolean | undefined`.',
              '**Rest** collects the remaining arguments into an array: `(...numbers: number[])`.',
            ),
            'Defaults catch `undefined`, not `null`. That distinction matters when data comes from elsewhere.',
          ),
          md(
            'Functions can have fallbacks. If nobody says a name, call them "friend".',
            'A parameter with a `?` is allowed to be missing.',
            '`...numbers` scoops up every extra value into one list.',
          ),
          md(
            'A default applies when the argument is `undefined`, passed explicitly or left out, but not when it is `null`. Defaults are evaluated at call time, so `(list = [])` creates a fresh array on every call (unlike Python).',
            'An optional parameter `x?: T` is `T | undefined` inside the body; a parameter with a default is optional for callers but plain `T` inside. Optional parameters must come after required ones.',
            'Rest parameters are real arrays (`...nums: number[]`) and must come last. A tuple type, `...args: [string, number]`, types them position by position.',
          ),
        ),
      },
      {
        id: 'predict',
        kind: 'predict',
        prompt: L('What prints when no name is given?', 'What will it show when no name is given?'),
        hint: L(
          'A default value is used only when the argument is missing. Check each call.',
          'The first time, no name is given. The second time, "Ada" is given.',
        ),
        code: c(
          'function greet(name = "friend"): string {',
          '  return `Hi ${name}`;',
          '}',
          '',
          'console.log(greet());',
          'console.log(greet("Ada"));',
        ),
        answer: c('Hi friend', 'Hi Ada'),
        explain: L(
          'The default only appears when the argument is missing or `undefined`.',
          'The spare value is only used when nothing is given.',
          'Leaving the argument out passes `undefined`, which triggers the default; `greet(undefined)` behaves the same. `greet(null)` would not, and TypeScript rejects `null` for a `string` parameter anyway.',
        ),
      },
      {
        id: 'fill',
        kind: 'fill',
        prompt: L('Give `name` a sensible fallback.', 'Give `name` a spare value.'),
        hint: L(
          'The default must be a string value, so it needs quotes.',
          'The spare value is a word. Words need quotes.',
        ),
        template: c('function greet(name: string = ___): string {', '  return `Hi ${name}`;', '}'),
        bank: ['"friend"', 'friend', 'undefined', '"name"'],
        answers: ['"friend"'],
        explain: L(
          'The default is a value, so it needs quotes: `"friend"`. Without them it would be a variable called friend.',
          'The spare value is a word, so it needs quotes: `"friend"`. Without quotes, it would be the name of a box.',
          'A default is an expression evaluated at call time, here a string literal. It also lets TypeScript infer the parameter type, so the `: string` annotation is optional.',
        ),
      },
      {
        id: 'write',
        kind: 'write',
        prompt: L(
          'Write `sumAll` so it adds any number of arguments. `sumAll()` must be 0.',
          'Make `sumAll` add up any amount of numbers. `sumAll()` with nothing must give 0.',
        ),
        starter: c(
          'function sumAll(...numbers: number[]): number {',
          '  // reduce the array to one total',
          '  return 0;',
          '}',
        ),
        solution: c(
          'function sumAll(...numbers: number[]): number {',
          '  return numbers.reduce((total, n) => total + n, 0);',
          '}',
        ),
        tests: [
          { name: 'no numbers', call: 'sumAll()', expect: '0' },
          { name: 'three numbers', call: 'sumAll(1, 2, 3)', expect: '6' },
          { name: 'one number', call: 'sumAll(9)', expect: '9' },
        ],
        hint: L(
          '`numbers` is already an array. Add its items with `reduce`, starting from 0.',
          '`numbers` is already a list. Add them up with `reduce`, starting from 0.',
        ),
      },
      {
        id: 'recap',
        kind: 'recap',
        prompt: L('The short version.', 'What you learned.'),
        points: LL(
          [
          'Defaults fill in for `undefined`.',
          '`?` marks a parameter that may be missing.',
          '`...rest` collects extra arguments into an array.',
        ],
          [
            'A spare value is used when nothing is given.',
            '`?` means "you may leave this out".',
            '`...` collects all the extra things into a list.',
          ],
          [
            'Defaults apply to `undefined` only, and are evaluated on every call.',
            '`x?: T` is `T | undefined` inside the body.',
            'Rest parameters are arrays and must come last.',
          ],
        ),
      },
      {
        id: 'join-words',
        kind: 'write',
        bonus: true,
        prompt: L(
          'Go further: write `listOf(...items)` so `listOf("tea", "cake", "jam")` gives `"tea, cake and jam"`.',
          'A challenge: make `listOf` turn any number of words into "tea, cake and jam".',
        ),
        starter: c('function listOf(...items: string[]): string {', '  return items.join(", ");', '}'),
        solution: c(
          'function listOf(...items: string[]): string {',
          '  if (items.length <= 1) return items.join("");',
          '  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;',
          '}',
        ),
        tests: [
          { name: 'three', call: 'listOf("tea", "cake", "jam")', expect: 'tea, cake and jam' },
          { name: 'two', call: 'listOf("salt", "pepper")', expect: 'salt and pepper' },
          { name: 'one', call: 'listOf("milk")', expect: 'milk' },
          { name: 'none', call: 'listOf()', expect: '' },
        ],
        hint: L(
          'All but the last: `items.slice(0, -1).join(", ")`; then `" and "` and the last item. Handle 0 or 1 items first.',
          'Glue all but the last word with commas, then add " and " and the last word. For 0 or 1 words, just glue them.',
        ),
        explain: L(
          'A rest parameter collects any number of arguments into an array, so the usual array tools work on it.',
          '`...items` catches all the words into one list.',
          'Rest parameters are typed as arrays (`string[]`). For real UI, `Intl.ListFormat` produces this in every language.',
        ),
      },
    ],
    recap: LL(
      [
      'Defaults are plain values: `name = "friend"`.',
      '`?` means the caller can leave it out.',
      'Rest parameters are just arrays.',
    ],
      [
        'Spare values are plain values: `name = "friend"`.',
        '`?` means it can be left out.',
        '`...numbers` is just a list.',
      ],
      [
        'Defaults do not cover `null`; normalise it explicitly.',
        'Optional parameters go after the required ones.',
        'Rest parameters can be typed as tuples.',
      ],
    ),
  },

  {
    id: 'm04-l04-callbacks',
    moduleId: 'm04',
    order: 4,
    title: {
      story: 'Handing a machine to a machine',
      explorer: 'Callbacks and higher-order functions',
      pro: 'Functions as values, callbacks and composition',
    },
    estMinutes: 6,
    concepts: ['callback', 'higher-order-function', 'function', 'map'],
    steps: [
      {
        id: 'read',
        kind: 'read',
        prompt: L(
          'A function can be passed to another function.',
          'You can give a machine to another machine.',
        ),
        body: L(
          md(
            'Functions are values. You can put one in a variable, pass it as an argument, or return it.',
            'A **callback** is a function you hand to another function so it can call it later:',
            '```ts\nitems.map(item => item.name);\nprices.filter(price => price > 10);\n```',
            'A function that takes or returns another function is a **higher-order function**. `map`, `filter` and `find` are all like this, and they are why lists stopped needing manual loops.',
          ),
          md(
            'You can give a machine to another machine. "Here, use this rule on every item."',
            'That little rule is called a **callback**.',
          ),
          md(
            'Functions are first-class values with structural types: `(value: number) => number` describes any function with that signature. Callback parameters are typed from context, which is why `items.map(item => item.name)` needs no annotations.',
            'Under `strictFunctionTypes`, parameters of function types are checked contravariantly: a callback that only accepts a `Dog` cannot be passed where any `Animal` may be handed to it.',
            'Passing a method as a callback detaches it from its object (`list.map(obj.method)` loses `this`); wrap it in an arrow function or bind it.',
          ),
        ),
      },
      {
        id: 'compare',
        kind: 'compare',
        prompt: L('The same rule, named or inline.', 'The same rule, with a name or without.'),
        left: {
          title: 'Named callback',
          code: c(
            'function isAdult(person: Person) {',
            '  return person.age >= 18;',
            '}',
            '',
            'people.filter(isAdult);',
          ),
          caption: L('Easier to reuse and to test on its own.', 'Easy to use again, and to test on its own.'),
        },
        right: {
          title: 'Inline arrow',
          code: c('people.filter(person => person.age >= 18);'),
          caption: L(
            'Reads well when the rule is short and used once.',
            'Easy to read when the rule is short and used once.',
          ),
        },
      },
      {
        id: 'spot',
        kind: 'check',
        prompt: L(
          'In `prices.map(p => p * 2)`, what is the callback?',
          'In `prices.map(p => p * 2)`, which part is the little machine you hand over?',
        ),
        hint: L(
          'A callback is a function passed as an argument. Which part inside the brackets is a function?',
          'Look inside the brackets of `map(...)`. Which part is a machine with `=>`?',
        ),
        explain: L(
          'The callback is the arrow function. `map` calls it once per item.',
          'The arrow machine is the one handed over. `map` uses it once for every price.',
          '`map` is the higher-order function; `p => p * 2` is the callback it invokes for each element with `(value, index, array)`. Only the first parameter is used here; the extra arguments are ignored.',
        ),
        choices: [
          { id: 'map', text: L('`map`'), correct: false, feedback: L(
            '`map` is the higher-order function doing the calling.',
            '`map` is the big machine that uses the little one.',
          ) },
          { id: 'arrow', text: L('`p => p * 2`'), correct: true },
          { id: 'prices', text: L('`prices`'), correct: false, feedback: L(
            'That is the array being worked on.',
            'That is the list being worked on.',
          ) },
        ],
      },
      {
        id: 'write',
        kind: 'write',
        prompt: L(
          'Write `applyTwice` so it calls the given function twice, passing the result along.',
          'Make `applyTwice` use the machine two times, passing the answer along.',
        ),
        starter: c(
          'function applyTwice(fn: (value: number) => number, start: number): number {',
          '  // apply fn twice',
          '  return start;',
          '}',
        ),
        solution: c(
          'function applyTwice(fn: (value: number) => number, start: number): number {',
          '  return fn(fn(start));',
          '}',
        ),
        tests: [
          { name: 'add one twice', call: 'applyTwice((n) => n + 1, 5)', expect: '7' },
          { name: 'double twice', call: 'applyTwice((n) => n * 2, 3)', expect: '12' },
        ],
        hint: L(
          'Call `fn` on `start`, then call `fn` again on the result.',
          'Use `fn` on `start`, then use `fn` again on that answer.',
        ),
      },
      {
        id: 'recap',
        kind: 'recap',
        prompt: L('The short version.', 'What you learned.'),
        points: LL(
          [
          'Functions can be stored and passed like any value.',
          'A callback is a function handed to another function.',
          'Higher-order functions take or return functions.',
        ],
          [
            'Functions can be kept in boxes and passed around.',
            'A machine you hand to another machine is called a callback.',
            'Some machines take other machines as input.',
          ],
          [
            'Function types are structural: `(x: A) => B`.',
            'Inline callbacks get their parameter types from context.',
            'Methods lose `this` when passed on their own; wrap or bind them.',
          ],
        ),
      },
      {
        id: 'counter',
        kind: 'write',
        bonus: true,
        prompt: L('Go further: write `makeCounter`. Each counter it makes remembers its own count.', 'A challenge: make `makeCounter`, a machine that builds counters that remember their number.'),
        starter: c('function makeCounter(): () => number {', '  return () => 0;', '}'),
        solution: c('function makeCounter(): () => number {', '  let count = 0;', '  return () => {', '    count += 1;', '    return count;', '  };', '}'),
        tests: [
          { name: 'counts up', call: '(() => { const next = makeCounter(); next(); next(); return next(); })()', expect: '3' },
          { name: 'counters are separate', call: '(() => { const a = makeCounter(); const b = makeCounter(); a(); a(); return b(); })()', expect: '1' },
        ],
        hint: L('Keep `let count = 0` inside `makeCounter`, and return a function that adds one and returns it.', 'Put a `let count = 0` inside, and give back a little machine that adds one and says the number.'),
        explain: L(
          'The returned function keeps access to `count` after `makeCounter` has finished. That is a *closure*, and each call makes a fresh one.',
          'The little machine remembers its own `count`, even later. Each counter has its own.',
          'Closures capture bindings, not values; each invocation of `makeCounter` creates a new environment, which is how modules kept private state before classes had `#private`.',
        ),
      },
    ],
    recap: LL(
      [
      'Functions are values.',
      '`map` and `filter` take callbacks.',
      'Passing behaviour in is often cleaner than branching inside.',
    ],
      [
        'Functions are values, like numbers and words.',
        '`map` and `filter` take a little machine.',
        'Handing over a machine is often simpler than lots of `if`s.',
      ],
      [
        'Pass behaviour in as a value instead of a flag.',
        'Let contextual typing annotate inline callbacks.',
        'Give a callback a name once it carries real logic.',
      ],
    ),
  },
];

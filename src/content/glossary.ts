/**
 * Reference material. Deliberately written in one voice, not per mode: a
 * glossary should say the same true thing to a 9-year-old and to an adult, just
 * briefly, and the example does the age-appropriate explaining.
 */

export interface GlossaryEntry {
  id: string;
  term: string;
  short: string;
  detail: string;
  example?: string;
  related?: readonly string[];
}

export const GLOSSARY: readonly GlossaryEntry[] = [
  {
    id: 'program',
    term: 'Program',
    short: 'A list of instructions a computer follows in order.',
    detail:
      'A program is read top to bottom, one instruction at a time. If an instruction fails, everything after it may not run at all.',
    example: 'console.log("one");\nconsole.log("two");',
  },
  {
    id: 'instruction',
    term: 'Instruction',
    short: 'One single thing the computer is told to do.',
    detail:
      'Small instructions add up to whole programs. "Show this text", "add these numbers", "remember this name" are all instructions.',
  },
  {
    id: 'javascript',
    term: 'JavaScript',
    short: 'The language browsers run, and the base TypeScript is built on.',
    detail:
      'Every TypeScript file becomes JavaScript before it runs. You never lose JavaScript by learning TypeScript — you describe it more precisely.',
  },
  {
    id: 'typescript',
    term: 'TypeScript',
    short: 'JavaScript with type labels that are checked before the code runs.',
    detail:
      'TypeScript adds a checking step. You write the same JavaScript you would anyway, plus notes about what kind of value each thing holds. The checker reads those notes and points out contradictions early.',
  },
  {
    id: 'type',
    term: 'Type',
    short: 'The kind of value something holds, such as text, a number, or true/false.',
    detail:
      'The three everyday types are `string`, `number` and `boolean`. Types are how TypeScript knows that `"hello".toFixed()` cannot work: `toFixed` belongs to numbers, not text.',
  },
  {
    id: 'string',
    term: 'String',
    short: 'Text: any characters inside quotes.',
    detail:
      'Strings can be joined with `+`, measured with `.length`, and changed with methods such as `.toUpperCase()`. Strings are not numbers, even when they look like one: `"7"` is text.',
    example: 'const name = "Ada";',
  },
  {
    id: 'number',
    term: 'Number',
    short: 'A numeric value, including decimals and negatives.',
    detail:
      'TypeScript has one number type for whole numbers and decimals alike. Money is usually stored in whole cents to avoid rounding surprises.',
    example: 'const price = 4.5;',
  },
  {
    id: 'boolean',
    term: 'Boolean',
    short: 'Either `true` or `false`.',
    detail:
      'Comparisons produce booleans: `age >= 18` is either true or false. Booleans are what `if` statements ask about.',
  },
  {
    id: 'console',
    term: 'console',
    short: 'The place a program writes text you can read.',
    detail:
      '`console.log(value)` prints a value. In this app it appears in the output panel under your code. In a browser it also goes to the developer console.',
    example: 'console.log("hello");',
  },
  {
    id: 'variable',
    term: 'Variable',
    short: 'A named place that holds a value.',
    detail:
      'You give a value a name so you can use it again. The name should say what the value means, not what it looks like.',
    example: 'const userName = "Sam";',
  },
  {
    id: 'const',
    term: 'const',
    short: 'A name whose value will not be swapped for another.',
    detail:
      'Use `const` by default. It tells the reader "this name always points at this value". The value inside an object can still change; the name cannot point elsewhere.',
  },
  {
    id: 'let',
    term: 'let',
    short: 'A name whose value will change later.',
    detail:
      'Use `let` only when the value really is replaced, such as a count that goes up. If you never reassign it, `const` communicates more.',
  },
  {
    id: 'inference',
    term: 'Inference',
    short: 'TypeScript working out a type on its own.',
    detail:
      'You rarely need to write a type twice. `const age = 36` already tells TypeScript it is a number. Writing it again adds noise, not safety.',
  },
  {
    id: 'annotation',
    term: 'Type annotation',
    short: 'A type you write on purpose, after a colon.',
    detail:
      'Annotate the edges of your code: function parameters, return values, and exported shapes. Let the middle look after itself.',
    example: 'function double(n: number): number {\n  return n * 2;\n}',
  },
  {
    id: 'template-literal',
    term: 'Template literal',
    short: 'Text built with backticks that can drop values inside it.',
    detail:
      'Inside backticks, `${...}` inserts a value. Template literals are usually clearer than a chain of `+ " " +` pieces.',
    example: 'const message = `Hi, ${name}!`;',
  },
  {
    id: 'operator',
    term: 'Operator',
    short: 'A symbol that combines or compares values.',
    detail:
      'Arithmetic uses `+ - * / %`. Comparison uses `=== !== < > <= >=`. Mixing operators without brackets is a common source of surprises.',
  },
  {
    id: 'comparison',
    term: 'Comparison',
    short: 'An expression that answers true or false.',
    detail:
      'Prefer `===` and `!==`. The looser `==` converts values before comparing, so `0 == ""` is true, which is almost never what you want.',
  },
  {
    id: 'truthiness',
    term: 'Truthiness',
    short: 'Which values count as true in a condition.',
    detail:
      '`false`, `0`, `""`, `null`, `undefined` and `NaN` count as false. Everything else counts as true — including the string `"false"`, which surprises people.',
  },
  {
    id: 'ternary',
    term: 'Ternary',
    short: 'A one-line if/else that produces a value.',
    detail:
      'The shape is `condition ? whenTrue : whenFalse`. Use it when both answers are short. If either side needs explaining, use `if`.',
  },
  {
    id: 'switch',
    term: 'switch',
    short: 'A neat way to pick one of several fixed options.',
    detail:
      'Each `case` is compared with `===`. A `default` handles everything else. Without a `return` or `break`, execution falls into the next case.',
  },
  {
    id: 'guard-clause',
    term: 'Guard clause',
    short: 'An early `return` that deals with the odd case first.',
    detail:
      'Checking the unusual case at the top and returning early keeps the main path flat and readable, instead of nesting it inside an `if`.',
  },
  {
    id: 'array',
    term: 'Array',
    short: 'An ordered list of values, written in square brackets.',
    detail:
      'Items are numbered from 0. `list[0]` is the first item. Arrays have helpers such as `.map`, `.filter` and `.find` that avoid manual loops.',
    example: 'const fruits = ["apple", "pear"];\nfruits[0]; // "apple"',
  },
  {
    id: 'loop',
    term: 'Loop',
    short: 'Code that runs again and again, once per item or until a condition is false.',
    detail:
      '`for (let i = 0; i < 3; i++)` counts; `for (const item of list)` visits each item; `while (condition)` repeats as long as the condition is true. A loop whose condition never becomes false never ends — this app stops it after two seconds.',
    example: 'for (const fruit of ["apple", "pear"]) {\n  console.log(fruit);\n}',
  },
  {
    id: 'index',
    term: 'Index',
    short: 'A position in an array, counting from zero.',
    detail:
      'The first item is at index 0, the second at 1. Asking for an index that does not exist gives `undefined`, not an error.',
  },
  {
    id: 'object',
    term: 'Object',
    short: 'A bundle of named values, written in curly braces.',
    detail:
      'Objects group related facts: a user has a name, an age, a favourite colour. Read a value with a dot: `user.name`.',
    example: 'const user = { name: "Ada", age: 36 };',
  },
  {
    id: 'property',
    term: 'Property',
    short: 'One named value inside an object.',
    detail:
      '`name` in `{ name: "Ada" }` is a property. Dot access reads it; `user.name = "Sam"` changes it when the object is not readonly.',
  },
  {
    id: 'destructuring',
    term: 'Destructuring',
    short: 'Unpacking values into names in one line.',
    detail:
      '`const { name, age } = user` makes two variables. `const [first, second] = list` does the same for arrays.',
  },
  {
    id: 'spread',
    term: 'Spread',
    short: 'Copying the contents of an array or object into a new one.',
    detail:
      '`{ ...user, age: 37 }` makes a new object with one property changed. The original is untouched, which is usually what you want.',
  },
  {
    id: 'map',
    term: '.map',
    short: 'Turning every item into something else.',
    detail:
      '`map` returns a new array of the same length. `[1, 2].map(n => n * 2)` gives `[2, 4]`.',
  },
  {
    id: 'filter',
    term: '.filter',
    short: 'Keeping only the items that pass a test.',
    detail:
      'The callback returns true to keep an item, false to drop it. The result can be shorter than the original, but never longer.',
  },
  {
    id: 'find',
    term: '.find',
    short: 'Getting the first item that matches.',
    detail:
      'Returns the item itself, or `undefined` if nothing matches. Since it can be undefined, check before using the result.',
  },
  {
    id: 'function',
    term: 'Function',
    short: 'A named recipe: some inputs, some work, one result.',
    detail:
      'Functions let you name an idea once and reuse it. Call one with brackets: `double(4)`.',
    example: 'function double(n: number): number {\n  return n * 2;\n}',
  },
  {
    id: 'parameter',
    term: 'Parameter',
    short: 'A named input a function expects.',
    detail:
      'In `function greet(name: string)`, `name` is the parameter. The `: string` part is its type.',
  },
  {
    id: 'argument',
    term: 'Argument',
    short: 'The actual value you pass when calling a function.',
    detail:
      'In `greet("Ada")`, `"Ada"` is the argument. Parameters are the slots; arguments are what goes into them.',
  },
  {
    id: 'return',
    term: 'return',
    short: 'Handing a value back out of a function.',
    detail:
      'A function with no `return` gives back `undefined`. Calling `return` also stops the function immediately.',
  },
  {
    id: 'arrow-function',
    term: 'Arrow function',
    short: 'A shorter way to write a function, using `=>`.',
    detail:
      '`const double = (n: number) => n * 2;` is the same as a `function` declaration for most everyday uses, with an implicit return.',
  },
  {
    id: 'callback',
    term: 'Callback',
    short: 'A function you hand to another function.',
    detail:
      '`.map(price => price * 2)` passes a callback. The array decides when to call it, and with which item.',
  },
  {
    id: 'higher-order-function',
    term: 'Higher-order function',
    short: 'A function that takes or returns another function.',
    detail:
      '`map`, `filter`, `find` and `setTimeout` are all higher-order. They let one function describe a whole pattern of work.',
  },
  {
    id: 'pure-function',
    term: 'Pure function',
    short: 'A function whose result depends only on its inputs.',
    detail:
      'No reading the clock, no changing outside values, no randomness. Pure functions are the easiest kind of code to test and reason about.',
  },
  {
    id: 'interface',
    term: 'interface',
    short: 'A named description of an object’s shape.',
    detail:
      '`interface User { name: string }` says any `User` has a `name`. Interfaces are ideal for object shapes that several files share.',
    example: 'interface User {\n  name: string;\n  age?: number;\n}',
  },
  {
    id: 'type-alias',
    term: 'type alias',
    short: 'A name for any type, including unions.',
    detail:
      '`type Status = "open" | "closed"` is a type alias. Use `type` when you need a union; either is fine for objects.',
  },
  {
    id: 'union',
    term: 'Union',
    short: 'A value that could be one of several types.',
    detail:
      '`string | number` means either. TypeScript makes you check which one you have before using methods that only one of them has.',
  },
  {
    id: 'literal-type',
    term: 'Literal type',
    short: 'A type made of exact allowed values.',
    detail:
      '`"small" | "medium" | "large"` allows those three words and nothing else. Typos become compile errors, and autocomplete lists the options.',
  },
  {
    id: 'narrowing',
    term: 'Narrowing',
    short: 'Convincing TypeScript which member of a union you have.',
    detail:
      '`typeof value === "string"` narrows `string | number` to `string` inside that branch, so string methods become available.',
  },
  {
    id: 'optional',
    term: 'Optional property',
    short: 'A property that may be missing, marked with `?`.',
    detail:
      '`age?: number` means `age` might not exist. Its type becomes `number | undefined`, so read it carefully.',
  },
  {
    id: 'readonly',
    term: 'readonly',
    short: 'A value that cannot be reassigned or changed.',
    detail:
      '`readonly id: string` stops accidental edits. It documents intent, and the compiler enforces it.',
  },
  {
    id: 'unknown',
    term: 'unknown',
    short: 'A value whose type is not known yet.',
    detail:
      'You must check an `unknown` before using it. That is the difference from `any`, which switches checking off entirely.',
  },
  {
    id: 'any',
    term: 'any',
    short: 'A type that turns checking off for that value.',
    detail:
      '`any` silences TypeScript instead of helping it. Prefer `unknown` when you genuinely do not know, then narrow.',
  },
  {
    id: 'generic',
    term: 'Generic',
    short: 'A type that works with many types, filled in at use.',
    detail:
      '`firstOf<T>(items: T[]): T` keeps the item type. Call it with numbers and you get a number back; call it with strings and you get a string.',
  },
  {
    id: 'module',
    term: 'Module',
    short: 'One file that shares only what it chooses to.',
    detail:
      'A module has its own scope. Anything not exported stays private to the file, which keeps names from colliding.',
  },
  {
    id: 'import',
    term: 'import',
    short: 'Bringing a named value in from another module.',
    detail: '`import { add } from "./math";` uses the export named `add`.',
  },
  {
    id: 'export',
    term: 'export',
    short: 'Making a value available to other modules.',
    detail:
      '`export function add(...)` publishes it. Exports are the public face of a file; keep that face small.',
  },
  {
    id: 'error',
    term: 'Error',
    short: 'A problem the computer reports instead of continuing.',
    detail:
      'An error message names what happened and where. Read the first line, then the line number, then the code at that line. That is usually enough.',
  },
  {
    id: 'try-catch',
    term: 'try / catch',
    short: 'Running risky code, with a plan if it fails.',
    detail:
      'Put the risky line in `try`. If it throws, `catch` runs instead of the whole program stopping. Do something useful there: log, retry, or return a safe value.',
  },
  {
    id: 'promise',
    term: 'Promise',
    short: 'A value that will arrive later.',
    detail:
      'Work that takes time returns a promise. You either `await` it or attach `.then`. Either way, the code keeps the result rather than the promise.',
  },
  {
    id: 'async-await',
    term: 'async / await',
    short: 'Writing later-arriving work so it reads top to bottom.',
    detail:
      'Mark the function `async`, then `await` the promise. The function pauses there without blocking the rest of the program.',
  },
  {
    id: 'class',
    term: 'Class',
    short: 'A blueprint for objects that share behaviour.',
    detail:
      'A class bundles data and the functions that work on it. Useful for things with identity and state, such as a game character. For plain data, an object and a few functions is usually simpler.',
  },
  {
    id: 'method',
    term: 'Method',
    short: 'A function that belongs to an object or class.',
    detail: '`counter.increment()` calls the `increment` method on `counter`.',
  },
  {
    id: 'mutation',
    term: 'Mutation',
    short: 'Changing a value that already exists.',
    detail:
      '`list.push(x)` mutates the list. `[...list, x]` makes a new one. Both are fine; knowing which you did prevents most baffling bugs.',
  },
  {
    id: 'persistence',
    term: 'Saving progress',
    short: 'Keeping your place between visits.',
    detail:
      'This app stores progress in your own browser. Nothing leaves the device, and exporting gives you a copy you can move.',
  },
  {
    id: 'string-method',
    term: "String method",
    short: "A tool that every piece of text has, used with a dot.",
    detail:
      "Methods such as `trim`, `slice`, `split`, `includes` and `toUpperCase` work on a string and give back a result. They never change the original text.",
    example: "\"  hi  \".trim().toUpperCase(); // \"HI\"",
    related: ['string', 'immutability'],
  },
  {
    id: 'immutability',
    term: "Immutability",
    short: "Never changing a value in place: making a new one instead.",
    detail:
      "Strings are always immutable. Objects and arrays can be changed, but treating them as immutable (copying with spread before changing) makes code easier to follow and test.",
    example: "const next = { ...pet, hunger: 0 }; // pet is unchanged",
    related: ['spread', 'mutation'],
  },
  {
    id: 'sort',
    term: "sort",
    short: "Puts an array in order, using a comparator you give it.",
    detail:
      "`sort` changes the array it is called on. Without a comparator it compares items as text, so numbers need `(a, b) => a - b`. Sort a copy (`[...list].sort(...)`) to keep the original.",
    example: "[10, 9, 1].sort((a, b) => a - b); // [1, 9, 10]",
    related: ['array', 'mutation'],
  },
  {
    id: 'some-every',
    term: "some and every",
    short: "Ask a yes/no question about a whole array.",
    detail:
      "`some` is true when at least one item passes the test; `every` is true when all of them do. Both stop as soon as they know the answer. `every` on an empty array is `true`.",
    example: "[3, 8].some((n) => n > 5);  // true\n[3, 8].every((n) => n > 5); // false",
    related: ['array', 'callback'],
  },
  {
    id: 'reduce',
    term: "reduce",
    short: "Folds an array into one value, step by step.",
    detail:
      "`reduce` calls your function with a running value (the accumulator) and each item in turn. Always give a starting value: it decides the result for an empty array and the accumulator’s type.",
    example: "[2, 3, 5].reduce((sum, n) => sum + n, 0); // 10",
    related: ['array', 'callback'],
  },
  {
    id: 'map-collection',
    term: "Map (collection)",
    short: "Stores values under keys, and looks them up fast.",
    detail:
      "A `Map<K, V>` keeps key–value pairs in insertion order. Any value can be a key. `get` returns `V | undefined`, because the key might be missing. Not to be confused with the `map` method of arrays.",
    example: "const ages = new Map<string, number>();\nages.set(\"Ada\", 36);\nages.get(\"Ada\"); // 36",
    related: ['set', 'object'],
  },
  {
    id: 'set',
    term: "Set",
    short: "A collection that keeps each value only once.",
    detail:
      "Adding a value that is already in a `Set` does nothing. `has` checks membership quickly, and `[...new Set(list)]` removes repeats from a list.",
    example: "new Set([\"a\", \"b\", \"a\"]).size; // 2",
    related: ['map-collection', 'array'],
  },
  {
    id: 'state',
    term: "State",
    short: "The data a program remembers, which changes over time.",
    detail:
      "A game’s score, a pet’s hunger, the items in a to-do list: all state. Keeping state in one place, and changing it only through small functions, makes programs easier to understand.",
    example: "let pet = { hunger: 30 };\npet = care(pet, \"feed\");",
    related: ['immutability', 'pure-function'],
  },
  {
    id: 'void',
    term: "void",
    short: "The return type of a function that gives nothing back.",
    detail:
      "A function returning `void` is used for what it does, not for a value. In a callback type, `void` means the return value is ignored, so a function that returns something still fits.",
    example: "const log = (message: string): void => console.log(message);",
    related: ['function', 'function-type'],
  },
  {
    id: 'function-type',
    term: "Function type",
    short: "The type of a function: its parameters and what it returns.",
    detail:
      "Written `(value: number) => string`. Function types let you describe callbacks and store functions in variables, and TypeScript uses them to type a callback’s parameters for you.",
    example: "type Formatter = (value: number) => string;",
    related: ['callback', 'function'],
  },
  {
    id: 'overload',
    term: "Overload",
    short: "Several signatures for one function, when the return type depends on the input.",
    detail:
      "Overload signatures are listed above one implementation. Callers see only the overloads, tried in order. Prefer a union or a generic when they can express the same thing.",
    example: "function parse(input: string): number;\nfunction parse(input: string[]): number[];\nfunction parse(input: string | string[]) { /* … */ }",
    related: ['function-type', 'union'],
  },
  {
    id: 'type-predicate',
    term: "Type predicate",
    short: "A return type like `value is string` that makes a function narrow types.",
    detail:
      "When a function with a type predicate returns true, TypeScript narrows the argument to that type. TypeScript trusts the predicate without checking the body, so keep it simple and correct.",
    example: "function isString(value: unknown): value is string {\n  return typeof value === \"string\";\n}",
    related: ['narrowing', 'assertion-function'],
  },
  {
    id: 'assertion-function',
    term: "Assertion function",
    short: "A function that throws unless a check passes, and narrows types after the call.",
    detail:
      "Its return type is `asserts value is T` (or `asserts condition`). If the call returns, TypeScript knows the check passed.",
    example: "function assertIsNumber(value: unknown): asserts value is number {\n  if (typeof value !== \"number\") throw new TypeError(\"not a number\");\n}",
    related: ['type-predicate', 'error'],
  },
  {
    id: 'tuple',
    term: "Tuple",
    short: "An array with a fixed length and a type for each position.",
    detail:
      "`[string, number]` holds exactly a string then a number. Positions can have labels for readers: `[name: string, age: number]`.",
    example: "const entry: [word: string, count: number] = [\"apple\", 3];",
    related: ['array', 'destructuring'],
  },
  {
    id: 'as-const',
    term: "as const",
    short: "Tells TypeScript to keep exact values and make them read-only.",
    detail:
      "`as const` infers literal types and readonly tuples and properties. It only affects types; nothing is frozen at runtime.",
    example: "const SIZES = [\"s\", \"m\"] as const;\ntype Size = (typeof SIZES)[number]; // \"s\" | \"m\"",
    related: ['literal-type', 'readonly'],
  },
  {
    id: 'index-signature',
    term: "Index signature",
    short: "A type for objects whose keys are not known in advance.",
    detail:
      "`{ [key: string]: number }` allows any string key, each holding a number. Reading a key that is not there gives `undefined` at runtime, even though the type says `number` (unless `noUncheckedIndexedAccess` is on).",
    example: "const stock: { [item: string]: number } = { pens: 12 };",
    related: ['record-type', 'object'],
  },
  {
    id: 'record-type',
    term: "Record",
    short: "`Record<Keys, Value>`: an object type with the given keys, each holding a value.",
    detail:
      "With a union of keys it requires every key; with `string` it allows any key.",
    example: "const prices: Record<\"apple\" | \"pear\", number> = { apple: 1, pear: 2 };",
    related: ['index-signature', 'mapped-type'],
  },
  {
    id: 'intersection',
    term: "Intersection",
    short: "`A & B`: a type with everything from both `A` and `B`.",
    detail:
      "A union is \"one or the other\"; an intersection is \"both at once\". If two parts disagree about a property, that property becomes `never`.",
    example: "type Person = { name: string } & { age: number };",
    related: ['union', 'interface'],
  },
  {
    id: 'satisfies',
    term: "satisfies",
    short: "Checks a value against a type without changing the value’s inferred type.",
    detail:
      "`value satisfies Type` reports mistakes like an annotation would, but keeps the precise type TypeScript inferred, so keys and literal values are not lost.",
    example: "const routes = { home: \"/\" } satisfies Record<string, string>;",
    related: ['annotation', 'inference'],
  },
  {
    id: 'discriminated-union',
    term: "Discriminated union",
    short: "A union of object types that share a tag property with a literal type.",
    detail:
      "Checking the tag (for example `event.type`) narrows the union to one member, so only that member’s properties can be used.",
    example: "type Shape =\n  | { kind: \"circle\"; radius: number }\n  | { kind: \"square\"; side: number };",
    related: ['union', 'narrowing', 'exhaustiveness'],
  },
  {
    id: 'never',
    term: "never",
    short: "The type with no values: what is left when every case is handled.",
    detail:
      "A function that always throws returns `never`, and a variable narrowed past every union member has type `never`. That makes it useful for exhaustiveness checks.",
    example: "function assertNever(value: never): never {\n  throw new Error(\"unexpected\");\n}",
    related: ['exhaustiveness', 'union'],
  },
  {
    id: 'exhaustiveness',
    term: "Exhaustiveness check",
    short: "Making TypeScript report a union member that your code forgot.",
    detail:
      "Pass the value to a function taking `never` in the last branch. If a member is not handled, the value is not `never` and the call is a type error.",
    example: "default: return assertNever(shape);",
    related: ['never', 'discriminated-union'],
  },
  {
    id: 'enum',
    term: "enum",
    short: "A named set of constants that also exists at runtime.",
    detail:
      "Numeric enums count from 0 and map both ways; string enums map names to strings. Literal unions (and `as const` objects) are often simpler, and are erased when compiled.",
    example: "enum Direction { Up, Down }\nDirection.Down; // 1",
    related: ['literal-type', 'union'],
  },
  {
    id: 'result-type',
    term: "Result type",
    short: "A return value that says whether an operation worked: `{ ok: true, value }` or `{ ok: false, error }`.",
    detail:
      "Making failure part of the return type means callers must check it. Use it for expected failures, and exceptions for bugs.",
    example: "type Result<T> = { ok: true; value: T } | { ok: false; error: string };",
    related: ['discriminated-union', 'error'],
  },
  {
    id: 'state-machine',
    term: "State machine",
    short: "A program that is always in exactly one of a fixed set of states.",
    detail:
      "Model states as a discriminated union, each carrying only its own data, and change state through one transition function. Impossible combinations cannot be written.",
    example: "type Light = { status: \"red\" } | { status: \"green\" };",
    related: ['discriminated-union', 'state'],
  },
  {
    id: 'constraint',
    term: "Generic constraint",
    short: "`T extends Something`: a requirement on a type parameter.",
    detail:
      "A constraint lets the body use what the constraint promises while callers keep their exact type.",
    example: "function longest<T extends { length: number }>(a: T, b: T): T { /* … */ }",
    related: ['generic', 'keyof'],
  },
  {
    id: 'keyof',
    term: "keyof",
    short: "The union of a type’s property names.",
    detail:
      "`keyof { id: number; name: string }` is `\"id\" | \"name\"`. Combined with `K extends keyof T`, it makes functions accept only real keys.",
    example: "type Keys = keyof User; // \"id\" | \"name\"",
    related: ['indexed-access', 'constraint'],
  },
  {
    id: 'indexed-access',
    term: "Indexed access type",
    short: "`T[K]`: the type of property `K` of `T`.",
    detail:
      "`User[\"name\"]` is the type of `name`. With a union of keys it gives a union, and `T[number]` gives the element type of an array or tuple.",
    example: "type Name = User[\"name\"]; // string",
    related: ['keyof', 'generic'],
  },
  {
    id: 'type-parameter-default',
    term: "Type parameter default",
    short: "A type used for a type parameter when none is given or inferred.",
    detail:
      "Written `<T = string>`. A default can refer to an earlier parameter, as in `Pair<A, B = A>`.",
    example: "type Pair<A, B = A> = [A, B];",
    related: ['generic'],
  },
  {
    id: 'utility-type',
    term: "Utility type",
    short: "A built-in type that builds a new type from one you have.",
    detail:
      "`Partial`, `Required`, `Readonly`, `Pick`, `Omit`, `Record`, `ReturnType`, `Parameters`, `Awaited`, `Exclude`, `Extract` and `NonNullable` are the everyday ones. Deriving types keeps them in step with their source.",
    example: "type UserUpdate = Partial<Omit<User, \"id\">>;",
    related: ['mapped-type', 'conditional-type'],
  },
  {
    id: 'generator',
    term: "Generator",
    short: "A function (`function*`) that hands out values one at a time with `yield`.",
    detail:
      "Each `yield` gives one value and pauses until the next one is asked for. Generators are lazy, so they can even be endless; take only what you need.",
    example: "function* count() { let n = 0; while (true) yield n++; }",
    related: ['iterable', 'loop'],
  },
  {
    id: 'iterable',
    term: "Iterable",
    short: "Anything `for…of` can loop over: arrays, strings, Maps, Sets, generators.",
    detail:
      "An iterable hands out its values one by one. `Iterable<T>` is the type for \"anything I can loop over that gives `T`\".",
    example: "for (const letter of \"abc\") console.log(letter);",
    related: ['generator', 'loop'],
  },
  {
    id: 'access-modifier',
    term: "Access modifier",
    short: "`public`, `private`, `protected` or `readonly` on a class member.",
    detail:
      "They say who may use a member. TypeScript checks them and then erases them; a `#name` field is private in JavaScript itself.",
    example: "class Account {\n  private balance = 0;\n  #pin = 1234;\n}",
    related: ['class', 'readonly'],
  },
  {
    id: 'getter',
    term: "Getter and setter",
    short: "Class members that look like properties but run code when read (`get`) or written (`set`).",
    detail:
      "Getters compute values on demand; setters can validate what is stored.",
    example: "get fahrenheit() { return this.celsius * 1.8 + 32; }",
    related: ['class', 'property'],
  },
  {
    id: 'static',
    term: "static",
    short: "A class member that belongs to the class itself, not to each object.",
    detail:
      "Use `static` for shared counters, constants and named constructors such as `Temperature.fromFahrenheit(50)`.",
    example: "class Ticket { static issued = 0; }",
    related: ['class'],
  },
  {
    id: 'abstract-class',
    term: "Abstract class",
    short: "A half-built class: it can share code and require subclasses to fill in methods.",
    detail:
      "Abstract methods have no body; every concrete subclass must implement them. You cannot create an abstract class directly.",
    example: "abstract class Animal {\n  abstract sound(): string;\n}",
    related: ['class', 'interface'],
  },
  {
    id: 'composition',
    term: "Composition",
    short: "Building objects from smaller parts they have, instead of long inheritance chains.",
    detail:
      "Pass the parts in (dependency injection) and depend on small interfaces, so parts can be swapped, for example for testing.",
    example: "new Greeter({ log: (message) => console.log(message) });",
    related: ['class', 'interface'],
  },
  {
    id: 'reducer',
    term: "Reducer",
    short: "A function `(state, action) => newState` that applies one change.",
    detail:
      "Actions are a discriminated union; the reducer returns a new state and never changes the old one. Replaying the actions rebuilds any state.",
    example: "todos = reducer(todos, { type: \"add\", text: \"Tea\" });",
    related: ['state', 'discriminated-union'],
  },
  {
    id: 'mapped-type',
    term: "Mapped type",
    short: "A type that goes through keys and builds a property for each: `{ [K in Keys]: … }`.",
    detail:
      "`Partial`, `Readonly` and `Record` are mapped types. Modifiers like `?` and `readonly` can be added or removed with `+` and `-`.",
    example: "type Flags<T> = { [K in keyof T]: boolean };",
    related: ['keyof', 'utility-type'],
  },
  {
    id: 'conditional-type',
    term: "Conditional type",
    short: "A type that chooses between two types: `A extends B ? X : Y`.",
    detail:
      "Like a ternary for types. Over a union it is applied to each member separately (distributive), which is how `Exclude` and `Extract` work.",
    example: "type IsString<T> = T extends string ? true : false;",
    related: ['infer', 'utility-type'],
  },
  {
    id: 'infer',
    term: "infer",
    short: "Names a piece of a type inside a conditional type, so you can use it.",
    detail:
      "In `T extends (infer Item)[] ? Item : never`, `infer Item` captures whatever the array holds. It is how `ReturnType`, `Parameters` and `Awaited` are built.",
    example: "type ElementOf<T> = T extends (infer Item)[] ? Item : never;",
    related: ['conditional-type'],
  },
  {
    id: 'template-literal-type',
    term: "Template literal type",
    short: "A string type built from a pattern, like `` `on${Capitalize<Name>}` ``.",
    detail:
      "Unions inside combine in every way. Together with `infer`, template literal types can also read pieces out of string types.",
    example: "type Cell = `${\"a\" | \"b\"}${1 | 2}`; // \"a1\" | \"a2\" | \"b1\" | \"b2\"",
    related: ['literal-type', 'infer'],
  },
  {
    id: 'recursive-type',
    term: "Recursive type",
    short: "A type that refers to itself, for data nested to any depth.",
    detail:
      "`Json` and `DeepReadonly` are recursive. TypeScript limits how deep it will go and reports \"excessively deep\" when that limit is reached.",
    example: "type Json = string | number | boolean | null | Json[] | { [key: string]: Json };",
    related: ['mapped-type', 'conditional-type'],
  },
  {
    id: 'branded-type',
    term: "Branded type",
    short: "A primitive with a type-only tag, so look-alike values cannot be mixed up.",
    detail:
      "`type UserId = string & { readonly __brand: \"UserId\" }` is still a string at runtime, but TypeScript keeps user ids and order ids apart. Create branded values in one checking function.",
    example: "type Email = string & { readonly __brand: \"Email\" };",
    related: ['intersection'],
  },
  {
    id: 'variance',
    term: "Variance",
    short: "How a generic type’s compatibility follows its type parameter’s.",
    detail:
      "Things you read from are covariant (`Producer<Dog>` fits `Producer<Animal>`); things you give to are contravariant (`Consumer<Animal>` fits `Consumer<Dog>`). `in` and `out` annotations make it explicit.",
    example: "interface Producer<out T> { make(): T }",
    related: ['generic', 'function-type'],
  },
  {
    id: 'compiler-flag',
    term: "Compiler flag",
    short: "A setting that changes how strictly TypeScript checks code.",
    detail:
      "Set in `tsconfig.json`. `strict` turns on a family of checks; extra flags like `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitReturns` and `noImplicitOverride` catch even more.",
    example: "{ \"compilerOptions\": { \"strict\": true, \"noUncheckedIndexedAccess\": true } }",
    related: ['annotation'],
  },
  {
    id: 'declaration-file',
    term: "Declaration file",
    short: "A `.d.ts` file: types only, describing code that lives elsewhere.",
    detail:
      "`declare` describes something that exists without creating it. Libraries ship `.d.ts` files; DefinitelyTyped (`@types/…`) provides them for libraries that do not.",
    example: "declare function track(event: string): void;",
    related: ['module'],
  },
  {
    id: 'type-assertion',
    term: "Type assertion",
    short: "`value as Type`: telling TypeScript to trust you about a type.",
    detail:
      "Nothing is checked or converted at runtime. Prefer narrowing and validation; keep assertions rare and in one place.",
    example: "const input = document as unknown as Settings; // trust me",
    related: ['non-null-assertion', 'any'],
  },
  {
    id: 'non-null-assertion',
    term: "Non-null assertion",
    short: "`value!`: telling TypeScript a value is not `null` or `undefined`.",
    detail:
      "It silences the check without any runtime protection; if you are wrong, the code crashes later. A real check is usually better.",
    example: "const first = list.find(isBig)!; // crashes if none is big",
    related: ['type-assertion', 'narrowing'],
  },
  {
    id: 'migration',
    term: "Migrating to TypeScript",
    short: "Moving JavaScript code to TypeScript step by step.",
    detail:
      "Start with `allowJs` and `checkJs` (with JSDoc types), rename files one at a time, and turn strict flags on gradually, using `@ts-expect-error` for the few lines still to fix.",
    related: ['compiler-flag', 'any'],
  },
  {
    id: 'structural-typing',
    term: "Structural typing",
    short: "Types match by their shape, not by their name.",
    detail:
      "In TypeScript, any value with the right properties fits a type, whatever it was called. Two types with the same shape are interchangeable. Branded types are a way to opt out when names should matter.",
    example: "type A = { x: number };\ntype B = { x: number };\nconst b: B = { x: 1 } as A; // fine: same shape",
    related: ['branded-type', 'interface'],
  },
  {
    id: 'excess-property-check',
    term: "Excess property check",
    short: "An error for unknown properties in an object literal.",
    detail:
      "When you write an object literal directly where a type is expected, properties the type does not have are reported. It catches typos in keys.",
    example: "const user: { name: string } = { name: \"Ada\", nmae: \"x\" }; // error",
    related: ['structural-typing', 'satisfies'],
  },
  {
    id: 'contextual-typing',
    term: "Contextual typing",
    short: "TypeScript types a value from where it is used.",
    detail:
      "A callback passed to `map`, or a function assigned to a typed variable, gets its parameter types from that context, so you do not have to annotate them.",
    example: "[1, 2].map((n) => n * 2); // n: number",
    related: ['inference', 'callback'],
  },
  {
    id: 'control-flow-analysis',
    term: "Control flow analysis",
    short: "TypeScript follows your `if`s and `return`s to narrow types.",
    detail:
      "After `if (typeof x === \"string\") return;`, TypeScript knows `x` is no longer a string. This is what makes narrowing work.",
    example: "if (value === null) return;\nvalue.length; // value is not null here",
    related: ['narrowing', 'never'],
  },
  {
    id: 'type-guard',
    term: "Type guard",
    short: "Any check that narrows a type: `typeof`, `instanceof`, `in`, equality or a type predicate.",
    detail:
      "Type guards are how you go from a wide type (a union, `unknown`) to a specific one, safely.",
    example: "if (error instanceof Error) console.log(error.message);",
    related: ['narrowing', 'type-predicate'],
  },
  {
    id: 'optional-chaining',
    term: "Optional chaining",
    short: "`a?.b` reads `b` only if `a` is not `null` or `undefined`.",
    detail:
      "If the left side is missing, the whole expression is `undefined` instead of a crash. Works for calls (`fn?.()`) and indexes (`list?.[0]`).",
    example: "const city = user.address?.city;",
    related: ['nullish-coalescing', 'optional'],
  },
  {
    id: 'nullish-coalescing',
    term: "Nullish coalescing",
    short: "`a ?? b` uses `b` only when `a` is `null` or `undefined`.",
    detail:
      "Unlike `||`, it keeps real values like `0`, `\"\"` and `false`. `??=` assigns only when the left side is nullish.",
    example: "const volume = saved ?? 50;",
    related: ['optional-chaining', 'truthiness'],
  },
  {
    id: 'closure',
    term: "Closure",
    short: "A function that remembers variables from where it was created.",
    detail:
      "A function returned from another function can still use the outer function’s variables. Each call creates a fresh set.",
    example: "function counter() { let n = 0; return () => ++n; }",
    related: ['function', 'callback'],
  },
  {
    id: 'side-effect',
    term: "Side effect",
    short: "Anything a function does besides returning a value.",
    detail:
      "Printing, changing a variable outside, saving to storage, or changing an argument are side effects. Pure functions have none, which makes them easy to test.",
    example: "function log(message: string) { console.log(message); } // a side effect",
    related: ['pure-function', 'immutability'],
  },
  {
    id: 'type-erasure',
    term: "Type erasure",
    short: "Types disappear when TypeScript is turned into JavaScript.",
    detail:
      "Nothing about types exists while the program runs: no `interface`, no `private` check, no `as`. Runtime checks are needed for data you do not control.",
    example: "const n = \"5\" as unknown as number; // still the string \"5\" at runtime",
    related: ['type-assertion', 'unknown'],
  },
  {
    id: 'compile-time',
    term: "Compile time and runtime",
    short: "Checking happens before the code runs; running happens after.",
    detail:
      "TypeScript’s checks are compile time. What the program actually does (and data from outside) is runtime. Good code uses types for the first and validation for the second.",
    related: ['type-erasure', 'unknown'],
  },
  {
    id: 'tsconfig',
    term: "tsconfig.json",
    short: "The file that configures a TypeScript project.",
    detail:
      "It lists compiler options (like `strict` and `target`), which files belong to the project, and how modules are resolved.",
    example: "{ \"compilerOptions\": { \"strict\": true, \"target\": \"ES2022\" } }",
    related: ['compiler-flag', 'module'],
  },
  {
    id: 'strict-mode',
    term: "strict",
    short: "A compiler option that turns on a family of safety checks.",
    detail:
      "`strict` includes `strictNullChecks`, `noImplicitAny`, `strictFunctionTypes` and others. Every lesson in this course checks code with it on.",
    related: ['compiler-flag', 'tsconfig'],
  },
  {
    id: 'target-library',
    term: "Target and lib",
    short: "Which JavaScript version TypeScript compiles to, and which built-ins it knows.",
    detail:
      "`lib` decides which methods exist for the type checker (for example `.at()` needs ES2022). This app checks Classic devices against ES2021 and Modern ones against ES2023.",
    related: ['engine-mode', 'compiler-flag'],
  },
  {
    id: 'engine-mode',
    term: "Modern and Classic modes",
    short: "How this app adapts lessons to what a phone’s JavaScript engine can run.",
    detail:
      "Older Android WebViews (Classic) run JavaScript up to ES2021; newer ones (Modern) also run ES2022 and ES2023 features. Steps that need newer features show a Classic version on older phones. Settings → Device engine.",
    related: ['target-library'],
  },
  {
    id: 'declaration-merging',
    term: "Declaration merging",
    short: "Two declarations with the same name combine into one.",
    detail:
      "Two `interface User` declarations merge their members. It is how libraries let you add to global types; `type` aliases never merge.",
    example: "interface Window { myApp: string }",
    related: ['interface', 'module-augmentation'],
  },
  {
    id: 'module-augmentation',
    term: "Module augmentation",
    short: "Adding to a library’s types from your own code.",
    detail:
      "Inside a module, `declare module \"lib\" { … }` extends the library’s declarations, for example to add a custom option.",
    related: ['declaration-merging', 'declaration-file'],
  },
  {
    id: 'subtype',
    term: "Subtype",
    short: "A type that fits wherever another (its supertype) is expected.",
    detail:
      "`\"red\"` is a subtype of `string`, and `{ name: string; age: number }` is a subtype of `{ name: string }`. Assignability follows subtypes.",
    related: ['structural-typing', 'variance'],
  },
  {
    id: 'top-type',
    term: "Top and bottom types",
    short: "`unknown` holds every value; `never` holds none.",
    detail:
      "Every type is assignable to `unknown` (the top), and `never` (the bottom) is assignable to every type. `any` is a special escape that switches checking off.",
    related: ['unknown', 'never', 'any'],
  },
  {
    id: 'variadic-tuple',
    term: "Variadic tuple type",
    short: "A tuple type built with spreads, like `[...A, ...B]`.",
    detail:
      "Spreads in tuple types concatenate tuples at the type level, which lets functions like `concat` or wrappers keep precise types.",
    example: "type Concat<A extends unknown[], B extends unknown[]> = [...A, ...B];",
    related: ['tuple', 'generic'],
  },
  {
    id: 'intrinsic-string-type',
    term: "Uppercase, Lowercase, Capitalize",
    short: "Built-in types that change the case of string literal types.",
    detail:
      "`Capitalize<\"click\">` is `\"Click\"`. Combined with template literal types they build names like `onClick`.",
    example: "type Handler = `on${Capitalize<\"click\">}`; // \"onClick\"",
    related: ['template-literal-type'],
  },
  {
    id: 'typeof-type',
    term: "typeof (in a type)",
    short: "Turns a value into its type.",
    detail:
      "In a type position, `typeof value` gives the type TypeScript inferred for that value. Combine with `keyof`, indexed access or `ReturnType`.",
    example: "const config = { port: 8080 };\ntype Config = typeof config;",
    related: ['keyof', 'as-const'],
  },
  {
    id: 'const-type-parameter',
    term: "const type parameter",
    short: "`<const T>`: infer exact literal types from an argument.",
    detail:
      "A `const` type parameter makes a generic function infer `readonly [\"a\", \"b\"]` instead of `string[]`, without `as const` at the call.",
    example: "function keep<const T>(value: T): T { return value; }",
    related: ['as-const', 'inference'],
  },
  {
    id: 'noinfer',
    term: "NoInfer",
    short: "`NoInfer<T>`: check a parameter against `T` without inferring `T` from it.",
    detail:
      "Use it for defaults and fallbacks, so a wrong argument is an error instead of widening the type.",
    example: "function pick<T extends string>(options: T[], initial: NoInfer<T>): T;",
    related: ['inference', 'generic'],
  },
  {
    id: 'type-test',
    term: "Type test",
    short: "A line that only compiles when types are right, like `Expect<Equal<A, B>>`.",
    detail:
      "Type tests check types the way unit tests check values. In this app, `Equal`, `Expect` and `// @ts-expect-error` lines grade type challenges.",
    example: "type T1 = Expect<Equal<ReturnType<typeof f>, number>>;",
    related: ['conditional-type'],
  },
  {
    id: 'event-loop',
    term: "Event loop",
    short: "How JavaScript decides what runs next.",
    detail:
      "Your code runs first; then promise callbacks (microtasks); then timers and events (tasks), one at a time. That is why `.then` runs before `setTimeout(fn, 0)`.",
    example: "console.log(\"a\");\nsetTimeout(() => console.log(\"c\"));\nPromise.resolve().then(() => console.log(\"b\"));",
    related: ['promise', 'async-await'],
  },
  {
    id: 'json',
    term: "JSON",
    short: "A text format for data: objects, arrays, strings, numbers, booleans and null.",
    detail:
      "`JSON.stringify` turns data into text and `JSON.parse` reads it back. Parsed data is `unknown` in spirit: check it before trusting its type.",
    example: "JSON.parse('{\"name\":\"Ada\"}');",
    related: ['unknown', 'recursive-type'],
  },
  {
    id: 'dependency-injection',
    term: "Dependency injection",
    short: "Passing the parts an object needs in from outside.",
    detail:
      "Instead of creating its logger or database itself, an object receives them, usually through its constructor. Parts can then be swapped, for example for tests.",
    example: "new Greeter({ log: (message) => console.log(message) });",
    related: ['composition', 'interface'],
  },
  {
    id: 'exhaustive-record',
    term: "Exhaustive lookup table",
    short: "A `Record` over a union of keys: every key must have an entry.",
    detail:
      "`Record<Element, number>` requires a value for every element, so adding a member to the union shows every table that needs updating.",
    example: "const labels: Record<\"s\" | \"m\", string> = { s: \"Small\", m: \"Medium\" };",
    related: ['record-type', 'exhaustiveness'],
  },
  {
    id: 'smart-constructor',
    term: "Smart constructor",
    short: "The one function that checks a value and gives it a branded type.",
    detail:
      "Branded types cannot be created by accident; a smart constructor validates and then asserts, so every branded value has passed the check.",
    example: "function toEmail(text: string): Email | null { /* check, then */ return text as Email; }",
    related: ['branded-type', 'type-assertion'],
  },
];

export const GLOSSARY_BY_ID = new Map(GLOSSARY.map((entry) => [entry.id, entry]));

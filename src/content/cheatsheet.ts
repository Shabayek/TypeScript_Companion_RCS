export interface CheatEntry {
  title: string;
  code: string;
  note?: string;
}

export interface CheatSection {
  id: string;
  title: string;
  entries: readonly CheatEntry[];
}

export const CHEATSHEET: readonly CheatSection[] = [
  {
    id: 'values',
    title: 'Values and names',
    entries: [
      {
        title: 'Three everyday types',
        code: 'const name = "Ada";      // string\nconst age = 36;         // number\nconst ready = true;      // boolean',
        note: 'You rarely write the type. TypeScript infers it from the value.',
      },
      {
        title: 'const vs let',
        code: 'const city = "Lagos";   // never reassigned\nlet count = 0;          // changes later\ncount = count + 1;',
        note: 'Reach for const first. Change to let only when the value really changes.',
      },
      {
        title: 'Template literal',
        code: 'const message = `Hi, ${name}! You are ${age}.`;',
        note: 'Backticks, not quotes. ${...} inserts a value.',
      },
      {
        title: 'Choose parts of an object',
        code: 'const { name, age } = user;',
      },
      {
        title: 'String methods',
        code: '"  Hi Ada ".trim();          // "Hi Ada"\n"Hi Ada".includes("Ada");   // true\n"Hi Ada".slice(0, 2);       // "Hi"\n"a,b".split(",");           // ["a", "b"]\n["a", "b"].join("-");       // "a-b"\n"ada".toUpperCase();        // "ADA"',
        note: 'They return a new string; the original never changes.',
      },
    ],
  },
  {
    id: 'logic',
    title: 'Decisions',
    entries: [
      {
        title: 'Comparisons',
        code: 'a === b   a !== b   a > b   a <= b',
        note: 'Use === and !==. The loose == converts types first.',
      },
      {
        title: 'if / else if / else',
        code: 'if (score >= 90) {\n  return "gold";\n} else if (score >= 60) {\n  return "silver";\n}\nreturn "bronze";',
      },
      {
        title: 'Guard clause',
        code: 'if (!user) return "no user";\n// the main path stays flat down here',
      },
      {
        title: 'Ternary',
        code: 'const label = count === 1 ? "item" : "items";',
      },
      {
        title: 'switch',
        code: 'switch (size) {\n  case "S": return 1;\n  case "M": return 2;\n  default: return 0;\n}',
      },
      {
        title: 'Falsy values',
        code: 'false  0  ""  null  undefined  NaN',
        note: 'Everything else is truthy — including "false" and "0".',
      },
    ],
  },
  {
    id: 'collections',
    title: 'Collections',
    entries: [
      {
        title: 'Array basics',
        code: 'const fruits = ["apple", "pear"];\nfruits[0];        // "apple"\nfruits.length;    // 2\nfruits.push("fig");',
      },
      {
        title: 'Object basics',
        code: 'const user = { name: "Ada", age: 36 };\nuser.name;         // "Ada"\nuser.age = 37;',
      },
      {
        title: 'Spread makes a copy',
        code: 'const older = { ...user, age: 37 };\nconst more = [...fruits, "plum"];',
      },
      {
        title: 'map / filter / find',
        code: 'prices.map(p => p * 2);          // same length\nprices.filter(p => p > 10);       // shorter\npeople.find(p => p.id === 3);     // one or undefined',
      },
      {
        title: 'sort, some, every, reduce',
        code: '[...nums].sort((a, b) => a - b);   // copy, then sort\nnums.some(n => n > 10);            // at least one?\nnums.every(n => n > 0);            // all of them?\nnums.reduce((sum, n) => sum + n, 0); // total',
        note: 'sort changes the array and compares text unless you pass a comparator.',
      },
      {
        title: 'Map and Set',
        code: 'const ages = new Map<string, number>();\nages.set("Ada", 36);\nages.get("Bo") ?? 0;       // missing key: undefined\nconst unique = [...new Set(["a", "b", "a"])]; // ["a", "b"]',
      },
    ],
  },
  {
    id: 'functions',
    title: 'Functions',
    entries: [
      {
        title: 'Declaration',
        code: 'function double(n: number): number {\n  return n * 2;\n}',
      },
      {
        title: 'Arrow function',
        code: 'const double = (n: number): number => n * 2;',
      },
      {
        title: 'Default and optional',
        code: 'function greet(name = "friend", shout?: boolean) {\n  return shout ? `HI ${name}` : `Hi ${name}`;\n}',
      },
      {
        title: 'Rest parameters',
        code: 'function sumAll(...numbers: number[]): number {\n  return numbers.reduce((total, n) => total + n, 0);\n}',
      },
      {
        title: 'Callback',
        code: 'items.map(item => item.name);',
        note: 'The arrow function is the callback. map calls it once per item.',
      },
    ],
  },
  {
    id: 'types',
    title: 'Types',
    entries: [
      {
        title: 'interface for shapes',
        code: 'interface User {\n  readonly id: string;\n  name: string;\n  age?: number;\n}',
      },
      {
        title: 'type for unions',
        code: 'type Size = "small" | "medium" | "large";\ntype Id = string | number;',
      },
      {
        title: 'Narrowing',
        code: 'function format(value: string | number) {\n  if (typeof value === "string") return value.toUpperCase();\n  return value.toFixed(2);\n}',
      },
      {
        title: 'unknown, not any',
        code: 'function parse(input: unknown) {\n  if (typeof input === "string") return input.trim();\n  return "";\n}',
      },
      {
        title: 'Generic helper',
        code: 'function firstOf<T>(items: T[]): T | undefined {\n  return items[0];\n}',
      },
    ],
  },
  {
    id: 'programs',
    title: 'Programs that grow',
    entries: [
      {
        title: 'Modules',
        code: '// math.ts\nexport function add(a: number, b: number) { return a + b; }\n\n// app.ts\nimport { add } from "./math";',
      },
      {
        title: 'try / catch',
        code: 'try {\n  return JSON.parse(text);\n} catch {\n  return null;\n}',
      },
      {
        title: 'async / await',
        code: 'async function load() {\n  const response = await getData();\n  return response.items;\n}',
      },
      {
        title: 'Class',
        code: 'class Counter {\n  private value = 0;\n  increment(): number {\n    this.value += 1;\n    return this.value;\n  }\n}',
      },
    ],
  },
  {
    id: 'functions-typed',
    title: "Functions with types",
    entries: [
      {
        title: "Function type",
        code: "type Formatter = (value: number) => string;\nconst asPrice: Formatter = (value) => `€${value.toFixed(2)}`;",
        note: "Callbacks get their parameter types from the slot they go into.",
      },
      {
        title: "Overloads",
        code: "function parse(input: string): number;\nfunction parse(input: string[]): number[];\nfunction parse(input: string | string[]) {\n  return Array.isArray(input) ? input.map(Number) : Number(input);\n}",
        note: "Only when the return type depends on the argument type.",
      },
      {
        title: "Type predicate",
        code: "function isFish(pet: Fish | Bird): pet is Fish {\n  return \"swim\" in pet;\n}\nconst fish = pets.filter(isFish); // Fish[]",
      },
      {
        title: "Assertion function",
        code: "function assertIsNumber(value: unknown): asserts value is number {\n  if (typeof value !== \"number\") throw new TypeError(\"Expected a number\");\n}",
      },
    ],
  },
  {
    id: 'shapes',
    title: "Shapes in depth",
    entries: [
      {
        title: "Tuple and readonly",
        code: "type Entry = [word: string, count: number];\nfunction total(prices: readonly number[]) { /* no push, no sort */ }",
      },
      {
        title: "as const",
        code: "const SIZES = [\"s\", \"m\", \"l\"] as const;\ntype Size = (typeof SIZES)[number]; // \"s\" | \"m\" | \"l\"",
      },
      {
        title: "Record and index signatures",
        code: "const counts: Record<string, number> = {};\nconst prices: Record<\"apple\" | \"pear\", number> = { apple: 1, pear: 2 };",
        note: "A missing key reads as undefined; enable noUncheckedIndexedAccess to see it in the type.",
      },
      {
        title: "Intersection",
        code: "type Employee = Person & { team: string };",
      },
      {
        title: "satisfies",
        code: "const routes = { home: \"/\", about: \"/about\" } satisfies Record<string, string>;\n// routes.home is still known; typos are errors",
      },
    ],
  },
  {
    id: 'unions',
    title: "Modelling with unions",
    entries: [
      {
        title: "Discriminated union",
        code: "type Shape =\n  | { kind: \"circle\"; radius: number }\n  | { kind: \"square\"; side: number };\nswitch (shape.kind) { case \"circle\": /* shape.radius */ }",
      },
      {
        title: "Exhaustive check",
        code: "function assertNever(value: never): never {\n  throw new Error(`Unhandled: ${JSON.stringify(value)}`);\n}\ndefault: return assertNever(shape);",
      },
      {
        title: "Result",
        code: "type Result<T, E = string> = { ok: true; value: T } | { ok: false; error: E };\nif (result.ok) use(result.value); else report(result.error);",
      },
      {
        title: "Union instead of enum",
        code: "const LEVELS = [\"low\", \"high\"] as const;\ntype Level = (typeof LEVELS)[number];",
      },
    ],
  },
  {
    id: 'generics',
    title: "Generics in depth",
    entries: [
      {
        title: "Constraint",
        code: "function longest<T extends { length: number }>(a: T, b: T): T {\n  return a.length >= b.length ? a : b;\n}",
      },
      {
        title: "keyof and T[K]",
        code: "function get<T, K extends keyof T>(object: T, key: K): T[K] {\n  return object[key];\n}",
      },
      {
        title: "Generic class",
        code: "class Stack<T> {\n  #items: T[] = [];\n  push(item: T) { this.#items.push(item); }\n  pop(): T | undefined { return this.#items.pop(); }\n}",
      },
      {
        title: "Defaults and const T",
        code: "type Pair<A, B = A> = [A, B];\nfunction keep<const T>(value: T): T { return value; }\nkeep([\"a\", \"b\"]); // readonly [\"a\", \"b\"]",
      },
    ],
  },
  {
    id: 'toolbox',
    title: "The type toolbox",
    entries: [
      {
        title: "Partial, Required, Readonly",
        code: "type Update = Partial<User>;\ntype Full = Required<Update>;\ntype Frozen = Readonly<User>;",
      },
      {
        title: "Pick and Omit",
        code: "type Summary = Pick<User, \"id\" | \"name\">;\ntype PublicUser = Omit<User, \"password\">;",
        note: "Omit does not check its keys: a typo omits nothing.",
      },
      {
        title: "ReturnType, Parameters, Awaited",
        code: "type Made = ReturnType<typeof createUser>;\ntype Args = Parameters<typeof createUser>;\ntype Loaded = Awaited<ReturnType<typeof loadUser>>;",
      },
      {
        title: "Exclude, Extract, NonNullable",
        code: "type Live = Exclude<Status, \"archived\">;\ntype Click = Extract<AppEvent, { type: \"click\" }>;\ntype Name = NonNullable<string | null>;",
      },
    ],
  },
  {
    id: 'type-level',
    title: "Type-level programming",
    entries: [
      {
        title: "Conditional type",
        code: "type IsText<T> = T extends string ? true : false;",
      },
      {
        title: "infer",
        code: "type ElementOf<T> = T extends (infer Item)[] ? Item : never;\ntype Ret<F> = F extends (...args: never[]) => infer R ? R : never;",
      },
      {
        title: "Distribution (and stopping it)",
        code: "type ToArray<T> = T extends unknown ? T[] : never;   // string[] | number[]\ntype ToArrayAll<T> = [T] extends [unknown] ? T[] : never; // (string | number)[]",
      },
      {
        title: "Mapped type and modifiers",
        code: "type Mutable<T> = { -readonly [K in keyof T]: T[K] };\ntype Optional<T> = { [K in keyof T]?: T[K] };",
      },
      {
        title: "Key remapping",
        code: "type Getters<T> = { [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K] };",
      },
      {
        title: "Template literal types",
        code: "type EventName<T extends string> = `on${Capitalize<T>}`;\ntype Param<P> = P extends `${string}:${infer Name}` ? Name : never;",
      },
    ],
  },
  {
    id: 'patterns',
    title: "Advanced patterns",
    entries: [
      {
        title: "Recursive type",
        code: "type Json = string | number | boolean | null | Json[] | { [key: string]: Json };",
      },
      {
        title: "Branded type",
        code: "type UserId = string & { readonly __brand: \"UserId\" };\nconst userId = (raw: string) => raw as UserId;",
      },
      {
        title: "Variance annotations",
        code: "interface Producer<out T> { make(): T }\ninterface Consumer<in T> { take(value: T): void }",
      },
      {
        title: "NoInfer",
        code: "function pick<T extends string>(options: T[], initial: NoInfer<T>): T { /* … */ }",
      },
      {
        title: "Event map",
        code: "class Emitter<Events extends Record<string, unknown[]>> {\n  on<K extends keyof Events>(name: K, listener: (...args: Events[K]) => void) { /* … */ }\n}",
      },
    ],
  },
  {
    id: 'tooling',
    title: "Strictness and tooling",
    entries: [
      {
        title: "Flags beyond strict",
        code: "{\n  \"strict\": true,\n  \"noUncheckedIndexedAccess\": true,\n  \"exactOptionalPropertyTypes\": true,\n  \"noImplicitReturns\": true,\n  \"noImplicitOverride\": true\n}",
      },
      {
        title: "Declarations",
        code: "declare const APP_VERSION: string;\ndeclare function track(event: string): void;",
      },
      {
        title: "Type-only imports",
        code: "import type { User } from \"./user\";\nimport { load, type Role } from \"./api\";",
        note: "With verbatimModuleSyntax, only type-marked imports are removed.",
      },
      {
        title: "Escape hatches, carefully",
        code: "// @ts-expect-error  – expected error, complains when it is gone\nconst n = value as number; // unchecked: prefer narrowing\nconst first = list[0]!;    // unchecked: prefer a real check",
      },
    ],
  },
];

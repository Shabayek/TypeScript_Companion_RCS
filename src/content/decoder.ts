export interface DecoderEntry {
  id: string;
  /** Lower-case fragment to look for in the error text. */
  match: string;
  title: string;
  /** What it means, in plain words. */
  plain: string;
  /** The next small action. */
  fix: string;
  example?: string;
}

/**
 * A local lookup table, not a language model: paste an error, get the sentence
 * a patient friend would say. Matching is intentionally fuzzy and ordered, so
 * the most specific fragment sits first.
 */
export const DECODER: readonly DecoderEntry[] = [
  {
    id: 'newer-library',
    match: "do you need to change your target library",
    title: "A newer JavaScript feature than this setting allows",
    plain:
      "The method or global exists in newer JavaScript (for example `.at()` or `Object.hasOwn`), but the library TypeScript checks against is older. In this app, that means the Classic device mode.",
    fix: "Use the classic equivalent (for example `items[items.length - 1]` for `.at(-1)`), or a newer `lib` setting in your own projects.",
    example: "const last = items[items.length - 1];",
  },
  {
    id: 'argument-type',
    match: "argument of type",
    title: "The value passed to a function has the wrong type",
    plain:
      "A function says what type each parameter takes. The argument you passed is a different type.",
    fix: "Convert the value before passing it, or check the function’s signature to see what it expects.",
    example: "parseInt(42);  // expects a string: parseInt(\"42\")",
  },
  {
    id: 'missing-properties',
    match: "is missing the following properties",
    title: "Several required properties are missing",
    plain:
      "The object is supposed to match a type, but some required properties are not there.",
    fix: "Add the properties listed in the message, or make them optional in the type with `?`.",
    example: "const user: User = { name: \"Ada\" }; // missing: id, email",
  },
  {
    id: 'missing-property',
    match: "is missing in type",
    title: "A required property is missing",
    plain:
      "The object is supposed to match a type, but one required property is not there.",
    fix: "Add the property, or mark it optional with `?` if it really can be absent.",
    example: "const pet: Pet = { name: \"Rex\" }; // Pet also needs age",
  },
  {
    id: 'excess-property',
    match: "object literal may only specify known properties",
    title: "A property the type does not have",
    plain:
      "You wrote an object literal with a property that the target type does not declare. Usually a typo or a leftover.",
    fix: "Check the spelling against the type, or add the property to the type if it belongs there.",
    example: "const user: User = { nmae: \"Ada\" };",
  },
  {
    id: 'no-overload',
    match: "no overload matches this call",
    title: "None of the function’s signatures fit",
    plain:
      "The function has several signatures (overloads) and your arguments match none of them. The message lists why each one failed.",
    fix: "Read the last attempt in the message first; it usually points at the argument that is wrong.",
  },
  {
    id: 'possibly-unknown',
    match: "is of type 'unknown'",
    title: "Using an unknown value before checking it",
    plain:
      "`unknown` means \"could be anything\", so TypeScript will not let you use it until you have narrowed it.",
    fix: "Check it first with `typeof`, `Array.isArray`, `instanceof` or a type predicate.",
    example: "if (typeof value === \"string\") value.toUpperCase();",
  },
  {
    id: 'excessively-deep',
    match: "excessively deep",
    title: "A type recurses too deeply",
    plain:
      "A recursive or very complex type needed more steps than TypeScript allows.",
    fix: "Simplify the type, make recursion tail-recursive, or limit its depth with a counter.",
  },
  {
    id: 'lacks-return',
    match: "lacks ending return statement",
    title: "A path through the function returns nothing",
    plain:
      "The return type promises a value, but at least one path ends without `return`.",
    fix: "Add a `return` at the end, or handle the missing case (an exhaustive switch with `assertNever` helps).",
  },
  {
    id: 'implicit-return',
    match: "not all code paths return a value",
    title: "Some paths return a value, others do not",
    plain:
      "With `noImplicitReturns`, every path must return when any path does.",
    fix: "Add a `return` to the paths that end without one.",
  },
  {
    id: 'element-implicit-any',
    match: "element implicitly has an 'any' type",
    title: "Looking up a key TypeScript cannot check",
    plain:
      "You indexed an object with a key whose type is too wide (often `string`), so TypeScript cannot tell what comes back.",
    fix: "Type the object with an index signature or `Record`, or narrow the key to `keyof typeof object`.",
    example: "const value = settings[key as keyof typeof settings];",
  },
  {
    id: 'used-before-assigned',
    match: "is used before being assigned",
    title: "A variable is read before it has a value",
    plain:
      "TypeScript followed the code and found a path where the variable was never given a value.",
    fix: "Initialise it when you declare it, or make sure every path assigns it first.",
  },
  {
    id: 'definitely-assigned',
    match: "has no initializer and is not definitely assigned",
    title: "A class property is never given a value",
    plain:
      "With strict checks, every class property must be set in its declaration or in the constructor.",
    fix: "Give it a default value, set it in the constructor, or make it optional.",
  },
  {
    id: 'satisfies-mismatch',
    match: "does not satisfy the expected type",
    title: "A value does not fit the `satisfies` type",
    plain:
      "`satisfies` checks a value against a type without changing its own type. This one does not fit.",
    fix: "Fix the value (often a typo in a key, or a wrong value type).",
  },
  {
    id: 'constraint',
    match: "does not satisfy the constraint",
    title: "A type argument does not meet a requirement",
    plain:
      "A generic says what its type parameter must support (`T extends …`), and the type you gave does not.",
    fix: "Pass a type that meets the constraint, or relax the constraint if it is too strict.",
  },
  {
    id: 'unused-expect-error',
    match: "unused '@ts-expect-error' directive",
    title: "The expected error is not there any more",
    plain:
      "`@ts-expect-error` says the next line has an error. It no longer does, so the comment is stale.",
    fix: "Remove the comment. (In a type challenge: the line should be rejected, but your types accept it.)",
  },
  {
    id: 'override-needed',
    match: "must have an 'override' modifier",
    title: "Overriding a method needs `override`",
    plain:
      "With `noImplicitOverride`, replacing a method from a parent class must be marked explicitly.",
    fix: "Add `override` before the method name.",
    example: "override describe(): string { … }",
  },
  {
    id: 'assertion-annotation',
    match: "assertions require every name in the call target",
    title: "An assertion function needs an explicit type",
    plain:
      "Functions with `asserts` return types must be declared with an explicit type annotation to narrow at the call site.",
    fix: "Use a function declaration, or annotate the `const` with the function type.",
  },
  {
    id: 'only-a-type',
    match: "only refers to a type, but is being used as a value",
    title: "A type was used as if it were a value",
    plain:
      "Types disappear when the code runs, so they cannot be used as values (for example with `new`, or passed to a function).",
    fix: "Use a real value there, or use `typeof value` to go from a value to its type.",
  },
  {
    id: 'did-you-mean',
    match: "did you mean",
    title: "Probably a typo",
    plain:
      "TypeScript found a name that is almost the same and suggests it.",
    fix: "Accept the suggestion if it is what you meant.",
  },
  {
    id: 'incorrectly-implements',
    match: "incorrectly implements",
    title: "A class does not match its interface",
    plain:
      "A class declared `implements SomeInterface`, but is missing members or has them with the wrong types.",
    fix: "Add the missing members, or fix their types to match the interface.",
  },
  {
    id: 'abstract-instance',
    match: "cannot create an instance of an abstract class",
    title: "An abstract class cannot be created directly",
    plain:
      "Abstract classes are half-built: only finished subclasses can be created with `new`.",
    fix: "Create a concrete subclass and instantiate that.",
  },
  {
    id: 'not-implemented-abstract',
    match: "does not implement inherited abstract member",
    title: "A subclass forgot an abstract method",
    plain:
      "The parent declared an abstract method, and this class does not provide it.",
    fix: "Implement the method in the subclass.",
  },
  {
    id: 'variance-annotation',
    match: "as implied by variance annotation",
    title: "An `in`/`out` annotation does not match how the type is used",
    plain:
      "A type parameter marked `out` is used as an input (or `in` as an output).",
    fix: "Use `out` for values you only read, `in` for values you only receive, or remove the annotation.",
  },
  {
    id: 'cannot-find-name',
    match: "cannot find name",
    title: 'A name does not exist (yet)',
    plain:
      'The compiler reached a name it has never seen. It is usually a typo, a variable used before it was declared, or a missing import.',
    fix: 'Check the spelling, then check that the name is declared before this line and in the same scope.',
    example: 'console.log(total);   // declared later, or not at all',
  },
  {
    id: 'null-assign',
    match: "type 'null' is not assignable",
    title: 'null in a slot that cannot hold it',
    plain:
      'With strict null checks, `null` is its own type and does not quietly become a string or a number.',
    fix: 'Either allow it — `string | null` — or handle the empty case before assigning.',
  },
  {
    id: 'never',
    match: "not assignable to type 'never'",
    title: 'A value reached a place that accepts nothing',
    plain:
      'A `never` slot means "no value should arrive here". It often follows an exhaustive check that has one case too many.',
    fix: 'Check that every union member is handled, and that the last branch is genuinely unreachable.',
  },
  {
    id: 'not-assignable',
    match: 'is not assignable to',
    title: 'One type where a different type was expected',
    plain:
      'The value is real, but it is the wrong kind. Text going into a number slot, or a number going into a yes/no slot, are the two classics.',
    fix: 'Decide which type is correct. Convert the value (`Number(text)`, `String(n)`), or change the annotation if it was wrong.',
    example: 'const age: number = "36";   // string in a number slot',
  },
  {
    id: 'possibly-undefined',
    match: "is possibly 'undefined'",
    title: 'This might be missing',
    plain:
      'The value could be `undefined` at this point, and using it blindly would crash at runtime. TypeScript is warning you before that happens.',
    fix: 'Check first: `if (value === undefined) return;` or use `value ?? fallback`.',
    example: 'const name = people[0]?.name ?? "friend";',
  },
  {
    id: 'does-not-exist-on-type',
    match: 'does not exist on type',
    title: 'That property or method is not on this type',
    plain:
      'You asked for something the value does not have — often a string method called on a number, or a misspelled property.',
    fix: 'Check the type, then check the spelling. If the union has several shapes, narrow it first.',
    example: 'const n = 42;\nn.toUpperCase();   // numbers have no toUpperCase',
  },
  {
    id: 'not-a-function',
    match: 'is not a function',
    title: 'You called something that is not callable',
    plain:
      'The name exists, but it holds a value rather than a function. Common causes: a misspelled method, or calling without a property.',
    fix: 'Check the spelling, and check that you are calling the method on the right object.',
    example: 'const items = [1, 2];\nitems.len();   // .length is a number, not a method',
  },
  {
    id: 'undefined-reading',
    match: 'cannot read propert',
    title: 'Something was empty when you read it',
    plain:
      'The thing on the left of the dot was `undefined` or `null`. It usually means a lookup found nothing, or a value never arrived.',
    fix: 'Log the value one line earlier. Then guard before the dot, or use optional chaining: `user?.name`.',
    example: 'const found = users.find(u => u.id === 9);\nfound.name;   // found is undefined',
  },
  {
    id: 'assign-to-constant',
    match: 'because it is a constant',
    title: 'You tried to reassign a const',
    plain:
      '`const` means the name always points at the same value. You can still change a property inside an object, but not point the name somewhere new.',
    fix: 'If the value really changes, use `let`. If not, change the value inside instead of replacing the whole thing.',
    example: 'const count = 0;\ncount = 1;   // use let count = 0',
  },
  {
    id: 'implicit-any',
    match: "implicitly has an 'any' type",
    title: 'TypeScript needs a type here',
    plain:
      'With strict checking on, every parameter needs a type it can see. This happens with function parameters, and with arrays that start empty.',
    fix: 'Add an annotation: `(items: string[])`, `(user: User)`.',
  },
  {
    id: 'no-overlap',
    match: 'no overlap',
    title: 'This comparison can never be true',
    plain:
      'You compared two things whose types have nothing in common, so one side can never equal the other. It is usually a stale type, not a typo in the comparison.',
    fix: 'Check what each side actually holds. One of them is not what you expected.',
    example: 'const status: "open" | "closed" = "open";\nstatus === "done";   // "done" is not possible',
  },
  {
    id: 'unterminated-string',
    match: 'unterminated string',
    title: 'A quote was never closed',
    plain: 'Text started with a quote and never found the matching one before the line ended.',
    fix: 'Add the closing quote. If the text contains a quote, use the other kind around it.',
    example: 'console.log("hello);',
  },
  {
    id: 'expected-semicolon',
    match: "' expected",
    title: 'A small piece of punctuation is missing',
    plain:
      'Usually a bracket, semicolon, or comma that ended a bit early. The reported line is often one line after the real problem.',
    fix: 'Look at the line above the error too, and count the brackets on it.',
  },
  {
    // Browser wording for JSON.parse: "Unexpected token } in JSON at position 1",
    // "Expected property name or '}' in JSON at position 1", "Unexpected end
    // of JSON input", '"abc" is not valid JSON'. Before the general entries
    // those messages would otherwise match.
    id: 'invalid-json',
    match: ' json',
    title: 'That text is not valid JSON',
    plain:
      'JSON.parse was given text that is not proper JSON. JSON is stricter than JavaScript: keys need double quotes, there are no trailing commas, and no comments.',
    fix: 'Print the text before parsing it. Check every key is in double quotes and every bracket is closed — or wrap the parse in try/catch to handle bad input.',
    example: 'JSON.parse(\'{name: "Ada"}\');   // keys need double quotes',
  },
  {
    // The in-app compiler's wording for a missing closing bracket.
    id: 'unexpected-end',
    match: 'unexpected end of',
    title: 'The code ends before everything is closed',
    plain:
      'The compiler reached the end of the code while still waiting for something to close — usually a `}` or a `)`.',
    fix: 'Count the opening and closing brackets. The missing one is often at the end of a function or a block.',
    example: 'function greet() {\n  console.log("hi");\n// missing }',
  },
  {
    // The in-app compiler's wording for a stray symbol: Unexpected "}".
    id: 'unexpected-symbol',
    match: 'unexpected "',
    title: 'A symbol the compiler did not expect',
    plain:
      'The symbol in quotes is out of place here — most often one `}` or `)` too many, or one whose opening partner is missing.',
    fix: 'Look just above the line it names and match every opening bracket to its closing one.',
  },
  {
    // Browser wording at run time (TypeScript would have caught it as "Cannot assign").
    id: 'assign-to-constant-runtime',
    match: 'assignment to constant',
    title: 'Changing a const',
    plain:
      'A value declared with `const` cannot be given a new value. The program stopped at the line that tried.',
    fix: 'If the value needs to change, declare it with `let`. If it should not, create a new const with a new name instead.',
    example: 'const count = 1;\ncount = 2;   // TypeError',
  },
  {
    // This app's own runner message.
    id: 'import-here',
    match: 'cannot be imported here',
    title: 'import needs more than one file',
    plain:
      'The playground and the exercises run a single file on its own, so there is nothing to import from. Real projects have many files and a bundler or runtime that joins them.',
    fix: 'Put the code you wanted to import into this same file for now. Module 6 explains how imports work in a real project.',
  },
  {
    // This app's own compiler message.
    id: 'cannot-mix',
    match: 'cannot be mixed',
    title: 'Top-level await and export together',
    plain:
      'Here, `await` outside a function and `export` cannot be used in the same file.',
    fix: 'Move the `await` into an `async function` and call it, or drop the `export` — the playground does not need it.',
  },
  {
    id: 'unexpected-token',
    match: 'unexpected token',
    title: 'The shape of the code confused the parser',
    plain:
      'Something is out of place: a stray bracket, a missing `}`, or a value where a statement was expected.',
    fix: 'Indent the block properly. Mismatched braces become obvious once the indentation is honest.',
  },
  {
    // The in-app compiler's own wording: `Expected ";" but found "b"`.
    id: 'expected-but-found',
    match: 'but found',
    title: 'Something is missing just before this spot',
    plain:
      'The compiler expected one thing (named first) and found another. A missing bracket, quote, comma, or semicolon a little earlier is the usual cause.',
    fix: 'Look at the line it names and the line above. Check that every (, {, [ and quote has its partner.',
    example: 'const total = add(1, 2;   // Expected ")" but found ";"',
  },
  {
    // TypeScript's wording: "Declaration or statement expected.",
    // "Expression expected.", "Identifier expected."
    id: 'syntax-expected',
    match: 'expected.',
    title: 'The code stops making sense here',
    plain:
      'At this point the compiler needed a piece of code — a statement, a value, or a name — and found something else instead.',
    fix: 'Check the line it names for a stray or missing bracket, and for a keyword spelled wrong.',
  },
  {
    // Only the real argument-count messages: "Expected 2 arguments, but got 1."
    // The old fragment, 'expected', also swallowed every syntax error above.
    id: 'expected-arguments',
    match: 'arguments, but got',
    title: 'Wrong number of arguments',
    plain: 'The function expects a different count of values than you gave it.',
    fix: 'Compare the call with the function signature. Add the missing argument or remove the extra one.',
  },
  {
    id: 'not-defined',
    match: 'is not defined',
    title: 'That name was never created',
    plain:
      'At the moment this line ran, the name did not exist. Different from a type error: this one happens while the program runs.',
    fix: 'Check for a typo, and check that the line creating the value actually ran before this one.',
  },
  {
    id: 'stack-size',
    match: 'maximum call stack',
    title: 'A function kept calling itself',
    plain:
      'Recursion without a stopping condition, or two functions calling each other forever, fills the stack and stops.',
    fix: 'Find the condition that should end the repetition, and make sure it eventually becomes true.',
  },
  {
    id: 'import-outside-module',
    match: 'cannot use import statement',
    title: 'import in a place that does not support it',
    plain:
      '`import` belongs in a module. A plain script, or a runner without module support, cannot use it.',
    fix: 'Keep module lessons inside a project; use `export`/`import` only in files that are loaded as modules.',
  },
  {
    id: 'duplicate-identifier',
    match: 'duplicate identifier',
    title: 'The same name twice',
    plain: 'Two declarations with the same name share a scope, and the compiler cannot tell them apart.',
    fix: 'Rename one of them, or remove the duplicate. Watch for two files that both declare the same global.',
  },
  {
    id: 'index-signature',
    match: "can't be used to index",
    title: 'Indexing an object with an unknown key',
    plain:
      'The object has known keys, but you looked it up with a plain `string`, so the compiler cannot promise that key exists.',
    fix: 'Use a key type that lists the allowed names, or check `key in object` first.',
  },
];

export function decodeError(text: string): DecoderEntry | undefined {
  const lower = text.toLowerCase();
  return DECODER.find((entry) => lower.includes(entry.match));
}

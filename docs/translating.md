# Translating TypeScript Companion

The app ships in **English** (the source), **French**, **German**, **Luxembourgish**, **Italian**, **European Portuguese** and **Arabic**. Everything except English is marked *preview* until a native speaker has reviewed it (see `status` in `src/i18n/languages.ts`).

There are two layers, translated separately:

| Layer | Where | What |
| --- | --- | --- |
| **Screen text** | `src/i18n/locales/<code>.ts` | Buttons, messages, settings, results, error explanations: everything the app itself says |
| **Course content** | `src/content/locales/<code>/` | Lesson wording, module and lesson titles, glossary, cheatsheet, error decoder |

Anything not translated falls back to English, message by message, so a partial translation never breaks a screen.

## Switching never loses anything

Changing language keeps the learner on the same page and the same step, with their half-typed answer still there. This works because:

- the language is a setting, not part of the page address;
- progress, answers and drafts are stored under **ids**, never under displayed text;
- exercise components are keyed by step id, so new wording re-renders them without remounting;
- results (a grading verdict, an explanation of a compiler error) are kept as **message keys** (`src/i18n/text.ts`) and worded when shown, so even a result already on screen changes language.

`tests/languageSwitch.test.tsx` and `playwright/languages.spec.ts` prove it. Keep it that way: never store wording in state, and never use text as a React key or a storage key.

## Screen text

`src/i18n/locales/en.ts` defines every key. A translation is a `Translation` object with the same shape:

```ts
export const fr: Translation = {
  nav: { journey: 'Parcours', ... },
  practice: {
    stepsReady: { one: '{count} étape à réviser', many: '{count} d’étapes à réviser', other: '{count} étapes à réviser' },
  },
};
```

Rules, all checked by `tests/i18nCatalogs.test.ts`:

- **Exactly the English keys**: none missing, none unknown.
- **Every `{placeholder}` kept**. In plural forms, `one`/`two`/`zero` may leave out `{count}` ("Une reviendra bientôt"); `other` must keep all of them.
- **Every plural form the language needs**, as `Intl.PluralRules` reports it: Arabic needs `zero one two few many other`; French, Italian and Portuguese need `many` (used for millions).
- **`code spans` kept** exactly: code is never translated.
- **French typography**: a narrow no-break space (U+202F) before `; ! ?`, a no-break space (U+00A0) before `:` and inside « guillemets ».

Numbers, dates and lists use `Intl` (`formatNumber`, `formatDate`, `formatList` in `src/i18n/messages.ts`). Arabic keeps Western digits (0–9), to match the numbers in code.

In components, use `const { t } = useT()` and `t('section.key', { name })`. Outside React (toasts, the runner) use `msg('section.key', params)` to make a message and let the screen word it. **Never write English in a component.** The scan in this guide's checklist finds any that slip in.

## Course content

One folder per language, discovered automatically (no registration):

```
src/content/locales/de/
  course.ts      export const COURSE: CourseOverlay          module titles and taglines, lesson titles
  glossary.ts    export const GLOSSARY: GlossaryOverlay      terms
  cheatsheet.ts  export const CHEATSHEET: CheatsheetOverlay  section and entry titles, notes (never code)
  decoder.ts     export const DECODER: DecoderOverlay        error explanations (matching stays on the English compiler text)
  m00.ts         export const LESSONS: ModuleOverlay         one module's lessons
  m01.ts         …
```

Each file is its own download: a learner fetches only their language, and only the modules they open (the service worker still precaches everything for offline use).

**Status:** French is complete (all 20 modules, glossary, cheatsheet, decoder; preview until reviewed). German, Luxembourgish, Italian, European Portuguese and Arabic show lessons in English until their files exist; see `HANDOVER.md` for the plan.

### The translation kit (recommended workflow)

Writing overlay files by hand is error-prone, so the course is translated through **worklists**: plain text, one numbered unit per line.

1. `npm run i18n:extract -- de` writes `translations/en/<file>.txt` (the English, numbered) and `translations/de/<file>.txt` (the same lines, to be replaced) for `course`, `glossary`, `cheatsheet`, `decoder` and `m00` … `m19`.
2. Translate `translations/de/*.txt` line by line, keeping the `@N ` prefix:
   - `⟦F1⟧`, `⟦F2⟧` … stand for fenced code blocks: keep them exactly where they belong (the builder puts the English code back).
   - `⏎` is a line break (`⏎⏎` a new paragraph, `⏎- ` a list item). Keep the structure.
   - Keep every `code span` exactly as it is, including string literals such as `"Hello, "`: the code that runs is English.
   - A line left identical to the English is not translated (the app shows English there).
   - French: write ordinary spaces before `: ; ! ?` and inside `« »`; the builder turns them into the right no-break spaces.
3. `npm run i18n:build -- de` writes `src/content/locales/de/*.ts` (generated: edit the worklist, not these files) and warns when a line's inline code or code-block tokens differ from the English.
4. `npm run validate:content`, then read it in the app (all three reading modes).

When the English course changes later, run `npm run i18n:extract -- de` again: translations follow their English text (even if it moved), changed or new units come back in English to translate, and `i18n:build` refuses to run on worklists made from older English.

What the kit does not cover yet (it stays English): game screens and their built-in texts, quiz answer options, arena puzzles, the playground gallery, and code (comments, string literals, program output).

An overlay addresses content by id and gives wording per reading mode (`base`, `story`, `explorer`, `pro`):

```ts
export const LESSONS: ModuleOverlay = {
  'm00-l01-code-is-instructions': {
    recap: { base: ['…', '…', '…'], story: ['…', '…', '…'] },
    steps: {
      read: { prompt: { base: 'Ein Programm ist eine Liste von Anweisungen.', story: '…' }, body: { base: '…' } },
      'check-order': { choices: { top: { text: { base: '…' }, feedback: { base: '…' } } } },
    },
  },
};
```

- A translated mode falls back to the translation's own `explorer`, then `base`, before English: a Story reader of a half-translated lesson reads the language, not English.
- **Code is never translated.** A fenced code block in the English text must appear unchanged in the translation. The one exception: a `predict` step may give `predict: { code, answer }` together (for translated string literals), and the check **runs** it.
- Graded check names (`testNames`), type-test names (`typeTestNames`, for `types` steps) and quiz questions (`questions`) are translated by position.
- A step written for newer phones has a Classic alternative; translate it under the step's `classic` key, with the same fields as any step: `last: { prompt: {…}, classic: { prompt: {…}, explain: {…} } }`. Its `predict` code, if translated, is run on the Classic engine.

`npm run validate:content` checks every file: only existing lessons, steps, choices, modules and terms; only fields that fit the step; code blocks intact; balanced code spans; translated predict code prints its answer. It also reports coverage per language (`translationCoverage()` in `scripts/validateTranslations.ts`).

## The test pseudo-language

In development (`npm run dev`) and in tests, the picker offers **[Ƥšéûđöļöçåļé]**: English made visibly foreign and about a third longer, for the whole app including every lesson. Use it to find:

- text that is still plain English (it was never routed through a translation);
- layouts that break with longer words (the German problem, early).

It goes through exactly the same loading and merging as a real translation, and never ships in the production build.

## Right to left (Arabic)

- `<html dir>` follows the language. Layout mirrors automatically because styles use **logical properties** (`margin-inline-start`, `inset-inline-end`, `text-align: start`, `border-inline-start`). Never use `left`/`right` for layout; the exceptions are symmetric centring and device safe areas.
- Code, the editor, program output and keyboard keys stay left to right (`code, kbd, pre, samp { direction: ltr; unicode-bidi: isolate }`, plus `dir="ltr"` on code blocks, the editor and output).
- Diagrams keep their geometry (`direction="ltr"` on the SVG); only their words change.
- Arabic text uses the bundled **Noto Sans Arabic** (Arabic subset only, variable weight, about 160 kB; a device only reads it when Arabic characters are on screen).

## Read aloud

Each language lists voices to try, most wanted first (`speech` in `languages.ts`). Luxembourgish voices are rare, so it falls back to German, then French, and Settings says so ("No Lëtzebuergesch voice on this device, so lessons are read in Deutsch").

## Adding a language

1. Add it to `SHIPPED` in `src/i18n/languages.ts` (code, native name, direction, voices, `status: 'preview'`).
2. Create `src/i18n/locales/<code>.ts` and register it in `LOADERS` in `src/i18n/messages.ts`.
3. Run the tests: `tests/i18nCatalogs.test.ts` picks the language up automatically and lists every missing key and plural form.
4. Add course content with the translation kit (`npm run i18n:extract -- <code>`, translate, `npm run i18n:build -- <code>`); `npm run validate:content` checks it.
5. A script that needs a font Inter does not cover gets a self-hosted subset, like `src/styles/arabic-font.css`.
6. After a native speaker's review, set `status: 'reviewed'`.

## Checklist before committing a translation

- `npx vitest run tests/i18nCatalogs.test.ts tests/translations.test.ts`
- `npm run validate:content`
- `npm run test:e2e -- playwright/languages.spec.ts` (every main screen fits a phone in every language, at normal and largest text)
- Read it on a phone in all three reading modes. Story mode is read by seven-year-olds.

# TypeScript Companion

A friendly, self-paced TypeScript course for learners from about age 7 to adult. It is a static web app: every lesson, font, illustration, exercise, and the compiler itself are bundled. After the first load there is **no network access at all** — not even a font fetch.

- **95 lessons across 20 modules in three tracks**, about 12 hours of learning:
  - **Foundations** (modules 0–7): from "what is code" to strings, lists, Map and Set, functions, first types, promises and classes, ending in five studio projects played with your own code (a quiz, a budget tracker, a story spinner, a **robot maze** and a **virtual pet**).
  - **Intermediate** (modules 8–15): function types, overloads and type guards; tuples, `as const`, `Record`, intersections and `satisfies`; discriminated unions, exhaustiveness, `Result` and state machines; generics in depth; the utility types; data and async (`reduce`, immutable updates, generators, promise combinators, retries, validating `unknown`); classes and composition; and three projects: a **to-do app** run by your reducer, a shop inventory, and a turn-based **battle** game.
  - **Advanced** (modules 16–19): conditional types, `infer`, distribution, mapped types, key remapping and template literal types; recursive and branded types, variance, `NoInfer`, typed event emitters; strict compiler flags, declaration files, modules and escape hatches; and four projects: a zod-style **validation library**, a **typed router**, a **state machine engine** and a **text adventure**.
- **Type Challenges arena**: 31 type puzzles in four levels (warm-up to extreme), graded by TypeScript's checker, with progress and a badge.
- **Playground gallery**: examples for every track, switches for stricter compiler flags, and the types of your own code on tap.
- **Three reading modes** — Story, Explorer, Pro — over one curriculum spine. Story mode (about 7–12) has its own wording for everything a learner reads: lesson text, prompts, hints, feedback and recaps. Pro mode (for people who already program) has its own reading text, explanations and recaps, with the semantics, compiler flags and error codes an experienced developer wants.
- **A guided path, or free exploration.** Lessons open one after another by default. **Settings → Unlock all lessons** (one confirmation) opens every lesson in any order. The suggested path stays marked, and a lesson taken early names what it builds on, as a note rather than a barrier. Onboarding asks about coding experience and suggests where to start (someone who knows JavaScript starts at the types).
- **A journey map that stays short.** Modules open on tap, with the current one open. The map is a winding path in Story mode, cards in Explorer and a dense list in Pro. Each module has its own page: progress, key ideas, lessons.
- **Joyful, never pushy.** Points and levels (from "Curious Beginner" to "Compiler Whisperer"), a daily goal of 5, 10 or 20 minutes, and a **gentle streak**: a rest day is saved every week, so a quiet day does not break it, and coming back after a break is met with "welcome back". Tess cheers right answers and nudges kindly after wrong ones. Finished lessons and modules are celebrated, and optional sounds are generated on the device. Badges cover milestones, modules, skills and exploring, and the Progress page shows your week. **Quiet mode** (offered to Pro readers) turns all of it off.
- **Keyboard-friendly.** Ctrl/⌘+Enter checks or runs the current exercise everywhere, including inside the code editor and the Playground. Pro mode adds J/K for next/back, H for a hint and ? for the list of shortcuts.
- **Seven languages, switched without losing your place.** English, French, German, Luxembourgish, Italian, European Portuguese and Arabic (right to left, with its own offline font). Switching keeps the page, the step and anything typed, and even re-words a result already on screen. The first launch picks the device's language (a Belgian French phone starts in French). Read aloud uses a voice for the language, with a German or French fallback for Luxembourgish. Translations are previews until a native speaker reviews them. The whole course (lessons, glossary, cheatsheet, error decoder) is translated into French; the other languages show lessons in English until their translations land. See `docs/translating.md`.
- **Practice that comes back.** Every graded step a learner answers returns for spaced practice a few days later (1, 3, 7, 14, 30 days as it sticks). Home shows what is due; when nothing is, the hardest steps are one tap away.
- **Real code, graded locally.** A Web Worker compiles TypeScript with `esbuild-wasm`; a second, disposable worker runs it with a hard timeout.
- **Real type checking.** TypeScript's own type checker reads the learner's code on the device. A graded exercise counts as solved only when its checks pass *and* the types are right; the Playground reports type problems next to the output.
- **Exercises about types themselves.** *Type challenges* are graded by type tests (`Expect<Equal<…>>`, and lines that must be rejected); *predict the type* asks what TypeScript infers and accepts any spelling of the identical type. **See types** on any lesson code sample: tap a name and the checker says its type. Steps can switch on stricter compiler flags (`noUncheckedIndexedAccess`, …) and say so. Optional **bonus steps** ("Go further") are offered once a lesson is finished.
- **Old phones and new phones.** Newer Android WebViews run ES2022/ES2023 features (`.at()`, `toSorted`, `structuredClone`…); older ones do not. The app detects which it is on (or lets you choose in **Settings → Device engine**), and a step that uses a newer feature shows older phones a Classic version that teaches the same idea. Progress is the same either way. See `docs/android.md`.
- **Help when stuck.** Every graded step has a hint and a "Show me the answer"; common beginner mistakes get plain-language explanations (including near misses in "what will this print?": quotes, line breaks, order, missing or extra lines), and the learner's code is kept between visits.
- **Made for phones.** On a touch screen a symbol bar under the code editor types `{ } ( ) [ ] ; = =>` and friends (and moves the cursor, indents, undoes) without leaving the keyboard; lessons are a focused screen with Back / Hint / Next always in reach.
- **Progress stays on the device.** No accounts, no telemetry, no sync. Export/import is a JSON file.
- **Android-ready.** Hash routing, relative asset paths, safe-area insets, a back-button guard, and a `dist/` scanner that fails the build on anything a WebView cannot load.

## Quick start (Windows PowerShell)

```powershell
npm install
npm run dev          # http://localhost:5173
```

Production build and local preview:

```powershell
npm run build        # typecheck + vite build + Android-readiness scan
npm run preview      # http://localhost:4173
```

`npm run build` refuses to produce a bundle that contains remote URLs, absolute asset paths, missing assets, or an unstamped service worker.

Before committing, run the full gate:

```powershell
npm run check        # typecheck + lint + all unit tests + build + Android-readiness scan
```

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Vite dev server with a dev-only CSP relaxation for HMR |
| `npm run typecheck` | `tsc --noEmit` with the strict flags from the brief |
| `npm run test` | Vitest unit and render tests |
| `npm run test:watch` | Vitest in watch mode |
| `npm run validate:content` | Schema, link, glossary, prerequisite-cycle, syntax, and grading checks; exercises are graded with the app's own compiler and sandbox; also fails when the lesson catalog is stale |
| `npm run content:catalog` | Regenerates `src/content/generated/catalog.ts` from the lesson files (run after editing a lesson) |
| `npm run i18n:extract -- <lang>` | Writes translation worklists to `translations/<lang>/` (keeps existing translations; see `docs/translating.md`) |
| `npm run i18n:build -- <lang>` | Turns translated worklists into course overlays under `src/content/locales/<lang>/` |
| `npm run build` | Typecheck, production build, then `check:android` |
| `npm run check` | The full gate: typecheck, lint, every unit test, production build, `check:android` |
| `npm run check:android` | Scans `dist/` for remote URLs, absolute paths, missing assets/fonts, and an unstamped service worker |
| `npm run preview` | Serves `dist/` on port 4173 |
| `npm run test:e2e` | Playwright browser regression suite (build first; see below) |
| `npm run lint` | ESLint flat config (`eslint.config.js`) with `jsx-a11y` and React hooks rules; warnings fail |

For the browser regression suite:

```powershell
npm run build
npx playwright install chromium   # first time only
npm run test:e2e
```

If Playwright cannot download its browser (an offline or locked-down machine), point it at any recent Chromium or Chrome instead: `$env:CHROMIUM_PATH = "C:\path\to\chrome.exe"` (PowerShell) or `CHROMIUM_PATH=/path/to/chromium` (bash).

The suite runs the production bundle in a real browser. It is kept out of `npm run check` because it needs a browser binary.

| Spec | Covers |
| --- | --- |
| `offline.spec.ts` | Onboarding, a whole lesson, then an offline relaunch with zero failed requests |
| `progress.spec.ts` | Reloading on a lesson page keeps progress and the step; answers survive an immediate close; a second tab stays in sync |
| `crashes.spec.ts` | A failed editor download stays inside its panel and Reload recovers; the learner's own errors are not app errors |
| `runner.spec.ts` | Graded exercises accept their solutions; output limits; never-ending loops; async order; `export`/`await`/`import`; compiler failure and recovery |
| `service-worker.spec.ts` | Real deploys: a new version reaches returning users and is offered in-app; offline stays complete; a broken deploy is refused |
| `lesson-layout.spec.ts` | Every step of every lesson in all three reading modes, on a phone: Next in reach, no code cut off, the page never wider than the screen |
| `practice.spec.ts` | Answering in a lesson schedules practice; a due step shows on Home; practising it is saved |
| `games.spec.ts` | The Studio quiz is scored by the learner's own function; the budget tracker updates as expenses are added |
| `journey.spec.ts` | Unlock all lessons end to end (confirm, jump ahead, the builds-on note, lock again); the journey and every module page fit a phone in all three modes at normal and largest text |
| `motivation.spec.ts` | A lesson counts towards today and ends with its points (with sounds on, no errors); Ctrl+Enter runs the checks from inside the code editor without adding a line; Pro shortcuts move through a lesson but never while typing |
| `languages.spec.ts` | Switching language mid-exercise keeps the page, step and answer; Arabic is right to left with code left to right and the Arabic font loaded; a `fr-BE` device starts in French; every main screen fits a phone in all seven languages at normal and largest text; the dyslexia font applies |
| `symbol-bar.spec.ts` | The phone symbol bar types at the cursor, keeps the editor focused and is never covered; no bar with a mouse |
| `accessibility.spec.ts` | Typing in the reset dialog, the skip link, the Android back button, reordering lines from the keyboard, toasts never covering the bottom navigation |
| `engine.spec.ts` | Modern and Classic device modes (Classic forced in Settings): the Classic alternative of a modern step, the Playground behaving like an old phone with a plain explanation; predict-the-type and a bonus type challenge graded by the real checker; tap-to-see-type; a step's compiler flags |
| `arena.spec.ts` | The Type Challenges arena (a puzzle solved with the real checker and remembered); the Playground gallery, compiler-flag switches and types on tap |
| `axe.spec.ts` | Automated accessibility audit (axe-core) of every screen and the states learners see — answered exercises, results, dialogs, badges, certificate — in light and dark themes, and in Arabic and German; any serious or critical violation fails |

## How it is put together

```
src/
  app/          shell, error boundary, service-worker registration
  content/      typed lessons, curriculum map, generated lesson catalog, per-module loader, glossary, cheatsheet, error decoder
  features/     home, lesson player, exercises (incl. Studio games), practice, playground, progress, settings, reference
  runner/       esbuild-wasm compile worker, sandboxed execute worker, friendly grader
  storage/      StorageAdapter interface, local adapter, schema migrations, practice scheduling, points/levels/goal/streak, badges, zustand store
  platform/     capabilities: speech, clipboard, file save, safe areas, back guard, connectivity
  i18n/         languages, message catalogues (English is the source), translate / plural / Intl helpers
  ui/           design-system primitives and the code editor
  styles/       design tokens and base styles
scripts/i18n/   translation kit: extract worklists, build course overlays (npm run i18n:extract / i18n:build)
translations/   worklists per language (translations/en is the numbered English snapshot)
docs/
  android.md    Capacitor conversion recipe and gotchas
  authoring.md  how to add a lesson or module
  translating.md how to translate screen text and lessons, and keep right to left working
  offline.md    how the offline promise is enforced and manually verified
```

Boundaries worth knowing:

- `storage/` is the only place that touches `localStorage`. Swap the adapter for Capacitor Preferences later without touching a screen.
- `platform/` is the only place that touches browser capabilities (`window`, `navigator`, speech, history).
- `runner/` is the only place that executes learner code. The app itself never uses `eval` or `new Function`.

## The offline guarantee

- The production CSP is `default-src 'self'; connect-src 'none'` (plus the minimum needed for the wasm compiler and blob workers). A stray request fails loudly.
- Lesson content is TypeScript compiled into the bundle — never fetched from anywhere else. Each module is its own chunk, loaded when one of its lessons opens, and precached by the service worker like every other file.
- Fonts are self-hosted `.woff2` files from the `@fontsource` packages.
- A hand-written service worker precaches every built asset on its first install (all or nothing), so one visit is enough for a fully offline reload. Each build stamps it with a new build id, so updates reach returning visitors; the app offers a reload when a new version is ready. It is skipped inside a Capacitor shell, where assets are already local.
- `npm run check:android` re-verifies the built output: no `http(s)://` URLs, no absolute `/assets` paths, no missing fonts or icons.

See [docs/offline.md](docs/offline.md) for the full verification checklist.

## Adding a lesson

Lessons are typed data. Start at [docs/authoring.md](docs/authoring.md). In short: add a `Lesson` to `src/content/lessons/mNN.ts`, list its id in the module in `src/content/curriculum.ts`, make sure every `concepts` id exists in `src/content/glossary.ts`, then run:

```powershell
npm run validate:content   # quick: just the content checks
npm run check              # everything: typecheck, lint, tests, build, Android scan
```

## Converting to Android

The exact Capacitor recipe, including `webDir`, `androidScheme`, status-bar/splash configuration, and the safe-area/back-button/file-export gotchas, is in [docs/android.md](docs/android.md).

## Honest limitations

- **The type checker is a large download.** It adds about 4 MB (1.1 MB compressed) to the first visit, which is about 17 MB in total with the compiler. It loads in its own worker on the first check, so the first check of a session takes a few seconds; later checks take a fraction of a second.
- **Pro mode shares the small print.** Reading text, explanations and recaps have Pro versions; prompts, hints and multiple-choice feedback are shared with Explorer (the fallback chain is `story → explorer → base`, `pro → base`).
- **Practice lives on one device.** Like the rest of progress, the practice schedule travels only in an exported file. Code steps in practice start from the starter code each time.
- **No sound-effects toggle.** The stack has no bundled audio and the brief forbids remote assets; rather than fake a control, the setting is omitted. Speech synthesis ("Read aloud") is real and feature-detected.
- **The service worker is browser-build only.** Capacitor serves the same files from its own local origin, so registering a worker there would add cache-invalidation problems without adding offline capability.

The error decoder is a local lookup table, not an AI. Grading never calls a server.

# Handover: TypeScript Companion after the enrichment work

This is the hand-off for whoever continues the work in a new session. It covers what's done, what's left (Phases 12–16 and the open items), how to work on the project, and where things live.

The full plan, decisions and phase-by-phase log are in `ENRICHMENT_PLAN.md` (next to the project folder). The working rule there still applies: **each phase starts only after the owner approves it**, and ends with a short report that includes screenshots and test results.

---

## 1. Where things stand (version 1.1.0)

| Area | State |
| --- | --- |
| Course | 95 lessons in 20 modules and three tracks: Foundations M0–M7, Intermediate M8–M15, Advanced M16–M19. About 12.9 hours. Story, Explorer and Pro reading modes throughout, including full Story versions of the Advanced track. |
| Practice | Eight games (quiz, budget, spinner, maze, pet, todo, battle, adventure), a Type Challenges arena (31 puzzles in four levels), a Playground with a gallery of 12 examples and compiler-flag switches, and spaced-repetition practice. |
| Reference | Glossary (140 terms), cheatsheet (including the advanced sections) and error decoder (with TypeScript's own messages). |
| Unlock all | Setting with a confirmation dialog. The recommended path stays visible, and lessons that build on unfinished ones say so. |
| Devices | Modern and Classic modes for newer and older Android WebViews (ES2023 vs ES2021), chosen automatically and changeable in Settings. |
| Screen text | All seven languages: English, French, German, Luxembourgish, Italian, European Portuguese and Arabic (right to left). Switching language never loses the learner's place. |
| Course text | **English and French.** French covers all 20 modules in all three modes, plus module and lesson titles, the glossary, the cheatsheet and the error decoder. The other five languages show lessons in English, and the language picker says so. |
| Quality gate | `npm run check` passes: typecheck, lint, 635 unit tests, build and the Android scan. The 82 Playwright browser tests pass. `npm run validate:content` passes, including the translation checks. |

Every translation except English is marked **preview** (`status` in `src/i18n/languages.ts`) until a native speaker has reviewed it.

---

## 2. Remaining phases: course translations (12–16)

Each phase translates the whole course into one language, using the translation kit that was built in Phase 11 (`docs/translating.md` → "The translation kit"). The order stays as approved.

| Phase | Language | Code | Particular care |
| --- | --- | --- | --- |
| **12** | German | `de` | Long compound words: check every screen at the largest text size (`playwright/languages.spec.ts` does it for main screens; also read a few lessons on a phone). Use *du*, matching the German screen text. |
| **13** | Luxembourgish | `lb` | Follow the 2019 spelling reform and the *n*-rule (Eifeler Regel). Technical terms often stay German or English, so check the screen text's choices in `src/i18n/locales/lb.ts` and stay consistent with them. Needs a native-speaker review more than any other language. Read aloud falls back to German or French voices, which is already handled. |
| **14** | Italian | `it` | Use *tu*, consistent with the screen text. |
| **15** | European Portuguese | `pt-PT` | European spelling and vocabulary (*ecrã*, *ficheiro*, *utilizador*), not Brazilian. Use *tu*, consistent with the screen text. |
| **16** | Arabic | `ar` | Right to left. Write Arabic punctuation (، ؛ ؟) in prose, but keep code spans untouched (they're shown left to right and isolated). Keep Western digits (0–9) to match code. After building, check several lessons on a phone for mixed-direction lines, especially bullet lists that start with code and Pro text dense with `code spans`. Needs a careful native review. |

### How each phase runs (about the size of Phase 11)

1. `npm run i18n:extract -- <code>` writes 24 worklists to `translations/<code>/`: `course`, `glossary`, `cheatsheet`, `decoder` and `m00`–`m19`. That's about 6,300 lines and about 470 kB of English.
2. Translate every worklist. Keep the `@N` numbers, the `⟦F1⟧` code-block tokens, the `⏎` line breaks and every `code span` exactly as they are. Use `translations/fr/` as a worked example of tone and scope: French uses *tu* everywhere, Story mode is warm and simple, and Pro mode is precise.
3. `npm run i18n:build -- <code>` generates `src/content/locales/<code>/*.ts`. Fix any warnings it prints about inline code or code blocks.
4. Run `npm run validate:content`, then `npm run check`, then `npm run build` followed by the full Playwright suite. In `tests/courseTranslation.test.ts`, add the language to the coverage test (French expects more than 95% of lesson prose translated).
5. Take screenshots of the language in all three reading modes (home, a Story read step, an Explorer exercise, a Pro read step, a recap, the glossary, the cheatsheet and the decoder), for example with the script pattern in section 5 below.
6. Update `docs/translating.md` (the status line), the README's language sentence, the About text if the wording needs it, and the phase log in `ENRICHMENT_PLAN.md`. Then commit and report.

What the picker shows changes by itself: once a language has any module file, its "Lessons in English for now" label disappears (`hasLessonTranslations`).

---

## 3. Open items (not part of any approved phase yet)

These are known gaps, listed so they aren't lost. Each would need the owner's go-ahead.

**Translation scope the kit doesn't cover yet (these stay English in every language):**
- **Game screens:** built-in texts in `src/features/exercises/games.tsx` and the `@tag` data lines, quiz answer options (the questions themselves *are* translated), and the adventure's room descriptions.
- **Arena puzzles** (`src/content/arena.ts`): titles, descriptions and hints.
- **Playground gallery** (`src/content/gallery.ts`): titles and descriptions.
- **Code:** comments and string literals in starter code and examples, and program output. The overlay format already allows translated `predict` code with its answer, and validation runs it, but the kit doesn't generate those entries.

A sensible next step is to extend `scripts/i18n/worklists.ts` with `arena`, `gallery` and `games` worklists, following the cheatsheet and decoder pattern: an overlay type in `src/content/overlay.ts`, a language-aware loader, and a check in `scripts/validateTranslations.ts`.

**Reviews:**
- A native-speaker review of the screen text in all six languages and of the French course, then set `status: 'reviewed'`.
- A teaching review by a human of the new lessons, especially the Advanced track in Story mode (M16–M19), which explains type-level programming to children through metaphors.

**Course polish carried over from the English phases:**
- Pro-mode prompts and hints in M4–M6 weren't rewritten to the depth of the newer modules.
- The glossary has 140 terms; the plan aimed for about 150.
- The shop project (M15) ends in an interactive "try it" step instead of a game like the other Studio projects.

**Release:**
- Test Classic mode on a real older Android phone (the browser tests emulate it by feature detection).
- Package for Android with Capacitor (recipe in `docs/android.md`), then store listing, icons and signing.
- Decide when to move the version from 1.1.0 (French course) to 2.0.0 (all languages).

---

## 4. Working on the project

```bash
cd TypeScript_Companion_v2
npm ci
npx tsc -p tsconfig.json --noEmit     # typecheck
npm run lint
npx vitest run                        # 635 unit tests (about 80 s)
npm run validate:content              # content and translation checks (about 20 s)
npm run check                         # the full gate: typecheck, lint, tests, build, Android scan
npx vite build && npm run test:e2e    # 82 browser tests (about 11 min); needs a Chromium
npm run content:catalog               # after editing lessons (the content check fails if stale)
npm run i18n:extract -- <lang>        # translation worklists
npm run i18n:build -- <lang>          # worklists → course overlays
```

In the sandbox used so far, Playwright's Chromium was at `/opt/pw-browsers/chromium-1194/chrome-linux/chrome`:

```bash
CHROMIUM_PATH=/opt/pw-browsers/chromium-1194/chrome-linux/chrome npx playwright test --reporter=line
```

One browser test (the flood test) is timing-sensitive, so don't run other heavy jobs alongside the suite.

Scripts that import lesson content run with `vite-node`, as the `npm run` scripts above do. Modules that import the screen-text catalogue need Vite (`import.meta.env`), so they can't be run with plain Node or `tsx`.

Commits so far use `git -c user.name="Companion Dev" -c user.email="dev@localhost" commit`.

---

## 5. Where things live

| What | Where |
| --- | --- |
| Lessons (English source) | `src/content/lessons/mNN.ts`, curriculum and tracks in `src/content/curriculum.ts`, generated catalogue in `src/content/generated/` |
| Lesson format | `src/content/schema.ts`; authoring guide in `docs/authoring.md` |
| Course translations | `src/content/locales/<lang>/` (generated, checked in) from `translations/<lang>/*.txt` (the source to edit) |
| Overlay format and merging | `src/content/overlay.ts`; loading in `src/content/courseText.ts` (lessons, glossary) and `src/content/reference.ts` (cheatsheet, decoder) |
| Translation kit | `scripts/i18n/` (`units.ts`, `worklists.ts`, `extract.ts`, `build.ts`) |
| Translation checks | `scripts/validateTranslations.ts` (run by `npm run validate:content`) |
| Screen text | `src/i18n/locales/<lang>.ts` (English defines the keys), languages in `src/i18n/languages.ts` |
| Games | `src/features/exercises/games.tsx`, drivers and `@tag` data in the lesson steps |
| Arena and gallery | `src/content/arena.ts`, `src/content/arenaLevels.ts`, `src/features/arena/`, `src/content/gallery.ts` |
| Device modes | `runtime` and `classic` on steps; detection in `src/platform/capabilities.ts`; the checker's library per engine (ES2021 or ES2023) in `src/runner/typecheckCore.ts` |
| Browser tests | `playwright/*.spec.ts` |
| Screenshots from each phase | `/workspace/screenshots/phase1` … `phase5-10`, `phase11` |

A screenshot script pattern that worked: seed `localStorage['ts-companion.state']` with a schema-5 state (settings include `language` and `mode`), open `http://127.0.0.1:4174/#/learn/<lesson-id>` from `npx vite preview --port 4174`, and capture the page at 390×844.

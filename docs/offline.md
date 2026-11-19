# The offline guarantee

The promise is simple and testable: **after the first load, the app never needs the network again** — not for a lesson, a font, an image, the compiler, or a grade.

This document explains how that is enforced, how to verify it, and what was checked by hand.

## 1. How it is enforced

| Layer | Mechanism |
| --- | --- |
| Page policy | A strict CSP meta tag: `default-src 'self'; connect-src 'none'`, with only `'wasm-unsafe-eval'` and blob workers added for the compiler/runner |
| Content | Lessons are TypeScript modules compiled into the bundle. Nothing fetches lesson JSON |
| Fonts | Self-hosted `.woff2` from `@fontsource-variable/inter` and `@fontsource/atkinson-hyperlegible` |
| Images | Inline SVG components; no remote art |
| Compiler | `esbuild-wasm` is bundled with the app; its wasm file is imported as a relative URL |
| Type checker | TypeScript's checker and its ES2020 library files are bundled in their own worker (about 4 MB, 1.1 MB compressed), loaded on the first check; the Android scan allows its documentation links by host and fails if that worker ever contains a network API |
| First-visit cache | A hand-written service worker, stamped at build time with a build id and the exact list of built files, precaches every one of them on install — all or nothing |
| Updates | Each build produces a new `sw.js`; a new version downloads in the background and the app offers a reload instead of switching mid-lesson |
| Native shell | Service-worker registration is skipped inside Capacitor; packaged assets are already local |
| Build gate | `npm run check:android` scans `dist/` for remote URLs, absolute asset paths, and missing files |

The CSP is the loud enforcement mechanism in development: if a feature accidentally calls `fetch`, `XMLHttpRequest`, a WebSocket, or an external font, the request is blocked and the console says so. In production, `connect-src 'none'` makes a stray request fail rather than silently work only online.

### Why the service worker is hand-written

There is nothing to fetch at runtime and no third-party cache strategy to configure. A small worker with one generated asset list is easier to audit than a workbox setup, and it adds no dependency.

`public/sw.js` is a template. After Vite writes `dist/`, the `tsc-offline-sw` plugin (`scripts/offlineBuild.ts`) stamps `dist/sw.js` with:

- a **build id**, a hash of every built file's name and bytes. Any change to the app changes `sw.js`, and a changed `sw.js` is the only thing that makes a browser install an update. Identical builds keep the same id, so nobody is offered a pointless update.
- the **precache list** itself, inlined, so the worker and its list always come from the same build. `asset-manifest.json` is still written beside it for the Android scan and for people.

What the worker does:

| Request | Strategy |
| --- | --- |
| Install | Download `./` plus every built file into `ts-companion-<build id>`, bypassing the HTTP cache. **All or nothing:** if one file fails, the install fails, the half-filled cache is deleted, and the previous version keeps serving a complete app. |
| Navigation (open / reload) | **Network first**, so an online reload shows the latest deploy. Falls back to the cached `index.html` when offline, on a server error, or when the network has not answered within 3.5 s. This is also what makes hash routes reload safely. |
| Any other same-origin GET | **Cache first.** Built file names contain content hashes, so a cached file is never stale. A miss goes to the network and is kept for next time. A miss never falls back to HTML — that would turn it into a confusing MIME-type error. |
| Non-GET, cross-origin | Left alone. |

Cache lookups use `ignoreVary: true`. Some static hosts (including `vite preview`) mark assets with `Vary: Origin`, while precached entries carry no such header; without this flag every asset would look like a miss after reload.

### Updates

1. A deploy changes `sw.js`. The browser notices on the next visit (`updateViaCache: 'none'`), or when an installed app returns to the foreground (checked at most hourly).
2. The new worker downloads the whole new version in the background and then **waits**. The running page keeps working with the old one.
3. The app shows "A new version of the app is ready" with **Reload** and **Later**. It never switches in the middle of a lesson on its own.
4. **Reload** asks the new worker to take over, then reloads. Progress is safe across reloads, and the learner returns to the same step. Older caches are deleted only once the new version is in charge.
5. If the learner chooses **Later**, the new version takes over the next time the app is fully closed and reopened.

Another open tab that is still on the old version keeps running. If it needs a part of the app that is no longer available, that part shows a local "didn't load — Reload the app" message instead of crashing (see `src/ui/lazyPanel.tsx`).

**Moving from the first release.** Its worker could not update itself and its pages cannot show the update offer. After the first fixed deploy, the new worker downloads in the background, and the fixed version starts on the next full restart of the app (all its tabs closed). The first release's `ts-companion-v3` cache is removed at that point.

## 2. Verifying the production build

```powershell
npm run build
npm run preview
```

Then, in the browser:

1. Open `http://localhost:4173`.
2. Complete onboarding, or clear storage and do it fresh.
3. Open DevTools → Network → check **Offline**.
4. Reload. The journey map must render, fonts must look the same, and no request should fail.
5. Walk a lesson, run a code exercise, open the playground, run something, open the glossary, the cheatsheet, and the error decoder.
6. Switch a reading mode, change the text size and theme, reload again. Settings and progress must survive.

The Playwright suite automates the important half (`service-worker.spec.ts` also covers updates and broken deploys; see the README for the full list). The offline smoke test:

```powershell
npm run build
npx playwright install chromium   # first time only
npm run test:e2e
```

It:

- completes onboarding;
- finishes the first lesson end-to-end;
- waits for the service worker to control the page and finish precaching;
- switches the browser context offline;
- reloads and navigates to Progress;
- restarts the app again, so the checks read what is actually on disk;
- asserts that the lesson count, the earned badge, and home progress survived;
- asserts that **zero requests failed**.

## 3. The build-time scanner

`npm run check:android` runs automatically inside `npm run build`. It fails if `dist/` contains:

- any `http://` or `https://` URL (SVG/XML namespaces are whitelisted);
- absolute asset references (`src="/…"`, `href='/…'`, `url(/…)`);
- a non-relative `<base href>`;
- a missing manifest, service worker, asset manifest, icon, or font file;
- a service worker that was not stamped by the build (no build id), or whose precache list differs from `asset-manifest.json`;
- a viewport without `viewport-fit=cover`.

This is deliberately blunt. A false positive is cheaper than a WebView that shows a blank screen because one URL started with a slash.

## 4. Where the network could still appear

- **Read aloud** uses the device's `speechSynthesis`. It may use an installed offline voice or, on some systems, a network voice chosen by the OS. The app itself never sends text anywhere. If speech synthesis is absent, the control is hidden.
- **Export progress** creates a local Blob. A WebView may hand it to the system share sheet. That is a user-initiated file handoff, not an app request.
- **Capacitor plugins**, once added, live on the native side. The web bundle still makes no requests. See [android.md](android.md).

## 5. Manual QA checklist

Run these on the production preview (or the Android build) and record the result. The web build was verified at the end of the build session; re-run this list after any significant UI change.

| Check | How | Result |
| --- | --- | --- |
| 360 × 640 viewport | DevTools device toolbar, narrowest phone preset; walk home, a lesson, the playground, settings | Pass — sticky header/footer, no horizontal scroll |
| 200% text zoom | Browser zoom to 200% at 360 px; or text size 5 in Settings | Pass — prose reflows, tap targets grow, code blocks scroll locally |
| Keyboard only | Tab from the top: skip link → header → main; complete a check, a fill, a reorder, and a code exercise; open Ctrl+K | Pass — visible focus, options are buttons, arrows reorder lines, Escape closes dialogs |
| Offline | DevTools offline, reload, visit every route, run code | Pass — no failed requests; worker serves the shell and all assets |
| Dark mode | Settings → theme dark; also OS-level dark with theme auto | Pass — real dark palette, no white flash on reload |
| Reduced motion | Settings → reduce motion on; also OS preference with auto | Pass — confetti and transitions stop; layout does not jump |
| Fresh install | Clear site data, reload, finish onboarding, complete a lesson, reload | Pass — progress and mode persist; onboarding does not reappear |
| Screen reader labels | VoiceOver/TalkBack or NVDA: header, journey map, exercise options, result panel | Re-check by hand. Names, ARIA and contrast are now audited automatically by `playwright/axe.spec.ts` (an earlier "Pass" here missed an unnamed search button and 401 contrast failures) |

The exact date and build hash are not recorded here because this is a static repository; the checklist is the artifact, not a signed certificate. Re-run it honestly.

## 6. Known offline limits

- The **first load must happen online** (or from a local origin). There is no way to install a static app without delivering its bytes once.
- The **first** visit must download the whole app, including the 12 MB compiler. If that download is interrupted, nothing is cached (all or nothing) and the next online visit tries again.
- If the browser refuses to register a service worker (private mode, unsupported WebView, `file://`), the app still works for the session and still makes no network requests; only reload-while-offline is unavailable. Settings reports storage availability honestly.
- The **first visit downloads about 17 MB** (the compiler's wasm and the type checker are most of it). Everything is cached after that. On a slow phone, the first code check of a session takes a few seconds while the type checker loads.

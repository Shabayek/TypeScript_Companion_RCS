# Turning TypeScript Companion into an Android app

The web app is built for this. It uses hash routing, relative asset paths, no backend, no remote assets, and a storage layer with a single replaceable adapter. The conversion is a packaging job, not a rewrite.

Everything below is a recipe for a later session. The Capacitor packages are **not** installed in this repository yet, so the web build stays dependency-light.

## 1. Add Capacitor and create the project

Run from the repository root:

```powershell
npm install -D @capacitor/cli @capacitor/core @capacitor/android
npx cap init "TypeScript Companion" "com.example.typescriptcompanion" --web-dir=dist
npm run build
npx cap add android
npx cap sync android
```

`com.example.typescriptcompanion` is a placeholder application id. Change it before publishing.

Create `capacitor.config.ts` at the repository root:

```ts
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.example.typescriptcompanion',
  appName: 'TypeScript Companion',
  webDir: 'dist',
  // The WebView origin. Keep https so localStorage, workers, and wasm
  // behave exactly as they do in a normal browser.
  server: {
    androidScheme: 'https',
  },
  android: {
    // Set to true temporarily when debugging the WebView with chrome://inspect.
    webContentsDebuggingEnabled: false,
  },
};

export default config;
```

Then sync after every web build:

```powershell
npm run build
npx cap sync android
npx cap open android
```

`npm run build` runs `check:android` first, so a bundle with an absolute path or a remote URL never reaches Android Studio.

## 2. App shell settings

The app already ships:

- `viewport-fit=cover` and `env(safe-area-inset-*)` padding, measured at boot.
- `theme-color` metas for light and dark, updated when the theme changes.
- A manifest with 192 px and 512 px PNG icons plus an SVG source.
- A back-button guard that keeps hardware back inside the app and only explains at the root.

Optional native splash/status-bar polish:

```powershell
npm install @capacitor/status-bar @capacitor/splash-screen
```

```ts
// capacitor.config.ts additions
plugins: {
  SplashScreen: {
    launchShowDuration: 300,
    backgroundColor: '#f6f1e7',
    showSpinner: false,
  },
  StatusBar: {
    style: 'LIGHT',
    backgroundColor: '#f6f1e7',
  },
},
```

Match the splash background to `--paper` (`#f6f1e7` light, `#171a26` dark) so there is no white flash before the first frame.

### Icons and splash art

- `public/icon.svg` is the source; `public/icon-192.png` and `public/icon-512.png` are already generated from the same design.
- In Android Studio, use **Image Asset** to point at the 512 px PNG for the launcher icon, or run `npx @capacitor/assets generate --android` (an optional dev tool, not part of the web build).
- A splash image is optional. A solid `--paper` colour is calmer and cheaper than a custom illustration.

## 3. The three gotchas

### Safe areas

There is no browser chrome in a WebView, but notches, punch-holes, and gesture bars remain. The layout already reserves space with `env(safe-area-inset-top)` and `env(safe-area-inset-bottom)`, and `measureSafeAreas()` copies the values into CSS variables for older WebViews. If you change the header or bottom navigation, keep those paddings. Inside a lesson the bottom navigation is not shown: the lesson's own footer (Back, Hint, Next) sticks to the bottom with the safe-area padding, so Next is never under a bar. Test in landscape too: the brief requires usable portrait *and* landscape, and a fixed-height editor is the usual culprit.

### Typing code with the on-screen keyboard

Phone keyboards hide `{ } ( ) [ ] ; =` two pages deep, so every editable code editor has a **symbol bar** (`src/ui/SymbolBar.tsx`) on touch screens (`pointer: coarse`): undo, cursor left/right, Tab, bracket and quote pairs that put the cursor inside, and the common operators. Its buttons never take focus from the editor, so the keyboard stays open. Curly quotes typed by a phone keyboard are straightened when the code would not compile otherwise.

While the editor is focused, the bar sticks to the bottom of the visible area, and the lesson footer and bottom navigation step back into the page so nothing covers it. That relies on the layout viewport ending at the top of the keyboard:

- In Chrome for Android, the viewport meta has `interactive-widget=resizes-content` (already in `index.html`).
- In the WebView, keep `android:windowSoftInputMode="adjustResize"` on the activity in `AndroidManifest.xml`. If you add `@capacitor/keyboard`, use a resize mode that resizes the WebView (`native` or `body`), not `none`.

Check it on a device: open a code exercise, type, and the bar should sit directly on top of the keyboard.

### Back button

Inside the WebView, Android hardware back is ordinary history back. The app pushes a single sentinel entry while the learner is at `#/`, so:

- back from a lesson returns to the journey map (normal history);
- back at the root consumes the sentinel and explains that this is the start;
- a second back leaves the app.

If you want native control (for example, a confirm sheet before exiting), install `@capacitor/app` and call `App.addListener('backButton', ...)` in `src/platform/`. Keep the history guard as the fallback: it is what makes the browser build and the WebView behave the same.

### File export

The Progress screen offers three ways out, because export is the learner's only backup:

- **Save a file** — `Blob` + `<a download>` (`requestDownload` in `src/platform/capabilities.ts`). Android WebViews vary: some write to Downloads, some hand the file to a share sheet, and **some silently do nothing**. No browser reports whether a file was written, so the app says the download was *requested* and points to the other two options.
- **Copy progress** — always shown. If the clipboard is blocked, the text appears in a box to copy by hand.
- **Share…** — shown where `navigator.canShare({ files })` is true (Android Chrome and many WebViews): the system share sheet can save to Files or Drive, or send the file.

For a first-class Android experience, reimplement `requestDownload` and `shareFile` in `src/platform/capabilities.ts` with `@capacitor/filesystem` (write to `Directory.Documents`) and `@capacitor/share`. Only those functions change; the Progress screen calls the platform helpers.

### Memory

The type checker (TypeScript in a worker, about 4 MB of code) and the compiler (esbuild's wasm) stay loaded once a learner has run code in a session. On low-memory devices, watch the WebView's memory in Android Studio's profiler while running a few exercises; if it is tight, ending those workers after a few idle minutes is a small change in `src/runner/compileClient.ts` and `src/runner/typecheckClient.ts`.

### Renderer crashes

If the WebView's renderer process dies (for example, the device runs out of memory while a learner's program builds a huge array), Android kills the whole app unless the shell handles it. Capacitor's `BridgeWebViewClient` can be extended to override `onRenderProcessGone` and recreate the WebView; progress is saved continuously, so reloading the app is safe and resumes the lesson.

### Old and new WebViews: Modern and Classic modes

The app shell needs **Chrome / Android System WebView 90 or later** (Android 7+ devices that still receive WebView updates, and most older phones that do not). Learner code is lowered by esbuild to ES2020 syntax, so syntax is never the problem; **built-in methods** are. Those cannot be added by compiling, so the app has two engine modes:

| Mode | WebView | JavaScript the lessons run | Type checker library |
| --- | --- | --- | --- |
| **Classic** | 90–109 | up to ES2021 (`replaceAll`, `Promise.any`, `??=`, …) | `lib.es2021` |
| **Modern** | 110+ | also ES2022 and ES2023: `.at()`, `Object.hasOwn`, `structuredClone`, `toSorted`, `toReversed`, `toSpliced`, `with`, `findLast`, `findLastIndex` | `lib.es2023` |

- **Detection** (`detectEngine()` in `src/platform/capabilities.ts`) tests for those methods once at start. A device missing any of them is Classic.
- **Settings → Device engine** offers Automatic / Modern / Classic. Modern cannot be chosen on a Classic device. Choosing Classic on a new phone shows exactly what an older phone shows: lessons swap in their Classic alternatives, the type checker uses ES2021, and the sandbox removes the ES2022+ built-ins before learner code runs (so the Playground behaves like an old phone too).
- **Lessons**: a step that uses a newer feature is marked `runtime: 'modern'` and has a `classic` alternative teaching the same idea (see `docs/authoring.md`). Progress, practice cards and badges are identical in both modes. The content check enforces all of this at build time.
- **Learner code**: on Classic, using `items.at(-1)` gives a plain explanation ("newer JavaScript than this device mode runs… the classic way: `items[items.length - 1]`") instead of a bare `TypeError`.
- **Testing**: `playwright/engine.spec.ts` runs in both modes (Classic forced through Settings). When testing on a real old device, confirm the Settings card says "This device runs classic JavaScript" and that Module 3's first lesson shows "Classic version for this device" on its `.at()` step.

## 4. Persistence and upgrades

Progress lives in `localStorage` under `ts-companion.state`, with a schema version and a migration function. A WebView keeps it across restarts and backgrounding, but Android may clear storage under extreme storage pressure, and clearing app data removes it.

The app writes on every step change through a 400 ms debounce, so a kill mid-lesson loses at most a few seconds.

If you need stronger guarantees, implement the existing `StorageAdapter` (`get`, `set`, `remove`) on top of `@capacitor/preferences` and swap the adapter in `src/storage/store.ts`. No feature code touches `localStorage` directly. Keep export/import working either way.

## 5. Offline inside the shell

Do **not** register the web service worker in Capacitor. `registerServiceWorker()` already skips the native shell: the assets are packaged locally, so a worker only introduces stale-cache bugs after an app update.

The `dist/` bundle is self-contained. The strict CSP remains in the HTML. If a future native plugin needs to inject a script or connect to a local bridge, prefer widening nothing: the plugins used above (status bar, splash, filesystem, share) do not require loosening `connect-src`.

## 6. Verification checklist before shipping the APK

```powershell
npm run build          # includes check:android
npm run test
npx cap sync android
npx cap open android
```

On a real device (or an emulator with the network disabled):

- First launch reaches onboarding; pick a mode and finish a lesson.
- Kill the app from Recents, reopen: the lesson and progress are still there.
- Hardware back walks back through lessons; at the map it explains before exiting.
- Rotate to landscape: the editor, the lesson footer (Next), and the bottom navigation outside lessons remain reachable.
- Open a code exercise and type with the on-screen keyboard: the symbol bar sits on top of the keyboard, its keys type at the cursor, and the keyboard stays open.
- Play a Studio game (Module 7) and open Practice from Home once a step is due; both work with airplane mode on.
- Export progress: "Save a file" produces a file in Downloads, or, if it does not, "Copy progress" or "Share…" gets the progress off the device. Import the file on a second device to confirm it restores.
- With airplane mode on, open the playground and run a snippet. If the wasm compiler is blocked by the device's WebView, the UI must show "checks are paused" rather than freeze.
- Check the status bar area in dark mode; there should be no white strip.
- On the oldest supported phone (WebView 90–109), Settings → Device engine reads "classic JavaScript", and a lesson with a "Newer phones" step shows its Classic version and grades it.

/**
 * The only module allowed to touch `window`, `navigator`, `document`, history
 * and speech. Everything is feature-detected so the app degrades instead of
 * breaking — which matters a lot once this runs inside an Android WebView.
 */

import type { Engine } from '../content/schema';
import type { EngineSetting, Settings } from '../storage/types';

export function isNativeShell(): boolean {
  const candidate = window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } };
  return Boolean(candidate.Capacitor?.isNativePlatform?.());
}

/* -------------------------------- motion -------------------------------- */

export function prefersReducedMotion(): boolean {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

export function shouldAnimate(setting: Settings['reduceMotion']): boolean {
  if (setting === 'on') return false;
  if (setting === 'off') return true;
  return !prefersReducedMotion();
}

/* ------------------------------ appearance ------------------------------ */

export function applyAppearance(settings: Settings): void {
  const root = document.documentElement;

  if (settings.theme === 'auto') root.removeAttribute('data-theme');
  else root.dataset['theme'] = settings.theme;

  root.dataset['textSize'] = String(settings.textSize);
  root.dataset['font'] = settings.font;
  root.dataset['motion'] = shouldAnimate(settings.reduceMotion) ? 'full' : 'reduced';

  const light = '#f6f1e7';
  const dark = '#171a26';
  const darkActive =
    settings.theme === 'dark' ||
    (settings.theme === 'auto' && (window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false));
  // The shell colour follows the effective theme so Android shows no white flash.
  for (const meta of document.querySelectorAll('meta[name="theme-color"]')) {
    meta.setAttribute('content', darkActive ? dark : light);
  }
}

/** `<html lang dir>` for the language on screen: screen readers, hyphenation and text direction follow it. */
export function applyLanguage(code: string, dir: 'ltr' | 'rtl'): void {
  const root = document.documentElement;
  root.lang = code;
  root.dir = dir;
}

/** The device's preferred languages, most preferred first. */
export function deviceLanguages(): readonly string[] {
  const list = navigator.languages?.length ? navigator.languages : [navigator.language];
  return list.filter((item): item is string => typeof item === 'string' && item.length > 0);
}

/** Re-render appearance when the OS theme flips, without a reload. */
export function watchSystemTheme(onChange: () => void): () => void {
  const query = window.matchMedia?.('(prefers-color-scheme: dark)');
  if (!query) return () => undefined;
  const listener = () => onChange();
  query.addEventListener('change', listener);
  return () => query.removeEventListener('change', listener);
}

/* -------------------------------- speech -------------------------------- */

/**
 * Speech needs both halves: the `speechSynthesis` service *and* the
 * `SpeechSynthesisUtterance` constructor. Some Android WebViews expose the
 * first without the second, and the read-aloud button used to throw there.
 */
export function supportsSpeech(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.speechSynthesis?.speak === 'function' &&
    typeof window.SpeechSynthesisUtterance === 'function'
  );
}

/**
 * The best installed voice for a list of languages, most wanted first (for
 * example Luxembourgish, then German, then French). Null when none matches;
 * speech then uses the device default.
 */
export function voiceFor(languages: readonly string[]): { lang: string; voice: SpeechSynthesisVoice } | null {
  if (!supportsSpeech()) return null;
  let voices: SpeechSynthesisVoice[] = [];
  try {
    voices = window.speechSynthesis.getVoices();
  } catch {
    return null;
  }
  for (const wanted of languages) {
    const lower = wanted.toLowerCase();
    const base = lower.split('-')[0] ?? lower;
    const exact = voices.find((voice) => voice.lang.toLowerCase().replace('_', '-') === lower);
    const sameBase = voices.find((voice) => voice.lang.toLowerCase().replace('_', '-').split('-')[0] === base);
    const found = exact ?? sameBase;
    if (found) return { lang: wanted, voice: found };
  }
  return null;
}

/**
 * Reads `text` aloud. Returns false when speech could not start, so the caller
 * can reset its "Stop" button. `onEnd` runs when speech finishes *or fails*.
 * `languages` picks the voice (see `voiceFor`).
 */
export function speak(text: string, onEnd?: () => void, languages: readonly string[] = []): boolean {
  if (!supportsSpeech()) return false;
  try {
    const synth = window.speechSynthesis;
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const chosen = voiceFor(languages);
    if (chosen) {
      utterance.voice = chosen.voice;
      utterance.lang = chosen.voice.lang;
    } else if (languages[0]) {
      utterance.lang = languages[0];
    }
    utterance.rate = 0.95;
    utterance.pitch = 1;
    if (onEnd) {
      utterance.addEventListener('end', onEnd);
      utterance.addEventListener('error', onEnd);
    }
    synth.speak(utterance);
    return true;
  } catch {
    return false;
  }
}

export function stopSpeaking(): void {
  if (!supportsSpeech()) return;
  try {
    window.speechSynthesis.cancel();
  } catch {
    // Nothing is playing that we could stop; nothing to do.
  }
}

/* -------------------------------- sound --------------------------------- */

export type SoundKind = 'correct' | 'retry' | 'complete' | 'celebrate';

/** Notes as [frequency in Hz, start in seconds, length in seconds]. */
const TUNES: Record<SoundKind, readonly (readonly [number, number, number])[]> = {
  // Two rising notes: a small "yes".
  correct: [
    [659.25, 0, 0.12],
    [987.77, 0.09, 0.18],
  ],
  // One soft, low note: "have another look", never a buzzer.
  retry: [[329.63, 0, 0.16]],
  // A bright arpeggio for a finished lesson.
  complete: [
    [523.25, 0, 0.14],
    [659.25, 0.11, 0.14],
    [783.99, 0.22, 0.14],
    [1046.5, 0.33, 0.3],
  ],
  // A sparkle for a badge, a level or a goal.
  celebrate: [
    [880, 0, 0.1],
    [1174.66, 0.07, 0.1],
    [1567.98, 0.14, 0.22],
  ],
};

type AudioContextConstructor = new () => AudioContext;
let audio: AudioContext | null = null;

export function supportsSound(): boolean {
  const candidate = window as unknown as { AudioContext?: AudioContextConstructor; webkitAudioContext?: AudioContextConstructor };
  return typeof (candidate.AudioContext ?? candidate.webkitAudioContext) === 'function';
}

/**
 * A short tone, made on the device (no audio files, nothing downloaded).
 * Quiet and brief on purpose. Call from a user action: browsers only allow
 * sound after one. Any failure is silent: sound is never essential.
 */
export function playSound(kind: SoundKind): void {
  try {
    const candidate = window as unknown as { AudioContext?: AudioContextConstructor; webkitAudioContext?: AudioContextConstructor };
    const Context = candidate.AudioContext ?? candidate.webkitAudioContext;
    if (!Context) return;
    audio ??= new Context();
    if (audio.state === 'suspended') void audio.resume();
    const start = audio.currentTime + 0.01;
    for (const [frequency, offset, length] of TUNES[kind]) {
      const oscillator = audio.createOscillator();
      const gain = audio.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = frequency;
      const at = start + offset;
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.exponentialRampToValueAtTime(0.12, at + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + length);
      oscillator.connect(gain).connect(audio.destination);
      oscillator.start(at);
      oscillator.stop(at + length + 0.02);
    }
  } catch {
    // No sound is fine.
  }
}

/* ------------------------------- clipboard ------------------------------ */

export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fall through to the legacy path.
  }

  try {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(area);
    return ok;
  } catch {
    return false;
  }
}

/**
 * Ask the browser to download a text file. Returns false if that could not
 * even be started. A true result only means the download was *requested*:
 * some Android WebViews silently ignore `<a download>`, and no browser says
 * whether a file was written. Callers must word their message accordingly and
 * always offer another way (copy, share).
 */
export function requestDownload(filename: string, text: string, type = 'application/json'): boolean {
  try {
    const blob = new Blob([text], { type });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.rel = 'noopener';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    return true;
  } catch {
    return false;
  }
}

function fileFor(filename: string, text: string, type: string): File | null {
  try {
    return new File([text], filename, { type });
  } catch {
    return null;
  }
}

/** True when this device can hand a file to another app (the Android share sheet). */
export function canShareFile(filename: string, text: string, type = 'application/json'): boolean {
  const file = fileFor(filename, text, type);
  try {
    return Boolean(file && typeof navigator.share === 'function' && navigator.canShare?.({ files: [file] }));
  } catch {
    return false;
  }
}

/** Opens the system share sheet with the file. */
export async function shareFile(
  filename: string,
  text: string,
  type = 'application/json',
): Promise<'shared' | 'cancelled' | 'failed'> {
  const file = fileFor(filename, text, type);
  if (!file || typeof navigator.share !== 'function') return 'failed';
  try {
    await navigator.share({ files: [file], title: filename });
    return 'shared';
  } catch (error) {
    return error instanceof DOMException && error.name === 'AbortError' ? 'cancelled' : 'failed';
  }
}

/* ------------------------------ connectivity ---------------------------- */

export function watchConnectivity(onChange: (online: boolean) => void): () => void {
  const update = () => onChange(navigator.onLine !== false);
  window.addEventListener('online', update);
  window.addEventListener('offline', update);
  return () => {
    window.removeEventListener('online', update);
    window.removeEventListener('offline', update);
  };
}

export function isOnline(): boolean {
  return navigator.onLine !== false;
}

/* ------------------------------- lifecycle ------------------------------ */

/** A full reload. Safe for progress: saved state is read before any screen renders. */
export function reloadApp(): void {
  window.location.reload();
}

/** Route to the journey map outside React Router (for the last-resort error screen). */
export function goHomeWithoutRouter(): void {
  window.location.hash = '#/';
}

/**
 * Browser noise that is not a failure: ResizeObserver reports this when a
 * layout change (the code editor resizing) takes more than one frame.
 */
const BENIGN_ERRORS = [/ResizeObserver loop/i];

/** Errors an error boundary has already shown to the learner. */
const handledErrors = new WeakSet<object>();

/** Called by error boundaries, so the same error is not also reported as uncaught. */
export function markErrorHandled(error: unknown): void {
  if (typeof error === 'object' && error !== null) handledErrors.add(error);
}

/**
 * Reports errors nothing else caught: exceptions thrown in event handlers or
 * timers, and promise rejections nobody handled. Render errors are handled by
 * error boundaries instead — in development builds React also re-dispatches
 * those to `window`, before the boundary has caught them, so reporting waits a
 * moment and skips errors a boundary marked as handled.
 */
export function watchUncaughtErrors(onError: (error: unknown) => void): () => void {
  const report = (error: unknown) => {
    setTimeout(() => {
      if (typeof error === 'object' && error !== null && handledErrors.has(error)) return;
      onError(error);
    }, 0);
  };
  const onErrorEvent = (event: ErrorEvent) => {
    if (BENIGN_ERRORS.some((pattern) => pattern.test(event.message ?? ''))) return;
    report(event.error ?? event.message);
  };
  const onRejection = (event: PromiseRejectionEvent) => {
    report(event.reason);
  };
  window.addEventListener('error', onErrorEvent);
  window.addEventListener('unhandledrejection', onRejection);
  return () => {
    window.removeEventListener('error', onErrorEvent);
    window.removeEventListener('unhandledrejection', onRejection);
  };
}

/**
 * Runs `callback` when the page is being hidden: tab switch, app sent to the
 * background, reload, or close. On Android this is the last reliable moment
 * before the system may kill the WebView, so pending saves must happen here.
 * Both events are used because browsers differ in which one they deliver.
 */
export function onPageHidden(callback: () => void): () => void {
  const onVisibility = () => {
    if (document.visibilityState === 'hidden') callback();
  };
  window.addEventListener('pagehide', callback);
  document.addEventListener('visibilitychange', onVisibility);
  return () => {
    window.removeEventListener('pagehide', callback);
    document.removeEventListener('visibilitychange', onVisibility);
  };
}

/* --------------------------------- back --------------------------------- */

/**
 * Android's back gesture arrives as a browser `popstate`. Hash routing already
 * turns that into real navigation, so the only extra job is to avoid leaving
 * the app by surprise from the journey map.
 *
 * When the app starts on the journey map, one "sentinel" history entry is
 * pushed on top of it:
 *
 *   [journey map] [sentinel: also the journey map] [lesson] ...
 *
 * - Back onto the sentinel (e.g. from a lesson) is just "back to the map":
 *   nothing to say.
 * - Back from the sentinel to the real first entry is the press that would
 *   otherwise have left the app: show the hint once.
 * - The next back leaves. The sentinel is never pushed again; the old guard
 *   re-armed itself, showed the hint after an ordinary "back to the map", and
 *   took about four presses to exit.
 */
export function installBackGuard(atRoot: () => void): () => void {
  const SENTINEL = 'tsCompanionSentinel';
  const isSentinel = (state: unknown) =>
    typeof state === 'object' && state !== null && (state as Record<string, unknown>)[SENTINEL] === true;
  const atHome = () => {
    const hash = window.location.hash;
    return hash === '' || hash === '#' || hash === '#/';
  };

  /** True while the learner is on (or was last on) the sentinel entry. */
  let onSentinel = isSentinel(window.history.state);
  if (!onSentinel && atHome()) {
    window.history.pushState({ [SENTINEL]: true }, '');
    onSentinel = true;
  }

  const onPop = () => {
    const cameFromSentinel = onSentinel;
    onSentinel = isSentinel(window.history.state);
    if (!onSentinel && cameFromSentinel && atHome()) atRoot();
  };

  window.addEventListener('popstate', onPop);
  return () => {
    window.removeEventListener('popstate', onPop);
  };
}

/* ------------------------------ safe areas ------------------------------ */

/** Reads the CSS env() safe-area insets into custom properties once at boot. */
export function measureSafeAreas(): void {
  const probe = document.createElement('div');
  probe.style.cssText =
    'position:fixed;top:0;left:0;width:0;height:0;visibility:hidden;' +
    'padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);';
  document.body.appendChild(probe);
  const style = getComputedStyle(probe);
  const root = document.documentElement;
  root.style.setProperty('--safe-top', style.paddingTop || '0px');
  root.style.setProperty('--safe-right', style.paddingRight || '0px');
  root.style.setProperty('--safe-bottom', style.paddingBottom || '0px');
  root.style.setProperty('--safe-left', style.paddingLeft || '0px');
  probe.remove();
}

/**
 * Which JavaScript this device runs (see docs/android.md). Modern engines
 * (WebView / Chrome 110 and later) have every ES2022 and ES2023 feature the
 * lessons use; anything missing one of them counts as Classic. The app shell
 * itself needs none of these, so it runs the same on both.
 */
export function detectEngine(): Engine {
  try {
    const array = Array.prototype as unknown as Record<string, unknown>;
    const modern =
      typeof array.at === 'function' &&
      typeof array.findLast === 'function' &&
      typeof array.toSorted === 'function' &&
      typeof array.with === 'function' &&
      typeof (Object as unknown as Record<string, unknown>).hasOwn === 'function' &&
      typeof (globalThis as Record<string, unknown>).structuredClone === 'function';
    return modern ? 'modern' : 'classic';
  } catch {
    return 'classic';
  }
}

/**
 * The engine lessons are shown and graded for: the learner's choice, except
 * that a Classic device can never be treated as Modern (its engine could not
 * run the code).
 */
export function effectiveEngine(setting: EngineSetting, detected: Engine = detectEngine()): Engine {
  if (setting === 'classic' || detected === 'classic') return 'classic';
  return 'modern';
}

import { afterEach, describe, expect, it, vi } from 'vitest';
import { speak, stopSpeaking, supportsSpeech } from '../src/platform/capabilities';
import { runInSandbox } from '../src/runner/sandbox';

type SpeechWindow = {
  speechSynthesis?: unknown;
  SpeechSynthesisUtterance?: unknown;
};

class FakeUtterance extends EventTarget {
  rate = 1;
  pitch = 1;
  constructor(public text: string) {
    super();
  }
}

function installSpeech(synth: { speak: (u: FakeUtterance) => void; cancel: () => void }, withUtterance = true) {
  const target = window as unknown as SpeechWindow;
  target.speechSynthesis = synth;
  if (withUtterance) target.SpeechSynthesisUtterance = FakeUtterance;
  else delete target.SpeechSynthesisUtterance;
}

describe('speech', () => {
  afterEach(() => {
    const target = window as unknown as SpeechWindow;
    delete target.speechSynthesis;
    delete target.SpeechSynthesisUtterance;
  });

  it('is unsupported when the WebView has speechSynthesis but no SpeechSynthesisUtterance', () => {
    installSpeech({ speak: vi.fn(), cancel: vi.fn() }, false);
    expect(supportsSpeech()).toBe(false);
    expect(speak('hello')).toBe(false);
  });

  it('speaks when both halves exist, and reports the end', () => {
    let spoken: FakeUtterance | undefined;
    installSpeech({ speak: (u) => (spoken = u), cancel: vi.fn() });
    const onEnd = vi.fn();

    expect(speak('hello', onEnd)).toBe(true);
    spoken?.dispatchEvent(new Event('end'));
    expect(onEnd).toHaveBeenCalledTimes(1);
  });

  it('treats a speech error like the end, so the Stop button resets', () => {
    let spoken: FakeUtterance | undefined;
    installSpeech({ speak: (u) => (spoken = u), cancel: vi.fn() });
    const onEnd = vi.fn();

    speak('hello', onEnd);
    spoken?.dispatchEvent(new Event('error'));
    expect(onEnd).toHaveBeenCalledTimes(1);
  });

  it('returns false instead of throwing when the engine throws', () => {
    installSpeech({
      speak: () => {
        throw new Error('engine unavailable');
      },
      cancel: () => {
        throw new Error('engine unavailable');
      },
    });
    expect(speak('hello')).toBe(false);
    expect(() => stopSpeaking()).not.toThrow();
  });
});

describe('sandbox error reporting', () => {
  const blobUrls = URL as unknown as { createObjectURL?: unknown; revokeObjectURL?: unknown };

  afterEach(() => {
    vi.unstubAllGlobals();
    delete blobUrls.createObjectURL;
    delete blobUrls.revokeObjectURL;
  });

  it("marks the learner's runtime error as handled, so it is not an uncaught app error", async () => {
    const preventDefault = vi.fn();
    class FakeWorker {
      onmessage: ((event: MessageEvent) => void) | null = null;
      onerror: ((event: ErrorEvent) => void) | null = null;
      constructor() {
        queueMicrotask(() =>
          this.onerror?.({ message: "Uncaught SyntaxError: Unexpected token 'export'", preventDefault } as unknown as ErrorEvent),
        );
      }
      terminate() {}
    }
    vi.stubGlobal('Worker', FakeWorker);
    // jsdom has no blob URLs; the sandbox only needs a string back.
    blobUrls.createObjectURL = () => 'blob:x';
    blobUrls.revokeObjectURL = () => undefined;

    const outcome = await runInSandbox('export const x = 1;', [], 2000);

    expect(outcome.loadError).toContain('Unexpected token');
    expect(preventDefault).toHaveBeenCalledTimes(1);
  });
});

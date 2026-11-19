import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll } from 'vitest';
import { MODULE_LOADERS, loadModule } from '../src/content/loader';

afterEach(() => {
  cleanup();
});

// Lesson content loads per module (content/loader.ts). Render tests assume a
// warm cache, as after a lesson has been opened once, so they can interact
// straight away; tests/contentLoading.test.ts covers the cold path.
beforeAll(async () => {
  await Promise.all(Object.keys(MODULE_LOADERS).map((moduleId) => loadModule(moduleId, 'en')));
});

// jsdom (25) has no Blob.prototype.text(), which every browser the app
// targets supports (Chrome 76+). Provide it for tests through FileReader.
if (typeof Blob !== 'undefined' && typeof Blob.prototype.text !== 'function') {
  Blob.prototype.text = function text(this: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsText(this);
    });
  };
}

// jsdom has no layout, so Range has no client rects. CodeMirror measures the
// cursor with them after an edit; an empty answer is what a hidden editor gives.
if (typeof Range !== 'undefined' && typeof Range.prototype.getClientRects !== 'function') {
  const empty = { x: 0, y: 0, width: 0, height: 0, top: 0, right: 0, bottom: 0, left: 0, toJSON: () => ({}) };
  Range.prototype.getClientRects = function getClientRects() {
    return Object.assign([], { item: () => null }) as unknown as DOMRectList;
  };
  Range.prototype.getBoundingClientRect = function getBoundingClientRect() {
    return empty as DOMRect;
  };
}

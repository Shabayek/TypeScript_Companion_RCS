// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { CHEATSHEET } from '../src/content/cheatsheet';
import { DECODER } from '../src/content/decoder';
import { applyCheatsheetOverlay, applyDecoderOverlay } from '../src/content/overlay';
import { cheatsheetIn, decoderIn } from '../src/content/reference';
import { hasLessonTranslations, loadCourseText, loadModuleOverlay } from '../src/content/courseText';
import { checkCheatsheetOverlay, checkDecoderOverlay, translationCoverage } from '../scripts/validateTranslations';
import { decode, encode } from '../scripts/i18n/units';

const firstSection = CHEATSHEET[0]!;
const firstEntry = DECODER[0]!;

describe('reference pages in another language', () => {
  it('translates cheatsheet titles and notes, never the code', () => {
    const translated = applyCheatsheetOverlay(CHEATSHEET, {
      [firstSection.id]: { title: 'Titre', entries: [{ title: 'Entrée' }] },
    });
    expect(translated[0]?.title).toBe('Titre');
    expect(translated[0]?.entries[0]?.title).toBe('Entrée');
    expect(translated[0]?.entries[0]?.code).toBe(firstSection.entries[0]?.code);
    // Entries and sections left out stay English.
    expect(translated[0]?.entries[1]).toBe(firstSection.entries[1]);
    expect(translated[1]).toBe(CHEATSHEET[1]);
  });

  it('translates decoder entries but keeps matching the English compiler message', async () => {
    const translated = applyDecoderOverlay(firstEntry, { [firstEntry.id]: { title: 'Titre' } });
    expect(translated).toMatchObject({ id: firstEntry.id, match: firstEntry.match, title: 'Titre', plain: firstEntry.plain });
    const french = await decoderIn('fr');
    const found = french.decode("error TS2304: Cannot find name 'totl'.");
    expect(found?.id).toBe('cannot-find-name');
    expect(found?.title).not.toBe(DECODER.find((entry) => entry.id === 'cannot-find-name')?.title);
    expect(found?.match).toBe(DECODER.find((entry) => entry.id === 'cannot-find-name')?.match);
  });

  it('falls back to English for a language without reference translations', async () => {
    expect(await cheatsheetIn('xx')).toEqual(CHEATSHEET);
    expect((await decoderIn('xx')).entries).toEqual(DECODER);
  });

  it('gives the French cheatsheet French titles', async () => {
    const french = await cheatsheetIn('fr');
    expect(french.map((section) => section.id)).toEqual(CHEATSHEET.map((section) => section.id));
    expect(french[0]?.title).toBe('Valeurs et noms');
  });

  it('reports cheatsheet and decoder translations that address nothing', () => {
    expect(checkCheatsheetOverlay('fr', { nope: { title: 'x' } })[0]?.message).toBe('no such section');
    expect(checkCheatsheetOverlay('fr', { [firstSection.id]: { entries: firstSection.entries.map(() => ({})).concat([{}]) } })[0]?.message).toBe(
      'has more entries than the section',
    );
    expect(checkDecoderOverlay('fr', { nope: { title: 'x' } })[0]?.message).toBe('no such entry');
    expect(checkDecoderOverlay('fr', { [firstEntry.id]: { fix: ' ' } })[0]?.message).toBe('is empty');
  });
});

describe('the French course', () => {
  it('has every module translated and the course text loads', async () => {
    expect(hasLessonTranslations('fr')).toBe(true);
    const text = await loadCourseText('fr');
    expect(text.course.modules?.m00?.title).toBe('Premier contact');
    expect(Object.keys(text.glossary).length).toBeGreaterThan(100);
    const overlay = await loadModuleOverlay('fr', 'm19', () => Promise.resolve([]));
    expect(overlay && Object.keys(overlay).length).toBeGreaterThan(0);
  });

  it('covers nearly all lesson prose', () => {
    const french = translationCoverage().find((coverage) => coverage.language === 'fr');
    expect(french).toBeDefined();
    expect(french!.translated / french!.total).toBeGreaterThan(0.95);
  });
});

describe('the translation kit', () => {
  it('turns a text into one worklist line and back, code blocks untouched', () => {
    const text = 'Read this:\n\n```ts\nconst a = 1;\n```\n\nThen `b`.';
    const { line, fences } = encode(text);
    expect(line).toBe('Read this:⏎⏎⟦F1⟧⏎⏎Then `b`.');
    expect(line).not.toContain('\n');
    expect(decode(line, fences)).toBe(text);
    expect(decode('Lis ceci :⏎⏎⟦F1⟧⏎⏎Puis `b`.', fences)).toBe('Lis ceci :\n\n```ts\nconst a = 1;\n```\n\nPuis `b`.');
  });
});

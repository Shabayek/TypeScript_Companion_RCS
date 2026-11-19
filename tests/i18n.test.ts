import { describe, expect, it } from 'vitest';
import { DEFAULT_LANGUAGE, LANGUAGES, isSupportedLanguage, languageInfo } from '../src/i18n/languages';
import { ENGLISH, formatNumber, translate } from '../src/i18n/messages';
import { activateLanguage, t, useI18n } from '../src/i18n/t';
import { migrate } from '../src/storage/model';
import { defaultState } from '../src/storage/types';

describe('languages', () => {
  it('starts with English as the default and knows each language’s direction', () => {
    expect(DEFAULT_LANGUAGE).toBe('en');
    expect(LANGUAGES.map((language) => language.code)).toContain('en');
    expect(languageInfo('en')).toMatchObject({ nativeName: 'English', dir: 'ltr' });
    // Unknown codes fall back to the default rather than breaking.
    expect(languageInfo('xx').code).toBe('en');
    expect(isSupportedLanguage('en')).toBe(true);
    expect(isSupportedLanguage('xx')).toBe(false);
    expect(isSupportedLanguage(42)).toBe(false);
  });
});

describe('translate', () => {
  it('fills placeholders and formats numbers for the language', () => {
    expect(translate('en', {}, 'lesson.stepOf', { current: 2, total: 7 })).toBe('Step 2 of 7');
    expect(translate('en', {}, 'lesson.minutes', { count: 1200 })).toBe('1,200 min');
    expect(formatNumber(1200, 'de')).toBe('1.200');
  });

  it('chooses plural forms with the language’s own rules', () => {
    expect(translate('en', {}, 'practice.stepsReady', { count: 1 })).toBe('1 step ready to practise');
    expect(translate('en', {}, 'practice.stepsReady', { count: 3 })).toBe('3 steps ready to practise');
  });

  it('prefers the translation and falls back to English for anything missing', () => {
    const partial = { nav: { journey: 'Reise' } };
    expect(translate('de', partial, 'nav.journey')).toBe('Reise');
    expect(translate('de', partial, 'nav.settings')).toBe(ENGLISH.nav.settings);
  });

  it('shows the key itself, never a blank, when a message does not exist', () => {
    // @ts-expect-error: a key that is not in the catalogue.
    expect(translate('en', {}, 'nav.nowhere')).toBe('nav.nowhere');
  });
});

describe('switching language', () => {
  it('falls back to English for a language this version does not ship', async () => {
    await activateLanguage('xx');
    expect(useI18n.getState().language).toBe('en');
    expect(t('nav.journey')).toBe('Journey');
  });
});

describe('the saved language setting', () => {
  it('defaults to English and survives a round trip', () => {
    expect(defaultState(1).settings.language).toBe('en');
    const saved = { ...defaultState(1), settings: { ...defaultState(1).settings, language: 'en' } };
    expect(migrate(JSON.parse(JSON.stringify(saved))).settings.language).toBe('en');
  });

  it('drops a language this version does not know, keeping every other setting', () => {
    const raw = { ...defaultState(1), settings: { ...defaultState(1).settings, language: 'tlh', mode: 'pro' } };
    const migrated = migrate(raw);
    expect(migrated.settings.language).toBe('en');
    expect(migrated.settings.mode).toBe('pro');
  });
});

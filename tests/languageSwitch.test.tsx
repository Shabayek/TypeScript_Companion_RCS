import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FULL_COURSE } from '../src/content/fullCourse';
import type { CheckStep, Lesson, PredictStep } from '../src/content/schema';
import { PSEUDO_LANGUAGE } from '../src/i18n/languages';
import { activateLanguage, useI18n } from '../src/i18n/t';
import { AppRoutes } from '../src/routes';
import { __setStateForTests, useJourney } from '../src/storage/store';
import { defaultState, type ProgressState } from '../src/storage/types';

function learner(edit: (state: ProgressState) => void = () => undefined): ProgressState {
  const state = defaultState(1);
  state.profile = { name: 'Ada', onboarded: true, createdAt: 1, experience: null };
  edit(state);
  return state;
}

let path = '';
function Where() {
  path = useLocation().pathname;
  return null;
}

function openAtStep(lesson: Lesson, stepIndex: number) {
  const position = FULL_COURSE.indexOf(lesson);
  __setStateForTests(
    learner((state) => {
      for (const before of FULL_COURSE.slice(0, position)) {
        state.lessons[before.id] = { status: 'completed', stepIndex: 0, steps: {}, timeMs: 1 };
      }
      state.lessons[lesson.id] = { status: 'started', stepIndex, steps: {}, timeMs: 1 };
    }),
  );
  return render(
    <MemoryRouter initialEntries={[`/learn/${lesson.id}`]}>
      <AppRoutes />
      <Where />
    </MemoryRouter>,
  );
}

/** What the learner does: pick a language. The shell swaps once it has loaded. */
async function switchTo(language: string) {
  act(() => useJourney.getState().patchSettings({ language }));
  await act(() => activateLanguage(language));
}

beforeEach(() => {
  window.localStorage.clear();
  vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
});

afterEach(async () => {
  await act(() => activateLanguage('en'));
});

describe('switching language keeps the learner exactly where they were', () => {
  it('the same lesson, the same step, and the answer being chosen', async () => {
    const user = userEvent.setup();
    const lesson = FULL_COURSE.find((item) => item.steps.some((step) => step.kind === 'check' && !step.multi))!;
    const index = lesson.steps.findIndex((step) => step.kind === 'check' && !step.multi);
    const step = lesson.steps[index] as CheckStep;
    openAtStep(lesson, index);

    const option = () => document.querySelectorAll<HTMLButtonElement>('button.option')[1]!;
    await user.click(option());
    expect(option()).toHaveAttribute('aria-pressed', 'true');
    const heading = document.getElementById(`step-title-${step.id}`)!;

    await switchTo(PSEUDO_LANGUAGE);
    await waitFor(() => expect(screen.getByRole('button', { name: /Çĥéçķ åñšŵéŕ/ })).toBeInTheDocument());

    // Same page, same step, same choice; the step's heading is the very same element.
    expect(path).toBe(`/learn/${lesson.id}`);
    expect(screen.getByText(new RegExp(`Šţéþ ${index + 1} öƒ ${lesson.steps.length}`))).toBeInTheDocument();
    expect(option()).toHaveAttribute('aria-pressed', 'true');
    expect(document.getElementById(`step-title-${step.id}`)).toBe(heading);
    // The lesson's own words changed language too.
    expect(heading.textContent).toMatch(/⟦/);

    // And back: still there.
    await switchTo('en');
    await waitFor(() => expect(screen.getByRole('button', { name: 'Check answer' })).toBeInTheDocument());
    expect(option()).toHaveAttribute('aria-pressed', 'true');
    expect(useJourney.getState().state.lessons[lesson.id]?.stepIndex).toBe(index);
  });

  it('keeps a half-typed prediction', async () => {
    const user = userEvent.setup();
    const lesson = FULL_COURSE.find((item) => item.steps.some((step) => step.kind === 'predict'))!;
    const index = lesson.steps.findIndex((step) => step.kind === 'predict');
    const step = lesson.steps[index] as PredictStep;
    openAtStep(lesson, index);
    const box = document.getElementById(`predict-${step.id}`) as HTMLTextAreaElement;
    await user.type(box, 'half an ans');

    await switchTo(PSEUDO_LANGUAGE);
    await waitFor(() => expect(screen.getByText(/Ŵĥåţ ŵîļļ ţĥîš þŕîñţ/)).toBeInTheDocument());
    expect(document.getElementById(`predict-${step.id}`)).toBe(box);
    expect(box.value).toBe('half an ans');
  });

  it('re-words a result already on screen', async () => {
    const user = userEvent.setup();
    const lesson = FULL_COURSE.find((item) => item.steps.some((step) => step.kind === 'check' && !step.multi))!;
    const index = lesson.steps.findIndex((step) => step.kind === 'check' && !step.multi);
    const step = lesson.steps[index] as CheckStep;
    openAtStep(lesson, index);
    const correct = step.choices.findIndex((choice) => choice.correct);
    await user.click(document.querySelectorAll<HTMLButtonElement>('button.option')[correct]!);
    await user.click(screen.getByRole('button', { name: 'Check answer' }));
    expect(screen.getByText('That’s right')).toBeInTheDocument();

    await switchTo(PSEUDO_LANGUAGE);
    await waitFor(() => expect(screen.getByText(/Ţĥåţ’š ŕîğĥţ/)).toBeInTheDocument());
    // The answer is still recorded once, as solved.
    expect(useJourney.getState().state.lessons[lesson.id]?.steps[step.id]).toMatchObject({ solved: true, attempts: 1 });
  });

  it('changes nothing in saved progress except the language', async () => {
    const lesson = FULL_COURSE[3]!;
    openAtStep(lesson, 1);
    await waitFor(() => expect(screen.getByText(`Step 2 of ${lesson.steps.length}`)).toBeInTheDocument());
    const before = useJourney.getState().state;
    await switchTo(PSEUDO_LANGUAGE);
    const after = useJourney.getState().state;
    expect({ ...after, settings: { ...after.settings, language: 'en' } }).toEqual({
      ...before,
      settings: { ...before.settings, language: 'en' },
    });
  });
});

describe('the page follows the language', () => {
  it('sets <html lang dir>, right to left for Arabic, with code kept left to right', async () => {
    const lesson = FULL_COURSE.find((item) => item.steps.some((step) => step.kind === 'predict'))!;
    openAtStep(lesson, lesson.steps.findIndex((step) => step.kind === 'predict'));
    await switchTo('ar');
    await waitFor(() => expect(document.documentElement.dir).toBe('rtl'));
    expect(document.documentElement.lang).toBe('ar');
    expect(useI18n.getState().language).toBe('ar');
    for (const pre of document.querySelectorAll('pre')) expect(pre).toHaveAttribute('dir', 'ltr');
    await switchTo('en');
    await waitFor(() => expect(document.documentElement.dir).toBe('ltr'));
  });

  it('marks English lesson text as English inside the Arabic screen, and isolates English titles in Arabic sentences', async () => {
    const lesson = FULL_COURSE.find((item) => item.steps.some((step) => step.kind === 'predict'))!;
    const index = lesson.steps.findIndex((step) => step.kind === 'predict');
    openAtStep(lesson, index);
    const prompt = () => document.querySelector(`#step-title-${lesson.steps[index]!.id} span`)!;
    // In English, lesson text needs no marking.
    expect(prompt()).not.toHaveAttribute('lang');
    await switchTo('ar');
    await waitFor(() => expect(prompt()).toHaveAttribute('lang', 'en'));
    expect(prompt()).toHaveAttribute('dir', 'ltr');
    // Screen text stays Arabic; an English title inside it is isolated.
    const { t } = await import('../src/i18n/t');
    expect(t('journey.opensAfter', { title: 'What is a program?' })).toContain('\u2068What is a program?\u2069');
    await switchTo('en');
    await waitFor(() => expect(prompt()).not.toHaveAttribute('lang'));
    expect(t('journey.opensAfter', { title: 'What is a program?' })).not.toContain('\u2068');
  });

  it('offers every language by its own name, and marks previews', () => {
    __setStateForTests(learner());
    render(
      <MemoryRouter initialEntries={['/settings']}>
        <AppRoutes />
      </MemoryRouter>,
    );
    const picker = screen.getByRole('radiogroup', { name: 'Language' });
    for (const name of ['English', 'Français', 'Deutsch', 'Lëtzebuergesch', 'Italiano', 'Português (Portugal)', 'العربية']) {
      expect(within(picker).getByRole('radio', { name: new RegExp(`^${name.replace(/[()]/g, '\\$&')}`) })).toBeInTheDocument();
    }
    expect(within(picker).getByRole('radio', { name: /Deutsch.*Preview translation/ })).toBeInTheDocument();
    expect(within(picker).getByRole('radio', { name: /^English/ })).toHaveAttribute('aria-checked', 'true');
  });
});

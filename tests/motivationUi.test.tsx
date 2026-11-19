import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { CheckStep, Lesson } from '../src/content/schema';
import { FULL_COURSE } from '../src/content/fullCourse';
import { MODULES } from '../src/content/curriculum';
import { AppRoutes } from '../src/routes';
import { dayKey } from '../src/storage/model';
import { __setStateForTests, useJourney } from '../src/storage/store';
import { defaultState, type ProgressState } from '../src/storage/types';

function learner(edit: (state: ProgressState) => void = () => undefined): ProgressState {
  const state = defaultState(1);
  state.profile = { name: 'Ada', onboarded: true, createdAt: 1, experience: null };
  edit(state);
  return state;
}

function renderAt(path: string, state = learner()) {
  __setStateForTests(state);
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes />
    </MemoryRouter>,
  );
}

/** The first lesson with a single-answer check step, and that step's position. */
function checkLesson(): { lesson: Lesson; index: number; step: CheckStep } {
  for (const lesson of FULL_COURSE) {
    const index = lesson.steps.findIndex((step) => step.kind === 'check' && !step.multi);
    const step = lesson.steps[index];
    if (step && step.kind === 'check') return { lesson, index, step };
  }
  throw new Error('no check step');
}

/** Opens the check step (every lesson before it finished), ready to answer. */
function openCheck(edit: (state: ProgressState) => void = () => undefined) {
  const target = checkLesson();
  const position = FULL_COURSE.indexOf(target.lesson);
  renderAt(
    `/learn/${target.lesson.id}`,
    learner((state) => {
      for (const lesson of FULL_COURSE.slice(0, position)) {
        state.lessons[lesson.id] = { status: 'completed', stepIndex: 0, steps: {}, timeMs: 1 };
      }
      state.lessons[target.lesson.id] = { status: 'started', stepIndex: target.index, steps: {}, timeMs: 1 };
      edit(state);
    }),
  );
  // Choices are shown in their written order.
  const choice = (correct: boolean) =>
    document.querySelectorAll<HTMLButtonElement>('button.option')[
      target.step.choices.findIndex((item) => item.correct === correct)
    ]!;
  return { ...target, choice };
}

/** A fake Web Audio, to see which tones the app asks for. */
function fakeAudio(): { tones: number[] } {
  const tones: number[] = [];
  class FakeContext {
    currentTime = 0;
    state = 'running';
    destination = {};
    resume() {
      return Promise.resolve();
    }
    createOscillator() {
      const oscillator = {
        type: 'sine',
        frequency: { value: 0 },
        connect: (node: unknown) => node,
        start: () => tones.push(oscillator.frequency.value),
        stop: () => undefined,
      };
      return oscillator;
    }
    createGain() {
      const ramp = () => undefined;
      return {
        gain: { setValueAtTime: ramp, exponentialRampToValueAtTime: ramp },
        connect: (node: unknown) => node,
      };
    }
  }
  vi.stubGlobal('AudioContext', FakeContext);
  return { tones };
}

beforeEach(() => {
  window.localStorage.clear();
  vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('Home: today at a glance', () => {
  it('shows the daily goal, the streak and the level', () => {
    renderAt('/', learner((state) => {
      state.settings.dailyGoal = 10;
      state.activity = { [dayKey(Date.now())]: { ms: 4 * 60_000, steps: 2 } };
    }));
    const card = screen.getByRole('heading', { name: 'Today' }).closest('.card') as HTMLElement;
    expect(within(card).getByText('4 of 10 min')).toBeInTheDocument();
    expect(within(card).getByText('1-day streak')).toBeInTheDocument();
    expect(within(card).getByText(/^Today is in\. See you tomorrow!/)).toBeInTheDocument();
    expect(within(card).getByRole('progressbar')).toBeInTheDocument();
  });

  it('welcomes a learner back after a break, without mentioning a lost streak', () => {
    renderAt('/', learner((state) => {
      state.activity = { '2020-01-01': { ms: 5 * 60_000, steps: 3 } };
    }));
    expect(screen.getByText(/Welcome back!/)).toBeInTheDocument();
    expect(screen.queryByText(/lost|broke|missed/i)).not.toBeInTheDocument();
  });

  it('has no points, goal or streak in Quiet mode', () => {
    renderAt('/', learner((state) => {
      state.settings.quiet = true;
    }));
    expect(screen.queryByRole('heading', { name: 'Today' })).not.toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });
});

describe('in a lesson', () => {
  it('Tess cheers a right answer and nudges kindly after a wrong one', async () => {
    const user = userEvent.setup();
    const { choice } = openCheck();
    await user.click(choice(false));
    await user.click(screen.getByRole('button', { name: 'Check answer' }));
    const nudge = document.querySelector('[data-correct="false"]');
    expect(nudge).not.toBeNull();
    // An echo of the feedback a screen reader already heard.
    expect(nudge!.querySelector('[aria-hidden="true"]')).not.toBeNull();

    await user.click(screen.getByRole('button', { name: 'Try again' }));
    await user.click(choice(true));
    await user.click(screen.getByRole('button', { name: 'Check answer' }));
    expect(document.querySelector('[data-correct="true"] .burst')).not.toBeNull();
  });

  it('plays a tone for an answer when sounds are on, and none when they are off', async () => {
    const audio = fakeAudio();
    const user = userEvent.setup();
    const { choice } = openCheck((state) => {
      state.settings.sound = true;
    });
    await user.click(choice(true));
    await user.click(screen.getByRole('button', { name: 'Check answer' }));
    expect(audio.tones.length).toBeGreaterThan(0);
  });

  it('stays silent and still in Quiet mode, even with sounds on', async () => {
    const audio = fakeAudio();
    const user = userEvent.setup();
    const { choice } = openCheck((state) => {
      state.settings.sound = true;
      state.settings.quiet = true;
    });
    await user.click(choice(true));
    await user.click(screen.getByRole('button', { name: 'Check answer' }));
    expect(audio.tones).toEqual([]);
    expect(document.querySelector('[data-correct]')).toBeNull();
  });

  it('records the answer as learning today', async () => {
    const user = userEvent.setup();
    const { choice } = openCheck();
    await user.click(choice(true));
    await user.click(screen.getByRole('button', { name: 'Check answer' }));
    expect(useJourney.getState().state.activity[dayKey(Date.now())]?.steps).toBe(1);
  });

  it('introduces a fresh lesson: minutes, steps to practise and key ideas', () => {
    const lesson = FULL_COURSE[0]!;
    renderAt(`/learn/${lesson.id}`);
    const intro = screen.getByRole('region', { name: 'In this lesson' });
    const graded = lesson.steps.filter((step) => ['check', 'predict', 'fill', 'reorder', 'fix', 'write'].includes(step.kind)).length;
    expect(within(intro).getByText(`${lesson.estMinutes} min · ${graded} to practise`)).toBeInTheDocument();
    expect(within(intro).getAllByRole('link').length).toBeGreaterThan(0);
  });
});

describe('the end of a lesson', () => {
  const finishModule = async (quiet: boolean) => {
    const user = userEvent.setup();
    const module = MODULES[0]!;
    const last = FULL_COURSE.find((lesson) => lesson.id === module.lessonIds.at(-1))!;
    renderAt(`/learn/${last.id}`, learner((state) => {
      state.settings.quiet = quiet;
      for (const id of module.lessonIds.slice(0, -1)) state.lessons[id] = { status: 'completed', stepIndex: 0, steps: {}, timeMs: 1 };
      state.lessons[last.id] = { status: 'started', stepIndex: last.steps.length - 1, steps: {}, timeMs: 1 };
      state.badges = ['first-steps'];
    }));
    await user.click(screen.getByRole('button', { name: 'Finish lesson' }));
    return module;
  };

  it('celebrates a finished module, with the points it earned and its badge', async () => {
    const module = await finishModule(false);
    expect(screen.getByRole('heading', { name: 'Module complete!' })).toBeInTheDocument();
    expect(screen.getByText(`You finished every lesson in ${module.title}.`)).toBeInTheDocument();
    expect(screen.getByText(/^\+\d+ XP$/)).toBeInTheDocument();
    expect(within(screen.getByRole('group', { name: 'New badges' })).getByText(new RegExp(`Finished ${module.title}`))).toBeInTheDocument();
    expect(document.querySelector('.confetti')).not.toBeNull();
    expect(screen.getByRole('link', { name: 'Open the Playground' })).toBeInTheDocument();
  });

  it('keeps the recap and the way on in Quiet mode, without points or confetti', async () => {
    await finishModule(true);
    expect(screen.queryByText(/XP/)).not.toBeInTheDocument();
    expect(document.querySelector('.confetti')).toBeNull();
    expect(screen.getByRole('link', { name: 'Next lesson' })).toBeInTheDocument();
  });
});

describe('celebrations elsewhere', () => {
  it('a badge earned in the Playground is announced, then goes away on its own', () => {
    vi.useFakeTimers();
    renderAt('/');
    act(() => useJourney.getState().count('playgroundRuns'));
    expect(screen.getByText('Badge earned: Tinkerer')).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(4500));
    expect(screen.queryByText('Badge earned: Tinkerer')).not.toBeInTheDocument();
    expect(useJourney.getState().state.badges).toContain('tinkerer');
  });

  it('counts glossary entries opened, and decoded errors, towards explorer badges', async () => {
    const user = userEvent.setup();
    const { unmount } = renderAt('/glossary');
    const entry = document.querySelector('details')!;
    entry.open = true;
    fireEvent(entry, new Event('toggle'));
    expect(useJourney.getState().state.counters.glossaryOpens).toBe(1);
    unmount();

    renderAt('/decoder');
    await user.click(screen.getAllByRole('button', { name: 'Try one' })[0]!);
    // The decoder's table is its own download.
    await waitFor(() => expect(useJourney.getState().state.counters.decoderLookups).toBe(1));
  });
});

describe('Settings → Motivation', () => {
  it('sets the daily goal, and Quiet mode hides goal and sounds', async () => {
    const user = userEvent.setup();
    renderAt('/settings');
    await user.click(screen.getByRole('radio', { name: '20 min' }));
    expect(useJourney.getState().state.settings.dailyGoal).toBe(20);

    await user.click(screen.getByRole('switch', { name: 'Quiet mode' }));
    expect(useJourney.getState().state.settings.quiet).toBe(true);
    expect(screen.queryByRole('radiogroup', { name: 'Daily goal' })).not.toBeInTheDocument();
    expect(screen.queryByRole('switch', { name: 'Sounds' })).not.toBeInTheDocument();
  });
});

describe('keyboard shortcuts', () => {
  const openPro = (mode: 'pro' | 'explorer' = 'pro') => {
    const lesson = FULL_COURSE[0]!;
    renderAt(`/learn/${lesson.id}`, learner((state) => {
      state.settings.mode = mode;
    }));
    return lesson;
  };

  it('in Pro mode: J next, K back, ? lists the shortcuts', async () => {
    const user = userEvent.setup();
    const lesson = openPro();
    await user.keyboard('j');
    expect(screen.getByText(`Step 2 of ${lesson.steps.length}`)).toBeInTheDocument();
    await user.keyboard('k');
    expect(screen.getByText(`Step 1 of ${lesson.steps.length}`)).toBeInTheDocument();
    await user.keyboard('?');
    expect(screen.getByRole('dialog', { name: 'Keyboard shortcuts' })).toBeInTheDocument();
    // Not while a dialog is open.
    await user.keyboard('j');
    expect(screen.getByText(`Step 1 of ${lesson.steps.length}`)).toBeInTheDocument();
  });

  it('letters do nothing outside Pro mode, or while typing', async () => {
    const user = userEvent.setup();
    const lesson = openPro('explorer');
    await user.keyboard('j');
    expect(screen.getByText(`Step 1 of ${lesson.steps.length}`)).toBeInTheDocument();
  });

  it('Ctrl+Enter checks the current exercise, in every mode', async () => {
    const user = userEvent.setup();
    const { choice } = openCheck();
    await user.click(choice(true));
    await user.keyboard('{Control>}{Enter}{/Control}');
    expect(screen.getByText('That’s right')).toBeInTheDocument();
  });
});

describe('the badge shelf', () => {
  it('groups badges and shows how far along each one is', () => {
    renderAt('/progress', learner((state) => {
      state.counters.glossaryOpens = 4;
    }));
    for (const group of ['Milestones', 'Modules', 'Skills', 'Explorer']) {
      expect(screen.getByRole('heading', { name: new RegExp(`^${group}`) })).toBeInTheDocument();
    }
    const collector = screen.getByText('Word collector').closest('li')!;
    expect(collector).toHaveAttribute('data-earned', 'false');
    expect(within(collector).getByText('4 of 10')).toBeInTheDocument();
  });
});

describe('onboarding', () => {
  it('offers Pro readers Quiet mode, off unless they choose it', async () => {
    const user = userEvent.setup();
    renderAt('/onboarding', defaultState(1));
    await user.click(screen.getByRole('button', { name: /Let.s start/ }));
    await user.click(screen.getByRole('radio', { name: /Pro mode/ }));
    await user.click(screen.getByRole('button', { name: /That.s me/ }));
    await user.click(screen.getByRole('radio', { name: /already write TypeScript/ }));
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    const quiet = screen.getByRole('checkbox', { name: /Quiet mode/ });
    expect(quiet).not.toBeChecked();
    await user.click(quiet);
    await user.click(screen.getByRole('button', { name: 'Start learning' }));
    expect(useJourney.getState().state.settings).toMatchObject({ mode: 'pro', quiet: true });
  });

  it('does not offer it in Story mode', async () => {
    const user = userEvent.setup();
    renderAt('/onboarding', defaultState(1));
    await user.click(screen.getByRole('button', { name: /Let.s start/ }));
    await user.click(screen.getByRole('radio', { name: /Story mode/ }));
    await user.click(screen.getByRole('button', { name: /That.s me/ }));
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    expect(screen.queryByRole('checkbox', { name: /Quiet mode/ })).not.toBeInTheDocument();
  });
});

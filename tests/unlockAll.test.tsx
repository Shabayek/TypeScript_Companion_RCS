import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ALL_LESSONS,
  MODULES,
  buildsOn,
  entryModule,
  isAheadOfPath,
  isLessonUnlocked,
  isOnPath,
  nextUpLessonId,
  recommendedStart,
  unfinishedBuildsOn,
} from '../src/content/curriculum';
import { AppRoutes } from '../src/routes';
import { migrate } from '../src/storage/model';
import { __setStateForTests, useJourney } from '../src/storage/store';
import { defaultState, type LessonProgress, type ProgressState } from '../src/storage/types';

const done = (): LessonProgress => ({ status: 'completed', stepIndex: 0, steps: {}, timeMs: 1 });
const id = (index: number) => ALL_LESSONS[index]!.id;

function learner(finished = 0, edit: (state: ProgressState) => void = () => undefined): ProgressState {
  const state = defaultState(1);
  state.profile = { name: 'Ada', onboarded: true, createdAt: 1, experience: null };
  for (let i = 0; i < finished; i += 1) state.lessons[id(i)] = done();
  edit(state);
  return state;
}

function renderAt(path: string, state: ProgressState) {
  __setStateForTests(state);
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes />
    </MemoryRouter>,
  );
}

describe('unlocking every lesson', () => {
  it('opens every lesson, and marks the ones beyond the path', () => {
    const path = learner(2);
    expect(isLessonUnlocked(id(5), path)).toBe(false);

    const open = learner(2, (state) => {
      state.settings.unlockAll = true;
    });
    for (const lesson of ALL_LESSONS) expect(isLessonUnlocked(lesson.id, open)).toBe(true);
    expect(isAheadOfPath(id(2), open)).toBe(false); // the next lesson is on the path anyway
    expect(isAheadOfPath(id(5), open)).toBe(true);
    expect(isLessonUnlocked('no-such-lesson', open)).toBe(false);
  });

  it('keeps lessons the learner worked in open after the setting is turned off again', () => {
    const state = learner(2, (draft) => {
      draft.lessons[id(9)] = { status: 'started', stepIndex: 2, steps: {}, timeMs: 1 };
      draft.lessons[id(11)] = done();
    });
    expect(state.settings.unlockAll).toBe(false);
    expect(isOnPath(id(9), state)).toBe(true);
    expect(isOnPath(id(11), state)).toBe(true);
    expect(isOnPath(id(10), state)).toBe(false);
  });

  it('is saved, and old progress without it starts on the guided path', () => {
    expect(defaultState(1).settings.unlockAll).toBe(false);
    const raw = JSON.parse(JSON.stringify(defaultState(1))) as { settings: Record<string, unknown> };
    delete raw.settings.unlockAll;
    expect(migrate(raw).settings.unlockAll).toBe(false);
    expect(migrate({ ...raw, settings: { ...raw.settings, unlockAll: true } }).settings.unlockAll).toBe(true);
    expect(migrate({ ...raw, settings: { ...raw.settings, unlockAll: 'yes' } }).settings.unlockAll).toBe(false);
  });
});

describe('what a lesson builds on', () => {
  it('is the earlier lessons of its module, nearest first; a module’s first lesson builds on the one before', () => {
    const module = MODULES[1]!;
    const third = module.lessonIds[2]!;
    expect(buildsOn(third).map((item) => item.id)).toEqual([module.lessonIds[1], module.lessonIds[0]]);
    const firstOfModule = module.lessonIds[0]!;
    expect(buildsOn(firstOfModule).map((item) => item.id)).toEqual([MODULES[0]!.lessonIds.at(-1)]);
    expect(buildsOn(id(0))).toEqual([]);
  });

  it('lists only unfinished ones, at most three', () => {
    const module = MODULES[3]!; // five lessons or more
    const last = module.lessonIds[4]!;
    const state = learner(0, (draft) => {
      draft.lessons[module.lessonIds[3]!] = done();
    });
    const unfinished = unfinishedBuildsOn(last, state);
    expect(unfinished.map((item) => item.id)).toEqual(module.lessonIds.slice(0, 3).reverse());
  });
});

describe('where to start, and what Continue opens', () => {
  it('suggests a start from the learner’s background', () => {
    expect(entryModule('new')).toBe(MODULES[0]);
    expect(entryModule(null)).toBe(MODULES[0]);
    const typesModule = MODULES.find((module) => module.entryFor?.includes('javascript'));
    expect(typesModule).toBeDefined();
    expect(recommendedStart('javascript')).toBe(typesModule!.lessonIds[0]);
    // Someone who already writes TypeScript starts at the intermediate track.
    const intermediate = MODULES.find((module) => module.entryFor?.includes('typescript'));
    expect(intermediate?.track).toBe('intermediate');
    expect(recommendedStart('typescript')).toBe(intermediate!.lessonIds[0]);
  });

  it('on the guided path, is the first unfinished lesson', () => {
    expect(nextUpLessonId(learner(3))).toBe(id(3));
  });

  it('with every lesson unlocked, resumes the last lesson, or the next unfinished one after it', () => {
    const resuming = learner(0, (state) => {
      state.settings.unlockAll = true;
      state.lastLessonId = id(20);
      state.lessons[id(20)] = { status: 'started', stepIndex: 1, steps: {}, timeMs: 1 };
    });
    expect(nextUpLessonId(resuming)).toBe(id(20));

    const finishedIt = learner(0, (state) => {
      state.settings.unlockAll = true;
      state.lastLessonId = id(20);
      state.lessons[id(20)] = done();
      state.lessons[id(21)] = done();
    });
    expect(nextUpLessonId(finishedIt)).toBe(id(22));
  });

  it('with every lesson unlocked and nothing opened, is the suggested start', () => {
    const state = learner(0, (draft) => {
      draft.settings.unlockAll = true;
      draft.profile.experience = 'javascript';
    });
    expect(nextUpLessonId(state)).toBe(recommendedStart('javascript'));
  });

  it('keeps the background through a save', () => {
    const state = learner(0, (draft) => {
      draft.profile.experience = 'typescript';
    });
    expect(migrate(JSON.parse(JSON.stringify(state))).profile.experience).toBe('typescript');
    expect(migrate({ ...state, profile: { ...state.profile, experience: 'wizard' } }).profile.experience).toBeNull();
  });
});

describe('Settings → Unlock all lessons', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
  });

  it('asks once before unlocking, and "Keep the path" changes nothing', async () => {
    const user = userEvent.setup();
    renderAt('/settings', learner());
    const toggle = screen.getByRole('switch', { name: 'Unlock all lessons' });
    expect(toggle).toHaveAttribute('aria-checked', 'false');

    await user.click(toggle);
    const dialog = screen.getByRole('dialog', { name: 'Unlock every lesson?' });
    await user.click(within(dialog).getByRole('button', { name: 'Keep the path' }));
    expect(useJourney.getState().state.settings.unlockAll).toBe(false);

    await user.click(toggle);
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Unlock all lessons' }));
    expect(useJourney.getState().state.settings.unlockAll).toBe(true);
    expect(screen.getByRole('switch', { name: 'Unlock all lessons' })).toHaveAttribute('aria-checked', 'true');
  });

  it('turns off straight away, without a question', async () => {
    const user = userEvent.setup();
    renderAt('/settings', learner(0, (state) => {
      state.settings.unlockAll = true;
    }));
    await user.click(screen.getByRole('switch', { name: 'Unlock all lessons' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(useJourney.getState().state.settings.unlockAll).toBe(false);
  });

  it('is where the locked-lesson link points, with the switch focused', () => {
    Element.prototype.scrollIntoView = vi.fn();
    renderAt('/settings#learning-path', learner());
    expect(document.activeElement).toBe(screen.getByRole('switch', { name: 'Unlock all lessons' }));
  });
});

describe('opening lessons', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
  });

  it('a locked lesson points to the setting', () => {
    renderAt(`/learn/${id(10)}`, learner(2));
    expect(screen.getByRole('heading', { name: 'This one opens after the last one' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Open Settings' })).toHaveAttribute('href', '/settings#learning-path');
  });

  it('with every lesson unlocked, a lesson ahead opens with a note about what it builds on', async () => {
    const user = userEvent.setup();
    const target = ALL_LESSONS[10]!;
    renderAt(`/learn/${target.id}`, learner(2, (state) => {
      state.settings.unlockAll = true;
    }));
    expect(screen.getByRole('heading', { level: 1, name: target.title.explorer })).toBeInTheDocument();
    const note = screen.getByText('This lesson builds on').closest<HTMLElement>('[role="note"]')!;
    expect(note).not.toBeNull();
    const expected = unfinishedBuildsOn(target.id, useJourney.getState().state);
    expect(expected.length).toBeGreaterThan(0);
    for (const item of expected) {
      expect(within(note).getByRole('link', { name: item.title.explorer })).toHaveAttribute('href', `/learn/${item.id}`);
    }

    await user.click(within(note).getByRole('button', { name: 'Continue anyway' }));
    expect(screen.queryByText('This lesson builds on')).not.toBeInTheDocument();
  });

  it('says nothing about prerequisites in a lesson already under way', () => {
    const target = ALL_LESSONS[10]!;
    renderAt(`/learn/${target.id}`, learner(2, (state) => {
      state.settings.unlockAll = true;
      state.lessons[target.id] = { status: 'started', stepIndex: 1, steps: {}, timeMs: 1 };
    }));
    expect(screen.queryByText('This lesson builds on')).not.toBeInTheDocument();
  });
});

describe('onboarding asks about experience', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
  });

  const walkTo = async (user: ReturnType<typeof userEvent.setup>, experience: RegExp) => {
    const fresh = defaultState(1);
    renderAt('/onboarding', fresh);
    await user.click(screen.getByRole('button', { name: /Let.s start/ }));
    await user.click(screen.getByRole('button', { name: /That.s me/ }));
    expect(screen.getByRole('heading', { name: 'Have you written code before?' })).toBeInTheDocument();
    await user.click(screen.getByRole('radio', { name: experience }));
    await user.click(screen.getByRole('button', { name: 'Continue' }));
  };

  it('someone who knows JavaScript starts at the types, with every lesson unlocked', async () => {
    const user = userEvent.setup();
    await walkTo(user, /some JavaScript/);
    const start = entryModule('javascript')!;
    expect(screen.getByText(`Module ${start.number} · ${start.title}`)).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /Unlock all lessons/ })).toBeChecked();
    await user.click(screen.getByRole('button', { name: 'Start learning' }));

    const saved = useJourney.getState().state;
    expect(saved.profile.experience).toBe('javascript');
    expect(saved.settings.unlockAll).toBe(true);
    expect(nextUpLessonId(saved)).toBe(start.lessonIds[0]);
  });

  it('the suggestion can be declined, which keeps the guided path from lesson 1', async () => {
    const user = userEvent.setup();
    await walkTo(user, /some JavaScript/);
    await user.click(screen.getByRole('checkbox', { name: /Unlock all lessons/ }));
    expect(screen.getByText(`Start here · ${MODULES[0]!.title}`)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Start learning' }));
    expect(useJourney.getState().state.settings.unlockAll).toBe(false);
    expect(nextUpLessonId(useJourney.getState().state)).toBe(id(0));
  });

  it('a newcomer starts at the beginning and is not offered to skip ahead', async () => {
    const user = userEvent.setup();
    await walkTo(user, /new to code/);
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Start learning' }));
    const saved = useJourney.getState().state;
    expect(saved.profile.experience).toBe('new');
    expect(saved.settings.unlockAll).toBe(false);
  });
});

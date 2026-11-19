import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ALL_LESSONS, MODULES, getModule, minutesLeft } from '../src/content/curriculum';
import { GLOSSARY_BY_ID } from '../src/content/glossary';
import type { Track } from '../src/content/schema';
import { TrackTabs } from '../src/features/journey/TrackTabs';
import { AppRoutes } from '../src/routes';
import { __setStateForTests } from '../src/storage/store';
import { defaultState, type LessonProgress, type ProgressState } from '../src/storage/types';

const done = (): LessonProgress => ({ status: 'completed', stepIndex: 0, steps: {}, timeMs: 1 });

function learner(finished = 0, edit: (state: ProgressState) => void = () => undefined): ProgressState {
  const state = defaultState(1);
  state.profile = { name: 'Ada', onboarded: true, createdAt: 1, experience: null };
  for (let i = 0; i < finished; i += 1) state.lessons[ALL_LESSONS[i]!.id] = done();
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

const toggleFor = (title: string) => screen.getByRole('button', { name: title });

describe('the journey map', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
  });

  it('opens only the module the learner is in, so the map stays short', () => {
    renderAt('/', learner(5)); // the sixth lesson is in module 1
    const current = MODULES[1]!;
    expect(toggleFor(current.title)).toHaveAttribute('aria-expanded', 'true');
    // Modules of the same track are on the page, folded.
    for (const module of MODULES.filter((item) => item !== current && item.track === current.track)) {
      expect(toggleFor(module.title)).toHaveAttribute('aria-expanded', 'false');
    }
    // Only the open module's lessons are on the page.
    expect(screen.getAllByRole('link', { name: /min/ }).length).toBe(current.lessonIds.filter((lessonId) => {
      const index = ALL_LESSONS.findIndex((lesson) => lesson.id === lessonId);
      return index <= 5;
    }).length);
  });

  it('opens and closes a module on tap, and says how far along it is', async () => {
    const user = userEvent.setup();
    renderAt('/', learner(5));
    const collections = MODULES[3]!;
    const toggle = toggleFor(collections.title);
    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    const list = document.getElementById(toggle.getAttribute('aria-controls')!)!;
    expect(list).toBeVisible();
    expect(within(list).getAllByRole('listitem')).toHaveLength(collections.lessonIds.length);
    expect(within(list).getByRole('link', { name: /Module overview/ })).toHaveAttribute('href', `/module/${collections.id}`);
    expect(
      screen.getByText(`0 of ${collections.lessonIds.length} lessons · ${minutesLeft(collections.id, learner(5))} min left`),
    ).toBeInTheDocument();

    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });

  it('marks lessons ahead of the path when every lesson is unlocked', () => {
    renderAt('/', learner(5, (state) => {
      state.settings.unlockAll = true;
    }));
    expect(screen.getByText('All lessons unlocked')).toBeInTheDocument();
    expect(screen.getAllByText(/ahead of your path/).length).toBeGreaterThan(0);
    expect(screen.queryByText(/opens after/)).not.toBeInTheDocument();
  });

  it('keeps locked lessons as text that says what opens them', () => {
    renderAt('/', learner(5));
    expect(screen.getAllByText(/opens after/).length).toBeGreaterThan(0);
  });

  it('has one look per reading mode, with Tess at the current stop in Story mode', () => {
    const { unmount } = renderAt('/', learner(5, (state) => {
      state.settings.mode = 'story';
    }));
    const map = document.querySelector('ol[data-variant]')!;
    expect(map).toHaveAttribute('data-variant', 'story');
    const current = map.querySelector('li[data-current="true"]')!;
    expect(current.querySelector('svg[aria-hidden="true"]')).not.toBeNull();
    unmount();

    renderAt('/', learner(5, (state) => {
      state.settings.mode = 'pro';
    }));
    expect(document.querySelector('ol[data-variant]')).toHaveAttribute('data-variant', 'pro');
  });

  it('suggests a later start to someone who knows JavaScript and unlocked everything', () => {
    renderAt('/', learner(0, (state) => {
      state.settings.unlockAll = true;
      state.profile.experience = 'javascript';
    }));
    expect(screen.getByText('Suggested start')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Start this lesson' })).toHaveAttribute(
      'href',
      `/learn/${MODULES.find((module) => module.entryFor?.includes('javascript'))!.lessonIds[0]}`,
    );
  });

  it('shows track tabs once the course has more than one track, on the learner’s track', () => {
    renderAt('/', learner(5));
    expect(screen.getByRole('tablist')).toBeInTheDocument();
    expect(screen.getByRole('tab', { selected: true })).toHaveTextContent('Foundations');
  });
});

describe('track tabs', () => {
  function Harness() {
    const [track, setTrack] = useState<Track>('foundations');
    return <TrackTabs tracks={['foundations', 'intermediate', 'advanced']} selected={track} onSelect={setTrack} />;
  }

  it('works like a tablist: arrows, Home and End move and select; one tab stop', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const [foundations, intermediate, advanced] = screen.getAllByRole('tab');
    expect(foundations).toHaveAttribute('aria-selected', 'true');
    expect(foundations).toHaveAttribute('tabindex', '0');
    expect(intermediate).toHaveAttribute('tabindex', '-1');

    foundations!.focus();
    await user.keyboard('{ArrowRight}');
    expect(intermediate).toHaveAttribute('aria-selected', 'true');
    expect(document.activeElement).toBe(intermediate);
    await user.keyboard('{End}');
    expect(advanced).toHaveAttribute('aria-selected', 'true');
    await user.keyboard('{ArrowRight}');
    expect(foundations).toHaveAttribute('aria-selected', 'true');
    await user.keyboard('{ArrowLeft}');
    expect(advanced).toHaveAttribute('aria-selected', 'true');
    await user.keyboard('{Home}');
    expect(foundations).toHaveAttribute('aria-selected', 'true');
  });
});

describe('the module page', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
  });

  it('shows progress, key ideas, lessons, and continues where the learner is', () => {
    const module = MODULES[1]!;
    renderAt(`/module/${module.id}`, learner(5));
    expect(screen.getByRole('heading', { level: 1, name: module.title })).toBeInTheDocument();
    expect(screen.getByText(`1/${module.lessonIds.length}`)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Continue the module' })).toHaveAttribute(
      'href',
      `/learn/${module.lessonIds[1]}`,
    );
    const concept = ALL_LESSONS.find((lesson) => lesson.id === module.lessonIds[0])!.concepts[0]!;
    expect(screen.getByRole('link', { name: GLOSSARY_BY_ID.get(concept)!.term })).toHaveAttribute(
      'href',
      `/glossary?term=${concept}`,
    );
    const lessons = screen.getByRole('heading', { name: 'Lessons' }).parentElement!;
    expect(within(lessons).getAllByRole('listitem')).toHaveLength(module.lessonIds.length);
    expect(screen.getByRole('link', { name: /Previous module/ })).toHaveAttribute('href', `/module/${MODULES[0]!.id}`);
    expect(screen.getByRole('link', { name: /Next module/ })).toHaveAttribute('href', `/module/${MODULES[2]!.id}`);
  });

  it('says what opens a locked module, and points to Settings', () => {
    const module = MODULES[4]!;
    renderAt(`/module/${module.id}`, learner(5));
    expect(screen.getByText(/This module opens after/)).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /the module/ })).not.toBeInTheDocument();
  });

  it('offers to start a module ahead when every lesson is unlocked', () => {
    const module = MODULES[4]!;
    renderAt(`/module/${module.id}`, learner(5, (state) => {
      state.settings.unlockAll = true;
    }));
    expect(screen.getByRole('link', { name: 'Start the module' })).toHaveAttribute('href', `/learn/${module.lessonIds[0]}`);
  });

  it('offers a revisit for a finished module', () => {
    const module = MODULES[0]!;
    renderAt(`/module/${module.id}`, learner(8));
    expect(screen.getByRole('link', { name: 'Revisit the first lesson' })).toBeInTheDocument();
  });

  it('is friendly about a module that does not exist', () => {
    renderAt('/module/m99', learner());
    expect(getModule('m99')).toBeUndefined();
    expect(screen.getByRole('heading', { name: 'That module isn’t here' })).toBeInTheDocument();
  });

  it('is reachable from the lesson breadcrumb', () => {
    const lesson = ALL_LESSONS[0]!;
    renderAt(`/learn/${lesson.id}`, learner());
    expect(screen.getByRole('link', { name: new RegExp(MODULES[0]!.title) })).toHaveAttribute(
      'href',
      `/module/${lesson.moduleId}`,
    );
  });
});

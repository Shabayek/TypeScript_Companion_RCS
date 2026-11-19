import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { ALL_LESSONS } from '../src/content/curriculum';
import { dataLines, screenLines, textLines } from '../src/content/play';
import { MazeGame, PetGame, TodoGame, type GameRunner } from '../src/features/exercises/games';
import { AppRoutes } from '../src/routes';
import { LEGACY_LESSON_IDS } from '../src/storage/legacy';
import { migrate } from '../src/storage/model';
import { lessonsAddedBehind, reconcileSeenLessons } from '../src/storage/newLessons';
import { __setStateForTests, useJourney } from '../src/storage/store';
import { defaultState, type ProgressState } from '../src/storage/types';

function learner(edit: (state: ProgressState) => void = () => undefined): ProgressState {
  const state = defaultState(1);
  state.profile = { name: 'Ada', onboarded: true, createdAt: 1, experience: null };
  edit(state);
  return state;
}

const done = () => ({ status: 'completed' as const, stepIndex: 0, steps: {}, timeMs: 1 });

/** A learner from before version 5 who finished the first 20 original lessons. */
function returningLearner(): ProgressState {
  const old = learner((state) => {
    for (const id of LEGACY_LESSON_IDS.slice(0, 20)) state.lessons[id] = done();
  }) as unknown as Record<string, unknown>;
  delete old.seenLessons;
  delete old.arena;
  return migrate({ ...old, schemaVersion: 4 });
}

describe('lessons added to a course the learner already passed', () => {
  it('progress from before version 5 knows the original 32 lessons; a new learner knows nothing yet', () => {
    expect(returningLearner().seenLessons).toEqual([...LEGACY_LESSON_IDS]);
    expect(migrate(learner()).seenLessons).toBeNull();
  });

  it('points out only new lessons behind the learner, and learns about the rest silently', () => {
    const before = returningLearner();
    const behind = lessonsAddedBehind(before).map((lesson) => lesson.id);
    expect(behind).toContain('m01-l05-string-methods');
    expect(behind).toContain('m03-l06-array-toolkit');
    expect(behind).not.toContain('m07-l04-robot-maze');

    const after = reconcileSeenLessons(before);
    expect(after.seenLessons).toContain('m07-l04-robot-maze');
    expect(after.seenLessons).not.toContain('m01-l05-string-methods');
    expect(lessonsAddedBehind(after).map((lesson) => lesson.id)).toEqual(behind);
    // A new learner simply knows the whole course.
    expect(reconcileSeenLessons(learner()).seenLessons).toEqual(ALL_LESSONS.map((lesson) => lesson.id));
  });

  it('Home says so once, with links, until dismissed', async () => {
    const user = userEvent.setup();
    __setStateForTests(reconcileSeenLessons(returningLearner()));
    render(
      <MemoryRouter initialEntries={['/']}>
        <AppRoutes />
      </MemoryRouter>,
    );
    const note = screen.getByRole('heading', { name: 'New lessons were added' }).closest('section, div')!;
    expect(within(note as HTMLElement).getByRole('link', { name: 'String methods' })).toHaveAttribute('href', '/learn/m01-l05-string-methods');
    await user.click(screen.getByRole('button', { name: 'Got it' }));
    expect(screen.queryByRole('heading', { name: 'New lessons were added' })).not.toBeInTheDocument();
    expect(lessonsAddedBehind(useJourney.getState().state)).toEqual([]);
  });
});

describe('game screens', () => {
  it('tell data lines from text lines', () => {
    const lines = ['@grid #R*#', 'Hello', '@pet {"hunger":1}', 'not @data'];
    expect(screenLines(lines)[0]).toEqual({ kind: 'data', tag: 'grid', payload: '#R*#' });
    expect(textLines(lines)).toEqual(['Hello', 'not @data']);
    expect(dataLines(lines, 'pet')).toEqual(['{"hunger":1}']);
  });

  const runner = (lines: string[] = []): GameRunner => ({ lines, problem: null, running: false, program: '', play: vi.fn(async () => undefined) });

  it('the maze sends the planned moves, and draws the frames the program prints', async () => {
    const user = userEvent.setup();
    const game = { type: 'maze' as const, levels: [['#####', '#R.*#', '#####']] };
    const fake = runner(['@grid #####/#R.*#/#####', '@grid #####/#.R*#/#####', 'Bump!']);
    render(<MazeGame game={game} runner={fake} />);
    expect(screen.getByRole('img', { name: 'The maze. The robot is in column 2, row 2.' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Right' }));
    await user.click(screen.getByRole('button', { name: 'Right' }));
    expect(within(screen.getByRole('list', { name: 'The robot’s program' })).getAllByRole('listitem')).toHaveLength(2);
    await user.click(screen.getByRole('button', { name: 'Run the robot' }));
    expect(fake.play).toHaveBeenCalledWith({ level: 1, maze: game.levels[0], moves: ['right', 'right'] });
    expect(await screen.findByRole('img', { name: 'The maze. The robot is in column 3, row 2.' })).toBeInTheDocument();
    expect(screen.getByText('Bump!')).toBeInTheDocument();
  });

  it('the pet shows what the program says about it', () => {
    const fake = runner(['Pip hatched!', '@pet {"hunger":40,"energy":70,"fun":55,"mood":"happy"}']);
    render(<PetGame game={{ type: 'pet', name: 'Pip' }} runner={fake} />);
    expect(screen.getByText('Pip · feels happy')).toBeInTheDocument();
    expect(screen.getByLabelText('Hunger')).toHaveAttribute('value', '40');
    expect(screen.getByText('Pip hatched!')).toBeInTheDocument();
  });

  it('the to-do list is drawn from the reducer’s output, and every click becomes an action', async () => {
    const user = userEvent.setup();
    const fake = runner(['@todos [{"id":1,"text":"Water plants","done":false}]', '0 of 1 done']);
    render(<TodoGame game={{ type: 'todo', suggestions: ['Read'] }} runner={fake} />);
    await user.click(screen.getByRole('checkbox', { name: 'Water plants' }));
    await vi.waitFor(() => expect(fake.play).toHaveBeenLastCalledWith({ actions: [{ type: 'toggle', id: 1 }] }));
  });
});

import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fullLesson as getLesson } from '../src/content/fullCourse';
import type { Lesson, PlayStep } from '../src/content/schema';
import { __setStateForTests, useJourney } from '../src/storage/store';
import { defaultState } from '../src/storage/types';

vi.mock('../src/runner', async (original) => ({
  ...(await original<typeof import('../src/runner')>()),
  runProgram: vi.fn(),
}));

import { runProgram } from '../src/runner';
import { GamePanel } from '../src/features/exercises/GamePanel';

const run = vi.mocked(runProgram);

function game(lessonId: string): { lesson: Lesson; step: PlayStep } {
  const lesson = getLesson(lessonId);
  const step = lesson?.steps.find((item): item is PlayStep => item.kind === 'play');
  if (!lesson || !step) throw new Error(`no game in ${lessonId}`);
  return { lesson, step };
}

beforeEach(() => {
  run.mockReset();
  run.mockResolvedValue({ status: 'ok', logs: ['Final score: 20 points, 50%'], tests: [] });
  __setStateForTests(defaultState(1));
});

describe('GamePanel', () => {
  it("runs the learner's own code once a step is solved, and says when it uses the example", async () => {
    const { lesson, step } = game('m07-l01-quiz-game');
    const mine = 'function scoreAnswer(isCorrect: boolean, current: number): number {\n  return isCorrect ? current + 10 : current; // mine\n}';
    const state = defaultState(1);
    state.lessons[lesson.id] = {
      status: 'started',
      stepIndex: 3,
      timeMs: 1,
      steps: { score: { solved: true, practiced: false, attempts: 1, revealed: false } },
    };
    __setStateForTests(state);
    act(() => useJourney.getState().setDraft(`${lesson.id}:score`, mine));

    const user = userEvent.setup();
    render(<GamePanel lesson={lesson} step={step} mode="explorer" />);
    expect(screen.getByText(/runs your code from step 2\./)).toBeInTheDocument();
    expect(screen.getByText(/Step 3 is not solved yet, so the game uses the example answer/)).toBeInTheDocument();

    for (const question of step.game.type === 'quiz' ? step.game.questions : []) {
      const right = question.choices[question.answer] ?? '';
      await user.click(screen.getByRole('button', { name: right.replace(/`/g, '') }));
      await user.click(screen.getByRole('button', { name: /Next question|See my score/ }));
    }

    await waitFor(() => expect(run).toHaveBeenCalledTimes(1));
    const program = run.mock.calls[0]?.[0] ?? '';
    expect(program).toContain('// mine');
    expect(program).toContain('Math.round((correct / total) * 100)');
    expect(program).toContain('const input = {"answers":[true,true,true,true]};');
    expect(await screen.findByText('Final score: 20 points, 50%')).toBeInTheDocument();
    expect(screen.getByText('See the code that runs the game')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Play again' })).toBeInTheDocument();
  });

  it('budget: adding an expense re-runs the program with it', async () => {
    const { lesson, step } = game('m07-l02-budget');
    const user = userEvent.setup();
    render(<GamePanel lesson={lesson} step={step} mode="explorer" />);
    await waitFor(() => expect(run).toHaveBeenCalled());

    await user.click(screen.getByRole('button', { name: '+ tea (2)' }));
    await user.type(screen.getByLabelText('Bought'), 'cake');
    await user.type(screen.getByLabelText('Cost'), '4');
    await user.click(screen.getByRole('button', { name: 'Add' }));

    await waitFor(() =>
      expect(run.mock.lastCall?.[0]).toContain(
        'const input = {"budget":20,"expenses":[{"label":"tea","amount":2},{"label":"cake","amount":4}]};',
      ),
    );
    expect(screen.getByRole('list', { name: 'Expenses' })).toHaveTextContent('cake · 4');
    await user.click(screen.getByRole('button', { name: 'Remove tea' }));
    await waitFor(() => expect(run.mock.lastCall?.[0]).toContain('"expenses":[{"label":"cake","amount":4}]'));
  });

  it('shows a friendly error when the code behind the game breaks', async () => {
    run.mockResolvedValue({ status: 'runtime-error', logs: [], tests: [], error: 'TypeError: pick is not a function' });
    const { lesson, step } = game('m07-l03-story-generator');
    const user = userEvent.setup();
    render(<GamePanel lesson={lesson} step={step} mode="explorer" />);
    await user.click(screen.getByRole('button', { name: 'Spin' }));
    expect(await screen.findByText(/The game stopped/)).toBeInTheDocument();
    expect(screen.getByText('The code ran, then stopped.')).toBeInTheDocument();
  });
});

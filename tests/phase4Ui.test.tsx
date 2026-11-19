import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { FULL_COURSE } from '../src/content/fullCourse';
import { fullLesson } from '../src/content/fullCourse';
import type { PredictTypeStep } from '../src/content/schema';
import { PredictTypeExercise } from '../src/features/exercises/PredictTypeExercise';
import { effectiveEngine } from '../src/platform/capabilities';
import { detectedEngine } from '../src/platform/useEngine';
import { AppRoutes } from '../src/routes';
import { migrate } from '../src/storage/model';
import { __setStateForTests, useJourney } from '../src/storage/store';
import { defaultState, type ProgressState } from '../src/storage/types';
import { CodeBlock, codeLines } from '../src/ui/CodeBlock';

vi.mock('../src/ui/CodeEditor', () => ({
  CodeEditor: ({ value, onChange, ariaLabel }: { value: string; onChange?: (next: string) => void; ariaLabel?: string }) => (
    <textarea aria-label={ariaLabel ?? 'Code editor'} value={value} onChange={(event) => onChange?.(event.target.value)} />
  ),
}));

function learner(edit: (state: ProgressState) => void = () => undefined): ProgressState {
  const state = defaultState(1);
  state.profile = { name: 'Ada', onboarded: true, createdAt: 1, experience: null };
  edit(state);
  return state;
}

/** Every lesson before `lessonId` finished; this one open at `stepIndex`. */
function openAt(lessonId: string, stepIndex: number, edit: (state: ProgressState) => void = () => undefined) {
  const position = FULL_COURSE.findIndex((lesson) => lesson.id === lessonId);
  const state = learner((draft) => {
    for (const lesson of FULL_COURSE.slice(0, position)) {
      draft.lessons[lesson.id] = { status: 'completed', stepIndex: 0, steps: {}, timeMs: 1 };
    }
    draft.lessons[lessonId] = { status: 'started', stepIndex, steps: {}, timeMs: 1 };
    edit(draft);
  });
  __setStateForTests(state);
  return render(
    <MemoryRouter initialEntries={[`/learn/${lessonId}`]}>
      <AppRoutes />
    </MemoryRouter>,
  );
}

function renderAt(path: string, state = learner()) {
  __setStateForTests(state);
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes />
    </MemoryRouter>,
  );
}

describe('device engine', () => {
  it('is detected as Modern in the test browser, and Classic always wins', () => {
    expect(detectedEngine()).toBe('modern');
    expect(effectiveEngine('auto', 'modern')).toBe('modern');
    expect(effectiveEngine('classic', 'modern')).toBe('classic');
    expect(effectiveEngine('modern', 'classic')).toBe('classic');
    expect(effectiveEngine('auto', 'classic')).toBe('classic');
  });

  it('is a saved setting that defaults to Automatic and drops unknown values', () => {
    expect(migrate({ ...learner(), settings: { ...learner().settings, engine: 'turbo' } }).settings.engine).toBe('auto');
    expect(migrate({ ...learner(), settings: { ...learner().settings, engine: 'classic' } }).settings.engine).toBe('classic');
  });

  it('can be chosen in Settings', async () => {
    const user = userEvent.setup();
    renderAt('/settings');
    const group = screen.getByRole('radiogroup', { name: 'Device engine' });
    expect(within(group).getByRole('radio', { name: 'Automatic' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByTestId('engine-status')).toHaveTextContent('This device runs modern JavaScript');
    await user.click(within(group).getByRole('radio', { name: 'Classic' }));
    expect(useJourney.getState().state.settings.engine).toBe('classic');
    expect(screen.getByTestId('engine-status')).toHaveTextContent('Classic is on');
  });
});

describe('a step written for newer phones', () => {
  const lesson = fullLesson('m03-l01-arrays')!;
  const index = lesson.steps.findIndex((step) => step.id === 'last');

  it('shows as written on a Modern device, tagged', async () => {
    openAt(lesson.id, index);
    expect(await screen.findByText('Newer phones')).toBeInTheDocument();
    expect(document.body.textContent).toContain('queue.at(-1)');
  });

  it('shows its Classic alternative on Classic, under the same step', async () => {
    openAt(lesson.id, index, (state) => {
      state.settings.engine = 'classic';
    });
    expect(await screen.findByText('Classic version for this device')).toBeInTheDocument();
    expect(document.body.textContent).toContain('queue[queue.length - 1]');
    expect(document.body.textContent).not.toContain('console.log(queue.at(-1))');
    // Answering it counts for the same step id.
    const user = userEvent.setup();
    await user.type(screen.getByLabelText('What will this print?'), 'Ada{enter}Cy');
    await user.click(screen.getByRole('button', { name: 'Check' }));
    expect(useJourney.getState().state.lessons[lesson.id]?.steps.last?.solved).toBe(true);
  });

  it('is mentioned on the lesson row either way', () => {
    renderAt(`/module/m03`);
    expect(screen.getAllByText(/uses newer-phone features/).length).toBeGreaterThan(0);
  });
});

describe('bonus steps', () => {
  const lesson = fullLesson('m05-l04-generics')!;
  const recapIndex = lesson.steps.findIndex((step) => step.kind === 'recap');

  it('are not counted in the lesson’s steps, and are offered from the summary', async () => {
    const user = userEvent.setup();
    openAt(lesson.id, recapIndex);
    expect(await screen.findByText(`Step ${recapIndex + 1} of ${recapIndex + 1}`)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Finish lesson' }));
    expect(useJourney.getState().state.lessons[lesson.id]?.status).toBe('completed');

    await user.click(await screen.findByRole('button', { name: 'Try the bonus step' }));
    expect(await screen.findByText('Go further · optional')).toBeInTheDocument();
    expect(screen.getByText('Bonus 1 of 1')).toBeInTheDocument();
    expect(await screen.findByText('The type checks')).toBeInTheDocument();

    // Back returns to the summary it came from; Done from the bonus too.
    await user.click(screen.getByRole('button', { name: 'Back' }));
    await user.click(await screen.findByRole('button', { name: 'Try the bonus step' }));
    await user.click(await screen.findByRole('button', { name: 'Done' }));
    expect(await screen.findByRole('button', { name: 'Try the bonus step' })).toBeInTheDocument();
  });

  it('show on the lesson row', () => {
    renderAt('/module/m05');
    expect(screen.getAllByText(/\+1 bonus step/).length).toBeGreaterThan(0);
  });
});

describe('predict the type', () => {
  const step: PredictTypeStep = {
    id: 'narrowed',
    kind: 'predictType',
    prompt: { base: 'What type?' },
    code: 'const rest: string | number = 1;',
    target: 'rest',
    answer: 'string | number',
    alsoAccept: ['number | string'],
    explain: { base: 'Narrowed.' },
  };

  function renderStep(onResult = vi.fn(), onReveal = vi.fn()) {
    render(<PredictTypeExercise step={step} mode="explorer" onResult={onResult} revealed={false} onReveal={onReveal} />);
    return { onResult, onReveal };
  }

  it('accepts a listed spelling even when the checker cannot run', async () => {
    const user = userEvent.setup();
    const { onResult } = renderStep();
    expect(screen.getByText('rest')).toBeInTheDocument();
    await user.type(screen.getByLabelText('The type of rest:'), 'number|string{enter}');
    expect(await screen.findByText('Exactly right')).toBeInTheDocument();
    expect(onResult).toHaveBeenCalledWith({ correct: true, revealed: false });
  });

  it('offers the answer when the checker is not available, without marking the step wrong', async () => {
    const user = userEvent.setup();
    const { onResult, onReveal } = renderStep();
    await user.type(screen.getByLabelText('The type of rest:'), 'string');
    await user.click(screen.getByRole('button', { name: 'Check' }));
    expect(await screen.findByText('The type checker is not available on this device.')).toBeInTheDocument();
    expect(onResult).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Show me the answer' }));
    expect(onReveal).toHaveBeenCalled();
  });
});

describe('see types', () => {
  it('splits names out of highlighted code without changing the text', () => {
    const code = 'const total = 1;\nconsole.log(total);';
    const spans = [
      { start: 6, end: 11, display: 'const total: 1' },
      { start: 29, end: 34, display: 'const total: 1' },
    ];
    const lines = codeLines(code, spans);
    expect(lines.map((line) => line.map((piece) => piece.text).join(''))).toEqual(code.split('\n'));
    expect(lines[0]?.find((piece) => piece.span === 0)?.text).toBe('total');
    expect(lines[1]?.find((piece) => piece.span === 1)?.text).toBe('total');
  });

  it('is a toggle on lesson code, and says when the checker cannot run', async () => {
    const user = userEvent.setup();
    render(<CodeBlock code="const total = 1;" inspect copy={false} />);
    const toggle = screen.getByRole('button', { name: 'See types' });
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('The type checker is not available on this device.'));
    await user.click(toggle);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});

describe('diagrams', () => {
  it('every diagram draws, with its words from the catalogue', async () => {
    const { FIGURE_IDS } = await import('../src/content/schema');
    const { Figure } = await import('../src/ui/Figures');
    for (const id of FIGURE_IDS) {
      const { container, unmount } = render(<Figure id={id} />);
      const svg = container.querySelector('svg');
      expect(svg?.children.length, id).toBeGreaterThan(0);
      // No raw message keys (e.g. "figure.eitherOne") on screen.
      expect(container.textContent ?? '', id).not.toMatch(/figure\.[a-zA-Z]/);
      unmount();
    }
  });

  it('a reading step can give Pro readers a different diagram', async () => {
    const { figureFor } = await import('../src/content/text');
    const choice = { base: 'promise', pro: 'event-loop' } as const;
    expect(figureFor(choice, 'story')).toBe('promise');
    expect(figureFor(choice, 'explorer')).toBe('promise');
    expect(figureFor(choice, 'pro')).toBe('event-loop');
    expect(figureFor('union', 'pro')).toBe('union');
  });
});

describe('diagram labels', () => {
  it('wrap at a space or after a hyphen, near the middle, only when too long', async () => {
    const { wrapLabel } = await import('../src/ui/Figures');
    expect(wrapLabel('timers', 13)).toEqual(['timers']);
    expect(wrapLabel('promise callbacks', 13)).toEqual(['promise', 'callbacks']);
    expect(wrapLabel('Promise-Callbacks', 13)).toEqual(['Promise-', 'Callbacks']);
    expect(wrapLabel('temporizadores', 13)).toEqual(['temporizadores']);
  });
});

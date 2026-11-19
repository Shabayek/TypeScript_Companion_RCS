import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { CodeStep } from '../src/content/schema';

vi.mock('../src/ui/CodeEditor', () => ({
  CodeEditor: ({ value, onChange, ariaLabel }: { value: string; onChange?: (next: string) => void; ariaLabel?: string }) => (
    <textarea aria-label={ariaLabel ?? 'Code editor'} value={value} onChange={(event) => onChange?.(event.target.value)} />
  ),
}));
vi.mock('../src/runner', () => ({ gradeCode: vi.fn() }));

import { CodeExercise } from '../src/features/exercises/CodeExercise';
import { __setStateForTests, useJourney } from '../src/storage/store';
import { DRAFTS_KEY, defaultState } from '../src/storage/types';

const step: CodeStep = {
  id: 'write-one',
  kind: 'write',
  prompt: { base: 'Write it.' },
  starter: 'function add() {}',
  solution: 'function add() { return 1; }',
  tests: [{ name: 'one', call: 'add()', expect: '1' }],
};

const exercise = () => (
  <CodeExercise step={step} mode="explorer" onResult={vi.fn()} revealed={false} onReveal={() => undefined} draftKey="lesson-a:write-one" />
);

describe('keeping the learner’s code (E8)', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    window.localStorage.clear();
    __setStateForTests(defaultState(1));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('brings the code back after leaving the step, and says so', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const first = render(exercise());
    const editor = screen.getByLabelText('Your TypeScript code');
    await user.clear(editor);
    await user.type(editor, 'half done');
    first.unmount();

    render(exercise());
    expect(screen.getByLabelText('Your TypeScript code')).toHaveValue('half done');
    expect(screen.getByText(/Your code from last time is back/)).toBeInTheDocument();
  });

  it('keeps drafts across a restart of the app', async () => {
    useJourney.getState().setDraft('lesson-a:write-one', 'saved code');
    vi.advanceTimersByTime(1000);
    expect(window.localStorage.getItem(DRAFTS_KEY)).toContain('saved code');

    useJourney.setState({ hydrated: false, drafts: {} });
    await useJourney.getState().hydrate();
    expect(useJourney.getState().drafts['lesson-a:write-one']).toBe('saved code');
  });

  it('"Reset code" goes back to the starter and forgets the draft', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    useJourney.getState().setDraft('lesson-a:write-one', 'old attempt');
    render(exercise());
    await user.click(screen.getByRole('button', { name: 'Reset code' }));
    expect(screen.getByLabelText('Your TypeScript code')).toHaveValue(step.starter);
    expect(useJourney.getState().drafts['lesson-a:write-one']).toBeUndefined();
  });

  it('resetting all progress also clears drafts', () => {
    useJourney.getState().setDraft('lesson-a:write-one', 'old attempt');
    useJourney.getState().reset();
    expect(useJourney.getState().drafts).toEqual({});
    expect(window.localStorage.getItem(DRAFTS_KEY)).toBe('{}');
  });
});

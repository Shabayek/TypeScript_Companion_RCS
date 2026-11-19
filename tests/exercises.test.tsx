import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { CheckStep, CodeStep, FillStep, PredictStep, ReorderStep } from '../src/content/schema';
import { CheckExercise } from '../src/features/exercises/CheckExercise';
import { CodeExercise } from '../src/features/exercises/CodeExercise';
import { FillExercise } from '../src/features/exercises/FillExercise';
import { PredictExercise } from '../src/features/exercises/PredictExercise';
import { ReorderExercise } from '../src/features/exercises/ReorderExercise';
import type { GradeOutcome } from '../src/runner';

vi.mock('../src/ui/CodeEditor', () => ({
  CodeEditor: ({
    value,
    onChange,
    ariaLabel,
  }: {
    value: string;
    onChange?: (next: string) => void;
    ariaLabel?: string;
  }) => (
    <textarea
      aria-label={ariaLabel ?? 'Code editor'}
      value={value}
      onChange={(event) => onChange?.(event.target.value)}
    />
  ),
}));

vi.mock('../src/runner', () => ({
  gradeCode: vi.fn(),
}));

import { gradeCode } from '../src/runner';

const checkStep: CheckStep = {
  id: 'check-one',
  kind: 'check',
  prompt: { base: 'Which one is correct?' },
  choices: [
    { id: 'a', text: { base: 'A wrong answer' }, correct: false, feedback: { base: 'Not this one.' } },
    { id: 'b', text: { base: 'The right answer' }, correct: true },
  ],
  explain: { base: 'Because it is right.' },
};

const multiStep: CheckStep = {
  id: 'check-many',
  kind: 'check',
  prompt: { base: 'Pick both.' },
  multi: true,
  choices: [
    { id: 'a', text: { base: 'First right' }, correct: true },
    { id: 'b', text: { base: 'Second right' }, correct: true },
    { id: 'c', text: { base: 'Wrong third' }, correct: false },
  ],
};

const predictStep: PredictStep = {
  id: 'predict-one',
  kind: 'predict',
  prompt: { base: 'What prints?' },
  code: 'console.log("hello");',
  answer: 'hello',
  explain: { base: 'Strings print as themselves.' },
};

const fillStep: FillStep = {
  id: 'fill-one',
  kind: 'fill',
  prompt: { base: 'Fill the blanks.' },
  template: 'const size: ___ = ___;',
  bank: ['number', 'string', '5'],
  answers: ['number', '5'],
};

const reorderStep: ReorderStep = {
  id: 'reorder-one',
  kind: 'reorder',
  prompt: { base: 'Put these in order.' },
  lines: ['const a = 1;', 'console.log(a);'],
  explain: { base: 'A name must exist before it is used.' },
};

const codeStep: CodeStep = {
  id: 'code-one',
  kind: 'write',
  prompt: { base: 'Write a function.' },
  starter: 'function add(a: number, b: number) {\n  return a + b;\n}',
  solution: 'function add(a: number, b: number): number {\n  return a + b;\n}',
  tests: [{ name: 'adds', call: 'add(1, 2)', expect: '3' }],
  explain: { base: 'Two numbers in, one number out.' },
};

function renderCheck(step: CheckStep, onResult = vi.fn(), revealed = false) {
  render(
    <CheckExercise step={step} mode="explorer" onResult={onResult} revealed={revealed} onReveal={() => undefined} />,
  );
  return onResult;
}

describe('CheckExercise', () => {
  it('keeps checking disabled until something is chosen', () => {
    renderCheck(checkStep);
    expect(screen.getByRole('button', { name: 'Check answer' })).toBeDisabled();
  });

  it('accepts the right choice and explains it', async () => {
    const user = userEvent.setup();
    const onResult = renderCheck(checkStep);

    await user.click(screen.getByRole('button', { name: /The right answer/ }));
    await user.click(screen.getByRole('button', { name: 'Check answer' }));

    expect(onResult).toHaveBeenCalledWith({ correct: true, revealed: false });
    expect(screen.getByText('That’s right')).toBeInTheDocument();
    expect(screen.getByText('Because it is right.')).toBeInTheDocument();
  });

  it('shows targeted feedback for a wrong choice, then allows a retry', async () => {
    const user = userEvent.setup();
    const onResult = renderCheck(checkStep);

    await user.click(screen.getByRole('button', { name: /A wrong answer/ }));
    await user.click(screen.getByRole('button', { name: 'Check answer' }));

    expect(onResult).toHaveBeenLastCalledWith({ correct: false, revealed: false });
    expect(screen.getByText('Not this one.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Try again' }));
    await user.click(screen.getByRole('button', { name: /The right answer/ }));
    await user.click(screen.getByRole('button', { name: 'Check answer' }));

    expect(onResult).toHaveBeenLastCalledWith({ correct: true, revealed: false });
  });

  it('accepts a complete multi-select answer', async () => {
    const user = userEvent.setup();
    const onResult = renderCheck(multiStep);

    await user.click(screen.getByRole('button', { name: /First right/ }));
    await user.click(screen.getByRole('button', { name: /Second right/ }));
    await user.click(screen.getByRole('button', { name: 'Check answer' }));

    expect(onResult).toHaveBeenCalledWith({ correct: true, revealed: false });
  });

  it('says a second answer is still missing', async () => {
    const user = userEvent.setup();
    const onResult = renderCheck(multiStep);

    await user.click(screen.getByRole('button', { name: /First right/ }));
    await user.click(screen.getByRole('button', { name: 'Check answer' }));

    expect(onResult).toHaveBeenCalledWith({ correct: false, revealed: false });
    expect(screen.getByText(/still missing/)).toBeInTheDocument();
  });

  it('reveals the correct choice without grading it', () => {
    renderCheck(checkStep, vi.fn(), true);
    expect(screen.getByText('Answer')).toBeInTheDocument();
    expect(screen.getAllByText(/The right answer/).length).toBeGreaterThan(0);
  });
});

describe('PredictExercise', () => {
  it('accepts the printed output, ignoring trailing whitespace', async () => {
    const user = userEvent.setup();
    const onResult = vi.fn();
    render(
      <PredictExercise step={predictStep} mode="explorer" onResult={onResult} revealed={false} onReveal={() => undefined} />,
    );

    const box = screen.getByLabelText(/what will this print/i);
    expect(screen.getByRole('button', { name: 'Check' })).toBeDisabled();

    await user.type(box, '  hello  ');
    await user.click(screen.getByRole('button', { name: 'Check' }));

    expect(onResult).toHaveBeenCalledWith({ correct: true, revealed: false });
    expect(screen.getByText('Exactly right')).toBeInTheDocument();
  });

  it('checks with Ctrl+Enter', async () => {
    const user = userEvent.setup();
    const onResult = vi.fn();
    render(
      <PredictExercise step={predictStep} mode="explorer" onResult={onResult} revealed={false} onReveal={() => undefined} />,
    );

    const box = screen.getByLabelText(/what will this print/i);
    await user.type(box, 'hello');
    fireEvent.keyDown(box, { key: 'Enter', ctrlKey: true });

    expect(onResult).toHaveBeenCalledWith({ correct: true, revealed: false });
  });

  it('offers a next step for a wrong answer', async () => {
    const user = userEvent.setup();
    const onResult = vi.fn();
    render(
      <PredictExercise step={predictStep} mode="explorer" onResult={onResult} revealed={false} onReveal={() => undefined} />,
    );

    await user.type(screen.getByLabelText(/what will this print/i), 'goodbye');
    await user.click(screen.getByRole('button', { name: 'Check' }));

    expect(onResult).toHaveBeenCalledWith({ correct: false, revealed: false });
    expect(screen.getByText('Not quite')).toBeInTheDocument();
  });

  it('explains a near miss specifically', async () => {
    const user = userEvent.setup();
    render(
      <PredictExercise step={predictStep} mode="story" onResult={() => undefined} revealed={false} onReveal={() => undefined} />,
    );

    await user.type(screen.getByLabelText(/what will this print/i), '"hello"');
    await user.click(screen.getByRole('button', { name: 'Check' }));

    expect(screen.getByText('Nearly there')).toBeInTheDocument();
    expect(screen.getByText(/quotes only tell the computer/)).toBeInTheDocument();
  });
});

describe('FillExercise', () => {
  it('accepts the right tokens', async () => {
    const user = userEvent.setup();
    const onResult = vi.fn();
    render(
      <FillExercise step={fillStep} mode="explorer" onResult={onResult} revealed={false} onReveal={() => undefined} />,
    );

    await user.selectOptions(screen.getByLabelText('Blank 1'), 'number');
    await user.selectOptions(screen.getByLabelText('Blank 2'), '5');
    await user.click(screen.getByRole('button', { name: 'Check answer' }));

    expect(onResult).toHaveBeenCalledWith({ correct: true, revealed: false });
  });

  it('marks a wrong token and offers a reset', async () => {
    const user = userEvent.setup();
    const onResult = vi.fn();
    render(
      <FillExercise step={fillStep} mode="explorer" onResult={onResult} revealed={false} onReveal={() => undefined} />,
    );

    await user.selectOptions(screen.getByLabelText('Blank 1'), 'string');
    await user.selectOptions(screen.getByLabelText('Blank 2'), '5');
    await user.click(screen.getByRole('button', { name: 'Check answer' }));

    expect(onResult).toHaveBeenCalledWith({ correct: false, revealed: false });
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
    expect(screen.getByLabelText('Blank 1')).toHaveAttribute('data-state', 'wrong');
  });

  it('shows the answers when revealed', () => {
    render(
      <FillExercise step={fillStep} mode="explorer" onResult={vi.fn()} revealed onReveal={() => undefined} />,
    );
    expect(screen.getByText('number, 5')).toBeInTheDocument();
  });
});

describe('ReorderExercise', () => {
  it('starts shuffled, reports a wrong order, then accepts the fixed order', async () => {
    const user = userEvent.setup();
    const onResult = vi.fn();
    render(
      <ReorderExercise step={reorderStep} mode="explorer" onResult={onResult} revealed={false} onReveal={() => undefined} />,
    );

    await user.click(screen.getByRole('button', { name: 'Check order' }));
    expect(onResult).toHaveBeenCalledWith({ correct: false, revealed: false });

    await user.click(screen.getByRole('button', { name: 'Move line 1 down' }));
    await user.click(screen.getByRole('button', { name: 'Check order' }));

    expect(onResult).toHaveBeenLastCalledWith({ correct: true, revealed: false });
    expect(screen.getByText('That runs in order')).toBeInTheDocument();
  });

  it('shows the correct order when revealed', () => {
    render(
      <ReorderExercise step={reorderStep} mode="explorer" onResult={vi.fn()} revealed onReveal={() => undefined} />,
    );
    expect(screen.getByText('Correct order')).toBeInTheDocument();
  });
});

describe('CodeExercise', () => {
  const passOutcome: GradeOutcome = {
    kind: 'pass',
    pass: true,
    headline: 'All checks pass. Nice work.',
    details: [],
    results: [],
    logs: ['3'],
  };

  it('runs the checks and reports a pass with its output', async () => {
    const user = userEvent.setup();
    vi.mocked(gradeCode).mockResolvedValueOnce(passOutcome);
    const onResult = vi.fn();

    render(
      <CodeExercise step={codeStep} mode="explorer" onResult={onResult} revealed={false} onReveal={() => undefined} />,
    );

    await user.click(screen.getByRole('button', { name: 'Run checks' }));

    await waitFor(() => expect(onResult).toHaveBeenCalledWith({ correct: true, revealed: false }));
    expect(await screen.findByText('All checks pass. Nice work.')).toBeInTheDocument();
    // Graded for this device's engine (Modern in the test browser).
    expect(gradeCode).toHaveBeenCalledWith(codeStep.starter, codeStep.tests, codeStep.id, { engine: 'modern' });
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('shows the example solution on request', async () => {
    const user = userEvent.setup();
    render(
      <CodeExercise step={codeStep} mode="explorer" onResult={vi.fn()} revealed={false} onReveal={() => undefined} />,
    );

    await user.click(screen.getByRole('button', { name: 'Compare with example' }));
    expect(screen.getByText('one good way to write it')).toBeInTheDocument();
  });

  it('lets a learner practise when the checker cannot start', async () => {
    const user = userEvent.setup();
    vi.mocked(gradeCode).mockResolvedValueOnce({
      kind: 'unavailable',
      pass: false,
      headline: 'Checks can’t run on this device.',
      details: ['The compiler did not load.'],
      results: [],
      logs: [],
    });
    const onResult = vi.fn();

    render(
      <CodeExercise step={codeStep} mode="explorer" onResult={onResult} revealed={false} onReveal={() => undefined} />,
    );

    await user.click(screen.getByRole('button', { name: 'Run checks' }));
    await user.click(await screen.findByRole('button', { name: /mark as practised/i }));

    expect(onResult).toHaveBeenCalledWith({ correct: true, revealed: true });
  });
});

describe('CheckExercise does not give the answer away (B9)', () => {
  it('after a wrong pick, marks only that pick with a cross and leaves the other options unmarked', async () => {
    const user = userEvent.setup();
    render(<CheckExercise step={checkStep} mode="explorer" onResult={vi.fn()} revealed={false} onReveal={() => undefined} />);

    await user.click(screen.getByRole('button', { name: /A wrong answer/ }));
    await user.click(screen.getByRole('button', { name: 'Check answer' }));

    const wrong = screen.getByRole('button', { name: /A wrong answer/ });
    const right = screen.getByRole('button', { name: /The right answer/ });
    expect(wrong).toHaveAttribute('data-state', 'wrong');
    expect(wrong).toHaveTextContent('✗');
    expect(right).not.toHaveAttribute('data-state');
    expect(screen.queryByText(/also right/)).not.toBeInTheDocument();
    expect(screen.getByText('Not this one.')).toBeInTheDocument();
  });

  it('marks the correct answer once it is solved', async () => {
    const user = userEvent.setup();
    render(<CheckExercise step={checkStep} mode="explorer" onResult={vi.fn()} revealed={false} onReveal={() => undefined} />);
    await user.click(screen.getByRole('button', { name: /The right answer/ }));
    await user.click(screen.getByRole('button', { name: 'Check answer' }));
    expect(screen.getByRole('button', { name: /The right answer/ })).toHaveAttribute('data-state', 'correct');
  });

  it('in a multi-select, confirms right picks but does not reveal the missing one', async () => {
    const user = userEvent.setup();
    render(<CheckExercise step={multiStep} mode="explorer" onResult={vi.fn()} revealed={false} onReveal={() => undefined} />);
    await user.click(screen.getByRole('button', { name: /First right/ }));
    await user.click(screen.getByRole('button', { name: 'Check answer' }));

    expect(screen.getByRole('button', { name: /First right/ })).toHaveAttribute('data-state', 'correct');
    expect(screen.getByRole('button', { name: /Second right/ })).not.toHaveAttribute('data-state');
    expect(screen.getByText(/still missing/)).toBeInTheDocument();
  });

  it('shows the answer when the learner asks for it', () => {
    render(<CheckExercise step={checkStep} mode="explorer" onResult={vi.fn()} revealed onReveal={() => undefined} />);
    expect(screen.getByRole('button', { name: /The right answer/ })).toHaveAttribute('data-state', 'correct');
  });
});

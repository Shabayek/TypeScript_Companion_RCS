import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { RunResult } from '../src/runner/types';

vi.mock('../src/ui/CodeEditor', () => ({
  CodeEditor: ({ value }: { value: string }) => <textarea aria-label="Try it code editor" value={value} readOnly />,
}));

vi.mock('../src/runner', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../src/runner')>()),
  runProgram: vi.fn(),
}));

import { runProgram } from '../src/runner';
import { TryItPanel } from '../src/features/exercises/TryItPanel';

const ok = (logs: string[], notes: string[] = []): RunResult => ({ status: 'ok', logs, tests: [], notes });

describe('TryItPanel', () => {
  it("describes this run's output, not the previous run's", async () => {
    vi.mocked(runProgram).mockResolvedValueOnce(ok(['Hello']));
    render(<TryItPanel initialCode="console.log('Hello')" />);

    await userEvent.click(screen.getByRole('button', { name: 'Run' }));
    expect(await screen.findByText('Output is below.')).toBeInTheDocument();

    vi.mocked(runProgram).mockResolvedValueOnce(ok([]));
    await userEvent.click(screen.getByRole('button', { name: 'Run' }));
    expect(await screen.findByText('Ran without errors.')).toBeInTheDocument();
  });

  it('shows notes about the run, such as cut-off output', async () => {
    vi.mocked(runProgram).mockResolvedValueOnce(ok(['line'], ['The output was cut off after 1000 lines.']));
    render(<TryItPanel initialCode="x" />);
    await userEvent.click(screen.getByRole('button', { name: 'Run' }));
    expect(await screen.findByText('The output was cut off after 1000 lines.')).toBeInTheDocument();
  });

  it('shows what a stopped program printed', async () => {
    vi.mocked(runProgram).mockResolvedValueOnce({ status: 'timeout', logs: ['count 0'], tests: [] });
    render(<TryItPanel initialCode="x" />);
    await userEvent.click(screen.getByRole('button', { name: 'Run' }));
    expect(await screen.findByText(/printed before it was stopped/)).toBeInTheDocument();
    expect(screen.getByText('count 0')).toBeInTheDocument();
  });

  it('does not blame the code when the runner could not start', async () => {
    vi.mocked(runProgram).mockResolvedValueOnce({
      status: 'unavailable',
      logs: [],
      tests: [],
      problems: [{ text: 'The TypeScript compiler could not start (Failed to fetch).' }],
    });
    render(<TryItPanel initialCode="x" />);
    await userEvent.click(screen.getByRole('button', { name: 'Run' }));
    expect(await screen.findByText('The runner could not start just now.')).toBeInTheDocument();
    expect(screen.getByText(/not a problem with your code/)).toBeInTheDocument();
    expect(screen.queryByText('One small syntax fix first.')).not.toBeInTheDocument();
  });
});

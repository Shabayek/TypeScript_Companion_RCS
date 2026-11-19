import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/platform/capabilities', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../src/platform/capabilities')>()),
  requestDownload: vi.fn(() => true),
  copyText: vi.fn(async () => true),
  canShareFile: vi.fn(() => false),
  shareFile: vi.fn(async () => 'shared' as const),
}));

import { canShareFile, copyText, requestDownload, shareFile } from '../src/platform/capabilities';
import { FULL_COURSE as ALL_LESSONS } from '../src/content/fullCourse';
import { ProgressPage } from '../src/features/progress/ProgressPage';
import { toEnvelope } from '../src/storage/model';
import { __setStateForTests, useJourney } from '../src/storage/store';
import { defaultState, type ProgressState } from '../src/storage/types';

function learner(finished: number, name = 'Ada'): ProgressState {
  const state = defaultState(1);
  state.profile = { name, onboarded: true, createdAt: 1, experience: null };
  ALL_LESSONS.slice(0, finished).forEach((lesson, i) => {
    state.lessons[lesson.id] = { status: 'completed', stepIndex: 0, steps: {}, timeMs: 1, completedAt: 1000 + i };
  });
  return state;
}

function renderProgress(state: ProgressState) {
  __setStateForTests(state);
  return render(
    <MemoryRouter>
      <ProgressPage />
    </MemoryRouter>,
  );
}

const progressFile = (state: ProgressState) =>
  new File([JSON.stringify(toEnvelope(state))], 'progress.json', { type: 'application/json' });

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  vi.mocked(requestDownload).mockReset().mockReturnValue(true);
  vi.mocked(copyText).mockReset().mockResolvedValue(true);
  vi.mocked(canShareFile).mockReset().mockReturnValue(false);
  vi.mocked(shareFile).mockReset().mockResolvedValue('shared');
});

describe('import on the Progress screen (R2)', () => {
  it('shows what the file holds and warns before replacing newer progress; nothing changes on cancel', async () => {
    const user = userEvent.setup();
    renderProgress(learner(4));

    await user.upload(screen.getByLabelText('Import a progress file'), progressFile(learner(1, 'Old')));

    const dialog = await screen.findByRole('dialog', { name: 'Replace your progress?' });
    expect(within(dialog).getByRole('row', { name: /Finished lessons 1 4/ })).toBeInTheDocument();
    expect(within(dialog).getByText(/less progress than this device/)).toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: 'Keep what I have' }));
    expect(useJourney.getState().state.profile.name).toBe('Ada');
  });

  it('replaces on confirmation, then offers undo', async () => {
    const user = userEvent.setup();
    renderProgress(learner(4));

    await user.upload(screen.getByLabelText('Import a progress file'), progressFile(learner(1, 'Old')));
    await user.click(await screen.findByRole('button', { name: 'Replace my progress' }));
    expect(useJourney.getState().state.profile.name).toBe('Old');

    await user.click(screen.getByRole('button', { name: 'Undo the last import' }));
    expect(useJourney.getState().state.profile.name).toBe('Ada');
    expect(screen.getByRole('status')).toHaveTextContent('Your earlier progress is back');
    expect(screen.queryByRole('button', { name: 'Undo the last import' })).not.toBeInTheDocument();
  });

  it('reacts when the same file is chosen a second time', async () => {
    const user = userEvent.setup();
    renderProgress(learner(1));
    const input = screen.getByLabelText<HTMLInputElement>('Import a progress file');
    const file = progressFile(learner(2, 'Twice'));

    await user.upload(input, file);
    await user.click(await screen.findByRole('button', { name: 'Keep what I have' }));
    expect(input.value).toBe('');

    await user.upload(input, file);
    expect(await screen.findByRole('dialog', { name: 'Replace your progress?' })).toBeInTheDocument();
  });
});

describe('export on the Progress screen (R4)', () => {
  it('says a download was requested, not that a file was saved, and points to the alternatives', async () => {
    const user = userEvent.setup();
    renderProgress(learner(1));

    await user.click(screen.getByRole('button', { name: 'Save a file' }));

    expect(requestDownload).toHaveBeenCalledWith(expect.stringMatching(/^typescript-companion-progress-\d{4}-\d{2}-\d{2}\.json$/), expect.any(String));
    const status = screen.getByRole('status');
    expect(status).toHaveTextContent('was asked to save');
    expect(status).toHaveTextContent('If no file appears');
    expect(status).not.toHaveTextContent(/file saved/i);
  });

  it('copies progress, and shows it for copying by hand when the clipboard is blocked', async () => {
    const user = userEvent.setup();
    renderProgress(learner(1));

    await user.click(screen.getByRole('button', { name: 'Copy progress' }));
    expect(screen.getByRole('status')).toHaveTextContent('Copied');

    vi.mocked(copyText).mockResolvedValueOnce(false);
    await user.click(screen.getByRole('button', { name: 'Copy progress' }));
    const box = screen.getByLabelText<HTMLTextAreaElement>('Your progress, as text');
    expect(JSON.parse(box.value)).toMatchObject({ app: 'typescript-companion' });
  });

  it('offers Share only where files can be shared', async () => {
    const user = userEvent.setup();
    const first = renderProgress(learner(1));
    expect(screen.queryByRole('button', { name: 'Share…' })).not.toBeInTheDocument();
    first.unmount();

    vi.mocked(canShareFile).mockReturnValue(true);
    renderProgress(learner(1));
    await user.click(screen.getByRole('button', { name: 'Share…' }));
    expect(shareFile).toHaveBeenCalled();
    expect(screen.getByRole('status')).toHaveTextContent('Shared');
  });
});

describe('certificate (R14)', () => {
  it('is dated when the course was finished, not today', () => {
    const state = learner(0);
    ALL_LESSONS.forEach((lesson, i) => {
      state.lessons[lesson.id] = { status: 'completed', stepIndex: 0, steps: {}, timeMs: 1, completedAt: Date.UTC(2026, 2, 1) + i };
    });
    state.lessons[ALL_LESSONS[0]!.id]!.completedAt = Date.UTC(2026, 2, 14, 12);
    renderProgress(state);

    const expected = new Date(Date.UTC(2026, 2, 14, 12)).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    expect(screen.getByText('TypeScript Companion — completed').closest('.card')).toHaveTextContent(expected);
  });
});

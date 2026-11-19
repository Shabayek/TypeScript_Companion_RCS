import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/platform/capabilities', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../src/platform/capabilities')>()),
  reloadApp: vi.fn(),
  isOnline: vi.fn(() => true),
}));

import { isOnline, reloadApp } from '../src/platform/capabilities';
import { lazyPanel } from '../src/ui/lazyPanel';

const EDITOR = { log: 'code editor', notLoaded: 'ui.editorNotLoaded', crashed: 'ui.editorCrashed' } as const;

function Editor({ label }: { label: string }) {
  return <p>editor: {label}</p>;
}

const chunkError = () =>
  new TypeError('Failed to fetch dynamically imported module: http://x/assets/TryItPanel-abc.js');

describe('lazyPanel', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.mocked(isOnline).mockReturnValue(true);
  });

  it('shows the fallback, then the loaded panel with its props', async () => {
    const Panel = lazyPanel(async () => Editor, EDITOR);
    render(<Panel label="one" fallback={<p>loading…</p>} />);

    expect(screen.getByText('loading…')).toBeInTheDocument();
    expect(await screen.findByText('editor: one')).toBeInTheDocument();
  });

  it('renders at once, without the fallback, after the first load', async () => {
    const load = vi.fn(async () => Editor);
    const Panel = lazyPanel(load, EDITOR);
    const first = render(<Panel label="first" fallback={<p>loading…</p>} />);
    await screen.findByText('editor: first');
    first.unmount();

    render(<Panel label="second" fallback={<p>loading…</p>} />);
    expect(screen.getByText('editor: second')).toBeInTheDocument();
    expect(screen.queryByText('loading…')).not.toBeInTheDocument();
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('keeps a failed download inside the panel: the rest of the screen still renders', async () => {
    const Panel = lazyPanel<{ label: string }>(() => Promise.reject(chunkError()), EDITOR);
    render(
      <div>
        <h2>Step prompt</h2>
        <Panel label="x" />
        <button type="button">Next</button>
      </div>,
    );

    expect(await screen.findByText('The code editor didn’t load')).toBeInTheDocument();
    expect(screen.getByText('Step prompt')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next' })).toBeInTheDocument();
    expect(screen.getByText(/Reloading usually fixes it/)).toBeInTheDocument();
  });

  it('offers a reload, which is the only way a browser refetches a failed chunk', async () => {
    const Panel = lazyPanel<{ label: string }>(() => Promise.reject(chunkError()), EDITOR);
    render(<Panel label="x" />);

    await userEvent.click(await screen.findByRole('button', { name: 'Reload the app' }));
    expect(reloadApp).toHaveBeenCalledTimes(1);
  });

  it('says so when the device is offline', async () => {
    vi.mocked(isOnline).mockReturnValue(false);
    const Panel = lazyPanel<{ label: string }>(() => Promise.reject(chunkError()), EDITOR);
    render(<Panel label="x" />);

    expect(await screen.findByText(/You are offline/)).toBeInTheDocument();
  });

  it('does not remember a failure: the next mount tries to load again', async () => {
    const load = vi.fn<() => Promise<typeof Editor>>().mockRejectedValueOnce(chunkError()).mockResolvedValue(Editor);
    const Panel = lazyPanel(load, EDITOR);
    const first = render(<Panel label="x" />);
    await screen.findByText('The code editor didn’t load');
    first.unmount();

    render(<Panel label="again" />);
    expect(await screen.findByText('editor: again')).toBeInTheDocument();
    expect(load).toHaveBeenCalledTimes(2);
  });

  it('contains a panel that crashes while rendering, and can try again', async () => {
    let broken = true;
    function Flaky() {
      if (broken) throw new Error('editor exploded');
      return <p>editor works</p>;
    }
    const Panel = lazyPanel(async () => Flaky, EDITOR);
    function Screen() {
      const [count, setCount] = useState(0);
      return (
        <div>
          <button type="button" onClick={() => setCount(count + 1)}>
            clicked {count}
          </button>
          <Panel />
        </div>
      );
    }
    render(<Screen />);

    expect(await screen.findByText('The code editor hit a problem')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'clicked 0' }));
    expect(screen.getByRole('button', { name: 'clicked 1' })).toBeInTheDocument();

    broken = false;
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(screen.getByText('editor works')).toBeInTheDocument();
  });
});

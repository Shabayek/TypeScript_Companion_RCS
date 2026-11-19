import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { FillStep, ReorderStep } from '../src/content/schema';
import { FULL_COURSE as ALL_LESSONS } from '../src/content/fullCourse';
import { AppRoutes } from '../src/routes';
import { FillExercise } from '../src/features/exercises/FillExercise';
import { ReorderExercise } from '../src/features/exercises/ReorderExercise';
import { __setStateForTests, useJourney } from '../src/storage/store';
import { defaultState, type ProgressState } from '../src/storage/types';

function lessonAt(index: number) {
  const lesson = ALL_LESSONS[index];
  if (!lesson) throw new Error('missing lesson');
  return lesson;
}
const first = lessonAt(0);
const second = lessonAt(1);

function learner(edit: (state: ProgressState) => void = () => undefined): ProgressState {
  const state = defaultState(1);
  state.profile = { name: 'Ada', onboarded: true, createdAt: 1, experience: null };
  edit(state);
  return state;
}

function renderApp(path: string, state = learner()) {
  __setStateForTests(state);
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  window.localStorage.clear();
  vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('reset dialog (B7)', () => {
  it('keeps focus in the box while RESET is typed, so the reset can be confirmed', async () => {
    const user = userEvent.setup();
    renderApp('/settings', learner((state) => {
      state.lessons[first.id] = { status: 'completed', stepIndex: 0, steps: {}, timeMs: 1 };
    }));

    await user.click(screen.getByRole('button', { name: 'Reset all progress' }));
    const box = screen.getByLabelText('Type RESET');
    await user.click(box);
    await user.type(box, 'RESET');

    expect(box).toHaveValue('RESET');
    expect(box).toHaveFocus();
    await user.click(screen.getByRole('button', { name: 'Reset everything' }));
    expect(useJourney.getState().state.lessons).toEqual({});
  });

  it('describes what reset really does: progress goes, name and settings stay', () => {
    renderApp('/settings');
    expect(screen.getByText(/Your name and settings stay as they are/)).toBeInTheDocument();
    expect(screen.queryByText(/every lesson, badge, and setting/)).not.toBeInTheDocument();
  });
});

describe('lesson player (B11)', () => {
  it('opens the next lesson fresh: no flash of its celebration screen', async () => {
    const user = userEvent.setup();
    renderApp(`/learn/${first.id}`);

    for (let i = 0; i < first.steps.length - 1; i += 1) {
      await user.click(screen.getByRole('button', { name: 'Next' }));
    }
    await user.click(screen.getByRole('button', { name: 'Finish lesson' }));
    expect(screen.getByRole('heading', { name: 'Lesson complete' })).toBeInTheDocument();

    // Watch the switch. React may update the old celebration card in place
    // (it then shows the *next* lesson's title) before removing it, so look
    // at every removed node as it was at that moment.
    const secondTitle = second.title.explorer;
    const celebratedSecond: string[] = [];
    const observer = new MutationObserver((records) => {
      for (const record of records) {
        record.removedNodes.forEach((node) => {
          const text = node.textContent ?? '';
          if (text.includes('Lesson complete') && text.includes(secondTitle)) celebratedSecond.push(text);
        });
      }
    });
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    await user.click(screen.getByRole('link', { name: 'Next lesson' }));
    await act(async () => undefined);
    observer.disconnect();

    expect(screen.getByText(`Step 1 of ${second.steps.length}`)).toBeInTheDocument();
    expect(celebratedSecond).toEqual([]);
  });

  it('opens at the saved step straight away, without grabbing focus', () => {
    renderApp(`/learn/${second.id}`, learner((state) => {
      state.lessons[first.id] = { status: 'completed', stepIndex: 0, steps: {}, timeMs: 1 };
      state.lessons[second.id] = { status: 'started', stepIndex: 2, steps: {}, timeMs: 1 };
    }));
    expect(screen.getByText(`Step 3 of ${second.steps.length}`)).toBeInTheDocument();
    expect(document.activeElement).toBe(document.body);
  });

  it('moves focus to the new step heading when the learner goes to another step', async () => {
    const user = userEvent.setup();
    renderApp(`/learn/${first.id}`);
    await user.click(screen.getByRole('button', { name: 'Next' }));
    const secondStep = first.steps[1];
    expect(document.activeElement?.id).toBe(`step-title-${secondStep?.id}`);

    await user.click(screen.getByRole('button', { name: 'Back' }));
    expect(document.activeElement?.id).toBe(`step-title-${first.steps[0]?.id}`);
  });
});

describe('locked lessons (R12)', () => {
  it('opening a locked lesson does not record it as started or as the last lesson', () => {
    const locked = lessonAt(3);
    renderApp(`/learn/${locked.id}`);

    expect(screen.getByRole('heading', { name: 'This one opens after the last one' })).toBeInTheDocument();
    const state = useJourney.getState().state;
    expect(state.lessons[locked.id]).toBeUndefined();
    expect(state.lastLessonId).toBeNull();
  });
});

describe('a way forward on every graded step (B8)', () => {
  it('offers "Stuck?" and the answer on a graded step without a hint', async () => {
    const user = userEvent.setup();
    // The first lesson's predict step has no hint of its own at the moment of writing;
    // find any graded step without one to keep the test independent of content.
    const { isGradedStep } = await import('../src/content/schema');
    const target = ALL_LESSONS.flatMap((lesson, lessonIndex) =>
      lesson.steps.map((step, stepIndex) => ({ lesson, lessonIndex, step, stepIndex })),
    ).find(({ step }) => isGradedStep(step) && !step.hint && !step.strongHint);
    if (!target) return; // every graded step has a hint: nothing to check here
    renderApp(`/learn/${target.lesson.id}`, learner((state) => {
      for (const lesson of ALL_LESSONS.slice(0, target.lessonIndex)) {
        state.lessons[lesson.id] = { status: 'completed', stepIndex: 0, steps: {}, timeMs: 1 };
      }
      state.lessons[target.lesson.id] = { status: 'started', stepIndex: target.stepIndex, steps: {}, timeMs: 1 };
    }));

    await user.click(screen.getByRole('button', { name: 'Stuck?' }));
    await user.click(screen.getByRole('button', { name: 'Show me the answer' }));
    expect(screen.getByText('Practised with the answer open')).toBeInTheDocument();
  });
});

describe('skip link (B13)', () => {
  it('moves focus to the content without changing the route', async () => {
    const user = userEvent.setup();
    renderApp(`/learn/${first.id}`);

    await user.click(screen.getByRole('link', { name: 'Skip to content' }));

    expect(document.getElementById('main')).toHaveFocus();
    expect(screen.getByText(`Step 1 of ${first.steps.length}`)).toBeInTheDocument();
    expect(screen.queryByText('That page isn’t here')).not.toBeInTheDocument();
  });
});

describe('settings that used to do nothing (B16b)', () => {
  it('hides Tess everywhere when the mascot is switched off', () => {
    const { container, unmount } = renderApp('/');
    expect(container.querySelectorAll('svg[viewBox="0 0 160 160"]').length).toBeGreaterThan(0);
    unmount();

    const quiet = renderApp('/', learner((state) => { state.settings.mascot = false; }));
    expect(quiet.container.querySelectorAll('svg[viewBox="0 0 160 160"]')).toHaveLength(0);
  });

  it('reads each step aloud as it opens when Read aloud is on', async () => {
    const spoken: string[] = [];
    class Utterance extends EventTarget {
      rate = 1;
      pitch = 1;
      constructor(public text: string) {
        super();
      }
    }
    Object.assign(window, {
      SpeechSynthesisUtterance: Utterance,
      speechSynthesis: { speak: (u: Utterance) => spoken.push(u.text), cancel: () => undefined },
    });
    try {
      const user = userEvent.setup();
      renderApp(`/learn/${first.id}`, learner((state) => { state.settings.readAloud = true; }));
      expect(spoken).toHaveLength(1);

      await user.click(screen.getByRole('button', { name: 'Next' }));
      expect(spoken).toHaveLength(2);
    } finally {
      const target = window as unknown as Record<string, unknown>;
      delete target.SpeechSynthesisUtterance;
      delete target.speechSynthesis;
    }
  });

  it('does not read anything unless Read aloud is on', () => {
    const speak = vi.fn();
    Object.assign(window, {
      SpeechSynthesisUtterance: class extends EventTarget {},
      speechSynthesis: { speak, cancel: () => undefined },
    });
    try {
      renderApp(`/learn/${first.id}`);
      expect(speak).not.toHaveBeenCalled();
      expect(screen.getByRole('button', { name: 'Read aloud' })).toBeInTheDocument();
    } finally {
      const target = window as unknown as Record<string, unknown>;
      delete target.SpeechSynthesisUtterance;
      delete target.speechSynthesis;
    }
  });
});

describe('home card (B16g)', () => {
  it('shows the step the learner will actually continue from', () => {
    renderApp('/', learner((state) => {
      state.lessons[first.id] = { status: 'started', stepIndex: 3, steps: {}, timeMs: 1 };
    }));
    expect(screen.getByText(new RegExp(`Step 4 of ${first.steps.length}`))).toBeInTheDocument();
  });
});

const reorderStep: ReorderStep = {
  id: 'reorder-braces',
  kind: 'reorder',
  prompt: { base: 'Order the lines.' },
  lines: ['function a() {', '}', 'function b() {', '}'],
};

describe('reorder exercise keyboard use (B16d)', () => {
  it('moves the focused line with the arrow keys and keeps focus on it', async () => {
    const user = userEvent.setup();
    const consoleError = vi.spyOn(console, 'error');
    render(<ReorderExercise step={reorderStep} mode="explorer" onResult={vi.fn()} revealed={false} onReveal={() => undefined} />);

    const list = screen.getByRole('list', { name: /Lines of code/ });
    const itemsBefore = within(list).getAllByRole('listitem');
    const firstLine = itemsBefore[0]!;
    const text = firstLine.querySelector('code')?.textContent;
    firstLine.focus();
    await user.keyboard('{ArrowDown}');

    const itemsAfter = within(list).getAllByRole('listitem');
    expect(itemsAfter[1]?.querySelector('code')?.textContent).toBe(text);
    expect(itemsAfter[1]).toHaveFocus();
    expect(screen.getByRole('status')).toHaveTextContent(`to position 2 of 4`);
    // Duplicate lines ("}" twice) no longer share a React key.
    expect(consoleError.mock.calls.flat().join(' ')).not.toMatch(/same key/);
  });

  it('keeps focus on an arrow button so it can be pressed again', async () => {
    const user = userEvent.setup();
    render(<ReorderExercise step={reorderStep} mode="explorer" onResult={vi.fn()} revealed={false} onReveal={() => undefined} />);
    await user.click(screen.getByRole('button', { name: 'Move line 1 down' }));
    expect(screen.getByRole('button', { name: 'Move line 2 down' })).toHaveFocus();
  });

  it('can be solved from the keyboard alone', async () => {
    const user = userEvent.setup();
    const onResult = vi.fn();
    const twoLines: ReorderStep = { id: 'r2', kind: 'reorder', prompt: { base: 'x' }, lines: ['const a = 1;', 'console.log(a);'] };
    render(<ReorderExercise step={twoLines} mode="explorer" onResult={onResult} revealed={false} onReveal={() => undefined} />);
    const items = screen.getAllByRole('listitem');
    items[0]!.focus();
    await user.keyboard('{ArrowDown}');
    await user.click(screen.getByRole('button', { name: 'Check order' }));
    expect(onResult).toHaveBeenLastCalledWith({ correct: true, revealed: false });
  });
});

const fillStep: FillStep = {
  id: 'fill-two',
  kind: 'fill',
  prompt: { base: 'Fill the blanks.' },
  template: 'const size: ___ = ___;',
  bank: ['number', 'string', '5'],
  answers: ['number', '5'],
};

describe('fill exercise token bank (B16f)', () => {
  it('does not overwrite a filled blank when every blank is full', async () => {
    const user = userEvent.setup();
    render(<FillExercise step={fillStep} mode="explorer" onResult={vi.fn()} revealed={false} onReveal={() => undefined} />);
    await user.selectOptions(screen.getByLabelText('Blank 1'), 'number');
    await user.selectOptions(screen.getByLabelText('Blank 2'), '5');

    fireEvent.click(screen.getByRole('button', { name: 'string', hidden: true }));

    expect(screen.getByLabelText('Blank 1')).toHaveValue('number');
    expect(screen.getByText(/Every blank is filled/)).toBeInTheDocument();
  });

  it('cannot change a solved answer through the bank', async () => {
    const user = userEvent.setup();
    render(<FillExercise step={fillStep} mode="explorer" onResult={vi.fn()} revealed={false} onReveal={() => undefined} />);
    await user.selectOptions(screen.getByLabelText('Blank 1'), 'number');
    await user.selectOptions(screen.getByLabelText('Blank 2'), '5');
    await user.click(screen.getByRole('button', { name: 'Check answer' }));

    expect(screen.getByRole('button', { name: 'string', hidden: true })).toBeDisabled();
  });
});

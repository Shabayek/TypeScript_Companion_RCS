import { useEffect, useMemo, useRef, useState } from 'react';
import {
  MAZE_MOVES,
  PET_ACTIONS,
  type MazeMove,
  type PetAction,
  type PlayGame,
  type TodoAction,
} from '../../content/schema';
import { dataLines, parseData, textLines, type PlayInput } from '../../content/play';
import type { GradeOutcome } from '../../runner';
import { shouldAnimate } from '../../platform/capabilities';
import { useJourney } from '../../storage/store';
import { Button } from '../../ui/Button';
import { useT } from '../../i18n/t';
import styles from './exercises.module.css';

/*
 * The Studio games added with the bigger course: a robot maze, a pet, a to-do
 * list, a turn-based battle and a text adventure. Each one turns what the
 * player does into an `input`, runs the learner's program with it (their own
 * functions plus the lesson's driver), and draws the screen from what the
 * program prints: `@tag` lines are data, every other line is text.
 */

export interface GameRunner {
  lines: readonly string[];
  problem: GradeOutcome | null;
  running: boolean;
  program: string;
  play: (input: PlayInput) => Promise<void>;
}

/** The program's text output (data lines are drawn by each game instead). */
export function Screen({ runner, label, last }: { runner: GameRunner; label: string; last?: number }) {
  const { t } = useT();
  if (runner.problem) return null;
  const all = textLines(runner.lines);
  const lines = last ? all.slice(-last) : all;
  return (
    <output className={styles.gameScreen} aria-live="polite" aria-label={label} aria-busy={runner.running}>
      {lines.length === 0 ? (
        <span className="muted">{runner.running ? t('game.running') : t('game.nothingYet')}</span>
      ) : (
        lines.map((line, index) => <span key={index}>{line}</span>)
      )}
    </output>
  );
}

/** Re-runs the program whenever the input changes (after a short pause). */
function useReplay(runner: GameRunner, input: PlayInput | null, key: string) {
  const { play } = runner;
  useEffect(() => {
    if (!input) return;
    const timer = setTimeout(() => void play(input), 120);
    return () => clearTimeout(timer);
    // `key` stands for the input's content.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, play]);
}

/* ----------------------------- maze ----------------------------- */

type Maze = Extract<PlayGame, { type: 'maze' }>;

const ARROWS: Record<MazeMove, string> = { up: '↑', down: '↓', left: '←', right: '→' };
const MOVE_LABEL = { up: 'game.moveUp', down: 'game.moveDown', left: 'game.moveLeft', right: 'game.moveRight' } as const;
const MAX_MOVES = 40;

function findChar(rows: readonly string[], char: string): { x: number; y: number } | null {
  for (let y = 0; y < rows.length; y += 1) {
    const x = rows[y]?.indexOf(char) ?? -1;
    if (x >= 0) return { x, y };
  }
  return null;
}

function MazeGrid({ rows, trail, label }: { rows: readonly string[]; trail: ReadonlySet<string>; label: string }) {
  const columns = rows[0]?.length ?? 0;
  return (
    <div className={styles.mazeGrid} style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }} role="img" aria-label={label}>
      {rows.flatMap((row, y) =>
        [...row].map((cell, x) => {
          const kind = cell === '#' ? 'wall' : cell === 'R' ? 'robot' : cell === '*' ? 'star' : trail.has(`${x},${y}`) ? 'trail' : 'floor';
          return (
            <span key={`${x},${y}`} className={styles.mazeCell} data-kind={kind} aria-hidden="true">
              {kind === 'robot' ? '🤖' : kind === 'star' ? '⭐' : kind === 'trail' ? '·' : ''}
            </span>
          );
        }),
      )}
    </div>
  );
}

export function MazeGame({ game, runner }: { game: Maze; runner: GameRunner }) {
  const { t } = useT();
  const reduceMotion = useJourney((store) => store.state.settings.reduceMotion);
  const [level, setLevel] = useState(0);
  const [moves, setMoves] = useState<readonly MazeMove[]>([]);
  const [ran, setRan] = useState(false);
  const [frame, setFrame] = useState(0);
  const rows = game.levels[level] ?? [];

  const frames = useMemo(
    () => (ran ? dataLines(runner.lines, 'grid').map((payload) => payload.split('/')) : []),
    [ran, runner.lines],
  );

  // Play the frames one after another (all at once with reduced motion).
  useEffect(() => {
    if (frames.length === 0) return;
    if (!shouldAnimate(reduceMotion)) {
      setFrame(frames.length - 1);
      return;
    }
    setFrame(0);
    const timer = setInterval(() => {
      setFrame((current) => {
        if (current >= frames.length - 1) {
          clearInterval(timer);
          return current;
        }
        return current + 1;
      });
    }, 380);
    return () => clearInterval(timer);
  }, [frames, reduceMotion]);

  const shown = frames[Math.min(frame, frames.length - 1)] ?? rows;
  const trail = new Set<string>();
  for (const earlier of frames.slice(0, frame)) {
    const at = findChar(earlier, 'R');
    if (at) trail.add(`${at.x},${at.y}`);
  }
  const robot = findChar(shown, 'R');
  const alt = robot
    ? t('game.mazeAlt', { column: robot.x + 1, row: robot.y + 1 })
    : t('game.mazeAltNoRobot');

  const edit = (next: readonly MazeMove[]) => {
    setMoves(next);
    setRan(false);
  };

  return (
    <div className={styles.wrap}>
      {game.levels.length > 1 ? (
        <div className={styles.gameChips} role="radiogroup" aria-label={t('game.levels')}>
          {game.levels.map((_, index) => (
            <Button
              key={index}
              size="sm"
              variant={index === level ? 'primary' : 'default'}
              role="radio"
              aria-checked={index === level}
              onClick={() => {
                setLevel(index);
                edit([]);
              }}
            >
              {t('game.level', { number: index + 1 })}
            </Button>
          ))}
        </div>
      ) : null}

      <MazeGrid rows={shown} trail={trail} label={alt} />
      {frames.length > 1 ? (
        <p className={styles.choiceHint} role="status">
          {t('game.frameOf', { current: Math.min(frame, frames.length - 1), total: frames.length - 1 })}
        </p>
      ) : null}

      <div className={styles.mazePad} role="group" aria-label={t('game.addMove')}>
        {MAZE_MOVES.map((move) => (
          <Button
            key={move}
            size="sm"
            disabled={moves.length >= MAX_MOVES}
            onClick={() => edit([...moves, move])}
          >
            <span aria-hidden="true">{ARROWS[move]}</span> {t(MOVE_LABEL[move])}
          </Button>
        ))}
      </div>

      <div className={styles.field}>
        <span className={styles.fieldLabel} id="maze-program">
          {t('game.robotProgram')}
        </span>
        <ol className={styles.mazeProgram} aria-labelledby="maze-program">
          {moves.length === 0 ? <li className="muted">{t('game.mazeEmpty')}</li> : null}
          {moves.map((move, index) => (
            <li key={index}>
              <span aria-hidden="true">{ARROWS[move]}</span>
              <span className="sr-only">{t(MOVE_LABEL[move])}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className={styles.actions}>
        <Button
          variant="primary"
          disabled={moves.length === 0 || runner.running}
          onClick={() => {
            setRan(true);
            void runner.play({ level: level + 1, maze: rows, moves });
          }}
        >
          {t('game.runRobot')}
        </Button>
        <Button variant="ghost" disabled={moves.length === 0} onClick={() => edit(moves.slice(0, -1))}>
          {t('game.undo')}
        </Button>
        <Button variant="ghost" disabled={moves.length === 0} onClick={() => edit([])}>
          {t('game.clear')}
        </Button>
        {ran && frames.length > 1 ? (
          <Button variant="ghost" onClick={() => setRan(false)}>
            {t('game.mapAgain')}
          </Button>
        ) : null}
      </div>

      {ran ? <Screen runner={runner} label={t('game.robotSays')} /> : null}
    </div>
  );
}

/* ------------------------------ pet ------------------------------ */

type Pet = Extract<PlayGame, { type: 'pet' }>;

interface PetState {
  hunger: number;
  energy: number;
  fun: number;
  mood: string;
}

const PET_FACES: Record<string, string> = {
  happy: '😄',
  hungry: '😋',
  sleepy: '😴',
  bored: '😐',
  sad: '😢',
  full: '😊',
};
const PET_LABEL = { feed: 'game.petFeed', play: 'game.petPlay', rest: 'game.petRest', wait: 'game.petWait' } as const;
const PET_ICON: Record<PetAction, string> = { feed: '🍎', play: '🎾', rest: '💤', wait: '⏳' };

export function PetGame({ game, runner }: { game: Pet; runner: GameRunner }) {
  const { t } = useT();
  const [name, setName] = useState(game.name);
  const [actions, setActions] = useState<readonly PetAction[]>([]);
  const petName = name.trim() || game.name;
  useReplay(runner, { name: petName, actions }, `${petName}|${actions.join(',')}`);

  const states = dataLines(runner.lines, 'pet')
    .map((payload) => parseData<PetState>(payload))
    .filter((state): state is PetState => state !== null);
  const state = states[states.length - 1];
  const meter = (key: 'hunger' | 'energy' | 'fun', label: string) => {
    const value = Math.max(0, Math.min(100, Number(state?.[key] ?? 0)));
    return (
      <div className={styles.petMeter}>
        <label htmlFor={`pet-${key}`}>{label}</label>
        <meter id={`pet-${key}`} min={0} max={100} low={25} high={75} optimum={key === 'hunger' ? 0 : 100} value={value} />
        <span>{value}</span>
      </div>
    );
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.field}>
        <label className={styles.fieldLabel} htmlFor="pet-name">
          {t('game.petName')}
        </label>
        <input id="pet-name" className="input" value={name} maxLength={20} onChange={(event) => setName(event.target.value)} />
      </div>

      <div className={styles.petCard}>
        <span className={styles.petFace} aria-hidden="true">
          {state ? (PET_FACES[state.mood] ?? '🙂') : '🥚'}
        </span>
        <div className={styles.petStats}>
          <strong>
            {petName}
            {state ? ` · ${t('game.petMood', { mood: state.mood })}` : ''}
          </strong>
          {meter('hunger', t('game.hunger'))}
          {meter('energy', t('game.energy'))}
          {meter('fun', t('game.fun'))}
        </div>
      </div>

      <div className={styles.gameChips} role="group" aria-label={t('game.petActions')}>
        {PET_ACTIONS.map((action) => (
          <Button key={action} onClick={() => setActions((current) => [...current, action].slice(-60))}>
            <span aria-hidden="true">{PET_ICON[action]}</span> {t(PET_LABEL[action])}
          </Button>
        ))}
        <Button variant="ghost" disabled={actions.length === 0} onClick={() => setActions([])}>
          {t('game.startOver')}
        </Button>
      </div>

      <Screen runner={runner} label={t('game.petDiary')} last={5} />
    </div>
  );
}

/* ------------------------------ todo ------------------------------ */

type Todo = Extract<PlayGame, { type: 'todo' }>;

interface TodoItem {
  id: number;
  text: string;
  done: boolean;
}

export function TodoGame({ game, runner }: { game: Todo; runner: GameRunner }) {
  const { t } = useT();
  const [actions, setActions] = useState<readonly TodoAction[]>([]);
  const [text, setText] = useState('');
  useReplay(runner, { actions }, JSON.stringify(actions));

  const lists = dataLines(runner.lines, 'todos').map((payload) => parseData<TodoItem[]>(payload));
  const todos = (lists[lists.length - 1] ?? []).filter(
    (item): item is TodoItem => typeof item === 'object' && item !== null && typeof item.id === 'number',
  );
  const send = (action: TodoAction) => setActions((current) => [...current, action].slice(-100));

  return (
    <div className={styles.wrap}>
      <form
        className={styles.todoForm}
        onSubmit={(event) => {
          event.preventDefault();
          if (!text.trim()) return;
          send({ type: 'add', text: text.trim() });
          setText('');
        }}
      >
        <div className={styles.field}>
          <label className={styles.fieldLabel} htmlFor="todo-text">
            {t('game.todoNew')}
          </label>
          <input id="todo-text" className="input" value={text} maxLength={60} onChange={(event) => setText(event.target.value)} />
        </div>
        <Button type="submit" disabled={!text.trim()}>
          {t('game.add')}
        </Button>
      </form>

      <div className={styles.gameChips} role="group" aria-label={t('game.quickAdd')}>
        {game.suggestions.map((suggestion) => (
          <Button key={suggestion} size="sm" onClick={() => send({ type: 'add', text: suggestion })}>
            + {suggestion}
          </Button>
        ))}
      </div>

      {todos.length > 0 ? (
        <ul className={styles.gameList} aria-label={t('game.todoList')}>
          {todos.map((item) => (
            <li key={item.id}>
              <label className={styles.todoItem} data-done={item.done}>
                <input type="checkbox" checked={item.done} onChange={() => send({ type: 'toggle', id: item.id })} />
                <span>{String(item.text)}</span>
              </label>
              <Button
                size="sm"
                variant="ghost"
                aria-label={t('game.removeItem', { item: String(item.text) })}
                onClick={() => send({ type: 'remove', id: item.id })}
              >
                {t('game.remove')}
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted">{t('game.todoEmpty')}</p>
      )}

      <div className={styles.actions}>
        <Button variant="ghost" disabled={!todos.some((item) => item.done)} onClick={() => send({ type: 'clearDone' })}>
          {t('game.clearDone')}
        </Button>
        <Button variant="ghost" disabled={actions.length === 0} onClick={() => setActions([])}>
          {t('game.startOver')}
        </Button>
      </div>

      <Screen runner={runner} label={t('game.todoSummary')} last={3} />
    </div>
  );
}

/* ----------------------------- battle ----------------------------- */

type Battle = Extract<PlayGame, { type: 'battle' }>;

interface Health {
  hero: number;
  rival: number;
  max: number;
}

const newSeed = () => Math.floor(Math.random() * 100_000);

export function BattleGame({ game, runner }: { game: Battle; runner: GameRunner }) {
  const { t } = useT();
  const [moves, setMoves] = useState<readonly string[]>([]);
  const [seed, setSeed] = useState(newSeed);
  useReplay(runner, { moves, seed }, `${seed}|${moves.join(',')}`);

  const health = dataLines(runner.lines, 'hp')
    .map((payload) => parseData<Health>(payload))
    .filter((item): item is Health => item !== null);
  const now = health[health.length - 1];
  const max = Math.max(1, Number(now?.max ?? 100));
  const over = now !== undefined && (now.hero <= 0 || now.rival <= 0);
  const bar = (who: 'hero' | 'rival', label: string) => {
    const value = Math.max(0, Math.min(max, Number(now?.[who] ?? max)));
    return (
      <div className={styles.petMeter}>
        <label htmlFor={`battle-${who}`}>{label}</label>
        <meter id={`battle-${who}`} min={0} max={max} low={max / 4} high={max / 2} optimum={max} value={value} />
        <span>{value}</span>
      </div>
    );
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.battleField}>
        {bar('hero', t('game.hero'))}
        {bar('rival', t('game.rival'))}
      </div>
      <div className={styles.gameChips} role="group" aria-label={t('game.yourMove')}>
        {game.moves.map((move) => (
          <Button key={move} variant="primary" disabled={over || runner.running} onClick={() => setMoves((current) => [...current, move])}>
            {move}
          </Button>
        ))}
        <Button
          variant="ghost"
          onClick={() => {
            setMoves([]);
            setSeed(newSeed());
          }}
        >
          {t('game.newBattle')}
        </Button>
      </div>
      <Screen runner={runner} label={t('game.battleLog')} last={6} />
    </div>
  );
}

/* --------------------------- adventure --------------------------- */

type Adventure = Extract<PlayGame, { type: 'adventure' }>;

export function AdventureGame({ game, runner }: { game: Adventure; runner: GameRunner }) {
  const { t } = useT();
  const [commands, setCommands] = useState<readonly string[]>([]);
  const [text, setText] = useState('');
  const log = useRef<HTMLDivElement>(null);
  useReplay(runner, { commands }, commands.join('\u0000'));

  const lines = textLines(runner.lines);
  useEffect(() => {
    const box = log.current;
    if (box) box.scrollTop = box.scrollHeight;
  }, [lines.length]);
  const send = (command: string) => {
    const clean = command.trim();
    if (clean) setCommands((current) => [...current, clean].slice(-80));
  };

  return (
    <div className={styles.wrap}>
      {/* The whole story so far; only what is new is announced. */}
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex */}
      <div ref={log} className={`${styles.gameScreen} ${styles.adventureLog}`} tabIndex={0} aria-label={t('game.adventureLog')}>
        {runner.problem ? null : lines.length === 0 ? (
          <span className="muted">{runner.running ? t('game.running') : t('game.nothingYet')}</span>
        ) : (
          lines.map((line, index) => <span key={index}>{line}</span>)
        )}
      </div>
      <p className="sr-only" aria-live="polite">
        {lines.slice(-2).join(' ')}
      </p>
      <form
        className={styles.todoForm}
        onSubmit={(event) => {
          event.preventDefault();
          send(text);
          setText('');
        }}
      >
        <div className={styles.field}>
          <label className={styles.fieldLabel} htmlFor="adventure-command">
            {t('game.whatNow')}
          </label>
          <input
            id="adventure-command"
            className="input"
            dir="ltr"
            autoCapitalize="off"
            autoComplete="off"
            value={text}
            maxLength={60}
            onChange={(event) => setText(event.target.value)}
          />
        </div>
        <Button type="submit" disabled={!text.trim()}>
          {t('game.send')}
        </Button>
      </form>
      <div className={styles.gameChips} role="group" aria-label={t('game.tryCommands')}>
        {game.suggestions.map((suggestion) => (
          <Button key={suggestion} size="sm" onClick={() => send(suggestion)}>
            {suggestion}
          </Button>
        ))}
        <Button size="sm" variant="ghost" disabled={commands.length === 0} onClick={() => setCommands([])}>
          {t('game.startOver')}
        </Button>
      </div>
    </div>
  );
}

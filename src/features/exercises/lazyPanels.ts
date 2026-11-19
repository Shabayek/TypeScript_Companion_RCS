import { lazyPanel, type PanelNames } from '../../ui/lazyPanel';

const EDITOR: PanelNames = { log: 'code editor', notLoaded: 'ui.editorNotLoaded', crashed: 'ui.editorCrashed' };

/**
 * The code editor and runner are a separate download. They are shared here so
 * that once loaded they render instantly everywhere, and so that a failed
 * download stays inside the step instead of crashing the app (see lazyPanel).
 */
export const LazyCodeExercise = lazyPanel(
  () => import('./CodeExercise').then((module) => module.CodeExercise),
  EDITOR,
);

export const LazyTryItPanel = lazyPanel(
  () => import('./TryItPanel').then((module) => module.TryItPanel),
  EDITOR,
);

export const LazyGamePanel = lazyPanel(
  () => import('./GamePanel').then((module) => module.GamePanel),
  { log: 'game', notLoaded: 'ui.gameNotLoaded', crashed: 'ui.gameCrashed' },
);

import type { Engine } from '../content/schema';
import { useJourney } from '../storage/store';
import { detectEngine, effectiveEngine } from './capabilities';

/** What this device runs; it cannot change while the app is open. */
let detected: Engine | null = null;

export function detectedEngine(): Engine {
  detected ??= detectEngine();
  return detected;
}

/**
 * The engine lessons are shown, run and type-checked for right now: the
 * Settings choice, never Modern on a device that is Classic.
 */
export function useEngine(): Engine {
  const setting = useJourney((store) => store.state.settings.engine);
  return effectiveEngine(setting, detectedEngine());
}

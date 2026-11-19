import { useCallback } from 'react';
import { playSound, type SoundKind } from '../../platform/capabilities';
import { useJourney } from '../../storage/store';

/**
 * Sound for a moment that deserves one, if the learner turned sounds on and
 * is not in Quiet mode. Always call from a user action.
 */
export function useSound(): (kind: SoundKind) => void {
  const sound = useJourney((store) => store.state.settings.sound);
  const quiet = useJourney((store) => store.state.settings.quiet);
  return useCallback(
    (kind: SoundKind) => {
      if (sound && !quiet) playSound(kind);
    },
    [sound, quiet],
  );
}

/** Celebration visuals are on unless the learner chose Quiet mode. */
export function useCelebrationsOn(): boolean {
  return !useJourney((store) => store.state.settings.quiet);
}

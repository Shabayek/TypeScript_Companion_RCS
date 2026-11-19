import type { ReactNode } from 'react';
import { useJourney } from '../../storage/store';
import { Mascot, type MascotPose } from '../../ui/Mascot';
import styles from './motivation.module.css';

/**
 * Tess with a speech bubble. The words are real text; Tess herself is
 * decorative. With the mascot turned off, the words stay, without the bubble.
 */
export function TessSays({
  pose = 'idle',
  size = 56,
  children,
  hidden = false,
}: {
  pose?: MascotPose;
  size?: number;
  children: ReactNode;
  /** For echoes of feedback a screen reader already heard. */
  hidden?: boolean;
}) {
  const mascot = useJourney((store) => store.state.settings.mascot);
  return (
    <div className={styles.says} data-mascot={mascot} aria-hidden={hidden || undefined}>
      {mascot ? <Mascot pose={pose} size={size} /> : null}
      <p className={styles.bubble}>{children}</p>
    </div>
  );
}

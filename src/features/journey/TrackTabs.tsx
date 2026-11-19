import { useRef, type KeyboardEvent } from 'react';
import type { Track } from '../../content/schema';
import { useT } from '../../i18n/t';
import styles from './journey.module.css';

export const trackTabId = (track: Track) => `track-tab-${track}`;
export const trackPanelId = (track: Track) => `track-panel-${track}`;

/**
 * Foundations / Intermediate / Advanced. A standard tablist: arrow keys move
 * between tabs (and select them), Home and End jump to the ends, and only the
 * selected tab is in the tab order.
 */
export function TrackTabs({
  tracks,
  selected,
  onSelect,
}: {
  tracks: readonly Track[];
  selected: Track;
  onSelect: (track: Track) => void;
}) {
  const { t } = useT();
  const refs = useRef(new Map<Track, HTMLButtonElement>());

  const move = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let next = index;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % tracks.length;
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (index - 1 + tracks.length) % tracks.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = tracks.length - 1;
    else return;
    event.preventDefault();
    const track = tracks[next];
    if (!track) return;
    onSelect(track);
    refs.current.get(track)?.focus();
  };

  return (
    <div className={styles.tabs} role="tablist" aria-label={t('tracks.label')}>
      {tracks.map((track, index) => {
        const active = track === selected;
        return (
          <button
            key={track}
            ref={(element) => {
              if (element) refs.current.set(track, element);
              else refs.current.delete(track);
            }}
            type="button"
            role="tab"
            id={trackTabId(track)}
            aria-selected={active}
            aria-controls={trackPanelId(track)}
            tabIndex={active ? 0 : -1}
            className={styles.tab}
            data-track={track}
            onClick={() => onSelect(track)}
            onKeyDown={(event) => move(event, index)}
          >
            {t(`tracks.${track}`)}
          </button>
        );
      })}
    </div>
  );
}

const COLOURS = ['var(--accent)', 'var(--warm)', 'var(--indigo)', 'var(--rose)', 'var(--moss)', 'var(--sky)'];

/**
 * Falling paper, drawn with CSS only. Decorative, and gone entirely when the
 * learner (or their device) asks for less motion.
 */
export function Confetti({ pieces = 12, accent }: { pieces?: number; accent?: string | undefined }) {
  return (
    <div className="confetti" aria-hidden="true">
      {Array.from({ length: pieces }, (_, i) => (
        <span
          key={i}
          style={{
            left: `${4 + ((i * 92) / Math.max(1, pieces - 1))}%`,
            background: accent && i % 2 === 0 ? accent : COLOURS[i % COLOURS.length],
            animationDelay: `${(i % 6) * 80}ms`,
          }}
        />
      ))}
    </div>
  );
}

/** A small star burst for a right answer: eight sparks flying out from the centre. */
export function Burst() {
  return (
    <span className="burst" aria-hidden="true">
      {Array.from({ length: 8 }, (_, i) => (
        <span key={i} style={{ transform: `rotate(${i * 45}deg)` }} />
      ))}
    </span>
  );
}

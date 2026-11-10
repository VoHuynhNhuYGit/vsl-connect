type AnimatedBackdropProps = { variant?: 'page' | 'hero' | 'banner' | 'collection' };

/** Decorative CSS motion only: no canvas loop, pointer listeners or camera access. */
export function AnimatedBackdrop({ variant = 'page' }: AnimatedBackdropProps) {
  return <div className={`ambient-backdrop ambient-backdrop--${variant}`} aria-hidden="true">
    <span className="ambient-glow ambient-glow--one" />
    <span className="ambient-glow ambient-glow--two" />
    <span className="ambient-orbit ambient-orbit--one" />
    <span className="ambient-orbit ambient-orbit--two" />
    <span className="ambient-motif ambient-motif--one" />
    <span className="ambient-motif ambient-motif--two" />
    <span className="ambient-spark ambient-spark--one" />
    <span className="ambient-spark ambient-spark--two" />
    <span className="ambient-spark ambient-spark--three" />
  </div>;
}

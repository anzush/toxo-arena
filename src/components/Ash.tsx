import type { CSSProperties } from "react";

const PIECE_COUNT = 9;

/** Ceniza escasa y lenta cayendo sobre el marcador de derrota. */
export function Ash() {
  const pieces = Array.from({ length: PIECE_COUNT }, (_, i) => ({
    key: i,
    left: 6 + ((i * 71) % 88),
    delay: (i % 5) * 0.35,
    dx: i % 2 === 0 ? 14 : -14,
  }));

  return (
    <div className="ash-field" aria-hidden="true">
      {pieces.map((p) => (
        <span
          key={p.key}
          className="ash-piece"
          style={
            {
              "--x": `${p.left}%`,
              "--delay": `${p.delay}s`,
              "--dx": `${p.dx}px`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}

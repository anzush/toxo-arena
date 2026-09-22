import type { CSSProperties } from "react";

const PIECE_COUNT = 18;

/** Lluvia de confeti sobre el marcador de victoria — dorado + el color del equipo campeón. */
export function Confetti({ color }: { color: string }) {
  const pieces = Array.from({ length: PIECE_COUNT }, (_, i) => ({
    key: i,
    left: 3 + ((i * 53) % 94),
    delay: (i % 9) * 0.11,
    spin: 360 + (i % 4) * 140,
    gold: i % 2 === 0,
  }));

  return (
    <div className="confetti-field" aria-hidden="true">
      {pieces.map((p) => (
        <span
          key={p.key}
          className="confetti-piece"
          style={
            {
              "--x": `${p.left}%`,
              "--delay": `${p.delay}s`,
              "--spin": `${p.spin}deg`,
              "--c": p.gold ? "var(--gold)" : color,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}

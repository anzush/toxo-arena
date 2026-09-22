import { useEffect, useState } from "react";
import { usePrevious } from "../hooks/usePrevious";
import { STARTING_LIVES_PER_PLAYER } from "../types";

export function Hearts({
  lives,
  max = STARTING_LIVES_PER_PLAYER,
  size = 20,
}: {
  lives: number;
  max?: number;
  size?: number;
}) {
  const prevLives = usePrevious(lives);
  const [delta, setDelta] = useState(0);

  useEffect(() => {
    if (prevLives === undefined || prevLives === lives) return;
    setDelta(lives - prevLives);
    const timer = setTimeout(() => setDelta(0), 800);
    return () => clearTimeout(timer);
  }, [lives, prevLives]);

  return (
    <div
      className={delta < 0 ? "shake" : undefined}
      style={{ display: "flex", gap: 4, position: "relative" }}
    >
      {delta !== 0 && (
        <span
          className="float-badge"
          style={{
            position: "absolute",
            top: -4,
            left: "50%",
            transform: "translateX(-50%)",
            fontFamily: "'Fredoka', sans-serif",
            fontSize: size * 0.85,
            fontWeight: 700,
            color: delta > 0 ? "var(--success)" : "var(--danger)",
            pointerEvents: "none",
            whiteSpace: "nowrap",
          }}
        >
          {delta > 0 ? `+${delta}` : delta}
        </span>
      )}
      {Array.from({ length: max }).map((_, i) =>
        i < lives ? (
          <svg
            key={i}
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="#FFC857"
          >
            <path d="M12 21s-6.716-4.35-9.428-8.03C.86 10.42 1.2 7.2 3.6 5.4c2.1-1.58 4.9-1.2 6.4.9l2 2.4 2-2.4c1.5-2.1 4.3-2.48 6.4-.9 2.4 1.8 2.74 5.02 1.03 7.57C18.716 16.65 12 21 12 21z" />
          </svg>
        ) : (
          <svg
            key={i}
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="rgba(245,243,250,0.25)"
            strokeWidth={2}
          >
            <path d="M12 21s-6.716-4.35-9.428-8.03C.86 10.42 1.2 7.2 3.6 5.4c2.1-1.58 4.9-1.2 6.4.9l2 2.4 2-2.4c1.5-2.1 4.3-2.48 6.4-.9 2.4 1.8 2.74 5.02 1.03 7.57C18.716 16.65 12 21 12 21z" />
          </svg>
        ),
      )}
    </div>
  );
}

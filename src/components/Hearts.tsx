import { STARTING_LIVES } from "../types";

export function Hearts({ lives, size = 22 }: { lives: number; size?: number }) {
  return (
    <div style={{ display: "flex", gap: 6 }}>
      {Array.from({ length: STARTING_LIVES }).map((_, i) =>
        i < lives ? (
          <svg key={i} width={size} height={size} viewBox="0 0 24 24" fill="#FFC857">
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
        )
      )}
    </div>
  );
}

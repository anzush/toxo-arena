import type { CSSProperties } from "react";
import { LifeEvent } from "../hooks/useLifeEvents";
import { STARTING_LIVES_PER_PLAYER } from "../types";

const SHARD_ANGLES = [-50, -15, 20, 55, 110, 150, -100];

export function Hearts({
  lives,
  max = STARTING_LIVES_PER_PLAYER,
  size = 20,
  event,
}: {
  lives: number;
  max?: number;
  size?: number;
  event?: LifeEvent | null;
}) {
  const isLoss = event?.type === "hit" || event?.type === "died";
  // Los corazones que acaban de vaciarse: de `lives` a `lives + delta - 1`.
  const lostFrom = isLoss ? lives : -1;
  const lostTo = isLoss ? lives + (event?.delta ?? 0) - 1 : -1;

  return (
    <div
      style={{ display: "flex", gap: 4 }}
      className={isLoss ? "life-shake" : undefined}
    >
      {Array.from({ length: max }).map((_, i) => {
        const breaking = isLoss && i >= lostFrom && i <= lostTo;
        if (breaking) {
          return (
            <span key={i} className="heart-breaking">
              <HeartIcon size={size} filled className="heart-crack-fill" />
              {SHARD_ANGLES.map((angle, s) => (
                <span
                  key={s}
                  className="heart-shard"
                  style={
                    {
                      "--sx": `${Math.cos((angle * Math.PI) / 180) * (size * 1.4)}px`,
                      "--sy": `${Math.sin((angle * Math.PI) / 180) * (size * 1.4)}px`,
                      animationDelay: `${s * 15}ms`,
                    } as CSSProperties
                  }
                />
              ))}
            </span>
          );
        }
        return <HeartIcon key={i} size={size} filled={i < lives} />;
      })}
    </div>
  );
}

function HeartIcon({
  size,
  filled,
  className,
}: {
  size: number;
  filled: boolean;
  className?: string;
}) {
  return filled ? (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="#FFC857"
    >
      <path d="M12 21s-6.716-4.35-9.428-8.03C.86 10.42 1.2 7.2 3.6 5.4c2.1-1.58 4.9-1.2 6.4.9l2 2.4 2-2.4c1.5-2.1 4.3-2.48 6.4-.9 2.4 1.8 2.74 5.02 1.03 7.57C18.716 16.65 12 21 12 21z" />
    </svg>
  ) : (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="rgba(245,243,250,0.25)"
      strokeWidth={2}
    >
      <path d="M12 21s-6.716-4.35-9.428-8.03C.86 10.42 1.2 7.2 3.6 5.4c2.1-1.58 4.9-1.2 6.4.9l2 2.4 2-2.4c1.5-2.1 4.3-2.48 6.4-.9 2.4 1.8 2.74 5.02 1.03 7.57C18.716 16.65 12 21 12 21z" />
    </svg>
  );
}

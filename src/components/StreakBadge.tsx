import { ROUND_WIN_STREAK_BONUS } from "../types";

/** Cuántas rondas seguidas lleva ganando un jugador — solo se muestra si va en camino a la vida extra. */
export function StreakBadge({ streak, size = 11 }: { streak: number; size?: number }) {
  if (streak <= 0) return null;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 2,
        fontSize: size,
        color: "var(--gold)",
        fontWeight: 700,
      }}
      title={`${streak} de ${ROUND_WIN_STREAK_BONUS} rondas seguidas`}
    >
      🔥 {streak}
    </div>
  );
}

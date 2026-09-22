import { PlayerState, TeamState } from "../types";
import { isAlive } from "../lib/gameEngine";

export function TeamPill({
  team,
  players,
  highlighted,
  compact,
}: {
  team: TeamState;
  players: Record<string, PlayerState>;
  highlighted?: boolean;
  compact?: boolean;
}) {
  const total = team.playerIds.length;
  const alive = team.playerIds.filter((id) => isAlive(players[id])).length;
  const eliminated = total > 0 && alive === 0;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        background: "#1E1B33",
        border: `${highlighted ? 2 : 1}px solid ${highlighted ? team.color : "rgba(255,255,255,0.1)"}`,
        borderRadius: 14,
        padding: compact ? "8px 14px" : "12px 18px",
        opacity: eliminated ? 0.5 : 1,
      }}
    >
      <div
        style={{
          width: 10,
          height: 10,
          borderRadius: "50%",
          background: team.color,
          flex: "none",
        }}
      />
      <span
        style={{
          fontFamily: "'Fredoka', sans-serif",
          fontWeight: 600,
          fontSize: compact ? 13 : 15,
        }}
      >
        {team.name}
      </span>
      <span style={{ fontSize: compact ? 12 : 13, color: "var(--text-muted)" }}>
        {eliminated ? "eliminado" : `${alive}/${total} en pie`}
      </span>
    </div>
  );
}

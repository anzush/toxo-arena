import { TeamState } from "../types";
import { Hearts } from "./Hearts";

export function TeamPill({
  team,
  highlighted,
  compact
}: {
  team: TeamState;
  highlighted?: boolean;
  compact?: boolean;
}) {
  const eliminated = team.lives === 0;
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
        opacity: eliminated ? 0.5 : 1
      }}
    >
      <div style={{ width: 10, height: 10, borderRadius: "50%", background: team.color, flex: "none" }} />
      <span style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600, fontSize: compact ? 13 : 15 }}>
        {team.name}
      </span>
      <Hearts lives={team.lives} size={compact ? 14 : 18} />
    </div>
  );
}

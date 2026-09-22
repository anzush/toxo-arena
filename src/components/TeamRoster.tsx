import { ROLES } from "../data/roles";
import { LifeEvent } from "../hooks/useLifeEvents";
import { isAlive } from "../lib/gameEngine";
import { PlayerState, TeamState } from "../types";
import { Hearts } from "./Hearts";
import { PlayerBean } from "./PlayerBean";
import { StreakBadge } from "./StreakBadge";

export function TeamRoster({
  team,
  players,
  highlightPlayerId,
  revealRoles,
  events,
  outcome,
}: {
  team: TeamState;
  players: Record<string, PlayerState>;
  highlightPlayerId?: string | null;
  revealRoles?: boolean;
  events?: Record<string, LifeEvent>;
  outcome?: "win" | "lose";
}) {
  const total = team.playerIds.length;
  const alive = team.playerIds.filter((id) => isAlive(players[id])).length;
  const eliminated = total > 0 && alive === 0;

  return (
    <div
      className={
        "card" +
        (outcome === "win" ? " team-card-win" : "") +
        (outcome === "lose" ? " team-card-lose" : "")
      }
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 14,
        minWidth: 220,
        opacity: eliminated ? 0.55 : 1,
        border: `1px solid ${eliminated ? "rgba(255,255,255,0.08)" : team.color + "55"}`,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: team.color,
            }}
          />
          <div
            style={{
              fontFamily: "'Fredoka', sans-serif",
              fontWeight: 600,
              fontSize: 16,
            }}
          >
            {team.name}
          </div>
        </div>
        <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
          {eliminated ? "eliminado" : `${alive}/${total}`}
        </div>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 14 }}>
        {team.playerIds.map((id) => {
          const player = players[id];
          if (!player) return null;
          const dead = player.lives === 0;
          const event = events?.[id];
          return (
            <div
              key={id}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
                width: 76,
              }}
            >
              <PlayerBean
                color={team.color}
                alive={!dead}
                shielded={player.shielded}
                size={44}
                event={event}
              />
              <div
                style={{
                  fontSize: 12,
                  fontWeight: highlightPlayerId === id ? 700 : 500,
                  color:
                    highlightPlayerId === id ? "var(--gold)" : "var(--text)",
                  textAlign: "center",
                  maxWidth: 76,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {player.name}
              </div>
              <Hearts lives={player.lives} size={11} event={event} />
              <StreakBadge streak={player.roundWinStreak} />
              {revealRoles && player.role && (
                <div
                  style={{
                    fontSize: 10,
                    color: "var(--text-muted)",
                    textAlign: "center",
                  }}
                >
                  {dead ? "era " : ""}
                  {ROLES[player.role].name}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

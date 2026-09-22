import { ROLES } from "../data/roles";
import { STARTING_LIVES_PER_PLAYER, TEAM_IDS } from "../types";

export function RulesExplainer() {
  return (
    <div
      className="card"
      style={{ width: "100%", maxWidth: 480, textAlign: "left" }}
    >
      <div
        style={{
          fontFamily: "'Fredoka', sans-serif",
          fontSize: 16,
          marginBottom: 12,
        }}
      >
        📖 Cómo se juega
      </div>
      <ul
        style={{
          margin: 0,
          paddingLeft: 18,
          display: "flex",
          flexDirection: "column",
          gap: 8,
          fontSize: 13,
          color: "var(--text-muted)",
        }}
      >
        <li>
          Se reparten {TEAM_IDS.length} equipos al azar. Cada jugador tiene{" "}
          {STARTING_LIVES_PER_PLAYER} vidas y un{" "}
          <strong style={{ color: "var(--text)" }}>rol secreto</strong> que
          solo él conoce.
        </li>
        <li>
          En cada ronda todos responden la misma pregunta de trivia a la vez
          (opción múltiple, verdadero/falso u ordenar pasos).
        </li>
        <li>
          Quien acierta más rápido gana la ronda y activa el poder de su rol
          contra un rival. Quien falla o no responde a tiempo pierde una vida
          (salvo que tenga escudo).
        </li>
        <li>
          Si te quedas sin vidas, quedas eliminado — pero puedes seguir
          viendo la partida.
        </li>
        <li>Gana el último equipo que quede con jugadores en pie.</li>
      </ul>

      <div
        style={{
          fontFamily: "'Fredoka', sans-serif",
          fontSize: 14,
          marginTop: 16,
          marginBottom: 8,
        }}
      >
        Roles y poderes
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {Object.values(ROLES).map((role) => (
          <div
            key={role.id}
            style={{
              display: "flex",
              gap: 8,
              alignItems: "flex-start",
              fontSize: 12,
            }}
          >
            <span
              style={{ color: role.color, fontWeight: 700, minWidth: 76 }}
            >
              {role.name}
            </span>
            <span style={{ color: "var(--text-muted)" }}>{role.tagline}</span>
          </div>
        ))}
      </div>

      <div
        style={{
          fontSize: 11,
          color: "var(--text-muted)",
          marginTop: 12,
          fontStyle: "italic",
        }}
      >
        Nadie sabe el rol de los demás hasta que termina la partida.
      </div>
    </div>
  );
}

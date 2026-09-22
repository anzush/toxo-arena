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
        <li>
          Cada rol también tiene{" "}
          <strong style={{ color: "var(--text)" }}>habilidades extra</strong>{" "}
          que puede usar mientras se responde, sin ganar la ronda — una por
          ronda (algunas, además, solo una vez en toda la partida; detalle
          abajo).
        </li>
        <li>
          A veces el Gato de la partida es además un{" "}
          <strong style={{ color: "var(--text)" }}>infiltrado</strong>: juega
          visiblemente en un equipo pero en secreto gana para otro. Se
          revela al terminar la partida.
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
          fontFamily: "'Fredoka', sans-serif",
          fontSize: 14,
          marginTop: 16,
          marginBottom: 8,
        }}
      >
        Habilidades extra
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 12 }}>
          <span style={{ color: "var(--danger)", fontWeight: 700, minWidth: 100 }}>
            Gato
          </span>
          <span style={{ color: "var(--text-muted)" }}>
            Puede intentar robarle la respuesta a un rival (20% de éxito): si
            funciona, el rival se queda sin respuesta y el Gato usa la
            suya.
          </span>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 12 }}>
          <span style={{ color: "var(--gold)", fontWeight: 700, minWidth: 100 }}>
            Taquizoíto
          </span>
          <span style={{ color: "var(--text-muted)" }}>
            Puede sabotear a un rival (se le ve la pregunta glitcheada) o
            apurarlo: le recorta unos segundos al cronómetro que ve mientras
            responde.
          </span>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 12 }}>
          <span style={{ color: "var(--success)", fontWeight: 700, minWidth: 100 }}>
            Linfocito
          </span>
          <span style={{ color: "var(--text-muted)" }}>
            Puede curar a un compañero (o a sí mismo): si le iban a robar la
            respuesta, sabotearlo o apurarlo esa ronda, se cancela. Una vez
            por partida, en cambio, puede inmunizar a todo su equipo por esa
            ronda.
          </span>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 12 }}>
          <span style={{ color: "var(--accent-2)", fontWeight: 700, minWidth: 100 }}>
            Bradizoíto
          </span>
          <span style={{ color: "var(--text-muted)" }}>
            En preguntas de opción múltiple, puede usar un 50/50: elimina 2
            opciones incorrectas para sí mismo. O puede hibernar, para
            ganar unos segundos extra de tiempo esa ronda.
          </span>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 12 }}>
          <span style={{ color: "var(--accent)", fontWeight: 700, minWidth: 100 }}>
            Hospedador
          </span>
          <span style={{ color: "var(--text-muted)" }}>
            Puede intentar espiar la respuesta de un compañero (50% de
            éxito) mientras responde.
          </span>
        </div>
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

import { useEffect } from "react";
import { ROLES } from "../data/roles";
import { Sfx } from "../hooks/useSfx";
import { RoleId } from "../types";

const REVEAL_MS = 4500;

/**
 * Pantalla de carga que aparece una vez, justo al empezar la partida, para
 * mostrar tu rol secreto con calma antes de entrar al juego. Pasa sola
 * después de un momento — no hay botón, como una pantalla de carga real.
 */
export function RoleReveal({
  roleId,
  secretTeamName,
  sfx,
  onDone,
}: {
  roleId: RoleId;
  secretTeamName?: string | null;
  sfx: Sfx;
  onDone: () => void;
}) {
  const role = ROLES[roleId];
  const { playReveal } = sfx;

  useEffect(() => {
    playReveal();
    const timer = setTimeout(onDone, REVEAL_MS);
    return () => clearTimeout(timer);
    // Solo una vez, al montar esta pantalla.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="page"
      style={{ minHeight: "100vh", justifyContent: "center" }}
    >
      <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
        Preparando tu rol secreto&hellip;
      </div>
      <div className="role-reveal-flip">
        <div
          className="glass-alert"
          style={{
            textAlign: "center",
            maxWidth: 340,
            border: `1px solid ${role.color}66`,
          }}
        >
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
            Tu rol secreto es
          </div>
          <div
            style={{
              fontFamily: "'Fredoka', sans-serif",
              fontSize: 32,
              color: role.color,
              marginTop: 6,
            }}
          >
            {role.name}
          </div>
          <div
            style={{ fontSize: 14, color: "var(--text-muted)", marginTop: 12 }}
          >
            {role.tagline}
          </div>
        </div>
      </div>
      {secretTeamName && (
        <div
          className="glass-alert gold"
          style={{ textAlign: "center", maxWidth: 340, fontSize: 13 }}
        >
          🕵️ Y hay más: aunque se te vea jugando en tu equipo visible, en
          secreto ganas para <strong>{secretTeamName}</strong>. Nadie más lo
          sabe.
        </div>
      )}
      <div className="reveal-progress-track">
        <div
          className="reveal-progress-fill"
          style={{ animationDuration: `${REVEAL_MS}ms` }}
        />
      </div>
      <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
        Nadie más puede ver esto — es solo para ti.
      </div>
    </div>
  );
}

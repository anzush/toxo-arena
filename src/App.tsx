import { useState } from "react";
import { missingFirebaseConfig } from "./firebase";
import { Host } from "./screens/Host";
import { Player } from "./screens/Player";

type Role = "host" | "player" | null;

const ROLE_KEY = "toxo-arena-role";

export default function App() {
  const [role, setRole] = useState<Role>(() => {
    const stored = localStorage.getItem(ROLE_KEY);
    return stored === "host" || stored === "player" ? stored : null;
  });

  function chooseRole(next: Exclude<Role, null>) {
    localStorage.setItem(ROLE_KEY, next);
    setRole(next);
  }

  function backToStart() {
    localStorage.removeItem(ROLE_KEY);
    setRole(null);
  }

  if (missingFirebaseConfig.length > 0) {
    return (
      <div className="page" style={{ maxWidth: 560, margin: "0 auto" }}>
        <h1 style={{ fontSize: 28 }}>Falta configurar Firebase</h1>
        <p style={{ color: "var(--text-muted)", textAlign: "center" }}>
          Copia <code>.env.example</code> a <code>.env.local</code> y completa
          los valores de tu proyecto de Firebase (Realtime Database). Falta:{" "}
          {missingFirebaseConfig.join(", ")}.
        </p>
      </div>
    );
  }

  if (role === "host") return <Host onExit={backToStart} />;
  if (role === "player") return <Player onExit={backToStart} />;

  return (
    <div
      className="page"
      style={{ justifyContent: "center", minHeight: "100vh" }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 14,
            background: "var(--gold)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--bg)",
          }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="7" cy="8" r="2.2" />
            <circle cx="12" cy="6" r="2.2" />
            <circle cx="17" cy="8" r="2.2" />
            <path d="M12 12c-3 0-5.5 2.2-5.5 4.8 0 1.8 1.6 3.2 3.6 3.2.9 0 1.5-.3 1.9-.5.4.2 1 .5 1.9.5 2 0 3.6-1.4 3.6-3.2C17.5 14.2 15 12 12 12z" />
          </svg>
        </div>
        <h1 style={{ fontSize: 32, letterSpacing: 0.5 }}>TOXO ARENA</h1>
      </div>
      <p
        style={{
          color: "var(--text-muted)",
          textAlign: "center",
          marginTop: -8,
        }}
      >
        Trivia por equipos sobre Toxoplasma gondii
      </p>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 16,
          width: "100%",
          maxWidth: 360,
          marginTop: 24,
        }}
      >
        <button className="btn-primary" onClick={() => chooseRole("host")}>
          Soy el anfitrión (tablero)
        </button>
        <button className="btn-secondary" onClick={() => chooseRole("player")}>
          Soy jugador
        </button>
      </div>
    </div>
  );
}

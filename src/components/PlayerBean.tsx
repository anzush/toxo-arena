import { useEffect, useState } from "react";
import { usePrevious } from "../hooks/usePrevious";

export function PlayerBean({
  color,
  alive,
  shielded,
  size = 56
}: {
  color: string;
  alive: boolean;
  shielded?: boolean;
  size?: number;
}) {
  const height = size * 1.15;
  const prevAlive = usePrevious(alive);
  const [justDied, setJustDied] = useState(false);

  useEffect(() => {
    // Anima al morir, y también la primera vez que se monta ya muerto
    // (p. ej. la pantalla de "fuiste eliminado" del propio jugador).
    if (alive || prevAlive === false) return;
    setJustDied(true);
    const timer = setTimeout(() => setJustDied(false), 700);
    return () => clearTimeout(timer);
  }, [alive, prevAlive]);

  return (
    <div
      className={justDied ? "death-drop" : undefined}
      style={{
        position: "relative",
        width: size,
        height,
        opacity: alive ? 1 : 0.35,
        transform: alive ? "none" : "rotate(-16deg)",
        transition: "all .2s ease",
        flex: "none"
      }}
    >
      {justDied && (
        <div
          className="float-badge"
          style={{
            position: "absolute",
            top: -size * 0.4,
            left: "50%",
            transform: "translateX(-50%)",
            fontSize: size * 0.5,
            pointerEvents: "none"
          }}
        >
          💀
        </div>
      )}
      {shielded && alive && (
        <div
          style={{
            position: "absolute",
            inset: -6,
            borderRadius: "50%",
            boxShadow: "0 0 0 3px #52D68A, 0 0 16px rgba(82,214,138,0.55)"
          }}
        />
      )}
      <div
        style={{
          width: "100%",
          height: "100%",
          background: color,
          borderRadius: "50% 50% 46% 46% / 62% 62% 40% 40%",
          border: "2px solid rgba(0,0,0,0.25)",
          position: "relative"
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "24%",
            left: "50%",
            transform: "translateX(-50%)",
            width: "58%",
            height: "32%",
            background: alive ? "linear-gradient(135deg,#eaf6ff,#a9ddff)" : "#3a3550",
            borderRadius: "50%",
            border: "2px solid rgba(0,0,0,0.2)"
          }}
        />
      </div>
    </div>
  );
}

import { LifeEvent } from "../hooks/useLifeEvents";

export function PlayerBean({
  color,
  alive,
  shielded,
  size = 56,
  event,
}: {
  color: string;
  alive: boolean;
  shielded?: boolean;
  size?: number;
  event?: LifeEvent | null;
}) {
  const height = size * 1.15;
  const isHit = event?.type === "hit" || event?.type === "died";
  const isGain = event?.type === "gained" || event?.type === "revived";

  return (
    <div
      style={{
        position: "relative",
        width: size,
        height,
        opacity: alive ? 1 : 0.35,
        transform: alive ? "none" : "rotate(-16deg)",
        transition: "opacity .2s ease, transform .2s ease",
        flex: "none",
      }}
      className={
        event?.type === "died" ? "death-pop" : isHit ? "life-shake" : undefined
      }
    >
      {shielded && alive && (
        <div
          style={{
            position: "absolute",
            inset: -6,
            borderRadius: "50%",
            boxShadow: "0 0 0 3px #52D68A, 0 0 16px rgba(82,214,138,0.55)",
          }}
        />
      )}

      {event?.type === "died" && (
        <div className="ghost-float">
          <div
            style={{
              width: "100%",
              height: "100%",
              background: "rgba(245,243,250,0.55)",
              borderRadius: "50% 50% 46% 46% / 62% 62% 40% 40%",
            }}
          />
        </div>
      )}

      <div
        style={{
          width: "100%",
          height: "100%",
          background: color,
          borderRadius: "50% 50% 46% 46% / 62% 62% 40% 40%",
          border: "2px solid rgba(0,0,0,0.25)",
          position: "relative",
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
            background: alive
              ? "linear-gradient(135deg,#eaf6ff,#a9ddff)"
              : "#3a3550",
            borderRadius: "50%",
            border: "2px solid rgba(0,0,0,0.2)",
          }}
        />
      </div>

      {isHit && (
        <span className="float-badge" style={{ color: "var(--danger)" }}>
          -{event?.delta ?? 1} 💔
        </span>
      )}
      {isGain && (
        <span className="float-badge" style={{ color: "var(--success)" }}>
          +{event?.delta ?? 1} 💚
        </span>
      )}
    </div>
  );
}

export function MuteButton({
  muted,
  onToggle
}: {
  muted: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      aria-label={muted ? "Activar sonido" : "Silenciar sonido"}
      title={muted ? "Activar sonido" : "Silenciar sonido"}
      style={{
        background: "none",
        border: "none",
        color: "var(--text-muted)",
        fontSize: 18,
        lineHeight: 1,
        padding: 4
      }}
    >
      {muted ? "🔇" : "🔊"}
    </button>
  );
}

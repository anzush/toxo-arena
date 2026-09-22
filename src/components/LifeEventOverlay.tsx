import { LifeEvent } from "../hooks/useLifeEvents";
import { PlayerBean } from "./PlayerBean";
import { Reaper } from "./Reaper";

/**
 * Instante de pantalla completa en el celular de un jugador cuando algo le
 * pasa a ÉL: lo eliminan, le quitan una vida, le roban una vida o lo
 * revivieron. El tablero del anfitrión ya muestra sus propias insignias
 * flotantes por jugador; esto es la versión personal, más grande, solo
 * para quien lo vive. El texto va en su propia tarjeta de vidrio: lo que
 * haya detrás (otra tarjeta, el tablero) no debe poder tragárselo.
 */
export function LifeEventOverlay({
  event,
  teamColor,
}: {
  event: LifeEvent | null;
  teamColor: string;
}) {
  if (!event) return null;

  if (event.type === "died") {
    return (
      <div className="life-overlay-backdrop death">
        <div className="life-overlay-content">
          <div className="eject-tumble">
            <PlayerBean color={teamColor} alive={true} size={64} />
          </div>
          <div
            className="glass-alert bad card-impact life-overlay-card"
            role="status"
            aria-live="polite"
          >
            <div className="life-overlay-headline">Te eliminaron</div>
            <div className="life-overlay-caption">
              Puedes seguir viendo cómo termina la partida.
            </div>
          </div>
        </div>
      </div>
    );
  }

  const copy = {
    hit: {
      backdrop: "danger",
      variant: "bad card-impact",
      headline: event.delta > 1 ? `Perdiste ${event.delta} vidas` : "Perdiste una vida",
      caption: "Cuida las que te quedan.",
    },
    gained: {
      backdrop: "gain",
      variant: "gold card-punch",
      headline: event.delta > 1 ? `Robaste ${event.delta} vidas` : "Le robaste una vida",
      caption: "Tu poder secreto funcionó.",
    },
    revived: {
      backdrop: "gain",
      variant: "gold card-punch",
      headline: "Te revivieron",
      caption: "Vuelves a estar en pie.",
    },
  }[event.type];

  return (
    <div className={`life-overlay-backdrop ${copy.backdrop}`}>
      <div className="life-overlay-content">
        {event.type === "hit" && (
          <div className="reaper-swoop">
            <Reaper size={34} />
          </div>
        )}
        <div
          className={`glass-alert ${copy.variant} life-overlay-card`}
          role="status"
          aria-live="polite"
        >
          <div className="life-overlay-headline">{copy.headline}</div>
          <div className="life-overlay-caption">{copy.caption}</div>
        </div>
      </div>
    </div>
  );
}

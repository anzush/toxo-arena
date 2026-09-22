import { useEffect, useRef, useState } from "react";
import { PlayerState } from "../types";

export type LifeEventType = "hit" | "died" | "gained" | "revived";

export interface LifeEvent {
  type: LifeEventType;
  delta: number; // cuántas vidas cambiaron (siempre positivo, ej. 2 si el Impostor golpeó doble)
  key: number; // cambia siempre, así se puede volver a disparar la animación en el mismo tipo
}

/**
 * Compara las vidas de cada jugador entre una actualización de Firebase y
 * la siguiente, y por un momento marca a los que acaban de perder o ganar
 * una vida — para que la UI dispare la animación correspondiente. Los
 * eventos se limpian solos después de un momento.
 */
export function useLifeEvents(players: Record<string, PlayerState> | undefined): Record<string, LifeEvent> {
  const prevLivesRef = useRef<Record<string, number> | null>(null);
  const [events, setEvents] = useState<Record<string, LifeEvent>>({});

  useEffect(() => {
    if (!players) return;
    const prev = prevLivesRef.current;
    const nextLives: Record<string, number> = {};
    const nextEvents: Record<string, LifeEvent> = {};

    for (const [id, player] of Object.entries(players)) {
      nextLives[id] = player.lives;
      if (!prev || !(id in prev)) continue; // primera vez que lo vemos: no animar
      const before = prev[id];
      const after = player.lives;
      if (after < before) {
        nextEvents[id] = { type: after === 0 ? "died" : "hit", delta: before - after, key: Date.now() + Math.random() };
      } else if (after > before) {
        nextEvents[id] = { type: before === 0 ? "revived" : "gained", delta: after - before, key: Date.now() + Math.random() };
      }
    }

    prevLivesRef.current = nextLives;

    if (Object.keys(nextEvents).length > 0) {
      setEvents(nextEvents);
      const timer = setTimeout(() => setEvents({}), 1200);
      return () => clearTimeout(timer);
    }
  }, [players]);

  return events;
}

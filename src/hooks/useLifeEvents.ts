import { useEffect, useRef, useState } from "react";
import { PlayerState, ROUND_WIN_STREAK_BONUS } from "../types";

export type LifeEventType = "hit" | "died" | "gained" | "revived" | "streak";

export interface LifeEvent {
  type: LifeEventType;
  delta: number; // cuántas vidas cambiaron (siempre positivo)
  key: number; // cambia siempre, así se puede volver a disparar la animación en el mismo tipo
}

interface Tracked {
  lives: number;
  roundWinStreak: number;
}

/**
 * Compara las vidas (y la racha) de cada jugador entre una actualización de
 * Firebase y la siguiente, y por un momento marca a los que acaban de
 * perder o ganar una vida — para que la UI dispare la animación
 * correspondiente. Los eventos se limpian solos después de un momento.
 */
export function useLifeEvents(players: Record<string, PlayerState> | undefined): Record<string, LifeEvent> {
  const prevRef = useRef<Record<string, Tracked> | null>(null);
  const [events, setEvents] = useState<Record<string, LifeEvent>>({});

  useEffect(() => {
    if (!players) return;
    const prev = prevRef.current;
    const next: Record<string, Tracked> = {};
    const nextEvents: Record<string, LifeEvent> = {};

    for (const [id, player] of Object.entries(players)) {
      next[id] = { lives: player.lives, roundWinStreak: player.roundWinStreak };
      if (!prev || !(id in prev)) continue; // primera vez que lo vemos: no animar
      const before = prev[id];
      const after = next[id];
      if (after.lives < before.lives) {
        nextEvents[id] = {
          type: after.lives === 0 ? "died" : "hit",
          delta: before.lives - after.lives,
          key: Date.now() + Math.random()
        };
      } else if (after.lives > before.lives) {
        const streakBonus =
          before.roundWinStreak === ROUND_WIN_STREAK_BONUS - 1 && after.roundWinStreak === 0;
        nextEvents[id] = {
          type: streakBonus ? "streak" : before.lives === 0 ? "revived" : "gained",
          delta: after.lives - before.lives,
          key: Date.now() + Math.random()
        };
      }
    }

    prevRef.current = next;

    if (Object.keys(nextEvents).length > 0) {
      setEvents(nextEvents);
      const timer = setTimeout(() => setEvents({}), 1200);
      return () => clearTimeout(timer);
    }
  }, [players]);

  return events;
}

import { useEffect } from "react";
import { LifeEvent } from "./useLifeEvents";

const PATTERNS: Partial<Record<LifeEvent["type"], number[]>> = {
  hit: [120],
  died: [90, 60, 90, 60, 160]
};

/** Vibra el celular del jugador cuando pierde una vida (Android; iOS no soporta la API). */
export function useLifeVibration(event: LifeEvent | null) {
  useEffect(() => {
    if (!event) return;
    const pattern = PATTERNS[event.type];
    if (!pattern) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    if ("vibrate" in navigator) {
      navigator.vibrate(pattern);
    }
  }, [event?.key]);
}

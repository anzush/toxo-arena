import { useState } from "react";
import { generatePlayerId } from "../lib/roomCode";

const STORAGE_KEY = "toxo-arena-player-id";

/** Un id estable por navegador, para que si el celular se refresca siga siendo el mismo jugador. */
export function usePlayerId(): string {
  const [playerId] = useState(() => {
    const existing = localStorage.getItem(STORAGE_KEY);
    if (existing) return existing;
    const created = generatePlayerId();
    localStorage.setItem(STORAGE_KEY, created);
    return created;
  });
  return playerId;
}

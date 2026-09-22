import { useEffect, useState } from "react";

const KEY = "toxo-arena-muted";

/** Preferencia de sonido de este dispositivo (no se comparte entre jugadores). */
export function useMuted(): [boolean, () => void] {
  const [muted, setMuted] = useState(() => localStorage.getItem(KEY) === "1");

  useEffect(() => {
    localStorage.setItem(KEY, muted ? "1" : "0");
  }, [muted]);

  return [muted, () => setMuted((m) => !m)];
}

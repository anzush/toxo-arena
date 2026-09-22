import { useEffect, useState } from "react";

/** Segundos restantes hasta `deadline`, actualizados 4 veces por segundo. */
export function useCountdown(deadline: number): number {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(interval);
  }, []);
  return Math.max(0, Math.ceil((deadline - now) / 1000));
}

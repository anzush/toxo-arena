import { useEffect, useState } from "react";
import { subscribeToRoom } from "../lib/roomService";
import { RoomState } from "../types";

/** Se suscribe en tiempo real al estado de una sala en Firebase. */
export function useRoom(code: string | null) {
  const [room, setRoom] = useState<RoomState | null>(null);
  const [loading, setLoading] = useState(!!code);

  useEffect(() => {
    if (!code) {
      setRoom(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsubscribe = subscribeToRoom(code, (value) => {
      setRoom(value);
      setLoading(false);
    });
    return unsubscribe;
  }, [code]);

  return { room, loading };
}

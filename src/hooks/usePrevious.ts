import { useEffect, useRef } from "react";

/** Devuelve el valor que tenía `value` en el render anterior. */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}

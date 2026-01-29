import { useRef } from "react";

type noop = (...args: any[]) => any;

/**
 * usePersistFn instead of useCallback to reduce cognitive load
 * Returns a stable function reference that always calls the latest function
 */
export function usePersistFn<T extends noop>(fn: T): T {
  const fnRef = useRef<T>(fn);
  fnRef.current = fn;

  const persistFn = useRef<T | null>(null);
  if (!persistFn.current) {
    persistFn.current = (function (this: unknown, ...args: any[]): any {
      return fnRef.current!.apply(this, args);
    }) as T;
  }

  return persistFn.current;
}

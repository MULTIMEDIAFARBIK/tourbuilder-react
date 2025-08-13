import { useMemo } from "react";
import debounce from "lodash.debounce";

export function useDebouncedCallback<T extends (...args: any[]) => void>(
  fn: T | undefined,
  delay: number,
) {
  // Recreate debounce only when fn reference changes
  return useMemo(() => {
    if (!fn) return () => {};
    return debounce(fn, delay);
  }, [fn, delay]) as T;
}

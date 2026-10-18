import { useEffect, useState } from "react";

// Settles a fast-changing value (e.g. a slider being dragged) before it drives a request.
export function useDebounced<T>(value: T, ms = 250): T {
  const [settled, setSettled] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setSettled(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return settled;
}

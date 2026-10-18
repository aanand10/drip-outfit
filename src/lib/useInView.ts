import { useEffect, useState } from "react";

// Becomes true (and stays true) once the element scrolls into view.
// A callback ref, so it also works for elements that mount later.
export function useInView<T extends Element>(threshold = 0.3) {
  const [el, setEl] = useState<T | null>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    if (!el || seen) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setSeen(true), { threshold });
    io.observe(el);
    return () => io.disconnect();
  }, [el, seen, threshold]);
  return [setEl, seen] as const;
}

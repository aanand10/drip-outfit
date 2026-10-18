// Bottom action bar. `hidden` slides it off screen.
export function StickyBar({ children, hidden = false }: { children: React.ReactNode; hidden?: boolean }) {
  return (
    <div
      aria-hidden={hidden || undefined}
      className={`sticky bottom-0 z-20 mt-auto border-t border-line/70 bg-bg/90 px-4 pt-3 pb-[max(14px,env(safe-area-inset-bottom))] backdrop-blur-xl transition-transform duration-500 ease-out ${
        hidden ? "pointer-events-none translate-y-full" : ""
      }`}
    >
      {children}
    </div>
  );
}

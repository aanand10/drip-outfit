export function LookSkeleton() {
  return (
    <div aria-busy="true" aria-label="Building your look" className="flex flex-1 flex-col">
      <div className="relative h-[calc(100svh-88px)] max-h-[740px] min-h-[520px] bg-ink">
        <div className="absolute inset-0 animate-pulse bg-[#222]" />
        <p className="absolute inset-x-0 top-[62%] text-center font-mono text-[10.5px] tracking-[0.2em] text-white/60 uppercase">
          Styling your look…
        </p>
      </div>
      <div className="flex flex-col gap-4 px-4 pt-10">
        <div className="h-3 w-32 animate-pulse bg-subtle" />
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="flex gap-3.5 border-b border-line pb-5">
            <div className="aspect-[4/5] w-[86px] animate-pulse bg-subtle" />
            <div className="flex-1 space-y-2 pt-1">
              <div className="h-3 w-20 animate-pulse bg-subtle" />
              <div className="h-4 w-40 animate-pulse bg-subtle" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

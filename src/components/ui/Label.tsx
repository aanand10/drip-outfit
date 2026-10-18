// Mono eyebrow for short metadata ("TOP", "DATE NIGHT · ₹5,000").
export function Label({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`font-mono text-[10.5px] font-medium tracking-[0.08em] uppercase ${className}`}>
      {children}
    </span>
  );
}

// Tabular digits so totals don't jitter as they change.
export function Price({ amount, className = "" }: { amount: string; className?: string }) {
  return <span className={`font-semibold tracking-[-0.02em] tabular-nums ${className}`}>{amount}</span>;
}

const TAG_TONE = {
  info: "bg-info-soft text-info-ink",
  alert: "bg-accent-soft text-accent",
  positive: "bg-positive-soft text-positive-ink",
};

// Status under a sticky-bar price: "₹503 under", "Over budget", "Confirmed".
export function Tag({ tone, children }: { tone: keyof typeof TAG_TONE; children: React.ReactNode }) {
  return (
    <span className={`mt-0.5 inline-block rounded-[3px] px-1.5 py-px text-[10px] font-semibold uppercase ${TAG_TONE[tone]}`}>
      {children}
    </span>
  );
}

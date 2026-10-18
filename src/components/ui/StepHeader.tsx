export function StepHeader({
  step,
  of,
  label,
  title,
  aside,
}: {
  step: number;
  of: number;
  label: string;
  title: string;
  aside?: React.ReactNode;
}) {
  return (
    <div className="mb-5">
      <div className="flex items-center gap-2 font-mono text-[10.5px] tracking-[0.14em] text-muted uppercase">
        <span className="text-fg">{String(step).padStart(2, "0")}</span>
        <span>/ {String(of).padStart(2, "0")}</span>
        <span className="h-px w-6 bg-line" />
        <span>{label}</span>
      </div>
      <div className="mt-2 flex items-end justify-between gap-3">
        <h2 className="text-[26px] leading-[1.05] font-semibold tracking-[-0.04em]">{title}</h2>
        {aside}
      </div>
    </div>
  );
}

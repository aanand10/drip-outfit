"use client";

import { Icon } from "@/components/ui/Icon";
import { formatINR } from "@/lib/format";

const MIN = 1000;
const MAX = 15000;
const STEP = 500;
const TICKS = [1000, 5000, 10000, 15000];

const pct = (v: number) => ((Math.min(Math.max(v, MIN), MAX) - MIN) / (MAX - MIN)) * 100;

// The marker shows where complete looks start for the chosen occasion.
export function BudgetPicker({
  value,
  onChange,
  floor,
}: {
  value: number;
  onChange: (v: number) => void;
  floor?: { amount: number; label: string };
}) {
  const below = floor ? value < floor.amount : false;
  const nudge = (d: number) => onChange(Math.min(MAX, Math.max(MIN, Math.round((value + d) / STEP) * STEP)));
  const digits = value ? value.toLocaleString("en-IN") : "";

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <label className="flex min-w-0 items-baseline font-semibold tracking-[-0.05em] tabular-nums">
          <span className="sr-only">Budget in rupees</span>
          <span className="text-[34px] text-muted/70">₹</span>
          <input
            inputMode="numeric"
            autoComplete="off"
            value={digits}
            onChange={(e) => onChange(Number(e.target.value.replace(/\D/g, "")) || 0)}
            style={{ width: `${Math.max(3, digits.length) * 0.92}ch` }}
            className="bg-transparent text-[56px] leading-none outline-none"
          />
        </label>
        <div className="flex gap-2">
          <StepButton label="Decrease budget" onClick={() => nudge(-STEP)} disabled={value <= MIN}>
            <Icon.Minus width={16} height={16} strokeWidth={1.8} />
          </StepButton>
          <StepButton label="Increase budget" onClick={() => nudge(STEP)} disabled={value >= MAX}>
            <Icon.Plus width={16} height={16} strokeWidth={1.8} />
          </StepButton>
        </div>
      </div>

      <div className="relative mt-8">
        {floor && (
          <div
            className="pointer-events-none absolute -top-[22px] flex -translate-x-1/2 flex-col items-center transition-[left] duration-300"
            style={{ left: `${pct(floor.amount)}%` }}
          >
            <span
              className={`font-mono text-[10px] tracking-[0.08em] whitespace-nowrap uppercase ${below ? "text-accent" : "text-muted"}`}
            >
              Looks from {formatINR(floor.amount)}
            </span>
            <span className={`mt-0.5 h-3 w-px ${below ? "bg-accent" : "bg-fg/40"}`} />
          </div>
        )}
        <input
          type="range"
          aria-label="Budget"
          min={MIN}
          max={MAX}
          step={100}
          value={Math.min(Math.max(value, MIN), MAX)}
          onChange={(e) => onChange(Number(e.target.value))}
          className="range"
          style={{ "--fill": `${pct(value)}%`, "--track-fill": below ? "var(--accent)" : "var(--fg)" } as React.CSSProperties}
        />
        <div className="relative mt-1 h-5 font-mono text-[10px] text-muted tabular-nums">
          {TICKS.map((t, i) => (
            <button
              key={t}
              type="button"
              onClick={() => onChange(t)}
              className={`absolute hover:text-fg ${i === 0 ? "" : i === TICKS.length - 1 ? "-translate-x-full" : "-translate-x-1/2"}`}
              style={{ left: `${pct(t)}%` }}
            >
              {formatINR(t)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function StepButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className="grid size-11 shrink-0 place-items-center rounded-full border border-line transition hover:border-fg active:scale-90 disabled:opacity-30"
    >
      {children}
    </button>
  );
}

"use client";

import { useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { SCENARIOS, type ScenarioId } from "@/domain/scenarios";
import { track } from "@/lib/analytics";
import { api } from "@/lib/api";
import { formatINR } from "@/lib/format";
import { lookHref } from "@/lib/routes";
import { Spinner } from "./Button";
import { Icon } from "./Icon";
import { IconButton } from "./IconButton";
import { Label } from "./Label";

const IDS = Object.keys(SCENARIOS) as ScenarioId[];

// Reviewer controls: open a fixed case (C1/C2) or Reset the service to its seeded state.
export function ScenarioSwitcher({ tone }: { tone: "glass" | "light" }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const queryClient = useQueryClient();
  const ref = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const [resetState, setResetState] = useState<"idle" | "busy" | "done">("idle");

  const active = IDS.find(
    (id) =>
      pathname === "/look" &&
      params.get("occasion") === SCENARIOS[id].occasion &&
      Number(params.get("budget")) === SCENARIOS[id].budget,
  );

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  function run(id: ScenarioId) {
    const { occasion, budget } = SCENARIOS[id];
    track("scenario_opened", { scenario: id });
    setOpen(false);
    router.push(lookHref(occasion, budget));
  }

  async function reset() {
    if (resetState === "busy") return;
    setResetState("busy");
    track("scenario_reset", {});
    await api.reset();
    // Every cached response (looks, stock, cart) predates the reset, so drop them all.
    await queryClient.resetQueries();
    setResetState("done");
    setTimeout(() => setResetState("idle"), 1800);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        className={`inline-flex h-9 items-center gap-1.5 rounded-full px-3 font-mono text-[10.5px] tracking-[0.12em] uppercase transition active:scale-95 ${
          tone === "glass"
            ? "border border-white/25 bg-black/25 text-white backdrop-blur-md hover:bg-black/35"
            : "border border-line bg-bg text-fg hover:border-fg/50"
        }`}
      >
        <span className={`size-1.5 rounded-full ${active ? "bg-accent" : tone === "glass" ? "bg-white/60" : "bg-muted"}`} />
        {active ?? "Cases"}
      </button>

      <dialog
        ref={ref}
        onClose={() => setOpen(false)}
        onClick={(e) => e.target === ref.current && setOpen(false)}
        aria-label="Test cases"
        className="m-0 mx-auto mt-auto w-full max-w-[440px] rounded-t-[28px] bg-bg p-0 text-fg open:animate-sheet-in"
      >
        <div className="pt-2.5 pb-[max(20px,env(safe-area-inset-bottom))]">
          <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-line" aria-hidden />
          <div className="flex items-start justify-between gap-4 px-5">
            <div>
              <Label className="text-muted">Reviewer controls</Label>
              <h2 className="mt-1.5 text-[22px] leading-tight font-semibold tracking-[-0.02em]">
                Replay a <span className="font-serif font-normal italic">case</span>
              </h2>
              <p className="mt-1 text-[13px] text-muted">Reset first for a clean bag and full stock.</p>
            </div>
            <IconButton label="Close" onClick={() => setOpen(false)}>
              <Icon.Close width={18} height={18} />
            </IconButton>
          </div>

          <ul className="mt-5 border-t border-line">
            {IDS.map((id) => {
              const s = SCENARIOS[id];
              return (
                <li key={id} className="border-b border-line">
                  <button
                    type="button"
                    onClick={() => run(id)}
                    className="flex w-full items-center gap-4 px-5 py-4 text-left transition hover:bg-subtle active:bg-subtle"
                  >
                    <span
                      className={`grid size-11 shrink-0 place-items-center rounded-full font-mono text-[13px] font-semibold ${
                        active === id ? "bg-accent text-white" : "bg-fg text-bg"
                      }`}
                    >
                      {id}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[15px] font-semibold tracking-[-0.01em]">{s.title}</span>
                      <span className="block text-[12.5px] text-muted">{s.checks}</span>
                      <span className="mt-1 block font-mono text-[10.5px] tracking-[0.1em] text-muted uppercase">
                        {s.occasionLabel} · {formatINR(s.budget)}
                      </span>
                    </span>
                    <Icon.Arrow width={16} height={16} className="shrink-0 text-muted" />
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="px-5 pt-4">
            <button
              type="button"
              onClick={reset}
              aria-live="polite"
              className="flex h-12 w-full items-center justify-center gap-2 rounded-full border border-fg text-[14px] font-semibold transition active:scale-[0.98]"
            >
              {resetState === "busy" ? (
                <>
                  <Spinner /> Resetting
                </>
              ) : resetState === "done" ? (
                <>
                  <Icon.Check width={16} height={16} strokeWidth={2.4} /> Bag emptied, stock restored
                </>
              ) : (
                <>
                  <Icon.Reset width={16} height={16} /> Reset
                </>
              )}
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}

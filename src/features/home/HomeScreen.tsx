"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { LookGallery } from "@/components/outfit/LookGallery";
import { OutfitStage } from "@/components/outfit/OutfitStage";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Price, Tag } from "@/components/ui/Label";
import { StepHeader } from "@/components/ui/StepHeader";
import { StickyBar } from "@/components/ui/StickyBar";
import { BUDGET_SPLIT } from "@/domain/rules";
import { SLOT_LABEL, type LookItem, type Occasion, type OccasionId } from "@/domain/types";
import { track } from "@/lib/analytics";
import { api, queryKeys } from "@/lib/api";
import { formatINR } from "@/lib/format";
import { lookHref, parseLookParams } from "@/lib/routes";
import { useDebounced } from "@/lib/useDebounced";
import { BudgetPicker } from "./BudgetPicker";
import { ClosingCta } from "./ClosingCta";
import { Intro } from "./Intro";
import { PromiseRow } from "./PromiseRow";
import { ThisNotThat } from "./ThisNotThat";

// Keyed on the URL so new params reset the form.
export function HomeScreen() {
  const params = useSearchParams();
  return <Home key={params.toString()} initial={parseLookParams(params)} />;
}

function Home({ initial }: { initial: ReturnType<typeof parseLookParams> }) {
  const router = useRouter();
  const [occasion, setOccasion] = useState<OccasionId>(initial.occasion ?? "date-night");
  const [budget, setBudget] = useState(initial.budget ?? 5000);
  const previewBudget = useDebounced(budget, 300);
  const intro = useRef<HTMLElement>(null);
  const [onIntro, setOnIntro] = useState(true);

  // Hide the price bar while the intro fills the screen.
  useEffect(() => {
    const el = intro.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setOnIntro(e.intersectionRatio > 0.35), { threshold: [0, 0.35, 1] });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Budget events use the settled value, not every step of a slider drag.
  const budgetSeen = useRef(previewBudget);
  useEffect(() => {
    if (previewBudget === budgetSeen.current) return;
    budgetSeen.current = previewBudget;
    track("budget_changed", { budget: previewBudget });
  }, [previewBudget]);

  function selectOccasion(id: OccasionId, source: "tile" | "intro") {
    setOccasion(id);
    track("occasion_selected", { occasion: id, source });
  }

  const { data: occasions } = useQuery({ queryKey: queryKeys.occasions, queryFn: api.getOccasions });
  const selected = occasions?.find((o) => o.id === occasion);

  // Same query key as the look page, so it opens from cache.
  const preview = useQuery({
    queryKey: queryKeys.look(occasion, previewBudget),
    queryFn: () => api.recommend({ occasion, budget: previewBudget }),
    enabled: previewBudget > 0,
    placeholderData: keepPreviousData,
  });
  const result = preview.data;
  const look = result?.status === "ok" ? result.look : null;
  const items: LookItem[] | null = look?.items ?? (result?.status === "no_fit" ? result.cheapestLook : null);
  const updating = preview.isFetching || budget !== previewBudget;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (budget <= 0) return;
    track("look_requested", { occasion, budget });
    router.push(lookHref(occasion, budget));
  }

  return (
    <form onSubmit={submit} className="flex flex-1 flex-col">
      <Intro
        ref={intro}
        occasions={occasions ?? []}
        playing={onIntro}
        onStart={(id) => {
          if (id) selectOccasion(id, "intro");
          document.getElementById("step-occasion")?.scrollIntoView({ behavior: "smooth" });
        }}
      />

      <PromiseRow />

      <section id="step-occasion" className="scroll-mt-4 px-4 pt-14">
        <StepHeader step={1} of={3} label="Occasion" title="Where are you headed?" />
        <div role="radiogroup" aria-label="Occasion" className="grid grid-cols-2 gap-x-3 gap-y-5">
          {(occasions ?? []).map((o, i) => (
            <OccasionTile key={o.id} occasion={o} index={i} active={o.id === occasion} onSelect={() => selectOccasion(o.id, "tile")} />
          ))}
          {!occasions &&
            Array.from({ length: 4 }, (_, i) => <div key={i} className="aspect-[3/4] animate-pulse bg-subtle" />)}
        </div>
      </section>

      <section className="px-4 pt-14">
        <StepHeader step={2} of={3} label="Budget" title="What's your budget?" />
        <BudgetPicker
          value={budget}
          onChange={setBudget}
          floor={selected ? { amount: selected.minLookPrice, label: selected.label } : undefined}
        />
        <p className="mt-3 text-[13px] text-muted">One total for the top, trousers and shoes together.</p>
      </section>

      <section className="px-4 pt-14">
        <StepHeader
          step={3}
          of={3}
          label="Your look"
          title={look || !result ? "Here's your look" : "Closest complete look"}
          aside={
            <span className="flex items-center gap-1.5 pb-1 font-mono text-[10.5px] tracking-[0.1em] uppercase">
              <span className={`size-1.5 rounded-full ${look ? "bg-positive" : "bg-accent"} ${updating ? "animate-pulse" : ""}`} />
              {updating ? "Styling" : look ? "Live" : "Over budget"}
            </span>
          }
        />
        <div className={`transition-opacity duration-300 ${updating ? "opacity-60" : ""}`}>
          <LookGallery
            variant="card"
            items={items}
            muted={result?.status === "no_fit"}
            pill={
              result?.status === "no_fit"
                ? { text: `Needs ${formatINR(result.cheapestTotal)}+`, tone: "alert" }
                : look
                  ? { text: look.reasons[0], tone: "glass" }
                  : undefined
            }
          />
          {items && (
            <dl className="mt-4">
              {items.map((item) => (
                <div key={item.product.id} className="flex items-baseline gap-3 border-b border-line py-2.5">
                  <dt className="w-[72px] shrink-0 font-mono text-[10.5px] tracking-[0.12em] text-muted uppercase">
                    {SLOT_LABEL[item.slot]}
                  </dt>
                  <dd className="min-w-0 flex-1 truncate text-[14px]">
                    <span className="text-muted">{item.product.brand} · </span>
                    {item.product.name}
                  </dd>
                  <dd className="text-[14px] font-semibold tabular-nums">{formatINR(item.product.price)}</dd>
                </div>
              ))}
              <div className="flex items-baseline justify-between pt-3">
                <dt className="font-mono text-[10.5px] tracking-[0.12em] uppercase">Total</dt>
                <dd className={`text-[18px] font-semibold tabular-nums ${look ? "" : "text-accent"}`}>
                  {formatINR(items.reduce((s, i) => s + i.product.price, 0))}
                  <span className="ml-1.5 text-[13px] font-normal text-muted">of {formatINR(previewBudget)}</span>
                </dd>
              </div>
            </dl>
          )}
        </div>
      </section>

      {look && selected && (
        <ThisNotThat occasion={occasion} occasionLabel={selected.label} budget={previewBudget} look={look} />
      )}

      {items && (
        <section className="px-4 pt-14">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="text-[20px] font-medium tracking-[-0.02em]">How it comes together</h2>
            <span className="font-mono text-[10.5px] tracking-[0.1em] text-muted uppercase">Illustrated</span>
          </div>
          <div className="bg-subtle px-3 py-6">
            <OutfitStage items={items} />
          </div>
        </section>
      )}

      <div className="mx-4 mt-12 mb-10 border-t border-line">
        <Detail title="How we pair pieces">
          Every look matches on formality, keeps at most one bold colour, avoids clashing styles like sportswear
          with tailoring, and leans into what the occasion calls for.
        </Detail>
        <Detail title="How the budget is split">
          We aim for roughly {Math.round(BUDGET_SPLIT.top * 100)}% top, {Math.round(BUDGET_SPLIT.trousers * 100)}%
          trousers and {Math.round(BUDGET_SPLIT.shoes * 100)}% shoes, so no single piece eats the budget.
        </Detail>
        <Detail title="Brands in this edit">
          Real pieces from Snitch, Powerlook, Rare Rabbit, Bonkers Corner, Neeman&apos;s, Bacca Bucci and Comet.
        </Detail>
      </div>

      <ClosingCta items={items} total={look?.total ?? null} budget={previewBudget} fits={!!look || !result} />

      <StickyBar hidden={onIntro}>
        <div className="flex items-center gap-4">
          <div className="shrink-0">
            <Price amount={formatINR(look?.total ?? budget)} className="block text-[19px] leading-tight" />
            <Tag tone={look ? "info" : "alert"}>{look ? `${formatINR(look.remaining)} under` : "Over budget"}</Tag>
          </div>
          <Button type="submit" disabled={budget <= 0} className="flex-1">
            {look || !result ? "Style this look" : "See my options"}
          </Button>
        </div>
      </StickyBar>
    </form>
  );
}

function OccasionTile({
  occasion: o,
  index,
  active,
  onSelect,
}: {
  occasion: Occasion;
  index: number;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button type="button" role="radio" aria-checked={active} onClick={onSelect} className="group text-left">
      <div className="relative aspect-[3/4] overflow-hidden bg-subtle">
        {o.showcase[0] && (
          <Image
            src={o.showcase[0].image}
            alt=""
            fill
            sizes="200px"
            className="object-cover object-top transition duration-700 group-hover:scale-[1.03]"
          />
        )}
        {active && (
          <span className="absolute top-2 right-2 grid size-6 animate-pop place-items-center rounded-full bg-white text-fg shadow-sm">
            <Icon.Check width={13} height={13} strokeWidth={2.4} />
          </span>
        )}
      </div>
      <span className={`mt-2 block h-[2px] origin-left bg-fg transition-transform duration-300 ${active ? "scale-x-100" : "scale-x-0"}`} />
      <div className="mt-2 flex items-baseline justify-between gap-2">
        <span className="text-[15px] font-semibold tracking-[-0.01em]">
          <span className="mr-1.5 font-mono text-[10px] font-normal text-muted">{String(index + 1).padStart(2, "0")}</span>
          {o.label}
        </span>
        <span className="font-mono text-[10px] text-muted tabular-nums">{formatINR(o.minLookPrice)}+</span>
      </div>
      <p className="text-[12.5px] text-muted">{o.mood}</p>
      <span className="mt-1.5 flex gap-1" aria-hidden>
        {o.showcase.map((p) => (
          <span key={p.id} className="size-3 rounded-full ring-1 ring-black/10" style={{ backgroundColor: p.tags.colourHex }} />
        ))}
      </span>
    </button>
  );
}

function Detail({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <details className="group border-b border-line">
      <summary className="flex cursor-pointer list-none items-center justify-between py-4 text-[16px] font-semibold [&::-webkit-details-marker]:hidden">
        {title}
        <Icon.Plus width={16} height={16} className="transition duration-300 group-open:rotate-45" />
      </summary>
      <p className="pb-4 text-[14px] leading-relaxed text-muted">{children}</p>
    </details>
  );
}

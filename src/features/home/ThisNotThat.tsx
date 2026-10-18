"use client";

import { useQuery } from "@tanstack/react-query";
import { Icon } from "@/components/ui/Icon";
import { ProductImage } from "@/components/ui/ProductImage";
import type { LookItem, OccasionId } from "@/domain/types";
import { api, queryKeys } from "@/lib/api";
import { formatINR } from "@/lib/format";
import { useInView } from "@/lib/useInView";

// A real in-budget look the pairing rules reject, next to the recommended one.
export function ThisNotThat({
  occasion,
  occasionLabel,
  budget,
  look,
}: {
  occasion: OccasionId;
  occasionLabel: string;
  budget: number;
  look: { items: LookItem[]; total: number; reasons: string[] };
}) {
  const [ref, seen] = useInView<HTMLDivElement>(0.3);
  const { data: clash } = useQuery({
    queryKey: queryKeys.contrast(occasion, budget),
    queryFn: () => api.contrast({ occasion, budget }),
  });
  if (!clash) return null;

  return (
    <section className="px-4 pt-14">
      <p className="font-mono text-[10.5px] tracking-[0.14em] text-muted uppercase">The difference</p>
      <h2 className="mt-2 text-[30px] leading-[1] font-semibold tracking-[-0.045em]">
        Style <span className="font-serif font-normal tracking-[-0.02em] italic">this,</span>
        <br />
        not that.
      </h2>
      <p className="mt-2 text-[13.5px] text-muted">
        Both fit {formatINR(budget)}. Only one works for {occasionLabel.toLowerCase()}.
      </p>

      <div ref={ref} className="mt-5 grid grid-cols-2 gap-3">
        <Column
          tone="bad"
          seen={seen}
          items={clash.items}
          total={clash.total}
          reasons={clash.reasons.slice(0, 3)}
        />
        <Column
          tone="good"
          seen={seen}
          items={look.items}
          total={look.total}
          reasons={[...look.reasons.slice(0, 2), "Within budget"]}
        />
      </div>
    </section>
  );
}

function Column({
  tone,
  seen,
  items,
  total,
  reasons,
}: {
  tone: "good" | "bad";
  seen: boolean;
  items: LookItem[];
  total: number;
  reasons: string[];
}) {
  const good = tone === "good";
  return (
    <div
      className={`flex flex-col ${good ? "outline-2 outline-offset-2 outline-fg" : ""}`}
      style={seen ? { animation: `fade-up 600ms ${good ? 220 : 0}ms cubic-bezier(0.2,0.7,0.2,1) both` } : { opacity: 0 }}
    >
      <p
        className={`flex items-center gap-1.5 py-2 font-mono text-[10.5px] tracking-[0.14em] uppercase ${
          good ? "text-fg" : "text-accent"
        }`}
      >
        <span className={`grid size-4 place-items-center rounded-full ${good ? "bg-fg text-bg" : "bg-accent text-white"}`}>
          {good ? <Icon.Check width={10} height={10} strokeWidth={3} /> : <Icon.Close width={10} height={10} strokeWidth={3} />}
        </span>
        {good ? "This" : "Not that"}
      </p>
      <div className="grid gap-px bg-line">
        {items.map((i) => (
          <ProductImage
            key={i.product.id}
            src={i.product.image}
            alt={i.product.name}
            colourHex={i.product.tags.colourHex}
            className="aspect-[4/3] w-full"
            sizes="200px"
            anchor={i.slot === "shoes" ? "center" : "top"}
          />
        ))}
      </div>
      <p className="mt-2 text-[16px] font-semibold tabular-nums">{formatINR(total)}</p>
      <ul className="mt-1.5 space-y-1.5 pb-2">
        {reasons.map((r, i) => (
          <li
            key={r}
            className="flex items-start gap-1.5 text-[12px] leading-snug"
            style={seen ? { animation: `fade-up 500ms ${500 + i * 160 + (good ? 220 : 0)}ms both` } : { opacity: 0 }}
          >
            <span className={`mt-px shrink-0 ${good ? "text-positive" : "text-accent"}`}>
              {good ? <Icon.Check width={12} height={12} strokeWidth={2.6} /> : <Icon.Close width={12} height={12} strokeWidth={2.6} />}
            </span>
            {r}
          </li>
        ))}
      </ul>
    </div>
  );
}

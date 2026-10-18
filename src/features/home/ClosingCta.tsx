"use client";

import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import type { LookItem } from "@/domain/types";
import { formatINR } from "@/lib/format";

export function ClosingCta({
  items,
  total,
  budget,
  fits,
}: {
  items: LookItem[] | null;
  total: number | null;
  budget: number;
  fits: boolean;
}) {
  return (
    <section className="relative mx-4 mb-10 overflow-hidden bg-fg px-5 pt-7 pb-6 text-bg">
      <p className="font-mono text-[10.5px] tracking-[0.14em] text-white/55 uppercase">Ready when you are</p>
      <h2 className="mt-2 text-[34px] leading-[0.98] font-semibold tracking-[-0.05em]">
        {fits ? "Your look is" : "Let's find"}
        <br />
        <span className="font-serif font-normal tracking-[-0.02em] italic">{fits ? "ready." : "what fits."}</span>
      </h2>

      {items && (
        <div className="mt-5 flex items-end justify-between gap-3">
          <div className="flex -space-x-2">
            {items.map((i) => (
              <span key={i.product.id} className="relative size-14 overflow-hidden ring-2 ring-fg">
                <Image src={i.product.image} alt="" fill sizes="56px" className="object-cover object-top" />
              </span>
            ))}
          </div>
          {total !== null && (
            <p className="text-right">
              <span className="block text-[24px] leading-none font-semibold tabular-nums">{formatINR(total)}</span>
              <span className="text-[12px] text-white/55">of {formatINR(budget)}</span>
            </p>
          )}
        </div>
      )}

      <Button type="submit" variant="inverse" className="mt-6 w-full">
        {fits ? "Style this look" : "See my options"} <Icon.Arrow width={18} height={18} />
      </Button>
    </section>
  );
}

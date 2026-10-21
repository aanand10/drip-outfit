"use client";

import { useQuery } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { LookGallery } from "@/components/outfit/LookGallery";
import { OutfitStage } from "@/components/outfit/OutfitStage";
import { Price, Tag } from "@/components/ui/Label";
import { StepHeader } from "@/components/ui/StepHeader";
import { StickyBar } from "@/components/ui/StickyBar";
import { SLOT_LABEL, SLOTS, type Look, type OccasionId, type Slot } from "@/domain/types";
import { track } from "@/lib/analytics";
import { api, queryKeys } from "@/lib/api";
import { formatINR } from "@/lib/format";
import { AddToCartButton } from "./AddToCartButton";
import { LookItemCard } from "./LookItemCard";
import { SwapSheet } from "./SwapSheet";
import { useLookSelection } from "./useLookSelection";

export function LookBuilder({
  look,
  occasion,
  occasionLabel,
}: {
  look: Look;
  occasion: OccasionId;
  occasionLabel: string;
}) {
  const { pieces, total, remaining, missingSize, anySwapped, swap, selectSize, clearSizes } = useLookSelection(look);
  const [swapping, setSwapping] = useState<Slot | null>(null);
  const [flash, setFlash] = useState<{ slot: Slot; n: number } | null>(null);
  const [toast, setToast] = useState<{ text: string; n: number } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const items = SLOTS.map((slot) => ({ slot, product: pieces[slot].product }));

  // Sizes use live stock, not the stock captured when the look was built.
  const variantIds = SLOTS.flatMap((s) => pieces[s].product.variants.map((v) => v.variantId));
  const { data: availability } = useQuery({
    queryKey: queryKeys.availability(variantIds),
    queryFn: () => api.availability({ variantIds }),
    refetchOnWindowFocus: true,
  });

  function notify(text: string) {
    clearTimeout(toastTimer.current);
    setToast((t) => ({ text, n: (t?.n ?? 0) + 1 }));
    toastTimer.current = setTimeout(() => setToast(null), 2800);
  }

  function focusPiece(slot: Slot) {
    document.getElementById(`piece-${slot}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    setFlash((f) => ({ slot, n: (f?.n ?? 0) + 1 }));
  }

  return (
    <>
      <LookGallery
        items={items}
        eyebrow={`${occasionLabel} · ${formatINR(look.budget)}`}
        title="Your look"
        pill={{ text: look.reasons[0], tone: "glass" }}
        badge={(item) => (pieces[item.slot].swapped ? "New" : null)}
      />

      <section className="px-4 pt-10">
        <StepHeader
          step={1}
          of={2}
          label="Fit"
          title="Pick your sizes"
          aside={
            <span className="pb-1 font-mono text-[10.5px] tracking-[0.1em] text-muted uppercase tabular-nums">
              {3 - missingSize.length}/3 set
            </span>
          }
        />
        <div className="border-t border-line">
          {SLOTS.map((slot) => (
            <LookItemCard
              key={`${slot}-${flash?.slot === slot ? flash.n : 0}`}
              slot={slot}
              piece={pieces[slot]}
              stock={availability?.stock}
              showKept={anySwapped}
              flash={flash?.slot === slot}
              onSwap={() => {
                setSwapping(slot);
                track("swap_opened", { slot, product_id: pieces[slot].product.id });
              }}
              onSize={(variantId) => {
                selectSize(slot, variantId);
                const { product } = pieces[slot];
                const variant = product.variants.find((v) => v.variantId === variantId)!;
                const stock_left = availability?.stock[variantId] ?? variant.stock;
                track("size_selected", { slot, product_id: product.id, size: variant.size, stock_left });
              }}
            />
          ))}
        </div>
      </section>

      <section className="px-4 pt-12 pb-10">
        <StepHeader step={2} of={2} label="Styling" title="How it comes together" />
        <ul className="mb-4 flex flex-wrap gap-1.5">
          {look.reasons.map((r) => (
            <li key={r} className="rounded-full border border-line px-3 py-1 font-mono text-[10.5px] tracking-[0.06em] uppercase">
              {r}
            </li>
          ))}
        </ul>
        <div className="bg-subtle px-3 py-6">
          <OutfitStage
            items={SLOTS.map((slot) => ({ slot, product: pieces[slot].product, isNew: pieces[slot].swapped }))}
            onSelect={focusPiece}
          />
        </div>
      </section>

      <StickyBar>
        <div className="mb-3 flex gap-1" aria-hidden>
          {SLOTS.map((slot) => (
            <span
              key={slot}
              className={`h-[3px] flex-1 rounded-full transition-colors duration-300 ${
                pieces[slot].variantId ? "bg-fg" : pieces[slot].swapped ? "bg-accent/50" : "bg-line"
              }`}
            />
          ))}
        </div>
        <div className="flex items-center gap-4">
          <div className="shrink-0" aria-live="polite">
            <Price key={total} amount={formatINR(total)} className="block animate-fade-in text-[19px] leading-tight" />
            <Tag tone={remaining >= 0 ? "info" : "alert"}>
              {formatINR(Math.abs(remaining))} {remaining >= 0 ? "under" : "over"}
            </Tag>
          </div>
          <AddToCartButton
            variantIds={SLOTS.flatMap((s) => pieces[s].variantId ?? [])}
            total={total}
            missingSize={missingSize}
            onNeedSizes={focusPiece}
            onError={(message, soldOut) => {
              clearSizes(soldOut);
              notify(message);
            }}
          />
        </div>
      </StickyBar>

      {toast && (
        <div
          key={toast.n}
          role="status"
          className="pointer-events-none fixed inset-x-0 bottom-32 z-40 mx-auto w-fit max-w-[360px] animate-toast rounded-full bg-fg px-4 py-2.5 text-center text-[13px] text-bg shadow-xl"
        >
          {toast.text}
        </div>
      )}

      <SwapSheet
        slot={swapping}
        pieces={pieces}
        occasion={occasion}
        budget={look.budget}
        onClose={() => setSwapping(null)}
        onPick={(slot, product) => {
          const from = pieces[slot].product;
          track("swap_option_picked", {
            slot,
            from_product_id: from.id,
            to_product_id: product.id,
            price_delta: product.price - from.price,
            new_total: total - from.price + product.price,
          });
          swap(slot, product);
          setSwapping(null);
          notify(`${SLOT_LABEL[slot]} swapped. Pick your size`);
          setTimeout(() => focusPiece(slot), 250);
        }}
      />
    </>
  );
}

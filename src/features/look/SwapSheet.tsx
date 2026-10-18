"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { Icon } from "@/components/ui/Icon";
import { IconButton } from "@/components/ui/IconButton";
import { Label } from "@/components/ui/Label";
import { ProductImage } from "@/components/ui/ProductImage";
import { SLOT_LABEL, SLOTS, type OccasionId, type Product, type Slot } from "@/domain/types";
import { api, queryKeys } from "@/lib/api";
import { formatDelta, formatINR } from "@/lib/format";
import type { SelectedPiece } from "./useLookSelection";

export function SwapSheet({
  slot,
  pieces,
  occasion,
  budget,
  onPick,
  onClose,
}: {
  slot: Slot | null;
  pieces: Record<Slot, SelectedPiece>;
  occasion: OccasionId;
  budget: number;
  onPick: (slot: Slot, product: Product) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (slot && !dialog.open) dialog.showModal();
    if (!slot && dialog.open) dialog.close();
  }, [slot]);

  const current = slot ? pieces[slot].product : null;
  const keptSlots = slot ? SLOTS.filter((s) => s !== slot) : [];
  const kept = Object.fromEntries(keptSlots.map((s) => [s, pieces[s].product.id]));

  const { data, isPending } = useQuery({
    queryKey: queryKeys.swapOptions(slot ?? "", current?.id ?? "", Object.values(kept), budget),
    queryFn: () => api.swapOptions({ occasion, budget, slot: slot!, currentProductId: current!.id, kept }),
    enabled: slot !== null,
  });

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      aria-label={slot ? `Swap ${SLOT_LABEL[slot].toLowerCase()}` : undefined}
      className="m-0 mx-auto mt-auto max-h-[88dvh] w-full max-w-[440px] overflow-y-auto rounded-t-[28px] bg-bg p-0 text-fg open:animate-sheet-in"
    >
      {slot && current && (
        <div className="pt-2.5 pb-[max(20px,env(safe-area-inset-bottom))]">
          <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-line" aria-hidden />

          <div className="flex items-start justify-between gap-4 px-5">
            <div>
              <Label className="text-muted">Swap {SLOT_LABEL[slot].toLowerCase()}</Label>
              <h2 className="mt-1.5 text-[22px] leading-tight font-semibold tracking-[-0.02em]">
                Picked to go with
                <br />
                what you&apos;re keeping
              </h2>
            </div>
            <IconButton label="Close" onClick={onClose}>
              <Icon.Close width={18} height={18} />
            </IconButton>
          </div>

          <div className="mx-5 mt-4 flex items-center gap-3 border-y border-line py-2.5">
            <div className="flex -space-x-3">
              {keptSlots.map((s) => (
                <ProductImage
                  key={s}
                  src={pieces[s].product.image}
                  alt={pieces[s].product.name}
                  colourHex={pieces[s].product.tags.colourHex}
                  className="aspect-[4/5] w-10 ring-2 ring-subtle"
                  sizes="40px"
                />
              ))}
            </div>
            <p className="min-w-0 text-[12px] leading-snug text-muted">
              <span className="font-medium text-fg">Keeping</span>{" "}
              {keptSlots.map((s) => pieces[s].product.name).join(" + ")}
            </p>
          </div>

          <div className="no-scrollbar mt-5 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-5 px-5 pb-2">
            {isPending &&
              Array.from({ length: 3 }, (_, i) => (
                <div key={i} className="aspect-[4/6] w-[62%] shrink-0 animate-pulse bg-subtle" />
              ))}
            {data?.options.length === 0 && (
              <p className="py-12 text-[14px] text-muted">
                Nothing else goes with these two within {formatINR(budget)}. Try swapping a different piece.
              </p>
            )}
            {data?.options.map(({ product, priceDelta, newTotal }, i) => (
              <button
                key={product.id}
                type="button"
                onClick={() => onPick(slot, product)}
                style={{ animationDelay: `${i * 50}ms` }}
                className="group w-[62%] shrink-0 animate-fade-up snap-start text-left"
              >
                <div className="relative">
                  <ProductImage
                    src={product.image}
                    alt={product.name}
                    colourHex={product.tags.colourHex}
                    className="aspect-[4/5] w-full transition duration-300 group-active:scale-[0.98]"
                    sizes="260px"
                  />
                  <span
                    className={`absolute top-2.5 left-2.5 rounded-full px-2.5 py-1 text-[12px] font-semibold tabular-nums backdrop-blur-md ${
                      priceDelta > 0 ? "bg-black/55 text-white" : "bg-white/80 text-fg"
                    }`}
                  >
                    {formatDelta(priceDelta)}
                  </span>
                </div>
                <p className="mt-2.5 text-[12px] text-muted">{product.brand}</p>
                {/* Several products are colourways sharing one name. */}
                <p className="line-clamp-1 text-[14px] font-medium">
                  {product.name} <span className="font-normal text-muted capitalize">· {product.tags.colour}</span>
                </p>
                <p className="mt-1 text-[14px] tabular-nums">
                  <span className="font-semibold">{formatINR(product.price)}</span>
                  <span className="text-muted"> · look {formatINR(newTotal)}</span>
                </p>
              </button>
            ))}
          </div>
          <p className="mt-3 px-5 text-[12px] text-muted">
            Every option keeps the whole look within {formatINR(budget)}.
          </p>
        </div>
      )}
    </dialog>
  );
}

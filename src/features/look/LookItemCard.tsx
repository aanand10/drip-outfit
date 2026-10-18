import { Icon } from "@/components/ui/Icon";
import { Label, Price } from "@/components/ui/Label";
import { ProductImage } from "@/components/ui/ProductImage";
import { SLOT_LABEL, type Slot } from "@/domain/types";
import { formatINR } from "@/lib/format";
import { SizeChips } from "./SizeChips";
import type { SelectedPiece } from "./useLookSelection";

export function LookItemCard({
  slot,
  piece,
  stock,
  showKept,
  flash,
  onSwap,
  onSize,
}: {
  slot: Slot;
  piece: SelectedPiece;
  stock?: Record<string, number>; // live availability; catalogue stock until it loads
  showKept: boolean;
  flash: boolean;
  onSwap: () => void;
  onSize: (variantId: string) => void;
}) {
  const { product, variantId, swapped } = piece;
  const needsSize = variantId === null;
  const highlight = swapped && needsSize;
  const variants = product.variants.map((v) => ({ ...v, stock: stock?.[v.variantId] ?? v.stock }));
  const chosen = variants.find((v) => v.variantId === variantId);

  return (
    <article
      id={`piece-${slot}`}
      className={`relative -mx-4 scroll-mt-24 border-b border-line px-4 py-5 transition-colors ${
        highlight ? "bg-accent-soft/50" : ""
      } ${flash ? "animate-flash" : ""}`}
    >
      {highlight && <span aria-hidden className="absolute inset-y-0 left-0 w-[3px] bg-accent" />}
      <div className="flex gap-3.5">
        <ProductImage
          key={product.id}
          src={product.image}
          alt={product.name}
          colourHex={product.tags.colourHex}
          className="aspect-[4/5] w-[86px] shrink-0"
          sizes="86px"
        />
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2">
              <Label className="text-muted">{SLOT_LABEL[slot]}</Label>
              {swapped ? (
                <Label className="animate-pop text-accent">New</Label>
              ) : (
                showKept && <Label className="text-muted/60">Kept</Label>
              )}
            </span>
            <button
              type="button"
              onClick={onSwap}
              aria-label={`Swap ${SLOT_LABEL[slot].toLowerCase()}`}
              className="-my-1 inline-flex h-8 items-center gap-1.5 rounded-full border border-line px-3 text-[12.5px] font-semibold transition hover:border-fg active:scale-95"
            >
              <Icon.Swap width={13} height={13} strokeWidth={2} />
              Swap
            </button>
          </div>
          <p className="mt-2 text-[12.5px] text-muted">{product.brand}</p>
          <a
            href={product.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="line-clamp-2 text-[15px] leading-[1.3] font-medium tracking-[-0.01em] hover:underline"
          >
            {product.name}
          </a>
          <Price amount={formatINR(product.price)} className="mt-auto pt-1.5 text-[16px]" />
        </div>
      </div>

      <div className="mt-4">
        {/* Status shares the label line so selecting never shifts the layout. */}
        <p className={`mb-2 text-[12.5px] ${highlight ? "font-semibold text-accent" : "text-muted"}`}>
          {highlight ? "New piece. Pick your size" : needsSize ? "Pick your size" : "Size"}
          {chosen && chosen.stock > 0 && chosen.stock <= 2 && <span className="font-medium text-accent"> · Only {chosen.stock} left</span>}
        </p>
        <SizeChips name={product.name} variants={variants} value={variantId} onChange={onSize} />
      </div>
    </article>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { IconButton } from "@/components/ui/IconButton";
import { Price } from "@/components/ui/Label";
import { ProductImage } from "@/components/ui/ProductImage";
import { SLOT_LABEL, SLOTS, type Product, type Slot } from "@/domain/types";
import { formatINR } from "@/lib/format";
import { describe } from "./garments";
import { anchorsFor, FIGURE, Mannequin } from "./Mannequin";

// Fixed geometry (px) so leader lines line up without measuring the DOM.
const STAGE_H = 380;
const SCALE = STAGE_H / FIGURE.height;
const FIG_W = Math.round(FIGURE.width * SCALE);
const GAP = 16;
const TILE_H = 112;
const CYCLE_MS = 3200;
const tileCentre = (i: number) => TILE_H / 2 + i * ((STAGE_H - TILE_H) / 2);

const FORMALITY = ["", "Relaxed", "Easy", "Smart casual", "Sharp", "Festive"];
const STYLE_LABEL: Record<Product["tags"]["style"], string> = {
  classic: "Classic",
  "smart-casual": "Smart casual",
  street: "Street",
  ethnic: "Ethnic",
  sport: "Sport",
};

export interface StageItem {
  slot: Slot;
  product: Product;
  isNew?: boolean;
}

// Illustrated look. Tapping a garment or card focuses it; until then, focus cycles
// through the pieces while the stage is on screen.
export function OutfitStage({ items, onSelect }: { items: StageItem[]; onSelect?: (slot: Slot) => void }) {
  const bySlot = Object.fromEntries(items.map((i) => [i.slot, i])) as Record<Slot, StageItem>;
  const root = useRef<HTMLDivElement>(null);
  const [picked, setPicked] = useState<Slot | null>(null);
  const [touched, setTouched] = useState(false);
  const [auto, setAuto] = useState(0);
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (touched || !visible) return;
    const id = setInterval(() => setAuto((n) => (n + 1) % SLOTS.length), CYCLE_MS);
    return () => clearInterval(id);
  }, [touched, visible]);

  if (!bySlot.top || !bySlot.trousers || !bySlot.shoes) return null;
  const anchors = anchorsFor(bySlot.top.product);
  const active: Slot | null = touched ? picked : SLOTS[auto];
  const focus = active ? bySlot[active] : null;

  function choose(slot: Slot) {
    setTouched(true);
    setPicked((p) => (p === slot ? null : slot));
  }

  return (
    <div ref={root}>
      <div className="relative flex" style={{ height: STAGE_H, gap: GAP }}>
        <div className="relative shrink-0" style={{ width: FIG_W }}>
          <Mannequin
            top={bySlot.top.product}
            trousers={bySlot.trousers.product}
            shoes={bySlot.shoes.product}
            active={active}
            onZone={choose}
          />
          <button
            type="button"
            onClick={() => setExpanded(true)}
            aria-label="Open full illustrated view"
            title="Full view"
            className="absolute top-0 left-0 grid size-8 place-items-center rounded-full border border-line bg-bg/90 backdrop-blur transition hover:border-fg active:scale-90"
          >
            <Icon.Expand width={13} height={13} strokeWidth={2} />
          </button>
        </div>

        <svg
          aria-hidden
          className="pointer-events-none absolute top-0 left-0 overflow-visible"
          width={FIG_W + GAP}
          height={STAGE_H}
        >
          {SLOTS.map((slot, i) => {
            const a = anchors[slot];
            const x1 = a.x * SCALE;
            const y1 = a.y * SCALE;
            const y2 = tileCentre(i);
            const on = active === slot;
            const dim = active !== null && !on;
            return (
              <g key={slot} style={{ opacity: dim ? 0.5 : 1, transition: "opacity 400ms" }}>
                <path
                  d={`M${x1} ${y1} C ${x1 + 26} ${y1}, ${FIG_W - 10} ${y2}, ${FIG_W + GAP} ${y2}`}
                  fill="none"
                  stroke="#111"
                  strokeOpacity={on ? 0.85 : 0.35}
                  strokeWidth={on ? 1.3 : 1}
                  strokeDasharray="2 3"
                  style={on ? { animation: "dash 0.9s linear infinite" } : undefined}
                />
                {on && (
                  <circle
                    cx={x1}
                    cy={y1}
                    r="5"
                    fill="none"
                    stroke="#111"
                    strokeOpacity="0.5"
                    className="animate-ping"
                    style={{ transformBox: "fill-box", transformOrigin: "center", animationDuration: "1.6s" }}
                  />
                )}
                <circle cx={x1} cy={y1} r={on ? 5.5 : 5} fill="#fff" stroke="#111" strokeWidth="1.2" />
                <circle cx={x1} cy={y1} r="2" fill={on ? "var(--accent)" : "#111"} />
              </g>
            );
          })}
        </svg>

        <div className="flex min-w-0 flex-1 flex-col justify-between">
          {SLOTS.map((slot) => {
            const { product, isNew } = bySlot[slot];
            const on = active === slot;
            return (
              <button
                key={slot}
                type="button"
                aria-pressed={on}
                onClick={() => choose(slot)}
                style={{ height: TILE_H }}
                className={`flex gap-2.5 bg-bg p-2 text-left transition duration-300 active:scale-[0.98] ${
                  on ? "shadow-[0_10px_30px_-12px_rgba(0,0,0,0.35)] ring-1 ring-fg" : active ? "opacity-75" : ""
                }`}
              >
                <ProductImage
                  key={product.id}
                  src={product.image}
                  alt={product.name}
                  colourHex={product.tags.colourHex}
                  className="h-full w-[70px] shrink-0"
                  sizes="70px"
                />
                <span className="flex min-w-0 flex-1 flex-col py-0.5">
                  <span className="flex items-center gap-1.5 font-mono text-[10px] tracking-[0.08em] text-muted uppercase">
                    {SLOT_LABEL[slot]}
                    {isNew && <span className="rounded-sm bg-accent px-1 text-white">New</span>}
                  </span>
                  <span className="mt-1 truncate text-[11px] text-muted">{product.brand}</span>
                  <span className="line-clamp-2 text-[13px] leading-tight font-medium">{product.name}</span>
                  <Price amount={formatINR(product.price)} className="mt-auto text-[14px]" />
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <Spec focus={focus} onSelect={onSelect} />
      <Alignment items={SLOTS.map((s) => bySlot[s])} active={active} onPick={choose} />

      <FullView
        open={expanded}
        onClose={() => setExpanded(false)}
        bySlot={bySlot}
        onSelect={
          onSelect
            ? (slot) => {
                setExpanded(false);
                onSelect(slot);
              }
            : undefined
        }
      />
    </div>
  );
}

// Full-screen illustration with its own selection, starting on "All".
function FullView({
  open,
  onClose,
  bySlot,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  bySlot: Record<Slot, StageItem>;
  onSelect?: (slot: Slot) => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-label="Illustrated look"
      className="m-0 mx-auto h-dvh max-h-dvh w-full max-w-[440px] overflow-y-auto bg-subtle p-0 text-fg open:animate-fade-in"
    >
      {open && <FullViewBody bySlot={bySlot} onClose={onClose} onSelect={onSelect} />}
    </dialog>
  );
}

// Mounted only while open, so every opening starts on the whole look.
function FullViewBody({
  bySlot,
  onClose,
  onSelect,
}: {
  bySlot: Record<Slot, StageItem>;
  onClose: () => void;
  onSelect?: (slot: Slot) => void;
}) {
  const [active, setActive] = useState<Slot | null>(null);
  const onPick = (slot: Slot) => setActive((a) => (a === slot ? null : slot));
  const focus = active ? bySlot[active] : null;
  const total = SLOTS.reduce((sum, s) => sum + bySlot[s].product.price, 0);

  return (
    <div className="flex min-h-full flex-col px-4 pt-4 pb-8">
      <div className="flex items-center justify-between">
        <p className="font-mono text-[10.5px] tracking-[0.14em] text-muted uppercase">The look · Illustrated</p>
        <IconButton label="Close full view" onClick={onClose} className="bg-bg!">
          <Icon.Close width={18} height={18} />
        </IconButton>
      </div>

      <div className="mx-auto mt-2 h-[58dvh] min-h-[380px] aspect-[2/5]">
        <Mannequin
          top={bySlot.top.product}
          trousers={bySlot.trousers.product}
          shoes={bySlot.shoes.product}
          active={active}
          onZone={onPick}
        />
      </div>

      <div className="mt-4 grid grid-cols-[auto_1fr_1fr_1fr] gap-2">
        <button
          type="button"
          aria-pressed={active === null}
          onClick={() => setActive(null)}
          className={`bg-bg px-3 font-mono text-[10px] tracking-[0.1em] uppercase transition ${
            active === null ? "ring-1 ring-fg" : "text-muted"
          }`}
        >
          All
        </button>
        {SLOTS.map((slot) => {
          const { product } = bySlot[slot];
          const on = active === slot;
          return (
            <button
              key={slot}
              type="button"
              aria-pressed={on}
              onClick={() => onPick(slot)}
              className={`flex min-w-0 items-center gap-2 bg-bg p-1.5 text-left transition ${on ? "ring-1 ring-fg" : ""}`}
            >
              <ProductImage
                src={product.image}
                alt=""
                colourHex={product.tags.colourHex}
                className="aspect-[4/5] w-9 shrink-0"
                sizes="36px"
              />
              <span className="min-w-0">
                <span className="block font-mono text-[9.5px] tracking-[0.08em] text-muted uppercase">
                  {SLOT_LABEL[slot]}
                </span>
                <span className="block truncate text-[11.5px] font-medium">{product.brand}</span>
              </span>
            </button>
          );
        })}
      </div>

      {focus ? (
        <Spec focus={focus} onSelect={onSelect} />
      ) : (
        <div className="mt-5 flex items-baseline justify-between border-t border-line pt-4">
          <span className="font-mono text-[10.5px] tracking-[0.1em] text-muted uppercase">
            Whole look · tap a piece to inspect
          </span>
          <Price amount={formatINR(total)} className="text-[16px]" />
        </div>
      )}
    </div>
  );
}

function Spec({ focus, onSelect }: { focus: StageItem | null; onSelect?: (slot: Slot) => void }) {
  if (!focus) {
    return (
      <p className="mt-5 border-t border-line pt-4 font-mono text-[10.5px] tracking-[0.1em] text-muted uppercase">
        Tap a piece to inspect it
      </p>
    );
  }
  const { product, slot } = focus;
  const t = product.tags;
  return (
    <div key={product.id} className="mt-5 animate-fade-up border-t border-line pt-4">
      <div className="flex items-center gap-3">
        <span
          className="size-9 shrink-0 ring-1 ring-black/10"
          style={{ backgroundColor: t.colourHex }}
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[10px] tracking-[0.12em] text-muted uppercase">
            {SLOT_LABEL[slot]} · {product.brand}
          </p>
          <p className="truncate text-[15px] font-semibold tracking-[-0.01em]">{describe(product)}</p>
        </div>
        {onSelect && (
          <button
            type="button"
            onClick={() => onSelect(slot)}
            className="shrink-0 rounded-full border border-line px-3 py-1.5 text-[12px] font-semibold hover:border-fg"
          >
            Go to size
          </button>
        )}
      </div>
      <dl className="mt-3 grid grid-cols-3 gap-2 font-mono text-[10px] tracking-[0.08em] uppercase">
        <Stat label="Colour" value={t.colour} />
        <Stat label="Family" value={t.colourFamily} />
        <Stat label="Style" value={STYLE_LABEL[t.style]} />
      </dl>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-line px-2 py-1.5">
      <dt className="text-muted">{label}</dt>
      <dd className="mt-0.5 truncate text-fg">{value}</dd>
    </div>
  );
}

// Shared palette strip plus a formality bar per piece.
function Alignment({
  items,
  active,
  onPick,
}: {
  items: StageItem[];
  active: Slot | null;
  onPick: (slot: Slot) => void;
}) {
  return (
    <div className="mt-5">
      <div className="flex h-2 overflow-hidden" aria-label="Outfit palette">
        {items.map(({ slot, product }) => (
          <span
            key={slot}
            className="flex-1 transition-[flex-grow] duration-500"
            style={{ backgroundColor: product.tags.colourHex, flexGrow: active === slot ? 2 : 1 }}
          />
        ))}
      </div>

      <p className="mt-4 mb-2 font-mono text-[10px] tracking-[0.12em] text-muted uppercase">Formality alignment</p>
      <ul className="space-y-1.5">
        {items.map(({ slot, product }) => {
          const level = product.tags.formality;
          const on = active === slot;
          return (
            <li key={slot}>
              <button
                type="button"
                onClick={() => onPick(slot)}
                className={`flex w-full items-center gap-3 text-left transition-opacity ${active && !on ? "opacity-60" : ""}`}
              >
                <span className="w-[64px] shrink-0 font-mono text-[10px] tracking-[0.08em] uppercase">
                  {SLOT_LABEL[slot]}
                </span>
                <span className="flex flex-1 gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <span
                      key={n}
                      className={`h-1.5 flex-1 transition-colors duration-300 ${
                        n <= level ? (on ? "bg-accent" : "bg-fg") : "bg-line"
                      }`}
                    />
                  ))}
                </span>
                <span className="w-[78px] shrink-0 text-right text-[11px] text-muted">{FORMALITY[level]}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

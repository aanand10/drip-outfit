"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { SLOT_LABEL, type LookItem } from "@/domain/types";
import { formatINR } from "@/lib/format";

// Swipeable photos of the look. "full" fills the first screen; "card" sits inside a section.
export function LookGallery({
  items,
  title,
  eyebrow,
  pill,
  muted = false,
  variant = "full",
  badge,
}: {
  items: LookItem[] | null;
  title?: string;
  eyebrow?: string;
  pill?: { text: string; tone: "glass" | "alert" };
  muted?: boolean;
  variant?: "full" | "card";
  badge?: (item: LookItem) => string | null;
}) {
  const track = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const current = items?.[active];

  function go(i: number) {
    const el = track.current;
    if (el) el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  }

  const frame =
    variant === "full"
      ? "h-[calc(100svh-88px)] max-h-[740px] min-h-[520px]"
      : "aspect-[4/5] w-full";

  return (
    <section className={`relative overflow-hidden bg-ink ${frame}`}>
      <div
        ref={track}
        onScroll={(e) => setActive(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
        className={`no-scrollbar flex h-full snap-x snap-mandatory overflow-x-auto transition duration-700 ${muted ? "grayscale" : ""}`}
      >
        {(items ?? [null, null, null]).map((item, i) => (
          <div key={item?.product.id ?? i} className="relative h-full w-full shrink-0 snap-center">
            {item ? (
              <Image
                src={item.product.image}
                alt={item.product.name}
                fill
                priority={i === 0}
                sizes="(max-width: 440px) 100vw, 440px"
                className="animate-fade-in object-cover object-top"
              />
            ) : (
              <div className="h-full w-full animate-pulse bg-[#222]" />
            )}
          </div>
        ))}
      </div>

      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-black/45 to-transparent" />
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-52 bg-gradient-to-t from-black/65 to-transparent" />

      {title && (
        <div className="pointer-events-none absolute inset-x-0 top-[70px] text-center text-white">
          {eyebrow && <p className="font-mono text-[10.5px] tracking-[0.2em] text-white/70 uppercase">{eyebrow}</p>}
          <h1 key={title} className="mt-1.5 animate-fade-up text-[19px] font-medium tracking-[-0.01em]">
            {title}
          </h1>
        </div>
      )}

      {pill && (
        <div className={`pointer-events-none absolute inset-x-0 flex justify-center ${variant === "full" ? "top-[62%]" : "top-4"}`}>
          <span
            key={pill.text}
            className={`animate-fade-up rounded-full border px-3.5 py-1.5 font-mono text-[10.5px] tracking-[0.14em] uppercase backdrop-blur-md ${
              pill.tone === "alert" ? "border-white/20 bg-accent/85 text-white" : "border-white/30 bg-white/15 text-white"
            }`}
          >
            {pill.text}
          </span>
        </div>
      )}

      {current && (
        <div key={current.product.id} className="absolute bottom-5 left-4 max-w-[56%] animate-fade-up text-white">
          <p className="font-mono text-[10px] tracking-[0.16em] text-white/70 uppercase">
            {SLOT_LABEL[current.slot]} · {current.product.brand}
            {badge?.(current) && <span className="ml-1.5 rounded-sm bg-accent px-1 text-white">{badge(current)}</span>}
          </p>
          <p className="mt-0.5 line-clamp-1 text-[15px] font-medium">{current.product.name}</p>
          <p className="text-[14px] font-semibold tabular-nums">{formatINR(current.product.price)}</p>
        </div>
      )}

      <div className={`absolute inset-x-0 flex justify-center ${variant === "full" ? "bottom-[86px]" : "bottom-[84px]"}`}>
        <div className="flex items-center gap-1 rounded-full bg-white/20 px-2 py-1.5 backdrop-blur-md">
          {(items ?? [0, 1, 2]).map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Show piece ${i + 1}`}
              onClick={() => go(i)}
              className={`h-1.5 rounded-full bg-white transition-all duration-300 ${i === active ? "w-5" : "w-1.5 opacity-50"}`}
            />
          ))}
        </div>
      </div>

      {items && (
        <div className="absolute right-4 bottom-5 flex flex-col items-center">
          <div className="flex -space-x-3">
            {items.map((item, i) => (
              <button
                key={item.product.id}
                type="button"
                onClick={() => go(i)}
                aria-label={`Show ${SLOT_LABEL[item.slot].toLowerCase()}`}
                className={`relative size-12 overflow-hidden rounded-full border-2 transition ${
                  i === active ? "z-10 scale-110 border-white" : "border-white/50"
                }`}
              >
                <Image src={item.product.image} alt="" fill sizes="48px" className="object-cover object-top" />
              </button>
            ))}
          </div>
          <span className="-mt-2 rounded-full bg-white px-2.5 py-0.5 font-mono text-[10px] font-medium tracking-[0.1em] text-fg uppercase">
            The look
          </span>
        </div>
      )}
    </section>
  );
}

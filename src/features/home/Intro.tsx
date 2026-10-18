"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { SLOT_LABEL, type Occasion, type OccasionId } from "@/domain/types";
import { formatINR } from "@/lib/format";

const SLIDE_MS = 4800;
const PHRASE: Record<OccasionId, string> = {
  "date-night": "date night.",
  office: "the office.",
  wedding: "a wedding.",
  casual: "the weekend.",
};
// Tag positions on the photo for top, trousers, shoes.
const HOTSPOTS = [
  { top: "24%", side: "right" },
  { top: "36%", side: "left" },
  { top: "48%", side: "right" },
] as const;
const TICKER = ["3 pieces", "1 budget", "0 guesswork", "Real brands", "Swap any piece", "Never over budget"];

// Auto-advancing story, one slide per occasion's look. Pauses while off screen.
export function Intro({
  ref,
  occasions,
  playing,
  onStart,
}: {
  ref: React.Ref<HTMLElement>;
  occasions: Occasion[];
  playing: boolean;
  onStart: (occasion: OccasionId | null) => void;
}) {
  const [slide, setSlide] = useState({ index: 0, prev: -1 });
  const count = occasions.length;
  const current = occasions[slide.index];

  useEffect(() => {
    if (!playing || count < 2) return;
    const id = setTimeout(
      () => setSlide((s) => ({ prev: s.index, index: (s.index + 1) % count })),
      SLIDE_MS,
    );
    return () => clearTimeout(id);
  }, [slide.index, playing, count]);

  const jump = (i: number) => setSlide((s) => (i === s.index ? s : { prev: s.index, index: i }));

  return (
    <section ref={ref} className="relative h-[100svh] max-h-[880px] min-h-[620px] overflow-hidden bg-ink text-white">
      {/* The previous photo stays underneath while the next wipes over it. */}
      {occasions.map((o, i) => {
        const isCurrent = i === slide.index;
        const isPrev = i === slide.prev;
        if (!isCurrent && !isPrev) return null;
        return (
          <div
            key={o.id}
            className="absolute inset-0 overflow-hidden"
            style={{
              zIndex: isCurrent ? 2 : 1,
              animation: isCurrent && slide.prev >= 0 ? "wipe 900ms cubic-bezier(0.7,0,0.2,1) both" : undefined,
            }}
          >
            {o.showcase[0] && (
              <Image
                src={o.showcase[0].image}
                alt=""
                fill
                priority={i === 0}
                sizes="440px"
                className="object-cover object-top"
                style={{ animation: `kenburns ${SLIDE_MS + 900}ms ease-out both` }}
              />
            )}
          </div>
        );
      })}

      <div aria-hidden className="absolute inset-x-0 bottom-0 z-[3] h-[64%] bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
      <div aria-hidden className="absolute inset-x-0 top-0 z-[3] h-32 bg-gradient-to-b from-black/35 to-transparent" />

      {current?.showcase.map((p, i) => {
        const spot = HOTSPOTS[i];
        return (
          <div
            key={`${slide.index}-${p.id}`}
            className={`absolute z-[4] flex items-center gap-2 ${spot.side === "right" ? "right-4 flex-row-reverse" : "left-4"}`}
            style={{ top: spot.top, animation: `pop 500ms ${600 + i * 180}ms cubic-bezier(0.2,0.9,0.3,1.25) both` }}
          >
            <span className="relative grid size-3 place-items-center">
              <span className="absolute inset-0 animate-ping rounded-full bg-white/60" />
              <span className="size-2 rounded-full bg-white" />
            </span>
            <span className="rounded-full border border-white/25 bg-black/35 px-2.5 py-1 text-[11px] whitespace-nowrap backdrop-blur-md">
              <span className="font-mono text-[9.5px] tracking-[0.12em] text-white/65 uppercase">{SLOT_LABEL[p.slot]}</span>{" "}
              <span className="font-medium">{p.brand}</span>{" "}
              <span className="tabular-nums text-white/80">{formatINR(p.price)}</span>
            </span>
          </div>
        );
      })}

      <div className="absolute inset-x-0 bottom-0 z-[4] px-5 pb-5">
        <div
          className="flex items-center justify-between gap-3 font-mono text-[10.5px] tracking-[0.22em] text-white/60 uppercase"
          style={{ animation: "fade-up 700ms 100ms both" }}
        >
          <span>
            DRIP Stylist
            {current && (
              <span className="text-white"> — {String(slide.index + 1).padStart(2, "0")}</span>
            )}
            {current && <span> / {String(count).padStart(2, "0")}</span>}
          </span>
          <span className="flex items-center gap-1">
            {occasions.map((o, i) => (
              <button
                key={o.id}
                type="button"
                aria-label={`Show ${o.label}`}
                onClick={() => jump(i)}
                className="py-2"
              >
                <span className={`block h-[2px] overflow-hidden rounded-full bg-white/25 transition-all duration-300 ${i === slide.index ? "w-8" : "w-3.5"}`}>
                  <span
                    key={i === slide.index ? `on-${slide.index}` : "off"}
                    className="block h-full origin-left bg-white"
                    style={{
                      transform: i < slide.index ? "scaleX(1)" : "scaleX(0)",
                      animation: i === slide.index ? `fill ${SLIDE_MS}ms linear forwards` : undefined,
                      animationPlayState: playing ? "running" : "paused",
                    }}
                  />
                </span>
              </button>
            ))}
          </span>
        </div>
        <h1 className="mt-3 text-[50px] leading-[0.95] font-semibold tracking-[-0.055em]">
          <span className="block overflow-hidden pb-1">
            <span className="block" style={{ animation: "rise 800ms 200ms cubic-bezier(0.2,0.7,0.2,1) both" }}>
              Dressed for
            </span>
          </span>
          <span className="block h-[1.12em] overflow-hidden">
            <span
              key={slide.index}
              className="block font-serif text-[54px] font-normal tracking-[-0.02em] italic"
              style={{ animation: "roll-in 700ms cubic-bezier(0.2,0.7,0.2,1) both" }}
            >
              {current ? PHRASE[current.id] : "wherever."}
            </span>
          </span>
        </h1>
        <p className="mt-3 max-w-[34ch] text-[15px] leading-snug text-white/70" style={{ animation: "fade-up 700ms 450ms both" }}>
          Pick the occasion and a budget. We&apos;ll put together a top, trousers and shoes that work together, and
          stay within it.
          {current && (
            <span className="text-white"> {current.label} looks from {formatINR(current.minLookPrice)}.</span>
          )}
        </p>

        <Button
          type="button"
          variant="inverse"
          onClick={() => onStart(current?.id ?? null)}
          className="relative mt-6 w-full overflow-hidden"
          style={{ animation: "fade-up 700ms 600ms both" }}
        >
          <span
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-transparent via-black/10 to-transparent"
            style={{ animation: "shimmer 3.2s 1.2s ease-in-out infinite" }}
          />
          {current ? `Style my ${current.label.toLowerCase()} look` : "Start styling"}
          <Icon.Arrow width={18} height={18} className="rotate-90" />
        </Button>

        {/* Two copies so the marquee loops seamlessly. */}
        <div className="mt-5 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
          <div className="flex w-max gap-6 font-mono text-[10px] tracking-[0.2em] text-white/45 uppercase" style={{ animation: "marquee 22s linear infinite" }}>
            {[...TICKER, ...TICKER].map((b, i) => (
              <span key={i} className="flex items-center gap-6">
                {b}
                <span className="text-white/30">✦</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

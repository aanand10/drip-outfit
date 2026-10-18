"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { buttonClass } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Label, Price, Tag } from "@/components/ui/Label";
import { ProductImage } from "@/components/ui/ProductImage";
import { StickyBar } from "@/components/ui/StickyBar";
import { SLOT_LABEL } from "@/domain/types";
import { api, queryKeys } from "@/lib/api";
import { formatINR } from "@/lib/format";
import { useCartActions } from "./useCartActions";

// Renders only the cart the service returns.
export function CartScreen() {
  const { data: cart, isPending, isError, refetch } = useQuery({
    queryKey: queryKeys.cart,
    queryFn: api.getCart,
    staleTime: 0,
  });
  const actions = useCartActions();

  if (isPending) {
    return (
      <div className="flex flex-1 flex-col gap-4 px-4 pt-8" aria-busy="true">
        <div className="h-3 w-40 animate-pulse bg-subtle" />
        <div className="h-9 w-56 animate-pulse bg-subtle" />
        <div className="grid grid-cols-3 gap-1">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="aspect-[3/4] animate-pulse bg-subtle" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div role="alert" className="px-5 pt-16">
        <h1 className="text-[32px] leading-tight font-semibold tracking-[-0.04em]">We couldn&apos;t load your bag.</h1>
        <button type="button" onClick={() => refetch()} className={buttonClass("primary", "mt-6 w-full")}>
          Try again
        </button>
      </div>
    );
  }

  if (cart.itemCount === 0) {
    return (
      <div className="flex flex-1 flex-col justify-center px-5 pb-24">
        <Label className="text-muted">Bag · Empty</Label>
        <h1 className="mt-3 text-[40px] leading-[1] font-semibold tracking-[-0.05em]">
          Nothing here
          <br />
          <span className="font-serif font-normal tracking-[-0.02em] italic">yet.</span>
        </h1>
        <p className="mt-3 text-[15px] text-muted">Build a look and it&apos;ll land here, sized and ready.</p>
        <Link href="/" className={buttonClass("primary", "mt-8 w-full")}>
          Build a look <Icon.Arrow width={18} height={18} />
        </Link>
      </div>
    );
  }

  const latest = cart.items.slice(-3);

  return (
    <div className="flex flex-1 flex-col">
      <section className="px-4 pt-8">
        <p className="flex items-center gap-2 font-mono text-[10.5px] tracking-[0.14em] text-muted uppercase">
          <span className="grid size-4 animate-pop place-items-center rounded-full bg-positive text-white">
            <Icon.Check width={10} height={10} strokeWidth={3} />
          </span>
          Bag · Confirmed
        </p>
        <h1 className="mt-3 animate-fade-up text-[40px] leading-[1] font-semibold tracking-[-0.05em]">
          It&apos;s in
          <br />
          <span className="font-serif font-normal tracking-[-0.02em] italic">the bag.</span>
        </h1>
        <p className="mt-3 animate-fade-up text-[15px] text-muted [animation-delay:100ms]">
          {cart.itemCount} pieces, reserved in your sizes.
        </p>

        <div className="mt-6 grid grid-cols-3 gap-1">
          {latest.map((l, i) => (
            <div
              key={l.variantId}
              style={{ animationDelay: `${150 + i * 90}ms` }}
              className="relative aspect-[3/4] animate-fade-up overflow-hidden bg-subtle"
            >
              <Image src={l.image} alt={l.name} fill sizes="150px" className="object-cover object-top" />
            </div>
          ))}
        </div>
      </section>

      <section className="px-4 pt-10 pb-8">
        <div className="mb-2 flex items-baseline justify-between">
          <h2 className="text-[20px] font-medium tracking-[-0.02em]">Your bag</h2>
          <ClearBag onClear={actions.clear} clearing={actions.clearing} />
        </div>
        <ul className="border-t border-line">
          {cart.items.map((line) => (
            <li
              key={line.variantId}
              className={`flex gap-3.5 border-b border-line py-4 transition-opacity duration-300 ${
                actions.removingId === line.variantId || actions.clearing ? "opacity-40" : ""
              }`}
            >
              <ProductImage
                src={line.image}
                alt={line.name}
                colourHex={line.colourHex}
                className="aspect-[4/5] w-[68px] shrink-0"
                sizes="68px"
              />
              <div className="flex min-w-0 flex-1 flex-col">
                <Label className="text-muted">{SLOT_LABEL[line.slot]}</Label>
                <p className="mt-1.5 text-[12.5px] text-muted">{line.brand}</p>
                <p className="line-clamp-1 text-[15px] font-medium">{line.name}</p>
                <p className="mt-auto font-mono text-[11px] tracking-[0.06em] text-muted uppercase">
                  Size <span className="text-fg">{line.size}</span> · Qty {line.qty}
                </p>
              </div>
              <div className="flex flex-col items-end justify-between">
                <Price amount={formatINR(line.price * line.qty)} className="text-[15px]" />
                <button
                  type="button"
                  onClick={() => actions.remove(line.variantId)}
                  disabled={actions.removingId === line.variantId || actions.clearing}
                  aria-label={`Remove ${line.name}, size ${line.size}`}
                  className="text-[12.5px] text-muted underline underline-offset-4 transition hover:text-fg disabled:no-underline"
                >
                  {actions.removingId === line.variantId ? "Removing…" : "Remove"}
                </button>
              </div>
            </li>
          ))}
        </ul>
        <div className="flex items-baseline justify-between pt-4">
          <Label>Total</Label>
          <Price amount={formatINR(cart.total)} className="text-[20px]" />
        </div>
      </section>

      <StickyBar>
        <div className="flex items-center gap-4">
          <div className="shrink-0">
            <Price amount={formatINR(cart.total)} className="block text-[19px] leading-tight" />
            <Tag tone="positive">Confirmed</Tag>
          </div>
          <Link href="/" className={buttonClass("secondary", "flex-1")}>
            Build another look
          </Link>
        </div>
      </StickyBar>
    </div>
  );
}

// Two-tap confirm: the first tap arms it for 3 seconds.
function ClearBag({ onClear, clearing }: { onClear: () => void; clearing: boolean }) {
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (!armed) return;
    const id = setTimeout(() => setArmed(false), 3000);
    return () => clearTimeout(id);
  }, [armed]);

  return (
    <button
      type="button"
      disabled={clearing}
      onClick={() => (armed ? (setArmed(false), onClear()) : setArmed(true))}
      className={`rounded-full px-3 py-1 font-mono text-[10.5px] tracking-[0.1em] uppercase transition ${
        armed ? "bg-accent text-white" : "border border-line text-muted hover:border-fg hover:text-fg"
      }`}
    >
      {clearing ? "Clearing…" : armed ? "Tap again to clear" : "Clear bag"}
    </button>
  );
}

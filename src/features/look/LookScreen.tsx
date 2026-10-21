"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { Button, buttonClass } from "@/components/ui/Button";
import { track } from "@/lib/analytics";
import { api, queryKeys } from "@/lib/api";
import { parseLookParams } from "@/lib/routes";
import { LookBuilder } from "./LookBuilder";
import { LookSkeleton } from "./LookSkeleton";
import { NoFit } from "./NoFit";

export function LookScreen() {
  const { occasion, budget } = parseLookParams(useSearchParams());

  const look = useQuery({
    queryKey: queryKeys.look(occasion ?? "", budget ?? 0),
    queryFn: () => api.recommend({ occasion: occasion!, budget: budget! }),
    enabled: occasion !== null && budget !== null,
  });
  const occasions = useQuery({ queryKey: queryKeys.occasions, queryFn: api.getOccasions });
  const occasionLabel = occasions.data?.find((o) => o.id === occasion)?.label ?? "Your";

  // One event per result, even though React runs effects twice in development.
  const result = look.data;
  const tracked = useRef<typeof result>(undefined);
  useEffect(() => {
    if (!result || !occasion || !budget || tracked.current === result) return;
    tracked.current = result;
    if (result.status === "ok") {
      const { total, remaining, items } = result.look;
      track("look_shown", { occasion, budget, total, remaining, product_ids: items.map((i) => i.product.id) });
    } else {
      track("no_fit_shown", { occasion, budget, cheapest_total: result.cheapestTotal, short_by: result.shortBy });
    }
  }, [result, occasion, budget]);

  if (!occasion || !budget) {
    return (
      <Message title="Let's start with the basics" body="Pick an occasion and a budget first.">
        <Link href="/" className={buttonClass("primary", "w-full")}>
          Start
        </Link>
      </Message>
    );
  }
  if (look.isPending) return <LookSkeleton />;
  if (look.isError) {
    return (
      <Message title="Something went wrong" body="We couldn't build a look right now.">
        <Button onClick={() => look.refetch()} className="w-full">
          Try again
        </Button>
      </Message>
    );
  }
  if (look.data.status === "no_fit") {
    return <NoFit result={look.data} occasionLabel={occasionLabel} />;
  }
  // Keyed so a different recommendation starts with fresh selections.
  return (
    <LookBuilder
      key={look.data.look.items.map((i) => i.product.id).join()}
      look={look.data.look}
      occasion={occasion}
      occasionLabel={occasionLabel}
    />
  );
}

function Message({ title, body, children }: { title: string; body: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col">
      <div role="alert" className="flex flex-1 flex-col justify-center px-6 pt-20 pb-20">
        <h1 className="text-[32px] leading-tight font-semibold tracking-[-0.04em]">{title}</h1>
        <p className="mt-2 text-muted">{body}</p>
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}

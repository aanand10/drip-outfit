"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useRef } from "react";
import { Button, Spinner } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import type { Slot } from "@/domain/types";
import { track } from "@/lib/analytics";
import { api, invalidateStock, queryKeys } from "@/lib/api";
import { newId } from "@/lib/id";

export function AddToCartButton({
  variantIds,
  total,
  missingSize,
  onNeedSizes,
  onError,
}: {
  variantIds: string[];
  total: number;
  missingSize: Slot[];
  onNeedSizes: (slot: Slot) => void;
  onError: (message: string, soldOut: string[]) => void;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  // One key per attempt: repeat taps during a save replay the same request instead of adding twice.
  const attemptKey = useRef<string | null>(null);

  const add = useMutation({
    mutationFn: (key: string) =>
      api.addToCart({ items: variantIds.map((variantId) => ({ variantId, qty: 1 })) }, key),
    onSuccess: (cart) => {
      track("add_to_bag_succeeded", { total, item_count: variantIds.length });
      queryClient.setQueryData(queryKeys.cart, cart);
      invalidateStock(queryClient);
      router.push("/cart");
    },
    onError: (err) => {
      const soldOut = (err as Error & { variantIds?: string[] }).variantIds ?? [];
      track("add_to_bag_failed", { reason: soldOut.length ? "out_of_stock" : "error", sold_out_variant_ids: soldOut });
      invalidateStock(queryClient);
      onError(
        soldOut.length ? "A size you picked just sold out. Choose another." : "Couldn't add to bag. Try again.",
        soldOut,
      );
    },
    onSettled: () => {
      attemptKey.current = null;
    },
  });

  function onClick() {
    // Guard synchronously: `disabled` only applies after a re-render, and rapid taps land before it.
    if (attemptKey.current) return track("add_to_bag_repeat_tap_ignored", { total });
    track("add_to_bag_clicked", { total, missing_sizes: missingSize.length });
    // Not disabled when sizes are missing: tapping takes the user to the piece that needs one.
    if (missingSize.length > 0) return onNeedSizes(missingSize[0]);
    attemptKey.current = newId();
    add.mutate(attemptKey.current);
  }

  const n = missingSize.length;
  return (
    <Button onClick={onClick} disabled={add.isPending} aria-busy={add.isPending} className="flex-1">
      {add.isPending ? (
        <>
          <Spinner /> Adding
        </>
      ) : n > 0 ? (
        `Pick ${n} size${n > 1 ? "s" : ""}`
      ) : (
        <>
          Add look to bag <Icon.Arrow width={18} height={18} />
        </>
      )}
    </Button>
  );
}

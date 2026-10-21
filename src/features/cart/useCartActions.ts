import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Cart } from "@/domain/types";
import { track } from "@/lib/analytics";
import { api, invalidateStock, queryKeys } from "@/lib/api";

export function useCartActions() {
  const queryClient = useQueryClient();
  const settle = (cart: Cart) => {
    queryClient.setQueryData(queryKeys.cart, cart);
    invalidateStock(queryClient);
  };

  const remove = useMutation({ mutationFn: api.removeFromCart, onSuccess: settle });
  const clear = useMutation({ mutationFn: api.clearCart, onSuccess: settle });

  return {
    remove: (variantId: string) => {
      track("cart_item_removed", { variant_id: variantId });
      remove.mutate(variantId);
    },
    removingId: remove.isPending ? remove.variables : null,
    clear: () => {
      track("cart_cleared", { item_count: queryClient.getQueryData<Cart>(queryKeys.cart)?.itemCount ?? 0 });
      clear.mutate();
    },
    clearing: clear.isPending,
  };
}

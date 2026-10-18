import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Cart } from "@/domain/types";
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
    remove: (variantId: string) => remove.mutate(variantId),
    removingId: remove.isPending ? remove.variables : null,
    clear: () => clear.mutate(),
    clearing: clear.isPending,
  };
}

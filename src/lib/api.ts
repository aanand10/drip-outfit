import type { QueryClient } from "@tanstack/react-query";
import { mockService } from "./mock-service";

// The UI's only way into the service. Swapping the mock for fetch() calls changes this file only.
export const api = mockService;

export const queryKeys = {
  occasions: ["occasions"] as const,
  look: (occasion: string, budget: number) => ["look", occasion, budget] as const,
  swapOptions: (slot: string, currentId: string, keptIds: string[], budget: number) =>
    ["swap-options", slot, currentId, ...keptIds, budget] as const,
  availability: (variantIds: string[]) => ["availability", ...variantIds] as const,
  cart: ["cart"] as const,
  contrast: (occasion: string, budget: number) => ["contrast", occasion, budget] as const,
};

/** Refetch everything that depends on stock, after the cart reserved or released some. */
export function invalidateStock(queryClient: QueryClient) {
  for (const root of ["look", "swap-options", "availability"]) {
    queryClient.invalidateQueries({ queryKey: [root] });
  }
}

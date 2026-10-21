import type { QueryClient } from "@tanstack/react-query";
import { track } from "./analytics";
import { mockService } from "./mock-service";

type Service = Record<string, (...args: never[]) => Promise<unknown>>;

/** Wraps every service method so each call reports its endpoint, outcome and duration. */
function instrument<T extends Service>(service: T): T {
  const wrapped = Object.entries(service).map(([endpoint, fn]) => [
    endpoint,
    async (...args: never[]) => {
      const start = performance.now();
      const done = (outcome: "success" | "failure", error?: string) =>
        track("api_call_completed", { endpoint, outcome, duration_ms: Math.round(performance.now() - start), error });
      try {
        const result = await fn(...args);
        done("success");
        return result;
      } catch (err) {
        done("failure", (err as Error).message);
        throw err;
      }
    },
  ]);
  return Object.fromEntries(wrapped) as T;
}

// The UI's only way into the service. Swapping the mock for fetch() calls changes this file only.
export const api = instrument(mockService);

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

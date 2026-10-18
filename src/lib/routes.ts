import { isOccasionId, type OccasionId } from "@/domain/types";

export const lookHref = (occasion: OccasionId, budget: number) =>
  `/look?${new URLSearchParams({ occasion, budget: String(budget) })}`;

/** Reads `?occasion=&budget=`, dropping anything invalid instead of trusting the URL. */
export function parseLookParams(params: URLSearchParams) {
  const occasion = params.get("occasion");
  const budget = Math.round(Number(params.get("budget")));
  return {
    occasion: isOccasionId(occasion) ? occasion : null,
    budget: Number.isFinite(budget) && budget > 0 ? budget : null,
  };
}

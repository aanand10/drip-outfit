import type { OccasionId } from "./types";

// Fixed inputs for the required cases.
export const SCENARIOS = {
  C1: {
    title: "Complete a look",
    checks: "Swap, sizes, single add to bag",
    occasion: "date-night",
    occasionLabel: "Date night",
    budget: 5000,
  },
  // Below the cheapest complete wedding look, so it always returns no_fit.
  C2: {
    title: "Nothing fits",
    checks: "Honest no-fit with a next step",
    occasion: "wedding",
    occasionLabel: "Wedding",
    budget: 3000,
  },
} as const satisfies Record<
  string,
  { title: string; checks: string; occasion: OccasionId; occasionLabel: string; budget: number }
>;

export type ScenarioId = keyof typeof SCENARIOS;

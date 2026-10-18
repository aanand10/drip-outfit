// Recommendation and swap logic over a product list. Pure: callers pass the catalogue in.
import { compatible, compatibleWithAll, explainClash, explainLook, misfitScore, scoreLook } from "./rules";
import {
  SLOTS,
  type Look,
  type LookItem,
  type OccasionId,
  type Product,
  type RecommendResponse,
  type Slot,
  type SwapOption,
} from "./types";

const inStock = (p: Product) => p.variants.some((v) => v.stock > 0);

export function candidates(products: Product[], occasion: OccasionId, slot: Slot): Product[] {
  return products.filter((p) => p.slot === slot && p.tags.occasions.includes(occasion) && inStock(p));
}

/** Every compatible top/trousers/shoes combination for an occasion, ignoring budget. */
function* validCombos(products: Product[], occasion: OccasionId): Generator<Product[]> {
  const tops = candidates(products, occasion, "top");
  const trousers = candidates(products, occasion, "trousers");
  const shoes = candidates(products, occasion, "shoes");
  for (const t of tops)
    for (const b of trousers) {
      if (!compatible(t, b)) continue;
      for (const s of shoes) if (compatible(t, s) && compatible(b, s)) yield [t, b, s];
    }
}

const sum = (ps: Product[]) => ps.reduce((s, p) => s + p.price, 0);
const toItems = (ps: Product[]): LookItem[] => ps.map((p) => ({ slot: p.slot, product: p }));

/** Cheapest complete look that passes the pairing rules (the real floor, not the sum of cheapest pieces). */
export function cheapestLook(products: Product[], occasion: OccasionId): Product[] | null {
  let best: Product[] | null = null;
  for (const combo of validCombos(products, occasion)) if (!best || sum(combo) < sum(best)) best = combo;
  return best;
}

export function bestLook(products: Product[], occasion: OccasionId, budget: number): Product[] | null {
  let best: Product[] | null = null;
  let bestScore = -1;
  for (const combo of validCombos(products, occasion)) {
    if (sum(combo) > budget) continue;
    const score = scoreLook(combo, budget, occasion);
    if (score > bestScore) [best, bestScore] = [combo, score];
  }
  return best;
}

export function buildLook(pieces: Product[], budget: number): Look {
  const total = sum(pieces);
  return { items: toItems(pieces), total, budget, remaining: budget - total, reasons: explainLook(pieces, budget) };
}

export function recommend(
  products: Product[],
  occasion: OccasionId,
  budget: number,
  occasionLabels: Record<OccasionId, string>,
): RecommendResponse {
  const look = bestLook(products, occasion, budget);
  if (look) return { status: "ok", look: buildLook(look, budget) };

  const floor = cheapestLook(products, occasion);
  const cheapestTotal = floor ? sum(floor) : 0;
  const others = (Object.keys(occasionLabels) as OccasionId[])
    .filter((o) => o !== occasion)
    .map((o) => ({ o, min: cheapestLook(products, o) }))
    .filter((x): x is { o: OccasionId; min: Product[] } => x.min !== null && sum(x.min) <= budget);

  return {
    status: "no_fit",
    occasion,
    budget,
    cheapestTotal,
    shortBy: Math.max(0, cheapestTotal - budget),
    cheapestLook: floor ? toItems(floor) : null,
    suggestions: [
      ...(floor ? [{ type: "raise_budget" as const, budget: Math.ceil(cheapestTotal / 100) * 100 }] : []),
      ...others.map(({ o, min }) => ({
        type: "other_occasion" as const,
        occasion: o,
        label: occasionLabels[o],
        minLookPrice: sum(min),
      })),
    ],
  };
}

/** Replacements for one slot that work with the two kept pieces and keep the total within budget. */
export function swapOptions(
  products: Product[],
  occasion: OccasionId,
  budget: number,
  slot: Slot,
  current: Product,
  kept: Product[],
  limit = 12,
): SwapOption[] {
  const keptTotal = sum(kept);
  return candidates(products, occasion, slot)
    .filter((p) => p.id !== current.id && keptTotal + p.price <= budget && compatibleWithAll(p, kept))
    .map((p) => ({ p, score: scoreLook([p, ...kept], budget, occasion) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ p }) => ({ product: p, priceDelta: p.price - current.price, newTotal: keptTotal + p.price }));
}

/**
 * A deliberately bad look for the "this, not that" comparison: per slot, the in-budget
 * piece that fits the occasion worst. Built from the real catalogue, explained by the
 * same rules that reject it.
 */
export function clashLook(products: Product[], occasion: OccasionId, budget: number) {
  const share = budget / 3;
  const pick = (slot: Slot) =>
    products
      .filter((p) => p.slot === slot && p.price <= share * 1.4)
      .sort((a, b) => misfitScore(b, occasion) - misfitScore(a, occasion) || a.price - b.price)[0];
  const pieces = SLOTS.map(pick).filter((p): p is Product => Boolean(p));
  if (pieces.length < 3) return null;
  return { items: toItems(pieces), total: sum(pieces), reasons: explainClash(pieces, occasion) };
}

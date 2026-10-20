import { describe, expect, it } from "vitest";
import catalogue from "@/server/data/products.json";
import { recommend, swapOptions } from "@/domain/recommend";
import { SCENARIOS } from "@/domain/scenarios";
import { OCCASION_IDS, type OccasionId, type Product } from "@/domain/types";
import { selectionReducer, type SelectionState } from "./useLookSelection";

const PRODUCTS = catalogue as Product[];
const { occasion, budget } = SCENARIOS.C1;
const res = recommend(PRODUCTS, occasion, budget, Object.fromEntries(OCCASION_IDS.map((o) => [o, o])) as Record<OccasionId, string>);
if (res.status !== "ok") throw new Error("C1 should have a look");
const [top, trousers, shoes] = res.look.items.map((i) => i.product);
const [newShoes] = swapOptions(PRODUCTS, occasion, budget, "shoes", shoes, [top, trousers]);

// C1 with a size picked for every piece.
const sized = (p: Product) => ({ product: p, variantId: p.variants.find((v) => v.stock > 0)!.variantId, swapped: false });
const c1: SelectionState = { top: sized(top), trousers: sized(trousers), shoes: sized(shoes) };

describe("C1 selection", () => {
  it("swapping the shoes keeps the top and trousers with their sizes; the new shoes need a size", () => {
    const next = selectionReducer(c1, { type: "swap", slot: "shoes", product: newShoes.product });
    expect(next.shoes).toEqual({ product: newShoes.product, variantId: null, swapped: true });
    expect(next.top).toBe(c1.top);
    expect(next.trousers).toBe(c1.trousers);
  });

  it("when the top's size sells out at checkout, only the top asks for a size again", () => {
    const next = selectionReducer(c1, { type: "clearSizes", variantIds: [c1.top.variantId!] });
    expect(next.top.variantId).toBeNull();
    expect(next.trousers).toBe(c1.trousers);
    expect(next.shoes).toBe(c1.shoes);
  });
});

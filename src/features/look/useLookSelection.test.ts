import { describe, expect, it } from "vitest";
import catalogue from "@/server/data/products.json";
import type { Product } from "@/domain/types";
import { selectionReducer, type SelectionState } from "./useLookSelection";

const [top, trousers, shoes, otherShoes] = ["top", "trousers", "shoes", "shoes"].map(
  (slot, i) => (catalogue as Product[]).filter((p) => p.slot === slot)[i === 3 ? 1 : 0],
);
const sized = (p: Product) => ({ product: p, variantId: p.variants[0].variantId, swapped: false });
const start: SelectionState = { top: sized(top), trousers: sized(trousers), shoes: sized(shoes) };

describe("selectionReducer", () => {
  it("a swap changes only that slot, and the new piece starts without a size", () => {
    const next = selectionReducer(start, { type: "swap", slot: "shoes", product: otherShoes });
    expect(next.shoes).toEqual({ product: otherShoes, variantId: null, swapped: true });
    expect(next.top).toBe(start.top);
    expect(next.trousers).toBe(start.trousers);
  });

  it("clears only the sizes that sold out", () => {
    const next = selectionReducer(start, { type: "clearSizes", variantIds: [start.top.variantId!] });
    expect(next.top.variantId).toBeNull();
    expect(next.trousers).toBe(start.trousers);
    expect(next.shoes).toBe(start.shoes);
  });
});

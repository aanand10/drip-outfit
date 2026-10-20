import { describe, expect, it } from "vitest";
import catalogue from "@/server/data/products.json";
import { SCENARIOS } from "./scenarios";
import { clashLook, recommend, swapOptions } from "./recommend";
import { compatible } from "./rules";
import type { OccasionId, Product } from "./types";

const PRODUCTS = catalogue as Product[];
const LABELS: Record<OccasionId, string> = {
  "date-night": "Date night",
  office: "Office",
  wedding: "Wedding",
  casual: "Weekend",
};

const goTogether = (pieces: Product[]) =>
  pieces.every((a, i) => pieces.slice(i + 1).every((b) => compatible(a, b)));

function okLook(occasion: OccasionId, budget: number) {
  const res = recommend(PRODUCTS, occasion, budget, LABELS);
  if (res.status !== "ok") throw new Error(`expected a look for ${occasion} at ${budget}`);
  return res.look;
}

describe("recommend", () => {
  it("C1: a complete date-night look within ₹5,000 whose pieces go together", () => {
    const look = okLook("date-night", SCENARIOS.C1.budget);
    const pieces = look.items.map((i) => i.product);

    expect(look.items.map((i) => i.slot)).toEqual(["top", "trousers", "shoes"]);
    expect(look.total).toBe(pieces.reduce((s, p) => s + p.price, 0));
    expect(look.total).toBeLessThanOrEqual(5000);
    expect(pieces.every((p) => p.tags.occasions.includes("date-night"))).toBe(true);
    expect(goTogether(pieces)).toBe(true);
  });

  it("gives date night and office different looks at the same budget", () => {
    const ids = (o: OccasionId) => okLook(o, 5000).items.map((i) => i.product.id);
    expect(ids("date-night")).not.toEqual(ids("office"));
  });

  it("C2: says nothing fits, with the real floor and a next step", () => {
    const res = recommend(PRODUCTS, SCENARIOS.C2.occasion, SCENARIOS.C2.budget, LABELS);
    if (res.status !== "no_fit") throw new Error("expected no_fit");

    expect(res.cheapestTotal).toBeGreaterThan(SCENARIOS.C2.budget);
    expect(res.shortBy).toBe(res.cheapestTotal - SCENARIOS.C2.budget);
    expect(goTogether(res.cheapestLook!.map((i) => i.product))).toBe(true);
    expect(res.suggestions).toContainEqual({
      type: "raise_budget",
      budget: Math.ceil(res.cheapestTotal / 100) * 100,
    });
  });
});

describe("clashLook", () => {
  it("is a look the pairing rules reject", () => {
    const clash = clashLook(PRODUCTS, "date-night", 5000)!;
    expect(goTogether(clash.items.map((i) => i.product))).toBe(false);
    expect(clash.reasons.length).toBeGreaterThan(0);
  });
});

describe("swapOptions", () => {
  it("only offers pieces that go with the kept two and stay within budget", () => {
    const budget = 5000;
    const [top, trousers, shoes] = okLook("date-night", budget).items.map((i) => i.product);
    const options = swapOptions(PRODUCTS, "date-night", budget, "shoes", shoes, [top, trousers]);

    expect(options.length).toBeGreaterThan(0);
    for (const { product, newTotal, priceDelta } of options) {
      expect(product.slot).toBe("shoes");
      expect(product.id).not.toBe(shoes.id);
      expect(newTotal).toBe(top.price + trousers.price + product.price);
      expect(newTotal).toBeLessThanOrEqual(budget);
      expect(priceDelta).toBe(product.price - shoes.price);
      expect(goTogether([top, trousers, product])).toBe(true);
    }
  });
});

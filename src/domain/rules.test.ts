import { describe, expect, it } from "vitest";
import { compatible, scoreLook } from "./rules";
import type { Product, Slot } from "./types";

const piece = (slot: Slot, tags: Partial<Product["tags"]> = {}, price = 1500): Product => ({
  id: `${slot}-${Math.random()}`,
  slot,
  brand: "Test",
  name: slot,
  price,
  image: "",
  sourceUrl: "",
  tags: {
    occasions: ["date-night"],
    colour: "grey",
    colourHex: "#888888",
    colourFamily: "neutral",
    formality: 3,
    style: "smart-casual",
    ...tags,
  },
  variants: [{ variantId: `${slot}-v`, size: "M", stock: 1 }],
});

describe("compatible", () => {
  it("allows formality one step apart but not two", () => {
    expect(compatible(piece("top", { formality: 3 }), piece("shoes", { formality: 4 }))).toBe(true);
    expect(compatible(piece("top", { formality: 2 }), piece("shoes", { formality: 4 }))).toBe(false);
  });

  it.each([
    ["sport", "classic"],
    ["sport", "ethnic"],
    ["street", "ethnic"],
  ] as const)("rejects %s with %s, in either order", (a, b) => {
    expect(compatible(piece("top", { style: a }), piece("trousers", { style: b }))).toBe(false);
    expect(compatible(piece("top", { style: b }), piece("trousers", { style: a }))).toBe(false);
  });

  it("allows one bold colour per pair, not two", () => {
    const bold = (slot: Slot) => piece(slot, { colourFamily: "bold" });
    expect(compatible(bold("top"), piece("trousers"))).toBe(true);
    expect(compatible(bold("top"), bold("trousers"))).toBe(false);
  });
});

describe("scoreLook", () => {
  it("prefers a balanced spend over a ₹4,000 shoe with a ₹300 top", () => {
    const balanced = [piece("top", {}, 1500), piece("trousers", {}, 1600), piece("shoes", {}, 1700)];
    const lopsided = [piece("top", {}, 300), piece("trousers", {}, 500), piece("shoes", {}, 4000)];
    expect(scoreLook(balanced, 5000, "date-night")).toBeGreaterThan(scoreLook(lopsided, 5000, "date-night"));
  });

  it("prefers one style across the look over three", () => {
    const one = [piece("top"), piece("trousers"), piece("shoes")];
    const three = [piece("top"), piece("trousers", { style: "classic" }), piece("shoes", { style: "street" })];
    expect(scoreLook(one, 5000, "date-night")).toBeGreaterThan(scoreLook(three, 5000, "date-night"));
  });
});

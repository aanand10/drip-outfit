import { describe, expect, it } from "vitest";
import catalogue from "@/server/data/products.json";
import { recommend } from "./recommend";
import { compatible } from "./rules";
import { OCCASION_IDS, type OccasionId, type Product, type Slot } from "./types";

const PRODUCTS = catalogue as Product[];

function find(slot: Slot, match: (t: Product["tags"]) => boolean) {
  const p = PRODUCTS.find((x) => x.slot === slot && match(x.tags));
  if (!p) throw new Error(`catalogue has no ${slot} like that`);
  return p;
}

const kurta = find("top", (t) => t.style === "ethnic");
const trackPants = find("trousers", (t) => t.style === "sport");
const streetSneakers = find("shoes", (t) => t.style === "street");
const formalTrousers = find("trousers", (t) => t.style === "classic");

describe("pairing rules on real catalogue pieces", () => {
  it("rejects a kurta with track pants", () => {
    expect(compatible(kurta, trackPants)).toBe(false);
  });

  it("rejects a kurta with street sneakers", () => {
    expect(compatible(kurta, streetSneakers)).toBe(false);
  });

  it("rejects track pants with formal leather shoes", () => {
    const dressShoes = find("shoes", (t) => t.style === "classic" && t.formality >= 4);
    expect(compatible(trackPants, dressShoes)).toBe(false);
  });

  it("allows a kurta with classic trousers (the wedding look)", () => {
    expect(compatible(kurta, formalTrousers)).toBe(true);
  });

  it("rejects a pink shirt with purple trousers: same dressiness and style, but two bold colours", () => {
    const byName = (name: string) => PRODUCTS.find((p) => p.name === name)!;
    const pinkShirt = byName("100% Cotton Stripes Shirt");
    const purpleTrousers = byName("Orany Pastel Purple Cotton Plain Regular Fit Trouser");
    expect(pinkShirt.tags.colourFamily).toBe("bold");
    expect(compatible(pinkShirt, purpleTrousers)).toBe(false);
  });
});

describe("budget split in real recommendations", () => {
  const LABELS = Object.fromEntries(OCCASION_IDS.map((o) => [o, o])) as Record<OccasionId, string>;

  it.each(OCCASION_IDS)("%s at ₹5,000 never puts half the spend on one piece", (occasion) => {
    const res = recommend(PRODUCTS, occasion, 5000, LABELS);
    if (res.status !== "ok") throw new Error("expected a look");
    for (const { product } of res.look.items) expect(product.price).toBeLessThan(res.look.total / 2);
  });
});

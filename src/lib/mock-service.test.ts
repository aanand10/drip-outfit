import { beforeEach, describe, expect, it } from "vitest";
import { mockService as api } from "./mock-service";

async function c1Items() {
  const res = await api.recommend({ occasion: "date-night", budget: 5000 });
  if (res.status !== "ok") throw new Error("expected a look");
  return res.look.items.map(({ product }) => ({
    variantId: product.variants.find((v) => v.stock > 0)!.variantId,
    qty: 1,
  }));
}

describe("addToCart", () => {
  beforeEach(() => api.reset());

  it("C1: repeated taps with one idempotency key add the look once", async () => {
    const items = await c1Items();
    const carts = await Promise.all([1, 2, 3].map(() => api.addToCart({ items }, "tap-1")));

    expect(new Set(carts).size).toBe(1);
    const cart = await api.getCart();
    expect(cart.itemCount).toBe(3);
    expect(cart.items.map((l) => l.variantId)).toEqual(items.map((i) => i.variantId));
  });

  it("rejects a sold-out size and lets the same key retry", async () => {
    const items = await c1Items();
    const [first] = items;
    const { stock } = await api.availability({ variantIds: [first.variantId] });
    const oversized = [{ ...first, qty: stock[first.variantId] + 1 }, ...items.slice(1)];

    await expect(api.addToCart({ items: oversized }, "k")).rejects.toMatchObject({
      message: "OUT_OF_STOCK",
      variantIds: [first.variantId],
    });
    expect((await api.getCart()).itemCount).toBe(0);
    await expect(api.addToCart({ items }, "k")).resolves.toMatchObject({ itemCount: 3 });
  });

  it("reserves stock, and Reset restores it and empties the bag", async () => {
    const items = await c1Items();
    const ids = items.map((i) => i.variantId);
    const before = (await api.availability({ variantIds: ids })).stock;

    await api.addToCart({ items }, "k");
    const during = (await api.availability({ variantIds: ids })).stock;
    expect(ids.map((id) => during[id])).toEqual(ids.map((id) => before[id] - 1));

    await api.reset();
    expect((await api.availability({ variantIds: ids })).stock).toEqual(before);
    expect((await api.getCart()).itemCount).toBe(0);
  });
});

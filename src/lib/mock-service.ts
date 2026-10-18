// In-browser stand-in for the API: runs the domain logic over the scraped catalogue,
// owns stock and cart state, and implements the contract in `@/domain/types`.
// State lives in memory, so a full page reload is equivalent to Reset.

import catalogue from "@/server/data/products.json";
import { bestLook, cheapestLook, clashLook, recommend, swapOptions } from "@/domain/recommend";
import type {
  AddToCartRequest,
  AvailabilityRequest,
  AvailabilityResponse,
  Cart,
  ClashLook,
  Occasion,
  OccasionId,
  Product,
  RecommendRequest,
  RecommendResponse,
  SwapOptionsRequest,
  SwapOptionsResponse,
} from "@/domain/types";

const PRODUCTS = catalogue as Product[];

const OCCASIONS: Pick<Occasion, "id" | "label" | "blurb" | "mood">[] = [
  { id: "date-night", label: "Date night", blurb: "Dinner, drinks, first impressions", mood: "Warm, easy, a little bold" },
  { id: "office", label: "Office", blurb: "Sharp, not stiff", mood: "Clean lines, quiet confidence" },
  { id: "wedding", label: "Wedding", blurb: "Festive and dressed up", mood: "Festive, rooted, polished" },
  { id: "casual", label: "Weekend", blurb: "Easy and off-duty", mood: "Relaxed, laid-back, effortless" },
];
const LABELS = Object.fromEntries(OCCASIONS.map((o) => [o.id, o.label])) as Record<OccasionId, string>;

const delay = (ms = 350) => new Promise((r) => setTimeout(r, ms));
const byId = new Map(PRODUCTS.map((p) => [p.id, p]));

let stock = new Map<string, number>();
let cartLines: { variantId: string; qty: number }[] = [];
// Idempotency-Key → in-flight write, so concurrent duplicates share one write instead of racing.
let seenKeys = new Map<string, Promise<Cart>>();

function resetState() {
  stock = new Map(PRODUCTS.flatMap((p) => p.variants.map((v) => [v.variantId, v.stock] as const)));
  cartLines = [];
  seenKeys = new Map();
}
resetState();

function withLiveStock(p: Product): Product {
  return { ...p, variants: p.variants.map((v) => ({ ...v, stock: stock.get(v.variantId) ?? 0 })) };
}
const liveCatalogue = () => PRODUCTS.map(withLiveStock);

function findVariant(variantId: string) {
  for (const p of PRODUCTS) {
    const v = p.variants.find((x) => x.variantId === variantId);
    if (v) return { product: p, variant: v };
  }
  return null;
}

function buildCart(): Cart {
  const items = cartLines.flatMap(({ variantId, qty }) => {
    const hit = findVariant(variantId);
    if (!hit) return [];
    const { product, variant } = hit;
    return [{
      variantId, qty, productId: product.id, slot: product.slot, brand: product.brand,
      name: product.name, size: variant.size, price: product.price, image: product.image,
      colourHex: product.tags.colourHex,
    }];
  });
  return {
    items,
    total: items.reduce((s, l) => s + l.price * l.qty, 0),
    itemCount: items.reduce((s, l) => s + l.qty, 0),
  };
}

let occasionCache: Occasion[] | null = null;

export const mockService = {
  async getOccasions(): Promise<Occasion[]> {
    await delay(120);
    occasionCache ??= OCCASIONS.map((o) => {
      const floor = cheapestLook(PRODUCTS, o.id);
      const showcase = bestLook(PRODUCTS, o.id, 6000) ?? floor ?? [];
      return {
        ...o,
        minLookPrice: floor ? floor.reduce((s, p) => s + p.price, 0) : 0,
        showcase,
      };
    });
    return occasionCache;
  },

  async recommend({ occasion, budget }: RecommendRequest): Promise<RecommendResponse> {
    await delay(500);
    return recommend(liveCatalogue(), occasion, budget, LABELS);
  },

  async contrast({ occasion, budget }: RecommendRequest): Promise<ClashLook | null> {
    await delay(200);
    return clashLook(PRODUCTS, occasion, budget);
  },

  async swapOptions(req: SwapOptionsRequest): Promise<SwapOptionsResponse> {
    await delay(300);
    const current = byId.get(req.currentProductId);
    const kept = Object.values(req.kept).flatMap((id) => byId.get(id!) ?? []);
    if (!current) return { slot: req.slot, options: [] };
    return {
      slot: req.slot,
      options: swapOptions(liveCatalogue(), req.occasion, req.budget, req.slot, current, kept),
    };
  },

  async availability({ variantIds }: AvailabilityRequest): Promise<AvailabilityResponse> {
    await delay(150);
    const known = variantIds.filter((id) => stock.has(id));
    return {
      stock: Object.fromEntries(known.map((id) => [id, stock.get(id)!])),
      checkedAt: new Date().toISOString(),
    };
  },

  addToCart(req: AddToCartRequest, idempotencyKey: string): Promise<Cart> {
    const existing = seenKeys.get(idempotencyKey);
    if (existing) return existing;

    const write = (async () => {
      await delay(800);
      const short = req.items.filter(({ variantId, qty }) => (stock.get(variantId) ?? 0) < qty);
      if (short.length) {
        throw Object.assign(new Error("OUT_OF_STOCK"), { variantIds: short.map((i) => i.variantId) });
      }
      for (const { variantId, qty } of req.items) {
        stock.set(variantId, (stock.get(variantId) ?? 0) - qty);
        const line = cartLines.find((l) => l.variantId === variantId);
        if (line) line.qty += qty;
        else cartLines.push({ variantId, qty });
      }
      return buildCart();
    })();

    seenKeys.set(idempotencyKey, write);
    // A failed attempt shouldn't block a retry with the same key.
    write.catch(() => seenKeys.delete(idempotencyKey));
    return write;
  },

  // Releases the line's stock.
  async removeFromCart(variantId: string): Promise<Cart> {
    await delay(250);
    const i = cartLines.findIndex((l) => l.variantId === variantId);
    if (i >= 0) {
      const [line] = cartLines.splice(i, 1);
      stock.set(variantId, (stock.get(variantId) ?? 0) + line.qty);
    }
    return buildCart();
  },

  // Releases all reserved stock.
  async clearCart(): Promise<Cart> {
    await delay(250);
    for (const { variantId, qty } of cartLines) stock.set(variantId, (stock.get(variantId) ?? 0) + qty);
    cartLines = [];
    return buildCart();
  },

  async getCart(): Promise<Cart> {
    await delay(150);
    return buildCart();
  },

  async reset(): Promise<void> {
    await delay(150);
    resetState();
  },
};

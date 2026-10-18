// Keyword rules mapping a product to how the illustrated figure draws it.
import type { Product } from "@/domain/types";

export type TopKind = "kurta" | "shirt" | "polo" | "tee";
export type BottomKind = "tailored" | "wide" | "jeans" | "joggers" | "cargo";
export type ShoeKind = "sneaker" | "loafer" | "formal" | "boot";
export type Pattern = "plain" | "checks" | "stripes";

const has = (p: Product, re: RegExp) => re.test(p.name.toLowerCase());

export function topKind(p: Product): TopKind {
  if (p.tags.style === "ethnic" || has(p, /kurta/)) return "kurta";
  if (has(p, /\bpolo\b/)) return "polo";
  if (has(p, /t-shirt|\btee\b/)) return "tee";
  return "shirt";
}

export function bottomKind(p: Product): BottomKind {
  if (has(p, /jean|denim/)) return "jeans";
  if (has(p, /jogger|track/)) return "joggers";
  if (has(p, /cargo/)) return "cargo";
  if (has(p, /baggy|barrel|wide|pleat|gurkha|korean|parachute/)) return "wide";
  return "tailored";
}

export function shoeKind(p: Product): ShoeKind {
  if (has(p, /boot|chelsea|brewster/)) return "boot";
  if (has(p, /loafer|mule|moccasin|slip on|slip-on/)) return "loafer";
  if (has(p, /brogue|derby|oxford|lace-up|formal|monk/) && !has(p, /sneaker/)) return "formal";
  return "sneaker";
}

export function patternOf(p: Product): Pattern {
  if (has(p, /check|plaid|gingham|tartan/)) return "checks";
  if (has(p, /stripe/)) return "stripes";
  return "plain";
}

export const isEmbroidered = (p: Product) => has(p, /embroider|zari|motif/);

export type Texture = "denim" | "rib" | "linen" | null;

export function textureOf(p: Product): Texture {
  if (p.slot === "trousers" && bottomKind(p) === "jeans") return "denim";
  if (has(p, /linen/)) return "linen";
  if (has(p, /knit|rib|polo/)) return "rib";
  return null;
}

const TOP_NAME: Record<TopKind, string> = { kurta: "Kurta", shirt: "Shirt", polo: "Polo", tee: "T-shirt" };
const BOTTOM_NAME: Record<BottomKind, string> = {
  tailored: "Tailored trousers",
  wide: "Wide-leg trousers",
  jeans: "Jeans",
  joggers: "Joggers",
  cargo: "Cargo pants",
};
const SHOE_NAME: Record<ShoeKind, string> = {
  sneaker: "Sneakers",
  loafer: "Loafers",
  formal: "Formal lace-ups",
  boot: "Boots",
};

/** Short cut/fabric description for the spec panel, e.g. "Checked linen shirt". */
export function describe(p: Product): string {
  if (p.slot === "shoes") return SHOE_NAME[shoeKind(p)];
  if (p.slot === "trousers") {
    const tex = textureOf(p);
    return `${tex === "linen" ? "Linen " : ""}${BOTTOM_NAME[bottomKind(p)].toLowerCase()}`.replace(/^\w/, (c) => c.toUpperCase());
  }
  const pattern = patternOf(p);
  const parts = [
    pattern === "checks" ? "checked" : pattern === "stripes" ? "striped" : "",
    textureOf(p) === "linen" ? "linen" : textureOf(p) === "rib" && topKind(p) !== "polo" ? "knit" : "",
    isEmbroidered(p) ? "embroidered" : "",
    TOP_NAME[topKind(p)].toLowerCase(),
  ].filter(Boolean);
  return parts.join(" ").replace(/^\w/, (c) => c.toUpperCase());
}

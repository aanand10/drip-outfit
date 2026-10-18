// The service contract: every request and response shape shared by the service and the UI.

export const SLOTS = ["top", "trousers", "shoes"] as const;
export type Slot = (typeof SLOTS)[number];

export const SLOT_LABEL: Record<Slot, string> = {
  top: "Top",
  trousers: "Trousers",
  shoes: "Shoes",
};

export const OCCASION_IDS = ["date-night", "office", "wedding", "casual"] as const;
export type OccasionId = (typeof OCCASION_IDS)[number];

export const isOccasionId = (v: unknown): v is OccasionId => OCCASION_IDS.includes(v as OccasionId);

export type Style = "classic" | "smart-casual" | "street" | "ethnic" | "sport";
export type ColourFamily = "neutral" | "earth" | "cool" | "bold";
export type Formality = 1 | 2 | 3 | 4 | 5;

export interface Variant {
  variantId: string;
  size: string;
  stock: number;
}

export interface Product {
  id: string;
  slot: Slot;
  brand: string;
  name: string;
  price: number; // INR, whole rupees
  image: string;
  sourceUrl: string;
  tags: {
    occasions: OccasionId[];
    colour: string;
    colourHex: string;
    colourFamily: ColourFamily;
    formality: Formality;
    style: Style;
  };
  variants: Variant[];
}

// GET /api/occasions
export interface Occasion {
  id: OccasionId;
  label: string;
  blurb: string;
  mood: string;
  minLookPrice: number;
  showcase: Product[]; // a representative complete look
}

// POST /api/looks/recommend
export interface RecommendRequest {
  occasion: OccasionId;
  budget: number;
}

export interface LookItem {
  slot: Slot;
  product: Product;
}

export interface Look {
  items: LookItem[]; // always one per slot, in SLOTS order
  total: number;
  budget: number;
  remaining: number;
  reasons: string[];
}

export type NoFitSuggestion =
  | { type: "raise_budget"; budget: number }
  | { type: "other_occasion"; occasion: OccasionId; label: string; minLookPrice: number };

export type RecommendResponse =
  | { status: "ok"; look: Look }
  | {
      status: "no_fit";
      occasion: OccasionId;
      budget: number;
      cheapestTotal: number;
      shortBy: number;
      cheapestLook: LookItem[] | null;
      suggestions: NoFitSuggestion[];
    };

// POST /api/looks/contrast
export interface ClashLook {
  items: LookItem[];
  total: number;
  reasons: string[];
}

// POST /api/looks/swap-options
export interface SwapOptionsRequest {
  occasion: OccasionId;
  budget: number;
  slot: Slot;
  currentProductId: string;
  kept: Partial<Record<Slot, string>>; // productIds of the two pieces staying put
}

export interface SwapOption {
  product: Product;
  priceDelta: number;
  newTotal: number;
}

export interface SwapOptionsResponse {
  slot: Slot;
  options: SwapOption[];
}

// POST /api/availability
export interface AvailabilityRequest {
  variantIds: string[];
}

export interface AvailabilityResponse {
  stock: Record<string, number>; // variantId → units left; unknown ids omitted
  checkedAt: string;
}

// POST /api/cart/items  (header: Idempotency-Key)
export interface AddToCartRequest {
  items: { variantId: string; qty: number }[];
}

// GET /api/cart
export interface CartLine {
  variantId: string;
  productId: string;
  slot: Slot;
  brand: string;
  name: string;
  size: string;
  price: number;
  qty: number;
  image: string;
  colourHex: string;
}

export interface Cart {
  items: CartLine[];
  total: number;
  itemCount: number;
}

export type ApiError =
  | { error: "OUT_OF_STOCK"; variantIds: string[] }
  | { error: "INCOMPLETE_LOOK" | "INVALID_VARIANT" | "BAD_REQUEST"; message: string };

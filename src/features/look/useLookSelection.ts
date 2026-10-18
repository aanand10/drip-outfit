import { useReducer } from "react";
import { SLOTS, type Look, type Product, type Slot } from "@/domain/types";

export interface SelectedPiece {
  product: Product;
  variantId: string | null; // null = user still has to pick a size
  swapped: boolean;
}

type State = Record<Slot, SelectedPiece>;

type Action =
  | { type: "swap"; slot: Slot; product: Product }
  | { type: "size"; slot: Slot; variantId: string }
  | { type: "clearSizes"; variantIds: string[] };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "swap":
      // Only the swapped slot changes; a new product never inherits the old size.
      return { ...state, [action.slot]: { product: action.product, variantId: null, swapped: true } };
    case "size":
      return { ...state, [action.slot]: { ...state[action.slot], variantId: action.variantId } };
    case "clearSizes":
      // Sizes that sold out during checkout must be picked again.
      return Object.fromEntries(
        SLOTS.map((slot) => {
          const p = state[slot];
          return [slot, p.variantId && action.variantIds.includes(p.variantId) ? { ...p, variantId: null } : p];
        }),
      ) as State;
  }
}

function init(look: Look): State {
  // No size is preselected: we don't know the user's size.
  return Object.fromEntries(
    look.items.map((i) => [i.slot, { product: i.product, variantId: null, swapped: false }]),
  ) as State;
}

export function useLookSelection(look: Look) {
  const [pieces, dispatch] = useReducer(reducer, look, init);

  const total = SLOTS.reduce((sum, slot) => sum + pieces[slot].product.price, 0);
  const missingSize = SLOTS.filter((slot) => pieces[slot].variantId === null);
  const anySwapped = SLOTS.some((slot) => pieces[slot].swapped);

  return {
    pieces,
    total,
    remaining: look.budget - total,
    missingSize,
    anySwapped,
    swap: (slot: Slot, product: Product) => dispatch({ type: "swap", slot, product }),
    selectSize: (slot: Slot, variantId: string) => dispatch({ type: "size", slot, variantId }),
    clearSizes: (variantIds: string[]) => dispatch({ type: "clearSizes", variantIds }),
  };
}

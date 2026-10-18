// Pairing rules: pure functions, no I/O. Shared by recommend and swap.
import type { ColourFamily, OccasionId, Product, Slot, Style } from "./types";

// Tags decide eligibility; profiles decide preference.
// `signature`: a style one piece should carry (a wedding look centres on a kurta).
const OCCASION_PROFILE: Record<
  OccasionId,
  { formality: number; styles: Style[]; colours: ColourFamily[]; signature?: Style }
> = {
  "date-night": { formality: 3, styles: ["smart-casual"], colours: ["earth", "cool"] },
  office: { formality: 3.6, styles: ["classic"], colours: ["neutral", "cool"] },
  wedding: { formality: 4.6, styles: ["ethnic", "classic"], colours: ["earth", "bold", "neutral"], signature: "ethnic" },
  casual: { formality: 2, styles: ["street", "smart-casual"], colours: ["neutral", "cool", "bold"] },
};

function occasionFit(pieces: Product[], occasion: OccasionId): number {
  const profile = OCCASION_PROFILE[occasion];
  const avg = pieces.reduce((s, p) => s + p.tags.formality, 0) / pieces.length;
  const formality = 1 - Math.min(1, Math.abs(avg - profile.formality) / 2);
  const style = pieces.filter((p) => profile.styles.includes(p.tags.style)).length / pieces.length;
  const colour = pieces.filter((p) => profile.colours.includes(p.tags.colourFamily)).length / pieces.length;
  const signature = profile.signature && pieces.some((p) => p.tags.style === profile.signature) ? 1 : 0;
  return profile.signature
    ? 0.35 * formality + 0.2 * style + 0.15 * colour + 0.3 * signature
    : 0.5 * formality + 0.3 * style + 0.2 * colour;
}

// Target share of the total per slot.
export const BUDGET_SPLIT: Record<Slot, number> = { top: 0.32, trousers: 0.33, shoes: 0.35 };

// Style pairs that never work together, whatever the colours.
const CLASHING_STYLES: [Style, Style][] = [
  ["sport", "classic"],
  ["sport", "ethnic"],
  ["street", "ethnic"],
];

const clash = (a: Style, b: Style) =>
  CLASHING_STYLES.some(([x, y]) => (x === a && y === b) || (x === b && y === a));

/** Can these two pieces appear in the same look at all? */
export function compatible(a: Product, b: Product): boolean {
  if (Math.abs(a.tags.formality - b.tags.formality) > 1) return false;
  if (clash(a.tags.style, b.tags.style)) return false;
  if (a.tags.colourFamily === "bold" && b.tags.colourFamily === "bold") return false;
  return true;
}

export function compatibleWithAll(p: Product, others: Product[]): boolean {
  return others.every((o) => compatible(p, o));
}

/** 0–1. Higher means the three pieces read as one outfit and the spend is balanced. */
export function scoreLook(pieces: Product[], budget: number, occasion: OccasionId): number {
  const total = pieces.reduce((s, p) => s + p.price, 0);
  const formalities = pieces.map((p) => p.tags.formality);
  const cohesion = 1 - (Math.max(...formalities) - Math.min(...formalities)) / 4;

  const families = pieces.map((p) => p.tags.colourFamily);
  const neutrals = families.filter((f) => f === "neutral").length;
  const sameColour = new Set(pieces.map((p) => p.tags.colour)).size < pieces.length;
  // One or two neutrals anchor a look; all-neutral is safe but flat; a repeated colour looks matched-up.
  const colour = (neutrals === 0 ? 0.55 : neutrals === 3 ? 0.8 : 1) - (sameColour ? 0.25 : 0);

  const split =
    1 -
    pieces.reduce((s, p) => s + Math.abs(p.price / total - BUDGET_SPLIT[p.slot]), 0) / 2;
  const use = Math.min(1, total / budget); // spend most of the budget, never more

  const styles = new Set(pieces.map((p) => p.tags.style)).size;
  const styleUnity = styles === 1 ? 1 : styles === 2 ? 0.85 : 0.6;

  return (
    0.25 * occasionFit(pieces, occasion) +
    0.2 * cohesion +
    0.2 * colour +
    0.15 * split +
    0.1 * use +
    0.1 * styleUnity
  );
}

const FORMALITY_WORD = ["", "relaxed", "easy", "smart-casual", "sharp", "festive"];

/** Plain-language reasons shown to the user. Generated from the same facts the score uses. */
export function explainLook(pieces: Product[], budget: number): string[] {
  const reasons: string[] = [];
  const f = pieces.map((p) => p.tags.formality);
  const mid = Math.round(f.reduce((a, b) => a + b, 0) / f.length);
  reasons.push(Math.max(...f) === Math.min(...f) ? `All ${FORMALITY_WORD[mid]}` : `Matched ${FORMALITY_WORD[mid]} level`);

  const families = pieces.map((p) => p.tags.colourFamily);
  const accent = pieces.find((p) => p.tags.colourFamily !== "neutral");
  if (families.every((x) => x === "neutral")) reasons.push("Clean neutral palette");
  else if (accent && families.filter((x) => x === "neutral").length >= 1)
    reasons.push(`Neutral base, ${accent.tags.colour} accent`);
  else reasons.push("Tonal colours");

  const total = pieces.reduce((s, p) => s + p.price, 0);
  if (total <= budget) reasons.push("Balanced spend");
  return reasons;
}

const OCCASION_NAME: Record<OccasionId, string> = {
  "date-night": "date night",
  office: "the office",
  wedding: "a wedding",
  casual: "the weekend",
};

/** Why a set of pieces fails as a look: the reasons the pairing rules would reject it. */
export function explainClash(pieces: Product[], occasion: OccasionId): string[] {
  const reasons: string[] = [];
  const target = OCCASION_PROFILE[occasion].formality;
  const f = pieces.map((p) => p.tags.formality);
  const avg = f.reduce((a, b) => a + b, 0) / f.length;
  if (avg < target - 1) reasons.push(`Too casual for ${OCCASION_NAME[occasion]}`);
  if (avg > target + 1) reasons.push(`Too formal for ${OCCASION_NAME[occasion]}`);
  if (Math.max(...f) - Math.min(...f) >= 2) reasons.push("Pieces at different dressiness levels");
  const styles = pieces.map((p) => p.tags.style);
  if (styles.includes("sport") && styles.some((s) => s !== "sport")) reasons.push("Sportswear fighting the rest");
  if (pieces.filter((p) => p.tags.colourFamily === "bold").length >= 2) reasons.push("Competing bold colours");
  return reasons.length ? reasons : ["Doesn't read as one outfit"];
}

/** Distance of a single piece from what the occasion is going for (higher = worse fit). */
export function misfitScore(p: Product, occasion: OccasionId): number {
  const profile = OCCASION_PROFILE[occasion];
  return (
    Math.abs(p.tags.formality - profile.formality) +
    (p.tags.style === "sport" ? 1.5 : 0) +
    (p.tags.colourFamily === "bold" ? 1 : 0)
  );
}

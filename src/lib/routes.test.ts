import { describe, expect, it } from "vitest";
import { formatDelta, formatINR } from "./format";
import { lookHref, parseLookParams } from "./routes";

const parse = (href: string) => parseLookParams(new URL(href, "http://x").searchParams);

describe("look URLs", () => {
  it("round-trips occasion and budget", () => {
    expect(parse(lookHref("date-night", 5000))).toEqual({ occasion: "date-night", budget: 5000 });
  });

  it.each([
    ["/look?occasion=foo&budget=abc", { occasion: null, budget: null }],
    ["/look?occasion=office&budget=-100", { occasion: "office", budget: null }],
    ["/look?occasion=office&budget=0", { occasion: "office", budget: null }],
    ["/look", { occasion: null, budget: null }],
  ])("sends hand-edited %s back to the start", (href, expected) => {
    expect(parse(href)).toEqual(expected);
  });
});

describe("format", () => {
  it("shows the C1 total and the picker's top budget in Indian grouping", () => {
    expect(formatINR(4997)).toBe("₹4,997");
    expect(formatINR(15000)).toBe("₹15,000");
  });

  it("labels swap options cheaper, dearer or the same price", () => {
    expect(formatDelta(-500)).toBe("−₹500");
    expect(formatDelta(300)).toBe("+₹300");
    expect(formatDelta(0)).toBe("Same price");
  });
});

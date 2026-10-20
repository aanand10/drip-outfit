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
    ["/look?occasion=office&budget=4999.6", { occasion: "office", budget: 5000 }],
    ["/look", { occasion: null, budget: null }],
  ])("drops invalid params in %s", (href, expected) => {
    expect(parse(href)).toEqual(expected);
  });
});

describe("format", () => {
  it("groups rupees the Indian way", () => {
    expect(formatINR(4997)).toBe("₹4,997");
    expect(formatINR(125000)).toBe("₹1,25,000");
  });

  it("signs price differences", () => {
    expect(formatDelta(500)).toBe("+₹500");
    expect(formatDelta(-500)).toBe("−₹500");
    expect(formatDelta(0)).toBe("Same price");
  });
});

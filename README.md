# DRIP · Complete the Look

A mobile shopping flow: pick an occasion and a total budget in INR, get a top, trousers and shoes that go together, swap any one piece, choose in-stock sizes and add the whole look to the bag. The bag shows only what the service confirmed.

Built on 116 real products from 7 Indian brands (Snitch, Powerlook, Rare Rabbit, Bonkers Corner, Neeman's, Bacca Bucci, Comet).

---

## Run it

Requires Node 20+ and pnpm 10 (pinned in `package.json`; `corepack enable` picks it up).

```bash
pnpm install
pnpm dev          # http://localhost:3000
```

Open it on a phone on the same Wi-Fi: `pnpm dev`, then visit `http://<your-LAN-IP>:3000`. `next.config.ts` already allows `192.168.*.*` dev origins.

```bash
pnpm lint         # ESLint
pnpm test         # Vitest
pnpm build        # production build
pnpm start        # serve the build
```

Re-scrape the catalogue (optional; the result is checked in):

```bash
python3 scripts/scrape_products.py          # writes src/server/data/products.json
```

---

## Reviewer controls: C1, C2 and Reset

The **Cases** pill in the header (every screen) opens a sheet with:

| Control | What it does |
|---|---|
| **C1 · Complete a look** | Opens Date night at ₹5,000 |
| **C2 · Nothing fits** | Opens Wedding at ₹3,000 (always below the cheapest complete wedding look, ₹3,447) |
| **Reset** | Empties the bag, restores every size's original stock, clears idempotency keys and refetches everything |

The pill shows `C1` or `C2` while you're on that case. Stock is seeded deterministically from the variant ID, so every Reset returns the same starting state.

---

## How it's built

```
src/
  domain/          Pure logic, no React, no I/O
    types.ts       The API contract: every request/response shape
    rules.ts       Pairing rules, occasion profiles, scoring, reasons
    recommend.ts   recommend, swapOptions, cheapestLook, clashLook
    scenarios.ts   C1 / C2 fixed inputs
  lib/
    mock-service.ts  The "server": runs the domain logic over the catalogue, owns stock + cart
    api.ts           The only thing screens import to talk to the service, plus query keys
  features/
    home/          Intro, occasion, budget, live preview, "this, not that"
    look/          Outfit, sizes, swap sheet, add to bag, no-fit screen
    cart/          Confirmed bag, remove, clear
  components/
    ui/            Header, buttons, chips, case switcher
    outfit/        Gallery, illustrated figure
  server/data/products.json   Scraped, tagged catalogue
scripts/scrape_products.py    Shopify scraper + auto-tagger
```

UI components never filter products or do price math. They call `api.*` through TanStack Query and render what comes back.

### Service contract

There's no separate backend; the brief allows a mock data source. `mock-service.ts` keeps the shape of one, though: every method takes and returns the types in `domain/types.ts`, adds latency, and holds stock and cart state the UI can't touch. Moving it behind route handlers means changing `lib/api.ts` only.

| Method | Would be | Notes |
|---|---|---|
| `getOccasions()` | `GET /api/occasions` | Includes the cheapest complete look per occasion (for the budget picker's "looks from" marker) |
| `recommend({occasion, budget})` | `POST /api/looks/recommend` | `{status:"ok", look}` or `{status:"no_fit", cheapestTotal, shortBy, cheapestLook, suggestions}` |
| `swapOptions({occasion, budget, slot, currentProductId, kept})` | `POST /api/looks/swap-options` | Only pieces that go with the two kept pieces and keep the total within budget |
| `availability({variantIds})` | `POST /api/availability` | Live stock per size. The size pickers read this, not the stock baked into the recommendation |
| `addToCart({items}, idempotencyKey)` | `POST /api/cart/items` + `Idempotency-Key` | Rejects with `OUT_OF_STOCK` and the variant IDs if any size ran out. Reserves stock |
| `removeFromCart(variantId)` / `clearCart()` | `DELETE /api/cart/items/:id` / `DELETE /api/cart` | Returns stock |
| `getCart()` | `GET /api/cart` | |
| `reset()` | `POST /api/scenarios/reset` | |
| `contrast({occasion, budget})` | `POST /api/looks/contrast` | A real in-budget clashing look for the home page comparison |

### No double add (C1)

Two layers, because either alone has a gap:

1. **Client:** the button sets a ref synchronously on the first tap, so taps that land before React re-renders (and before `disabled` applies) are ignored.
2. **Service:** each attempt carries an idempotency key. The service stores the *in-flight promise* under that key, so a duplicate request with the same key gets the same result instead of a second write. A failed attempt releases its key so the user can retry.

Tested: a triple tap adds exactly 3 lines, ₹4,997.

---

## Pairing rules

Every product carries tags generated from its title, product type and store tags: `occasions`, `colour` + `colourFamily` (neutral / earth / cool / bold), `formality` 1–5 and `style` (classic, smart-casual, street, ethnic, sport).

**1. Eligibility (hard rules).** A product is a candidate only if it's tagged for the occasion and has at least one size in stock. Two pieces can share a look only if:

- their formality differs by at most 1 (no blazer-weight shirt with joggers);
- their styles don't clash: sport + classic, sport + ethnic and street + ethnic are out;
- they aren't both bold colours (one statement piece per look).

All three pairs (top–trousers, top–shoes, trousers–shoes) must pass.

**2. Budget (hard rule).** The total is never above the budget. If no compatible look fits, the response is `no_fit`; the app never drops a piece to squeeze under.

**3. Preference (score, 0–1).** Every valid in-budget combination is scored and the best one wins:

| Weight | Factor | Why |
|---|---|---|
| 25% | **Occasion fit:** distance from the occasion's target formality, preferred styles, preferred colour families | So date night and office don't land on the same safe outfit |
| 20% | **Cohesion:** spread of formality across the three pieces | Same dressiness reads as one outfit |
| 20% | **Colour:** 1–2 neutrals anchoring is best; all neutral is safe but flat; no neutral is loud; repeating the exact colour is penalised | |
| 15% | **Budget split:** closeness to top 32% / trousers 33% / shoes 35% | A ₹4,000 shoe with a ₹300 top fits the budget but looks wrong |
| 10% | **Budget use:** total / budget | People set a budget expecting to use most of it |
| 10% | **Style unity:** one style beats two beats three | |

Occasion profiles:

| Occasion | Target formality | Preferred styles | Preferred colours |
|---|---|---|---|
| Date night | 3 | smart-casual | earth, cool |
| Office | 3.6 | classic | neutral, cool |
| Wedding | 4.6 | ethnic, classic (one ethnic piece is a strong bonus) | earth, bold, neutral |
| Weekend | 2 | street, smart-casual | neutral, cool, bold |

**4. Swaps.** Options for a slot are re-scored as part of the whole look with the two kept pieces, must pass the eligibility rules against both, and must keep `kept total + new price ≤ budget`. The kept pieces never change. The swapped-in piece starts without a size.

**5. Reasons.** The chips under each look ("Matched smart-casual level", "Neutral base, olive accent", "Balanced spend") are generated from the same tags the score uses, so the explanation can't drift from the logic.

**6. No fit.** The floor is the cheapest look that *passes the pairing rules*, not the sum of the cheapest piece in each slot (those usually don't go together). The no-fit screen shows that look clearly marked as over budget, the exact shortfall, a "See it at ₹X" link (floor rounded up to ₹100), and the other occasions that do fit the budget.

---

## One look it gets right

**C1: Date night, ₹5,000 → ₹4,997**

| | Piece | Price | Tags |
|---|---|---|---|
| Top | Snitch · 100% Cotton Checks Shirt | ₹1,499 | olive · earth · formality 3 · smart-casual |
| Trousers | Powerlook · Cream Linen Blend Barrel Fit Pants | ₹1,799 | cream · neutral · 3 · smart-casual |
| Shoes | Bacca Bucci · Brewster | ₹1,699 | tan · earth · 2 · smart-casual |

Why it's right: one style throughout, dressed up enough for dinner but not office-stiff, a warm earth palette anchored by cream trousers, and the spend split 30/36/34, close to the target. Compare the office look at the same budget: maroon satin shirt, beige pleated trousers and black leather lace-ups, all formality 4 and classic. Same budget, clearly a different occasion.

The home page "this, not that" shows the opposite: the worst in-budget pieces for date night (yellow kurta-shirt, pink track joggers, yellow sneakers, ₹4,297). It fits the budget, but the rules reject it for mixed dressiness, sportswear and competing bold colours.

## One look it gets wrong

**Wedding, ₹6,000 → ₹5,997**

| | Piece | Price | Tags |
|---|---|---|---|
| Top | Powerlook · Natural Embroidered Kurta | ₹1,299 | cream · neutral · 5 · ethnic |
| Trousers | Snitch · Off-White Stretch **Plus Size** Trousers | ₹2,099 | off white · neutral · 4 · classic |
| Shoes | Neeman's · Transition Loafers, Olive | ₹2,599 | olive · earth · 4 · classic |

What's wrong:

1. **Plus-size trousers recommended to everyone.** The tags describe how a piece *looks*, not who it's *cut for*. The scorer liked it (right formality, neutral, good price share), but it's the wrong product for most users. Fix: tag fit range in the scraper (`fit: "plus"`) and only show those when the user picks that range.
2. **Kurta with western trousers and loafers.** It passes every rule (formality 5/4/4, ethnic + classic is allowed), but at an Indian wedding it reads as office-ethnic. The catalogue has no churidars or juttis, so the "one ethnic piece" bonus anchors the look but can't complete it. Fix: scrape ethnic bottoms and footwear, and when the top is ethnic, require ethnic or ethnic-friendly bottoms.
3. **The reason says "Matched sharp level"**, an office word on a wedding look. Fix: word the formality reason per occasion ("festive" at 5).
4. Off-white trousers under a cream kurta are near-identical shades. The "repeated colour" penalty compares colour *names*, so it misses close shades. Fix: compare `colourHex` distance.

---

## Assumptions and decisions

| Assumption / decision | Why |
|---|---|
| **One budget for the whole outfit**, not per piece | That's how people think about "an outfit for ₹5,000"; the split is the app's job |
| **Spend most of the budget** (10% of score) | Someone who sets ₹5,000 expects a ₹4,900 look, not ₹2,000 |
| **No size is preselected** | We don't know the user's size, and a wrong guess that goes into the bag is worse than one extra tap |
| **"Add look" adds all three or nothing** | The flow sells a look; a partial add would show an incomplete outfit as done |
| **The add button stays tappable with sizes missing** and scrolls to the first piece that needs one | A disabled button gives no hint why; this tells you |
| **Stock is reserved on add**, returned on remove, clear or Reset | So C1's "only 1 left" is honest and Reset is meaningful |
| **The bag renders only the service's response** | The brief says "as confirmed by the service"; nothing is optimistic |
| **Mock service in the browser**, not route handlers | The brief allows it; it keeps the contract and keeps the 8-hour budget for the flow. State resets on reload |
| **Exhaustive search** over valid combinations | ~40 × 36 × 40 per occasion, pruned by compatibility first; runs in milliseconds and always finds the true best and true floor |
| **Real scraped products**, auto-tagged | The brief asks for real products; tagging 116 by hand isn't repeatable. Rules match title and type first, then store tags |
| **Stock seeded from the variant ID** (1–6 if Shopify says available, else 0) | Shopify only exposes in/out of stock; seeding keeps Reset reproducible |
| **C2 = Wedding at ₹3,000** | ₹447 below the cheapest valid wedding look, so it always triggers no-fit, and other occasions don't fit either, which tests the "useful next step" honestly |
| **Next.js App Router**, client-rendered screens | Every screen is interactive state over one service; URLs (`/look?occasion=…&budget=…`) make cases shareable and the back button work |

## Known limitations

- State lives in the browser tab: a full reload resets the bag (as if you pressed Reset).
- Tags are keyword-based, so a few products are mis-tagged (see the wedding example).
- No user size profile; sizes are chosen per look.
- The illustrated figure is a stylised SVG, not a try-on.

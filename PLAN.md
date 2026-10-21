# Complete the Look: Build Plan & Status

A mobile shopping flow that puts together a full outfit (top, trousers, shoes) for an occasion, within the user's budget. The user can swap any piece, pick sizes and add the outfit to the cart.

**Stack:** Next.js 16 (App Router) · React 19 · Tailwind 4 (PostCSS) · TanStack Query 5 · Vitest · pnpm 10
**Graded on:** Functionality 30% · Product/UX/Design 30% · Code quality 30% · Recommendation logic 10%

Legend: ✅ done · 🟡 partial · ⬜ pending

---

## Status against the brief

### Product flow (brief p.2)
| # | Requirement | Status | Where |
|---|---|---|---|
| 1 | Pick occasion + enter INR budget for the whole outfit | ✅ | `features/home` (occasion tiles, `BudgetPicker`) |
| 2 | See one top, trousers, shoes that fit budget, suit occasion, go together | ✅ | Live preview on home + `/look` |
| 3 | Swap one piece; only that piece changes | ✅ | `SwapSheet`, "Kept"/"New" states |
| 4 | Each item needs an in-stock size; swapped-in item starts without one | ✅ | `SizeChips`, `useLookSelection` |
| 5 | Prices/total update live; cart shows what the service confirmed | ✅ | Sticky bar, `CartScreen` (renders service response only) |
| – | Swap options suit the kept pieces and keep total within budget | ✅ | `domain/recommend.ts → swapOptions` |
| – | Works well on a phone | ✅ | 440px frame, tested over LAN on a phone |

### Recommendation logic (brief p.3)
| Requirement | Status | Notes |
|---|---|---|
| Occasion fit (date night ≠ office) | ✅ | Occasion profiles in `domain/rules.ts` |
| Pieces go together (colour, formality, style) via tags | ✅ | `compatible()`, `scoreLook()` |
| Budget split (no ₹4,000 shoes + ₹300 top) | ✅ | `BUDGET_SPLIT` 32/33/35 scored |
| Swaps go with kept pieces + stay within budget | ✅ | `swapOptions()` |
| Rules explained in README | ✅ | `README.md → Pairing rules` |

### Data & backend (brief p.4)
| Requirement | Status | Notes |
|---|---|---|
| ≥18 real products: product + variant IDs, brand, name, INR price, image, sizes with stock | ✅ | 116 products, 7 brands (`scripts/scrape_products.py` → `src/server/data/products.json`) |
| Occasion / colour / style tags | ✅ | Auto-generated |
| Bonus: auto-tagging from titles | ✅ | Keyword rules in the scraper |
| API/data layer: recommend, swap options, **availability**, add to cart with clear shapes | ✅ | Typed contract in `domain/types.ts`; in-browser mock (`lib/mock-service.ts`). `availability({variantIds})` feeds the size pickers live; sold-out on add clears that size |
| Data and business logic kept out of UI components | ✅ | `domain/` (pure) + `lib/api.ts` |
| Backend ("good to have") | ⬜ | No `/api/*` route handlers yet, so state resets on page reload |
| Product analytics (beyond scope) | ✅ | Typed `track()` events with shared session context (`lib/analytics.ts`), page views, every API call timed; logged to the console |
| **Visible C1/C2 selector + Reset button** (Reset clears cart and stock changes) | ✅ | "Cases" pill in the header → sheet with C1, C2, Reset (`components/ui/ScenarioSwitcher.tsx`) |

### Required cases (brief p.4)
| Case | Expectation | Status |
|---|---|---|
| C1 | Outfit suits date night, still looks right after a swap | ✅ |
| C1 | Prices and total correct at every step, within ₹5,000 | ✅ (₹4,997) |
| C1 | Cart shows exactly the three chosen items in the chosen sizes | ✅ |
| C1 | Repeat add-to-cart while saving doesn't add twice | ✅ Client guard + idempotency key (shared in-flight promise) |
| C2 | Fixed seeded input that always triggers no-fit | ✅ Wedding · ₹3,000 (floor ₹3,447), one tap from the Cases sheet |
| C2 | Tell the user nothing fits + offer a useful next step | ✅ NoFit screen: closest look shown as over budget, "See it at ₹X", other occasions |
| C2 | Never go over budget quietly or show a partial outfit as complete | ✅ |

### Deliverables (brief p.5)
| Item | Status |
|---|---|
| Repo/ZIP with lockfile + install/run commands | ✅ github.com/aanand10/drip-outfit (private) |
| README: assumptions, decisions, pairing rules, one look right + one wrong | ✅ |
| Product write-up: each widget's why/what/design + competitor comparison | ✅ `docs/PRODUCT.md` |
| Case notes: C1/C2 status, steps from Reset, where to see it | ✅ `docs/CASES.md` |
| Video ≤ 7 min: flow + both cases via the selector | ✅ 3:37 explainer, made with Remotion (separate `drip-video` project) |
| AI tools: which ones + one time output had to be fixed | ✅ `docs/AI-TOOLS.md` |

---

## Phases

### Phase 0: Setup ✅
- [x] Next.js 16 (TS, Tailwind, ESLint, App Router, `src/`), pnpm pinned
- [x] Tailwind via PostCSS (the template's turbopack loader served stale CSS)
- [x] `allowedDevOrigins` for phone testing over LAN

### Phase 1: Product data and tags ✅
- [x] Shopify `/products.json` scraper (stdlib Python, cached, re-runnable)
- [x] 116 products across 7 brands; slots, sizes, seeded stock
- [x] Auto-tags: colour + family, formality 1–5, style, occasions
- [x] Name clean-up, shoe-size normalisation, balanced selection (brand cap, scarcest occasion first)

### Phase 2: Recommendation logic ✅
- [x] Compatibility rules, occasion profiles, budget split, scoring, reasons
- [x] `recommend`, `swapOptions`, `cheapestLook` (true floor), no-fit suggestions
- [x] `clashLook` + `explainClash` for "this, not that"
- [x] Vitest, 34 tests on the real catalogue (no invented products): `domain/rules` (real clashing pairs, spend split), `domain/recommend` (C1, C2, every picker budget × occasion, swaps), `lib/mock-service` (no double add, stock, sell-out, Reset), `lib/routes` (hand-edited URLs, INR format), `look/useLookSelection` (C1 swap and sold-out size)

### Phase 3: Server, API and state ⬜
- [ ] Route handlers: `GET /api/occasions`, `POST /api/looks/recommend`, `POST /api/looks/swap-options`, `POST /api/looks/contrast`, `GET /api/availability`, `GET/POST/DELETE /api/cart`, `DELETE /api/cart/items/:variantId`, `POST /api/scenarios/reset`
- [ ] Validated request bodies; server-side idempotency map
- [ ] Re-check stock against availability before add-to-cart (409 → "size just sold out")
- [ ] Swap `lib/api.ts` from the mock to `fetch` (screens unchanged)

### Phase 4: Mobile UI ✅ (beyond scope)
- [x] Story-style intro (wipe transitions, rolling headline, product hotspots, value ticker)
- [x] Promise row, numbered steps, occasion personalities, budget picker with "looks from" marker
- [x] Live preview gallery + receipt, "Style this, not that", closing call to action
- [x] Outfit page: full-bleed gallery, hairline piece rows, swap sheet, size progress, toasts
- [x] Illustrated figure: garment-aware drawing, textures, interactive focus, spec panel, full view
- [x] Cart: confirmation, remove item, two-tap clear bag, empty state
- [x] C2 screen
- [x] Discreet C1/C2 selector + Reset ("Cases" pill)

### Phase 5: QA and polish 🟡
- [x] C1 end to end over LAN (triple-tap add → exactly 3 items)
- [x] C2 screen and next steps
- [x] Layout-shift and accessibility basics (labels, focus, `aria-live`, reduced motion)
- [x] C1/C2 from the selector; Reset empties bag (12 → 0) and restores stock; live stock counts down to sold out
- [x] `pnpm lint && pnpm test && pnpm build` with tests in place

### Phase 5b: Analytics ✅
- [x] `track()` with typed events and shared context (session, page, device, app version)
- [x] Page views, interactions, outcomes, and every API call (endpoint, outcome, duration)
- [x] Verified in Chrome: correct order, no duplicates from React's dev double effects
- [x] Merged via PR #1

### Phase 6: Docs and submission ✅
- [x] README
- [x] Product write-up · Case notes
- [x] AI tools note
- [x] Commit history and push / ZIP
- [x] Video

---

## Pending, in priority order
1. Share repo access with reviewers.
2. Optional: real `/api/*` route handlers (backend is "good to have").

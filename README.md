# DRIP · Complete the Look

A mobile shopping flow for DRIP. You pick an occasion and a budget in rupees, and the app gives you a top, trousers and shoes that go together. You can swap any one piece, pick sizes that are in stock, and add the whole outfit to your bag. The bag only shows what the service actually saved.

| | |
|---|---|
| **Stack** | Next.js 16 (App Router), React 19, TypeScript, Tailwind 4, TanStack Query 5, Vitest |
| **Data** | 116 real products from 7 Indian brands: Snitch, Powerlook, Rare Rabbit, Bonkers Corner, Neeman's, Bacca Bucci, Comet |
| **Quality** | 34 tests on real products · typed service contract · lint and build clean |
| **Analytics** | Typed product events with shared session context, logged to the console |

## Contents

1. [Quick start](#quick-start)
2. [Submission docs](#submission-docs)
3. [What it does](#what-it-does)
4. [Testing C1, C2 and Reset](#testing-c1-c2-and-reset)
5. [Architecture](#architecture)
6. [Analytics](#analytics)
7. [Tests](#tests)
8. [Recommendation logic](#recommendation-logic)
9. [Assumptions and decisions](#assumptions-and-decisions)
10. [Limits and next steps](#limits-and-next-steps)

---

## Quick start

You need **Node 20+** and **pnpm 10**. The pnpm version is set in `package.json`, and `corepack enable` will pick it up.

```bash
pnpm install
pnpm dev          # http://localhost:3000
```

| Command | What it does |
|---|---|
| `pnpm dev` | Runs the app at http://localhost:3000 |
| `pnpm test` | Runs the 34 tests |
| `pnpm lint` | Checks code style |
| `pnpm build` / `pnpm start` | Makes and runs a production build |
| `python3 scripts/scrape_products.py` | Downloads the products again (optional; the result is already in `src/server/data/products.json`) |

**On your phone:** connect to the same Wi-Fi, run `pnpm dev`, and open `http://<your-computer's-IP>:3000`. Addresses starting with `192.168.` are already allowed in `next.config.ts`.

---

## Submission docs

| Document | What's in it |
|---|---|
| This README | How to run it, architecture, analytics, tests, matching rules, decisions |
| [Product write-up](docs/PRODUCT.md) | Why each part of the screen exists, and how this compares to other fashion apps |
| [Case notes](docs/CASES.md) | C1 and C2: status, steps from Reset, where to see them |
| [AI tools note](docs/AI-TOOLS.md) | Which AI tools were used, and what had to be fixed |
| Video walkthrough | *Add the unlisted YouTube link here* |

---

## What it does

1. **Pick an occasion:** date night, office, wedding or weekend.
2. **Set one budget** for the whole outfit. The picker shows where looks start ("Looks from ₹3,547").
3. **See the outfit:** a top, trousers and shoes that match and fit the budget, with the reasons shown.
4. **Swap any piece:** only pieces that go with the other two and keep you within budget are offered.
5. **Pick sizes:** sold-out sizes can't be picked, and low stock shows "Only 1 left".
6. **Add the whole look** in one tap. Tapping several times still adds it once.
7. **If nothing fits,** the app says so, shows the gap, and offers a budget or occasion that works.

---

## Testing C1, C2 and Reset

Every screen has a **Cases** button at the top. It opens a menu with:

| Button | What it does |
|---|---|
| **C1 · Complete a look** | Opens Date night at ₹5,000 |
| **C2 · Nothing fits** | Opens Wedding at ₹3,000. The cheapest wedding outfit is ₹3,447, so this never fits |
| **Reset** | Empties the bag, puts all stock back, and reloads everything |

While you're on a case, the button shows `C1` or `C2`. Stock always starts at the same numbers, so Reset always gives you the same starting point. Step-by-step instructions are in [docs/CASES.md](docs/CASES.md).

---

## Architecture

```
src/
  domain/              The matching logic. No React, no network.
    types.ts           The shape of every request and response
    rules.ts           Matching rules, occasion settings, scoring, reasons
    recommend.ts       recommend, swapOptions, cheapestLook, clashLook
    scenarios.ts       The C1 and C2 inputs
  lib/
    mock-service.ts    Acts as the server: runs the logic, keeps stock and the bag
    api.ts             The only door from the screens to the service; times every call
    analytics.ts       track(): typed product events with shared context
    routes.ts          Builds and safely reads /look?occasion=…&budget=… links
  features/
    home/              Intro, occasion, budget, live preview, "this, not that"
    look/              Outfit, sizes, swap menu, add to bag, "nothing fits" screen
    cart/              The bag: remove items, clear bag
  components/
    ui/                Header, buttons, Cases menu
    outfit/            Photo gallery, outfit illustration
    PageViewTracker    Logs a page view on every route change
  server/data/products.json   The product list, with tags
scripts/scrape_products.py    Downloads products and adds tags
```

**Rules the code follows**
- **Screens never filter products or work out prices.** They ask `api` for data and show what comes back.
- **Matching logic is plain functions** in `domain/`, so it's tested without React.
- **One door to the service:** everything goes through `lib/api.ts`. Swapping the mock for a real server changes only that file.

### Service contract

There's no separate server; the brief allows a mock. But `mock-service.ts` works like a real one. It uses the request and response types in `domain/types.ts`, adds a small delay, and keeps the stock and bag to itself. Moving it to a real server would only mean changing `lib/api.ts`.

| Function | Real API equivalent | Notes |
|---|---|---|
| `getOccasions()` | `GET /api/occasions` | Also returns the cheapest outfit for each occasion (for "Looks from ₹X") |
| `recommend({occasion, budget})` | `POST /api/looks/recommend` | Returns an outfit, or a "nothing fits" answer with the cheapest outfit, how much short you are, and suggestions |
| `swapOptions({occasion, budget, slot, currentProductId, kept})` | `POST /api/looks/swap-options` | Only pieces that go with the two you're keeping and stay within budget |
| `availability({variantIds})` | `POST /api/availability` | Current stock for each size. The size buttons use this |
| `addToCart({items}, idempotencyKey)` | `POST /api/cart/items` + `Idempotency-Key` | Fails with `OUT_OF_STOCK` and the sold-out sizes if any size ran out. Takes the items out of stock |
| `removeFromCart(variantId)` / `clearCart()` | `DELETE /api/cart/items/:id` / `DELETE /api/cart` | Puts the stock back |
| `getCart()` | `GET /api/cart` | |
| `reset()` | `POST /api/scenarios/reset` | |
| `contrast({occasion, budget})` | `POST /api/looks/contrast` | A real bad outfit within budget, for the "this, not that" section |

### Stopping double adds (C1)

There are two checks, because each one alone can miss a case:

1. **In the app:** the first tap sets a flag straight away, so taps that come before the screen updates are ignored. Each ignored tap is logged as `add_to_bag_repeat_tap_ignored`.
2. **In the service:** every add has a request ID (the idempotency key). The service remembers the request while it's running. If the same ID comes in again, it gets the same result instead of adding again. If the add fails, the ID is freed so you can try again.

A test fires three adds at once and checks that only one goes through.

---

## Analytics

`src/lib/analytics.ts` records product events with `track(name, properties)`. Event names and their properties are typed, so a typo or a missing field fails the build. For now, events are logged to the browser console. Nothing leaves the browser.

**To watch them:** run `pnpm dev`, open the browser console (Cmd + Option + J in Chrome), filter by `[track]`, and click around.

### Event shape

Every event carries the same context, with the event's own details in `properties`:

```json
{
  "event": "add_to_bag_succeeded",
  "event_id": "85357d3e-aa56-44c4-97a2-72a15e964e7c",
  "session_id": "8e739c85-77ca-45bd-b69b-aac0ab44ab31",
  "seq": 30,
  "ts": "2026-10-21T10:04:45.538Z",
  "path": "/look",
  "viewport": "393x852",
  "user_agent": "Mozilla/5.0 (…)",
  "locale": "en-IN",
  "app_version": "0.1.0",
  "properties": { "total": 4997, "item_count": 3 }
}
```

| Field | Meaning |
|---|---|
| `session_id` | One per browser tab. It survives reloads and ends when the tab closes |
| `event_id` | Unique per event |
| `seq` | The event's position in the session |
| `ts`, `path`, `viewport`, `user_agent`, `locale`, `app_version` | When, where and on what device |

### Events

| Group | Events |
|---|---|
| Lifecycle | `session_started`, `page_viewed` |
| What the user did | `occasion_selected`, `budget_changed` (settled value only), `look_requested`, `swap_opened`, `swap_option_picked`, `size_selected`, `add_to_bag_clicked`, `add_to_bag_repeat_tap_ignored`, `cart_item_removed`, `cart_cleared`, `no_fit_next_step_clicked`, `scenario_opened`, `scenario_reset` |
| What the user saw | `look_shown`, `no_fit_shown`, `add_to_bag_succeeded`, `add_to_bag_failed` |
| System | `api_call_completed`: endpoint, success or failure, duration in ms, error. Recorded for **every** service call in `lib/api.ts` |

### From events to launch metrics

| Metric | How it's worked out |
|---|---|
| Looks added to bag | `add_to_bag_succeeded` ÷ `look_shown` |
| Swaps per look | `swap_option_picked` ÷ `look_shown` |
| "Nothing fits" rate | `no_fit_shown` ÷ `look_requested` |
| Which way out people pick | `no_fit_next_step_clicked` by `action` |
| Service health | `api_call_completed`: failure rate and duration per endpoint |

### Adding GA4 or Clarity later

Change the `send` function in `analytics.ts`; nothing else in the app changes. Clarity records sessions, so it would need a consent prompt and masking first.

---

## Tests

34 tests, all on the real product list and real app inputs. No made-up products.

| File | Tests | What they protect |
|---|---|---|
| `domain/rules.test.ts` | 9 | Real clashing pairs are rejected (kurta + track pants, two bold colours); the budget split in real looks |
| `domain/recommend.test.ts` | 10 | C1 look within ₹5,000; date night ≠ office; every budget the picker allows, for every occasion; C2 "nothing fits" and its suggestions; swaps |
| `lib/mock-service.test.ts` | 6 | No double add; sold-out sizes; stock taken by the bag and returned by remove, clear and Reset |
| `lib/routes.test.ts` | 7 | Look links and hand-edited bad links; rupee formatting |
| `features/look/useLookSelection.test.ts` | 2 | A swap changes only that piece; a sold-out size clears only that size |

---

## Recommendation logic

### How pieces are matched

Every product has tags, made from its name, type and the brand's own tags:
- **occasions** it suits;
- **colour**, plus a colour group: neutral, earth, cool or bold;
- **formality**, from 1 (very casual) to 5 (very dressy);
- **style**: classic, smart-casual, street, ethnic or sport.

#### 1. Must-have rules

 A product can be used only if it suits the occasion and has at least one size in stock. Two pieces can be in the same outfit only if:

- their formality is at most 1 apart (no dressy shirt with joggers);
- their styles don't clash (sport with classic, sport with ethnic, and street with ethnic aren't allowed);
- they aren't both bold colours (only one loud piece per outfit).

Every pair in the outfit must pass: top with trousers, top with shoes, and trousers with shoes.

#### 2. Budget

 The total never goes over the budget. If no outfit fits, the app says "nothing fits". It never drops a piece to get under.

#### 3. Scoring

 Every outfit that passes is given a score from 0 to 1, and the highest wins:

| Weight | What it checks | Why |
|---|---|---|
| 25% | **Occasion fit:** how close the formality, style and colours are to what suits the occasion | So date night and office don't get the same safe outfit |
| 20% | **Same dressiness:** how close the three pieces are in formality | Pieces at the same level look like one outfit |
| 20% | **Colour:** 1–2 neutral pieces is best; all neutral is safe but boring; no neutral is too loud; the same colour twice loses points | |
| 15% | **Budget split:** how close it is to 32% top, 33% trousers, 35% shoes | A ₹4,000 shoe with a ₹300 top fits the budget but looks wrong |
| 10% | **Budget used:** total ÷ budget | If you set ₹5,000, you probably expect to spend most of it |
| 10% | **Same style:** one style is better than two, two is better than three | |

**What each occasion looks for:**

| Occasion | Formality | Styles | Colours |
|---|---|---|---|
| Date night | 3 | smart-casual | earth, cool |
| Office | 3.6 | classic | neutral, cool |
| Wedding | 4.6 | ethnic, classic (one ethnic piece gets a big bonus) | earth, bold, neutral |
| Weekend | 2 | street, smart-casual | neutral, cool, bold |

#### 4. Swaps

 A replacement must pass the must-have rules with both pieces you're keeping, and the new total must stay within budget. Options are scored as part of the full outfit. The pieces you keep never change, and the new piece starts with no size picked.

#### 5. Reasons

 The labels under each outfit ("Matched smart-casual level", "Neutral base, olive accent", "Balanced spend") come from the same tags used for scoring. So the explanation always matches the decision.

#### 6. Nothing fits

 The app compares your budget with the cheapest outfit where the pieces *actually go together*, not just the three cheapest items (those usually don't match). The "nothing fits" screen shows:
- that outfit, marked as over budget;
- exactly how much you're short;
- a "See it at ₹X" button, with the price rounded up to the next ₹100;
- other occasions that do fit your budget.

---

### An outfit it gets right

**C1: Date night, ₹5,000 → ₹4,997**

| | Piece | Price | Tags |
|---|---|---|---|
| Top | Snitch · 100% Cotton Checks Shirt | ₹1,499 | olive · earth · formality 3 · smart-casual |
| Trousers | Powerlook · Cream Linen Blend Barrel Fit Pants | ₹1,799 | cream · neutral · 3 · smart-casual |
| Shoes | Bacca Bucci · Brewster | ₹1,699 | tan · earth · 2 · smart-casual |

**Why it works:**
- **Style:** the same style throughout.
- **Dressiness:** smart enough for dinner, but not office-stiff.
- **Colours:** warm earthy colours, balanced by cream trousers.
- **Budget split:** about 30/36/34, close to the target.

**Compare the office outfit at the same budget:** a maroon satin shirt, beige pleated trousers and black leather lace-ups, all dressier and classic. Same budget, clearly a different occasion.

**The "this, not that" section shows the opposite:** the worst outfit within budget for date night, a yellow kurta-shirt, pink track pants and yellow sneakers (₹4,297). It fits the budget, but the rules reject it because:
- the pieces are at different dressiness levels;
- one piece is sportswear;
- it has too many loud colours.

### An outfit it gets wrong

**Wedding, ₹6,000 → ₹5,997**

| | Piece | Price | Tags |
|---|---|---|---|
| Top | Powerlook · Natural Embroidered Kurta | ₹1,299 | cream · neutral · 5 · ethnic |
| Trousers | Snitch · Off-White Stretch **Plus Size** Trousers | ₹2,099 | off white · neutral · 4 · classic |
| Shoes | Neeman's · Transition Loafers, Olive | ₹2,599 | olive · earth · 4 · classic |

**What's wrong:**

1. **Plus-size trousers are suggested to everyone.**
   - **Why:** the tags describe how a piece *looks*, not who it's *made for*. The score liked these trousers: the right formality, a neutral colour and a good price. But most people need a different fit.
   - **Fix:** add a fit tag (like `fit: "plus"`) when downloading products, and only show these items to people who choose that fit.
2. **A kurta with western trousers and loafers.**
   - **Why:** it passes every rule, but at an Indian wedding it looks like office wear. The product list has no churidars or juttis, so the app can't complete a traditional outfit.
   - **Fix:** add ethnic bottoms and footwear. When the top is ethnic, require bottoms that go with ethnic wear.
3. **The reason says "Matched sharp level".**
   - **Why:** "sharp" is an office word, not a wedding one.
   - **Fix:** use different words for each occasion, like "festive" for weddings.
4. **Off-white trousers under a cream kurta are almost the same colour.**
   - **Why:** the "same colour" check compares colour *names*, so it misses shades that are very close.
   - **Fix:** compare the actual colour values instead.

---

## Assumptions and decisions

| Decision | Why |
|---|---|
| **One budget for the whole outfit**, not one per piece | People think "an outfit for ₹5,000". Splitting it is the app's job |
| **Try to use most of the budget** (10% of the score) | If you set ₹5,000, you probably expect around ₹4,900, not ₹2,000 |
| **No size is picked for you** | The app doesn't know your size. A wrong size in the bag is worse than one extra tap |
| **"Add look" adds all three or nothing** | The app sells a full outfit. Adding only part of it would be confusing |
| **The add button works even when sizes are missing** and scrolls to the piece that needs one | A greyed-out button doesn't tell you what's wrong. This does |
| **Adding to the bag takes items out of stock**; removing, clearing or Reset puts them back | So "Only 1 left" is true, and Reset actually resets |
| **The bag only shows what the service returned** | The brief says "as confirmed by the service". Nothing is shown before it's saved |
| **The service runs in the browser**, not on a real server | The brief allows it. It keeps the same shape as a real API and leaves more time for the app itself. Reloading the page resets it |
| **Every outfit is checked** to find the best one | About 40 × 36 × 40 combinations per occasion, and non-matching pairs are skipped early. It takes milliseconds and always finds the true best and cheapest outfit |
| **Real products, tagged automatically** | The brief asks for real products. Tagging 116 by hand isn't easy to repeat. The rules check the name and type first, then the brand's tags |
| **Stock numbers come from each size's ID** (1–6 if the brand says it's in stock, 0 if not) | The brand sites only say "in stock" or "out of stock". This way Reset always gives the same numbers |
| **C2 is Wedding at ₹3,000** | That's ₹447 below the cheapest wedding outfit, so nothing ever fits. No other occasion fits either, which tests the next-step options properly |
| **Next.js App Router**, with screens built in the browser | Every screen is interactive. The links (`/look?occasion=…&budget=…`) make cases easy to share and let the back button work |

## Limits and next steps

**Limits**
- **No real server:** everything is stored in the browser tab, so reloading the page empties the bag (like pressing Reset).
- **Tags can be wrong:** they're based on keywords, so a few products get the wrong tags (see the wedding example above).
- **No saved sizes:** you pick sizes for each outfit.
- **No photo try-on:** the outfit drawing is a simple illustration.
- **Analytics only logs to the console:** no events leave the browser yet.

**Next steps**
1. Real `/api/*` route handlers, so the bag survives a reload.
2. Saved sizes, and fit tags (slim, regular, plus).
3. More ethnic bottoms and footwear for full wedding looks.
4. Send analytics to GA4, and add Clarity behind a consent prompt.
5. Photo try-on, clearly marked as a preview.

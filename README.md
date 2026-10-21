# DRIP · Complete the Look

A mobile shopping app. You pick an occasion and a budget in rupees. The app gives you a top, trousers and shoes that go together. You can swap any one piece, pick sizes that are in stock, and add the whole outfit to your bag. The bag only shows what the service actually saved.

More docs: [product write-up](docs/PRODUCT.md) · [case notes](docs/CASES.md) · [AI tools note](docs/AI-TOOLS.md)

It uses 116 real products from 7 Indian brands: Snitch, Powerlook, Rare Rabbit, Bonkers Corner, Neeman's, Bacca Bucci and Comet.

---

## Run it

You need Node 20+ and pnpm 10. The pnpm version is set in `package.json`, and `corepack enable` will pick it up.

```bash
pnpm install
pnpm dev          # http://localhost:3000
```

To try it on your phone, connect to the same Wi-Fi, run `pnpm dev`, and open `http://<your-computer's-IP>:3000`. Addresses starting with `192.168.` are already allowed in `next.config.ts`.

```bash
pnpm lint         # check code style
pnpm test         # run the tests
pnpm build        # make a production build
pnpm start        # run that build
```

To download the product list again (optional, it's already included):

```bash
python3 scripts/scrape_products.py          # writes src/server/data/products.json
```

---

## Testing C1, C2 and Reset

Every screen has a **Cases** button at the top. It opens a menu with:

| Button | What it does |
|---|---|
| **C1 · Complete a look** | Opens Date night at ₹5,000 |
| **C2 · Nothing fits** | Opens Wedding at ₹3,000. The cheapest wedding outfit is ₹3,447, so this never fits |
| **Reset** | Empties the bag, puts all stock back, and reloads everything |

While you're on a case, the button shows `C1` or `C2`. Stock always starts at the same numbers, so Reset always gives you the same starting point.

Step-by-step instructions are in [docs/CASES.md](docs/CASES.md).

---

## How the code is organised

```
src/
  domain/          The matching logic. No React, no network.
    types.ts       The shape of every request and response
    rules.ts       Matching rules, occasion settings, scoring, reasons
    recommend.ts   recommend, swapOptions, cheapestLook, clashLook
    scenarios.ts   The C1 and C2 inputs
  lib/
    mock-service.ts  Acts as the server: runs the logic, keeps stock and the bag
    api.ts           The only thing the screens use to talk to the service
  features/
    home/          Intro, occasion, budget, live preview, "this, not that"
    look/          Outfit, sizes, swap menu, add to bag, "nothing fits" screen
    cart/          The bag: remove items, clear bag
  components/
    ui/            Header, buttons, Cases menu
    outfit/        Photo gallery, outfit illustration
  server/data/products.json   The product list, with tags
scripts/scrape_products.py    Downloads products and adds tags
```

Screens never filter products or work out prices. They ask `api` for data and show what comes back.

### The service

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

1. **In the app:** the first tap sets a flag straight away, so taps that come before the screen updates are ignored.
2. **In the service:** every add has a request ID (the idempotency key). The service remembers the request while it's running. If the same ID comes in again, it gets the same result instead of adding again. If the add fails, the ID is freed so you can try again.

A test fires three adds at once and checks that only one goes through.

### Analytics

`src/lib/analytics.ts` records product events with `track(name, properties)`. Event names and their properties are typed, so a typo or a missing field fails the build. For now, events are logged to the browser console (look for `[track]`).

**Every event carries the same context:** `session_id` (one per browser tab), `event_id`, `seq` (order within the session), `ts`, `path`, `viewport`, `user_agent`, `locale` and `app_version`.

| Group | Events |
|---|---|
| Lifecycle | `session_started`, `page_viewed` |
| What the user did | `occasion_selected`, `budget_changed`, `look_requested`, `swap_opened`, `swap_option_picked`, `size_selected`, `add_to_bag_clicked`, `add_to_bag_repeat_tap_ignored`, `cart_item_removed`, `cart_cleared`, `no_fit_next_step_clicked`, `scenario_opened`, `scenario_reset` |
| What the user saw | `look_shown`, `no_fit_shown`, `add_to_bag_succeeded`, `add_to_bag_failed` |
| System | `api_call_completed` (endpoint, success or failure, duration, error), recorded for every call in `lib/api.ts` |

These events give the launch numbers directly:
- **Looks added to bag:** `add_to_bag_succeeded` ÷ `look_shown`.
- **Swaps per look:** `swap_option_picked` ÷ `look_shown`.
- **"Nothing fits" rate:** `no_fit_shown` ÷ `look_requested`.
- **Which way out people pick:** `no_fit_next_step_clicked`.

**Adding GA4 or Clarity later:** change the `send` function in `analytics.ts`. Nothing else in the app changes. Clarity records sessions, so it would need a consent prompt and masking first.

---

## How pieces are matched

Every product has tags, made from its name, type and the brand's own tags:
- **occasions** it suits;
- **colour**, plus a colour group: neutral, earth, cool or bold;
- **formality**, from 1 (very casual) to 5 (very dressy);
- **style**: classic, smart-casual, street, ethnic or sport.

**1. Must-have rules.** A product can be used only if it suits the occasion and has at least one size in stock. Two pieces can be in the same outfit only if:

- their formality is at most 1 apart (no dressy shirt with joggers);
- their styles don't clash (sport with classic, sport with ethnic, and street with ethnic aren't allowed);
- they aren't both bold colours (only one loud piece per outfit).

Every pair in the outfit must pass: top with trousers, top with shoes, and trousers with shoes.

**2. Budget.** The total never goes over the budget. If no outfit fits, the app says "nothing fits". It never drops a piece to get under.

**3. Scoring.** Every outfit that passes is given a score from 0 to 1, and the highest wins:

| Weight | What it checks | Why |
|---|---|---|
| 25% | **Occasion fit:** how close the formality, style and colours are to what suits the occasion | So date night and office don't get the same safe outfit |
| 20% | **Same dressiness:** how close the three pieces are in formality | Pieces at the same level look like one outfit |
| 20% | **Colour:** 1–2 neutral pieces is best; all neutral is safe but boring; no neutral is too loud; the same colour twice loses points | |
| 15% | **Budget split:** how close it is to 32% top, 33% trousers, 35% shoes | A ₹4,000 shoe with a ₹300 top fits the budget but looks wrong |
| 10% | **Budget used:** total ÷ budget | If you set ₹5,000, you probably expect to spend most of it |
| 10% | **Same style:** one style is better than two, two is better than three | |

What each occasion looks for:

| Occasion | Formality | Styles | Colours |
|---|---|---|---|
| Date night | 3 | smart-casual | earth, cool |
| Office | 3.6 | classic | neutral, cool |
| Wedding | 4.6 | ethnic, classic (one ethnic piece gets a big bonus) | earth, bold, neutral |
| Weekend | 2 | street, smart-casual | neutral, cool, bold |

**4. Swaps.** A replacement must pass the must-have rules with both pieces you're keeping, and the new total must stay within budget. Options are scored as part of the full outfit. The pieces you keep never change, and the new piece starts with no size picked.

**5. Reasons.** The labels under each outfit ("Matched smart-casual level", "Neutral base, olive accent", "Balanced spend") come from the same tags used for scoring. So the explanation always matches the decision.

**6. Nothing fits.** The app compares your budget with the cheapest outfit where the pieces *actually go together*, not just the three cheapest items (those usually don't match). The "nothing fits" screen shows:
- that outfit, marked as over budget;
- exactly how much you're short;
- a "See it at ₹X" button, with the price rounded up to the next ₹100;
- other occasions that do fit your budget.

---

## An outfit it gets right

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

## An outfit it gets wrong

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

## Limits

- **No real server:** everything is stored in the browser tab, so reloading the page empties the bag (like pressing Reset).
- **Tags can be wrong:** they're based on keywords, so a few products get the wrong tags (see the wedding example above).
- **No saved sizes:** you pick sizes for each outfit.
- **No photo try-on:** the outfit drawing is a simple illustration.

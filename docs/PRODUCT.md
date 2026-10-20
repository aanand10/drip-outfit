# Product write-up

**The job:** "I'm going to a date night and have ₹5,000. Dress me." The user wants one complete outfit they can buy in a couple of minutes. They don't want three tabs of browsing and adding up prices in their head.

**What makes it hard:**
- three pieces have to go together;
- the total has to respect a budget the user set;
- changing one piece mustn't undo the other two;
- the bag has to match what the user saw.

**How the app answers that:**
- One total budget, never broken.
- One look at a time, with the reasons shown.
- Swaps that change exactly one piece.
- A bag that only shows what the service confirmed.

The writing in the app is short and specific: prices, gaps and next steps instead of slogans. The visuals stay quiet so the product photos do the selling.

---

## Home

### 1. Intro story

- **Why:** a first-time user has to understand "a full outfit for your budget" in about three seconds. A text explanation is slower than showing it.
- **What:**
  - An auto-advancing full-screen story, one slide per occasion.
  - Each slide shows a real look on a model photo, with tags pinned to the top, trousers and shoes, and "Date night looks from ₹3,547".
  - Value ticker: Real brands · Swap any piece · Never over budget.
  - CTA: "Style my date night look".
- **Design:**
  - **Slides:** pause while off screen, and respect reduced motion.
  - **Prices:** the "from" price is the real floor computed by the service, not marketing copy. If the catalogue changes, the number changes.

### 2. Promise row

- **Why:** shoppers have learned to expect "recommended for you" to mean "things we want to sell". These four lines say what the app will and won't do, so the later screens can be judged against them.
- **What:** Never over budget · Pieces that match · Swap any piece · Real brands.
- **Design:** each promise is backed by a rule in code and a test (`domain/recommend.test.ts`, `domain/rules.test.ts`), so none of them is copy-only.

### 3. Occasion tiles

- **Why:** occasion is the strongest signal for what to wear and the easiest one for the user to answer.
- **What:** four tiles: Date night, Office, Wedding, Weekend. Each has a one-line mood ("Warm, easy, a little bold").
- **Design:**
  - Tiles instead of a dropdown, because there are only four choices and each needs a hint of what it means.
  - The mood line is the occasion profile the scorer uses, written in plain words.

### 4. Budget picker

- **Why:** the brief's core input. Most people think "an outfit for ₹5,000", not "₹1,600 for a shirt", so it's one total.
- **What:**
  - A large editable amount, −/+ buttons in ₹500 steps, and a slider from ₹1,000 to ₹15,000.
  - A **"Looks from ₹X"** marker for the chosen occasion.
- **Design:** the marker is there to prevent the no-fit screen. Users can see where looks start before they commit to a budget, so most never set an impossible one.

### 5. Live preview ("Here's your look")

- **Why:** waiting until after a "Submit" to find out whether the budget works is a wasted round trip.
- **What:**
  - As the occasion or budget changes, the preview calls the same `recommend` service the look page uses.
  - It shows the look's photos and a receipt-style total with "₹X under".
  - If nothing fits, it shows "Over budget" and "Needs ₹3,447+".
- **Design:** it shares the look page's cache key, so tapping "Style this look" opens instantly with the same outfit. What you previewed is what you get.

### 6. "How it comes together" (illustrated figure)

- **Why:** product photos come from different brands, models and backgrounds, so they're hard to picture as one outfit. A single figure wearing all three shows the overall effect.
- **What:**
  - A stylised figure that draws each garment's real colour and type.
  - Leader lines connect it to each piece.
  - Underneath: a shared colour strip and a formality bar per piece ("Formality alignment").
  - Tap a piece to focus it, or open the full view.
- **Design:**
  - It's labelled "Illustrated", so it never pretends to be a try-on.
  - The formality bars use the same tags the pairing rules use. A clash would be visible here too.

### 7. Explainers: how we pair, how the budget is split, brands

- **Why:** people trust a recommendation more when they can see the reasoning.
- **What:** three short sections:
  - the pairing rules in plain language;
  - the target split (top 32% · trousers 33% · shoes 35%), "so no single piece eats the budget";
  - the brands in the current edit.
- **Design:** the numbers come from `domain/rules.ts`. The explanation can't drift from the logic.

### 8. "Style this, not that"

- **Why:** "these go together" means more when you can see what *doesn't*.
- **What:**
  - The recommended look next to a real in-budget look made of the worst-fitting pieces for the occasion. For date night that's a yellow kurta-shirt, pink track joggers and yellow sneakers (₹4,297).
  - Under it, the reasons the rules reject it: mixed dressiness, sportswear, competing bold colours.
- **Design:** it's built from the live catalogue by `clashLook`, not a staged photo. A test checks that the pairing rules really reject it.

### 9. Closing call to action

- **Why:** after a long scroll, the user shouldn't need to scroll back up to act.
- **What:** "Your look is ready." with the look's thumbnails, "₹4,997 of ₹5,000", and the same CTA. When nothing fits, it reads "Let's find what fits."
- **Design:** the label changes with the state: "Style this look" when a look fits, "See my options" when nothing does.

---

## Look page (`/look?occasion=…&budget=…`)

The URL holds the inputs, so a look can be shared, refreshed or reached with the back button. Hand-edited bad values send the user back to the start instead of breaking (`lib/routes.test.ts`).

### 10. Full-bleed gallery with a reason pill

- **Why:** the outfit is the product. It should fill the first screen the way a product page's hero photo does.
- **What:** swipeable photos, one per piece, with the strongest reason ("Matched smart-casual level") overlaid as a pill.

### 11. Piece rows

- **Why:** each piece needs four things in one place: what it is, its price, its size and a way to replace it.
- **What:**
  - Brand, name, price and a link to the source page.
  - Size chips.
  - A *Swap* button.
  - A *Kept* or *New* marker once you've swapped anything.
- **Design:**
  - **No size is preselected.** A wrong guess that reaches the bag is worse than one extra tap.
  - **Sold-out sizes** are shown but can't be selected, so the user can see their size exists.
  - **Low stock:** "Only N left" appears at 1–2 units, never as a permanent badge.
  - **Live stock:** read from the service's `availability` call, not the stock captured when the look was built.

### 12. Swap sheet

- **Why:** the brief's main interaction, and where most "complete the look" features fail. Changing one piece often breaks the outfit or the budget.
- **What:**
  - A bottom sheet titled "Picked to go with what you're keeping", with thumbnails of the two pieces that stay.
  - A swipeable row of replacements, each showing its price difference (−₹500, +₹300, Same price) and the new look total.
- **Design:**
  - **Every option passes the pairing rules** against both kept pieces and keeps the total within budget. The user can't pick something that breaks the look.
  - **Same-name products** show their colour ("Brewster · tan"), because several catalogue products are colourways that share one name.
  - **After a swap:** only that slot changes. The kept pieces keep their sizes, and the new piece is highlighted and asks for a size.

### 13. Reason chips

- **Why:** they answer "why these three?" in a few words.
- **What:** chips like "Matched smart-casual level", "Neutral base, olive accent", "Balanced spend".
- **Design:** generated from the same tags the score uses, so they describe the actual decision.

### 14. Sticky total bar and "Add look to bag"

- **Why:** the brief says prices and the total must update live. The total and the action belong together, always in reach of the thumb.
- **What:**
  - **Total:** the live total plus "₹X under" or "₹X over", updating on every swap.
  - **Button:** reads "Pick 2 sizes" until every piece has a size, then "Add look to bag".
- **Design:**
  - **Missing sizes:** the button isn't disabled. Tapping it scrolls to the first piece that needs a size, which explains the problem instead of greying out a control.
  - **All or nothing:** the look is added whole or not at all.
  - **Repeat taps:** guarded twice, on the client and in the service (idempotency key), so they can't add twice.
  - **Sold out while saving:** only that size is cleared, and a toast says "A size you picked just sold out. Choose another."

### 15. No-fit screen (C2)

- **Why:** the brief's most important honesty test. Many apps would quietly drop a piece, go a little over budget, or show an empty state.
- **What:**
  - **Heading:** "₹3,000 doesn't cover a full wedding look yet. We won't show you half an outfit."
  - **Closest look:** the closest complete look with its real total and a "₹447 over budget" tag.
  - **Next steps:** "See it at ₹3,500", other occasions that fit the budget, and "Change occasion or budget".
- **Design:**
  - **Real floor:** the closest look is the cheapest look that passes the pairing rules, not the sum of the cheapest pieces, which usually don't go together.
  - **No buying:** it has no size picker or add button, so it can't be mistaken for a result.
  - **Rounded suggestion:** the budget it suggests is rounded up to ₹100, so the user lands on a round number that works.

---

## Bag

### 16. Confirmed bag

- **Why:** the brief says the bag shows what the service confirmed. Showing the user's intention instead of the service's answer is how carts drift from reality.
- **What:**
  - Lines with photo, brand, name, size and price, and the total marked *Confirmed*.
  - Remove per line.
  - A two-tap "Clear bag" ("Tap again to clear", disarms after 3 seconds).
  - An empty state that points back to building a look.
- **Design:**
  - **No optimistic updates:** every change waits for the service's response.
  - **Stock follows the bag:** removing or clearing gives stock back, so the size pickers update.
  - **Two taps instead of a dialog** for the destructive action, because it's faster and avoids a modal on mobile.

---

## Reviewer controls

### 17. Cases pill (C1 · C2 · Reset)

- **Why:** required by the brief, and it makes both cases reproducible in one tap.
- **What:**
  - A small pill next to the bag icon opens a sheet with C1, C2 and Reset.
  - The pill shows `C1` or `C2` while you're on that case.
  - Reset empties the bag and restores seeded stock.
- **Design:** visible but quiet. It uses the same sheet pattern as the swap sheet, so it doesn't add a new UI language.

---

## How this compares

I compared against the patterns the main Indian fashion apps use for outfit suggestions. Features change often, so the specific claims below are from public sources, cited at the end. Check them in the current apps before relying on them.

| | Typical "Complete the look" / "Style it with" rail on a product page | AI stylists (e.g. Myntra's Maya chat assistant and My Stylist) | This app |
|---|---|---|---|
| **Starting point** | One product you're already viewing | A chat prompt, or a photo of a piece you own | An occasion and a total budget |
| **Budget** | Not part of the suggestion; you add up prices yourself | Not mentioned as an input in launch coverage | The hard limit. Every look and every swap option stays within it |
| **Do the pieces go together?** | Curated or model-driven; the reasons are not shown | Generated suggestions | Explicit rules (dressiness, style, colour), with the reasons shown on the look |
| **Changing one piece** | Pick a different product; nothing checks the other two | Ask again | Swap one slot; options are filtered to suit the two kept pieces and the budget |
| **Sizes and stock** | Per product, on separate pages | Per product | All three sizes on one screen, with live stock |
| **Adding to the bag** | One product at a time | One product at a time | The whole look in one confirmed action, safe against double taps |
| **When nothing fits** | No such case; the rail just shows something | Not described | Says so plainly, shows the gap, and offers a working budget or occasion |

**What I took from them:**
- the familiar product-page structure: hero photo, brand above name, price, size chips;
- bottom sheets for secondary choices.

**Where this app goes further:** it treats the budget and the outfit as one object. Suggestion rails sell more products; this flow sells a finished look the user can afford.

**What they do better:**
- **Scale and personalisation.** Their suggestions draw on large catalogues and purchase history. This app has 116 products and no profile.
- **Size memory.** A real store would remember your size so the size step is one tap or none.
- **Try-on.** Myntra's AI tools and dedicated try-on services render the outfit on a person. Here the illustrated figure is deliberately labelled as an illustration. A photo try-on is the natural next step, and the main blocker is cost per image.

**Sources (accessed October 2026):**
- [Apparel Resources: Myntra launches AI-powered chatbot Maya](https://apparelresources.com/business-news/retail/myntra-launches-ai-powered-chatbot-maya-personalized-shopping-assistance)
- [Apparel Resources: Myntra launches AI stylist](https://apparelresources.com/technology-news/retail-tech/myntra-launches-ai-stylist-suggest-clothes-shoppers/)
- [Publitas: best practices for "Complete the Look"](https://www.publitas.com/blog/best-practices-using-complete-the-look-technology/), which describes the typical product-page rail

---

## What I'd build next

1. **Size profile.** Remember sizes per slot and preselect them only once the user has confirmed them.
2. **Fit-aware tags.** Separate plus-size and slim cuts, which fixes the README's "wrong look" example.
3. **Ethnic bottoms and footwear in the catalogue,** so wedding looks can be fully ethnic.
4. **Real API routes,** so the bag survives a reload.
5. **Photo try-on** behind a clear "preview, not exact" label, once the per-image cost is acceptable.

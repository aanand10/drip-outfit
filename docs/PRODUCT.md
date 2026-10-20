# Product write-up

**The goal:** someone says "I have a date night and ₹5,000. What should I wear?" They should get a full outfit they can buy in a couple of minutes, without opening ten tabs and adding up prices in their head.

**What's tricky:**
- The top, trousers and shoes have to look good together.
- The total must stay within their budget.
- Changing one piece shouldn't mess up the other two.
- The bag must show exactly what they chose.

**My approach:**
- One budget for the whole outfit, and the app never goes over it.
- One outfit at a time, with the reasons shown.
- Swapping changes only one piece.
- The bag only shows what the service actually saved.

The text in the app is short and to the point: prices, gaps and next steps. The design stays simple so the product photos stand out.

---

## Home page

### 1. Intro

- **Why:** a new user should get the idea ("a full outfit for your budget") in a few seconds. Showing it is faster than explaining it.
- **What:**
  - A full-screen slideshow, one slide per occasion. Each slide shows a real outfit on a model, with tags on the top, trousers and shoes.
  - A line like "Date night looks from ₹3,547".
  - A button: "Style my date night look".
- **Design choices:**
  - The slideshow pauses when it's off screen, and respects the phone's "reduce motion" setting.
  - The "from" price is worked out from the real products, so it's always true.

### 2. The DRIP promise

- **Why:** people often feel "recommended for you" just means "what we want to sell". These four lines say what the app will do, so users can hold it to that.
- **What:** Never over budget · Pieces that match · Swap any piece · Real brands.
- **Design choices:** every promise has a matching rule in the code and a test that checks it.

### 3. Occasion choice

- **Why:** the occasion tells you the most about what to wear, and it's an easy question to answer.
- **What:** four cards: Date night, Office, Wedding, Weekend. Each has a short line about the mood, like "Warm, easy, a little bold".
- **Design choices:** cards instead of a dropdown, because there are only four options and each one needs a short description.

### 4. Budget picker

- **Why:** people think "an outfit for ₹5,000", not "₹1,600 for a shirt". So there's one number for the whole outfit.
- **What:**
  - A big amount you can type in, − and + buttons (₹500 steps), and a slider from ₹1,000 to ₹15,000.
  - It shows "Looks from ₹X" for the occasion you picked.
- **Design choices:** "Looks from ₹X" shows the lowest budget that works before you choose one. Most people won't ever see the "nothing fits" screen.

### 5. Live preview

- **Why:** you shouldn't have to tap a button just to find out your budget doesn't work.
- **What:**
  - When you change the occasion or budget, the outfit updates right away.
  - It shows the photos and the total, with "₹X under".
  - If nothing fits, it says "Over budget" and "Needs ₹3,447+".
- **Design choices:** the next page shows the exact same outfit, and opens instantly because it's already loaded.

### 6. Outfit illustration

- **Why:** the product photos come from different brands, with different models and backgrounds. It's hard to picture them as one outfit. A drawing of one figure wearing all three pieces helps.
- **What:**
  - A simple drawn figure in the real colours and types of clothing.
  - Lines connect the figure to each piece.
  - Below it: a colour strip for the outfit and a bar showing how dressy each piece is.
- **Design choices:** it's clearly labelled "Illustrated", so nobody thinks it's a real try-on.

### 7. How it works sections

- **Why:** people trust a suggestion more when they can see how it was made.
- **What:** three short sections:
  - how pieces are matched;
  - how the budget is split (about 32% top, 33% trousers, 35% shoes, "so no single piece eats the budget");
  - which brands are in the outfit.
- **Design choices:** the numbers come straight from the matching code, so the explanation always matches what the app does.

### 8. "Style this, not that"

- **Why:** it's easier to see why pieces go together when you also see pieces that don't.
- **What:**
  - The suggested outfit next to a bad one that still fits the budget. For date night: a yellow kurta-shirt, pink track pants and yellow sneakers (₹4,297).
  - A list of what's wrong with it: mixed dressiness, sportswear, too many loud colours.
- **Design choices:** the bad outfit is picked from the real products, not made up. A test checks that the matching rules really reject it.

### 9. Final button

- **Why:** after scrolling down, you shouldn't have to scroll back up to continue.
- **What:**
  - "Your look is ready." with small photos and "₹4,997 of ₹5,000", plus the same button.
  - If nothing fits, it says "Let's find what fits."

---

## Outfit page

The occasion and budget are in the page link. You can share the link, refresh the page or go back. If someone types a broken link, they're sent back to the start.

### 10. Photo gallery

- **Why:** the outfit is what you're buying. It should fill the first screen, like the main photo on a product page.
- **What:** photos you can swipe through, one per piece, with the main reason on top, like "Matched smart-casual level".

### 11. One row per piece

- **Why:** for each piece you need to see what it is, its price, its size and a way to change it, all in one place.
- **What:**
  - Brand, name, price and a link to the brand's page.
  - Size buttons.
  - A **Swap** button.
  - After a swap, the other pieces say *Kept*.
- **Design choices:**
  - **No size is picked for you.** The app doesn't know your size, and a wrong size in the bag is worse than one extra tap.
  - **Sold-out sizes** are shown but can't be tapped, so you know the size exists.
  - **Low stock:** "Only 1 left" or "Only 2 left" appears only when it's true.
  - **Up-to-date stock:** sizes are checked again with the service, so they're current.

### 12. Swap menu

- **Why:** swapping is the main feature, and it's where a lot of apps go wrong. Changing one piece often breaks the outfit or goes over budget.
- **What:**
  - A panel slides up: "Picked to go with what you're keeping". It shows the two pieces you're keeping.
  - Each option shows how much more or less it costs ("−₹500", "+₹300", "Same price") and the new total.
- **Design choices:**
  - **Every option works.** It goes with both kept pieces and stays within budget, so you can't pick one that breaks the outfit.
  - **Same names:** some products have the same name in different colours, so the colour is shown too ("Brewster · tan").
  - **After you pick:** only that piece changes. The other two keep their sizes, and the new piece asks for a size.

### 13. Reasons

- **Why:** to answer "why these three?" quickly.
- **What:** short labels like "Matched smart-casual level", "Neutral base, olive accent", "Balanced spend".
- **Design choices:** the labels come from the same information the app uses to pick the outfit, so they're always accurate.

### 14. Bottom bar and "Add look to bag"

- **Why:** the total and the add button should always be in reach of your thumb, and the total should update as you change things.
- **What:**
  - The total, with "₹X under" or "₹X over".
  - The button says "Pick 2 sizes" until every piece has a size, then "Add look to bag".
- **Design choices:**
  - **Missing sizes:** the button doesn't grey out. If a size is missing, tapping it scrolls to that piece, which tells you what's wrong.
  - **All or nothing:** all three pieces go in the bag, or none.
  - **Repeat taps:** tapping many times only adds the look once.
  - **Sold-out size:** if your size sells out while adding, the app clears it and asks you to pick another.

### 15. "Nothing fits" screen (C2)

- **Why:** this is the hardest case to get right. Many apps would quietly drop a piece, go a bit over budget, or show an empty page.
- **What:**
  - "₹3,000 doesn't cover a full wedding look yet. We won't show you half an outfit."
  - The closest complete outfit, with its real price and a "₹447 over budget" tag.
  - Next steps: "See it at ₹3,500", other occasions that fit your budget, or "Change occasion or budget".
- **Design choices:**
  - **Real cheapest outfit:** the closest outfit is the cheapest one where the pieces actually go together. That's different from just adding up the three cheapest items, which usually don't match.
  - **Can't be bought:** it has no size buttons or add button, so nobody mistakes it for a result.
  - **Round number:** the suggested budget is rounded up to the next ₹100.

---

## Bag

### 16. Bag page

- **Why:** the brief says the bag must show what the service confirmed. If the bag shows what you *tried* to add instead of what was actually saved, it can be wrong.
- **What:**
  - Each item with its photo, brand, name, size and price.
  - The total, marked *Confirmed*.
  - Remove buttons, and "Clear bag" (tap twice to confirm).
  - A message when the bag is empty.
- **Design choices:**
  - **Nothing changes on screen until the service says it's done.**
  - **Stock goes back:** removing an item puts its stock back.
  - **Tap twice instead of a pop-up:** clearing the bag asks for a second tap within 3 seconds. It's quicker than a pop-up on a phone.

---

## For reviewers

### 17. Cases button (C1 · C2 · Reset)

- **Why:** the brief asks for it. It lets anyone replay both cases in one tap.
- **What:**
  - A small button next to the bag icon opens a menu with C1, C2 and Reset.
  - The button shows `C1` or `C2` while you're on that case.
- **Design choices:** it uses the same slide-up panel as the swap menu, so it looks like part of the app.

---

## How this compares to other apps

Fashion apps usually suggest outfits in two ways:
- a "Complete the look" or "Style it with" row on a product page;
- AI stylists, like Myntra's Maya chat assistant and its My Stylist feature.

These apps change often, so check the points below in the current apps before relying on them. Sources are listed at the end.

| | "Complete the look" row | AI stylists (e.g. Myntra) | This app |
|---|---|---|---|
| **You start with** | One product you're looking at | A chat message or a photo | An occasion and a budget |
| **Budget** | Not used; you add up prices yourself | Not mentioned in news about them | Never goes over it |
| **Do the pieces match?** | Picked for you, no reasons given | Picked for you | Clear rules, with reasons shown |
| **Changing one piece** | Pick a different product; nothing checks the other two | Ask again | Swap one piece; only options that match and fit the budget |
| **Sizes** | Chosen on each product's page | Chosen on each product's page | All three on one screen, with current stock |
| **Adding to bag** | One product at a time | One product at a time | The whole outfit at once, safe against double taps |
| **When nothing fits** | Doesn't happen; it always shows something | Not described | Says so, shows the gap, and offers a budget or occasion that works |

**What I borrowed:** the usual product page layout (big photo, brand above the name, price, size buttons) and slide-up panels for extra choices.

**What this app does better:** it treats the outfit and the budget as one thing. Those rows try to sell you more items; this app gives you one outfit you can afford.

**What they do better:**
- **More products and personal picks.** Big apps have huge catalogues and know what you've bought before. This app has 116 products and no user profile.
- **Remembering your size.** A real store would remember it, so you'd skip the size step.
- **Try-on.** Some apps can show the outfit on a real person. This app only has a drawing. A photo try-on would be the next step, but each image costs money to make.

**Sources (checked October 2026):**
- [Apparel Resources: Myntra launches AI chatbot Maya](https://apparelresources.com/business-news/retail/myntra-launches-ai-powered-chatbot-maya-personalized-shopping-assistance)
- [Apparel Resources: Myntra launches AI stylist](https://apparelresources.com/technology-news/retail-tech/myntra-launches-ai-stylist-suggest-clothes-shoppers/)
- [Publitas: best practices for "Complete the Look"](https://www.publitas.com/blog/best-practices-using-complete-the-look-technology/), which describes the usual product page row

---

## What I'd build next

1. **Remember sizes.** Save your size for tops, trousers and shoes, and fill it in once you've confirmed it.
2. **Fit tags.** Mark plus-size and slim-fit items, so the app doesn't suggest plus-size trousers to everyone (see "One look it gets wrong" in the README).
3. **More ethnic wear,** like churidars and juttis, so wedding outfits can be fully traditional.
4. **A real server,** so the bag stays after a page reload.
5. **Photo try-on,** clearly marked as a preview, once the cost per image makes sense.

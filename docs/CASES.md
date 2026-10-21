# Case notes

Both cases open from the **Cases** button at the top of every screen. Press **Reset** in the same menu before each run. It empties the bag and puts all stock back.

| Case | Works? | What it opens | Link |
|---|---|---|---|
| C1 · Complete a look | ✅ Yes | Date night, ₹5,000 | `/look?occasion=date-night&budget=5000` |
| C2 · Nothing fits | ✅ Yes | Wedding, ₹3,000 | `/look?occasion=wedding&budget=3000` |

Both cases are also covered by tests. Run them with `pnpm test`.

---

## C1 · Date night at ₹5,000

**What should happen:**
- You get an outfit that suits a date night.
- It still looks right after you swap a piece.
- The total is always correct and never goes over ₹5,000.
- The bag shows the exact three items and sizes you picked.
- Tapping "Add look to bag" many times only adds the look once.

### Steps

1. Open **Cases** and press **Reset**. It says "Bag emptied, stock restored".
2. Open **Cases** and pick **C1**. The button now says `C1`.
3. You see this look:
   - Snitch 100% Cotton Checks Shirt (olive), ₹1,499
   - Powerlook Cream Linen Blend Barrel Fit Pants, ₹1,799
   - Bacca Bucci Brewster (tan), ₹1,699
   - The bar at the bottom says **₹4,997** and "₹3 under".
4. Tap **Swap shoes**.
   - Every option shows how much more or less it costs, and the new total.
   - Every option goes with the shirt and pants, and keeps you within ₹5,000.
   - Pick any pair.
5. Check what changed:
   - Only the shoes changed. The shirt and pants are marked *Kept*.
   - The new shoes ask you to pick a size.
   - The total changes right away. For example, a ₹1,199 pair makes it ₹4,497, "₹503 under".
6. Pick a size for each piece.
   - Sold-out sizes can't be tapped.
   - If only 1 or 2 are left, it says "Only 1 left" or "Only 2 left".
7. Tap **Add look to bag** three times, fast.
   - The bag icon shows **3**, not 6 or 9.
8. Open the bag.
   - It has the same three items in the sizes you picked.
   - The total matches, and it says *Confirmed*.

### How it stops double adds

There are two checks:
1. **In the app:** the button ignores every tap after the first one, even taps that come before the screen updates.
2. **In the service:** each add sends a request ID. If the same ID comes in again, the service gives back the first result instead of adding again.

A test fires three adds at the same time and checks that only one goes through. If I turn off the second check, the test fails.

### See it in the analytics

Open the browser console and filter by `[track]`. A C1 run logs, in order:

```
scenario_opened                 { scenario: "C1" }
page_viewed                     { path: "/look" }
look_shown                      { occasion: "date-night", budget: 5000, total: 4997, remaining: 3 }
size_selected  ×3
swap_opened → swap_option_picked
add_to_bag_clicked              { total, missing_sizes: 0 }
add_to_bag_repeat_tap_ignored   ← 2nd tap
add_to_bag_repeat_tap_ignored   ← 3rd tap
api_call_completed              { endpoint: "addToCart", outcome: "success" }   ← only one
add_to_bag_succeeded            { item_count: 3 }
```

### If a size sells out while you add

The service refuses the whole look and nothing goes into the bag. The app clears only that size and says "A size you picked just sold out. Choose another."

### Also try

Add the same look again (after the first add has finished). Low stock counts down: "Only 2 left", then "Only 1 left", then sold out. Reset puts everything back.

---

## C2 · Wedding at ₹3,000 (nothing fits)

**What should happen:**
- The app clearly says no full outfit fits the budget.
- It gives a useful next step.
- It never goes over budget without saying so.
- It never shows half an outfit as if it were complete.

### Why ₹3,000 always fails

The cheapest wedding outfit where all three pieces go together costs **₹3,447**. ₹3,000 is below that, so nothing can fit.
- Reset always brings stock back to the same starting point.
- Items selling out can only make outfits cost more, never less.
- No other occasion has an outfit under ₹3,000 either.

### Steps

1. Open **Cases** and press **Reset**.
2. Open **Cases** and pick **C2**. The button now says `C2`.
3. You see the "nothing fits" screen:
   - **Heading:** "₹3,000 doesn't cover a full wedding look yet."
   - **The message:** "We won't show you half an outfit." It also says what the cheapest outfit costs (₹3,447) and how much more that is (₹447).
   - **Closest outfit:** shown with a "**₹447 over budget**" tag. There's no size picker or add button on it.
   - **"See it at ₹3,500":** opens the look at a budget that works.
   - **"Change occasion or budget":** goes back to the start with your choices filled in.
4. Tap **See it at ₹3,500**. You get a full wedding outfit that you can add to the bag.

### See it in the analytics

```
scenario_opened             { scenario: "C2" }
no_fit_shown                { occasion: "wedding", budget: 3000, cheapest_total: 3447, short_by: 447 }
no_fit_next_step_clicked    { action: "raise_budget" }   ← after tapping "See it at ₹3,500"
look_shown                  { occasion: "wedding", budget: 3500, total: 3447 }
```

### Also try

- **Home page warning:** pick Wedding and set the budget under ₹3,447. The preview says "Needs ₹3,447+" before you go any further.
- **Another occasion fits:** try Date night at ₹3,500. Nothing fits there, but a wedding outfit does, so the screen shows a "Wedding look within ₹3,500" link.

---

## Limits

- Everything is stored in the browser tab. Reloading the page empties the bag and resets stock, just like Reset.
- The Cases button is visible to everyone, because the brief asks for it. It's kept small, next to the bag icon.

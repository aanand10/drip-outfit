# Case notes

Both cases open from the **Cases** pill in the header, which is on every screen. Each case also has a link you can paste into the address bar. Start each run with **Reset** (in the same sheet) so the bag is empty and stock is back to its seeded values.

| Case | Status | Opens | Automated checks |
|---|---|---|---|
| C1 · Complete a look | ✅ Works | Date night · ₹5,000 · `/look?occasion=date-night&budget=5000` | `domain/recommend.test.ts`, `lib/mock-service.test.ts`, `look/useLookSelection.test.ts` |
| C2 · Nothing fits | ✅ Works | Wedding · ₹3,000 · `/look?occasion=wedding&budget=3000` | `domain/recommend.test.ts` |

`pnpm test` runs all 34 tests.

---

## C1 · Date night at ₹5,000

**Expected:** an outfit that suits date night and still looks right after a swap. Prices and total are correct at every step and stay within ₹5,000. The bag shows exactly the three chosen items in the chosen sizes. Tapping add-to-cart again while it saves doesn't add twice.

### Steps from Reset

1. **Cases → Reset.** The button shows "Bag emptied, stock restored".
2. **Cases → C1.** The pill now reads `C1`.
3. **The look:**
   - Snitch 100% Cotton Checks Shirt (olive), ₹1,499
   - Powerlook Cream Linen Blend Barrel Fit Pants, ₹1,799
   - Bacca Bucci Brewster (tan), ₹1,699
   - The sticky bar shows **₹4,997** and "₹3 under".
   - The reasons under the look explain why the pieces go together.
4. **Swap the shoes.** Tap *Swap shoes*.
   - Each option shows its price difference ("−₹500") and the new look total.
   - Every option keeps the total within ₹5,000 and goes with the top and trousers you keep.
   - Pick a pair.
5. **Check the swap:**
   - Only the shoes changed.
   - The top and trousers are marked *Kept* and keep any sizes you picked.
   - The new shoes say "New piece. Pick your size".
   - The total updates straight away. For example, a ₹1,199 pair gives ₹4,497 and "₹503 under".
6. **Pick a size for each piece.**
   - Sold-out sizes can't be selected.
   - "Only N left" appears when 1 or 2 are left.
   - Stock is read live from the service, not from the recommendation.
7. **Tap *Add look to bag* three times quickly.**
   - The button shows one saving state.
   - The bag icon shows **3**, not 6 or 9.
8. **Open the bag:**
   - It shows exactly the three items, in the chosen sizes.
   - It shows the same total as the sticky bar, marked *Confirmed*.

### What makes it work

- **No double add:**
  - **Client:** a ref set on the first tap ignores taps that land before React disables the button.
  - **Service:** every add carries an idempotency key, and the service stores the in-flight request under that key. Repeats with the same key get the same result instead of a second write.
  - **Tests:** checked in `lib/mock-service.test.ts` by firing three adds at once. Turning off the service guard makes that test fail.
- **Sold out while saving:**
  - If a size runs out between picking and saving, the service rejects the whole add with `OUT_OF_STOCK`.
  - Only that size is cleared, with the message "A size you picked just sold out. Choose another."
  - Nothing reaches the bag.
- **Bag:** it renders only what the service returns. Nothing is added optimistically.

### Also worth seeing

- Adding the look reserves stock. Add the same sizes again (a separate add, after the first one finished) and "Only 2 left" counts down to sold out.
- Reset puts every count back.

---

## C2 · Wedding at ₹3,000 (no fit)

**Expected:** a fixed input that always triggers the no-fit case. The app tells the user nothing fits and offers a useful next step. It never goes over budget quietly and never shows a partial outfit as complete.

### Why this input

The cheapest wedding look that passes the pairing rules costs **₹3,447**:
- Powerlook Natural Embroidered Kurta (₹1,299)
- the cheapest classic trousers and shoes that go with it

At ₹3,000 nothing fits. This doesn't depend on stock: Reset restores the seed, and selling out can only make the cheapest look more expensive. ₹3,447 is also the lowest floor of any occasion, so no other occasion fits ₹3,000 either. The screen has to rely on its other next steps.

### Steps from Reset

1. **Cases → Reset.**
2. **Cases → C2.** The pill now reads `C2`.
3. **The no-fit screen:**
   - The heading reads "₹3,000 doesn't cover a full wedding look yet". It goes on: "We won't show you half an outfit", then the cheapest look's total (₹3,447) and the ₹447 gap.
   - The **closest complete look** is shown with its real total and an "**₹447 over budget**" tag.
   - There's no add-to-bag button and no size picker, so it can't be mistaken for a result.
   - **"See it at ₹3,500"** reruns the look at the floor, rounded up to the next ₹100.
   - Other occasions that fit the budget appear as "*Occasion* look within ₹X" links. For C2 there are none, because every occasion's cheapest look costs more than ₹3,000.
   - "Change occasion or budget" goes back to the form with the inputs filled in.
4. **Tap "See it at ₹3,500".** You get a full wedding look under ₹3,500 that you can add to the bag.

### Also worth seeing

- On the home page, choose Wedding and set the budget below ₹3,447. The live preview shows "Needs ₹3,447+" before you even open the look.
- **Date night at ₹3,500** is a no-fit where another occasion does fit. The screen offers a "Wedding look within ₹3,500" link as a next step.
- The budget picker shows "Looks from ₹X" for the chosen occasion, so most users never reach this screen.

---

## Known limits

- **State lives in the browser tab.** A full page reload empties the bag and restores stock, the same as Reset.
- **The Cases pill is visible to everyone.** It's a reviewer control the brief asks for, so I kept it small and placed it next to the bag icon rather than hiding it.

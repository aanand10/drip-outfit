# AI tools note

## Which tools I used

| Tool | What I used it for |
|---|---|
| **Claude Code** (Claude Opus) | Most of the build: the plan, the product scraper, the matching rules, the screens, tests, docs and the video. I gave the direction and design feedback, and reviewed every change. |
| **Claude in Chrome** | Testing the app in a real browser: clicking through C1 and C2, checking stock counts, Reset, and layout at phone width. |
| **Gemini API** (Google) | Tried for an AI photo try-on. Not shipped: image generation isn't available on the free tier. |

The explainer video was made with Remotion, using real screen recordings of the app.

## How I checked the output

- **Opened the app on a real phone** over Wi-Fi after every UI change.
- **Clicked through both cases** in Chrome from Reset, many times.
- **Wrote tests on real products,** not made-up data. I also broke the double-add guard on purpose to make sure its test fails.
- **Read every change** before keeping it, and pushed back when something was over-built.

---

## The main time I had to fix it: "Add to bag" did nothing on my phone

**What happened:** on my laptop, "Add look to bag" worked. On my phone, tapping it did nothing. No error, and nothing reached the bag.

**Why:** the AI-written code made the request ID for each add with `crypto.randomUUID()`. Browsers only provide that on secure pages (HTTPS or `localhost`). My phone opened the app over plain `http://192.168.x.x:3000`, so the function didn't exist and the tap failed quietly. That request ID is also what stops the look being added twice, so this is the most important button in the app.

**How I found it:** only by testing on a real phone. It worked everywhere on my laptop.

**The fix:** a small helper, `src/lib/id.ts`. It uses `randomUUID()` when the browser has it, and falls back to `crypto.getRandomValues()`, which works everywhere.

**Lesson:** code that works on `localhost` can still break on a real device. I test on a phone after every change.

---

## Other things I caught and fixed

| What the AI got wrong | How I caught it | Fix |
|---|---|---|
| Removed the C1/C2/Reset bar when I said it looked bad, even though the brief requires it | Re-reading the brief | Brought it back as a small **Cases** button in the header |
| The swap list seemed to show the same shoe twice ("Brewster", "Brewster") | Clicking through the swap menu | They were the same shoe in two colours. The option now shows the colour: "Brewster · tan" |
| Said Gemini's free tier could generate images | Called the API with my key; it returned a "limit: 0" error | Corrected the advice, and dropped try-on from the build |
| Moved to TypeScript 7, which broke linting | `pnpm lint` failed | Went back to TypeScript 5.9 |
| The intro photos didn't animate | Watching the page | Tailwind was dropping animations defined in the wrong place. Moved them |
| Some tests used made-up products, and one test could never fail | Reading the tests | Rewrote every test on real catalogue products and real app inputs |
| Some code comments were long and wordy | Code review | Cut them down to short "why" comments |

# StockTruth: a stock reliability layer for NOVA CART

PromptWars Business Rescue Challenge. **Live demo:** [ADD LINK] | **Code:** this repo

## Problem diagnosis
NOVA CART is growing in volume, not in quality. Orders are up 23% but promo spend is up 79%, so each ₹1 of promo now returns ₹1.54 of revenue (was ₹2.29). Repeat purchase fell from 41% to 27%.

Evidence that the cause is unreliable stock, not weak marketing:
- 61% of customers who stopped ordering had rated the app 4★ or higher. They had a bad order, not a bad app.
- Only 31% of customers place a second order, but those who reach a third have a 72% chance of staying.
- Product unavailable (35%) plus store rejection (18%) is 53% of cancellations. That is about 5.8% of all orders.
- 29% of customers saw items become unavailable after ordering, and 19% of support tickets are missing products.
- 39% of partner stores say updating stock online is too much work, and 18% may leave.

The loop: stale stock data, then cancellations, substitutions and refunds, then a ruined first or second order, then churn, then more paid acquisition to replace the lost users.

## What it does
0. **How the simulation works:** a clock advances in the top bar. Customers buy items, so hidden shelf stock falls while the app's information gets older. A store "Check shelf" reveals the truth. A customer order on an item that is really gone is cancelled after payment, as it would be in real life.
1. **Diagnosis:** the evidence charts, plus each executive's claim tested against the case data, ending in the root cause.
2. **Store dashboard:** an operations view ranks stores by lost-sales risk (computed live, not invented), and every item has a confidence score for being in stock. Stores confirm with one tap, or confirm all at-risk items at once. A "fix these first" queue ranks items by lost-sales risk, so a few taps remove most of the damage. A demand box shows what customers searched for and could not find.
3. **Customer cart:** each item shows a reliability badge, and one click on "Rescue my order" swaps every risky item to a safer store and shows the before and after. Risky items offer a switch to a more reliable nearby store. First-time customers get stricter checks. The cart shows the chance the whole order arrives complete.
4. **Live day:** the same 600 orders run side by side, without and with StockTruth, so the effect is visible in seconds.
5. **Business impact:** an adjustable simulator using the case's own numbers, with payback and 12-month return on the rollout cost.
6. **Data proof:** the score is tested on 5,000 orders. It never sees the cancellation outcome.

## Score
`confidence = 99 x exp(-0.03 x hours_since_update x (1 + sales_per_day/20)) x (1 - store_rejection_rate)`, clamped to 5-99.
Fast-selling items go stale sooner, and stores with a rejection history are penalised. The weights are prototype assumptions to be tuned on real data.

## Data proof (synthetic, calibrated to the case)
| Band | Orders | Cancelled for stock |
|---|---|---|
| High (75%+) | 3,686 | 2.1% |
| Medium | 963 | 9.8% |
| Risky (<50%) | 351 | 35.0% |

The data is synthetic: 5.8% overall cancellation (as in the case), stores updating every 4 to 30 hours, stock-outs simulated from shelf units and sales speed. It proves the scoring logic and sizes the impact. It does **not** prove real-world results. The Data proof tab accepts any CSV with the columns `hrs_since_update, velocity_per_day, store_rejection_rate, cancelled_for_stock`, so NOVA CART can test it on its own orders.

## Business impact (defaults: 60% of stores adopt, 60% of stock cancellations avoided)
About 800 orders rescued per month, about ₹3.9L of order value protected, about 400 fewer support tickets. NOVA CART's revenue is about 14% of order value, so the net revenue gain is smaller than the order value protected. The simulator shows both.
Cost: software only. At an assumed ₹10L rollout cost against the ₹25L cap, payback is about 7.5 months (adjustable in the app). Promo savings and the retention effect beyond the repeat-order assumption are not counted.

## Run it
Open `index.html` in any browser. There is nothing to install.
To deploy: push to GitHub, then Settings, Pages, Deploy from branch `main` (root).
To regenerate the data: `pip install numpy && python generate_data.py`

## Demo (90 seconds)
1. Diagnosis tab: show the cancellation reasons and the executive scorecard (20 seconds).
2. Store tab: pick Sri Lakshmi Provisions and show the risky items.
3. Customer tab: add Toned milk from that store with "First-time customer" on, then show the warning and the store switch.
4. Store tab: tap "Confirm all", go back to the cart, and show the score has risen.
5. Data proof tab: show the three bands and move the slider.
6. Business impact tab: change the assumptions.

## Pilot plan
Phase 1: 4 weeks, 100 stores (the same number NOVA CART interviewed), 50 using StockTruth and 50 as a control group, using the same CSV columns from NOVA CART's order database. Phase 2: all 620 stores. Phase 3: all three cities. Measure stock-related cancellation rate, refund tickets per 1,000 orders, second-order rate within 30 days, and store update effort.

## Problem statement alignment
| What the case says | What StockTruth does |
|---|---|
| Orders +23%, promo spend +79%, repeat purchase 41% to 27% | Targets the cause of lost repeat orders (failed orders), not more acquisition spend |
| 53% of cancellations are product unavailable or store rejection | Confidence score per item, risky items warned before checkout, safer nearby store offered |
| 39% of stores say updating stock is too much work | One-tap confirm, "confirm all at risk", and a fix-first queue so a few taps matter most |
| Budget cap of 25 lakh, no warehouses or hiring | Software only, assumed 10 lakh rollout, payback about 7.5 months (adjustable) |
| Management disagrees on the cause | Diagnosis tab tests each executive's claim against the case data |
| Is it real? | Backtest on 5,000 synthetic orders, CSV upload for real data, 4-week pilot with a control group |

## Security
Details and honest limitations are in [SECURITY.md](SECURITY.md). In short: strict Content-Security-Policy with no network access (`connect-src 'none'`), escaped file names, upload size and row caps, error handling around parsing and storage, a sign-in throttle, and an anti-framing guard. The three login accounts are **demo-only** (the password is shown on screen) and are not real authentication.

## Efficiency
- One file, no runtime dependencies, no network requests, about 98 KB (the embedded 5,000-order dataset is stored in a compact form, with values verified identical to the CSV by a test).
- The backtest is memoised, so moving the slider does not recompute 5,000 scores. The live-day timer pauses in background tabs, and the accessibility layer batches its DOM updates (at most one pass per 150 ms).

## Accessibility
- Skip link, a heading on every screen, tabs that work with the arrow keys, labelled inputs and bars, a polite live region for notifications, visible focus outlines, a keyboard-focusable file upload, reduced-motion support, landmarks for every part of the page.
- Every palette in light and dark meets WCAG AA text contrast (4.5:1), checked by a test. Status colours (green, amber, red) are never the only signal: each pill also says "In stock", "Limited stock" or "Out of stock".
- axe-core finds no violations on any screen for any role (tested automatically).

## Code quality
- Linted with ESLint (`npm run lint`), with no errors or warnings. Core logic is small, named functions with comments. The scoring function is documented and is the one the tests run.
- Layout of `stocktruth.html`: styles, markup, data, app logic (risk engine, customer, store, operations, live day, data proof, impact), theme and confetti, accessibility layer.

## Tests
`npm install`, then `npm run check` (lint plus 24 tests, Node 18+). The tests cover:
- **Scoring:** the shipped function stays in bounds and behaves sensibly as data ages, items sell faster and stores reject more.
- **Evidence:** the dataset matches the case (5,000 orders, about 5.8% cancelled), the README band table is reproduced exactly (3,686 / 963 / 351 orders, 2.1% / 9.8% / 35.0%), and the compact embedded data equals the CSV.
- **Behaviour in the real app (jsdom):** sign-in, wrong password and throttling, tab semantics, time passing and shelf checks, a cancelled-after-payment order, and the impact simulator reproducing the README figures.
- **Quality gates:** axe-core on every screen for every role, WCAG contrast for every palette, security headers and escaping.
GitHub Actions runs lint and tests on every push.

## Limitations and next steps
- The data is synthetic. The score weights are prototype assumptions to be tuned on real orders, and the pilot (above) is what would prove real-world impact.
- Impact figures depend on adoption and effectiveness assumptions, shown and adjustable in the Business impact tab.
- Not built, on purpose: real authentication, a backend, store-app integrations. These belong after the pilot proves the score.

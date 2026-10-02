# Prompt Journey: StockTruth
(Prompts paraphrased. Insights are what each step produced.)

## 1. Diagnose
"Here is the Business Rescue brief. Find the real problem, not the surface symptoms."
**Insight:** Volume is up but quality is down. Promo spend rose 79% against 23% order growth. 61% of churned users rated the app 4★ or higher, so the failure is in the order, not the app.

## 2. Resolve the management disagreement
"Six executives each blame something different. Which claim does the evidence support most strongly?"
**Insight:** Stock accuracy connects to cancellations (53% from unavailable or rejected), refunds, missing-product tickets and store churn. Delivery delay and marketing are partly downstream of it.

## 3. Choose the product
"What is the smallest product that fixes this without warehouses, hiring or discounts? It must work for stores too, since 39% say updating stock is too much work."
**Decision:** StockTruth: a store dashboard for one-tap confirmation, a confidence score per item, and a customer cart that warns and offers alternatives.

## 4. Build
"Build a working web app: store input, scoring logic, customer output, impact simulator."
**Decision:** Single-file web app, no backend, so it cannot fail during the demo.

## 5. Prove it
"Our data is simulated. How do we show the idea works without pretending it is real?"
**Decision:** A calibrated synthetic dataset where stock-outs come from shelf units and sales speed, not from the score. Backtest the score: Risky orders cancel 35.0% against 2.1% for High. State clearly that it is synthetic, and add CSV upload plus a pilot plan.

## 6. Correct the business case
"Is order value the same as revenue?"
**Insight:** No. NOVA CART's revenue is about 14% of order value, so the simulator separates order value protected from net revenue gain.

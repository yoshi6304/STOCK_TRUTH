"""Regenerates novacart_orders_synthetic.csv.
Each order: hours since the store last updated stock, item sales/day, store rejection rate.
A stock-out happens when sales since the last update exceed the (hidden) units on the shelf.
The hours scale is tuned so the overall cancellation rate matches the case (~5.8%)."""
import numpy as np
N = 5000
STORES = [("S1", .14, 30), ("S2", .04, 4), ("S3", .09, 12), ("S4", .06, 6)]  # id, rejection rate, mean hrs between updates

def gen(scale, seed=7):
    r = np.random.default_rng(seed); rows = []
    for _ in range(N):
        sid, rej, mh = STORES[r.integers(0, 4)]
        hrs = r.exponential(mh * scale)
        vel = float(r.integers(2, 41))
        units = int(r.integers(3, 41))
        sold = r.poisson(vel / 24 * hrs)
        cancelled = int(sold >= units or r.random() < rej * 0.25)
        rows.append((sid, round(hrs, 1), vel, rej, cancelled))
    return rows

lo, hi = .05, 3
for _ in range(25):
    mid = (lo + hi) / 2; rows = gen(mid)
    if np.mean([x[4] for x in rows]) > 0.0583: hi = mid
    else: lo = mid
with open("novacart_orders_synthetic.csv", "w") as f:
    f.write("store_id,hrs_since_update,velocity_per_day,store_rejection_rate,cancelled_for_stock\n")
    f.writelines(",".join(map(str, x)) + "\n" for x in rows)
print("cancel rate:", round(np.mean([x[4] for x in rows]), 4))

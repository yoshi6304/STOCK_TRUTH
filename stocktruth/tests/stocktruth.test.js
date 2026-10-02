// Run with: node --test tests/   (Node 18+, no dependencies)
const test = require("node:test"), assert = require("node:assert");
const fs = require("fs"), path = require("path");
const root = path.join(__dirname, "..");
const htmlFile = ["index.html", "stocktruth.html"].map(f => path.join(root, f)).find(fs.existsSync);
const html = fs.readFileSync(htmlFile, "utf8");

// Pull the real scoring function out of the app, so the tests check shipped code.
const cf = new Function("return " + html.match(/function cf\([^)]*\)\{[^\n]*\}/)[0])();

const rows = fs.readFileSync(path.join(root, "novacart_orders_synthetic.csv"), "utf8").trim().split("\n").slice(1)
  .map(l => { const a = l.split(","); return { hrs: +a[1], vel: +a[2], rej: +a[3], c: +a[4] }; });
const rate = r => r.length ? r.reduce((s, x) => s + x.c, 0) / r.length : 0;

test("score stays within 5 to 99", () => {
  for (const [h, v, r] of [[0, 0, 0], [1e4, 40, .5], [0, 40, 0], [30, 2, .14]]) {
    const s = cf(h, v, r); assert.ok(s >= 5 && s <= 99, `${s}`);
  }
});
test("score falls as data gets older, items sell faster, or stores reject more", () => {
  assert.ok(cf(2, 10, .05) > cf(20, 10, .05));
  assert.ok(cf(10, 5, .05) > cf(10, 35, .05));
  assert.ok(cf(10, 10, .02) > cf(10, 10, .2));
});
test("a fresh update from a reliable store scores High (75+)", () => {
  assert.ok(cf(1, 10, .04) >= 75);
});
test("backtest: cancellation rate rises as confidence falls", () => {
  const sc = rows.map(x => ({ s: cf(x.hrs, x.vel, x.rej), c: x.c }));
  const hi = sc.filter(x => x.s >= 75), md = sc.filter(x => x.s >= 50 && x.s < 75), lo = sc.filter(x => x.s < 50);
  assert.ok(rate(lo) > rate(md) && rate(md) > rate(hi), "bands must be ordered");
  assert.ok(rate(lo) > 0.25, "risky band should cancel 25%+");
  assert.ok(rate(hi) < 0.05, "high band should cancel under 5%");
});
test("dataset matches the case: about 5.8% cancelled, 5,000 orders", () => {
  assert.strictEqual(rows.length, 5000);
  assert.ok(Math.abs(rate(rows) - 0.058) < 0.005);
});
test("security: CSP present, no external resources, no network calls", () => {
  assert.match(html, /Content-Security-Policy/);
  assert.doesNotMatch(html, /(src|href)=["']https?:\/\//i);
  assert.doesNotMatch(html, /\bfetch\(|XMLHttpRequest|WebSocket/);
});
test("security: uploaded file names are escaped before display", () => {
  assert.match(html, /src=esc\(f\.name\)/);
  const esc = new Function("return " + html.match(/const esc=(t=>[^\n]*)/)[1])();
  assert.strictEqual(esc('<img src=x onerror="a()">'), "&lt;img src=x onerror=&quot;a()&quot;&gt;");
});
test("accessibility: lang, viewport, skip link, live toast, tab roles", () => {
  assert.match(html, /<html lang="en"/);
  assert.match(html, /name="viewport"/);
  assert.match(html, /class="skip"|className="skip"/);
  assert.match(html, /aria-live/);
  assert.match(html, /role","tab"|role="tab"/);
});

test("compact embedded dataset decodes to exactly the CSV orders", () => {
  const raw = html.match(/const RAW=`([\s\S]*?)`;/)[1], REJ = [0.14, 0.04, 0.09, 0.06];
  const dec = raw.trim().split("\n").map(l => { const a = l.split(","), c = +a[2]; return { hrs: +a[0], vel: +a[1], rej: REJ[c >> 1], c: c & 1 }; });
  assert.strictEqual(dec.length, rows.length);
  dec.forEach((d, i) => { assert.strictEqual(d.hrs, rows[i].hrs); assert.strictEqual(d.vel, rows[i].vel);
    assert.strictEqual(d.rej, rows[i].rej); assert.strictEqual(d.c, rows[i].c); });
});
test("robustness: uploads and storage are wrapped in error handling", () => {
  assert.match(html, /catch\(err\)\{alert\(/);
  assert.match(html, /const LS=\{get:/);
});

test("README bands: 3,686 / 963 / 351 orders cancelling 2.1% / 9.8% / 35.0%", () => {
  const sc = rows.map(x => ({ s: cf(x.hrs, x.vel, x.rej), c: x.c }));
  const bands = [sc.filter(x => x.s >= 75), sc.filter(x => x.s >= 50 && x.s < 75), sc.filter(x => x.s < 50)];
  assert.deepStrictEqual(bands.map(b => b.length), [3686, 963, 351]);
  assert.deepStrictEqual(bands.map(b => +(rate(b) * 100).toFixed(1)), [2.1, 9.8, 35.0]);
});
test("accessibility: every palette, light and dark, meets WCAG AA text contrast (4.5:1)", () => {
  const lum = h => { const c = [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255).map(v => v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4); return .2126 * c[0] + .7152 * c[1] + .0722 * c[2]; };
  const cr = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };
  const vars = t => Object.fromEntries([...t.matchAll(/--([a-z]+):(#[0-9a-f]{6})/g)].map(m => [m[1], m[2]]));
  const baseL = { card: "#ffffff", ...vars(html.match(/:root\{box-sizing[^}]*\}/)[0]) };
  const baseD = vars(html.match(/:root\[data-theme="dark"\]\{[^}]*\}/)[0]);
  const P = new Function("return (" + html.match(/const P=(\{[\s\S]*?\}\}\});/)[1] + ")")();
  const fails = [];
  for (const [name, p] of Object.entries(P)) for (const m of ["L", "D"]) {
    const v = { ...(m === "L" ? baseL : baseD), ...(p[m] || {}) };
    v.on = m === "L" ? "#ffffff" : (p.D ? p.D.bg : "#0f1a18");
    for (const [f, b] of [["ink", "bg"], ["ink", "card"], ["mute", "bg"], ["mute", "card"], ["brand", "card"], ["brand", "bg"], ["on", "brand"], ["ok", "okbg"], ["mid", "midbg"], ["bad", "badbg"], ["ok", "card"], ["mid", "card"], ["bad", "card"]])
      if (cr(v[f], v[b]) < 4.5) fails.push(`${name}/${m} ${f} on ${b}`);
  }
  assert.deepStrictEqual(fails, []);
});
test("security: sign-in throttle and anti-framing guard are present", () => {
  assert.match(html, /lockUntil/); assert.match(html, /window\.top!==window\.self/);
});

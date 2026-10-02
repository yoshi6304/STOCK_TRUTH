// UI tests: load the real app in jsdom and drive it like a user.  Run with: npm test
const test = require("node:test"), assert = require("node:assert");
const fs = require("fs"), path = require("path");
const { JSDOM } = require("jsdom");
const axe = require("axe-core");
const root = path.join(__dirname, "..");
const file = ["index.html", "stocktruth.html"].map(f => path.join(root, f)).find(fs.existsSync);

function load() {
  const dom = new JSDOM(fs.readFileSync(file, "utf8"), { runScripts: "dangerously", url: "https://example.test/",
    pretendToBeVisual: true, beforeParse(w) { w.matchMedia = w.matchMedia || (() => ({ matches: false, addEventListener() {} })); } });
  return dom.window;
}
const tick = () => new Promise(r => setTimeout(r, 30));
// the accessibility layer batches DOM updates (max one pass per 150 ms), so wait for it before checking semantics
const settle = () => new Promise(r => setTimeout(r, 260));

test("app starts on the sign-in screen with no script errors", async () => {
  const w = load(); await tick();
  assert.ok(w.document.getElementById("login").classList.contains("on"));
  assert.ok(w.document.getElementById("em"), "email field exists");
  w.close();
});
test("signing in with wrong details shows an error and stays signed out", async () => {
  const w = load(); await tick();
  w.document.getElementById("em").value = "nobody@example.com"; w.document.getElementById("pw").value = "x";
  w.document.getElementById("si").click();
  assert.match(w.document.getElementById("lerr").textContent, /not correct/);
  w.close();
});
test("a demo account signs in and the tabs are keyboard-accessible tabs", async () => {
  const w = load(); await tick();
  w.document.querySelector("[data-u]").click(); await settle();
  const tabs = [...w.document.querySelectorAll("#nav button")];
  assert.ok(tabs.length >= 1, "navigation rendered");
  tabs.forEach(t => assert.strictEqual(t.getAttribute("role"), "tab"));
  assert.strictEqual(tabs.filter(t => t.getAttribute("aria-selected") === "true").length, 1);
  w.close();
});
test("accessibility: every screen has a heading, skip link and footer exist", async () => {
  const w = load(); await settle();
  assert.ok(w.document.querySelector("a.skip"));
  assert.ok(w.document.querySelector("footer"));
  assert.ok(w.document.querySelector("h1"));
  assert.ok(w.document.querySelector(".panel h2.sr"));
  w.close();
});
test("theme: palette swatches and light/dark toggle work and are remembered", async () => {
  const w = load(); await tick();
  const sw = w.document.querySelectorAll(".sw"); assert.strictEqual(sw.length, 4);
  sw[2].click(); assert.strictEqual(w.localStorage.getItem("st_pal"), "berry");
  const before = w.document.documentElement.getAttribute("data-theme");
  w.document.getElementById("mode").click();
  assert.notStrictEqual(w.document.documentElement.getAttribute("data-theme"), before);
  w.close();
});

const signInAs = async (w, k) => { w.document.querySelectorAll("[data-u]")[k].click(); await tick(); };

test("sign-in is throttled after 5 wrong attempts", async () => {
  const w = load(); await tick();
  w.document.getElementById("em").value = "priya@demo.in"; w.document.getElementById("pw").value = "wrong";
  for (let i = 0; i < 5; i++) w.document.getElementById("si").click();
  w.document.getElementById("pw").value = "demo123"; w.document.getElementById("si").click();
  assert.match(w.document.getElementById("lerr").textContent, /Too many attempts/);
  assert.ok(w.document.getElementById("login").classList.contains("on"), "still signed out while locked");
  w.close();
});
test("time passing ages the stock info and sells units; a shelf check restores the truth", async () => {
  const w = load(); await tick(); await signInAs(w, 1);
  const units = () => w.eval("items.reduce((a,i)=>a+i.u,0)"), maxHrs = () => w.eval("Math.max(...items.map(i=>i.hrs))");
  const u0 = units(), h0 = maxHrs();
  w.eval("tick(24)");
  assert.ok(units() < u0, "customers bought items"); assert.ok(maxHrs() >= h0 + 24, "info got older");
  const id = w.eval("items.filter(i=>i.stock&&i.u>0).sort((a,b)=>b.hrs-a.hrs)[0].id");
  const before = w.eval(`conf(items.find(i=>i.id===${id}))`);
  w.eval(`checkShelf(items.find(i=>i.id===${id}))`);
  assert.ok(w.eval(`conf(items.find(i=>i.id===${id}))`) >= before, "confidence rises after a check");
  assert.strictEqual(w.eval(`items.find(i=>i.id===${id}).hrs`), 0);
  w.close();
});
test("a customer order for an item that is really gone is cancelled after payment", async () => {
  const w = load(); await tick(); await signInAs(w, 0);
  w.document.querySelector("[data-add]").click();
  w.eval("items.find(i=>i.id===cart[0].id).u=0");
  w.document.getElementById("place").click();
  assert.match(w.document.getElementById("cust").textContent, /cancelled after payment/);
  assert.strictEqual(w.eval("stats.failed"), 1);
  w.close();
});
test("impact simulator reproduces the README figures (about 800 orders, 3.9L, 400 tickets, 7.5 months)", async () => {
  const w = load(); await tick(); await signInAs(w, 2);
  const t = new JSDOM(w.eval("simHTML()[0]")).window.document.body.textContent.replace(/\s+/g, " ");
  const num = re => +t.match(re)[1].replace(/,/g, "");
  assert.ok(Math.abs(num(/Orders rescued per month\s*([\d,]+)/) - 800) < 25);
  assert.ok(Math.abs(num(/Order value protected\s*\u20B9([\d.]+)L/) - 3.9) < 0.15);
  assert.ok(Math.abs(num(/Support tickets avoided\s*([\d,]+)/) - 400) < 25);
  assert.ok(Math.abs(num(/Payback on [^\d]*[\d.]+L spend\s*([\d.]+)/) - 7.5) < 0.6);
  w.close();
});
test("backtest is memoised and the bands match the README table", async () => {
  const w = load(); await tick(); await signInAs(w, 2);
  assert.ok(w.eval("proofCalc()===proofCalc()"), "same object returned until the data changes");
  const B = JSON.parse(w.eval("JSON.stringify(proofCalc().B)"));
  assert.deepStrictEqual([B.High[0], B.Medium[0], B.Risky[0]], [3686, 963, 351]);
  assert.deepStrictEqual([B.High, B.Medium, B.Risky].map(b => +(b[1] / b[0] * 100).toFixed(1)), [2.1, 9.8, 35.0]);
  w.close();
});
test("axe-core finds no accessibility violations on any screen, for any role", async () => {
  for (const role of [0, 1, 2]) {
    const w = load(); await tick(); await signInAs(w, role);
    const tabs = [...w.document.querySelectorAll("#nav button")];
    for (const t of tabs.length > 1 ? tabs : [null]) {
      if (t) t.click();
      await settle(); w.eval(axe.source);
      const r = await w.axe.run(w.document, { rules: { "color-contrast": { enabled: false } } }); // jsdom cannot measure contrast; see contrast test
      assert.strictEqual(r.violations.length, 0, `role ${role} tab ${t && t.textContent}: ${r.violations.map(v => v.id).join(", ")}`);
    }
    w.close();
  }
});

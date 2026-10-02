// Extracts the inline scripts from the app so ESLint can check them: node scripts/extract-js.js
const fs = require("fs"), path = require("path");
const root = path.join(__dirname, "..");
const file = ["index.html", "stocktruth.html"].map(f => path.join(root, f)).find(fs.existsSync);
const blocks = [...fs.readFileSync(file, "utf8").matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
fs.mkdirSync(path.join(root, "build"), { recursive: true });
blocks.forEach((b, i) => fs.writeFileSync(path.join(root, "build", `script${i}.js`), b));
console.log(`extracted ${blocks.length} scripts`);

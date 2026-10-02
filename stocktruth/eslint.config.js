// Lints the inline <script> blocks of stocktruth.html (extracted by tests/lint-extract.js)
const globals = require("globals");
module.exports = [{
  files: ["build/**/*.js"],
  languageOptions: { ecmaVersion: 2022, sourceType: "script", globals: { ...globals.browser } },
  rules: { "no-undef": "error", "no-unused-vars": ["warn", { args: "none", caughtErrors: "none" }],
    "no-redeclare": "error", "no-dupe-keys": "error", "no-unreachable": "error", "eqeqeq": ["warn", "smart"] }
}];

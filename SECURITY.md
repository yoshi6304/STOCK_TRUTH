# Security notes

StockTruth is a front-end prototype with synthetic data, so the threat model is small. What is in place:

| Risk | Control |
|---|---|
| Injected scripts or third-party code | Content-Security-Policy (meta tag, plus `_headers` for hosts that support it): no external scripts, styles, fonts or images |
| Data leaving the browser | `connect-src 'none'`: the page cannot make network requests. Uploaded CSVs are processed locally |
| Malicious file names or CSV content | File names are HTML-escaped before display. Only the four numeric columns are read, non-numeric rows are dropped, files over 5 MB and rows beyond 200,000 are rejected |
| Clickjacking | `frame-ancestors` in `_headers`, plus a script that hides the page if it is framed |
| Password guessing on the demo sign-in | 5 wrong attempts lock sign-in for 30 seconds |
| Browser storage unavailable | All storage access is wrapped in try/catch |

## Known limitations (stated honestly)
- The three demo accounts are checked inside the page and their password is shown on the sign-in screen. **This is not real authentication.** A live product would use a server-side sign-in service, hashed credentials and role checks on the server.
- GitHub Pages cannot set HTTP headers, so `frame-ancestors`, `X-Frame-Options` and HSTS only apply on hosts that read `_headers`.
- `script-src 'unsafe-inline'` is needed because the app is one self-contained file. A multi-file build could use hashes or nonces instead.

Report issues by opening a GitHub issue.

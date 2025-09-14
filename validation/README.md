Validation Tooling

Overview
- Scripts to validate performance (Lighthouse), accessibility (axe-core + Playwright), bundle size (gzip), and cross-browser (Playwright) for the Aptos app.

Prerequisites
- App running locally at http://localhost with frontend built (`frontend/dist`).
- Node.js 18+ installed.
- Install dev tools (one-time):
  npm i -D lighthouse chrome-launcher playwright @axe-core/playwright gzip-size
  npx playwright install

How To Run
1) Build frontend bundle (from `frontend/`):
   npm run build
2) Ensure the site is reachable at http://localhost (nginx or dev server).
3) From repo root:
   node validation-runner.js

Artifacts
- performance-results.json, performance-report-*.html
- accessibility-report.json
- browser-compatibility-report.json
- bundle-analysis.json
- final-validation-report.json

Targets
- Performance >= 90, Accessibility >= 95
- LCP < 2.5s, TTI < 3s
- Bundle gzipped < 500KB


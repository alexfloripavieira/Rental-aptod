// browser-compatibility/cross-browser-test.js
// Basic cross-browser sanity via Playwright (Chromium, Firefox, WebKit)
const { chromium, firefox, webkit, devices } = require('playwright');
const fs = require('fs');

const targets = [
  { name: 'Chromium Desktop', launcher: chromium, device: null },
  { name: 'Firefox Desktop', launcher: firefox, device: null },
  { name: 'WebKit Desktop', launcher: webkit, device: null },
  { name: 'Chromium Mobile', launcher: chromium, device: devices['Pixel 5'] },
  { name: 'WebKit Mobile', launcher: webkit, device: devices['iPhone 12'] },
];

const pages = [
  { url: 'http://localhost/', name: 'Home' },
  { url: 'http://localhost/aptos', name: 'Apartments' },
  { url: 'http://localhost/builders', name: 'Builders' },
];

async function runCrossBrowserTests() {
  const results = [];

  for (const target of targets) {
    const browser = await target.launcher.launch();
    const context = target.device ? await browser.newContext({ ...target.device }) : await browser.newContext();
    const page = await context.newPage();

    for (const p of pages) {
      const entry = { browser: target.name, device: target.device ? 'mobile' : 'desktop', page: p.name, url: p.url, passed: true, errors: [] };
      try {
        await page.goto(p.url, { waitUntil: 'networkidle' });
        // Simple checks: no uncaught console errors
        page.on('pageerror', (err) => entry.errors.push(`pageerror: ${err.message}`));
        page.on('console', (msg) => { if (msg.type() === 'error') entry.errors.push(`console: ${msg.text()}`); });
        // Basic UI selectors present
        const hasRoot = await page.locator('#root').count();
        if (hasRoot === 0) entry.errors.push('Missing #root element');
      } catch (e) {
        entry.errors.push(e?.message || String(e));
      }
      entry.passed = entry.errors.length === 0;
      results.push(entry);
    }

    await browser.close();
  }

  const summary = {
    totalTests: results.length,
    passed: results.filter(r => r.passed).length,
    failed: results.filter(r => !r.passed).length,
  };
  const report = { timestamp: new Date().toISOString(), summary, results };
  fs.writeFileSync('browser-compatibility-report.json', JSON.stringify(report, null, 2));
  return report;
}

module.exports = { runCrossBrowserTests };


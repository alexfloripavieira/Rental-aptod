// performance/lighthouse-config.js
// Runs Lighthouse (Performance, Accessibility, Best Practices, SEO) and saves HTML + JSON
const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');
const fs = require('fs');

const performanceConfig = {
  extends: 'lighthouse:default',
  settings: {
    throttlingMethod: 'simulate',
    throttling: {
      rttMs: 40,
      throughputKbps: 10240,
      cpuSlowdownMultiplier: 1,
    },
    emulatedFormFactor: 'desktop',
    screenEmulation: {
      mobile: false,
      width: 1350,
      height: 940,
    },
  },
};

async function runPerformanceTest(url) {
  const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless'] });
  const options = {
    logLevel: 'info',
    output: 'html',
    onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
    port: chrome.port,
  };

  const runnerResult = await lighthouse(url, options, performanceConfig);

  // Persist reports
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const htmlPath = `performance-report-${timestamp}.html`;
  fs.writeFileSync(htmlPath, runnerResult.report);

  const metrics = {
    performanceScore: Math.round(runnerResult.lhr.categories.performance.score * 100),
    accessibilityScore: Math.round(runnerResult.lhr.categories.accessibility.score * 100),
    bestPracticesScore: Math.round(runnerResult.lhr.categories['best-practices'].score * 100),
    seoScore: Math.round(runnerResult.lhr.categories.seo.score * 100),
    firstContentfulPaint: runnerResult.lhr.audits['first-contentful-paint'].numericValue / 1000,
    largestContentfulPaint: runnerResult.lhr.audits['largest-contentful-paint'].numericValue / 1000,
    cumulativeLayoutShift: runnerResult.lhr.audits['cumulative-layout-shift'].numericValue,
    timeToInteractive: runnerResult.lhr.audits.interactive.numericValue / 1000,
    reportHtml: htmlPath,
  };

  await chrome.kill();
  return metrics;
}

// Pages to test
const pages = [
  'http://localhost/',
  'http://localhost/aptos',
  'http://localhost/builders',
];

async function runAllTests() {
  const results = {};
  for (const page of pages) {
    // eslint-disable-next-line no-console
    console.log(`Running Lighthouse for ${page}...`);
    results[page] = await runPerformanceTest(page);
  }

  // Output summary and save json
  for (const [page, m] of Object.entries(results)) {
    // eslint-disable-next-line no-console
    console.log(`\n${page} Results:`);
    console.log(`Performance: ${m.performanceScore}% (target >= 90)`);
    console.log(`Accessibility: ${m.accessibilityScore}% (target >= 95)`);
    console.log(`FCP: ${m.firstContentfulPaint.toFixed(2)}s (target < 1.5s)`);
    console.log(`LCP: ${m.largestContentfulPaint.toFixed(2)}s (target < 2.5s)`);
    console.log(`TTI: ${m.timeToInteractive.toFixed(2)}s (target < 3s)`);
  }

  fs.writeFileSync('performance-results.json', JSON.stringify(results, null, 2));
  return results;
}

module.exports = { runAllTests, runPerformanceTest };


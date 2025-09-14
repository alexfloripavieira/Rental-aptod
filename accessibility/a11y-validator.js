// accessibility/a11y-validator.js
// Uses Playwright + axe-core to validate WCAG 2.1 A/AA and keyboard nav basics
const { chromium } = require('playwright');
const AxeBuilder = require('@axe-core/playwright');
const fs = require('fs');

const pages = [
  { url: 'http://localhost/', name: 'Home' },
  { url: 'http://localhost/aptos', name: 'Apartments' },
  { url: 'http://localhost/builders', name: 'Builders' },
];

async function validateAccessibility() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const results = [];

  for (const p of pages) {
    // eslint-disable-next-line no-console
    console.log(`A11y testing: ${p.name}`);
    await page.goto(p.url);
    await page.waitForLoadState('networkidle');

    const axe = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    const keyboardNavigation = await testKeyboardNavigation(page);
    const screenReader = await testScreenReaderCompatibility(page);

    const entry = {
      page: p.name,
      url: p.url,
      violations: axe.violations,
      passes: axe.passes?.length || 0,
      incomplete: axe.incomplete?.length || 0,
      keyboardNavigation,
      screenReader,
      passed: axe.violations.length === 0,
    };
    results.push(entry);
  }

  await browser.close();
  generateAccessibilityReport(results);
  return results;
}

async function testKeyboardNavigation(page) {
  const res = { canNavigateWithTab: false, focusVisible: false };
  try {
    await page.keyboard.press('Tab');
    const focused = page.locator(':focus');
    res.canNavigateWithTab = await focused.isVisible();
    const styles = await focused.evaluate((el) => {
      const s = getComputedStyle(el);
      return { outline: s.outline, outlineWidth: s.outlineWidth };
    });
    res.focusVisible = styles.outline !== 'none' || styles.outlineWidth !== '0px';
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('Keyboard nav test error:', e?.message || e);
  }
  return res;
}

async function testScreenReaderCompatibility(page) {
  const res = { headingsOk: false, ariaLabelsOk: false };
  try {
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').count();
    res.headingsOk = headings > 0;

    const interactive = await page.locator('button, a, input, select, textarea').all();
    let labeled = true;
    for (const el of interactive) {
      const aria = await el.getAttribute('aria-label');
      const titled = await el.getAttribute('title');
      const text = (await el.textContent())?.trim();
      if (!aria && !titled && !text) {
        labeled = false; break;
      }
    }
    res.ariaLabelsOk = labeled;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('Screen reader test error:', e?.message || e);
  }
  return res;
}

function generateAccessibilityReport(results) {
  const summary = {
    totalPages: results.length,
    passedPages: results.filter(r => r.passed).length,
    totalViolations: results.reduce((n, r) => n + r.violations.length, 0),
  };
  const report = { timestamp: new Date().toISOString(), summary, results };
  fs.writeFileSync('accessibility-report.json', JSON.stringify(report, null, 2));
}

module.exports = { validateAccessibility };


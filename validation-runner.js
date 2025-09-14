// validation-runner.js
// Orchestrates performance, accessibility, bundle and browser compatibility checks
const { runAllTests: runPerformanceTests } = require('./performance/lighthouse-config');
const { validateAccessibility } = require('./accessibility/a11y-validator');
const { runCrossBrowserTests } = require('./browser-compatibility/cross-browser-test');
const { analyzeBundleSize } = require('./performance/bundle-analysis');
const fs = require('fs');

async function runAllValidations() {
  // eslint-disable-next-line no-console
  console.log('🚀 Running comprehensive validation...');

  const result = {
    timestamp: new Date().toISOString(),
    performance: null,
    accessibility: null,
    browserCompatibility: null,
    bundleSize: null,
    overallPassed: false,
  };

  try {
    // eslint-disable-next-line no-console
    console.log('\n🏃 Performance (Lighthouse)');
    result.performance = await runPerformanceTests();

    // eslint-disable-next-line no-console
    console.log('\n♿ Accessibility (axe-core + keyboard)');
    result.accessibility = await validateAccessibility();

    // eslint-disable-next-line no-console
    console.log('\n📦 Bundle size (Vite dist/assets)');
    result.bundleSize = await analyzeBundleSize();

    // eslint-disable-next-line no-console
    console.log('\n🌐 Cross-browser (Playwright)');
    result.browserCompatibility = await runCrossBrowserTests();

    const performancePassed = Object.values(result.performance || {}).every((p) =>
      p.performanceScore >= 90 && p.accessibilityScore >= 95
    );
    const accessibilityPassed = (result.accessibility || []).every((p) => p.passed);
    const bundlePassed = !!result.bundleSize?.summary?.meetsRequirement;
    const browserPassed = (result.browserCompatibility?.summary?.failed || 0) === 0;

    result.overallPassed = performancePassed && accessibilityPassed && bundlePassed && browserPassed;

    fs.writeFileSync('final-validation-report.json', JSON.stringify(result, null, 2));

    // eslint-disable-next-line no-console
    console.log('\n📊 FINAL RESULTS');
    console.log(`Performance: ${performancePassed ? '✅' : '❌'}`);
    console.log(`Accessibility: ${accessibilityPassed ? '✅' : '❌'}`);
    console.log(`Bundle: ${bundlePassed ? '✅' : '❌'}`);
    console.log(`Browser: ${browserPassed ? '✅' : '❌'}`);
    console.log(`\nOVERALL: ${result.overallPassed ? '✅ PASS' : '❌ FAIL'}`);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Validation error:', e?.message || e);
    result.error = e?.message || String(e);
    fs.writeFileSync('final-validation-report.json', JSON.stringify(result, null, 2));
  }

  return result;
}

if (require.main === module) {
  runAllValidations().then((r) => process.exit(r.overallPassed ? 0 : 1));
}

module.exports = { runAllValidations };


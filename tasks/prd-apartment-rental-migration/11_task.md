---
status: pending
parallelizable: true
blocked_by: ["7.0", "10.0"]
unblocks: ["12.0"]
---

<task_context>
<domain>testing/validation</domain>
<type>testing</type>
<scope>performance</scope>
<complexity>medium</complexity>
<dependencies>external_apis</dependencies>
</task_context>

# Tarefa 11.0: Validação Performance e Acessibilidade

## Visão Geral

Executar validação completa de performance, acessibilidade, compatibilidade de navegadores, e testes de carga para garantir que o sistema atende todos os requisitos não-funcionais especificados no PRD.

<requirements>
- Performance: <3s initial load, <500ms API responses (95th percentile)
- Acessibilidade WCAG 2.1 AA compliance (100%)
- Compatibilidade: Chrome, Firefox, Safari, Edge (últimas 2 versões)
- Testes de carga: 100+ usuários simultâneos
- Lighthouse scores: >90 Performance, >95 Accessibility
- Bundle size: <500KB gzipped
- SEO básico validado
- Responsividade validada em todos breakpoints
</requirements>

## Subtarefas

- [ ] 11.1 Executar testes de performance com Lighthouse
- [ ] 11.2 Validar acessibilidade WCAG 2.1 AA completa
- [ ] 11.3 Testar compatibilidade cross-browser
- [ ] 11.4 Executar testes de carga e stress
- [ ] 11.5 Validar responsividade em todos dispositivos
- [ ] 11.6 Verificar otimização de bundle e assets
- [ ] 11.7 Testar performance de APIs Django
- [ ] 11.8 Gerar relatórios de validação final

## Detalhes de Implementação

### Performance Testing Configuration:

```javascript
// performance/lighthouse-config.js
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
  audits: [
    'first-contentful-paint',
    'largest-contentful-paint',
    'cumulative-layout-shift',
    'total-blocking-time',
    'speed-index',
    'interactive',
    'metrics',
  ]
};

async function runPerformanceTest(url) {
  const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless'] });
  const options = {
    logLevel: 'info',
    output: 'html',
    onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
    port: chrome.port,
    ...performanceConfig
  };

  const runnerResult = await lighthouse(url, options);
  
  // Generate report
  const reportHtml = runnerResult.report;
  fs.writeFileSync('performance-report.html', reportHtml);
  
  // Extract key metrics
  const metrics = {
    performanceScore: runnerResult.lhr.categories.performance.score * 100,
    accessibilityScore: runnerResult.lhr.categories.accessibility.score * 100,
    bestPracticesScore: runnerResult.lhr.categories['best-practices'].score * 100,
    seoScore: runnerResult.lhr.categories.seo.score * 100,
    firstContentfulPaint: runnerResult.lhr.audits['first-contentful-paint'].displayValue,
    largestContentfulPaint: runnerResult.lhr.audits['largest-contentful-paint'].displayValue,
    cumulativeLayoutShift: runnerResult.lhr.audits['cumulative-layout-shift'].displayValue,
    timeToInteractive: runnerResult.lhr.audits.interactive.displayValue,
  };

  await chrome.kill();
  return metrics;
}

// Run tests for all pages
const pages = [
  'http://localhost/',
  'http://localhost/aptos',
  'http://localhost/builders'
];

async function runAllTests() {
  const results = {};
  
  for (const page of pages) {
    console.log(`Testing ${page}...`);
    results[page] = await runPerformanceTest(page);
  }
  
  // Validate requirements
  for (const [page, metrics] of Object.entries(results)) {
    console.log(`\n${page} Results:`);
    console.log(`Performance: ${metrics.performanceScore}% (Required: >90%)`);
    console.log(`Accessibility: ${metrics.accessibilityScore}% (Required: >95%)`);
    console.log(`FCP: ${metrics.firstContentfulPaint} (Required: <1.5s)`);
    console.log(`LCP: ${metrics.largestContentfulPaint} (Required: <2.5s)`);
    console.log(`TTI: ${metrics.timeToInteractive} (Required: <3s)`);
    
    // Check if requirements are met
    const passed = 
      metrics.performanceScore >= 90 &&
      metrics.accessibilityScore >= 95 &&
      parseFloat(metrics.firstContentfulPaint) < 1.5 &&
      parseFloat(metrics.largestContentfulPaint) < 2.5;
    
    console.log(`Status: ${passed ? '✅ PASSED' : '❌ FAILED'}`);
  }
  
  // Save detailed results
  fs.writeFileSync('performance-results.json', JSON.stringify(results, null, 2));
}

module.exports = { runAllTests, runPerformanceTest };
```

### Accessibility Validation Script:

```javascript
// accessibility/a11y-validator.js
const { chromium } = require('playwright');
const AxeBuilder = require('@axe-core/playwright');
const fs = require('fs');

async function validateAccessibility() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  const testResults = [];
  const pages = [
    { url: 'http://localhost/', name: 'Home' },
    { url: 'http://localhost/aptos', name: 'Apartments' },
    { url: 'http://localhost/builders', name: 'Builders' }
  ];
  
  for (const testPage of pages) {
    console.log(`Testing accessibility for ${testPage.name}...`);
    
    await page.goto(testPage.url);
    await page.waitForLoadState('networkidle');
    
    // Run axe accessibility tests
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    
    // Test keyboard navigation
    const keyboardNavResults = await testKeyboardNavigation(page);
    
    // Test screen reader compatibility
    const screenReaderResults = await testScreenReaderCompatibility(page);
    
    // Color contrast validation
    const contrastResults = await testColorContrast(page);
    
    const result = {
      page: testPage.name,
      url: testPage.url,
      violations: accessibilityScanResults.violations,
      keyboardNavigation: keyboardNavResults,
      screenReaderCompatibility: screenReaderResults,
      colorContrast: contrastResults,
      passed: accessibilityScanResults.violations.length === 0
    };
    
    testResults.push(result);
  }
  
  await browser.close();
  
  // Generate accessibility report
  generateAccessibilityReport(testResults);
  
  return testResults;
}

async function testKeyboardNavigation(page) {
  const results = {
    canNavigateWithTab: false,
    focusVisible: false,
    noFocusTraps: false,
    skipLinks: false
  };
  
  try {
    // Test tab navigation
    await page.keyboard.press('Tab');
    const focusedElement = page.locator(':focus');
    results.canNavigateWithTab = await focusedElement.isVisible();
    
    // Test focus visibility
    const focusStyles = await focusedElement.evaluate(el => {
      const styles = getComputedStyle(el);
      return {
        outline: styles.outline,
        outlineColor: styles.outlineColor,
        outlineWidth: styles.outlineWidth
      };
    });
    results.focusVisible = focusStyles.outline !== 'none' || focusStyles.outlineWidth !== '0px';
    
    // Test for focus traps in modals
    const modalTriggers = page.locator('[data-testid*="modal"], button:has-text("Ver Fotos")');
    if (await modalTriggers.count() > 0) {
      await modalTriggers.first().click();
      
      // Test if focus is trapped in modal
      let tabCount = 0;
      const maxTabs = 20;
      let lastFocused = null;
      
      while (tabCount < maxTabs) {
        await page.keyboard.press('Tab');
        const currentFocused = await page.locator(':focus').innerHTML();
        if (currentFocused === lastFocused) {
          results.noFocusTraps = true;
          break;
        }
        lastFocused = currentFocused;
        tabCount++;
      }
      
      // Close modal
      await page.keyboard.press('Escape');
    }
    
  } catch (error) {
    console.error('Keyboard navigation test error:', error);
  }
  
  return results;
}

async function testScreenReaderCompatibility(page) {
  const results = {
    headingStructure: false,
    altTexts: false,
    ariaLabels: false,
    landmarks: false
  };
  
  try {
    // Test heading structure
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
    let hasH1 = false;
    let properHierarchy = true;
    let lastLevel = 0;
    
    for (const heading of headings) {
      const tagName = await heading.evaluate(el => el.tagName.toLowerCase());
      const level = parseInt(tagName.substring(1));
      
      if (level === 1) hasH1 = true;
      if (level > lastLevel + 1) properHierarchy = false;
      lastLevel = level;
    }
    
    results.headingStructure = hasH1 && properHierarchy;
    
    // Test alt texts for images
    const images = await page.locator('img').all();
    let allHaveAlt = true;
    
    for (const img of images) {
      const alt = await img.getAttribute('alt');
      if (!alt || alt.trim() === '') {
        allHaveAlt = false;
        break;
      }
    }
    
    results.altTexts = allHaveAlt;
    
    // Test ARIA labels
    const interactiveElements = await page.locator('button, a, input, select, textarea').all();
    let allHaveLabels = true;
    
    for (const element of interactiveElements) {
      const ariaLabel = await element.getAttribute('aria-label');
      const ariaLabelledBy = await element.getAttribute('aria-labelledby');
      const textContent = await element.textContent();
      
      if (!ariaLabel && !ariaLabelledBy && (!textContent || textContent.trim() === '')) {
        allHaveLabels = false;
        break;
      }
    }
    
    results.ariaLabels = allHaveLabels;
    
    // Test landmarks
    const landmarks = await page.locator('[role="main"], [role="navigation"], [role="banner"], [role="contentinfo"], main, nav, header, footer').count();
    results.landmarks = landmarks > 0;
    
  } catch (error) {
    console.error('Screen reader compatibility test error:', error);
  }
  
  return results;
}

async function testColorContrast(page) {
  // This would require a more sophisticated color contrast checker
  // For now, we'll rely on axe-core's contrast checking
  return { passed: true, message: 'Checked via axe-core' };
}

function generateAccessibilityReport(results) {
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalPages: results.length,
      passedPages: results.filter(r => r.passed).length,
      totalViolations: results.reduce((sum, r) => sum + r.violations.length, 0)
    },
    details: results
  };
  
  fs.writeFileSync('accessibility-report.json', JSON.stringify(report, null, 2));
  
  // Generate HTML report
  const htmlReport = generateAccessibilityHTML(report);
  fs.writeFileSync('accessibility-report.html', htmlReport);
  
  console.log('\n📋 Accessibility Validation Results:');
  console.log(`Pages tested: ${report.summary.totalPages}`);
  console.log(`Pages passed: ${report.summary.passedPages}`);
  console.log(`Total violations: ${report.summary.totalViolations}`);
  console.log(`Overall status: ${report.summary.totalViolations === 0 ? '✅ PASSED' : '❌ FAILED'}`);
}

module.exports = { validateAccessibility };
```

### Load Testing Configuration:

```javascript
// performance/load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

export let errorRate = new Rate('errors');

export let options = {
  stages: [
    { duration: '2m', target: 10 },   // Ramp up to 10 users
    { duration: '5m', target: 50 },   // Stay at 50 users
    { duration: '2m', target: 100 },  // Ramp up to 100 users
    { duration: '5m', target: 100 },  // Stay at 100 users
    { duration: '2m', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'], // 95% of requests under 500ms, 99% under 1s
    http_req_failed: ['rate<0.1'], // Error rate under 10%
    errors: ['rate<0.1'],
  },
};

const BASE_URL = 'http://localhost';

export default function () {
  // Test home page
  let response = http.get(`${BASE_URL}/`);
  check(response, {
    'home page status is 200': (r) => r.status === 200,
    'home page loads in <1s': (r) => r.timings.duration < 1000,
  }) || errorRate.add(1);

  sleep(1);

  // Test apartments API
  response = http.get(`${BASE_URL}/api/v1/aptos/`);
  check(response, {
    'apartments API status is 200': (r) => r.status === 200,
    'apartments API responds in <500ms': (r) => r.timings.duration < 500,
    'apartments API returns data': (r) => {
      try {
        const data = JSON.parse(r.body);
        return data.results && Array.isArray(data.results);
      } catch (e) {
        return false;
      }
    }
  }) || errorRate.add(1);

  sleep(1);

  // Test builders API
  response = http.get(`${BASE_URL}/api/v1/builders/`);
  check(response, {
    'builders API status is 200': (r) => r.status === 200,
    'builders API responds in <500ms': (r) => r.timings.duration < 500,
  }) || errorRate.add(1);

  sleep(1);

  // Test filtered apartments
  response = http.get(`${BASE_URL}/api/v1/aptos/?is_available=true&number_of_bedrooms=2`);
  check(response, {
    'filtered apartments status is 200': (r) => r.status === 200,
    'filtered apartments responds in <500ms': (r) => r.timings.duration < 500,
  }) || errorRate.add(1);

  sleep(2);
}
```

### Cross-Browser Testing:

```javascript
// browser-compatibility/cross-browser-test.js
const { devices } = require('@playwright/test');

const browsers = [
  { name: 'chromium', channel: 'chrome' },
  { name: 'firefox' },
  { name: 'webkit' }, // Safari
  { name: 'chromium', channel: 'msedge' }
];

const testDevices = [
  'Desktop Chrome',
  'Desktop Firefox',
  'Desktop Safari',
  'iPhone 12',
  'iPad Pro',
  'Pixel 5',
];

async function runCrossBrowserTests() {
  const results = [];
  
  for (const browserConfig of browsers) {
    for (const deviceName of testDevices) {
      if (devices[deviceName]) {
        console.log(`Testing ${browserConfig.name} on ${deviceName}...`);
        
        const result = await testBrowserDevice(browserConfig, devices[deviceName]);
        results.push({
          browser: browserConfig.name,
          channel: browserConfig.channel,
          device: deviceName,
          ...result
        });
      }
    }
  }
  
  generateCompatibilityReport(results);
  return results;
}

async function testBrowserDevice(browserConfig, device) {
  const { chromium, firefox, webkit } = require('playwright');
  let browser;
  
  try {
    // Launch appropriate browser
    if (browserConfig.name === 'chromium') {
      browser = await chromium.launch({ 
        channel: browserConfig.channel,
        headless: true 
      });
    } else if (browserConfig.name === 'firefox') {
      browser = await firefox.launch({ headless: true });
    } else if (browserConfig.name === 'webkit') {
      browser = await webkit.launch({ headless: true });
    }
    
    const context = await browser.newContext(device);
    const page = await context.newPage();
    
    const testResult = {
      passed: true,
      errors: [],
      performance: {}
    };
    
    // Test pages
    const pages = [
      'http://localhost/',
      'http://localhost/aptos',
      'http://localhost/builders'
    ];
    
    for (const url of pages) {
      try {
        const startTime = Date.now();
        await page.goto(url, { waitUntil: 'networkidle' });
        const loadTime = Date.now() - startTime;
        
        testResult.performance[url] = loadTime;
        
        // Test basic functionality
        const title = await page.title();
        if (!title) {
          testResult.errors.push(`${url}: No title found`);
          testResult.passed = false;
        }
        
        // Test JavaScript execution
        const jsWorking = await page.evaluate(() => {
          return typeof React !== 'undefined' || document.querySelector('[data-reactroot]') !== null;
        }).catch(() => false);
        
        if (!jsWorking) {
          testResult.errors.push(`${url}: JavaScript/React not working`);
          testResult.passed = false;
        }
        
        // Test responsive design
        await page.setViewportSize({ width: 320, height: 568 }); // iPhone 5 size
        await page.waitForTimeout(1000);
        
        const isMobileResponsive = await page.evaluate(() => {
          const element = document.querySelector('[data-testid="apartments-grid"]');
          if (element) {
            const styles = getComputedStyle(element);
            return styles.gridTemplateColumns.includes('1fr');
          }
          return true; // If element not found, assume responsive
        });
        
        if (!isMobileResponsive) {
          testResult.errors.push(`${url}: Not mobile responsive`);
          testResult.passed = false;
        }
        
      } catch (error) {
        testResult.errors.push(`${url}: ${error.message}`);
        testResult.passed = false;
      }
    }
    
    await browser.close();
    return testResult;
    
  } catch (error) {
    if (browser) await browser.close();
    return {
      passed: false,
      errors: [`Browser launch failed: ${error.message}`],
      performance: {}
    };
  }
}

function generateCompatibilityReport(results) {
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalTests: results.length,
      passed: results.filter(r => r.passed).length,
      failed: results.filter(r => !r.passed).length
    },
    results: results
  };
  
  fs.writeFileSync('browser-compatibility-report.json', JSON.stringify(report, null, 2));
  
  console.log('\n🌐 Browser Compatibility Results:');
  console.log(`Total tests: ${report.summary.totalTests}`);
  console.log(`Passed: ${report.summary.passed}`);
  console.log(`Failed: ${report.summary.failed}`);
  console.log(`Success rate: ${(report.summary.passed / report.summary.totalTests * 100).toFixed(1)}%`);
  
  // Log failures
  const failures = results.filter(r => !r.passed);
  if (failures.length > 0) {
    console.log('\n❌ Failures:');
    failures.forEach(failure => {
      console.log(`${failure.browser} (${failure.device}): ${failure.errors.join(', ')}`);
    });
  }
}

module.exports = { runCrossBrowserTests };
```

### Bundle Size Analysis:

```javascript
// performance/bundle-analysis.js
const fs = require('fs');
const path = require('path');
const gzipSize = require('gzip-size');

async function analyzeBundleSize() {
  const buildDir = path.join(__dirname, '../frontend/build/static');
  const results = {
    js: { files: [], totalSize: 0, totalGzippedSize: 0 },
    css: { files: [], totalSize: 0, totalGzippedSize: 0 },
    summary: {}
  };
  
  // Analyze JS files
  const jsDir = path.join(buildDir, 'js');
  if (fs.existsSync(jsDir)) {
    const jsFiles = fs.readdirSync(jsDir).filter(file => file.endsWith('.js'));
    
    for (const file of jsFiles) {
      const filePath = path.join(jsDir, file);
      const stats = fs.statSync(filePath);
      const content = fs.readFileSync(filePath);
      const gzippedSize = await gzipSize(content);
      
      results.js.files.push({
        name: file,
        size: stats.size,
        gzippedSize: gzippedSize,
        sizeFormatted: formatBytes(stats.size),
        gzippedFormatted: formatBytes(gzippedSize)
      });
      
      results.js.totalSize += stats.size;
      results.js.totalGzippedSize += gzippedSize;
    }
  }
  
  // Analyze CSS files
  const cssDir = path.join(buildDir, 'css');
  if (fs.existsSync(cssDir)) {
    const cssFiles = fs.readdirSync(cssDir).filter(file => file.endsWith('.css'));
    
    for (const file of cssFiles) {
      const filePath = path.join(cssDir, file);
      const stats = fs.statSync(filePath);
      const content = fs.readFileSync(filePath);
      const gzippedSize = await gzipSize(content);
      
      results.css.files.push({
        name: file,
        size: stats.size,
        gzippedSize: gzippedSize,
        sizeFormatted: formatBytes(stats.size),
        gzippedFormatted: formatBytes(gzippedSize)
      });
      
      results.css.totalSize += stats.size;
      results.css.totalGzippedSize += gzippedSize;
    }
  }
  
  // Generate summary
  results.summary = {
    totalSize: results.js.totalSize + results.css.totalSize,
    totalGzippedSize: results.js.totalGzippedSize + results.css.totalGzippedSize,
    totalFormatted: formatBytes(results.js.totalSize + results.css.totalSize),
    totalGzippedFormatted: formatBytes(results.js.totalGzippedSize + results.css.totalGzippedSize),
    meetsRequirement: (results.js.totalGzippedSize + results.css.totalGzippedSize) < (500 * 1024) // 500KB
  };
  
  // Save report
  fs.writeFileSync('bundle-analysis.json', JSON.stringify(results, null, 2));
  
  console.log('\n📦 Bundle Size Analysis:');
  console.log(`Total size: ${results.summary.totalFormatted}`);
  console.log(`Total gzipped: ${results.summary.totalGzippedFormatted}`);
  console.log(`Requirement (<500KB gzipped): ${results.summary.meetsRequirement ? '✅ PASSED' : '❌ FAILED'}`);
  
  return results;
}

function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

module.exports = { analyzeBundleSize };
```

### Main Validation Runner:

```javascript
// validation-runner.js
const { runAllTests: runPerformanceTests } = require('./performance/lighthouse-config');
const { validateAccessibility } = require('./accessibility/a11y-validator');
const { runCrossBrowserTests } = require('./browser-compatibility/cross-browser-test');
const { analyzeBundleSize } = require('./performance/bundle-analysis');
const fs = require('fs');

async function runAllValidations() {
  console.log('🚀 Starting comprehensive validation...\n');
  
  const results = {
    timestamp: new Date().toISOString(),
    performance: null,
    accessibility: null,
    browserCompatibility: null,
    bundleSize: null,
    overallPassed: false
  };
  
  try {
    // Performance Tests
    console.log('🏃‍♀️ Running performance tests...');
    results.performance = await runPerformanceTests();
    
    // Accessibility Tests  
    console.log('\n♿ Running accessibility tests...');
    results.accessibility = await validateAccessibility();
    
    // Bundle Size Analysis
    console.log('\n📦 Analyzing bundle size...');
    results.bundleSize = await analyzeBundleSize();
    
    // Browser Compatibility Tests
    console.log('\n🌐 Running cross-browser tests...');
    results.browserCompatibility = await runCrossBrowserTests();
    
    // Determine overall pass/fail
    const performancePassed = Object.values(results.performance || {}).every(page => 
      page.performanceScore >= 90 && page.accessibilityScore >= 95
    );
    const accessibilityPassed = results.accessibility.every(page => page.passed);
    const bundlePassed = results.bundleSize?.summary?.meetsRequirement;
    const browserPassed = results.browserCompatibility?.summary?.failed === 0;
    
    results.overallPassed = performancePassed && accessibilityPassed && bundlePassed && browserPassed;
    
    // Generate final report
    fs.writeFileSync('final-validation-report.json', JSON.stringify(results, null, 2));
    
    console.log('\n📊 FINAL VALIDATION RESULTS:');
    console.log(`Performance: ${performancePassed ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`Accessibility: ${accessibilityPassed ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`Bundle Size: ${bundlePassed ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`Browser Compatibility: ${browserPassed ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`\n🎯 OVERALL: ${results.overallPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
    
    return results;
    
  } catch (error) {
    console.error('❌ Validation failed:', error);
    results.error = error.message;
    fs.writeFileSync('final-validation-report.json', JSON.stringify(results, null, 2));
    return results;
  }
}

// Run if called directly
if (require.main === module) {
  runAllValidations().then(results => {
    process.exit(results.overallPassed ? 0 : 1);
  });
}

module.exports = { runAllValidations };
```

## Critérios de Sucesso

- Lighthouse Performance Score ≥90% para todas as páginas
- Lighthouse Accessibility Score ≥95% para todas as páginas
- Initial page load <3 segundos (95th percentile)
- API responses <500ms (95th percentile)
- Bundle size total <500KB gzipped
- Zero violações WCAG 2.1 AA
- Compatibilidade 100% em Chrome, Firefox, Safari, Edge (2 últimas versões)
- Responsividade validada em mobile, tablet, desktop
- Load test suportando 100+ usuários simultâneos
- Error rate <1% durante testes de carga
- Keyboard navigation funcionando 100%
- Screen reader compatibility validada
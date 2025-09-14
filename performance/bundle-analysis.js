// performance/bundle-analysis.js
// Analyzes built bundle sizes for Vite output (frontend/dist/assets)
const fs = require('fs');
const path = require('path');
const gzipSize = require('gzip-size');

async function analyzeBundleSize() {
  const viteAssetsDir = path.join(__dirname, '..', 'frontend', 'dist', 'assets');
  const results = {
    js: { files: [], totalSize: 0, totalGzippedSize: 0 },
    css: { files: [], totalSize: 0, totalGzippedSize: 0 },
    summary: {}
  };

  if (!fs.existsSync(viteAssetsDir)) {
    throw new Error(`Build assets not found at ${viteAssetsDir}. Did you run \`npm run build\` in frontend?`);
  }

  const files = fs.readdirSync(viteAssetsDir);
  const jsFiles = files.filter(f => f.endsWith('.js'));
  const cssFiles = files.filter(f => f.endsWith('.css'));

  for (const file of jsFiles) {
    const filePath = path.join(viteAssetsDir, file);
    const stats = fs.statSync(filePath);
    const content = fs.readFileSync(filePath);
    const gz = await gzipSize(content);
    results.js.files.push({ name: file, size: stats.size, gzippedSize: gz, sizeFormatted: formatBytes(stats.size), gzippedFormatted: formatBytes(gz) });
    results.js.totalSize += stats.size;
    results.js.totalGzippedSize += gz;
  }

  for (const file of cssFiles) {
    const filePath = path.join(viteAssetsDir, file);
    const stats = fs.statSync(filePath);
    const content = fs.readFileSync(filePath);
    const gz = await gzipSize(content);
    results.css.files.push({ name: file, size: stats.size, gzippedSize: gz, sizeFormatted: formatBytes(stats.size), gzippedFormatted: formatBytes(gz) });
    results.css.totalSize += stats.size;
    results.css.totalGzippedSize += gz;
  }

  results.summary = {
    totalSize: results.js.totalSize + results.css.totalSize,
    totalGzippedSize: results.js.totalGzippedSize + results.css.totalGzippedSize,
    totalFormatted: formatBytes(results.js.totalSize + results.css.totalSize),
    totalGzippedFormatted: formatBytes(results.js.totalGzippedSize + results.css.totalGzippedSize),
    meetsRequirement: (results.js.totalGzippedSize + results.css.totalGzippedSize) < (500 * 1024)
  };

  fs.writeFileSync('bundle-analysis.json', JSON.stringify(results, null, 2));
  // eslint-disable-next-line no-console
  console.log(`\nBundle size gzipped: ${results.summary.totalGzippedFormatted} (limit 500KB)`);

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


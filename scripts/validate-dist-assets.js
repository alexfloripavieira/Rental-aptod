// Simple validator: ensure all assets referenced in dist/index.html exist in dist/assets
const fs = require('fs');
const path = require('path');

const distDir = path.resolve(__dirname, '..', 'frontend', 'dist');
const indexPath = path.join(distDir, 'index.html');

if (!fs.existsSync(indexPath)) {
  console.error();
  process.exit(1);
}

const html = fs.readFileSync(indexPath, 'utf8');
const regex = /\/static\/assets\/([\w.-]+\.(?:js|css))/g;
let match;
const missing = [];
const seen = new Set();

while ((match = regex.exec(html)) !== null) {
  const file = match[1];
  if (seen.has(file)) continue;
  seen.add(file);
  const localPath = path.join(distDir, 'assets', file);
  if (!fs.existsSync(localPath)) {
    missing.push({ file, localPath });
  }
}

if (missing.length) {
  console.error('Arquivos referenciados no index.html não encontrados em dist/assets:');
  for (const m of missing) {
    console.error();
  }
  process.exit(2);
}

console.log('OK: Todos os assets referenciados existem em dist/assets.');


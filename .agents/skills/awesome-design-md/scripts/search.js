#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const designMdDir = path.join(__dirname, '..', 'design-md');
const query = process.argv.slice(2).join(' ').toLowerCase().trim();

if (!fs.existsSync(designMdDir)) {
  console.error('design-md directory not found at', designMdDir);
  process.exit(1);
}

const entries = fs.readdirSync(designMdDir, { withFileTypes: true })
  .filter(d => d.isDirectory())
  .map(d => d.name);

if (!query) {
  console.log('Available design systems (' + entries.length + ' brands):');
  console.log(entries.join(', '));
  process.exit(0);
}

const matches = [];
for (const brand of entries) {
  const brandPath = path.join(designMdDir, brand);
  const designFile = path.join(brandPath, 'DESIGN.md');
  let snippet = '';
  if (fs.existsSync(designFile)) {
    try {
      const text = fs.readFileSync(designFile, 'utf8');
      if (brand.includes(query) || text.toLowerCase().includes(query)) {
        // extract title or atmosphere
        const lines = text.split('\n');
        const descLine = lines.find(l => l.startsWith('#') || l.toLowerCase().includes('atmosphere') || l.toLowerCase().includes('overview')) || '';
        matches.push({ brand, desc: descLine.replace(/#/g, '').trim(), file: designFile });
      }
    } catch (_) {}
  } else if (brand.includes(query)) {
    matches.push({ brand, desc: '', file: brandPath });
  }
}

if (matches.length === 0) {
  console.log('No design systems matching "' + query + '".');
} else {
  console.log('Found ' + matches.length + ' matching design system(s):');
  for (const m of matches) {
    console.log('- ' + m.brand + (m.desc ? ' (' + m.desc + ')' : ''));
    console.log('  File: ' + m.file);
  }
}

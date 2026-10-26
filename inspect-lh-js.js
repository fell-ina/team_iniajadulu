const fs = require('fs');
const r = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const a = r.audits;
const ids = [
  'first-contentful-paint',
  'largest-contentful-paint',
  'total-blocking-time',
  'cumulative-layout-shift',
  'speed-index',
  'max-potential-fid',
  'total-byte-weight',
  'resource-summary',
  'long-tasks',
  'unused-css-rules',
  'redundant-resources',
  'largest-contentful-paint-breakdown',
  'total-blocking-time-breakdown',
  'main-thread-work',
  'critical-request-chains',
  'font-display-swap',
  'uses-http2',
];
const out = [];
for (const id of ids) {
  const x = a[id];
  if (!x) continue;
  const items = (x.details && x.details.items) ? x.details.items.length : 0;
  out.push([id, x.scoreDisplayMode, x.displayValue, items]);
}
console.log(out.map(r => r.join('\t')).join('\n'));

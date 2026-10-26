const fs = require('fs');
const r = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const a = r.audits;
const ids = [
  'largest-contentful-paint-breakdown',
  'network-requests',
  'long-tasks',
  'total-blocking-time-breakdown',
  'resource-summary-javascript',
  'resource-summary-stylesheet',
  'resource-summary-image',
  'resource-summary-font',
  'resource-summary-document',
  'third-party-summary',
  'critical-request-chains',
  'resource-summary',
  'main-thread-work',
  'uses-http2',
];
for (const id of ids) {
  const x = a[id];
  if (!x) continue;
  const items = x.details && x.details.items;
  console.log('==', id);
  console.log('  scoreMode:', x.scoreDisplayMode, '|', x.displayValue);
  if (items) {
    console.log('  count:', items.length);
    for (let i = 0; i < Math.min(3, items.length); i++) {
      console.log('  item', i + 1, ':', JSON.stringify(items[i]).slice(0, 300));
    }
  }
}

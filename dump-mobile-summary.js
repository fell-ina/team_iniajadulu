const fs = require('fs');
const r = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const a = r.audits;
function dump(id) {
  const x = a[id];
  if (!x) { console.log('NO', id); return; }
  console.log('==', id, '|', x.scoreDisplayMode, '|', x.displayValue);
  const items = x.details && x.details.items;
  if (!items) { console.log('  no items'); return; }
  console.log('  count:', items.length);
  for (const it of items) console.log('  -', JSON.stringify(it));
}
const ids = [
  'resource-summary',
  'resource-summary-javascript',
  'resource-summary-stylesheet',
  'resource-summary-image',
  'resource-summary-font',
  'resource-summary-document',
  'resource-summary-other',
  'total-byte-weight',
  'network-requests',
  'long-tasks',
  'total-blocking-time-breakdown',
  'largest-contentful-paint-breakdown',
  'third-party-summary',
  'main-thread-work',
];
for (const id of ids) dump(id);

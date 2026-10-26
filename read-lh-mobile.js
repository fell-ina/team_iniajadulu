const fs = require('fs');
const LH = 'c:/Users/HP/AppData/Local/Temp/lh-logs';
const r = JSON.parse(fs.readFileSync(LH + '/lh-mobile-1.json', 'utf8'));
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
  'longtasks',
  'long-animation-frame',
  'total-blocking-time-breakdown',
  'largest-contentful-paint-breakdown',
  'main-thread-work',
  'critical-request-chains',
  'unused-css-rules',
  'redundant-resources',
  'font-display-swap',
  'uses-http2',
];
console.log('id\tscoreMode\tdisplayValue\tscore\titemCount');
for (const id of ids) {
  const x = a[id];
  if (!x) continue;
  const items = (x.details && x.details.items) ? x.details.items.length : 0;
  console.log([id, x.scoreDisplayMode, x.displayValue, x.score, items].join('\t'));
}
console.log('\n--- long tasks sample ---');
const lt = a['longtasks'];
if (lt && lt.details && lt.details.items) {
  lt.details.items.forEach(it => console.log(JSON.stringify(it).slice(0, 400)));
}

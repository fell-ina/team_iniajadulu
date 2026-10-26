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
  'longtasks',
  'largest-contentful-paint-breakdown',
  'total-blocking-time-breakdown',
  'main-thread-work',
  'critical-request-chains',
  'redundant-resources',
  'unused-css-rules',
  'font-display-swap',
  'uses-http2',
];
const out = [['id','scoreMode','displayValue','itemCount']];
for (const id of ids) {
  const x = a[id];
  const itemCount = (x && x.details && x.details.items) ? x.details.items.length : 0;
  out.push([id, x && x.scoreDisplayMode, x && x.displayValue, itemCount]);
}
console.log(out.map(r => r.join('\t')).join('\n'));

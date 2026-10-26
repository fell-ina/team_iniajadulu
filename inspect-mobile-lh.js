const fs = require('fs');
const f = process.argv[2];
const r = JSON.parse(fs.readFileSync(f, 'utf8'));
const a = r.audits;
const ids = [
  'resource-principles',
  'resource-summary',
  'total-byte-weight',
  'resource-summary-javascript',
  'resource-summary-document',
  'resource-summary-image',
  'resource-summary-font',
  'resource-summary-other',
  'resource-summary-stylesheet',
  'uses-http2',
  'third-party-summary',
  'network-requests',
  'long-tasks',
  'total-blocking-time-breakdown',
  'critical-request-chains',
  'largest-contentful-paint-breakdown',
  'speed-index',
  'first-contentful-paint',
  'largest-contentful-paint',
  'total-blocking-time',
  'max-potential-fid',
  'cumulative-layout-shift',
  'unsized-media',
  'image-painting',
  'font-display-swap',
  'server-response-time',
  'dom-size',
  'main-thread-work',
];
for (const id of ids) {
  const x = a[id];
  if (!x) continue;
  const sample = (x.details && x.details.items && x.details.items[0]);
  console.log('==', id);
  console.log('  scoreMode:', x.scoreDisplayMode, '|', x.displayValue);
  if (sample) console.log('  sample:', JSON.stringify(sample).slice(0, 400));
}
console.log('== fetchTime', r.fetchTime);
console.log('== finalUrl', r.finalUrl);
console.log('== Lighthouse version', r.lighthouseVersion);

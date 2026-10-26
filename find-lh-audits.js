const fs = require('fs');
const r = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const a = r.audits;
const ids = ['render-blocking-resources','long-tasks','largest-contentful-paint-breakdown','total-blocking-time-breakdown','main-thread-work','critical-request-chains','redundant-resources','unused-css-rules','font-display-swap','uses-http2','early-hints'];
for (const id of ids) {
  const x = a[id];
  if (!x) continue;
  const items = x.details && x.details.items;
  console.log('==', id);
  console.log('  scoreMode:', x.scoreDisplayMode, '|', x.displayValue);
  if (items) console.log('  count:', items.length);
  if (items && items.length) console.log('  item0:', JSON.stringify(items[0]).slice(0, 400));
}

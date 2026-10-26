const fs = require('fs');
const LH = 'c:/Users/HP/AppData/Local/Temp/lh-logs';
const base = JSON.parse(fs.readFileSync(LH + '/lh-mobile-1.json', 'utf8'));
const next = JSON.parse(fs.readFileSync(LH + '/lh-mobile-2.json', 'utf8'));
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
const out = [['id','base_scoreMode','next_scoreMode','base_displayValue','next_displayValue','base_count','next_count']];
for (const id of ids) {
  const ba = base.audits[id];
  const na = next.audits[id];
  const bcount = (ba && ba.details && ba.details.items) ? ba.details.items.length : 0;
  const ncount = (na && na.details && na.details.items) ? na.details.items.length : 0;
  out.push([id, ba && ba.scoreDisplayMode, na && na.scoreDisplayMode, ba && ba.displayValue, na && na.displayValue, bcount, ncount]);
}
out.push(['Lighthouse_performance_score', Math.round(base.categories.performance.score*100), Math.round(next.categories.performance.score*100), '', '', '', '']);
console.log(out.map(r => r.join(',')).join('\n'));

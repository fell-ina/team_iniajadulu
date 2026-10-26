const fs = require('fs');
const keys = [
  'first-contentful-paint',
  'largest-contentful-paint',
  'total-blocking-time',
  'cumulative-layout-shift',
  'speed-index',
  'max-potential-fid',
  'total-byte-weight',
  'largest-contentful-paint-breakdown',
];
const r = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const c = r.categories.performance;
console.log('SCORE', Math.round(c.score * 100));
for (const id of keys) {
  const aud = r.audits[id];
  if (!aud) continue;
  if (aud.displayValue) console.log(' ', id, ':', aud.displayValue);
}
const byConfig = r.configById && r.configById.performance && r.configById.performance.auditRefsByConfigPublicKey;
if (byConfig) {
  for (const a of Object.values(byConfig.performance || {})) {
    const aud = r.audits[a.id];
    if (aud && aud.scoreDisplayMode === 'numeric' && aud.numericValue != null) {
      console.log(' ', a.id, 'raw=', Math.round(aud.numericValue), '|', aud.displayValue);
    }
  }
}
console.log('---');
const rp = r.audits['resource-principles'];
console.log('resource-principles', rp && rp.scoreDisplayMode);
const wp = r.audits['unsized-media'];
console.log('unsized-media', wp && wp.scoreDisplayMode, wp && wp.displayValue);
const ip = r.audits['image-painting'];
console.log('image-painting', ip && ip.scoreDisplayMode, ip && ip.displayValue);
const ls = r.audits['long-tasks'];
console.log('longtasks', ls && ls.scoreDisplayMode, ls && ls.displayValue, (ls && ls.details && ls.details.items) ? ls.details.items.length : 0);
const lb = r.audits['largest-contentful-paint-breakdown'];
console.log('LCP-breakdown', lb && lb.scoreDisplayMode, lb && lb.displayValue, (lb && lb.details && lb.details.items) ? lb.details.items.length : 0);
const tb = r.audits['total-blocking-time-breakdown'];
console.log('TBT-breakdown', tb && tb.scoreDisplayMode, tb && tb.displayValue, (tb && tb.details && tb.details.items) ? tb.details.items.length : 0);
const mt = r.audits['main-thread-work'];
console.log('main-thread-work', mt && mt.scoreDisplayMode, mt && mt.displayValue, (mt && mt.details && mt.details.items) ? mt.details.items.length : 0);
const cr = r.audits['critical-request-chains'];
console.log('critical-request-chains', cr && cr.scoreDisplayMode, cr && cr.displayValue, (cr && cr.details && cr.details.items) ? cr.details.items.length : 0);
const rr = r.audits['redundant-resources'];
console.log('redundant-resources', rr && rr.scoreDisplayMode, rr && rr.displayValue, (rr && rr.details && rr.details.items) ? rr.details.items.length : 0);
const ur = r.audits['unused-css-rules'];
console.log('unused-css-rules', ur && ur.scoreDisplayMode, ur && ur.displayValue, (ur && ur.details && ur.details.items) ? ur.details.items.length : 0);
const fs2 = r.audits['font-display-swap'];
console.log('font-display-swap', fs2 && fs2.scoreDisplayMode, fs2 && fs2.displayValue, (fs2 && fs2.details && fs2.details.items) ? fs2.details.items.length : 0);
const http2 = r.audits['uses-http2'];
console.log('uses-http2', http2 && http2.scoreDisplayMode, http2 && http2.displayValue);

const fs = require('fs');
const LH = 'c:/Users/HP/AppData/Local/Temp/lh-logs';
const arr = process.argv.slice(2);
const ps = [];
for (const f of arr.length ? arr : ['lh-mobile-1.json', 'lh-mobile-2.json']) {
  const r = JSON.parse(fs.readFileSync(LH + '/' + f, 'utf8'));
  const nr = r.audits['network-requests'];
  if (nr && nr.details && nr.details.items) ps.push(r);
}
const nr = a['network-requests'];
if (!nr || !nr.details || !nr.details.items) {
  console.log('no network-requests');
  process.exit(0);
}
console.log('count', nr.details.items.length);
for (const it of nr.details.items) {
  const u = it.url || '';
  const rt = (it.networkRequestTime != null) ? it.networkRequestTime.toFixed(1) : '?';
  const end = (it.networkEndTime != null) ? it.networkEndTime.toFixed(1) : '?';
  const size = (it.transferSize != null) ? it.transferSize : '?';
  const pri = it.priority || '?';
  const rid = it.resourceType || '?';
  const sd = it.statusCode || '?';
  const preload = it.isLinkPreload ? 'preload' : '';
  const aboveFold = it.rendererStartTime != null && it.rendererStartTime < 50 ? 'ABOVEFOLD' : '';
  const afterRender = it.rendererStartTime != null && it.rendererStartTime >= 50 && it.rendererStartTime < 200 ? 'LATE' : '';
  const ct = (it.contentType || '').split(';')[0]?.trim();
  const font = u.includes('woff2') || u.includes('font') || /font|fonts/i.test(ct) ? 'FONT' : '';
  const img = u.includes('/_next/image') || u.startsWith('data:image') ? 'IMG' : '';
  const js = u.includes('.js') ? 'JS' : '';
  const css = u.includes('.css') ? 'CSS' : '';
  const tags = [font, img, js, css, preload, aboveFold].filter(Boolean).join(',');
  console.log([u.slice(0, 90), 'rt=' + rt, 'end=' + end, 'KB=' + (typeof size === 'number' ? Math.round(size/1024) : size), 'pri=' + pri, 'type=' + rid, 'status=' + sd, tags].join(' | '));
}

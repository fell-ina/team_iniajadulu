const fs = require('fs');const LH = 'c:/Users/HP/AppData/Local/Temp/lh-logs';
const r = JSON.parse(fs.readFileSync(LH + '/lh-mobile-1.json', 'utf8'));
const a = r.audits;  const ids = ['longtasks','long-animation-frame','total-blocking-time-breakdown','largest-contentful-paint-breakdown','main-thread-work','critical-request-chains'];
  for (const id of ids) {
    const x = a[id];
    if (!x) continue;
    const items = (x.details && x.details.items) ? x.details.items.length : 0;
    console.log('==', id, '| scoreMode', x.scoreDisplayMode, '| score', x.score, '| items', items);
    if (x.displayValue) console.log('   displayValue:', x.displayValue);
    if (items) {
      for (let i=0;i<Math.min(6,items.length);i++) {
        const it = x.details.items[i];
        const s = JSON.stringify(it);
        if (s.length > 300) console.log('  -', s.slice(0, 300), '...');
        else console.log('  -', s);
      }
    }
  }
  console.log('\n--- network requests sample ---');
  const nr = a['network-requests'];
  const nritems = (nr && nr.details && nr.details.items) ? nr.details.items.length : 0;
  console.log('network-requests items', nritems);
  if (nritems) {
    for (let i=0;i<Math.min(6,nritems);i++) {
      const it = nr.details.items[i];
      console.log('  -', JSON.stringify(it).slice(0, 300));
    }
  }

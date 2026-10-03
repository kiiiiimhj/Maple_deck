const s = require('fs').readFileSync('RootDesk/MyDesk/Card/CardRegistry.mlua', 'utf8');
for (let c = 223; c <= 244; c++) {
  const i = s.indexOf('[' + c + '] = {');
  if (i < 0) { console.log(c, 'missing'); continue; }
  const seg = s.slice(i, i + 400);
  const n = /name = "([^"]+)"/.exec(seg), ic = /icon = "([0-9a-f]+)"/.exec(seg);
  console.log(c, n && n[1], ic && ic[1]);
}

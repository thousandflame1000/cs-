// 用網站同一套流程（抽 $$…$$、$…$ → fracify → KaTeX）排每一個數學式，列出排不出來的和 $ 沒成對的
const fs = require('fs'), path = require('path');
const root = process.argv[2];
const katex = require(path.join(root, 'web/vendor/katex.min.js'));
const core = fs.readFileSync(path.join(root, 'web/js/core.js'), 'utf8');
const fs0 = core.indexOf('function fracify(t) {'), fs1 = core.indexOf('  function render(src', fs0);
const fracify = eval('(' + core.slice(fs0, fs1).trim() + ')');
let s = fs.readFileSync(path.join(root, 'web/js/data.js'), 'utf8');
const D = eval('(' + s.slice(s.indexOf('=') + 1).trim().replace(/;\s*$/, '') + ')');
const bad = [], unb = []; let n = 0;
function check(str, where) {
  let t = str.replace(/```[\s\S]*?```/g, ' ').replace(/`[^`\n]+`/g, ' ');
  t = t.replace(/\$\$([\s\S]+?)\$\$/g, (m, x) => { test(x.trim(), true, where); return ' '; });
  t = t.replace(/\$([^$\n]+?)\$/g, (m, x) => { test(x, false, where); return ' '; });
  t.split('\n').forEach(l => { if (/(^|[^\\])\$/.test(l)) unb.push({ where, line: l.trim().slice(0, 100) }); });
}
function test(x, disp, where) {
  n++;
  try { katex.renderToString(fracify(x), { throwOnError: true, strict: false, displayMode: disp }); }
  catch (e) { bad.push({ where, tex: x.slice(0, 90), err: String(e.message).replace(/^KaTeX parse error: /, '').slice(0, 90) }); }
}
function walk(o, p) {
  if (typeof o === 'string') { if (o.includes('$')) check(o, p); return; }
  if (Array.isArray(o)) o.forEach((x, i) => walk(x, p + '[' + i + ']'));
  else if (o && typeof o === 'object') for (const [k, v] of Object.entries(o)) walk(v, p + '.' + k);
}
walk(D, 'DATA');
// 把位置縮短成「題號／知識點」
const short = w => { const m = w.match(/DATA\.quiz\[(\d+)\]/); if (m) return 'quiz:' + D.quiz[+m[1]].id; const k = w.match(/DATA\.kp\.nodes\.([^.\[]+)/); if (k) return 'kp:' + k[1] + w.slice(w.indexOf(k[1]) + k[1].length).replace(/\.text$/, ''); const l = w.match(/DATA\.lessons\[(\d+)\]\.(\w+)/); if (l) return 'lesson:' + D.lessons[+l[1]].id + '.' + l[2]; return w.slice(0, 60); };
console.log(JSON.stringify({ formulas: n, katexErrors: bad.length, unbalanced: unb.length }));
const g = {}; bad.forEach(b => (g[b.err.replace(/ at position \d+.*/, '').slice(0, 50)] = (g[b.err.replace(/ at position \d+.*/, '').slice(0, 50)] || 0) + 1));
console.log('ERR KINDS', JSON.stringify(g));
bad.slice(0, 40).forEach(b => console.log('E', short(b.where), '|', b.tex, '|', b.err));
unb.slice(0, 25).forEach(b => console.log('U', short(b.where), '|', b.line));
fs.writeFileSync('/tmp/latex_bad.json', JSON.stringify({ bad: bad.map(b => ({ ...b, where: short(b.where) })), unb: unb.map(b => ({ ...b, where: short(b.where) })) }, null, 1));

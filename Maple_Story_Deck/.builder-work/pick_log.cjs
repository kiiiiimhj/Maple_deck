// Maker normal 로그(JSON 한 줄, 수 MB)에서 특정 태그가 붙은 message만 뽑는다.
//   node .builder-work/pick_log.cjs <로그파일> <태그>
// ⚠ 로그를 통째로 읽으면 컨텍스트 한도를 넘는다 — 항상 이걸로 걸러서 본다.
const fs = require("fs");
const [, , file, tag] = process.argv;
const s = fs.readFileSync(file, "utf8");
const seen = new Set();
for (const m of s.matchAll(/"message"\s*:\s*("(?:[^"\\]|\\.)*")/g)) {
  let t;
  try { t = JSON.parse(m[1]); } catch (e) { continue; }
  if (t.includes(tag) && !seen.has(t)) { seen.add(t); console.log(t); }
}
if (!seen.size) console.log("(no match for " + tag + ")");

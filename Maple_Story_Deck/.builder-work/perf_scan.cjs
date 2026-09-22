// 프레임 성능 점검용 정적 스캔 (2026-09-22) — 코드는 수정하지 않는다.
//   node .builder-work/perf_scan.cjs
// 1) 모든 OnUpdate(매 프레임)와 짧은 반복 타이머(SetTimerRepeat < 0.2초)를 찾고
// 2) 그 본문(직접 호출하는 같은 파일 메서드 1단계까지)에서 무거운 패턴을 센다.
const fs = require("fs"), path = require("path");
const ROOT = "RootDesk/MyDesk";
const HEAVY = [
  ["전체 자식 스캔", /GetChildComponentsByTypeName|GetChildrenByName|Children:ToTable\(\)|GetEntitiesByPath|FindEntitiesBy|GetEntities\(/],
  ["엔티티 경로 조회", /GetEntityByPath|FindEntityByName|GetChildByName\([^)]*true\)/],
  ["동기 로드/대기", /AndWait\(/],
  ["로그(문자열 조립)", /\blog(_warning)?\s*\(/],
  ["새 테이블 생성", /=\s*\{\s*[^}]|table\.insert|table\.sort/],
  ["문자열 포맷/연결", /string\.format|\.\.\s*tostring|GetTextFormat|GetText\(/],
  ["스폰/파괴", /SpawnByModelId|SpawnByEntity|:Destroy\(/],
  ["UI 레이아웃/텍스트 갱신", /\.Text\s*=|RectSize\s*=|anchoredPosition\s*=/],
  ["DataStorage", /_DataStorageService|GetUserDataStorage|GetGlobalDataStorage/],
];

function walk(d, out) { for (const f of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, f.name); if (f.isDirectory()) walk(p, out); else if (f.name.endsWith(".mlua")) out.push(p); } return out; }

function methods(lines) {
  // method 블록 경계: 탭 1개 들여쓴 method/handler ~ 같은 들여쓰기의 end
  const res = [];
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^\t(?:method|handler)\s+\S+\s+(\w+)\s*\(|^\thandler\s+(\w+)\s*\(/);
    if (!m) continue;
    const name = m[1] || m[2];
    let ex = "-";
    for (let j = i - 1; j >= Math.max(0, i - 3); j--) { const e = lines[j].match(/@ExecSpace\("(\w+)"\)/); if (e) { ex = e[1]; break; } }
    let end = i + 1; while (end < lines.length && !/^\tend\s*$/.test(lines[end])) end++;
    res.push({ name, ex, start: i, end, body: lines.slice(i + 1, end) });
  }
  return res;
}

const report = [];
for (const file of walk(ROOT, [])) {
  const rel = file.split(path.sep).join("/").replace(ROOT + "/", "");
  const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
  const ms = methods(lines);
  const byName = new Map(ms.map((m) => [m.name, m]));
  const hot = ms.filter((m) => m.name === "OnUpdate");
  // 짧은 반복 타이머: SetTimerRepeat(self.X 또는 function, interval<0.2)
  lines.forEach((l, i) => {
    const t = l.match(/SetTimerRepeat\(\s*(?:self\.(\w+)|function)[^,]*,\s*([0-9./ ]+)\)/);
    if (t) { let iv; try { iv = eval(t[2]); } catch (e) { iv = NaN; } if (iv < 0.2) { const m = byName.get(t[1]); report.push({ file: rel, line: i + 1, kind: `반복타이머 ${iv.toFixed(3)}s`, name: t[1] || "(익명)", ex: m ? m.ex : "?", size: m ? m.body.length : 0, hits: m ? scan(m.body, byName) : {} }); } }
  });
  for (const m of hot) report.push({ file: rel, line: m.start + 1, kind: "OnUpdate", name: "OnUpdate", ex: m.ex, size: m.body.length, hits: scan(m.body, byName) });
}

function scan(body, byName) {
  const hits = {};
  const add = (b) => { for (const l of b) { if (/^\s*--/.test(l)) continue; for (const [k, re] of HEAVY) if (re.test(l)) hits[k] = (hits[k] || 0) + 1; } };
  add(body);
  // 1단계: self:Method( 호출을 따라가 본문도 센다(표시만 "→")
  const called = new Set(); for (const l of body) for (const c of l.matchAll(/self:(\w+)\(/g)) called.add(c[1]);
  for (const n of called) { const m = byName.get(n); if (m && m.name !== "OnUpdate") add(m.body); }
  return hits;
}

report.sort((a, b) => Object.values(b.hits).reduce((x, y) => x + y, 0) - Object.values(a.hits).reduce((x, y) => x + y, 0));
console.log(`매 프레임 코드: OnUpdate ${report.filter((r) => r.kind === "OnUpdate").length}개 / 짧은 반복타이머 ${report.filter((r) => r.kind !== "OnUpdate").length}개\n`);
for (const r of report) {
  const h = Object.entries(r.hits).map(([k, v]) => `${k}×${v}`).join(", ");
  console.log(`${r.ex.padEnd(10)} ${r.kind.padEnd(16)} ${(r.file + ":" + r.line).padEnd(52)} ${String(r.size).padStart(4)}줄  ${h}`);
}

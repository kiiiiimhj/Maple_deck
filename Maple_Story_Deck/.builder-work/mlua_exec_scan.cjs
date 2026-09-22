// .mlua 한국어 문자열 × 감싸는 method의 @ExecSpace 전수 조사 (2026-09-22).
//   node .builder-work/mlua_exec_scan.cjs
//
// 왜: `_LocalizationService`는 **ClientOnly**다(dataset.md). 서버에서 실행되는 코드의
//   문구를 GetText로 그냥 바꾸면 nil이 된다 — 서버는 키만 보내고 클라가 풀어야 한다.
//   그래서 "어느 문구가 서버 쪽인가"를 먼저 세지 않으면 대량 치환을 시작할 수 없다.
//
// 판정: 각 문자열 리터럴을 감싸는 가장 가까운 `method`/`handler` 선언을 찾고,
//   그 바로 위에 붙은 @ExecSpace(...) 주석을 읽는다. 없으면 UNSPEC(호출한 쪽에서 실행).
const fs = require("fs");
const path = require("path");

const KO = /[가-힣]/;

// export_locale_csv.cjs와 **같은** 문자 단위 스캐너 — 정규식으로 주석을 자르면
// "체력 -- 감소" 같은 문자열이 잘려나간다.
function scanLuaStrings(src) {
  const out = [];
  let i = 0, line = 1;
  const n = src.length;
  while (i < n) {
    const c = src[i];
    if (c === "\n") { line++; i++; continue; }
    if (c === "-" && src[i + 1] === "-") {
      if (src[i + 2] === "[" && src[i + 3] === "[") {
        const end = src.indexOf("]]", i + 4);
        const stop = end === -1 ? n : end + 2;
        for (let k = i; k < stop; k++) if (src[k] === "\n") line++;
        i = stop; continue;
      }
      while (i < n && src[i] !== "\n") i++;
      continue;
    }
    if (c === "[" && src[i + 1] === "[") {
      const end = src.indexOf("]]", i + 2);
      const stop = end === -1 ? n : end;
      const text = src.slice(i + 2, stop);
      const startLine = line;
      for (const ch of text) if (ch === "\n") line++;
      out.push({ text, line: startLine });
      i = stop + 2; continue;
    }
    if (c === '"' || c === "'") {
      const quote = c;
      const startLine = line;
      let j = i + 1, buf = "";
      while (j < n) {
        const d = src[j];
        if (d === "\\") { buf += src[j + 1] === "n" ? "\n" : src[j + 1]; j += 2; continue; }
        if (d === quote || d === "\n") break;
        buf += d; j++;
      }
      out.push({ text: buf, line: startLine });
      i = j + 1; continue;
    }
    i++;
  }
  return out;
}

// 줄 번호 → 그 줄을 감싸는 method의 ExecSpace
function buildExecMap(lines) {
  const decls = []; // { line, exec, name }
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^\s*(?:@ExecSpace\("(\w+)"\)\s*)?(?:method|handler)\s+[\w<>,\s]*?(\w+)\s*\(/);
    if (!m) continue;
    let exec = m[1] || null;
    if (!exec) {
      // @ExecSpace가 윗줄(들)에 따로 있는 형태
      for (let k = i - 1; k >= 0 && k >= i - 4; k--) {
        const t = lines[k].trim();
        if (t === "") continue;
        const e = t.match(/^@ExecSpace\("(\w+)"\)$/);
        if (e) { exec = e[1]; break; }
        if (!t.startsWith("@")) break;
      }
    }
    decls.push({ line: i + 1, exec: exec || "UNSPEC", name: m[2] });
  }
  return (lineNo) => {
    let hit = null;
    for (const d of decls) { if (d.line <= lineNo) hit = d; else break; }
    return hit || { exec: "TOPLEVEL", name: "(file scope)" };
  };
}

const SERVER = new Set(["ServerOnly", "Server", "Multicast"]);
const CLIENT = new Set(["ClientOnly", "Client"]);

const stat = { client: 0, server: 0, unspec: 0, toplevel: 0 };
const serverHits = [];
const byFile = new Map();

function walk(dir) {
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, f.name);
    if (f.isDirectory()) { walk(p); continue; }
    if (!f.name.endsWith(".mlua")) continue;
    const src = fs.readFileSync(p, "utf8");
    const lines = src.split(/\r?\n/);
    const execAt = buildExecMap(lines);
    const rel = p.split(path.sep).join("/");

    for (const s of scanLuaStrings(src)) {
      if (!KO.test(s.text)) continue;
      // 개발용 로그 문구는 번역 대상이 아니다
      if (/\blog(_warning|_error)?\s*\(/.test(lines[s.line - 1] || "")) continue;

      const d = execAt(s.line);
      let bucket;
      if (SERVER.has(d.exec)) bucket = "server";
      else if (CLIENT.has(d.exec)) bucket = "client";
      else if (d.exec === "TOPLEVEL") bucket = "toplevel";
      else bucket = "unspec";
      stat[bucket]++;

      if (!byFile.has(rel)) byFile.set(rel, { client: 0, server: 0, unspec: 0, toplevel: 0 });
      byFile.get(rel)[bucket]++;

      if (bucket === "server" && serverHits.length < 400) {
        serverHits.push({ file: rel, line: s.line, exec: d.exec, method: d.name, text: s.text });
      }
    }
  }
}
walk("RootDesk/MyDesk");

console.log(`=== .mlua 한국어 문구 (개발로그 제외) — 실행 위치별 ===
ClientOnly / Client : ${stat.client}   ✅ GetText 직접 치환 가능
ServerOnly / Server / Multicast : ${stat.server}   ⚠ 서버 — 키만 보내고 클라가 풀어야 함
ExecSpace 미지정 (호출한 쪽) : ${stat.unspec}   ⚠ 호출 경로 확인 필요
파일 최상단/property 기본값 : ${stat.toplevel}   ⚠ 개별 판단`);

console.log("\n-- 파일별 (문구 많은 순 25) --");
const rows = [...byFile].map(([f, c]) => [f, c, c.client + c.server + c.unspec + c.toplevel]);
rows.sort((a, b) => b[2] - a[2]);
for (const [f, c, tot] of rows.slice(0, 25)) {
  console.log(`  ${String(tot).padStart(4)}  (C${c.client}/S${c.server}/U${c.unspec}/T${c.toplevel})  ${f}`);
}

fs.writeFileSync(".builder-work/mlua_exec_scan.json",
  JSON.stringify({ stat, serverHits, byFile: Object.fromEntries(byFile) }, null, 1), "utf8");
console.log("\n→ .builder-work/mlua_exec_scan.json 저장");

console.log("\n-- 서버 쪽 문구 샘플 20 --");
for (const h of serverHits.slice(0, 20)) {
  console.log(`  [${h.exec}] ${h.file}:${h.line} ${h.method}()  ${JSON.stringify(h.text).slice(0, 60)}`);
}

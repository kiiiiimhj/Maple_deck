// .mlua 한국어 문자열의 "역할" 분류 (2026-09-22).
//   node .builder-work/mlua_role_scan.cjs
//
// 왜: ②단계는 기계적 치환이 아니다. .mlua의 한국어 문자열에는 두 종류가 섞여 있다.
//   (A) 화면에 뿌리는 표시 문구      → GetText(key)로 바꿔야 한다
//   (B) 코드가 비교/조회에 쓰는 식별자 → **절대 바꾸면 안 된다** (게임이 깨진다)
//       예: CardManager의 `if cardName == "매직 부스터"` / `SOUNDS["아이스 커터"]`
//
// 실측 근거: mlua_exec_scan에서 ServerOnly/Multicast로 잡힌 CardManager 문구 대부분이
//   PlayXXXSound() 안의 스킬명 비교였다 — 표시 문구가 아니다.
//
// 분류는 문자열이 **그 줄에서 어떻게 쓰였는지**로 한다(보수적: 애매하면 AMBIGUOUS).
const fs = require("fs");
const path = require("path");

const KO = /[가-힣]/;

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
      out.push({ text, line: startLine, col: 0 });
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
      out.push({ text: buf, line: startLine, col: i });
      i = j + 1; continue;
    }
    i++;
  }
  return out;
}

// 줄 내용으로 역할 추정. 보수적으로: 식별자 신호가 하나라도 있으면 IDENT.
function classify(lineText, text) {
  // ⚠ 자른 뒤에 이스케이프할 것. 먼저 이스케이프하고 자르면 `\` 뒤가 잘려서
  //   "Invalid regular expression ... \ at end of pattern"으로 터진다(실측).
  const esc = text.slice(0, 40).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const q = `["']${esc}`;

  // (B) 식별자 신호 — 비교 / 테이블 키 / 조회 인자
  if (new RegExp(`[=~]=\\s*${q}`).test(lineText)) return "IDENT";      // == "매직 부스터"
  if (new RegExp(`${q}["']\\s*[=~]=`).test(lineText)) return "IDENT";   // "매직 부스터" ==
  if (new RegExp(`\\[\\s*${q}["']\\s*\\]`).test(lineText)) return "IDENT"; // t["매직 부스터"]
  if (new RegExp(`\\[\\s*${q}["']\\s*\\]\\s*=`).test(lineText)) return "IDENT";
  if (/\b(GetCard|FindCard|GetSkill|FindSkill|ByName|GetByName|SoundFor|EffectFor)\w*\s*\(/.test(lineText)) return "IDENT";

  // (A) 표시 신호 — Text 대입 / 표시 함수 인자
  if (/\.\s*Text\s*=/.test(lineText)) return "DISPLAY";
  if (/:\s*(SetText|ShowToast|Toast|ShowPopup|Popup|ShowMessage|SetMessage|SetTitle|SetDesc\w*)\s*\(/.test(lineText)) return "DISPLAY";
  if (/\b(toast|message|title|desc|label|notice|banner)\w*\s*=/i.test(lineText)) return "DISPLAY";

  return "AMBIGUOUS";
}

const stat = { DISPLAY: 0, IDENT: 0, AMBIGUOUS: 0 };
const byFile = new Map();
const samples = { DISPLAY: [], IDENT: [], AMBIGUOUS: [] };

function walk(dir) {
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, f.name);
    if (f.isDirectory()) { walk(p); continue; }
    if (!f.name.endsWith(".mlua")) continue;
    const src = fs.readFileSync(p, "utf8");
    const lines = src.split(/\r?\n/);
    const rel = p.split(path.sep).join("/");

    for (const s of scanLuaStrings(src)) {
      if (!KO.test(s.text)) continue;
      const lt = lines[s.line - 1] || "";
      if (/\blog(_warning|_error)?\s*\(/.test(lt)) continue;   // 개발 로그 제외

      const role = classify(lt, s.text);
      stat[role]++;
      if (!byFile.has(rel)) byFile.set(rel, { DISPLAY: 0, IDENT: 0, AMBIGUOUS: 0 });
      byFile.get(rel)[role]++;
      if (samples[role].length < 25) {
        samples[role].push(`${rel}:${s.line}  ${lt.trim().slice(0, 110)}`);
      }
    }
  }
}
walk("RootDesk/MyDesk");

console.log(`=== .mlua 한국어 문자열의 역할 (개발로그 제외) ===
DISPLAY   (화면 표시 — 번역 대상)      : ${stat.DISPLAY}
IDENT     (코드 식별자 — 손대면 안 됨) : ${stat.IDENT}
AMBIGUOUS (한 줄만 봐선 판정 불가)     : ${stat.AMBIGUOUS}`);

console.log("\n-- 파일별 (총량 순 20) --");
const rows = [...byFile].map(([f, c]) => [f, c, c.DISPLAY + c.IDENT + c.AMBIGUOUS]);
rows.sort((a, b) => b[2] - a[2]);
for (const [f, c, tot] of rows.slice(0, 20)) {
  console.log(`  ${String(tot).padStart(4)}  표시${String(c.DISPLAY).padStart(4)} / 식별${String(c.IDENT).padStart(4)} / 모름${String(c.AMBIGUOUS).padStart(4)}   ${f}`);
}

fs.writeFileSync(".builder-work/mlua_role_scan.json",
  JSON.stringify({ stat, byFile: Object.fromEntries(byFile) }, null, 1), "utf8");

for (const k of ["DISPLAY", "IDENT", "AMBIGUOUS"]) {
  console.log(`\n-- ${k} 샘플 --`);
  for (const s of samples[k].slice(0, 12)) console.log("  " + s);
}

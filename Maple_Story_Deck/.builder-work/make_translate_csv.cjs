// 번역용 CSV 생성 + 되돌려 넣기. 2026-09-22.
//   node .builder-work/make_translate_csv.cjs export   → Docs/Localization/translate_me.csv 생성
//   node .builder-work/make_translate_csv.cjs import   → 그 파일의 번역을 GameText.csv로 병합
//
// 왜 따로 만드나:
//   1) GameText.csv에는 **아무도 안 쓰는 행**이 섞여 있다(개발 로그, 옛 문구, 연결형 부스러기).
//      번역해봐야 화면에 안 나오므로 빼고 준다.
//   2) GameText.csv는 BOM이 없어서 엑셀로 열면 한글이 깨진다. 번역용 사본은 **BOM을 붙인다**.
//   3) 원본은 엔진이 읽는 파일이라 사람이 직접 만지다 깨지면 위험하다 — 사본에서 작업하고 병합한다.
const fs = require("fs");
const path = require("path");
const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");

const MODE = process.argv[2] || "export";
const SRC = "RootDesk/MyDesk/Localization/GameText.csv";
const OUT_DIR = "Docs/Localization";
const OUT = path.join(OUT_DIR, "translate_me.csv");

function parseCsv(s) {
  const r = []; let row = [], c = "", q = false;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (q) { if (ch === '"') { if (s[i + 1] === '"') { c += '"'; i++; } else q = false; } else c += ch; }
    else if (ch === '"') q = true;
    else if (ch === ",") { row.push(c); c = ""; }
    else if (ch === "\r") { /* skip */ }
    else if (ch === "\n") { row.push(c); r.push(row); row = []; c = ""; }
    else c += ch;
  }
  if (c !== "" || row.length) { row.push(c); r.push(row); }
  return r;
}
function cell(v) {
  const s = String(v == null ? "" : v);
  return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

const rows = parseCsv(fs.readFileSync(SRC, "utf8").replace(/^﻿/, ""));
const head = rows.shift();
const iK = head.indexOf("Key"), iS = head.indexOf("Source"), iN = head.indexOf("Note");
const LANGS = head.slice(3);   // ko, en, zh-TW, ja ...

// ── 실제로 쓰이는 키 수집 ─────────────────────────────────────────────────
function collectUsed() {
  const used = new Set();
  (function walk(d) {
    for (const f of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, f.name);
      if (f.isDirectory()) { walk(p); continue; }
      if (!f.name.endsWith(".mlua")) continue;
      const src = fs.readFileSync(p, "utf8");
      for (const m of src.matchAll(/"(MLUA_[A-Z0-9_]+|UI_[A-Z0-9_]+|FMT_[A-Z0-9_]+)["|]/g)) used.add(m[1]);
    }
  })("RootDesk/MyDesk");
  for (const f of fs.readdirSync("ui").filter((x) => x.endsWith(".ui"))) {
    let b; try { b = UIBuilder.load("ui/" + f); } catch (e) { continue; }
    for (const e of b.listEntities()) {
      for (const t of ["MOD.Core.TextGUIRendererComponent", "MOD.Core.TextComponent"]) {
        const c = b.getComponent(e.path, t);
        if (c && typeof c.Text === "string" && /^(MLUA_|UI_|FMT_)/.test(c.Text)) used.add(c.Text);
      }
    }
  }
  return used;
}

if (MODE === "export") {
  const used = collectUsed();
  const keep = rows.filter((r) => r[iK] && used.has(r[iK]));
  // 보기 좋게: 화면 영역(키 접두어) → 키 순으로 정렬
  keep.sort((a, b) => (a[iK] < b[iK] ? -1 : a[iK] > b[iK] ? 1 : 0));

  const outHead = ["Key", "한국어원문", "위치(Note)"].concat(LANGS.filter((l) => l !== "ko"));
  const lines = [outHead.map(cell).join(",")];
  for (const r of keep) {
    const langs = LANGS.filter((l) => l !== "ko").map((l) => r[head.indexOf(l)] || "");
    lines.push([r[iK], r[iS], r[iN]].concat(langs).map(cell).join(","));
  }
  fs.mkdirSync(OUT_DIR, { recursive: true });
  // ⚠ BOM을 붙여야 엑셀에서 한글이 안 깨진다
  fs.writeFileSync(OUT, "﻿" + lines.join("\r\n") + "\r\n", "utf8");
  console.log(`번역용 CSV 생성: ${OUT}`);
  console.log(`  전체 ${rows.length}행 중 **실제 쓰이는 ${keep.length}행**만 담음 (${rows.length - keep.length}행 제외)`);
  console.log(`  컬럼: ${outHead.join(" / ")}`);
  const filled = keep.filter((r) => r[head.indexOf("en")]).length;
  console.log(`  이미 en이 채워진 행: ${filled}`);
} else if (MODE === "import") {
  if (!fs.existsSync(OUT)) { console.error("번역 파일이 없다: " + OUT); process.exit(1); }
  const tr = parseCsv(fs.readFileSync(OUT, "utf8").replace(/^﻿/, ""));
  const th = tr.shift();
  const tKey = th.indexOf("Key");
  const byKey = new Map(tr.filter((r) => r[tKey]).map((r) => [r[tKey], r]));
  let n = 0;
  for (const r of rows) {
    const t = byKey.get(r[iK]);
    if (!t) continue;
    for (const lang of LANGS) {
      if (lang === "ko") continue;
      const ti = th.indexOf(lang);
      if (ti < 0) continue;
      const v = t[ti];
      if (v && v !== "" && v !== r[head.indexOf(lang)]) { r[head.indexOf(lang)] = v; n++; }
    }
  }
  fs.writeFileSync(SRC, [head].concat(rows).map((r) => r.map(cell).join(",")).join("\r\n") + "\r\n", "utf8");
  console.log(`번역 ${n}칸을 ${SRC} 로 병합했다. (refresh 필요)`);
} else {
  console.error("export 또는 import 를 지정할 것");
  process.exit(1);
}

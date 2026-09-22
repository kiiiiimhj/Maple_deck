// 게임 안 한국어 문구 전수 추출 → LocaleDataSet Import용 CSV (유저 요청 2026-09-22).
//   node .builder-work/export_locale_csv.cjs
//
// 출력: Docs/Localization/locale_strings.csv (UTF-8 BOM — 엑셀에서 바로 열림)
//
// 컬럼은 MSW LocaleDataSet 규격을 따른다(mlua_document_retriever "LocaleDataSet Editor" 문서):
//   Key, Source, Note 3개가 고정 선두 컬럼이고 그 뒤에 언어 코드 컬럼이 온다.
//   Import 시 헤더가 Key,Source,Note 순서가 아니면 거부된다. 그래서 유저 스샷의
//   "Key / ko-KR / zh-TW / en-US" 형태를 그대로 쓸 수 없다(언어 코드도 2자리: ko, en).
//
// 추출 대상:
//   1) .mlua 문자열 리터럴 중 한글 포함분 — 주석은 제외한다(번역 대상이 아님).
//      주석/문자열 구분은 줄 단위 정규식이 아니라 문자 단위 스캐너로 한다. `--`가 문자열
//      안에 들어있는 경우("체력 -- 감소")를 정규식으로 자르면 문구가 잘려나간다.
//   2) .ui 텍스트 컴포넌트 — UIBuilder로만 읽는다(.ui 직접 파싱 금지).
//
// log()/log_warning()/log_error() 안의 문구는 **개발용 로그**라 번역 대상이 아니다.
// 지우지 않고 Note에 [LOG] 표시만 해서 넘긴다 — 엑셀에서 걸러내는 건 유저 몫.
const fs = require("fs");
const path = require("path");
const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");

const KO = /[가-힣]/;
const OUT_DIR = "Docs/Localization";
const OUT_CSV = path.join(OUT_DIR, "locale_strings.csv");

// 언어 컬럼. ko/en은 문서로 확인된 지원 코드, 나머지는 유저 요청분 + 여유(빈 칸).
const LOCALES = ["ko", "en", "zh-TW", "ja"];

// ── .mlua 문자열 리터럴 스캐너 ────────────────────────────────────────────
// Lua 주석(--, --[[ ]])과 문자열("", '', [[ ]])을 구분하며 훑는다.
function scanLuaStrings(src) {
  const out = [];
  let i = 0, line = 1;
  const n = src.length;
  while (i < n) {
    const c = src[i];
    if (c === "\n") { line++; i++; continue; }

    // 긴 주석 --[[ ... ]] / 한 줄 주석 --
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

    // 긴 문자열 [[ ... ]]
    if (c === "[" && src[i + 1] === "[") {
      const end = src.indexOf("]]", i + 2);
      const stop = end === -1 ? n : end;
      const text = src.slice(i + 2, stop);
      const startLine = line;
      for (const ch of text) if (ch === "\n") line++;
      out.push({ text, line: startLine });
      i = stop + 2; continue;
    }

    // 따옴표 문자열
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

function lineOf(src, lineNo) {
  return src.split(/\r?\n/)[lineNo - 1] || "";
}

// ── 수집 ──────────────────────────────────────────────────────────────────
// text -> { key, sources: [..], isLog }
const entries = new Map();
const perFileCounter = new Map();

function makeKey(prefix, fileBase) {
  const slug = fileBase.replace(/\.[^.]+$/, "").replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  const id = `${prefix}_${slug}`;
  const n = (perFileCounter.get(id) || 0) + 1;
  perFileCounter.set(id, n);
  return `${id}_${String(n).padStart(3, "0")}`;
}

function add(text, prefix, fileBase, where, isLog) {
  const t = text.trim();
  if (!t || !KO.test(t)) return;
  const hit = entries.get(t);
  if (hit) {
    if (hit.sources.length < 5) hit.sources.push(where);
    hit.isLog = hit.isLog && isLog; // 한 군데라도 로그가 아니면 번역 대상
    return;
  }
  entries.set(t, { key: makeKey(prefix, fileBase), sources: [where], isLog });
}

// 1) .mlua
let mluaFiles = 0;
function walk(dir) {
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, f.name);
    if (f.isDirectory()) { walk(p); continue; }
    if (!f.name.endsWith(".mlua")) continue;
    const src = fs.readFileSync(p, "utf8");
    const rel = p.split(path.sep).join("/");
    let used = false;
    for (const s of scanLuaStrings(src)) {
      if (!KO.test(s.text)) continue;
      const isLog = /\blog(_warning|_error)?\s*\(/.test(lineOf(src, s.line));
      add(s.text, "MLUA", f.name, `${rel}:${s.line}`, isLog);
      used = true;
    }
    if (used) mluaFiles++;
  }
}
walk("RootDesk/MyDesk");

// 2) .ui
let uiFiles = 0;
for (const f of fs.readdirSync("ui").filter((x) => x.endsWith(".ui")).sort()) {
  let b;
  try { b = UIBuilder.load("ui/" + f); } catch (e) { continue; }
  let used = false;
  for (const e of b.listEntities()) {
    for (const type of ["MOD.Core.TextGUIRendererComponent", "MOD.Core.TextComponent"]) {
      const c = b.getComponent(e.path, type);
      if (c && typeof c.Text === "string" && KO.test(c.Text)) {
        add(c.Text, "UI", f, e.path, false);
        used = true;
      }
    }
  }
  if (used) uiFiles++;
}

// ── CSV 쓰기 ──────────────────────────────────────────────────────────────
function cell(v) {
  const s = String(v == null ? "" : v);
  return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

const rows = [["Key", "Source", "Note", ...LOCALES].map(cell).join(",")];
let logCount = 0;
for (const [text, info] of entries) {
  if (info.isLog) logCount++;
  const note = (info.isLog ? "[LOG] " : "") + info.sources.join(" | ");
  // Source = 원본 언어(WorldConfig.SourceLanguage = "ko")이므로 한국어 원문을 그대로 넣는다.
  // ko 컬럼도 같은 값 — 나머지 언어는 번역가가 채울 빈 칸.
  const langs = LOCALES.map((l) => (l === "ko" ? text : ""));
  rows.push([info.key, text, note, ...langs].map(cell).join(","));
}

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(OUT_CSV, "﻿" + rows.join("\r\n") + "\r\n", "utf8");

console.log(`.mlua 파일 ${mluaFiles}개 / .ui 파일 ${uiFiles}개에서 수집`);
console.log(`고유 문구 ${entries.size}개 (그중 개발용 로그 [LOG] ${logCount}개, 번역 대상 ${entries.size - logCount}개)`);
console.log(`→ ${OUT_CSV}`);

// ── 참고: 이번 추출에 안 들어간 곳 census(개수만) ─────────────────────────
function census(dir, ext) {
  let files = 0, hits = 0;
  if (!fs.existsSync(dir)) return { files, hits };
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, f.name);
    if (f.isDirectory()) { const r = census(p, ext); files += r.files; hits += r.hits; continue; }
    if (!f.name.endsWith(ext)) continue;
    const m = fs.readFileSync(p, "utf8").match(/[가-힣]+/g);
    if (m) { files++; hits += m.length; }
  }
  return { files, hits };
}
for (const [dir, ext] of [["RootDesk/MyDesk", ".model"], ["map", ".map"], ["RootDesk/MyDesk", ".csv"]]) {
  const r = census(dir, ext);
  console.log(`[미포함 census] ${dir}/**/*${ext} → 파일 ${r.files}개 / 한글 토막 ${r.hits}개`);
}

// 번역문 UI 넘침 점검 (2026-09-22) — 파일 수정 없음. 결과: Docs/Localization/overflow_report.csv
//   node .builder-work/overflow_check.cjs
// 방법: 텍스트 칸(RectSize)·글자크기·BestFit/SizeFit를 읽고, 칸 폭 안에서 줄바꿈을 흉내 내 필요한 줄 수/높이를 계산한다.
//   A) .ui에 번역 키가 직접 박힌 텍스트
//   B) .mlua에서 `self.<텍스트속성>.Text = ...("키")` 로 넣는 텍스트(속성 기본값 UUID → .ui 엔티티로 추적)
//   C) 토스트(_UIToast:ShowMessage("키"...)) → 토스트 텍스트 칸
// ⚠ 글자 폭은 추정치(폰트 메트릭 없음) — "넘칠 가능성" 순위로 볼 것.
const fs = require("fs"), path = require("path");
const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");

function parseCsv(s) { const r = []; let row = [], c = "", q = false; for (let i = 0; i < s.length; i++) { const ch = s[i]; if (q) { if (ch === '"') { if (s[i + 1] === '"') { c += '"'; i++; } else q = false; } else c += ch; } else if (ch === '"') q = true; else if (ch === ",") { row.push(c); c = ""; } else if (ch === "\r") { } else if (ch === "\n") { row.push(c); r.push(row); row = []; c = ""; } else c += ch; } if (c !== "" || row.length) { row.push(c); r.push(row); } return r; }
const g = parseCsv(fs.readFileSync("RootDesk/MyDesk/Localization/GameText.csv", "utf8").replace(/^﻿/, ""));
const gh = g.shift();
const T = new Map(g.map((r) => [r[0], { ko: r[gh.indexOf("ko")], en: r[gh.indexOf("en")], zh: r[gh.indexOf("zh-tw")], ja: r[gh.indexOf("ja")] }]));

// ── 글자 폭 추정(글자크기 1 기준) ─────────────────────────────
function cw(ch) {
  if (/[가-힣ㄱ-ㅎㅏ-ㅣ]/.test(ch)) return 0.92;
  if (/[぀-ヿ一-鿿＀-￯　-〿]/.test(ch)) return 1.0;
  if (ch === " ") return 0.28;
  if (/[il.,:;'!|]/.test(ch)) return 0.28;
  if (/[fjrt()\[\]]/.test(ch)) return 0.36;
  if (/[mwMW]/.test(ch)) return 0.82;
  if (/[A-Z]/.test(ch)) return 0.64;
  if (/[0-9]/.test(ch)) return 0.56;
  if (/[a-z]/.test(ch)) return 0.52;
  return 0.6;
}
const strip = (s) => s.replace(/<[^>]+>/g, "");
function tokens(line) { // 줄바꿈 가능한 단위: 공백 단위, 단 한자/가나는 글자 단위로 끊을 수 있다
  const out = []; let cur = "";
  for (const ch of line) {
    if (ch === " ") { if (cur) out.push(cur); out.push(" "); cur = ""; }
    else if (/[぀-ヿ一-鿿]/.test(ch)) { if (cur) out.push(cur); out.push(ch); cur = ""; }
    else cur += ch;
  }
  if (cur) out.push(cur);
  return out;
}
const wOf = (s, size) => [...s].reduce((a, c) => a + cw(c), 0) * size;
function layout(text, size, W) { // → {lines, maxWordW, widest}
  let lines = 0, maxWord = 0, widest = 0;
  for (const raw of strip(text).split("\n")) {
    let lw = 0; lines++;
    for (const tk of tokens(raw)) {
      const tw = wOf(tk, size);
      if (tk !== " ") maxWord = Math.max(maxWord, tw);
      if (lw + tw > W + 0.5 && lw > 0 && tk !== " ") { lines++; widest = Math.max(widest, lw); lw = tw; }
      else lw += tw;
    }
    widest = Math.max(widest, lw);
  }
  return { lines, maxWord, widest };
}
const LH = 1.25;
function fits(text, size, W, H) { const l = layout(text, size, W); return { ok: l.lines * size * LH <= H + 2 && l.maxWord <= W + 2, h: l.lines * size * LH, l }; }
function evalText(text, c, baseH) {
  // 기준 높이 = max(칸 높이, 한국어가 실제로 차지하는 높이) — 한국어로 지금 멀쩡히 보이는 높이까지는 허용
  const W = c.W, H = Math.max(c.H, baseH || 0);
  if (c.bestFit) {
    for (let s = c.max; s >= c.min; s--) if (fits(text, s, W, H).ok) return { ok: true, size: s };
    const f = fits(text, c.min, W, H); return { ok: false, size: c.min, ratio: Math.max(f.h / H, f.l.maxWord / W) };
  }
  const f = fits(text, c.size, W, H);
  return { ok: f.ok, size: c.size, ratio: Math.max(f.h / H, f.l.maxWord / W) };
}
const fill = (s) => (s || "").replace(/\{\d+\}/g, "000").replace(/%0?\d*[sd]/g, "000").replace(/\{[A-Z]\}/g, "00");

// ── 텍스트 칸 수집 ─────────────────────────────
const boxes = []; const byId = new Map();
for (const f of fs.readdirSync("ui").filter((x) => x.endsWith(".ui"))) {
  const b = UIBuilder.load("ui/" + f);
  for (const e of b.listEntities()) {
    for (const t of ["MOD.Core.TextGUIRendererComponent", "MOD.Core.TextComponent"]) {
      const c = b.getComponent(e.path, t); if (!c) continue;
      const tr = b.getComponent(e.path, "MOD.Core.UITransformComponent"); if (!tr || !tr.RectSize) continue;
      const pad = c.Padding || { left: 0, right: 0, top: 0, bottom: 0 };
      const box = { file: f, path: e.path, id: b.getId(e.path), text: c.Text || "", size: c.FontSize || 24, bestFit: !!c.BestFit, min: c.MinSize || 10, max: c.MaxSize || c.FontSize || 24,
        sizeFit: !!c.SizeFit, W: tr.RectSize.x - (pad.left || 0) - (pad.right || 0), H: tr.RectSize.y - (pad.top || 0) - (pad.bottom || 0) };
      boxes.push(box); byId.set(box.id, box);
    }
  }
}

// ── A) .ui에 박힌 키 ─────────────────────────────
const checks = [];
for (const bx of boxes) if (T.has(bx.text)) checks.push({ src: "ui", key: bx.text, box: bx });

// ── B) .mlua에서 텍스트 속성에 키를 넣는 곳 ─────────────────────────────
function walk(d, o) { for (const f of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, f.name); if (f.isDirectory()) walk(p, o); else if (f.name.endsWith(".mlua")) o.push(p); } return o; }
const toastBox = [...boxes].find((b) => b.path === "/ui/ToastGroup/Toast_message" || /ToastGroup\/Toast_message$/.test(b.path));
for (const file of walk("RootDesk/MyDesk", [])) {
  const src = fs.readFileSync(file, "utf8");
  const props = new Map();
  for (const m of src.matchAll(/property\s+(?:TextComponent|TextGUIRendererComponent)\s+(\w+)\s*=\s*"([0-9a-f-]{36})"/g)) props.set(m[1], m[2]);
  for (const line of src.split(/\r?\n/)) {
    if (/^\s*--/.test(line)) continue;
    const m = line.match(/self\.(\w+)\.Text\s*=\s*(.*)$/);
    if (m && props.has(m[1])) {
      const bx = byId.get(props.get(m[1])); if (!bx) continue;
      for (const k of m[2].matchAll(/"((?:MLUA|FMT|UI)_[A-Z0-9_]+)"/g)) if (T.has(k[1])) checks.push({ src: path.basename(file), key: k[1], box: bx });
    }
    if (toastBox && /_UIToast:Show(Boss)?Message\(/.test(line)) for (const k of line.matchAll(/"((?:MLUA|FMT)_[A-Z0-9_]+)/g)) if (T.has(k[1])) checks.push({ src: path.basename(file) + "(토스트)", key: k[1], box: toastBox });
  }
}

// ── 평가 ─────────────────────────────
const seen = new Set(); const rows = [];
for (const c of checks) {
  const id = c.key + "@" + c.box.path; if (seen.has(id)) continue; seen.add(id);
  if (c.box.sizeFit) continue; if (c.box.W < 20 || c.box.H < 12) continue; // 칸이 글자에 맞춰 늘어나는 설정
  const tr = T.get(c.key);
  const koH = c.box.bestFit ? 0 : fits(fill(tr.ko), c.box.size, c.box.W, 1e9).h; const ko = evalText(fill(tr.ko), c.box, koH), en = evalText(fill(tr.en), c.box, koH), ja = evalText(fill(tr.ja), c.box, koH), zh = evalText(fill(tr.zh), c.box, koH);
  const status = (r) => r.ok ? (c.box.bestFit && r.size < c.box.max ? `축소 ${Math.round(r.size / c.box.max * 100)}%` : "OK") : `넘침 x${r.ratio.toFixed(2)}`;
  rows.push({ c, tr, ko, en, ja, zh, sev: Math.max(en.ok ? 0 : en.ratio, ja.ok ? 0 : ja.ratio, zh.ok ? 0 : zh.ratio), newBad: ko.ok && (!en.ok || !ja.ok || !zh.ok), sk: status(ko), se: status(en), sj: status(ja), sz: status(zh) });
}
rows.sort((a, b) => (b.newBad - a.newBad) || (b.sev - a.sev));
const bad = rows.filter((r) => !r.en.ok || !r.ja.ok || !r.zh.ok);
console.log(`점검한 텍스트: ${rows.length}개 (A .ui ${checks.filter((x) => x.src === "ui").length} + B/C 코드 연결)  →  en/ja 넘침 ${bad.length}개 (그중 한국어는 들어가던 곳 ${bad.filter((r) => r.newBad).length}개)`);
const shrink = rows.filter((r) => r.en.ok && r.ja.ok && r.zh.ok && (/축소/.test(r.se) || /축소/.test(r.sj) || /축소/.test(r.sz)));
console.log(`BestFit으로 글자가 줄어드는 곳: ${shrink.length}개`);
for (const r of bad.slice(0, 80)) console.log(`${r.newBad ? "🆕" : "  "} ${r.c.key.padEnd(34)} ko[${r.sk}] en[${r.se}] ja[${r.sj}] zh[${r.sz}]  ${r.c.box.file}:${r.c.box.path.replace(/^\/ui\/[^/]+\//, "")} (${Math.round(r.c.box.W)}x${Math.round(r.c.box.H)}, ${r.c.box.bestFit ? "BestFit" : r.c.box.size + "px"})  en="${r.tr.en.replace(/\n/g, "⏎").slice(0, 40)}"`);
const cell = (v) => { const s = String(v ?? ""); return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
const out = [["신규(한국어는OK)", "Key", "출처", "UI파일", "엔티티", "칸(WxH)", "글자", "ko", "en", "ja", "zh-tw", "ko원문", "en", "ja", "zh-tw"]].concat(
  bad.concat(shrink).map((r) => [r.newBad ? "Y" : "", r.c.key, r.c.src, r.c.box.file, r.c.box.path, `${Math.round(r.c.box.W)}x${Math.round(r.c.box.H)}`, r.c.box.bestFit ? `BestFit ${r.c.box.min}-${r.c.box.max}` : r.c.box.size, r.sk, r.se, r.sj, r.sz, r.tr.ko, r.tr.en, r.tr.ja, r.tr.zh]));
fs.writeFileSync("Docs/Localization/overflow_report.csv", "﻿" + out.map((r) => r.map(cell).join(",")).join("\r\n") + "\r\n", "utf8");
console.log("\n→ Docs/Localization/overflow_report.csv");

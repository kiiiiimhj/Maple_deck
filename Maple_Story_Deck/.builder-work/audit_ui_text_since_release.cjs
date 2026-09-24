// 출시 커밋(f0b00f5) 이후 바뀐 .ui에서, 새로 생기거나 글자가 바뀐 텍스트 중
// ① 한글이 그대로 박힌 것 ② 번역표(GameText.csv)에 없는 키 ③ 번역 칸이 빈 키 를 찾는다(읽기 전용)
const { execSync } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");

const repoRoot = path.join(__dirname, "..");
const BASE = "f0b00f5";
const changed = execSync(`git diff --name-only ${BASE} -- ui`, { cwd: repoRoot }).toString()
  .split("\n").filter((l) => l.endsWith(".ui")).map((l) => l.replace(/^Maple_Story_Deck\//, ""));

const csv = fs.readFileSync(path.join(repoRoot, "RootDesk/MyDesk/Localization/GameText.csv"), "utf8").replace(/^﻿/, "");
const rows = {};
for (const line of csv.split(/\r?\n/)) {
  if (!line) continue;
  const cells = []; let cur = "", q = false;
  for (const ch of line) { if (ch === '"') { q = !q; continue; } if (ch === "," && !q) { cells.push(cur); cur = ""; } else cur += ch; }
  cells.push(cur);
  rows[cells[0]] = cells;
}

function texts(b) {
  const m = {};
  for (const e of b.listEntities()) {
    for (const type of ["MOD.Core.TextGUIRendererComponent", "MOD.Core.TextComponent"]) {
      const c = b.getComponent(e.path, type);
      if (c && typeof c.Text === "string" && c.Text !== "") m[e.path] = c.Text;
    }
  }
  return m;
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "uitext-"));
const log = console.log;
console.log = () => {};
const findings = [];
for (const rel of changed) {
  let before = {};
  try {
    const p = path.join(tmp, path.basename(rel));
    fs.writeFileSync(p, execSync(`git show ${BASE}:"Maple_Story_Deck/${rel}"`, { cwd: repoRoot, maxBuffer: 1 << 28 }));
    before = texts(UIBuilder.load(p));
  } catch (e) { before = {}; }
  const after = texts(UIBuilder.load(path.join(repoRoot, rel)));
  for (const [p, t] of Object.entries(after)) {
    if (before[p] === t) continue;
    let issue = "";
    if (/[가-힣]/.test(t)) issue = "한글 직접 입력";
    else if (/^(UI|MLUA|FMT)_[A-Z0-9_]+$/.test(t)) {
      const r = rows[t];
      if (!r) issue = "번역표에 키 없음";
      else {
        const empty = ["ko", "en", "zh-tw", "ja"].filter((n, i) => !r[3 + i] || !r[3 + i].trim());
        issue = empty.length ? "번역 빈칸 " + empty.join("/") : "ok";
      }
    } else issue = "키 아님(숫자/기호?)";
    findings.push(`${rel} ${p} = ${JSON.stringify(t)} -> ${issue}`);
  }
}
console.log = log;
console.log(findings.join("\n") || "(바뀐 텍스트 없음)");
console.log("files checked:", changed.length);

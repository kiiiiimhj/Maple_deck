// .ui 한국어 텍스트 → 로컬라이제이션 키 변환 [실제 적용] (2026-09-22).
//   node .builder-work/ui_localize_apply.cjs            (드라이런과 동일, 쓰지 않음)
//   node .builder-work/ui_localize_apply.cjs --apply    (실제 write)
//
// 대상: MOD.Core.TextGUIRendererComponent + MOD.Core.TextComponent(구형).
//   둘 다 `Text=<키>` + `IsLocalizationKey=true` 로 바꾼다. 유저 육안 검증 완료:
//   - GUI  : 업적 팝업 "모두 받기" (2026-09-22)
//   - 구형 : 로비 "게임 시작" 버튼  (2026-09-22)
//
// ⚠ 반드시 **편집 모드**에서 실행할 것. 플레이 중에 쓰면 디스크만 바뀌고 런타임은
//   캐시된 옛 값을 읽는다([[feedback_ui_write_during_play_stale_cache]]).
//
// 스크립트가 런타임에 Text를 덮어쓰는 엔티티(약 80개)는 변환해도 화면에 안 나온다 —
// 하지만 **해롭지도 않다**: 키는 전부 GameText에 있으므로 최악이 "변화 없음"이고,
// 키 이름이 노출되는 경우는 없다. 그래서 가려내지 않고 전부 변환한다.
// 그 80개의 실제 번역은 .mlua GetText 단계에서 처리한다.
//
// ⚠ 반드시 UIBuilder.load()로 연다. new UIBuilder()는 루트 UUID를 새로 발급해서
//   Maker 엔트리를 깨뜨린다([[feedback_ui_root_uuid_churn_breaks_entry]]).
const fs = require("fs");
const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");

const APPLY = process.argv.includes("--apply");
const KO = /[가-힣]/;
const CSV = "RootDesk/MyDesk/Localization/GameText.csv";
const GUI = "MOD.Core.TextGUIRendererComponent";
const LEGACY = "MOD.Core.TextComponent";

// 인벤토리 탭 4칸은 UIInventoryTab.mlua:39가 영어("All"/"Weapon"/"Armor"/"etc")로
// 덮어쓰는 게 **원래 디자인**이다(유저 확인). .ui를 건드릴 이유가 없어 제외한다.
const SKIP = /\/TabHolder\/[^/]+\/Background\/UIText$/;

function parseCsv(src) {
  const rows = [];
  let row = [], cell = "", q = false;
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (q) {
      if (c === '"') { if (src[i + 1] === '"') { cell += '"'; i++; } else q = false; }
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === ",") { row.push(cell); cell = ""; }
    else if (c === "\r") { /* skip */ }
    else if (c === "\n") { row.push(cell); rows.push(row); row = []; cell = ""; }
    else cell += c;
  }
  if (cell !== "" || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

const rows = parseCsv(fs.readFileSync(CSV, "utf8").replace(/^﻿/, ""));
const header = rows.shift();
const iKey = header.indexOf("Key"), iSrc = header.indexOf("Source");
const textToKey = new Map();
for (const r of rows) if (r[iKey] && !textToKey.has(r[iSrc])) textToKey.set(r[iSrc], r[iKey]);

const report = { changed: 0, probe: 0, files: [], failed: [] };

for (const f of fs.readdirSync("ui").filter((x) => x.endsWith(".ui")).sort()) {
  const p = "ui/" + f;
  let b;
  try { b = UIBuilder.load(p); } catch (e) { report.failed.push(`${f} (load: ${e.message})`); continue; }

  const edits = [];
  for (const e of b.listEntities()) {
    for (const type of [GUI, LEGACY]) {
      const c = b.getComponent(e.path, type);
      if (!c || typeof c.Text !== "string") continue;
      if (c.IsLocalizationKey === true) continue;
      if (!KO.test(c.Text)) continue;
      const key = textToKey.get(c.Text);
      if (!key) continue;
      if (SKIP.test(e.path)) continue;
      edits.push({ path: e.path, type, key, was: c.Text });
    }
  }
  if (!edits.length) continue;

  for (const ed of edits) b.patchComponent(ed.path, ed.type, { Text: ed.key, IsLocalizationKey: true });

  if (APPLY) {
    // strict:false 고정 — 기존 스크롤 리스트의 L013 off-canvas는 정상 상태이고,
    // 예외가 터지면 스크립트가 중단된다([[feedback_ui_offcanvas_lint_not_bug]]).
    try { b.write(p, { strict: false }); }
    catch (e) { report.failed.push(`${f} (write: ${e.message})`); continue; }
  }

  report.changed += edits.filter((e) => e.type === GUI).length;
  report.probe += edits.filter((e) => e.type === LEGACY).length;
  report.files.push(`${String(edits.length).padStart(4)}  ${f}`);
}

console.log(`\n=== ${APPLY ? "적용 완료" : "드라이런(쓰지 않음)"} ===`);
console.log(`TextGUIRendererComponent 변환 : ${report.changed}`);
console.log(`구형 TextComponent 변환       : ${report.probe}`);
console.log("\n-- 파일별 --");
for (const l of report.files) console.log(l);
if (report.failed.length) {
  console.log("\n⚠ 실패한 파일:");
  for (const l of report.failed) console.log("  " + l);
  process.exitCode = 1;
}

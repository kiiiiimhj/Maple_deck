// 구형 TextComponent 탐침 교체 (2026-09-22).
//   node .builder-work/ui_localize_probe_swap.cjs --apply
//
// 1차 탐침(인벤 "전체" 탭)은 실패했다 — 그 엔티티는 UIInventoryTab.mlua:39가
// 런타임에 Text를 "All"로 덮어써서 .ui 값이 화면에 안 나온다. 되돌린다.
//
// 2차 탐침은 런타임 전수 스캔(ui_localize_classify.cjs)에서 "정적"으로 확인된
// 로비 메인 버튼으로 잡는다 — 항상 보이고, 깨지면 즉시 눈에 띈다.
const fs = require("fs");
const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");

const APPLY = process.argv.includes("--apply");
const LEGACY = "MOD.Core.TextComponent";

const REVERT = {
  file: "ui/EquipmentGroup.ui",
  path: "/ui/EquipmentGroup/Inventory/Panel/InventoryPanel/TabHolder/All/Background/UIText",
  text: "전체",
};
const PROBE = {
  file: "ui/TitleGroup.ui",
  path: "/ui/TitleGroup/BattlePanel/BtnStart",
  key: null, // GameText.csv에서 "게임 시작" 원문으로 찾는다
  text: "게임 시작",
};

function parseCsv(src) {
  const rows = []; let row = [], cell = "", q = false;
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (q) { if (c === '"') { if (src[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += c; }
    else if (c === '"') q = true;
    else if (c === ",") { row.push(cell); cell = ""; }
    else if (c === "\r") { /* skip */ }
    else if (c === "\n") { row.push(cell); rows.push(row); row = []; cell = ""; }
    else cell += c;
  }
  if (cell !== "" || row.length) { row.push(cell); rows.push(row); }
  return rows;
}
const rows = parseCsv(fs.readFileSync("RootDesk/MyDesk/Localization/GameText.csv", "utf8").replace(/^﻿/, ""));
const head = rows.shift();
const iKey = head.indexOf("Key"), iSrc = head.indexOf("Source");
for (const r of rows) if (r[iSrc] === PROBE.text) { PROBE.key = r[iKey]; break; }
if (!PROBE.key) { console.error("번역표에서 '" + PROBE.text + "' 키를 못 찾음"); process.exit(1); }

// ⚠ 이 프로젝트의 .ui write()는 항상 strict:false — 스크롤 리스트 off-canvas(L013)로
//   예외가 터져 스크립트가 중단되는 걸 막는다([[feedback_ui_offcanvas_lint_not_bug]]).
const W = { strict: false };

// 1) 1차 탐침 원복
{
  const b = UIBuilder.load(REVERT.file);
  b.patchComponent(REVERT.path, LEGACY, { Text: REVERT.text, IsLocalizationKey: false });
  console.log(`[원복] ${REVERT.path} → ${JSON.stringify(REVERT.text)}`);
  if (APPLY) b.write(REVERT.file, W);
}

// 2) 2차 탐침 설정
{
  const b = UIBuilder.load(PROBE.file);
  const c = b.getComponent(PROBE.path, LEGACY);
  if (!c) { console.error("탐침 대상에 TextComponent 없음: " + PROBE.path); process.exit(1); }
  console.log(`[탐침] ${PROBE.path} : ${JSON.stringify(c.Text)} → ${PROBE.key}`);
  b.patchComponent(PROBE.path, LEGACY, { Text: PROBE.key, IsLocalizationKey: true });
  if (APPLY) b.write(PROBE.file, W);
}

console.log(APPLY ? "\n적용 완료" : "\n드라이런(쓰지 않음)");

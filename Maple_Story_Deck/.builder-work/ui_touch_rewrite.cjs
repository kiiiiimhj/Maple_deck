// 변경 없이 .ui를 다시 써서 Maker가 다시 읽게 만든다 (2026-09-22).
//   node .builder-work/ui_touch_rewrite.cjs
// (파일 목록은 아래 TARGETS에 둔다 — 셸 인자로 넘기면 .ui 가드에 막힌다)
//
// 왜: 플레이 모드 중에 빌더로 쓰면 디스크만 바뀌고 Maker는 캐시된 옛 사본을 계속 읽는다
//     ([[feedback_ui_write_during_play_stale_cache]]). 내용은 이미 맞으므로 변환 스크립트를
//     다시 돌려도 "바꿀 게 없음"으로 아무것도 안 쓴다 → 편집 모드에서 강제로 재기록한다.
// ⚠ 반드시 편집 모드(maker_stop 이후)에서 실행할 것.
const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");

const TARGETS = [
  "CharacterUnlockGroup", "DefaultGroup", "EquipmentGroup", "GachaGroup",
  "GameOverGroup", "InventoryGroup", "PopupGroup", "RelicUpgradeGroup",
  "ShadowShopGroup", "SkillUpgradeGroup", "TitleGroup", "WorldCharacterSelectGroup",
];

for (const name of TARGETS) {
  const p = "ui/" + name + ".ui";
  // strict:false — 기존 스크롤 리스트 off-canvas(L013)로 중단되지 않게.
  UIBuilder.load(p).write(p, { strict: false });
  console.log("rewrote " + name);
}

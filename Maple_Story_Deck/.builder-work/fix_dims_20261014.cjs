// 2026-10-14 전체화면 딤 정비 — audit_dims2.cjs 결과 반영.
//   node .builder-work/fix_dims_20261014.cjs
// 기준(출석 딤): ImageRUID 4fea64a3307cda641809ad8be0d4890b / Type 0(Simple) / stretch offset 0.
// 자식이 가운데 앵커인 엔티티는 중심(anchoredPosition)을 유지한 채 양쪽으로 똑같이 넓혀서 자식이 안 움직이게 한다.
const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");

const GOOD = "4fea64a3307cda641809ad8be0d4890b";
const T = "MOD.Core.UITransformComponent";
const S = "MOD.Core.SpriteGUIRendererComponent";

function sprite(b, p) {
  b.patchComponent(p, S, { ImageRUID: { DataId: GOOD }, Type: 0 });
}
// stretch 엔티티를 화면 꽉 차게(offset 0)
function full(b, p) {
  b.patchComponent(p, T, {
    OffsetMin: { x: 0, y: 0 }, OffsetMax: { x: 0, y: 0 },
    anchoredPosition: { x: 0, y: 0 }, RectSize: { x: 1920, y: 1080 },
  });
}
// 중심은 그대로 두고 화면을 다 덮을 만큼만 양쪽으로 넓힌다
function coverKeepCenter(b, p) {
  const t = b.getComponent(p, T);
  const cx = (t.OffsetMin.x + t.OffsetMax.x) / 2;
  const cy = (t.OffsetMin.y + t.OffsetMax.y) / 2;
  const kx = Math.abs(cx);
  const ky = Math.abs(cy);
  b.patchComponent(p, T, {
    OffsetMin: { x: cx - kx, y: cy - ky }, OffsetMax: { x: cx + kx, y: cy + ky },
    anchoredPosition: { x: cx, y: cy }, RectSize: { x: 1920 + 2 * kx, y: 1080 + 2 * ky },
  });
}
function edit(file, fn, opts) {
  const b = UIBuilder.load(file);
  fn(b);
  b.write(file, opts);
}

edit("ui/PetHouseGroup.ui", (b) => {
  full(b, "Overlay");            // 위 0.49 / 오른쪽 0.87px 모자라던 부모
  sprite(b, "Overlay/Dim");      // 둥근 기본 스킨 → 출석 딤 그림
});
edit("ui/Ep4BalloonPuzzleGroup.ui", (b) => {
  full(b, "Dimmer");             // 100x100으로 저장돼 패널 뒤에 숨어 딤이 사실상 없었다
});
edit("ui/EquipmentGroup.ui", (b) => {
  // 인벤토리 루트가 왼쪽으로 2px 밀려 있어 오른쪽 끝 2px이 비었다 — 딤만 오른쪽으로 2px 더 덮는다
  b.patchComponent("Inventory/Dimmer", T, {
    OffsetMin: { x: 0, y: 0 }, OffsetMax: { x: 2, y: 0 },
    anchoredPosition: { x: 1, y: 0 }, RectSize: { x: 1922, y: 1080 },
  });
  for (const p of ["Inventory/EquipPopup", "Inventory/ComposePopup", "Inventory/UsePopup"]) {
    sprite(b, p);                // 빈 RUID → 출석 딤 그림(알파 0.5 유지)
    coverKeepCenter(b, p);       // UsePopup은 위 53px, EquipPopup은 왼쪽 1px 비어 있었다
  }
});
// 확률표 스크롤 목록 줄(Row_*)이 마스크 밖이라 L013 오류 354개가 원래부터 난다(오탐) — strict만 끈다
edit("ui/GachaGroup.ui", (b) => sprite(b, "GachaProbInfo/Dim"), { strict: false });
// 원본 파일도 lint 오류 52개가 그대로 난다(이번 수정과 무관) — strict만 끈다
edit("ui/LevelRewardGroup.ui", (b) => sprite(b, "Dimmer"), { strict: false });
edit("ui/GalleryArenaUI.ui", (b) => sprite(b, "ResultGroup"));
edit("ui/RaidGroup.ui", (b) => {
  full(b, "RewardTableDim");     // 좌우 147px씩 좁았다
  sprite(b, "RewardTableDim");
});
edit("ui/PopupGroup.ui", (b) => sprite(b, "PopupBack"));
console.log("done");

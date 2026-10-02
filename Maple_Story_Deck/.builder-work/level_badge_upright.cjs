// 인벤 플레이어 정보 별 배지의 레벨 글씨가 -22도(z=338) 기울어져 있던 것 → 똑바로 세우고 별 가운데로(유저 지정 2026-10-02).
const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");
const T = "MOD.Core.UITransformComponent";
const FILE = "ui/EquipmentGroup.ui";
const P = "Inventory/Panel/EquipPanel/PlayerInfo/NameBackground/LevelBackground/Level";
const b = UIBuilder.read(FILE);
// 기울기는 ZRotation 필드에 저장돼 있다(Rotation/QuaternionRotation만 바꾸면 런타임에 안 먹음)
b.patchComponent(P, T, {
  ZRotation: 0, Rotation: { x: 0, y: 0, z: 0 }, QuaternionRotation: { x: 0, y: 0, z: 0, w: 1 },
  anchoredPosition: { x: 0, y: 0 }, Position: { x: 0, y: 0, z: 0 },
  OffsetMin: { x: -50, y: -27.5 }, OffsetMax: { x: 50, y: 27.5 },
});
b.write(FILE, { strict: false });
const t = UIBuilder.read(FILE).getComponent(P, T);
console.log(JSON.stringify({ z: t.ZRotation, off: [t.OffsetMin, t.OffsetMax], rot: t.Rotation, q: t.QuaternionRotation, pos: t.anchoredPosition }));

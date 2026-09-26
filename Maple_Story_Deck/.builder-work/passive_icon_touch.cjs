// 인게임 하단 획득 패시브 아이콘 26개를 눌러서 정보를 볼 수 있게 터치를 받도록 한다 (2026-09-26 유저 요청)
// 각 XxxBuff/XxxIcon 그림: RaycastTarget 켜기 + UITouchReceiveComponent 추가. 포션(시간제) 3개(…PotionBuff/Icon)는 제외.
// 실제 표시/숨김은 CardManager.ConnectPassiveIconTouch → ShowPassiveTooltip.
const path = require("path");
const { UIBuilder } = require(path.join(__dirname, "../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs"));

const UI = path.join(__dirname, "../ui/DefaultGroup.ui");
const b = UIBuilder.load(UI);
const icons = b.listEntities()
  .map((e) => e.path)
  .filter((p) => /^\/ui\/DefaultGroup\/([A-Za-z]+)Buff\/\1Icon$/.test(p));
if (icons.length !== 26) throw new Error("expected 26 passive icons, got " + icons.length);
for (const p of icons) {
  b.patchComponent(p, "MOD.Core.SpriteGUIRendererComponent", { RaycastTarget: true });
  if (!b.hasComponent(p, "MOD.Core.UITouchReceiveComponent")) b.addComponent(p, "MOD.Core.UITouchReceiveComponent");
}
b.write(UI);
console.log("touchable passive icons:", icons.length);

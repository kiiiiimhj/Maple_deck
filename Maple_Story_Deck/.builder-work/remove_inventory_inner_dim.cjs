// 인벤토리에 딤이 2겹으로 보이는 문제 (유저 리포트 2026-09-22) — 작은 쪽을 없앤다.
//
// 런타임 실측(execute_script, 인벤토리 연 상태에서 /ui 전체 순회):
//   /ui/EquipmentGroup/Inventory          size=2044x1027 a=0.50  ← 작은 쪽(= 캔버스 크기)
//   /ui/EquipmentGroup/Inventory/Dimmer   size=2364x1147 a=0.65  ← 큰 쪽(2026-09-22 신설, 화면 끝까지)
//
// 작은 쪽은 Inventory 루트 자신에 붙어 있던 스프라이트다. 이 스프라이트의 **진짜 역할은 클릭 차단**이고
// (이 프로젝트에서 팝업 뒤 클릭을 막는 유일한 방법 = 전체화면 스프라이트 + RaycastTarget=true),
// 어둡게 보이는 건 곁다리다. 그래서 엔티티/컴포넌트를 지우지 않고 **알파만 0으로** 내린다.
//   · RaycastTarget=true 유지 → 뒤의 로비 버튼 클릭 차단은 그대로 살아있다
//   · 알파 0이어도 레이캐스트는 받는다(같은 그룹의 기존 차단막들이 빈 ImageRUID = 안 그려지는 상태로
//     이미 차단 역할만 하고 있는 것과 같은 원리)
// 컴포넌트를 지우면 클릭 관통이 되살아난다 — 2026-08-30 전수감사에서 고쳤던 회귀를 다시 부른다.
const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");

const UI_PATH = "ui/EquipmentGroup.ui";
const TARGET = "Inventory";

const b = UIBuilder.load(UI_PATH);

const before = b.getComponent(TARGET, "MOD.Core.SpriteGUIRendererComponent");
console.log(`BEFORE color=${JSON.stringify(before.Color)} raycast=${before.RaycastTarget}`);

b.patchComponent(TARGET, "MOD.Core.SpriteGUIRendererComponent", {
  Color: { r: before.Color.r, g: before.Color.g, b: before.Color.b, a: 0 },
  RaycastTarget: true, // 클릭 차단은 반드시 유지
});

b.write(UI_PATH, { strict: false });

const after = UIBuilder.load(UI_PATH).getComponent(TARGET, "MOD.Core.SpriteGUIRendererComponent");
console.log(`AFTER  color=${JSON.stringify(after.Color)} raycast=${after.RaycastTarget}`);

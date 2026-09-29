// 몬스터 도감 — 보상 표시(유저 지정 2026-09-29): 카드 받기 버튼 = 다이아 아이콘 + "xN", 모두 받기 = 글자 위로 + 아래 다이아 합계,
// 완료/잠김(비활성) 버튼은 확실히 어둡게. 유저가 Maker에서 잡은 위치/크기는 건드리지 않고 새 자식과 필드만 더한다.
const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");
const SGR = "MOD.Core.SpriteGUIRendererComponent";
const TGR = "MOD.Core.TextGUIRendererComponent";
const DIA = "81462aeb825b4660991cef05651271cf";
const white = { r: 1, g: 1, b: 1, a: 1 };
const PATH = "ui/MonsterBookGroup.ui";
const b = UIBuilder.load(PATH);

// 다이아 아이콘은 보이는 중심이 칸 중심에서 (크기 × 0.75, 0.711)만큼 오른쪽 위로 밀려 있다(RewardFlyUI.GetPivotFix) — 그만큼 되돌려 놓는다
function dia(path, size, cx, cy) {
  b.sprite(path, { rect_size: [size, size], pos: [cx - 0.75 * size, cy - 0.711 * size], image_ruid: DIA, color: white, sprite_type: 0 });
  b.patchComponent(path, SGR, { PreserveSprite: 1 });
}
function amount(path, size, rect, pos) {
  b.text(path, "x0", { size, bold: true, color: "#FFFFFF", pos, rect_size: rect, outline: true, outline_color: "#1A4A08", alignment: 3 });
  b.patchComponent(path, TGR, { Font: "Maple", OutlineWidth: 0.3 });
}

// 카드 받기 버튼(117x46.8)
const C = "Panel/Inner/Grid/CardTemplate/BtnClaim";
dia(C + "/Dia", 26, -24, 0);
amount(C + "/Amount", 18, [66, 36], [18, 0]);
// 비활성(완료/잠김) 버튼은 반투명(기본 DisabledColor a=0.5)이라 밝게 떠 보였다 → 불투명 회색
const bc = b.getComponent(C, "MOD.Core.ButtonComponent");
const colors = JSON.parse(JSON.stringify(bc.Colors));
colors.DisabledColor = { r: 0.42, g: 0.42, b: 0.42, a: 1 };
b.patchComponent(C, "MOD.Core.ButtonComponent", { Colors: colors });

// 모두 받기(372x149) — 글자를 위로 올리고 아래에 다이아 합계
const A = "Panel/BtnClaimAll";
b.patchComponent(A, TGR, { Padding: { left: 0, right: 0, top: 0, bottom: 46 } });
dia(A + "/Dia", 34, -34, -30);
amount(A + "/Amount", 26, [120, 40], [52, -30]);

b.write(PATH);
console.log("reward display patched");

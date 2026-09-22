const path = require("path");
const { UIBuilder } = require(path.join(__dirname, "..", ".claude", "skills", "msw-ui-system", "scripts", "msw_ui_builder.cjs"));

// 반지 아이콘을 **프로젝트가 직접 만든** 스프라이트로 바꾼다.
// ItemDataTable의 반지 RUID(thumbnail://0abf98bb…)는 넥슨 인덱스 스프라이트라 pivot 메타데이터가
// 중앙(0.5,0.5)이 아니라 0 근처(nx 0.0556 / ny 0.0278)여서 칸 안에서 오른쪽 위로 밀려 그려진다
// (GearCategoryEnum에 같은 경고가 이미 적혀 있다 — 빈 반지 칸 아이콘도 같은 이유로 교체돼 있었다).
const UI_PATH = "ui/RaidGroup.ui";
const b = UIBuilder.load(UI_PATH);

b.patchComponent("RewardBox/RingIcon", "MOD.Core.SpriteGUIRendererComponent",
  { ImageRUID: { DataId: "2953509cd0ff43b9a0eb31abb5646853" } });

b.write(UI_PATH);
console.log("ring icon ruid swapped");

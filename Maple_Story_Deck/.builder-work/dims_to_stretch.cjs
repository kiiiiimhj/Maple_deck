// 고정 1920x1080 풀스크린 딤 2개를 stretch(여백 0)로 (2026-09-26 해상도 점검 후속, 유저 지정 "튜토리얼·레이드 보상표 딤")
// PC 창 비율이 16:9가 아니면(울트라와이드·창 크기 조절) 고정 크기 딤 양옆이 비었다. 모바일은 MobileScreenFitLogic이
// stretch도 Offset으로 화면 끝까지 넓혀 주므로 그대로 동작한다. 자식은 전부 가운데 앵커라 제자리.
const path = require("path");
const { UIBuilder } = require(path.join(__dirname, "../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs"));
const T = "MOD.Core.UITransformComponent";

for (const [file, ent] of [["DefaultGroup", "TutorialAimStage"], ["RaidGroup", "RewardTableDim"]]) {
  const UI = path.join(__dirname, `../ui/${file}.ui`);
  const b = UIBuilder.load(UI);
  b.patch(ent, { anchor: "stretch", pivot: [0.5, 0.5] });
  b.patchComponent(ent, T, { OffsetMin: { x: 0, y: 0 }, OffsetMax: { x: 0, y: 0 }, anchoredPosition: { x: 0, y: 0 } });
  b.write(UI, { strict: false });
  const t = b.getComponent(ent, T);
  console.log(file, ent, "align", t.AlignmentOption, "min", JSON.stringify(t.AnchorsMin), "max", JSON.stringify(t.AnchorsMax),
    "offMin", JSON.stringify(t.OffsetMin), "offMax", JSON.stringify(t.OffsetMax));
}

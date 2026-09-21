// 남아 있던 고정(middle-center + RectSize 1920x1080) 전체화면 딤을 전부 stretch로 통일한다
// (유저 지정 2026-09-22 "고정 딤 stretch로 바꿔줘").
//
// 고정 딤은 캔버스가 정확히 1920x1080(= 화면비 16:9)일 때만 딱 맞는다. 그 외에는 캔버스가 그 비율로
// 늘어나는데 딤은 1920x1080 그대로라 가장자리가 안 덮여 뒤가 비친다:
//   · 모바일 — 안전영역 캔버스(예: 2044x1027) → 좌우/아래 비침 (항상 발생)
//   · PC     — 울트라와이드나 16:9가 아닌 창 → 좌우 비침
// MobileScreenFitLogic이 런타임에 넓혀주긴 하지만 IsActive()(모바일) 게이트 안이라 PC는 방치였다.
// stretch로 바꾸면 캔버스를 그대로 따라가므로 런타임 보정 없이 양쪽 다 해결된다(출석 딤과 같은 규격).
const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");

// 파일별로 묶어서 한 번만 load/write 한다(TitleGroup은 14만 줄짜리라 왕복을 줄인다)
const TARGETS = [
  ["ui/DefaultGroup.ui", ["TutorialDim"]],
  ["ui/GameOverGroup.ui", ["DiaShop/Dim"]],
  ["ui/IdleRewardGroup.ui", ["ConfirmDimmer"]],
  ["ui/RunStartConfirmGroup.ui", ["Dimmer"]],
  ["ui/TitleGroup.ui", ["RaidGuideDim", "RaidTutorial/Dim"]],
];

for (const [path, ids] of TARGETS) {
  const b = UIBuilder.load(path);
  for (const id of ids) b.patch(id, { anchor: "stretch", pos: [0, 0] });
  b.write(path, { strict: false });

  const after = UIBuilder.load(path);
  for (const id of ids) {
    const t = after.getComponent(id, "MOD.Core.UITransformComponent");
    console.log(
      `RESULT ${path} :: ${id} -> AlignmentOption=${t.AlignmentOption}` +
        ` OffsetMin=${JSON.stringify(t.OffsetMin)} OffsetMax=${JSON.stringify(t.OffsetMax)}`
    );
  }
}

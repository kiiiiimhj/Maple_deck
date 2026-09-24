// 에피소드 보상 팝업 안내 문구(Hint) — 유저 지정 2026-09-24 "위치를 위로 더 올려야 해, 폰트 너무 작아 더 키워".
// 문구가 액자 아래 테두리(패널 로컬 ≈ -230) 밖 -243에 걸쳐 있었다 → 받기 버튼을 조금 올리고 문구를 액자 안(-200)으로.
// 카드 아래 끝 ≈ -105, 버튼(보이는 그림 60) -145 → -115~-175, 문구 -200(±22) → 액자 안쪽 바닥 -230 위.
const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");

const FILE = "ui/EpisodeRewardGroup.ui";
const b = UIBuilder.load(FILE);
b.patch("Panel/BtnClaim", { pos: [1, -145] });
b.patch("Panel/Hint", { pos: [0, -200], rect_size: [900, 44] });
b.patchComponent("Panel/Hint", "MOD.Core.TextGUIRendererComponent", { Font: "Maple", FontSize: 30, BestFit: true, MaxSize: 30, MinSize: 18 });
b.write(FILE);

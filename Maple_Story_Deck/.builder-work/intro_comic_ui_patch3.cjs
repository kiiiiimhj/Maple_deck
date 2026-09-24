// 인트로 만화 3차(2026-09-24 유저 "웹툰 뒤 배경 이걸로") — 흰 바탕 위에 배경 그림을 깐다.
// Bg의 자식이라 흰 바탕보다 위·컷들보다 아래에 그려지고, 레이캐스트를 꺼서 터치는 그대로 Bg 버튼이 받는다.
// 기본 크기는 PC 16:9를 덮는 값이고, 실제 화면(모바일 포함)에 맞춘 cover 크기는 IntroComicUI.FitBackgroundArt가 재생 때 다시 잡는다.
const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");

const FILE = "ui/IntroComicGroup.ui";
const ART = "57c6e8fc74c3416fbd01542b7cdb409d";
const ASPECT = 64 / 42; // 계정 썸네일 실측(≈3:2)

const b = UIBuilder.load(FILE);
b.sprite("Screen/Bg/Art", {
  anchor: "middle-center", pos: [0, 0], rect_size: [1920, Math.round(1920 / ASPECT)],
  image_ruid: ART, sprite_type: 0, color: "#FFFFFF", alpha: 1, raycast: false, pivot: [0.5, 0.5],
});
b.write(FILE, {
  bind: { mlua: "RootDesk/MyDesk/UI/IntroComicUI.mlua", props: { bgArt: "Screen/Bg/Art" } },
});

// 레이드 온보딩 z-order 정리 (2026-09-21 모바일 실기 리포트)
//
// 문제: 로비 유도 딤(RaidGuideDim)의 displayOrder가 14로 레이드 아이콘(RaidButton, 12)보다 위라
//       딤이 아이콘을 덮고 탭까지 먹는다. 런타임 _UILogic:SetSiblingIndex로 올리는 코드가 있지만
//       실기 로그상 인덱스만 바뀌고 실제 그리기/레이캐스트 순서는 안 바뀌었다
//       (btn=16 > dim=15인데도 탭이 버튼에 도달하지 못함) → 정적 displayOrder를 바로잡는다.
//
// 바뀌는 값 (TitleGroup 루트 자식들, 14 이상만 손대서 나머지 UI에는 영향 없음):
//   RaidGuideDim     14 (유지)  — 로비를 덮는 딤
//   RaidButton       12 → 15    — 딤 위로. 유도 대상이라 반드시 딤보다 위
//   RaidGuideFinger  15 → 16    — 아이콘 위에서 콕콕
//   RaidUnlockBanner 13 → 17    — 배너가 딤과 동시에 뜨도록 바뀌어서(유저 지정) 딤 밑이면 어두워진다
//   RaidTutorial     16 → 18    — 4단계 이미지 튜토리얼이 항상 최상단
const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");

const UI_PATH = "ui/TitleGroup.ui";
const ORDER = {
  RaidGuideDim: 14,
  RaidButton: 15,
  RaidGuideFinger: 16,
  RaidUnlockBanner: 17,
  RaidTutorial: 18,
};

const b = UIBuilder.read(UI_PATH);

for (const [name, displayOrder] of Object.entries(ORDER)) {
  const before = b.find(name).jsonString.displayOrder;
  b.patch(name, { display_order: displayOrder });
  console.log(`${name.padEnd(18)} displayOrder ${before} -> ${displayOrder}`);
}

// TitleGroup은 스크롤 리스트 때문에 L013 경고가 대량으로 나온다 → strict 끄고 쓴다
b.write(UI_PATH, { strict: false });
console.log("written:", UI_PATH);

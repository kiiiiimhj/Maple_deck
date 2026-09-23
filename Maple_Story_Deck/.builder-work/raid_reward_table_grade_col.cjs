// 2026-09-23 유저 지정: 레이드 "등급별 보상" 표 — 줄 배경(Bg)이 왼쪽 등급 칸까지 덮지 않게 줄이고,
// 등급 칸에는 등급 사이마다 가는 가로 구분선(GradeLine)을 따로 긋는다.
// 줄(Row) 폭 700(x -350~350), 등급 칸 = x -360~-260(가운데 -310, 폭 100). 줄 간격 62, 줄 높이 56.
const { UIBuilder } = require('../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs');
const FILE = 'ui/RaidGroup.ui';
const SOLID = '4fea64a3307cda641809ad8be0d4890b'; // 단색 사각(딤과 같은 RUID — 렌더 확인됨)
const ROWS = 7;
const BG_LEFT = -252, BG_RIGHT = 350;
const b = UIBuilder.load(FILE);
for (let i = 0; i < ROWS; i++) {
  const row = 'RewardTable/Row' + i;
  // 배경은 등급 칸 오른쪽부터
  b.patch(row + '/Bg', { pos: [(BG_LEFT + BG_RIGHT) / 2, 0], rect_size: [BG_RIGHT - BG_LEFT, 54] });
  // 등급 칸 구분선 — 이 줄과 다음 줄 사이(줄 가운데에서 아래로 31). 마지막 줄 밑에는 긋지 않는다
  if (i < ROWS - 1 && !b.find(row + '/GradeLine')) {
    b.sprite(row + '/GradeLine', {
      anchor: 'middle-center', pos: [-306, -31], rect_size: [92, 2],
      image_ruid: SOLID, sprite_type: 0, color: { r: 1, g: 1, b: 1, a: 0.28 }, raycast: false,
    });
  }
}
b.write(FILE);
for (const e of b.listEntities().filter(e => /Row[0-6]\/(Bg|GradeLine)$/.test(e.path)))
  console.log(e.path.split('RewardTable/')[1], JSON.stringify(e.pos), JSON.stringify(e.size));

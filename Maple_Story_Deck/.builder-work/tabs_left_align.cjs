// 상점/랭킹 상단 탭 2개를 가운데 → 왼쪽 정렬 (2026-09-26 유저 요청)
// 첫 탭의 왼쪽 끝을 아래 내용(상점 카드 / 랭킹 표 박스)의 왼쪽 끝에 맞추고, 두 탭 사이 간격 20은 유지한다.
// Tabs 컨테이너는 둘 다 x=120, 폭 1300(로컬 왼쪽 끝 -650). 탭 폭 360.
//   상점 카드 왼쪽 끝 ≈ 화면 UI x -524 → 로컬 -644 → 탭 중심 -428 / -48 (스샷 실측 보정 +36)
//   랭킹 표 박스 왼쪽 끝 ≈ 화면 UI x -557 → 로컬 -677 → 탭 중심 -461 / -81 (스샷 실측 보정 +36)
const path = require("path");
const { UIBuilder } = require(path.join(__dirname, "../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs"));

const UI = path.join(__dirname, "../ui/TitleGroup.ui");
const b = UIBuilder.load(UI);

b.patch("ShopPanel/Tabs/TabDiamond", { pos: [-428, 0] });
b.patch("ShopPanel/Tabs/TabSkin", { pos: [-48, 0] });
b.patch("RankPanel/Tabs/TabUnlimited", { pos: [-461, 0] });
b.patch("RankPanel/Tabs/TabTimeAttack", { pos: [-81, 0] });

b.write(UI, { strict: false }); // TitleGroup의 L013(화면 밖)은 기존부터 있던 상태 — 이번 수정과 무관
for (const e of b.listEntities()) {
  if (/(ShopPanel|RankPanel)\/Tabs\/Tab[A-Za-z]+$/.test(e.path)) console.log(e.path, JSON.stringify(e.pos));
}

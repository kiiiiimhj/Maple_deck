// 방치 보상 팝업을 24 내린다 (2026-09-26 해상도 점검) — Panel y 84 → 60.
// 판(Board 891 높이) 윗부분이 y 529.5까지 올라가 아이폰 안전영역 캔버스(높이 1027, 위 끝 513.5)에서 약 16px 잘렸다.
// 60이면 위 끝 505.5. 아래쪽은 가장 낮은 버튼(BtnClaim) 아래 끝이 -373 정도라 여유가 충분하다.
const path = require("path");
const { UIBuilder } = require(path.join(__dirname, "../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs"));

const UI = path.join(__dirname, "../ui/IdleRewardGroup.ui");
const b = UIBuilder.load(UI);
b.patch("Panel", { pos: [0, 60] });
b.write(UI);
console.log(JSON.stringify(b.listEntities().find((e) => e.path === "/ui/IdleRewardGroup/Panel").pos));

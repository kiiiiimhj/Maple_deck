// 상점 대미지 스킨 카드 8장 — 아이콘이 카드 윗테두리(단풍 장식)에 걸쳐 있어 아래로 내린다 (2026-09-26 유저 요청)
// 아이콘 y 62→38, 이름 y -20→-28. 가격/장착 버튼(StatusBox, y -92)은 그대로.
const path = require("path");
const { UIBuilder } = require(path.join(__dirname, "../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs"));

const UI = path.join(__dirname, "../ui/TitleGroup.ui");
const b = UIBuilder.load(UI);

const cards = b.listEntities().filter((e) => /\/SkinCard_\d+$/.test(e.path));
if (cards.length !== 8) throw new Error("expected 8 skin cards, got " + cards.length);
for (const c of cards) {
  b.patch(c.path + "/Icon", { pos: [0, 38] });
  b.patch(c.path + "/NameText", { pos: [0, -28] });
}
b.write(UI, { strict: false }); // 상점 스크롤 목록 카드의 L013(화면 밖)은 기존부터 있던 정상 상태 — 이번 수정과 무관
for (const e of b.listEntities()) {
  if (/SkinCard_1\//.test(e.path)) console.log(e.path, JSON.stringify(e.pos), JSON.stringify(e.size));
}

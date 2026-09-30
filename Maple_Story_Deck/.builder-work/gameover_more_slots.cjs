// 게임오버 결과창 아이템 칸을 26 → 42칸으로 늘린다(이번 판 획득물: 다이아/뽑기권/장비/주문서 표시용, 2026-09-30).
// ItemSlot_25를 그대로 본떠 ItemSlot_26 ~ ItemSlot_41을 만든다. 이미 있으면 건너뛰므로 다시 돌려도 안전하다.
const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");

const FILE = "ui/GameOverGroup.ui";
const LIST = "GameOverBack/GameOverPanel/ScoreBox/ItemScrollArea/ItemList";
const FROM = 26, TO = 41;
const T = "MOD.Core.UITransformComponent";
const S = "MOD.Core.SpriteGUIRendererComponent";
const TXT = "MOD.Core.TextComponent";
const TGUI = "MOD.Core.TextGUIRendererComponent";

const b = UIBuilder.read(FILE);
const clone = (o) => JSON.parse(JSON.stringify(o));
const src = `${LIST}/ItemSlot_25`;
const srcSlotSprite = b.getComponent(src, S);
const srcIconT = b.getComponent(`${src}/Icon`, T);
const srcIconS = b.getComponent(`${src}/Icon`, S);
const srcTextT = b.getComponent(`${src}/CountText`, T);
const srcTextS = b.getComponent(`${src}/CountText`, S);
const srcText = b.getComponent(`${src}/CountText`, TXT);

let made = 0;
for (let i = FROM; i <= TO; i++) {
  const slot = `${LIST}/ItemSlot_${i}`;
  if (b.find(slot)) continue;
  // 2행 격자(세로 먼저 채움): 열 간격 136, 윗줄 y=-65 / 아랫줄 y=-201 — 실제 자리는 런타임에 ScrollLayoutGroup이 다시 잡는다
  const col = Math.floor(i / 2);
  const x = 10 + col * 136;
  const y = i % 2 === 0 ? -65 : -201;
  b.sprite(slot, { anchor: "top-left", pos: [x, y], rect_size: [120, 120], pivot: [0, 0.5] });
  b.upsertComponent(slot, S, clone(srcSlotSprite));
  b.patch(slot, { display_order: i });

  b.sprite(`${slot}/Icon`, { anchor: "middle-center", pos: [0, 8], rect_size: [70.56, 70.56] });
  b.upsertComponent(`${slot}/Icon`, T, clone(srcIconT));
  b.upsertComponent(`${slot}/Icon`, S, clone(srcIconS));
  b.patch(`${slot}/Icon`, { display_order: 0 });

  b.text(`${slot}/CountText`, "x0", { anchor: "middle-center", pos: [0, -42], rect_size: [110, 30] });
  if (b.hasComponent(`${slot}/CountText`, TGUI)) b.removeComponent(`${slot}/CountText`, TGUI);
  b.upsertComponent(`${slot}/CountText`, T, clone(srcTextT));
  b.upsertComponent(`${slot}/CountText`, S, clone(srcTextS));
  b.upsertComponent(`${slot}/CountText`, TXT, clone(srcText));
  b.patch(`${slot}/CountText`, { display_order: 1 });
  made++;
}
console.log("new slots:", made);
b.write(FILE, { strict: false }); // 스크롤 목록이라 화면 밖 칸(L013)은 정상

const check = UIBuilder.read(FILE);
for (const i of [25, 26, 41]) {
  const p = `${LIST}/ItemSlot_${i}`;
  console.log(i, check.find(p).componentNames, "|", check.find(p + "/Icon").componentNames, "|", check.find(p + "/CountText").componentNames);
}

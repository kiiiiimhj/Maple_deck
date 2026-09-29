// 모험 지원 패스 팝업: 원래 비용(💎10 / 💎5) 취소선을 눈에 보이게 — 유저 2026-09-30 "줄 보이지도 않아".
// 글자 취소선(<s>)은 글자색(연갈색)과 같고 얇아서 안 보였다 → <s>를 빼고, 다이아 아이콘+숫자 위를 가로지르는
// 빨간 막대(Strike) 스프라이트를 따로 얹는다(시안과 같은 모양). 위치는 지금 파일의 DiaIcon/Cost 좌표에서 계산한다.
const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");

const F = "ui/AdventurePassGroup.ui";
const b = UIBuilder.load(F);
const TX = "MOD.Core.TextGUIRendererComponent";
const TF = "MOD.Core.UITransformComponent";
const RED = { r: 0.9, g: 0.16, b: 0.13, a: 1 };

function tf(path) { return b.getComponent(path, TF); }

// 숫자 폭(글씨 크기 기준 대략): "10" ≈ 2자, "5" ≈ 1자
const rows = [
  { row: "RowCard", text: "10", digits: 2 },
  { row: "RowReroll", text: "5<color=#C07800>x3</color>", digits: 1 },
];
for (const r of rows) {
  const R = `Panel/${r.row}`;
  if (!b.find(`${R}/DiaIcon`) || !b.find(`${R}/Cost`)) { console.log("skip " + r.row); continue; }
  b.patchComponent(`${R}/Cost`, TX, { Text: r.text });
  const icon = tf(`${R}/DiaIcon`), cost = tf(`${R}/Cost`), cc = b.getComponent(`${R}/Cost`, TX);
  const iconL = icon.anchoredPosition.x - icon.RectSize.x / 2;
  const costL = cost.anchoredPosition.x - cost.RectSize.x / 2;            // 왼쪽 정렬
  const numR = costL + (cc.FontSize || 24) * 0.62 * r.digits;             // 숫자 끝
  const left = iconL - 4, right = numR + 4;
  b.sprite(`${R}/Strike`, {
    pos: [(left + right) / 2, icon.anchoredPosition.y - 1], rect_size: [right - left, 5],
    color: RED, alpha: 1, raycast: false,
  });
  console.log(r.row, "strike", Math.round(left), "~", Math.round(right));
}
b.write(F);

// 레이드 액자(Frame) 안쪽 배경 덮임 문제 — 2차 수정 (2026-09-22)
//
// 1차 시도(BLEED 40 × 4방향)가 과했다. 유저 리포트: "좌우 하단이 짤린다".
// → 네 방향 모두 원래 값으로 되돌리고, 실제로 새던 **오른쪽만** 물린다.
//
// 구조: 배경 큰 이미지(3320x2480) 한 장을 BgTop/BgBottom/BgLeft/BgRight 4개의 마스크 창으로
// 잘라 보여준다. 가운데 비어 있는 사각형(= 구멍)으로 레이드 월드가 보인다.
// 각 Bg*는 alpha 0 컨테이너 + MaskComponent, 자식 Img는 화면 중앙 고정(Img.pos == -Bg.pos).
//
// 좌표 근거:
//   Frame 중심 x = -24.4208 (1400x1400 스프라이트)
//   원본 구멍 왼쪽 안쪽 가장자리 = -568  → Frame 중심에서 543.58px (이쪽은 안 샜음 = 안전 마진)
//   원본 구멍 오른쪽 안쪽 가장자리 = 588 → Frame 중심에서 612.42px (여기서 샜음)
//   → 오른쪽도 왼쪽과 같은 543.58px 마진이 되도록 -24.4208 + 543.58 = 519.16 으로 당긴다.
//   (= 오른쪽만 68.8px 추가로 덮음. 상/하/좌는 원본 그대로.)
//
// 바깥쪽 가장자리는 절대 건드리지 않는다(배경이 화면 밖까지 덮고 있어야 함).
// 창 크기를 바꾸면 중심이 움직이므로 자식 Img.pos = -(새 Bg.pos)로 같이 고친다.
const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");

const UI_PATH = "ui/RaidGroup.ui";

// [이름, 축, dir(안쪽 방향), 목표 안쪽 가장자리]
const TARGETS = [
  ["BgLeft", "x", +1, -568], // 원복
  ["BgRight", "x", -1, 519.16], // 원복(588) + 오른쪽만 추가 물림
  ["BgTop", "y", -1, 307.5], // 원복
  ["BgBottom", "y", +1, -364.5], // 원복
];

const b = UIBuilder.load(UI_PATH);

for (const [name, axis, dir, targetInner] of TARGETS) {
  const t = b.getComponent(name, "MOD.Core.UITransformComponent");
  const pos = { x: t.anchoredPosition.x, y: t.anchoredPosition.y };
  const size = { x: t.RectSize.x, y: t.RectSize.y };

  const half = size[axis] / 2;
  const inner = pos[axis] + dir * half;
  const outer = pos[axis] - dir * half; // 바깥쪽 가장자리 = 고정
  const newSize = Math.abs(targetInner - outer);
  const newPos = (targetInner + outer) / 2;

  const sizeArr = axis === "x" ? [newSize, size.y] : [size.x, newSize];
  const posArr = axis === "x" ? [newPos, pos.y] : [pos.x, newPos];

  b.patch(name, { pos: posArr, rect_size: sizeArr });
  b.patch(`${name}/Img`, { pos: [-posArr[0], -posArr[1]] });

  console.log(`${name}: inner ${inner} -> ${targetInner} (outer ${outer} 고정)`);
}

b.write(UI_PATH, { strict: false });

const after = UIBuilder.load(UI_PATH);
for (const [name, axis, dir] of TARGETS) {
  const t = after.getComponent(name, "MOD.Core.UITransformComponent");
  const i = after.getComponent(`${name}/Img`, "MOD.Core.UITransformComponent");
  const p = { x: t.anchoredPosition.x, y: t.anchoredPosition.y };
  const s = { x: t.RectSize.x, y: t.RectSize.y };
  console.log(
    `RESULT ${name} pos=(${p.x}, ${p.y}) size=(${s.x}, ${s.y})` +
      ` inner=${p[axis] + (dir * s[axis]) / 2}` +
      ` | Img pos=(${i.anchoredPosition.x}, ${i.anchoredPosition.y})`
  );
}

// 인트로 만화 2차 보정 — 그림 파일 가장자리의 투명 여백을 빼고 "실제 그림 영역"이 칸을 덮게 한다.
// 3번 컷은 파일 아래 ~10%가 투명이라 흰 칸 바탕이 띠처럼 보였다(6번 컷도 아래 ~2.6%).
// 값은 계정 썸네일(64px)에서 잰 텍스처 상자(T) / 불투명 그림 상자(C) — 픽셀 단위 비율만 쓴다.
const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");

const FILE = "ui/IntroComicGroup.ui";
const COVER = 1.04; // 그림 영역이 칸보다 이만큼 크게(가장자리 살짝 잘림)
// tw,th = 텍스처 크기 / cl,ct,cr,cb = 그림 영역이 텍스처 가장자리에서 떨어진 칸 수
const TEX = {
  1: { tw: 64, th: 28, cl: 0, ct: 0, cr: 0, cb: 0 },
  2: { tw: 63, th: 40, cl: 0, ct: 0, cr: 0, cb: 0 },
  3: { tw: 64, th: 21, cl: 0, ct: 0, cr: 1, cb: 2 },
  4: { tw: 64, th: 33, cl: 0, ct: 0, cr: 0, cb: 0 },
  5: { tw: 64, th: 39, cl: 0, ct: 0, cr: 0, cb: 0 },
  6: { tw: 64, th: 39, cl: 0, ct: 0, cr: 0, cb: 1 },
  7: { tw: 64, th: 61, cl: 0, ct: 0, cr: 0, cb: 0 },
};

const b = UIBuilder.load(FILE);
for (let i = 1; i <= 7; i++) {
  const t = TEX[i];
  const frame = b.getComponent(`Screen/Cut${i}/Frame`, "MOD.Core.UITransformComponent");
  const iw = frame.RectSize.x, ih = frame.RectSize.y;
  const fx = (t.tw - t.cl - t.cr) / t.tw; // 그림 영역이 텍스처 폭에서 차지하는 비율
  const fy = (t.th - t.ct - t.cb) / t.th;
  // 텍스처 크기 W×H(비율 tw:th 고정) — 그림 영역(W*fx × H*fy)이 칸×COVER를 덮는 최소 크기
  let W = (iw * COVER) / fx;
  let H = W * t.th / t.tw;
  if (H * fy < ih * COVER) { H = (ih * COVER) / fy; W = H * t.tw / t.th; }
  // 그림 영역의 가운데가 칸 가운데에 오도록 텍스처를 옮긴다(투명 여백 쪽으로 밀어낸다)
  const ox = (t.cl - t.cr) / t.tw * W / 2 * -1;
  const oy = (t.cb - t.ct) / t.th * H / 2 * -1;
  b.patch(`Screen/Cut${i}/Frame/Img`, { rect_size: [Math.round(W), Math.round(H)], pos: [Math.round(ox), Math.round(oy)] });
  console.error(`cut${i} frame ${iw}x${ih} -> img ${Math.round(W)}x${Math.round(H)} offset (${ox.toFixed(1)}, ${oy.toFixed(1)})`);
}
b.write(FILE);

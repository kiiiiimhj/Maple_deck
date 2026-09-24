// 첫 설치 인트로 만화(유저 지정 2026-09-24) — ui/IntroComicGroup.ui 생성.
// 흰 바탕 위에 검은 테두리 컷 7장(1~2 / 3~4 / 5~7 세 줄)과 자막·안내·건너뛰기. 컷 등장 연출은 IntroComicUI.mlua가 한다.
const path = require("path");
const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");

const SOLID = "4fea64a3307cda641809ad8be0d4890b"; // 출석 딤과 같은 단색 스프라이트(UI용)
const BORDER = 6;       // 검은 테두리 두께
const GAP = 16;         // 컷 사이 흰 여백
const COVER = 1.03;     // 그림을 안쪽 칸보다 살짝 크게 — 비율 오차로 흰 틈이 안 보이게(마스크가 잘라낸다)

// 컷 RUID와 실측 비율(가로/세로, 계정 썸네일 알파 기준 ±3%)
const CUTS = [
  { ruid: "288951db7c664049a725046c38a21b9c", aspect: 2.286 },
  { ruid: "183cee78e4224891892945240475217e", aspect: 1.575 },
  { ruid: "36cae2968cff484a93b9cd9f37297fef", aspect: 3.316 },
  { ruid: "39ddcd79a0ed4c8d990e21c7f59cf097", aspect: 1.939 },
  { ruid: "6f850c9fa1654e34b8104298d693b8e2", aspect: 1.641 },
  { ruid: "260edd1afa9e40bb820e4944b8fbe578", aspect: 1.684 },
  { ruid: "d0efb70f58b54436b0ee8df30629c8ee", aspect: 1.049 },
];
// 줄 구성과 줄 높이(모바일 캔버스 세로 ≈1027 안에 들어가게 위 끝 495 ~ 셋째 줄 아래 -395)
const ROWS = [
  { cuts: [0, 1], h: 328 },
  { cuts: [2, 3], h: 242 },
  { cuts: [4, 5, 6], h: 288 },
];
const TOP = 495;

const b = new UIBuilder("IntroComicGroup", 25, true);
b.patchComponent("/", "MOD.Core.UIGroupComponent", { GroupType: 2 });

// 전체 화면(평소 꺼짐 — 스크립트가 켠다). CanvasGroup으로 통째로 페이드
b.empty("Screen", { anchor: "stretch", pos: [0, 0], rect_size: [1920, 1080], enable: false });
b.addComponent("Screen", "MOD.Core.CanvasGroupComponent", { "@type": "MOD.Core.CanvasGroupComponent", Enable: true, GroupAlpha: 1, BlocksRaycasts: true, Interactable: true, IgnoreParentGroups: false });

// 흰 바탕 = 화면 아무 데나 누르면 다음 컷(버튼)
b.sprite("Screen/Bg", { anchor: "stretch", pos: [0, 0], rect_size: [1920, 1080], image_ruid: SOLID, sprite_type: 0, color: "#FFFFFF", alpha: 1, raycast: true });
b.addComponent("Screen/Bg", "MOD.Core.ButtonComponent");

let y = TOP;
ROWS.forEach((row, r) => {
  const widths = row.cuts.map((i) => Math.round(row.h * CUTS[i].aspect));
  const total = widths.reduce((a, c) => a + c, 0) + GAP * (row.cuts.length - 1);
  let x = -total / 2;
  const cy = y - row.h / 2;
  row.cuts.forEach((i, k) => {
    const w = widths[k];
    const name = `Screen/Cut${i + 1}`;
    const cx = x + w / 2;
    // 검은 테두리 판 = 컷 본체(연출은 이 엔티티를 움직인다)
    b.sprite(name, { anchor: "middle-center", pos: [Math.round(cx), Math.round(cy)], rect_size: [w, row.h], image_ruid: SOLID, sprite_type: 0, color: "#000000", alpha: 1, raycast: false, pivot: [0.5, 0.5] });
    b.addComponent(name, "MOD.Core.CanvasGroupComponent", { "@type": "MOD.Core.CanvasGroupComponent", Enable: true, GroupAlpha: 1, BlocksRaycasts: false, Interactable: false, IgnoreParentGroups: false });
    // 안쪽 칸(마스크) — 흰 바탕 위에 그림
    const iw = w - BORDER * 2;
    const ih = row.h - BORDER * 2;
    b.mask(`${name}/Frame`, { anchor: "middle-center", pos: [0, 0], rect_size: [iw, ih], image_ruid: SOLID, color: "#FFFFFF", alpha: 1, pivot: [0.5, 0.5] });
    // 그림은 실측 비율 그대로, 안쪽 칸을 빈틈없이 덮는 크기(cover)
    let pw = iw * COVER;
    let ph = pw / CUTS[i].aspect;
    if (ph < ih * COVER) { ph = ih * COVER; pw = ph * CUTS[i].aspect; }
    b.sprite(`${name}/Frame/Img`, { anchor: "middle-center", pos: [0, 0], rect_size: [Math.round(pw), Math.round(ph)], image_ruid: CUTS[i].ruid, sprite_type: 0, color: "#FFFFFF", alpha: 1, raycast: false, pivot: [0.5, 0.5] });
    x += w + GAP;
  });
  y -= row.h + GAP;
});

// 자막(아래 가운데) — 문구는 IntroComicUI.SubtitleKeys에 번역 키를 넣으면 컷마다 바뀐다. 지금은 비어 있음
b.text("Screen/Subtitle", "", { size: 36, bold: true, color: "#1A1A1A", alignment: 4, anchor: "middle-center", pos: [0, -450], rect_size: [1500, 90], overflow: 0, bestfit: true, min_size: 20, max_size: 36 });
// 다 보여준 뒤 "화면을 터치하면 계속"
b.text("Screen/TapHint", "UI_INTROCOMICGROUP_001", { size: 26, color: "#555555", alignment: 4, anchor: "middle-center", pos: [0, -450], rect_size: [800, 50], enable: false });
b.patch("Screen/TapHint", { localize: true });
// 건너뛰기(왼쪽 위) — 오른쪽 위는 MSW 기본 버튼(친구/⋯)이 PC·모바일 모두 덮는다
b.button("Screen/SkipBtn", "UI_INTROCOMICGROUP_002", { anchor: "top-left", pos: [40, -30], rect_size: [180, 64], font_size: 26, color: "#FFFFFF", bg_color: { r: 0, g: 0, b: 0, a: 0.55 } });
b.patch("Screen/SkipBtn", { localize: true });

b.write("ui/IntroComicGroup.ui");

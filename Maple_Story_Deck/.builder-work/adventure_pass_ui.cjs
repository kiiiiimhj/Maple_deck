// 모험 지원 패스(30일 이용권) — 팝업 모양 + 로비 동그라미 버튼 (유저 지정 2026-09-29).
// 1단계: 모양만(글자/동작 없음). 좌표는 유저 목업 스크린샷(1332x956)을 측정해 중심 기준으로 옮긴 값이고,
// 크기는 스프라이트 원본 비율 그대로(유저가 Maker에서 다듬는다).
// ⚠ 최초 생성용 — 재실행하면 AdventurePassGroup.ui를 새로 만들어 UUID가 바뀐다(유저가 다듬은 뒤엔 다시 돌리지 말 것).
const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");

const WHITE = { r: 1, g: 1, b: 1, a: 1 };
const RUID = {
  board: "c52b512a65a6400dad3e53ec08d1a84f",    // 나무 판(1448x1086)
  ribbon: "43726211cca24f6f848e574a45676c02",   // 빨간 리본+왕관(2172x724) — 판 위에 겹침
  close: "c4d01698b4784015ae93335bb32ef7b4",    // X 버튼(1254x1254)
  price: "96c516f00fb8457ca34ddf99e213d020",    // 노란 가격 버튼(2172x724)
  rowCard: "4b63d39eb68b4e61b1d63ff156a12f08",  // 02 카드 항목(916x225)
  rowReroll: "e3d99c0b0a394eed899f60c4a6448584",// 03 새로고침 항목(916x217)
  rowPotion: "adaa6a4a7a0841e5bfdf02fe7d77be1d",// 04 포션 항목(916x203)
  deco: "50722a685a6e4a1f80301f9fc2032abc",     // 01 왼쪽 장식(725x833)
  icon: "64caab2f9826455c89afe815534656aa",     // 로비 아이콘(1254x1254)
  dim: "4fea64a3307cda641809ad8be0d4890b",      // AttendanceGroup Dimmer와 같은 에셋
};

// ── 팝업 (AttendanceGroup과 같은 구성: 딤 + Panel, GroupOrder 17 / GroupType 1 / DefaultShow false) ──
const P = new UIBuilder("AdventurePassGroup", 1, false);
P.patchComponent("AdventurePassGroup", "MOD.Core.UIGroupComponent", { DefaultShow: false, GroupOrder: 17, GroupType: 1 });
P.sprite("Dimmer", { anchor: "stretch", pos: [0, 0], rect_size: [1920, 1080], image_ruid: RUID.dim, sprite_type: 0, color: { r: 0, g: 0, b: 0, a: 0.65 }, raycast: true });
P.empty("Panel", { rect_size: [1240, 860] });
const spr = (name, ruid, pos, size) => P.sprite(`Panel/${name}`, { image_ruid: ruid, sprite_type: 0, color: WHITE, pos, rect_size: size });
// 그리기 순서 = 나중 자식이 위: 판 → 항목 3줄 → 가격 → 리본 → 왼쪽 장식 → 닫기
spr("Board", RUID.board, [114, -20], [950, 712]);
spr("RowCard", RUID.rowCard, [194, 44], [490, 120]);
spr("RowReroll", RUID.rowReroll, [194, -77], [490, 116]);
spr("RowPotion", RUID.rowPotion, [194, -191], [490, 109]);
P.button("Panel/BtnBuy", "", { image_ruid: RUID.price, sprite_type: 0, bg_color: WHITE, pos: [111, -345], rect_size: [640, 213] });
spr("Ribbon", RUID.ribbon, [126, 260], [960, 320]);
spr("LeftDeco", RUID.deco, [-295, -21], [629, 723]);
P.button("Panel/BtnClose", "", { image_ruid: RUID.close, sprite_type: 0, bg_color: WHITE, pos: [537, 234], rect_size: [110, 110] });
P.write("ui/AdventurePassGroup.ui");

// ── 로비 동그라미 버튼: AttendanceButton(왼쪽 열, 156x156 동그라미 패널 + Overlay 아이콘) 복제, 출석 아래 ──
const FILE = "ui/TitleGroup.ui";
const T = UIBuilder.load(FILE);
const clone = (o) => JSON.parse(JSON.stringify(o));
function copyEntity(srcPath, dstPath, patchFn) {
  const src = T.find(srcPath);
  if (!src) throw new Error("missing " + srcPath);
  const js = src.jsonString;
  const comps = clone(js["@components"]);
  patchFn(comps);
  T._add(dstPath, src.componentNames, js.origin.entry_id, js.modelId, comps, js.enable);
  const d = T.find(dstPath).jsonString;
  d.visible = js.visible;
  d.localize = js.localize;
}
const tf = (comps) => comps.find((c) => c["@type"] === "MOD.Core.UITransformComponent");
const sg = (comps) => comps.find((c) => c["@type"] === "MOD.Core.SpriteGUIRendererComponent");
if (!T.find("AdventurePassButton")) {
  copyEntity("AttendanceButton", "AdventurePassButton", (c) => { tf(c).anchoredPosition.y = 155; });
  copyEntity("AttendanceButton/Overlay", "AdventurePassButton/Overlay", (c) => {
    sg(c).ImageRUID = { DataId: RUID.icon };
    tf(c).RectSize = { x: 124, y: 124 };
  });
} else {
  console.log("skip existing AdventurePassButton");
}
T.write(FILE, { strict: false });

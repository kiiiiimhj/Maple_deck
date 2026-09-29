// 모험 지원 패스 팝업 2단계: 글자 추가(유저가 다듬은 AdventurePassGroup.ui를 load해서 그 위에 얹는다 — 모양 엔티티는 안 건드림)
// + 로비 버튼을 뽑기 버튼(BattlePanel/GachaIcon, y 96.5) 아래로 / 운영자 "관리" 버튼을 더 아래로.
// 재실행 안전: 이미 있는 글자 엔티티는 같은 경로 upsert(위치를 다듬은 뒤엔 다시 돌리지 말 것).
const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");

const FILE = "ui/AdventurePassGroup.ui";
const b = UIBuilder.load(FILE);
const TX = "MOD.Core.TextGUIRendererComponent";
const BROWN_OUT = { r: 0.227450982, g: 0.13333334, b: 0.0627451, a: 1 };
const DIA = "81462aeb825b4660991cef05651271cf";   // 로비 다이아 배지 아이콘과 같은 에셋

// key: 번역 키(IsLocalizationKey) / raw: 고정 글자(숫자·FREE 등)
function label(path, textOrKey, o) {
  b.text(path, textOrKey, {
    size: o.size, bold: true, alignment: o.align ?? 4, pos: o.pos, rect_size: o.rect,
    bestfit: true, min_size: o.min ?? 12, max_size: o.size, outline: !!o.outline,
  });
  const patch = { Font: "Maple", FontStyle: 1, FontColor: o.color, IsLocalizationKey: !!o.key, IsRichText: true };
  if (o.outline) { patch.OutlineColor = o.outlineColor || BROWN_OUT; patch.OutlineWidth = o.outlineWidth ?? 0.2; }
  b.patchComponent(path, TX, patch);
}

// 제목(리본 위) + 부제(리본 아래) — 리본 기준 자식이라 리본을 옮기면 같이 따라간다
label("Panel/Ribbon/Title", "UI_ADVENTUREPASSGROUP_001", { key: true, size: 64, pos: [0, 8], rect: [640, 96], color: { r: 1, g: 0.86, b: 0.3, a: 1 }, outline: true, outlineWidth: 0.3 });
label("Panel/Ribbon/Subtitle", "UI_ADVENTUREPASSGROUP_002", { key: true, size: 28, pos: [0, -118], rect: [640, 44], color: { r: 1, g: 0.95, b: 0.84, a: 1 }, outline: true });

// 혜택 3줄 — 줄 이미지(490 폭) 왼쪽 ~125px는 아이콘 자리라 글자는 그 오른쪽부터
const NAME_C = { r: 0.29, g: 0.16, b: 0.07, a: 1 };
const DESC_C = { r: 0.48, g: 0.32, b: 0.19, a: 1 };
const COST_C = { r: 0.6, g: 0.48, b: 0.35, a: 1 };
function row(rowName, nameKey, descKey, costRaw) {
  const R = `Panel/${rowName}`;
  label(`${R}/Name`, nameKey, { key: true, size: 28, align: 3, pos: [-30, 18], rect: [240, 40], color: NAME_C });
  label(`${R}/Desc`, descKey, { key: true, size: 19, align: 3, pos: [-30, -20], rect: [240, 36], color: DESC_C, min: 10 });
  if (costRaw != null) {
    b.sprite(`${R}/DiaIcon`, { image_ruid: DIA, sprite_type: 0, color: { r: 1, g: 1, b: 1, a: 1 }, pos: [80, 0], rect_size: [28, 28] });
    label(`${R}/Cost`, costRaw, { size: 24, align: 3, pos: [118, 0], rect: [60, 36], color: COST_C });
  }
  // FREE 알약: 어두운 갈색 둥근 판 + 노란 글씨(목업과 같은 모양)
  b.panel(`${R}/Free`, { pos: [196, 0], rect_size: [92, 44], color: { r: 0.33, g: 0.17, b: 0.07, a: 1 } });
  label(`${R}/Free/Label`, "FREE", { size: 24, pos: [0, 0], rect: [86, 40], color: { r: 1, g: 0.85, b: 0.29, a: 1 } });
}
row("RowCard", "UI_ADVENTUREPASSGROUP_003", "UI_ADVENTUREPASSGROUP_004", "<s>10</s>");
row("RowReroll", "UI_ADVENTUREPASSGROUP_005", "UI_ADVENTUREPASSGROUP_006", "<s>5</s><color=#C07800>x3</color>");
row("RowPotion", "UI_ADVENTUREPASSGROUP_007", "UI_ADVENTUREPASSGROUP_008", null);

// 가격 버튼 글자(스크립트가 "1,320 코인 / 30일"로 채운다) + 이용 중 남은 기간(버튼 위, 이용 중일 때만 켬)
b.patchComponent("Panel/BtnBuy", TX, { Font: "Maple", FontStyle: 1, FontSize: 44, FontColor: { r: 0.36, g: 0.18, b: 0.05, a: 1 }, IsLocalizationKey: false, BestFit: true, MinSize: 16, MaxSize: 44, Text: "1,320" });
label("Panel/RemainText", "", { size: 24, pos: [185, -262], rect: [560, 36], color: { r: 1, g: 0.95, b: 0.84, a: 1 }, outline: true });
b.patch("Panel/RemainText", { enable: false });

b.write(FILE, { bind: { mlua: "RootDesk/MyDesk/AdventurePass/AdventurePassUI.mlua", props: {
  popupGroup: "/ui/AdventurePassGroup",
  btnBuy: "Panel/BtnBuy",
  btnClose: "Panel/BtnClose",
  dimmer: "Dimmer",
  priceText: "Panel/BtnBuy",
  remainText: "Panel/RemainText",
} } });

// ── 로비 버튼: 뽑기 버튼(y 96.5) 아래 한 칸(버튼 156 + 간격 20) ──
const T = UIBuilder.load("ui/TitleGroup.ui");
T.patch("AdventurePassButton", { pos: [48, -80] });
T.write("ui/TitleGroup.ui", { strict: false, bind: { mlua: "RootDesk/MyDesk/AdventurePass/AdventurePassUI.mlua", props: {
  lobbyButton: "AdventurePassButton",
} } });

// ── 운영자 "관리" 버튼(운영자에게만 보임)이 새 버튼과 겹치지 않게 더 아래로 ──
const A = UIBuilder.load("ui/AdminLookupGroup.ui");
A.patch("OpenBtn", { pos: [12, -250] });
A.write("ui/AdminLookupGroup.ui");

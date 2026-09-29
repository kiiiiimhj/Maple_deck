// 운영자 조회 창에 "랭킹" 버튼 추가(유저 지정 2026-09-29 — 랭커 생존 시간 확인용).
// BtnRecent를 복제해 Panel/BtnRank를 만들고, 한 줄에 들어가도록 Input/조회 버튼 위치를 조정한다.
//   Input(-455, w470) / BtnRank(-100, w220) / BtnLookup(115) / BtnRecent(340) / BtnClose(575)
// 재실행해도 BtnRank가 이미 있으면 복제는 건너뛴다(같은 경로 삭제→재생성 금지).
const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");

const FILE = "ui/AdminLookupGroup.ui";
const P = "Window/Panel";
const b = UIBuilder.load(FILE);
const clone = (o) => JSON.parse(JSON.stringify(o));
const TX = ["MOD.Core.TextComponent", "MOD.Core.TextGUIRendererComponent"];

function transformOf(path) {
  const e = b.find(path);
  if (!e) throw new Error("missing " + path);
  return e.jsonString["@components"].find((c) => c["@type"] === "MOD.Core.UITransformComponent");
}

function setPos(path, x, w) {
  const t = transformOf(path);
  t.anchoredPosition.x = x;
  if (w != null) t.RectSize.x = w;
}

const dst = `${P}/BtnRank`;
if (!b.find(dst)) {
  const src = b.find(`${P}/BtnRecent`);
  const js = src.jsonString;
  const comps = clone(js["@components"]);
  const tx = comps.find((c) => TX.includes(c["@type"]));
  if (tx) { tx.Text = "UI_ADMINLOOKUPGROUP_006"; tx.IsLocalizationKey = true; }
  b._add(dst, src.componentNames, js.origin.entry_id, js.modelId, comps, js.enable);
  const d = b.find(dst).jsonString;
  d.visible = js.visible;
  d.localize = js.localize;
} else {
  console.log("skip existing " + dst);
}

setPos(`${P}/Input`, -455, 470);
setPos(dst, -100, 220);
setPos(`${P}/BtnLookup`, 115);
setPos(`${P}/BtnRecent`, 340);
setPos(`${P}/BtnClose`, 575);

b.write(FILE, { strict: false, bind: { mlua: "RootDesk/MyDesk/Admin/PlayLogLogic.mlua", props: {
  btnRank: dst,
} } });

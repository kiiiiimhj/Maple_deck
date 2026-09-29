// 스킬/유물 탭 "전체 / 강화 가능" 필터 드롭다운(유저 지정 2026-09-29) — 등급 필터(GradeFilterBtn/List)를 복제한다.
//   스킬: SkillPanel/UpgradeFilterBtn(-45,460) + UpgradeFilterList(옵션 2개) — 캐릭터 필터(-225) 오른쪽
//   유물: RelicPanel/UpgradeFilterBtn(-405,460) + UpgradeFilterList — 유물 탭엔 다른 필터가 없어 등급 필터 자리
// 재실행해도 이미 있으면 건너뛴다(같은 경로 삭제→재생성 금지). 바인딩은 SkillUI/RelicUI에 주입.
const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");

const FILE = "ui/TitleGroup.ui";
const b = UIBuilder.load(FILE);
const clone = (o) => JSON.parse(JSON.stringify(o));
const TX = ["MOD.Core.TextComponent", "MOD.Core.TextGUIRendererComponent"];

function copyEntity(srcPath, dstPath, opts = {}) {
  const src = b.find(srcPath);
  if (!src) throw new Error("missing " + srcPath);
  const js = src.jsonString;
  const comps = clone(js["@components"]);
  const t = comps.find((c) => c["@type"] === "MOD.Core.UITransformComponent");
  if (opts.pos) { t.anchoredPosition.x = opts.pos[0]; t.anchoredPosition.y = opts.pos[1]; }
  if (opts.size) { t.RectSize.x = opts.size[0]; t.RectSize.y = opts.size[1]; }
  if (opts.text != null) {
    const tx = comps.find((c) => TX.includes(c["@type"]));
    if (tx) { tx.Text = opts.text; tx.IsLocalizationKey = true; }
  }
  b._add(dstPath, src.componentNames, js.origin.entry_id, js.modelId, comps, opts.enable != null ? opts.enable : js.enable);
  const dst = b.find(dstPath).jsonString;
  dst.visible = js.visible;
  dst.localize = js.localize;
}

function build(panel, x) {
  const btn = `${panel}/UpgradeFilterBtn`;
  if (b.find(btn)) { console.log("skip existing " + btn); return; }
  // 등급 필터는 SkillPanel에만 있다 — 유물 쪽도 같은 원본을 복제
  copyEntity("SkillPanel/GradeFilterBtn", btn, { pos: [x, 460], text: "MLUA_SKILLUI_001" });
  // 목록: 버튼 아래 끝(460-25=435)에서 시작, 옵션 2개(높이 100)
  copyEntity("SkillPanel/GradeFilterList", `${panel}/UpgradeFilterList`, { pos: [x, 385], size: [170, 100], enable: false });
  copyEntity("SkillPanel/GradeFilterList/btnGradeAll", `${panel}/UpgradeFilterList/btnUpgAll`, { pos: [0, 25], text: "UI_EQUIPMENTGROUP_007" });
  copyEntity("SkillPanel/GradeFilterList/btnGradeNormal", `${panel}/UpgradeFilterList/btnUpgOnly`, { pos: [0, -25], text: "MLUA_SKILLUI_003" });
}

build("SkillPanel", -45);
build("RelicPanel", -405);

b.write(FILE, { strict: false, bind: { mlua: "RootDesk/MyDesk/UI/SkillUI.mlua", props: {
  upgradeFilterBtn: "SkillPanel/UpgradeFilterBtn",
  upgradeFilterList: "SkillPanel/UpgradeFilterList",
  btnUpgAll: "SkillPanel/UpgradeFilterList/btnUpgAll",
  btnUpgOnly: "SkillPanel/UpgradeFilterList/btnUpgOnly",
} } });
UIBuilder.load(FILE).injectBindings("RootDesk/MyDesk/UI/RelicUI.mlua", {
  upgradeFilterBtn: "RelicPanel/UpgradeFilterBtn",
  upgradeFilterList: "RelicPanel/UpgradeFilterList",
  btnUpgAll: "RelicPanel/UpgradeFilterList/btnUpgAll",
  btnUpgOnly: "RelicPanel/UpgradeFilterList/btnUpgOnly",
});

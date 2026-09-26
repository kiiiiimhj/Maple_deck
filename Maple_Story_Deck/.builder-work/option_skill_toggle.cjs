// 옵션 팝업에 "스킬 선택(한 번/두 번 터치)" 토글 추가 (2026-09-26)
// 배경음(-220) / 효과음(0) / 스킬 선택(220)으로 가로 3칸 배치. 새 토글은 배경음 토글의 컴포넌트를 그대로 복제한다.
const path = require("path");
const { UIBuilder } = require(path.join(__dirname, "../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs"));

const UI = path.join(__dirname, "../ui/OptionGroup.ui");
const b = UIBuilder.load(UI);

const clone = (o) => JSON.parse(JSON.stringify(o));
const comps = (p) => b.find(p).jsonString["@components"];

b.patch("OptionPanel/BgmToggle", { pos: [-220, 130] });
b.patch("OptionPanel/SfxToggle", { pos: [0, 130] });

const exists = !!b.find("OptionPanel/SkillToggle");
if (!exists) {
  b.empty("OptionPanel/SkillToggle", { pos: [220, 130], rect_size: [200, 220] });
  b.empty("OptionPanel/SkillToggle/Circle", { pos: [0, 30], rect_size: [130, 130] });
  b.empty("OptionPanel/SkillToggle/Label", { pos: [0, -66], rect_size: [180, 40] });
}

for (const part of ["Circle", "Label"]) {
  for (const c of comps("OptionPanel/BgmToggle/" + part)) {
    if (c["@type"] === "MOD.Core.UITransformComponent") continue;
    b.upsertComponent("OptionPanel/SkillToggle/" + part, c["@type"], clone(c));
  }
}
b.patchComponent("OptionPanel/SkillToggle/Circle", "MOD.Core.TextGUIRendererComponent", { Text: "한 번" });
b.patchComponent("OptionPanel/SkillToggle/Label", "MOD.Core.TextGUIRendererComponent", { Text: "UI_OPTIONGROUP_010", IsLocalizationKey: true });

// 형제 순서: 기존 토글들과 겹치지 않게 맨 뒤
const siblings = b.listEntities().filter((e) => e.depth === 2 && e.path.startsWith("/ui/OptionGroup/OptionPanel/"));
let maxOrder = 0;
for (const s of siblings) {
  if (s.path.endsWith("/SkillToggle")) continue;
  const o = b.find(s.path).jsonString.displayOrder || 0;
  if (o > maxOrder) maxOrder = o;
}
b.patch("OptionPanel/SkillToggle", { display_order: maxOrder + 1 });

b.write(UI, {
  bind: {
    mlua: path.join(__dirname, "../RootDesk/MyDesk/OptionUI.mlua"),
    props: {
      btnSkillSelect: "OptionPanel/SkillToggle/Circle",
      skillSelectText: "OptionPanel/SkillToggle/Circle",
    },
  },
});

for (const e of b.listEntities()) {
  if (e.path.includes("Toggle")) console.log(e.path, JSON.stringify(e.pos), JSON.stringify(e.size), b.find(e.path).jsonString.displayOrder);
}

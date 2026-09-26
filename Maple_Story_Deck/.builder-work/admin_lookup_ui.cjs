// 운영자 접속 기록 조회 창 (2026-09-25). 최초 생성 전용 — 다시 돌리면 UUID가 바뀌므로 수정은 load→patch로 할 것.
const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");

const TXT = "MOD.Core.TextGUIRendererComponent";
const b = new UIBuilder("AdminLookupGroup");
b.group("AdminLookupGroup", { default_show: true, group_order: 30, group_type: 2 });

// 운영자에게만 켜지는 작은 버튼(왼쪽 가운데)
b.button("OpenBtn", "UI_ADMINLOOKUPGROUP_001", {
  anchor: "middle-left", pos: [12, 0], rect_size: [110, 64], font_size: 24,
  bg_color: { r: 0.1, g: 0.1, b: 0.1, a: 0.6 }, enable: false,
});

// 조회 창
b.empty("Window", { anchor: "stretch", enable: false });
b.sprite("Window/Dim", { anchor: "stretch", color: "#000000", alpha: 0.65, raycast: true, sprite_type: 0,
  image_ruid: "4fea64a3307cda641809ad8be0d4890b" });
b.panel("Window/Panel", { rect_size: [1400, 860], color: { r: 0.08, g: 0.09, b: 0.12, a: 0.97 }, raycast: true });
b.text("Window/Panel/Title", "UI_ADMINLOOKUPGROUP_002", { size: 36, bold: true, color: "#FFFFFF", pos: [0, 385], rect_size: [900, 50] });
b.textInput("Window/Panel/Input", { pos: [-330, 300], rect_size: [600, 70], font_size: 28, char_limit: 40 });
b.button("Window/Panel/BtnLookup", "UI_ADMINLOOKUPGROUP_003", { pos: [100, 300], rect_size: [180, 70], font_size: 28,
  bg_color: { r: 0.2, g: 0.45, b: 0.85, a: 1 } });
b.button("Window/Panel/BtnRecent", "UI_ADMINLOOKUPGROUP_004", { pos: [320, 300], rect_size: [220, 70], font_size: 28,
  bg_color: { r: 0.25, g: 0.3, b: 0.4, a: 1 } });
b.button("Window/Panel/BtnClose", "UI_ADMINLOOKUPGROUP_005", { pos: [575, 300], rect_size: [170, 70], font_size: 28,
  bg_color: { r: 0.45, g: 0.2, b: 0.2, a: 1 } });
b.text("Window/Panel/Result", "", { size: 24, color: "#E8E8E8", pos: [0, -80], rect_size: [1340, 660], overflow: 2 });
b.patchComponent("Window/Panel/Result", TXT, { HorizontalAlignment: 1, VerticalAlignment: 256 });

// 정적 문구 = 번역 키
for (const p of ["OpenBtn", "Window/Panel/Title", "Window/Panel/BtnLookup", "Window/Panel/BtnRecent", "Window/Panel/BtnClose"]) {
  b.patchComponent(p, TXT, { IsLocalizationKey: true, Font: "Maple" });
}

b.write("ui/AdminLookupGroup.ui", {
  lint_verbose: true,
  bind: {
    mlua: "RootDesk/MyDesk/Admin/PlayLogLogic.mlua",
    props: {
      openBtn: "OpenBtn",
      window: "Window",
      input: "Window/Panel/Input",
      btnLookup: "Window/Panel/BtnLookup",
      btnRecent: "Window/Panel/BtnRecent",
      btnClose: "Window/Panel/BtnClose",
      resultText: "Window/Panel/Result",
    },
  },
});

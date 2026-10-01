// 확인창 디자인 통일(유저 지정 2026-10-01): 게임 종료 확인창(OptionGroup/ConfirmPanel)을 기준으로,
// 예전 공용 디자인(배경 27ea2245 / 버튼 988c6f89 등)을 쓰던 확인창들에 "기준과 다른 필드만" 복사한다.
// 문구(Text)·로컬라이즈 키 여부·Enable은 절대 안 바꾼다(feedback-popup-restyle-visual-only). 레이아웃은 위치/크기만.
// 사용: node .builder-work/confirm_restyle_to_option.cjs        → 바뀔 필드만 출력(dry run)
//       node .builder-work/confirm_restyle_to_option.cjs --write → 실제로 쓴다
const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");
const WRITE = process.argv.includes("--write");

const REF_FILE = "ui/OptionGroup.ui";
const REF = "ConfirmPanel";
const SKIP = new Set(["Text", "IsLocalizationKey", "Enable", "@type"]);
const T = "MOD.Core.UITransformComponent";
const LAYOUT_KEYS = ["anchoredPosition", "RectSize", "OffsetMin", "OffsetMax"];
const STYLE_TYPES = ["MOD.Core.SpriteGUIRendererComponent", "MOD.Core.TextGUIRendererComponent"];

// [파일, 대상 루트, {기준 자식: 대상 자식}] — 루트 자체가 배경인 경우 "Bg"를 "" 로 매핑
const targets = [
  ["ui/EquipmentGroup.ui", "Inventory/SellConfirm/Panel", { Bg: "Bg", BtnYes: "BtnYes", BtnNo: "BtnNo", Message: "Message", SubMessage: "SubMessage" }],
  ["ui/RunStartConfirmGroup.ui", "Panel", { Bg: "Bg", BtnYes: "BtnYes", BtnNo: "BtnNo", Message: "Message", SubMessage: "SubMessage" }],
  ["ui/IdleRewardGroup.ui", "ConfirmPanel", { Bg: "Bg", BtnYes: "BtnYes", BtnNo: "BtnNo", Message: "Message", SubMessage: "SubMessage" }],
  ["ui/EquipmentGroup.ui", "Inventory/ComposePopup/Panel/RiskWarning/Box", { Bg: "", BtnYes: "ConfirmButton", BtnNo: "CancelButton", Message: "Text", SubMessage: "SubMessage" }],
];

const ref = UIBuilder.read(REF_FILE);
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const byFile = {};
for (const [file, root, map] of targets) {
  if (!byFile[file]) byFile[file] = UIBuilder.read(file);
  const b = byFile[file];
  for (const [refChild, dstChild] of Object.entries(map)) {
    const rp = `${REF}/${refChild}`;
    const dp = dstChild ? `${root}/${dstChild}` : root;
    if (!b.find(dp)) { console.log("MISSING", file, dp); continue; }
    for (const type of STYLE_TYPES) {
      const rc = ref.getComponent(rp, type);
      const dc = b.getComponent(dp, type);
      if (!rc || !dc) continue;
      const upd = {};
      for (const [k, v] of Object.entries(rc)) if (!SKIP.has(k) && !same(v, dc[k])) upd[k] = v;
      if (Object.keys(upd).length) {
        console.log(file, dp, type.split(".").pop(), Object.keys(upd).join(","));
        if (WRITE) b.patchComponent(dp, type, upd);
      }
    }
    // 레이아웃: 위치·크기만(앵커·피벗은 이미 같은 계열)
    const rt = ref.getComponent(rp, T), dt = b.getComponent(dp, T);
    const lu = {};
    for (const k of LAYOUT_KEYS) if (rt && dt && !same(rt[k], dt[k])) lu[k] = rt[k];
    if (Object.keys(lu).length) {
      console.log(file, dp, "Transform", Object.keys(lu).map((k) => `${k}:${JSON.stringify(dt[k])}->${JSON.stringify(rt[k])}`).join(" "));
      if (WRITE) b.patchComponent(dp, T, lu);
    }
  }
}
if (WRITE) for (const [file, b] of Object.entries(byFile)) b.write(file, { strict: false });
console.log(WRITE ? "written" : "dry run");

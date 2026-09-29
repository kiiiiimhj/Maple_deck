// 로비 모험 지원 패스 버튼에 느낌표(RedDot) — 무료 체험 가능할 때만 켠다(유저 지정 2026-09-30).
// AttendanceButton/RedDot(+Mark)을 그대로 복제(다른 로비 버튼과 같은 모양/자리). 이미 있으면 건너뜀.
const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");

const FILE = "ui/TitleGroup.ui";
const T = UIBuilder.load(FILE);
const clone = (o) => JSON.parse(JSON.stringify(o));
function copyEntity(srcPath, dstPath, enable) {
  const src = T.find(srcPath);
  if (!src) throw new Error("missing " + srcPath);
  const js = src.jsonString;
  T._add(dstPath, src.componentNames, js.origin.entry_id, js.modelId, clone(js["@components"]), enable);
  const d = T.find(dstPath).jsonString;
  d.visible = js.visible;
  d.localize = js.localize;
}
if (!T.find("AdventurePassButton/RedDot")) {
  copyEntity("AttendanceButton/RedDot", "AdventurePassButton/RedDot", false);
  if (T.find("AttendanceButton/RedDot/Mark")) {
    copyEntity("AttendanceButton/RedDot/Mark", "AdventurePassButton/RedDot/Mark", T.find("AttendanceButton/RedDot/Mark").jsonString.enable);
  }
} else {
  console.log("skip existing RedDot");
}
T.write(FILE, { strict: false, bind: { mlua: "RootDesk/MyDesk/AdventurePass/AdventurePassUI.mlua", props: {
  lobbyRedDot: "AdventurePassButton/RedDot",
} } });

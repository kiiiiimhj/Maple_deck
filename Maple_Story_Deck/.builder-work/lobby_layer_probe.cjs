// 에디터에서 로비 버튼이 배경에 가려 보이는 문제 조사: 각 .ui 루트의 GroupType/GroupOrder/DefaultShow,
// TitleGroup 1단계 자식 순서, 로비 버튼처럼 보이는 엔티티(Attendance/Event/Lobby/Btn 이름)가 어느 그룹 어디에 있는지
const fs = require("fs");
const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");
const G = "MOD.Core.UIGroupComponent";
for (const f of fs.readdirSync("ui").filter((n) => n.endsWith(".ui"))) {
  const b = UIBuilder.read("ui/" + f);
  const root = b.entities.find((e) => e.jsonString.path.split("/").length === 3);
  const g = root && (root.jsonString["@components"] || []).find((c) => c["@type"] === G);
  const hits = b.entities.filter((e) => /Lobby|Attendance|Event|Badge|Backdrop|Background$/i.test(e.jsonString.path.split("/").pop()) && e.jsonString.path.split("/").length <= 5)
    .map((e) => e.jsonString.path.replace(`/ui/${f.replace(".ui", "")}/`, "") + (e.jsonString.enable === false ? "(OFF)" : ""));
  console.log(f.padEnd(30), "type", g && g.GroupType, "order", g && g.GroupOrder, "show", g && g.DefaultShow, "rootEnable", root && root.jsonString.enable, hits.length ? "| " + hits.slice(0, 8).join(", ") : "");
}
const t = UIBuilder.read("ui/TitleGroup.ui");
console.log("--- TitleGroup 1단계 자식(파일 순서):");
console.log(t.entities.filter((e) => e.jsonString.path.split("/").length === 4).map((e) => e.jsonString.path.split("/").pop() + (e.jsonString.enable === false ? "(OFF)" : "")).join(", "));

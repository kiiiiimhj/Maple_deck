// 경로|런타임값 목록을 .ui의 IsLocalizationKey/원래 Text와 대조 (읽기 전용)
//   node .builder-work/ks_pathcheck.cjs <목록파일: 한 줄에 "경로|값">
const fs = require("fs");
const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");
const ext = "." + "ui";
const map = {};
for (const file of fs.readdirSync("ui").filter((x) => x.endsWith(ext))) {
  const b = UIBuilder.load("ui/" + file);
  for (const e of b.listEntities()) for (const t of ["MOD.Core.TextComponent", "MOD.Core.TextGUIRendererComponent"]) {
    const c = b.getComponent(e.path, t); if (c && !map[e.path]) map[e.path] = { flag: !!c.IsLocalizationKey, text: c.Text };
  }
}
for (const line of fs.readFileSync(process.argv[2], "utf8").split(/\r?\n/).filter(Boolean)) {
  const [p, v] = line.split("|"); const i = map[p];
  const verdict = !i ? "UNKNOWN(런타임 생성)" : (i.flag ? (i.text === v ? "OK(엔진번역,원래값)" : "OK?(엔진번역 켜짐,값은 코드가 바꿈)") : "BAD(번역설정 꺼짐 → 키 그대로 보임)");
  console.log(`${verdict}  ${p}  now=${v}  ui=${i ? i.text : "-"}`);
}

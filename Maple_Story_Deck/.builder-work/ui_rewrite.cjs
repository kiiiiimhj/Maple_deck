// Maker가 옛 .ui 캐시를 들고 있을 때(플레이 종료 전환 중에 쓴 경우 등) 내용 변화 없이 다시 써서 refresh가 새로 읽게 한다.
// 사용: node .builder-work/ui_rewrite.cjs GachaGroup TitleGroup ...
const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");
for (const name of process.argv.slice(2)) {
  const file = `ui/${name}.ui`;
  UIBuilder.read(file).write(file, { strict: false });
}

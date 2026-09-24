const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");
for (const f of ["ui/EpisodeRewardGroup.ui", "ui/LevelRewardGroup.ui"]) {
  const b = UIBuilder.load(f);
  console.log("==", f);
  for (const e of b.listEntities()) console.log(typeof e === "string" ? e : JSON.stringify(e));
}

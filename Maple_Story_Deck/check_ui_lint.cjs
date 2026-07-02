const path = require("path");
const { UIBuilder } = require(
  path.join(__dirname, ".claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs")
);
const b = UIBuilder.read("ui/DefaultGroup.ui");
b.write("ui/DefaultGroup.ui", { lint: true, strict: false, lint_verbose: true });

const path = require("path");
const { UIBuilder } = require(path.join(__dirname, "..", ".claude", "skills", "msw-ui-system", "scripts", "msw_ui_builder.cjs"));
const b = UIBuilder.load("ui/LoadingGroup.ui");
const findings = b.validate();
console.log("validate findings:", JSON.stringify(findings, null, 1));

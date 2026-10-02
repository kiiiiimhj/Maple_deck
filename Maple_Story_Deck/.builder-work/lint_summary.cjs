// .ui 린트 결과를 규칙 코드별로 세어 보여준다(쉘에서 .ui 직접 못 다루니 node로). 사용: node .builder-work/lint_summary.cjs GachaGroup
const { lintUiFile } = require("../.claude/skills/msw-ui-system/scripts/ui_lint.cjs");
const name = process.argv[2];
const res = lintUiFile(`ui/${name}.ui`);
const findings = Array.isArray(res) ? res : (res.findings || res.issues || []);
const count = {};
for (const f of findings) { const k = `${f.severity || f.level}:${f.code || f.rule}`; count[k] = (count[k] || 0) + 1; }
console.log(JSON.stringify(count));
const sample = findings.filter((f) => (f.severity || f.level) === "ERROR" || (f.severity || f.level) === "error").slice(0, 3);
for (const f of sample) console.log(JSON.stringify(f).slice(0, 300));

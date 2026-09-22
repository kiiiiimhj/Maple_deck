// 런타임 KS5 로그(키 모양 글자) × .ui IsLocalizationKey 대조 (읽기 전용, 2026-09-22)
//   node .builder-work/ks5_crosscheck.cjs <maker_logs 저장 파일>
const fs = require("fs");
const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");
const s = fs.readFileSync(process.argv[2], "utf8");
const msgs = [];
for (const m of s.matchAll(/"message"\s*:\s*("(?:[^"\\]|\\.)*")/g)) { try { msgs.push(JSON.parse(m[1])); } catch (e) {} }
console.log("done lines:", msgs.filter((m) => m.startsWith("KS5 done")).length, "/ 25");
const hits = msgs.filter((m) => m.startsWith("KS5|")).map((m) => { const [, p, t] = m.split("|"); return { p, t }; });
const ext = "." + "ui";
const files = fs.readdirSync("ui").filter((x) => x.endsWith(ext));
const map = {};
for (const file of files) {
  const b = UIBuilder.load("ui/" + file);
  for (const e of b.listEntities()) for (const t of ["MOD.Core.TextComponent", "MOD.Core.TextGUIRendererComponent"]) {
    const c = b.getComponent(e.path, t); if (c && !map[e.path]) map[e.path] = { flag: !!c.IsLocalizationKey, text: c.Text, file };
  }
}
const bad = [], ok = [], unknown = [];
for (const h of hits) { const i = map[h.p]; if (!i) unknown.push(h); else if (i.flag && i.text === h.t) ok.push(h); else bad.push({ ...h, ...i }); }
console.log(`hits ${hits.length}: 정상(.ui 번역설정 켜짐+원래 키 그대로) ${ok.length}, 문제 ${bad.length}, 경로못찾음(런타임 생성) ${unknown.length}`);
for (const b of bad) console.log(`BAD ${b.p}  now="${b.t}"  ui="${b.text}" flag=${b.flag}`);
for (const u of unknown) console.log(`UNK ${u.p}  "${u.t}"`);

// 뽑기 "확률 안내" 버튼이 한글 원문(IsLocalizationKey=false)이라 영/대만/일본 화면에도 한국어로 나오던 것 수정(2026-10-02 출시 점검).
// 1) GameText.csv에 UI_GACHAGROUP_008 추가 + MLUA_GACHAUI_005("뽑기", ko 전용 분기라 노출은 없지만 빈칸) 3개 언어 채움
// 2) GachaGroup.ui Panel/BtnInfo 글씨를 키로 교체 + IsLocalizationKey=true
// 사용: node .builder-work/gacha_info_btn_loc.cjs [--write]
const fs = require("fs");
const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");
const WRITE = process.argv.includes("--write");
const CSV = "RootDesk/MyDesk/Localization/GameText.csv";
const KEY = "UI_GACHAGROUP_008";

let text = fs.readFileSync(CSV, "utf8");
const lines = text.split("\r\n");
if (lines.some((l) => l.startsWith(KEY + ","))) console.log("already has", KEY);
else {
  // 마지막 빈 줄 앞에 붙인다(파일이 CRLF로 끝남)
  const row = `${KEY},확률 안내,/ui/GachaGroup/Panel/BtnInfo,확률 안내,Drop Rates,機率說明,確率案内`;
  const end = lines[lines.length - 1] === "" ? lines.length - 1 : lines.length;
  lines.splice(end, 0, row);
  console.log("add", row);
}
const i5 = lines.findIndex((l) => l.startsWith("MLUA_GACHAUI_005,"));
if (i5 >= 0 && lines[i5].endsWith(",뽑기,,,")) {
  lines[i5] = lines[i5].replace(/,뽑기,,,$/, ",뽑기,Draw,抽取,ガチャ");
  console.log("fill", lines[i5]);
}
if (WRITE) fs.writeFileSync(CSV, lines.join("\r\n"), "utf8");

const FILE = "ui/GachaGroup.ui";
const b = UIBuilder.read(FILE);
const P = "Panel/BtnInfo";
const type = b.getComponent(P, "MOD.Core.TextGUIRendererComponent") ? "MOD.Core.TextGUIRendererComponent" : "MOD.Core.TextComponent";
const tc = b.getComponent(P, type);
console.log("BtnInfo", type.split(".").pop(), JSON.stringify(tc.Text), "loc", tc.IsLocalizationKey);
if (WRITE) {
  b.patchComponent(P, type, { Text: KEY, IsLocalizationKey: true });
  b.write(FILE, { strict: false });
  const after = UIBuilder.read(FILE).getComponent(P, type);
  console.log("->", after.Text, after.IsLocalizationKey);
}

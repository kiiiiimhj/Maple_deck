const fs = require("fs");
const P = "RootDesk/MyDesk/Localization/GameText.csv";

const ROWS = [
  ["UI_RAIDGROUP_014", "다이아", "ui/RaidGroup.ui RewardTable/Head/Dia",
    "다이아", "Diamonds", "鑽石", "ダイヤ"],
  ["MLUA_RAIDUI_004", "보상 목록", "RootDesk/MyDesk/Raid/RaidUI.mlua RefreshClaim",
    "보상 목록", "Reward List", "獎勵一覽", "報酬一覧"],
  ["FMT_RAIDLOGIC_002", "주간 레이드 {0} 등급 보상 + 다이아 {1} + 반지 강화 주문서 {2}장을 받았어요!",
    "RootDesk/MyDesk/Raid/RaidLogic.mlua NotifyClaimResult",
    "주간 레이드 {0} 등급 보상 + 다이아 {1} + 반지 강화 주문서 {2}장을 받았어요!",
    "You received the Weekly Raid Grade {0} reward + {1} Diamonds + {2} Ring Enhancement Scroll(s)!",
    "已獲得每週突襲 {0} 等級獎勵 + 鑽石 {1} + 戒指強化卷軸 {2}張！",
    "週間レイド{0}等級報酬 + ダイヤ{1} + 指輪強化の書{2}枚を受け取りました！"],
];

let s = fs.readFileSync(P, "utf8");
const eol = s.includes("\r\n") ? "\r\n" : "\n";
const lines = s.split(eol);

let added = 0;
for (const r of ROWS) {
  if (lines.some((l) => l.startsWith(r[0] + ","))) { console.log("skip:", r[0]); continue; }
  const prefix = r[0].replace(/_\d+$/, "");
  let at = -1;
  for (let i = 0; i < lines.length; i++) if (lines[i].startsWith(prefix + "_")) at = i;
  if (at < 0) at = lines.length - 1;
  lines.splice(at + 1, 0, r.join(","));
  added++;
}
fs.writeFileSync(P, lines.join(eol), "utf8");
console.log("added:", added);

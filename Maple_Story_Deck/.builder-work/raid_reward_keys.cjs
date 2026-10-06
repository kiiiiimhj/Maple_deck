// 레이드 보상 안내 + 인벤 가득참 안내 번역 키(2026-09-23).
// 아래 ROWS 형식: [Key, Source, Note, ko, en, zh-tw, ja] — 파일 칸 순서와는 무관(헤더로 맞춘다)
const P = "RootDesk/MyDesk/Localization/GameText.csv";

const ROWS = [
  ["MLUA_RAIDLOGIC_006", "장비창이 가득 찼습니다!", "RootDesk/MyDesk/Raid/RaidLogic.mlua GrantReward",
    "장비창이 가득 찼습니다!", "Your inventory is full!", "裝備欄已滿！", "装備欄がいっぱいです！"],
  ["MLUA_RAIDLOGIC_007", "보상 지급에 실패했어요. 잠시 후 다시 시도해 주세요", "RootDesk/MyDesk/Raid/RaidLogic.mlua GrantReward",
    "보상 지급에 실패했어요. 잠시 후 다시 시도해 주세요", "Failed to grant the reward. Please try again shortly.",
    "獎勵發放失敗，請稍後再試。", "報酬の受け取りに失敗しました。しばらくしてからもう一度お試しください。"],
  ["MLUA_RAIDUI_003", "최고 등급이에요!", "RootDesk/MyDesk/Raid/RaidUI.mlua RefreshRewardBox",
    "최고 등급이에요!", "Top grade reached!", "已達最高等級！", "最高等級です！"],
  ["FMT_RAIDUI_002", "{0}까지 {1}%", "RootDesk/MyDesk/Raid/RaidUI.mlua RefreshRewardBox",
    "{0}까지 {1}%", "{1}% to {0}", "距離{0}還差{1}%", "{0}まであと{1}%"],
  ["FMT_RAIDUI_003", "{0}% 이상", "RootDesk/MyDesk/Raid/RaidUI.mlua FillRewardTable",
    "{0}% 이상", "{0}%+", "{0}%以上", "{0}%以上"],
  ["UI_RAIDGROUP_008", "이번 주 보상", "ui/RaidGroup.ui RewardBox/Title",
    "이번 주 보상", "This Week's Reward", "本週獎勵", "今週の報酬"],
  ["UI_RAIDGROUP_009", "등급별 보상", "ui/RaidGroup.ui RewardTable/Title",
    "등급별 보상", "Rewards by Grade", "各等級獎勵", "等級別報酬"],
  ["UI_RAIDGROUP_010", "등급", "ui/RaidGroup.ui RewardTable/Head/Grade",
    "등급", "Grade", "等級", "等級"],
  ["UI_RAIDGROUP_011", "보스 체력", "ui/RaidGroup.ui RewardTable/Head/Cut",
    "보스 체력", "Boss HP", "首領血量", "ボスHP"],
  ["UI_RAIDGROUP_012", "반지", "ui/RaidGroup.ui RewardTable/Head/Ring",
    "반지", "Ring", "戒指", "指輪"],
  ["UI_RAIDGROUP_013", "강화 주문서", "ui/RaidGroup.ui RewardTable/Head/Scroll",
    "강화 주문서", "Scrolls", "強化卷軸", "強化の書"],
];

// 칸 순서는 헤더에서 찾고(따옴표 처리 포함), zh-cn은 zh-tw에서 자동 변환한다(locale_lib.cjs)
const L = require("./locale_lib.cjs");
const { head, rows, bom } = L.readCsv(P);

let added = 0;
for (const [key, source, note, ko, en, tw, ja] of ROWS) {
  if (rows.some((r) => r[0] === key)) {
    console.log("skip (exists):", key);
    continue;
  }
  // 같은 접두사 그룹 끝에 붙인다(번역 담당자가 보기 좋게)
  const prefix = key.replace(/_\d+$/, "");
  let at = -1;
  for (let i = 0; i < rows.length; i++) if (rows[i][0].startsWith(prefix + "_")) at = i;
  if (at < 0) at = rows.length - 1;
  rows.splice(at + 1, 0, L.makeRow(head, { key, source, note, ko, en, "zh-tw": tw, ja }));
  added++;
}

L.writeCsv(P, head, rows, bom);
console.log("added rows:", added);

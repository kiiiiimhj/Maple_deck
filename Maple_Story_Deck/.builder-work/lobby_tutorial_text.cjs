// 로비 튜토리얼 대사 9단계(유저 지정 2026-09-29) → GameText.csv 행 추가/갱신. 핵심 키워드는 빨간색 리치 텍스트.
// 키: MLUA_LOBBYTUTORIALUI_001~009. 재실행하면 같은 키 행을 덮어쓴다.
const fs = require("fs");
const FILE = "RootDesk/MyDesk/Localization/GameText.csv";
// 게임 이름 안 띄어쓰기는  (줄바꿈 안 되는 공백) — "몬스터 / 서바이버"로 끊기지 않게(유저 지정 2026-09-29)
const R = (s) => `<color=#D93025>${s}</color>`;
const SRC = "RootDesk/MyDesk/UI/LobbyTutorialUI.mlua (로비 튜토리얼 대사, <color> = 빨간 키워드)";

const rows = [
  [
    `안녕! 메이플스토리 : 몬스터 서바이버에 온 걸 환영해!\n간단하게 ${R("로비 아이콘")}을 설명해 줄게!`,
    `Hi! Welcome to MapleStory : Monster Survivor!\nLet me quickly explain the ${R("lobby icons")}!`,
    `嗨！歡迎來到楓之谷 : 怪物倖存者！\n我來簡單介紹一下${R("大廳圖示")}吧！`,
    `やあ！メイプルストーリー : モンスターサバイバーへようこそ！\n${R("ロビーのアイコン")}をかんたんに説明するね！`,
  ],
  [
    `왼쪽부터 설명해 줄게!\n${R("출석 보상")}은 매일 접속하면 받을 수 있는 보상이야!\n매일 들어와 주면 아주 좋겠지?`,
    `Let's start from the left!\n${R("Attendance Rewards")} are yours just for logging in every day!\nIt'd be great if you came by every day, right?`,
    `從左邊開始介紹吧！\n${R("出席獎勵")}是每天登入就能領取的獎勵！\n每天都來的話就太好了吧？`,
    `左から説明するね！\n${R("出席報酬")}は毎日ログインするだけでもらえる報酬だよ！\n毎日来てくれたらうれしいな！`,
  ],
  [
    `다음은 ${R("뽑기")} 버튼이야!\n여기서는 더 강해지기 위한 ${R("스킬")}과 ${R("유물")}을 뽑을 수 있어.\n게임을 진행하다 보면 ${R("무료 뽑기권")}과 ${R("다이아")}도 모이니까,
꼭 활용해 봐!`,
    `Next is the ${R("Summon")} button!\nHere you can draw ${R("Skills")} and ${R("Relics")} to grow stronger.\nYou'll collect ${R("free summon tickets")} and ${R("Diamonds")} as you play,
so make good use of them!`,
    `接下來是${R("抽獎")}按鈕！\n在這裡可以抽取讓你變得更強的${R("技能")}和${R("遺物")}。\n遊戲過程中也會累積${R("免費抽獎券")}和${R("鑽石")}，
一定要好好利用喔！`,
    `次は${R("ガチャ")}ボタンだよ！\nここでは強くなるための${R("スキル")}と${R("遺物")}を引けるんだ。\nゲームを進めると${R("無料ガチャチケット")}や${R("ダイヤ")}もたまるから、
ぜひ使ってみてね！`,
  ],
  [
    `다음은 ${R("인벤토리")}야!\n모험에서 얻은 ${R("장비")}를 장착하고 강화해 전투력을 높여 봐.\n강해진 장비로 더 어려운 모험에도 도전할 수 있어!`,
    `Next is the ${R("Inventory")}!\nEquip and enhance the ${R("gear")} you find on your adventures to boost your power.\nWith stronger gear, you can take on tougher adventures!`,
    `接下來是${R("背包")}！\n裝備並強化冒險中獲得的${R("裝備")}來提升戰鬥力吧。\n有了更強的裝備，就能挑戰更艱難的冒險！`,
    `次は${R("インベントリ")}だよ！\n冒険で手に入れた${R("装備")}を装着して強化し、戦闘力を上げよう。\n強くなった装備で、もっと難しい冒険にも挑戦できるよ！`,
  ],
  [
    `다음은 ${R("업적")}과 ${R("몬스터 도감")}이야!\n게임을 진행하면서 다양한 업적과 도감을 해금하고
${R("특별한 보상")}도 획득해 봐!`,
    `Next are ${R("Achievements")} and the ${R("Monster Book")}!\nUnlock all kinds of achievements and book entries as you play
and earn ${R("special rewards")}!`,
    `接下來是${R("成就")}和${R("怪物圖鑑")}！\n在遊戲中解鎖各種成就與圖鑑
還能獲得${R("特別獎勵")}喔！`,
    `次は${R("実績")}と${R("モンスター図鑑")}だよ！\nゲームを進めながらいろいろな実績や図鑑を解放して
${R("特別な報酬")}も手に入れよう！`,
  ],
  [
    `${R("에피소드 보상")}은 모험에서 ${R("오래 버틸수록")} 받을 수 있어!\n처음엔 조금 힘들 수 있지만,
점점 강해지면 더 오래 버틸 수 있을 거야!`,
    `${R("Episode Rewards")} are earned by ${R("surviving longer")} on your adventures!\nIt may be tough at first,
but as you grow stronger, you'll last longer and longer!`,
    `${R("章節獎勵")}是在冒險中${R("撐得越久")}就能領取的獎勵！\n一開始可能有點辛苦，
但只要慢慢變強，就能撐得更久喔！`,
    `${R("エピソード報酬")}は冒険で${R("長く生き残るほど")}もらえるよ！\n最初は少し大変かもしれないけど、
強くなればもっと長く生き残れるはず！`,
  ],
  [
    `게임도 휴식이 필요한 법!\n네가 쉬는 동안 내가 대신 열심히 ${R("사냥")}해 둘게!\n그러니까 꼭 다시 들어와서 ${R("보상")}을 챙겨 가야 해!`,
    `Even games need a break!\nWhile you rest, I'll keep ${R("hunting")} hard for you!\nSo be sure to come back and collect your ${R("rewards")}!`,
    `遊戲也需要休息！\n你休息的時候，我會代替你努力${R("狩獵")}！\n所以一定要回來領取${R("獎勵")}喔！`,
    `ゲームにも休憩は必要！\nキミが休んでいる間、ボクが代わりにしっかり${R("狩り")}をしておくね！\nだから必ず戻ってきて${R("報酬")}を受け取ってね！`,
  ],
  [
    `${R("상점")}에서는 부족한 다이아나 다양한 스킨을 구매할 수 있어!\n${R("스킬")}과 ${R("유물")}에서는 정보를 확인하거나 강화할 수 있고,\n현재 내 순위가 궁금하다면 ${R("랭킹")}을 눌러 봐!`,
    `In the ${R("Shop")}, you can buy Diamonds you're short on and all sorts of skins!\nIn ${R("Skills")} and ${R("Relics")}, you can check info or enhance them,\nand if you're curious about your rank, tap ${R("Ranking")}!`,
    `在${R("商店")}可以購買不足的鑽石和各種外觀！\n在${R("技能")}和${R("遺物")}可以查看資訊或進行強化，\n想知道自己目前的名次，就點${R("排行榜")}看看吧！`,
    `${R("ショップ")}では足りないダイヤやいろいろなスキンを購入できるよ！\n${R("スキル")}と${R("遺物")}では情報を確認したり強化したりできて、\n今の順位が気になったら${R("ランキング")}を押してみてね！`,
  ],
  [
    `여기까지 따라오느라 고생했어!\n보상으로 ${R("다이아 1,000개")}를 줄게.\n앞으로도 잘 부탁해!`,
    `Thanks for sticking with me this far!\nHere are ${R("1,000 Diamonds")} as a reward.\nI'm counting on you from here on!`,
    `辛苦你跟到這裡了！\n送你${R("1,000顆鑽石")}作為獎勵。\n今後也請多多指教！`,
    `ここまでお疲れさま！\nごほうびに${R("ダイヤ1,000個")}をあげるね。\nこれからもよろしくね！`,
  ],
];

const q = (s) => (/[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);
let text = fs.readFileSync(FILE, "utf8");
// 기존 같은 키 행 제거(여러 줄 셀 포함) — 따옴표 상태를 보며 레코드 단위로 자른다
const records = [];
let cur = "", inQ = false;
for (let i = 0; i < text.length; i++) {
  const c = text[i];
  cur += c;
  if (c === '"') inQ = !inQ;
  else if (c === "\n" && !inQ) { records.push(cur); cur = ""; }
}
if (cur) records.push(cur);
const kept = records.filter((r) => !/^MLUA_LOBBYTUTORIALUI_\d{3},/.test(r));
const eol = "\r\n";
let out = kept.join("");
if (!out.endsWith("\n")) out += eol;
rows.forEach((r, i) => {
  const key = `MLUA_LOBBYTUTORIALUI_${String(i + 1).padStart(3, "0")}`;
  out += [key, q(r[0]), q(SRC), q(r[0]), q(r[1]), q(r[2]), q(r[3])].join(",") + eol;
});
fs.writeFileSync(FILE, out, "utf8");
console.log(`kept ${kept.length} records, added ${rows.length}`);

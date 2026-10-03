// 게임오버 팝업: 획득 골드 줄 + 종료 버튼 추가 (2026-10-02)
const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");
const FILE = "ui/GameOverGroup.ui";
const P = "GameOverBack/GameOverPanel/";
const b = UIBuilder.read(FILE);
if (b.find(P + "BtnExit") || b.find(P + "ScoreBox/GoldLabel")) throw new Error("already applied");

const T = (p) => b.getComponent(p, "MOD.Core.UITransformComponent");
const moveY = (p, dy) => { const t = T(p); b.patch(p, { pos: [t.anchoredPosition.x, t.anchoredPosition.y + dy] }); };
const moveX = (p, x) => { const t = T(p); b.patch(p, { pos: [x, t.anchoredPosition.y] }); };

// 원본 엔티티의 컴포넌트를 그대로 복사해 새 경로에 만든다(자식 포함)
function clone(src, dst, displayOrder) {
  const s = b.find(src);
  b.empty(dst);
  for (const c of s.jsonString["@components"]) b.upsertComponent(dst, c["@type"], JSON.parse(JSON.stringify(c)));
  b.patch(dst, { display_order: displayOrder, localize: s.jsonString.localize });
  const children = b.listEntities().filter(e => e.path.startsWith(s.path + "/") && e.path.split("/").length === s.path.split("/").length + 1);
  for (const ch of children) {
    const name = ch.path.substring(s.path.length + 1);
    clone(ch.path, dst + "/" + name, b.find(ch.path).jsonString.displayOrder);
  }
}
const setText = (p, text, isKey) => b.patchComponent(p, "MOD.Core.TextComponent", { Text: text, IsLocalizationKey: isKey });

// 1) 위쪽 줄을 올려 골드 줄 자리 확보, 아이템 칸은 조금 내림
moveY(P + "GameOverStats", 8);
moveY(P + "ScoreBox/ScoreLabel", 11);
moveY(P + "ScoreBox/ScoreValueText", 11);
for (const p of ["ScoreBox/UISprite", "ScoreBox/ItemScrollArea", "ScoreBox/ItemScrollBar"]) moveY(P + p, -15);

// 2) 획득 골드 줄(스코어 줄 복제, 36 아래)
clone("/ui/GameOverGroup/" + P + "ScoreBox/ScoreLabel", P + "ScoreBox/GoldLabel", 5);
clone("/ui/GameOverGroup/" + P + "ScoreBox/ScoreValueText", P + "ScoreBox/GoldValueText", 6);
moveY(P + "ScoreBox/GoldLabel", -36);
moveY(P + "ScoreBox/GoldValueText", -36);
setText(P + "ScoreBox/GoldLabel", "UI_GAMEOVERGROUP_008", true);
setText(P + "ScoreBox/GoldValueText", "0", false);
b.patch(P + "ScoreBox/GoldValueText", { localize: false });

// 3) 종료 버튼(다시하기 버튼 복제, 초록 그대로) + 버튼 재배치
clone("/ui/GameOverGroup/" + P + "BtnRestart", P + "BtnExit", 7);
setText(P + "BtnExit", "UI_GAMEOVERGROUP_009", true);
setText(P + "BtnExit/Label", "UI_GAMEOVERGROUP_009", true);
moveX(P + "BtnExit", -400);
moveX(P + "BtnRestart", -30);
moveX(P + "BtnContinue", 330);
moveX(P + "BtnRestartOvertime", 175);

b.write(FILE, {
  bind: {
    mlua: "RootDesk/MyDesk/UI/GameOverUI.mlua",
    props: { btnExit: "/ui/GameOverGroup/" + P + "BtnExit", goldValueText: "/ui/GameOverGroup/" + P + "ScoreBox/GoldValueText" },
  },
});

const r = UIBuilder.read(FILE);
for (const p of ["GameOverStats", "ScoreBox/ScoreLabel", "ScoreBox/GoldLabel", "ScoreBox/GoldValueText", "ScoreBox/ItemScrollArea", "BtnExit", "BtnExit/Label", "BtnRestart", "BtnContinue", "BtnRestartOvertime"]) {
  const t = r.getComponent(P + p, "MOD.Core.UITransformComponent");
  const tx = r.getComponent(P + p, "MOD.Core.TextComponent");
  console.log("CHECK", p, JSON.stringify(t.anchoredPosition), tx ? tx.Text + "/" + tx.IsLocalizationKey : "");
}

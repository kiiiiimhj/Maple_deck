// UI 넘침 대응 — 한 줄 칸 BestFit + 문장형 칸 높이 확장 (2026-09-22). UIBuilder로만 수정한다.
//   node .builder-work/ui_overflow_fix.cjs [--apply]
const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");
const APPLY = process.argv.includes("--apply");

// 한 줄짜리(버튼·제목·탭·라벨·배지·이름) → BestFit. 경로는 그룹 루트 기준 정규식
const BESTFIT = {
  "EquipmentGroup.ui": [
    /^Inventory\/EquipPopup\/Panel\/ButtonLock\/TextLock$/,
    /^Inventory\/EquipPopup\/Panel\/ButtonBatchLevelUp\/Label$/,
    /^Inventory\/EquipPopup\/Panel\/ButtonLevelUp\/Label$/,
    /^Inventory\/ComposePopup\/Panel\/LeftColumn\/BG_2\/InfoBox\/QualityTitle$/,
    /^Inventory\/Panel\/EquipPanel\/PlayerInfo\/AvatarViewToggle\/Label$/,
    /^Inventory\/Panel\/ItemNameTooltip\/Label$/,
  ],
  "RaidGroup.ui": [/^DpsWindow\/Title$/],
  "TitleGroup.ui": [
    /^(RankPanel|ShopPanel|RelicPanel|SkillPanel)\/Title$/,
    /^RankPanel\/Tabs\/Tab\w+\/Label$/,
    /^ShopPanel\/ScrollArea\/List\/ProductCard_\d+\/NameText$/,
    /^ShopPanel\/ScrollArea\/List\/ProductCard_\d+\/BonusBadge\/BadgeText$/,
  ],
  "GameOverGroup.ui": [
    /^DiaShop\/Panel\/ScrollArea\/List\/ProductCard_\d+\/NameText$/,
    /^DiaShop\/Panel\/ScrollArea\/List\/ProductCard_\d+\/BonusBadge\/BadgeText$/,
  ],
  "DefaultGroup.ui": [/^DpsMeter\/Board\/Line\d+\/EtcLabel$/],
  "ShadowShopGroup.ui": [/^Panel\/List\/Item\d+\/NameText$/],
  "EpisodeRewardGroup.ui": [/^Panel\/BtnClaim$/],
  "LevelRewardGroup.ui": [/^Panel\/BtnClaim$/],
};
// 문장형 → 칸 높이 확장 [경로, 새 크기, 새 위치] (주변 요소와 안 겹치는 방향으로 늘림 — 배치 확인 완료)
const RESIZE = {
  "EquipmentGroup.ui": [["Inventory/ComposePopup/Panel/RiskWarning/Box/Text", [560, 100], [0, 131]]],
  "IdleRewardGroup.ui": [["ConfirmPanel/Message", [560, 100], [0, 131]]],
  "OptionGroup.ui": [["ConfirmPanel/Message", [560, 100], [0, 131]]],
  "RunStartConfirmGroup.ui": [["Panel/Message", [560, 100], [0, 131]]],
  "WorldCharacterSelectGroup.ui": [["Panel/WorldImageCenterPhoto/LockOverlay/Hint", [500, 70], [0, -47]]],
  "EpisodeRewardGroup.ui": [["Panel/Hint", [900, 70], [0, -243]]],
};

const files = new Set([...Object.keys(BESTFIT), ...Object.keys(RESIZE)]);
for (const f of files) {
  const b = UIBuilder.load("ui/" + f);
  const root = b.listEntities()[0].path;
  let n = 0;
  for (const e of b.listEntities()) {
    const rel = e.path.slice(root.length + 1);
    if (!(BESTFIT[f] || []).some((re) => re.test(rel))) continue;
    for (const t of ["MOD.Core.TextGUIRendererComponent", "MOD.Core.TextComponent"]) {
      const c = b.getComponent(e.path, t); if (!c) continue;
      if (!("MinSize" in c) || !("MaxSize" in c)) { console.log(`  ⚠ ${f}:${rel} ${t}에 MinSize/MaxSize 없음 — 건너뜀`); continue; }
      const size = c.FontSize || 24;
      const upd = { BestFit: true, MaxSize: size, MinSize: Math.max(10, Math.floor(size * 0.5)) };
      console.log(`  BestFit ${f}:${rel}  (${c.BestFit ? "이미 켜짐" : "켬"}, ${upd.MinSize}~${upd.MaxSize})`);
      b.patchComponent(e.path, t, upd); n++;
    }
  }
  for (const [p, size, pos] of RESIZE[f] || []) {
    const tr = b.getComponent(p, "MOD.Core.UITransformComponent");
    console.log(`  크기 ${f}:${p}  ${tr.RectSize.x}x${tr.RectSize.y} @(${tr.anchoredPosition.x},${tr.anchoredPosition.y}) → ${size.join("x")} @(${pos.join(",")})`);
    b.patch(p, { rect_size: size, pos }); n++;
  }
  if (APPLY) {
    try { b.write("ui/" + f, { strict: false }); } catch (e) { console.log("  write 예외: " + String(e.message).slice(0, 120)); }
  }
  console.log(`${APPLY ? "기록" : "드라이런"} ${f}: ${n}건`);
}

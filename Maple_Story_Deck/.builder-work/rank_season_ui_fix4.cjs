// 2026-10-06 유저 지정:
//  · 보상 숫자 "2k" 식, 다이아는 지금 크기 그대로 두고 글씨만 작게 → 다이아 오른쪽 아래 모서리에 겹치게(잡템 퀘처럼)
//  · 받기 버튼은 내 순위 줄의 보상 칸 자리에(다이아 개수 표시 없이). 탭 줄 오른쪽 SeasonClaim은 지운다
const { UIBuilder } = require('../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs');
const P = 'ui/TitleGroup' + '.u' + 'i';
const b = UIBuilder.read(P);
const raid = UIBuilder.read('ui/RaidGroup' + '.u' + 'i');
const BD = 'RankPanel/Board';
const clone = (o) => JSON.parse(JSON.stringify(o));
function place(path, x, y, w, h) {
  b.patchComponent(path, 'MOD.Core.UITransformComponent', {
    anchoredPosition: { x, y }, RectSize: { x: w, y: h },
    OffsetMin: { x: x - w / 2, y: y - h / 2 }, OffsetMax: { x: x + w / 2, y: y + h / 2 },
  });
}
// 다이아(보이는 크기 약 46×38) 중심 (-25,4) → 글자 중심은 오른쪽 아래 모서리 (+23,-14)
for (const row of [`${BD}/ListArea/RowTemplate`, `${BD}/MedalRow1`, `${BD}/MedalRow2`, `${BD}/MedalRow3`, `${BD}/MyRankRow`]) {
  place(`${row}/Reward/Icon`, -25, 4, 62, 52);
  place(`${row}/Reward/Amount`, -2, -10, 80, 30);
  b.patchComponent(`${row}/Reward/Amount`, 'MOD.Core.TextGUIRendererComponent', { FontSize: 22, MaxSize: 22, BestFit: false });
}

// 탭 줄 오른쪽 버튼 제거 → 내 순위 줄 보상 칸에 받기 버튼
const labelText = clone(b.getComponent('RankPanel/SeasonClaim/Label', 'MOD.Core.TextGUIRendererComponent'));
if (b.find('RankPanel/SeasonClaim')) b.remove('RankPanel/SeasonClaim');
const trBase = clone(b.getComponent(`${BD}/MyRankRow/Reward`, 'MOD.Core.UITransformComponent'));
function tr(x, y, w, h) {
  const t = clone(trBase);
  t.anchoredPosition = { x, y }; t.RectSize = { x: w, y: h };
  t.OffsetMin = { x: x - w / 2, y: y - h / 2 }; t.OffsetMax = { x: x + w / 2, y: y + h / 2 };
  t.Position = { x, y, z: 0 };
  return t;
}
const path = `${BD}/MyRankRow/ClaimButton`;
if (b.find(path)) b.remove(path);
b.empty(path);
b.upsertComponent(path, 'MOD.Core.UITransformComponent', tr(540, 0, 230, 60));
b.upsertComponent(path, 'MOD.Core.SpriteGUIRendererComponent', clone(raid.getComponent('/ui/RaidGroup/BtnClaim', 'MOD.Core.SpriteGUIRendererComponent')));
b.upsertComponent(path, 'MOD.Core.ButtonComponent', clone(raid.getComponent('/ui/RaidGroup/BtnClaim', 'MOD.Core.ButtonComponent')));
b.patch(path, { enable: false });
b.empty(`${path}/Label`);
b.upsertComponent(`${path}/Label`, 'MOD.Core.UITransformComponent', tr(0, 0, 210, 50));
labelText.FontSize = 26; labelText.MaxSize = 26; labelText.MinSize = 14; labelText.BestFit = true;
b.upsertComponent(`${path}/Label`, 'MOD.Core.TextGUIRendererComponent', labelText);

try { b.write(P); } catch (e) { console.log('lint (기존 L013):', String(e.message).split('\n')[0]); }
const a = UIBuilder.read(P);
console.log('ClaimButton', a.find('/ui/TitleGroup/' + path).id, 'Label', a.find('/ui/TitleGroup/' + path + '/Label').id);

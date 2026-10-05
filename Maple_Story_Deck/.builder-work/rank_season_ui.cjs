// 2026-10-06 랭킹 시즌 보상 UI — TitleGroup RankPanel에
//   · 보상 열(Header/ColReward + 각 행 Reward/Icon·Amount)을 맨 오른쪽에 추가하고 이름/점수 열을 좁힌다
//   · 시즌 기간 문구(SeasonText)와 지난 시즌 보상 받기 버튼(SeasonClaim, 평소 꺼짐)을 탭 줄 오른쪽에 둔다
// 글씨: 흰 글자 + 검은 테두리, 레이드 버튼과 같은 Maple 굵게 + FaceDilate 0.2 (TextGUIRenderer)
const { UIBuilder } = require('../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs');
const P = 'ui/TitleGroup' + '.ui';
const R = 'RankPanel';
const BD = R + '/Board';
const b = UIBuilder.read(P);
const raid = UIBuilder.read('ui/RaidGroup' + '.ui');
const clone = (o) => JSON.parse(JSON.stringify(o));
const DIA = '81462aeb825b4660991cef05651271cf';

const baseTr = clone(b.getComponent(`${BD}/MedalRow1/Medal`, 'MOD.Core.UITransformComponent'));
const baseSprite = clone(b.getComponent(`${BD}/MedalRow1/Medal`, 'MOD.Core.SpriteGUIRendererComponent'));
const raidText = clone(raid.getComponent('/ui/RaidGroup/BtnClaim', 'MOD.Core.TextGUIRendererComponent'));

function tr(x, y, w, h) {
  const t = clone(baseTr);
  t.anchoredPosition = { x, y };
  t.RectSize = { x: w, y: h };
  t.OffsetMin = { x: x - w / 2, y: y - h / 2 };
  t.OffsetMax = { x: x + w / 2, y: y + h / 2 };
  t.Position = { x, y, z: 0 };
  return t;
}
function text(str, size, loc, color, outline) {
  const t = clone(raidText);
  t.Text = str;
  t.FontSize = size;
  t.MaxSize = size;
  t.MinSize = Math.max(12, Math.round(size / 2));
  t.IsLocalizationKey = loc;
  t.FontColor = color || { r: 1, g: 1, b: 1, a: 1 };
  t.OutlineColor = outline || { r: 0, g: 0, b: 0, a: 1 };
  return t;
}
function make(path, comps, enable) {
  if (b.find(path)) b.remove(path);
  b.empty(path);
  for (const c of comps) b.upsertComponent(path, c['@type'], c);
  if (enable === false) b.patch(path, { enable: false });
}
function move(path, x, w) {
  const t = b.getComponent(path, 'MOD.Core.UITransformComponent');
  const y = t.anchoredPosition.y, h = t.RectSize.y;
  b.patchComponent(path, 'MOD.Core.UITransformComponent', {
    anchoredPosition: { x, y }, RectSize: { x: w, y: h },
    OffsetMin: { x: x - w / 2, y: y - h / 2 }, OffsetMax: { x: x + w / 2, y: y + h / 2 },
  });
}

// ── 열 배치: 이름 -110(400) / 점수 250(300) / 보상 540 ──
move(`${BD}/Header/ColName`, -110, 400);
move(`${BD}/Header/ColScore`, 250, 300);
const colName = b.find(`${BD}/Header/ColName`).jsonString['@components'];
make(`${BD}/Header/ColReward`, colName.map((c) => {
  const d = clone(c);
  if (d['@type'] === 'MOD.Core.UITransformComponent') return Object.assign(d, tr(540, 0, 200, 40));
  if (d['@type'] === 'MOD.Core.TextComponent') { d.Text = 'UI_TITLEGROUP_RANK_REWARD'; d.IsLocalizationKey = true; }
  return d;
}));

const rows = [`${BD}/ListArea/RowTemplate`, `${BD}/MedalRow1`, `${BD}/MedalRow2`, `${BD}/MedalRow3`, `${BD}/MyRankRow`];
for (const row of rows) {
  move(`${row}/NameText`, -110, 400);
  move(`${row}/ScoreText`, 250, 300);
  make(`${row}/Reward`, [tr(540, 0, 160, 62)]);
  const icon = clone(baseSprite);
  icon.ImageRUID = { DataId: DIA };
  icon.PreserveSprite = 1;
  make(`${row}/Reward/Icon`, [tr(0, 7, 52, 52), icon]);
  make(`${row}/Reward/Amount`, [tr(0, -17, 160, 32), text('x50', 24, false)]);
}

// ── 시즌 기간 문구 (탭 줄 오른쪽) ──
make(`${R}/SeasonText`, [tr(405, 402, 370, 84), text('', 26, false)]);

// ── 지난 시즌 보상 받기 버튼 (평소 꺼짐) ──
const btnTr = tr(770, 396, 320, 92);
const btnSprite = clone(raid.getComponent('/ui/RaidGroup/BtnClaim', 'MOD.Core.SpriteGUIRendererComponent'));
const btnComp = clone(raid.getComponent('/ui/RaidGroup/BtnClaim', 'MOD.Core.ButtonComponent'));
make(`${R}/SeasonClaim`, [btnTr, btnSprite, btnComp], false);
const cIcon = clone(baseSprite);
cIcon.ImageRUID = { DataId: DIA };
cIcon.PreserveSprite = 1;
make(`${R}/SeasonClaim/Icon`, [tr(-105, 8, 56, 56), cIcon]);
make(`${R}/SeasonClaim/Amount`, [tr(-105, -18, 130, 32), text('x50', 24, false)]);
make(`${R}/SeasonClaim/Label`, [tr(45, 0, 200, 60), text('UI_TITLEGROUP_RANK_CLAIM', 32, true, raidText.FontColor, raidText.OutlineColor)]);
make(`${R}/SeasonClaim/RankLabel`, [tr(0, 66, 320, 36), text('', 24, false)]);

try { b.write(P); } catch (e) { console.log('write lint:', String(e.message).split('\n').slice(0, 6).join(' | ')); }

const a = UIBuilder.read(P);
for (const p of [`${BD}/Header/ColReward`, `${BD}/MedalRow1/Reward/Amount`, `${BD}/ListArea/RowTemplate/Reward/Icon`, `${R}/SeasonText`, `${R}/SeasonClaim`, `${R}/SeasonClaim/Label`, `${R}/SeasonClaim/RankLabel`, `${R}/SeasonClaim/Amount`]) {
  const e = a.find('/ui/TitleGroup/' + p);
  console.log(p.padEnd(40), e ? e.id : 'MISSING', e ? JSON.stringify(a.getComponent(e.path, 'MOD.Core.UITransformComponent').anchoredPosition) : '');
}

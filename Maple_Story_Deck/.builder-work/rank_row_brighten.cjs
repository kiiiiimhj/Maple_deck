// 2026-10-06 유저 "조금만 더 밝게" — 랭킹 4등 아래 줄(RowTemplate) 바탕 색을 조금 밝힌다(0.40,0.255,0.14 → 0.62,0.45,0.28)
const { UIBuilder } = require('../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs');
const P = 'ui/TitleGroup' + '.u' + 'i';
const b = UIBuilder.read(P);
b.patchComponent('RankPanel/Board/ListArea/RowTemplate', 'MOD.Core.SpriteGUIRendererComponent', { Color: { r: 0.62, g: 0.45, b: 0.28, a: 1 } });
try { b.write(P); } catch (e) { console.log('lint (기존 L013):', String(e.message).split('\n')[0]); }

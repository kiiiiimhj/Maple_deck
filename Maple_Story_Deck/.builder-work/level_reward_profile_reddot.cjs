// 2026-10-06 유저 지정 "레벨업 보상 받을 수 있을 때 느낌표" — 장비 화면 프로필 이름판(NameBackground, 누르면 레벨 보상 팝업)
// 오른쪽 위에 로비 버튼들과 같은 느낌표 배지(TitleGroup EquipButton/RedDot 트리)를 복제해 붙인다. 평소 꺼 두고 LevelRewardUI가 켠다.
const { UIBuilder } = require('../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs');
const clone = (o) => JSON.parse(JSON.stringify(o));
const src = UIBuilder.read('ui/TitleGroup' + '.ui');
const P = 'ui/EquipmentGroup' + '.ui';
const b = UIBuilder.read(P);
const SRC = '/ui/TitleGroup/EquipButton/RedDot';
const DST = 'Inventory/Panel/EquipPanel/PlayerInfo/NameBackground/RedDot';
if (b.find(DST)) b.remove(DST);
const ents = src.listEntities().filter((e) => e.path === SRC || e.path.startsWith(SRC + '/'));
ents.sort((a, c) => a.path.split('/').length - c.path.split('/').length);
for (const e of ents) {
  const s = src.find(e.path);
  const dst = DST + e.path.slice(SRC.length);
  b.empty(dst);
  for (const comp of s.jsonString['@components']) b.upsertComponent(dst, comp['@type'], clone(comp));
  const js = s.jsonString;
  b.patch(dst, { enable: js.enable, visible: js.visible, localize: js.localize, display_order: js.displayOrder });
}
// 이름판 310x70의 오른쪽 위 모서리에 걸치게, 맨 위에 그린다
b.patch(DST, { pos: [143, 28], enable: false, display_order: 9 });
try { b.write(P, { strict: false }); } catch (e) { console.log('lint:', String(e.message).split('\n')[0]); }
const a = UIBuilder.read(P);
for (const e of a.listEntities().filter((x) => x.path.includes('NameBackground/RedDot'))) {
  const t = a.getComponent(e.path, 'MOD.Core.UITransformComponent');
  console.log(e.path.split('NameBackground/')[1], JSON.stringify(t.anchoredPosition), JSON.stringify(t.RectSize), a.find(e.path).jsonString.enable);
}

// 조사(읽기 전용): 로딩 화면 제목 / 인벤 아바타 영역 버튼
const { UIBuilder } = require('../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs');
function dump(file, re) {
  const b = UIBuilder.read(file);
  for (const e of b.listEntities()) {
    if (!re.test(e.path)) continue;
    const comps = b.find(e.path).jsonString['@components'] || [];
    const types = comps.map((c) => c['@type'].replace('MOD.Core.', '').replace('script.', 's.')).join(',');
    const txt = comps.find((c) => typeof c.Text === 'string');
    const spr = comps.find((c) => c['@type'] === 'MOD.Core.SpriteGUIRendererComponent');
    console.log(e.path, JSON.stringify(e.pos), JSON.stringify(e.size), e.enable, '|', types,
      txt ? '| text=' + JSON.stringify(txt.Text) + ' font=' + txt.Font + ' size=' + txt.FontSize + ' key=' + txt.IsLocalizationKey : '',
      spr && spr.ImageRUID ? '| img=' + spr.ImageRUID.DataId + ' col=' + JSON.stringify(spr.Color) : '');
  }
}
const which = process.argv[2];
if (which === 'loading') dump('ui/LoadingGroup.ui', /./);
else dump('ui/EquipmentGroup.ui', new RegExp(process.argv[3] || 'Avatar|ViewMode|Cash|Costume'));

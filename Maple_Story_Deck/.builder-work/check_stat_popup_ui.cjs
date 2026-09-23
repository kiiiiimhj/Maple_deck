// 확인(읽기 전용): 능력치 버튼/팝업과 로딩 제목 글꼴이 디스크에 남아 있는지
const fs = require('fs');
const { UIBuilder } = require('../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs');
const b = UIBuilder.read('ui/EquipmentGroup.ui');
const PI = 'Inventory/Panel/EquipPanel/PlayerInfo';
console.log('StatButton', b.getId(PI + '/StatButton'), 'StatPopup', b.getId(PI + '/StatPopup'));
const L = UIBuilder.read('ui/LoadingGroup.ui');
console.log('RaidTitle font', L.getComponent('Screen/RaidTitle', 'MOD.Core.TextGUIRendererComponent').Font);
for (const f of ['ui/EquipmentGroup.ui', 'ui/LoadingGroup.ui']) console.log(f, fs.statSync(f).mtime.toISOString());

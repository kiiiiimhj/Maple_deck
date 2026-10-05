// 2026-10-06 레이드 누적 대미지 창에 6번째 줄(Row5, 베노아용) 추가 — Row4를 그대로 본떠 36px 아래에 둔다.
// 창 높이 240→276, 윗변이 그대로 있게 창 중심을 18 내린다.
const { UIBuilder } = require('../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs');
const P = 'ui/RaidGroup.ui';
const b = UIBuilder.read(P);
const W = 'DpsWindow';
const clone = (o) => JSON.parse(JSON.stringify(o));

function copyEntity(src, dst, dy) {
  const ent = b.find(`${W}/${src}`);
  b.empty(`${W}/${dst}`);
  for (const c of ent.jsonString['@components']) {
    const data = clone(c);
    if (data['@type'] === 'MOD.Core.UITransformComponent' && dy !== 0) {
      data.anchoredPosition = { x: data.anchoredPosition.x, y: data.anchoredPosition.y + dy };
    }
    b.upsertComponent(`${W}/${dst}`, data['@type'], data);
  }
  b.patch(`${W}/${dst}`, { enable: ent.jsonString.enable });
}

if (!b.find(`${W}/Row5`)) {
  copyEntity('Row4', 'Row5', -36);
  copyEntity('Row4/Icon', 'Row5/Icon', 0);
  copyEntity('Row4/Value', 'Row5/Value', 0);
}
const t = b.getComponent(W, 'MOD.Core.UITransformComponent');
if (t.RectSize.y < 276) {
  b.patchComponent(W, 'MOD.Core.UITransformComponent', {
    RectSize: { x: t.RectSize.x, y: 276 },
    anchoredPosition: { x: t.anchoredPosition.x, y: t.anchoredPosition.y - 18 },
  });
}
b.write(P);
for (const p of ['', '/Row4', '/Row5', '/Row5/Icon', '/Row5/Value']) {
  const tr = b.getComponent(W + p, 'MOD.Core.UITransformComponent');
  console.log((W + p).padEnd(18), 'pos', JSON.stringify(tr.anchoredPosition), 'size', JSON.stringify(tr.RectSize), 'comps', b.find(W + p).componentNames);
}

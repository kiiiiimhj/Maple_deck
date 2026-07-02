const { UIBuilder } = require('./.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs');

async function main() {
  const b = UIBuilder.load('ui/DefaultGroup.ui');

  // 1. CardTooltip 패널 — 올바른 크기/위치/비활성화
  //    bottom_center = AnchorsMin/Max x=0.5,y=0 → 화면 하단 중앙 기준
  //    pos y=300 → 화면 하단에서 위로 300px (카드슬롯 바로 위)
  b.patch('CardTooltip', {
    anchor: 'bottom_center',
    pos: [0, 300],
    rect_size: [270, 130],
    enable: false,
  });

  // 2. TooltipBg — 배경 패널과 동일한 크기로 stretch
  b.patch('CardTooltip/TooltipBg', {
    anchor: 'stretch',
    pos: [0, 0],
    rect_size: [270, 130],
    color: [0.95, 0.95, 0.95],
    alpha: 0.97,
  });

  // 3. TooltipName (이름) — y+ = 위이므로 +36에 배치
  b.patch('CardTooltip/TooltipName', {
    anchor: 'middle_center',
    pos: [0, 36],
    rect_size: [254, 28],
    size: 17,
    bold: true,
    color: [0.08, 0.08, 0.08],
  });

  // 4. TooltipDmg (데미지) — 중앙
  b.patch('CardTooltip/TooltipDmg', {
    anchor: 'middle_center',
    pos: [0, 0],
    rect_size: [254, 24],
    size: 14,
    color: [0.12, 0.12, 0.12],
  });

  // 5. TooltipCd (쿨타임) — y- = 아래이므로 -36에 배치
  b.patch('CardTooltip/TooltipCd', {
    anchor: 'middle_center',
    pos: [0, -36],
    rect_size: [254, 24],
    size: 14,
    color: [0.12, 0.12, 0.12],
  });

  const result = b.write('ui/DefaultGroup.ui');
  if (result && result.warnings && result.warnings.length > 0) {
    result.warnings.slice(0, 5).forEach(w => console.log('WARN:', w.rule, w.message));
  }
  if (result && result.errors && result.errors.length > 0) {
    result.errors.forEach(e => console.log('ERROR:', e.rule, e.message));
  }
  console.log('Done. entities:', b.listEntities().length);
}

main().catch(e => { console.error(e.message || e); process.exit(1); });

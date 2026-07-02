const { UIBuilder } = require('./.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs');

async function main() {
  const b = UIBuilder.load('ui/DefaultGroup.ui');

  // SlotBtn 1~5 배경 완전 투명화
  for (let i = 1; i <= 5; i++) {
    const path = `CardSlots/Card${i}/SlotBtn${i}`;
    b.patchComponent(path, 'MOD.Core.SpriteGUIRendererComponent', {
      Color: { r: 1, g: 1, b: 1, a: 0 },
    });
    // ButtonComponent NormalColor도 투명하게
    b.patchComponent(path, 'MOD.Core.ButtonComponent', {
      Colors: {
        NormalColor:      { r: 1, g: 1, b: 1, a: 0 },
        HighlightedColor: { r: 1, g: 1, b: 1, a: 0.05 },
        PressedColor:     { r: 1, g: 1, b: 1, a: 0.1  },
        SelectedColor:    { r: 1, g: 1, b: 1, a: 0.05 },
        DisabledColor:    { r: 1, g: 1, b: 1, a: 0    },
        ColorMultiplier: 1,
        FadeDuration: 0.1,
      },
    });
    console.log('Patched:', path);
  }

  const result = b.write('ui/DefaultGroup.ui');
  const warns = (result && result.warnings || []).length;
  const errs  = (result && result.errors   || []).length;
  console.log(`Done. warnings=${warns} errors=${errs}`);
}

main().catch(e => { console.error(e.message || e); process.exit(1); });

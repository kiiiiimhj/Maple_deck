// 2026-09-23 유저 지정
//  ① 레이드 입장 로딩의 "보스 레이드" 제목 글꼴 → Maple
//  ② 인벤 아바타 영역: "캐시 아이템" 버튼(오른쪽 위)과 대칭 위치에 같은 디자인·다른 색(btn_green) "능력치" 버튼
//  ③ 누르면 아바타 영역(PlayerBG 크기)에 딤드 팝업 — 레이드 보상 목록과 같은 스타일로 장비 능력치 9줄
const { UIBuilder } = require('../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs');
const clone = (o) => JSON.parse(JSON.stringify(o));

// ① 로딩 제목
{
  const F = 'ui/LoadingGroup.ui';
  const b = UIBuilder.load(F);
  b.patchComponent('Screen/RaidTitle', 'MOD.Core.TextGUIRendererComponent', { Font: 'Maple' });
  b.write(F);
}

// ②③ 장비창
const F = 'ui/EquipmentGroup.ui';
const b = UIBuilder.load(F);
const PI = 'Inventory/Panel/EquipPanel/PlayerInfo';
const BTN_GREEN = 'df2b5cfae20e4cf7a0eeb4528e43a1be';
const CLOSE_RUID = '84bf090442a841899f5274ad5f7725dd';
const FLAT = '2860136c06ab075439721c027de365af';
const GOLD = { r: 1, g: 0.8392157, b: 0.360784322, a: 1 };
const LABEL_KEYS = [12, 13, 14, 15, 16, 17, 18, 19, 20].map((n) => 'MLUA_UIEQUIPPEDGEARPANEL_0' + n);

function copyEntity(src, dst, mutate) {
  if (!b.find(dst)) b.empty(dst, {});
  const list = clone(b.find(src).jsonString['@components']);
  if (mutate) mutate(list);
  for (const c of list) b.upsertComponent(dst, c['@type'], c);
}
function setPos(list, x, y) {
  const t = list.find((c) => c['@type'] === 'MOD.Core.UITransformComponent');
  const dx = x - t.anchoredPosition.x, dy = y - t.anchoredPosition.y;
  t.anchoredPosition = { x, y };
  t.Position = { x: t.Position.x + dx, y: t.Position.y + dy, z: t.Position.z || 0 };
  t.OffsetMin = { x: t.OffsetMin.x + dx, y: t.OffsetMin.y + dy };
  t.OffsetMax = { x: t.OffsetMax.x + dx, y: t.OffsetMax.y + dy };
}

// ② 버튼 — 캐시 아이템 토글(x 169)을 그대로 복제해 x -169로, 그림만 btn_green
copyEntity(PI + '/AvatarViewToggle', PI + '/StatButton', (l) => {
  setPos(l, -169, 322);
  l.find((c) => c['@type'] === 'MOD.Core.SpriteGUIRendererComponent').ImageRUID = { DataId: BTN_GREEN };
});
copyEntity(PI + '/AvatarViewToggle/Label', PI + '/StatButton/Label', (l) => {
  const t = l.find((c) => c['@type'] === 'MOD.Core.TextGUIRendererComponent');
  t.Text = 'MLUA_UIEQUIPPEDGEARPANEL_010';
  t.IsLocalizationKey = true;
  t.OutlineColor = { r: 0.04, g: 0.22, b: 0.06, a: 1 }; // 초록 버튼에 맞춘 짙은 초록 외곽선
});

// ③ 팝업 — PlayerBG(0,50 / 420x472) 위에 딱 맞춘다
const P = PI + '/StatPopup';
b.empty(P, { anchor: 'middle-center', pos: [0, 50], rect_size: [420, 472], enable: false });
b.button(P + '/Dim', '', { anchor: 'middle-center', pos: [0, 0], rect_size: [420, 472], bg_color: { r: 0, g: 0, b: 0, a: 0.66 } });
b.patchComponent(P + '/Dim', 'MOD.Core.SpriteGUIRendererComponent', { ImageRUID: { DataId: FLAT }, Type: 1 });
b.patchComponent(P + '/Dim', 'MOD.Core.ButtonComponent', { Transition: 0 });
b.sprite(P + '/Window', { anchor: 'middle-center', pos: [0, 0], rect_size: [404, 456], color: { r: 0.05, g: 0.06, b: 0.1, a: 0.97 }, image_ruid: FLAT, sprite_type: 1, raycast: true });
b.text(P + '/Window/Title', 'MLUA_UIEQUIPPEDGEARPANEL_011', { size: 28, bold: true, anchor: 'middle-center', pos: [-20, 196], rect_size: [300, 40], alignment: 3 });
b.patchComponent(P + '/Window/Title', 'MOD.Core.TextGUIRendererComponent', { Font: 'Maple', FontColor: GOLD, IsLocalizationKey: true, HorizontalAlignment: 1, VerticalAlignment: 512 });
b.button(P + '/Window/BtnClose', '', { anchor: 'middle-center', pos: [168, 196], rect_size: [48, 48], image_ruid: CLOSE_RUID, bg_color: { r: 1, g: 1, b: 1, a: 0.95 } });
b.patchComponent(P + '/Window/BtnClose', 'MOD.Core.SpriteGUIRendererComponent', { Type: 0 });

LABEL_KEYS.forEach((key, i) => {
  const R = P + '/Window/Row' + i;
  const y = 140 - i * 40;
  b.empty(R, { anchor: 'middle-center', pos: [0, y], rect_size: [376, 38] });
  b.sprite(R + '/Bg', { anchor: 'middle-center', pos: [0, 0], rect_size: [376, 36], color: { r: 1, g: 1, b: 1, a: i % 2 === 0 ? 0.06 : 0.02 }, image_ruid: FLAT, sprite_type: 1 });
  b.text(R + '/Name', key, { size: 21, bold: true, anchor: 'middle-center', pos: [-68, 0], rect_size: [220, 34], alignment: 3, bestfit: true, min_size: 12, max_size: 21 });
  b.patchComponent(R + '/Name', 'MOD.Core.TextGUIRendererComponent', { Font: 'Maple', IsLocalizationKey: true, HorizontalAlignment: 1, VerticalAlignment: 512, FontColor: { r: 0.86, g: 0.9, b: 0.96, a: 1 } });
  b.text(R + '/Value', '-', { size: 22, bold: true, anchor: 'middle-center', pos: [110, 0], rect_size: [140, 34], alignment: 5, bestfit: true, min_size: 12, max_size: 22 });
  b.patchComponent(R + '/Value', 'MOD.Core.TextGUIRendererComponent', { Font: 'Maple', HorizontalAlignment: 4, VerticalAlignment: 512, FontColor: GOLD });
});

b.write(F, {
  bind: {
    mlua: 'RootDesk/MyDesk/UIEquippedGearPanel.mlua',
    props: {
      statBtn: PI + '/StatButton',
      statPopup: P,
      statDimBtn: P + '/Dim',
      statCloseBtn: P + '/Window/BtnClose',
    },
  },
});
for (const e of b.listEntities().filter((e) => /PlayerInfo\/(StatButton|StatPopup)/.test(e.path) && e.depth <= 8 && !/Row[1-8]/.test(e.path)))
  console.log(e.path.split('PlayerInfo/')[1], JSON.stringify(e.pos), JSON.stringify(e.size), e.enable);

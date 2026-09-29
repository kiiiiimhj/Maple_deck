const assert = require('assert/strict');
const {UIBuilder} = require('../../../.agents/skills/msw-ui-system/scripts/msw_ui_builder.cjs');
const file = 'ui/WorldCharacterSelectGroup.ui';
const b = UIBuilder.read(file);
const root = '/ui/WorldCharacterSelectGroup/Panel/';
const S = 'MOD.Core.SpriteGUIRendererComponent';
const original = new Map(b.listEntities().map(e=>[e.path,JSON.stringify(b.find(e.path))]));
const allowed = new Set();
for (const [side,order] of [['Left',6],['Right',8],['Center',10]]) {
  const center=side==='Center';
  const frame=root+'WorldImage'+side, photo=frame+'Photo';
  // Keep photo transforms/children fixed: only the image extends underneath the rim.
  b.patch(photo,{display_order:order});
  b.patch(frame,{display_order:order+1});
  b.patchComponent(frame,S,{ImageRUID:{DataId:'de81ff0588cf4abc8dd04cf7e83d180f'}});
  b.patchComponent(photo,S,{LocalScale:{x:center?528/510:360/344,y:center?174/154.3077:124/109}});
  allowed.add(photo); allowed.add(frame);
  if(center) {
    b.patchComponent(photo+'/LockOverlay',S,{LocalScale:{x:528/510,y:174/154}});
    allowed.add(photo+'/LockOverlay');
  }
}
for (const e of b.listEntities()) if(!allowed.has(e.path)) assert.equal(JSON.stringify(b.find(e.path)),original.get(e.path),'Unexpected change: '+e.path);
assert.equal(b.listEntities().length,83);
assert.deepEqual(b.validate(),[]);
b.write(file);
console.log('Only map image coverage, lock dim coverage and frame/photo order changed.');

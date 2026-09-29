const fs=require('fs'),path=require('path'),assert=require('assert');
const {UIBuilder}=require('../../../.agents/skills/msw-ui-system/scripts/msw_ui_builder.cjs');
const {lintUiFile}=require('../../../.agents/skills/msw-ui-system/scripts/ui_lint.cjs');
const b=UIBuilder.read('ui/TitleGroup.ui'),old=UIBuilder.read(path.join(__dirname,'before.ui'));
const P='/ui/TitleGroup/RankPanel',S='MOD.Core.SpriteGUIRendererComponent',T='MOD.Core.TextComponent',U='MOD.Core.UITransformComponent';
const f32=x=>typeof x==='number'?Math.fround(x):Array.isArray(x)?x.map(f32):x&&typeof x==='object'?Object.fromEntries(Object.entries(x).map(([k,v])=>[k,f32(v)])):x;
const entities=b.listEntities(),before=old.listEntities();assert.strictEqual(entities.length,before.length);
let unchanged=0,labels=0;
for(const e of before){
 assert.strictEqual(b.getId(e.path),old.getId(e.path),'Entity ID: '+e.path);
 if(!e.path.startsWith(P)){assert.deepStrictEqual(f32(b.find(e.path)),f32(old.find(e.path)),'Unrelated lobby entity: '+e.path);unchanged++;}
 else if(old.hasComponent(e.path,T)){const a=b.getComponent(e.path,T),o=old.getComponent(e.path,T);for(const k of ['Text','IsLocalizationKey','AllowAutomaticTranslation'])assert.deepStrictEqual(a[k],o[k],e.path+' '+k);labels++;}
}
const resources=require('./resources.json');
assert.strictEqual(b.getComponent(P+'/Bg',S).ImageRUID.DataId,resources.background.ruid);
assert.strictEqual(b.getComponent(P+'/Frame',S).ImageRUID.DataId,resources.sidebar.ruid);
assert.strictEqual(b.getComponent(P+'/Tabs/TabUnlimited',S).ImageRUID.DataId,resources.tab_button.ruid);
assert.strictEqual(b.getComponent(P+'/Board',U).RectSize.x,1000);
assert.strictEqual(b.getComponent(P+'/Board/ListArea','MOD.Core.GridViewComponent').CellSize.x,900);
assert.deepStrictEqual(f32(b.getComponent(P+'/Board/ScrollBar','MOD.Core.SliderComponent')),f32(old.getComponent(P+'/Board/ScrollBar','MOD.Core.SliderComponent')));
for(const p of [P,P+'/Bg']){const c=b.getComponent(p,U);assert.strictEqual(c.AlignmentOption,15);assert.deepStrictEqual(c.OffsetMin,{x:0,y:0});assert.deepStrictEqual(c.OffsetMax,{x:0,y:0});}
const previous=fs.readFileSync(path.join(__dirname,'RankUI.before.mlua'),'utf8').replace(/\r\n/g,'\n');
const current=fs.readFileSync('RootDesk/MyDesk/UI/RankUI.mlua','utf8').replace(/\r\n/g,'\n');
const expected=previous.replace('Color(0.85, 0.63, 0.24, 1)','Color(1, 1, 1, 1)').replace('Color(0.34, 0.21, 0.11, 1)','Color(0.56, 0.52, 0.44, 1)');
assert.strictEqual(current.trim(),expected.trim(),'Only two tab color defaults may change in RankUI');
const rankFindings=lintUiFile('ui/TitleGroup.ui').filter(x=>x.path.startsWith(P));
assert.strictEqual(rankFindings.filter(x=>x.severity==='error').length,0,JSON.stringify(rankFindings));
const report={entities:entities.length,outsideRankingUnchanged:unchanged,localizedAndDynamicTextPreserved:labels,scriptOnlyTwoColorsChanged:true,sliderComponentUnchanged:true,rankingLintFindings:rankFindings,referenceHorizontalBounds:[-660,640],referenceSideMargins:[300,320],aspect4by3StaticSideMargins:[60,80],mobileDeviceTested:false};
fs.writeFileSync(path.join(__dirname,'persistence-verification.json'),JSON.stringify(report,null,2)+'\n');
const preview=process.argv[2];if(preview)fs.copyFileSync(preview,path.join(__dirname,'applied-preview.png'));
console.log(JSON.stringify(report));

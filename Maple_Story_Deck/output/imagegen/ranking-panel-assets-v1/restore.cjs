// Restore the ranking subtree only; keep any intervening edits elsewhere.
const fs=require('fs'),path=require('path'),assert=require('assert');
const {UIBuilder}=require('../../../.agents/skills/msw-ui-system/scripts/msw_ui_builder.cjs');
const file='ui/TitleGroup.ui',b=UIBuilder.read(file),old=UIBuilder.read(path.join(__dirname,'before.ui'));
const prefix='/ui/TitleGroup/RankPanel';
const f32=x=>typeof x==='number'?Math.fround(x):Array.isArray(x)?x.map(f32):x&&typeof x==='object'?Object.fromEntries(Object.entries(x).map(([k,v])=>[k,f32(v)])):x;
const outside=new Map(b.listEntities().filter(e=>!e.path.startsWith(prefix)).map(e=>[e.path,JSON.stringify(b.find(e.path))]));
const targets=old.listEntities().filter(e=>e.path.startsWith(prefix));
for(const e of targets){
 const previous=old.find(e.path),current=b.find(e.path);assert(current&&current.id===previous.id,'Missing or replaced entity: '+e.path);
 const j=previous.jsonString;
 b.patch(e.path,{enable:j.enable,visible:j.visible,display_order:j.displayOrder});
 for(const c of j['@components'])b.upsertComponent(e.path,c['@type'],c);
 assert.deepStrictEqual(f32(b.find(e.path)),f32(previous),'Restore mismatch: '+e.path);
}
for(const [p,json] of outside)assert.strictEqual(JSON.stringify(b.find(p)),json,'Unrelated entity changed: '+p);
const scriptPath='RootDesk/MyDesk/UI/RankUI.mlua',previous=fs.readFileSync(path.join(__dirname,'RankUI.before.mlua'),'utf8');
const current=fs.readFileSync(scriptPath,'utf8');let restored=current;
for(const name of ['TabOnColor','TabOffColor']){
 const re=new RegExp('property Color '+name+' = Color\\([^\\r\\n]*\\)');
 const orig=previous.match(re);assert(orig&&re.test(restored),'Missing color property '+name);
 restored=restored.replace(re,orig[0]);
}
const messages=[],saved=[console.log,console.warn,console.error];
try{console.log=console.warn=console.error=(...a)=>messages.push(a.join(' '));b.write(file,{strict:false});}
finally{[console.log,console.warn,console.error]=saved;fs.writeFileSync(path.join(__dirname,'restore-lint.log'),messages.join('\n'));}
fs.writeFileSync(scriptPath,restored);
fs.writeFileSync(path.join(__dirname,'restore-verification.json'),JSON.stringify({status:'restored',rankingEntities:targets.length,unrelatedEntitiesPreserved:outside.size,scriptChange:'Restored only TabOnColor and TabOffColor; other source preserved',generatedAssetsRetained:true},null,2)+'\n');
console.log(JSON.stringify({restoredRankingEntities:targets.length,unrelatedEntitiesPreserved:outside.size}));

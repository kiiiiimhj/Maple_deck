const fs=require('fs'),path=require('path');
const manifestPath=path.join(__dirname,'manifest.json');
const m=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
const generated='C:/Users/려진/.codex/generated_images/01a0dd97-7e96-7703-9bdc-be1ef10a7185/';
if(!m.unusedPopupDraft){
 m.unusedPopupDraft={previewSource:m.previewSource,previewPrompt:m.previewPrompt,assets:m.assets.filter(a=>a.key==='board'),uploadedRuid:'e3b38e3274d54bfca4cc98db5d88da45',status:'Superseded popup concept; not applied to the game'};
 fs.copyFileSync(m.previewSource,path.join(__dirname,'popup-draft-preview.png'));
}
m.previewSource=generated+'exec-7707fd37-5277-4aff-a5c5-7d75b7011b3c.png';
m.previewPrompt='Approved fullscreen ranking tab: edge-to-edge chestnut wood, inset title/wizard and table, original lobby navigation, no popup frame. Text and interactive components remain native UI.';
m.assets=m.assets.filter(a=>a.key!=='board'&&a.key!=='background'&&a.key!=='sidebar');
m.assets.find(a=>a.key==='tab_button').reusedRuid=require('../option-popup-assets-v1/resources.json').action_button.ruid;
m.assets.push({key:'sidebar',name:'ranking_wizard_sidebar_v1',source:generated+'exec-8d4f42b2-e578-4423-ade2-f66ae1014418.png',file:path.join(__dirname,'sidebar.png'),prompt:'Independent transparent vertical wood section for existing ranking title and wizard. Thin chestnut rails, quiet honey wood, tiny leaves at upper-left and two books with a parchment at the bottom. No text or character.'});
const source=generated+'exec-ce4dbcbb-51f5-44c5-a6ce-ca3a9f170e72.png';
const file=path.join(__dirname,'background.png');
fs.copyFileSync(source,file);
const png=fs.readFileSync(file),width=png.readUInt32BE(16),height=png.readUInt32BE(20);
m.assets.unshift({key:'background',name:'ranking_fullscreen_background_v1',source,file,width,height,bytes:png.length,bounds:[0,0,width,height],fullbleed:true,prompt:'Full opaque chestnut wood backdrop extracted from approved fullscreen ranking design; no text, frames, buttons, rows, characters or decorations.'});
fs.copyFileSync(m.previewSource,path.join(__dirname,'design-preview.png'));
fs.copyFileSync(m.beforeScreenshot,path.join(__dirname,'before-preview.png'));
const scriptBackup=path.join(__dirname,'RankUI.before.mlua');
if(!fs.existsSync(scriptBackup))fs.copyFileSync('RootDesk/MyDesk/UI/RankUI.mlua',scriptBackup);
fs.writeFileSync(manifestPath,JSON.stringify(m,null,2)+'\n');
require('./inspect-assets.cjs');

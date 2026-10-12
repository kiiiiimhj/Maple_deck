const fs=require('fs');
const {UIBuilder}=require('G:/Maple_Story_Deck/.agents/skills/msw-ui-system/scripts/msw_ui_builder.cjs');
fs.mkdirSync('work/pet-tutorial',{recursive:true});
const snapshots={};
for(const group of ['TitleGroup','RaidGroup','PetHouseGroup']){
 const b=UIBuilder.read('G:/Maple_Story_Deck/ui/'+group+'.ui');
 snapshots[group]={root:b.find('/').jsonString,entities:b.listEntities().filter(e=>group==='TitleGroup'?/RaidTutorial|RaidGuide|RaidUnlock/.test(e.path):group==='RaidGroup'?(b.getId(e.path)==='13cd8b68-a927-4e4a-b1b6-2f16d83e189a'||/Tutorial/.test(e.path)):e.depth<=2||/AffinityDial|CareMeters|AbilityCaption/.test(e.path)).map(e=>({...e,id:b.getId(e.path),data:b.find(e.path).jsonString}))};
}
fs.writeFileSync('work/pet-tutorial/ui-inspection.json',JSON.stringify(snapshots,null,2));
for(const [name,b] of Object.entries(snapshots)){
 console.log(name,JSON.stringify(b.root['@components']?.find(c=>c['@type']==='MOD.Core.UIGroupComponent')));
 for(const e of b.entities){const s=e.data['@components']?.find(c=>c['@type']==='MOD.Core.SpriteGUIRendererComponent');const t=e.data['@components']?.find(c=>c['@type']==='MOD.Core.TextGUIRendererComponent');if(name!=='PetHouseGroup'||e.depth<=2||/AffinityDial$/.test(e.path))console.log(JSON.stringify({path:e.path,id:e.id,pos:e.pos,size:e.size,enable:e.enable,ruid:s?.ImageRUID.DataId,text:t?.Text}));}
}

const {UIBuilder}=require('G:/Maple_Story_Deck/.agents/skills/msw-ui-system/scripts/msw_ui_builder.cjs');
const b=UIBuilder.read('G:/Maple_Story_Deck/ui/DefaultGroup.ui');
const panel=b.listEntities().find(e=>b.getId(e.path)==='912dac6b-4f48-4f6f-b3c8-fa320acb56f8');
for(const e of b.listEntities().filter(e=>e.path===panel.path||e.path.startsWith(panel.path+'/'))) console.log(JSON.stringify({path:e.path,data:b.find(e.path).jsonString}));

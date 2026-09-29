// Fullscreen ranking tab; all existing entity IDs and runtime controls are retained.
const fs=require('fs'),path=require('path'),assert=require('assert');
const {UIBuilder}=require('../../../.agents/skills/msw-ui-system/scripts/msw_ui_builder.cjs');
const {lintUiFile}=require('../../../.agents/skills/msw-ui-system/scripts/ui_lint.cjs');
const resources=require('./resources.json'),manifest=require('./manifest.json');
const file='ui/TitleGroup.ui',b=UIBuilder.read(file),baseline=UIBuilder.read(path.join(__dirname,'before.ui'));
const P='/ui/TitleGroup/RankPanel',S='MOD.Core.SpriteGUIRendererComponent',T='MOD.Core.TextComponent',U='MOD.Core.UITransformComponent';
const rgba=(r,g,b,a=1)=>({r,g,b,a}),cream=rgba(1,.96,.85),ink=rgba(.23,.13,.065),white=rgba(1,1,1);
const flat='4fea64a3307cda641809ad8be0d4890b';
const pos=(p,x,y,w,h)=>b.patch(P+p,{anchor:'middle-center',pivot:[.5,.5],pos:[x,y],rect_size:[w,h]});
const tint=(p,c)=>b.patchComponent(P+p,S,{Color:c});
const type=(p,size,min,color=cream)=>b.patchComponent(P+p,T,{Font:1,FontSize:size,MaxSize:size,MinSize:min,BestFit:true,SizeFit:false,Bold:true,Alignment:4,FontColor:color,Overflow:2});
const originalPaths=b.listEntities().map(e=>e.path);
const outside=new Map(originalPaths.filter(p=>!p.startsWith(P)).map(p=>[p,JSON.stringify(b.find(p))]));
const textKeys=new Map(originalPaths.filter(p=>p.startsWith(P)&&b.hasComponent(p,T)).map(p=>{const c=b.getComponent(p,T);return [p,[c.Text,c.IsLocalizationKey,c.AllowAutomaticTranslation]];}));

for(const p of [P,P+'/Bg']){
 b.patch(p,{anchor:'stretch',pivot:[.5,.5],pos:[0,0],rect_size:[1920,1080]});
 b.patchComponent(p,U,{OffsetMin:{x:0,y:0},OffsetMax:{x:0,y:0}});
}
b.patchComponent(P+'/Bg',S,{ImageRUID:{DataId:resources.background.ruid},Type:0,PreserveSprite:0,Color:white,LocalScale:{x:1,y:1},LocalPosition:{x:0,y:0},RaycastTarget:false});
pos('/Frame',-520,27,280,660);
b.patch(P+'/Frame',{enable:true});
const sidebar=manifest.assets.find(a=>a.key==='sidebar');
const [lx0,ly0,lx1,ly1]=sidebar.bounds,lsx=280/(lx1-lx0),lsy=660/(ly1-ly0);
b.patchComponent(P+'/Frame',S,{ImageRUID:{DataId:resources.sidebar.ruid},Type:0,PreserveSprite:0,Color:white,
 LocalScale:{x:sidebar.width*lsx/280,y:sidebar.height*lsy/660},
 LocalPosition:{x:-(.5*(lx0+lx1)-sidebar.width/2)*lsx,y:(.5*(ly0+ly1)-sidebar.height/2)*lsy}});
pos('/Title',-520,280,240,88);
type('/Title',56,26);
b.patchComponent(P+'/Title',T,{UseOutLine:true,OutlineWidth:1,OutlineColor:rgba(.3,.16,.07),DropShadow:true,DropShadowColor:rgba(.12,.065,.025,.4),DropShadowDistance:2});
pos('/MascotIcon',-520,100,220,197.373);

// Two existing mode buttons reuse the separate green Options button sprite.
pos('/Tabs',140,402,1000,96);
const a=manifest.assets.find(a=>a.key==='tab_button');
for(const [name,x,selected] of [['TabUnlimited',-305,true],['TabTimeAttack',41,false]]){
 const p='/Tabs/'+name;
 pos(p,x,0,330,92);
 const [x0,y0,x1,y1]=a.bounds,sx=318/(x1-x0),sy=78/(y1-y0);
 b.patchComponent(P+p,S,{ImageRUID:{DataId:resources.tab_button.ruid},Type:0,PreserveSprite:0,
  Color:selected?white:rgba(.56,.52,.44),
  LocalScale:{x:a.width*sx/330,y:a.height*sy/92},
  LocalPosition:{x:-(.5*(x0+x1)-a.width/2)*sx,y:(.5*(y0+y1)-a.height/2)*sy}});
 pos(p+'/Label',0,0,282,48);
 type(p+'/Label',30,20);
 b.patchComponent(P+p+'/Label',T,{UseOutLine:true,OutlineWidth:1,OutlineColor:rgba(.17,.2,.06)});
}

// Content spans x=-660..640: 300/320px side margins on a 1920px reference canvas.
pos('/Board',140,27,1000,660);
tint('/Board',rgba(.19,.105,.05,.65));
pos('/Board/Header',-20,300,900,56);
tint('/Board/Header',rgba(.23,.125,.055,.6));
for(const [name,x,w] of [['ColRank',-375,130],['ColName',-20,360],['ColScore',300,250]]){
 const p='/Board/Header/'+name;pos(p,x,0,w,44);type(p,28,22);
}
const rowColors=[rgba(.72,.52,.23,.72),rgba(.65,.61,.53,.57),rgba(.66,.42,.26,.68),rgba(.7,.51,.34,.22)];
const rows=['/Board/MedalRow1','/Board/MedalRow2','/Board/MedalRow3','/Board/ListArea/RowTemplate'];
rows.forEach((p,i)=>{
 pos(p,i===3?0:-20,i===3?0:[232,164,96][i],900,62);tint(p,rowColors[i]);
 pos(p+'/Avatar',-250,0,48,48);
 pos(p+'/RankText',-375,0,120,44);type(p+'/RankText',30,22);
 pos(p+'/NameText',-20,0,360,44);type(p+'/NameText',30,22);
 pos(p+'/ScoreText',300,0,250,44);type(p+'/ScoreText',30,22,i===0?rgba(1,.87,.46):cream);
 if(i<3)pos(p+'/Medal',-375,0,74,57.756);
});
pos('/Board/ListArea',-20,-97,900,318);
b.patchComponent(P+'/Board/ListArea','MOD.Core.GridViewComponent',{CellSize:{x:900,y:62}});
pos('/Board/EmptyText',-20,-97,830,80);type('/Board/EmptyText',30,22);

pos('/Board/MyRankRow',-20,-291,900,66);tint('/Board/MyRankRow',rgba(.91,.85,.69,.98));
for(const [name,x,w,font,min] of [['Label',-375,140,26,20],['RankText',-255,100,28,18],['NameText',-20,330,30,22],['ScoreText',300,250,30,22]]){
 const p='/Board/MyRankRow/'+name;pos(p,x,0,w,44);type(p,font,min,ink);
}
pos('/Board/MyRankRow/Avatar',-195,0,32,40);
// Preserve the complete SliderComponent, including the original green gem handle.
pos('/Board/ScrollBar',460,4,36,519);
tint('/Board/ScrollBar',rgba(.17,.09,.04,.8));

assert.deepStrictEqual(b.listEntities().map(e=>e.path),originalPaths,'No entity may be added, removed, or renamed');
for(const p of originalPaths)assert.strictEqual(b.getId(p),baseline.getId(p),'UUID changed: '+p);
for(const [p,value] of outside)assert.strictEqual(JSON.stringify(b.find(p)),value,'Unrelated lobby entity changed: '+p);
for(const [p,keys] of textKeys){const c=b.getComponent(p,T);assert.deepStrictEqual([c.Text,c.IsLocalizationKey,c.AllowAutomaticTranslation],keys,'Localization/text changed: '+p);}
assert.deepStrictEqual(b.getComponent(P+'/Board/ScrollBar','MOD.Core.SliderComponent'),baseline.getComponent(P+'/Board/ScrollBar','MOD.Core.SliderComponent'));
for(const name of ['TabUnlimited','TabTimeAttack'])assert.deepStrictEqual(b.getComponent(P+'/Tabs/'+name,'MOD.Core.ButtonComponent'),baseline.getComponent(P+'/Tabs/'+name,'MOD.Core.ButtonComponent'));
// Existing horizontal Shop/Skill/Relic scroll content has baseline off-canvas
// lint errors. Compare the candidate before allowing those same legacy errors.
const candidate=path.join(__dirname,'applied-layout.ui');
b.write(candidate,{lint:false});
const previousFindings=lintUiFile(path.join(__dirname,'before.ui'));
const findings=lintUiFile(candidate),priorErrors=new Set(previousFindings.filter(f=>f.severity==='error').map(f=>JSON.stringify(f)));
const newErrors=findings.filter(f=>f.severity==='error'&&!priorErrors.has(JSON.stringify(f)));
const rankErrors=findings.filter(f=>f.severity==='error'&&f.path.startsWith(P));
assert.strictEqual(newErrors.length,0,JSON.stringify(newErrors));
assert.strictEqual(rankErrors.length,0,JSON.stringify(rankErrors));
const report={entities:originalPaths.length,outsideRankingUnchanged:outside.size,localizationPreserved:textKeys.size,scrollHandlePreserved:true,fullscreenBackground:resources.background.ruid,sidebar:resources.sidebar.ruid,contentHorizontalBounds:[-660,640],sideMargins1920:[300,320],baselineLintErrors:priorErrors.size,newLintErrors:newErrors,rankingLintFindings:findings.filter(f=>f.path.startsWith(P))};
fs.writeFileSync(path.join(__dirname,'authoring-verification.json'),JSON.stringify(report,null,2)+'\n');
const writeLog=[],oldLog=console.log,oldWarn=console.warn,oldError=console.error;
try{console.log=console.warn=console.error=(...args)=>writeLog.push(args.join(' '));b.write(file,{strict:false});}
finally{console.log=oldLog;console.warn=oldWarn;console.error=oldError;fs.writeFileSync(path.join(__dirname,'write-lint.log'),writeLog.join('\n'));}
console.log(JSON.stringify(report));

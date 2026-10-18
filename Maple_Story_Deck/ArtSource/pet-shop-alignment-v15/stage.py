from pathlib import Path
import ast,sys
stage=Path('work/pet-shop-alignment-v15')
source=(stage/'ShopUI.mlua.before').read_text(encoding='utf-8-sig')
def replace(old,new):
 global source
 assert source.count(old)==1,old
 source=source.replace(old,new,1)
replace('r.VerticalAlignment=TextVerticalAlignmentOption.Middle;r.OutlineWidth=0;r.Underlay=false',
        'r.VerticalAlignment=TextVerticalAlignmentOption.Middle;r.Padding=RectOffset(0,0,0,0);r.OutlineWidth=0;r.Underlay=false')
replace('self:PlacePetShopElement(skillIcon,-92,-96,42,42)',
        'self:PlacePetShopElement(skillIcon,-116,-96,40,40)')
replace('self:PlacePetShopElement(skillName,22,-96,196,40)',
        'self:PlacePetShopElement(skillName,22,-96,224,40)\n\t\t\tskillName.TextGUIRendererComponent.HorizontalAlignment=TextHorizontalAlignmentOption.Left')
replace('self:PlacePetShopElement(priceText,0,0,252,50)',
        'self:PlacePetShopElement(priceText,0,4,252,50)')
replace('priceText.TextGUIRendererComponent.FontSize=31;priceText.TextGUIRendererComponent.BestFit=false',
        'local pr=priceText.TextGUIRendererComponent;pr.FontSize=31;pr.BestFit=false;pr.SizeFit=false\n\t\t\tpr.HorizontalAlignment=TextHorizontalAlignmentOption.Center;pr.VerticalAlignment=TextVerticalAlignmentOption.Middle;pr.Padding=RectOffset(0,0,0,0)')
replace('c.skillIcon.SpriteGUIRendererComponent.ImageRUID=DataRef(skill.icon)',
'''-- Source icons can use a bottom pivot (Bugi); center their visible image in the shared slot.
				local icon=_ResourceService:LoadSpriteAndWait(skill.icon)
				local iconScale=math.min(40/math.max(1,icon.Width),40/math.max(1,icon.Height))
				local ir=c.skillIcon.SpriteGUIRendererComponent;ir.ImageRUID=DataRef(skill.icon)
				ir.LocalPosition=Vector2((icon.Pivot.x-.5)*icon.Width,(icon.Pivot.y-.5)*icon.Height-2/iconScale)''')
(stage/'ShopUI.mlua').write_text(source,encoding='utf-8',newline='\r\n')
tree=ast.parse(Path('work/pet-ttungttang/verify.py').read_text())
fn=next(n for n in tree.body if isinstance(n,ast.FunctionDef)and n.name=='translate')
env={};exec('import re\n'+ast.unparse(fn),env)
sys.path.insert(0,'work/ranged-lua-runtime');from lupa import LuaRuntime
rt=LuaRuntime();rt.execute('function Vector2(x,y)return{x=x,y=y}end;function Vector3(x,y,z)return{x=x,y=y,z=z}end;function Color(r,g,b,a)return{r=r,g=g,b=b,a=a}end')
rt.execute(env['translate'](source))
apply=Path('work/pet-shop-ui-v14/apply.py').read_text(encoding='utf-8').replace('pet-shop-ui-v14','pet-shop-alignment-v15').replace('Applied slot variation selection and artwork.','Applied pet shop skill and price alignment.')
(stage/'apply.py').write_text(apply,encoding='utf-8')
print('Staged ShopUI alignment; Lua syntax passed.')

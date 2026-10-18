from pathlib import Path
import ast,sys
stage=Path('work/pet-shop-alignment-v16');out=Path('outputs/pet-shop-alignment-v16')
stage.mkdir(parents=True,exist_ok=True);out.mkdir(parents=True,exist_ok=True)
project=Path('G:/Maple_Story_Deck/RootDesk/MyDesk')
for name,folder in [('ShopUI.mlua','UI'),('ShopPurchaseLogic.mlua','UI'),('PetLogic.mlua','Pet'),('PetHouseUI.mlua','Pet')]:
 before=stage/(name+'.before')
 if not before.exists():before.write_bytes((project/folder/name).read_bytes())
source=(stage/'ShopUI.mlua.before').read_text(encoding='utf-8-sig')
old='c.skillName.TextGUIRendererComponent.Text=skill.name'
new='''c.skillName.TextGUIRendererComponent.Text=skill.name
			-- Center the icon and actual text width as one compact row.
			local nameWidth=math.max(1,math.ceil(c.skillName.TextGUIRendererComponent:GetPreferredWidth(skill.name)))
			local groupWidth=40+6+nameWidth
			self:PlacePetShopElement(c.skillIcon,-groupWidth/2+20,-96,40,40)
			self:PlacePetShopElement(c.skillName,-groupWidth/2+46+nameWidth/2,-96,nameWidth,40)'''
assert source.count(old)==1
source=source.replace(old,new,1)
(stage/'ShopUI.mlua').write_text(source,encoding='utf-8',newline='\r\n')
tree=ast.parse(Path('work/pet-ttungttang/verify.py').read_text())
fn=next(n for n in tree.body if isinstance(n,ast.FunctionDef)and n.name=='translate')
env={};exec('import re\n'+ast.unparse(fn),env)
sys.path.insert(0,'work/ranged-lua-runtime');from lupa import LuaRuntime
rt=LuaRuntime();rt.execute('function Vector2(x,y)return{x=x,y=y}end;function Vector3(x,y,z)return{x=x,y=y,z=z}end;function Color(r,g,b,a)return{r=r,g=g,b=b,a=a}end')
rt.execute(env['translate'](source))
apply=Path('work/pet-shop-alignment-v15/apply.py').read_text(encoding='utf-8').replace('pet-shop-alignment-v15','pet-shop-alignment-v16').replace('Applied pet shop skill and price alignment.','Applied centered skill icon and name groups.')
(stage/'apply.py').write_text(apply,encoding='utf-8')
verify=Path('work/pet-shop-alignment-v15/verify.py').read_text(encoding='utf-8').replace('pet-shop-alignment-v15','pet-shop-alignment-v16')
verify=verify.replace("assert x['iconX']==-116 and x['gap']==6 and x['nameAlign']=='Left'and x['namePadding']==0,x", "assert x['gap']==6 and x['nameAlign']=='Left'and x['namePadding']==0,x\n  left=x['iconX']-x['iconWidth']/2;right=x['nameX']+x['nameWidth']/2\n  assert abs((left+right)/2)<.01 and right-left<=282,x")
verify=verify.replace('four cards, 6 px icon/name gap, centered descriptions and prices','four centered skill groups, 6 px icon/name gap, centered descriptions and prices')
(stage/'verify.py').write_text(verify,encoding='utf-8')
print('Staged compact, centered skill rows; syntax passed.')

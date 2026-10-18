from pathlib import Path
import re,ast,sys
stage=Path('work/pet-shop-ui-v14');out=Path('outputs/pet-shop-ui-v14');source=(stage/'ShopUI.mlua.before').read_text(encoding='utf-8-sig')
source=source.replace('self:ConnectSkinCards()\n','self:ConnectSkinCards()\n\t\tself:InitializePetShopUI()\n',1)
source=source.replace('self.skinPanel.Enable = not isDiamond','self.skinPanel.Enable = (tabName == "skin")\n\t\tlocal petShop=self._T.petShop\n\t\tif petShop~=nil then petShop.panel.Enable=(tabName=="pet");if tabName=="pet" then self:RefreshPetShopUI() end end',1)
a=source.index('\tmethod void RefreshTabVisual()');b=source.index('\n\tend',a)
source=source[:a]+'''\tmethod void RefreshTabVisual()
		local tabs={{entity=self.tabDiamond.Entity,key="diamond"},{entity=self.tabSkin.Entity,key="skin"}}
		if self._T.petShop~=nil then table.insert(tabs,{entity=self._T.petShop.tab,key="pet"}) end
		for _,row in ipairs(tabs) do
			local r=row.entity.SpriteGUIRendererComponent
			r.ImageRUID=DataRef(self._currentTab==row.key and "0cfbd6e3aa6845abb4a42659d01b6078" or "df45bdb1640949c9b5269bbd4cee7a66")
			r.Color=Color(1,1,1,1)
		end'''+source[b:]
source=source.replace('\tmethod void OnEndPlay()\n','\tmethod void OnEndPlay()\n\t\tself:ClearPetShopUI()\n',1)
pos=source.rfind('\nend');source=source[:pos]+'\n'+(stage/'pet-shop-methods.mlua').read_text(encoding='utf-8')+source[pos:]
(stage/'ShopUI.mlua').write_text(source,encoding='utf-8',newline='\r\n')
tree=ast.parse(Path('work/pet-ttungttang/verify.py').read_text());fn=next(n for n in tree.body if isinstance(n,ast.FunctionDef)and n.name=='translate');env={};exec('import re\n'+ast.unparse(fn),env);sys.path.insert(0,'work/ranged-lua-runtime');from lupa import LuaRuntime
rt=LuaRuntime();rt.execute('function Vector2(x,y)return{x=x,y=y}end;function Vector3(x,y,z)return{x=x,y=y,z=z}end;function Color(r,g,b,a)return{r=r,g=g,b=b,a=a}end');rt.execute(env['translate'](source))
print('Staged shop-only pet preview tab: four pets, 1300 coins, no purchase registration or grant logic. Syntax passed.',flush=True)
apply=Path('work/pet-equipment-native-v11/apply.py').read_text().replace('pet-equipment-native-v11','pet-shop-ui-v14')
apply=apply.replace("pet=Path('G:/Maple_Story_Deck/RootDesk/MyDesk/Pet');names=['PetLogic.mlua','PetHouseUI.mlua','PetUI.mlua']","pet=Path('G:/Maple_Story_Deck/RootDesk/MyDesk/UI');names=['ShopUI.mlua']")
(stage/'apply.py').write_text(apply,encoding='utf-8')

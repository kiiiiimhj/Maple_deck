from pathlib import Path
import json,csv,io,re,ast,sys
stage=Path('work/pet-tutorial');out=Path('outputs/pet-tutorial')
assets=json.loads((out/'applied-assets.json').read_text(encoding='utf-8'))
def once(s,old,new):assert s.count(old)==1,(old[:70],s.count(old));return s.replace(old,new)
s=(stage/'PetHouseUI.mlua.before').read_text(encoding='utf-8-sig')
props='''\tproperty Entity TutorialHelp = ""
\tproperty Entity TutorialRoot = ""
\tproperty Entity TutorialContent = ""
\tproperty boolean PetTutorialOpen = false
\tproperty boolean PetTutorialReady = false
\tproperty integer PetTutorialRevealed = 0
\tproperty number PetTutorialTime = 0
\tproperty number PetTutorialScale = 1
\tproperty Vector2 PetTutorialCanvasSize = Vector2(0,0)
\tproperty table PetTutorialAges = {}
\tproperty table PetTutorialImages = {RUIDS}
'''.replace('RUIDS',','.join('"'+assets[k]['ruid']+'"'for k in ['care','rewards','stones','adventure']))
s=once(s,'\tproperty Entity Overlay =',props+'\tproperty Entity Overlay =')
s=once(s,'\t self:InitializeGrowthDisplay()','\t self:InitializeGrowthDisplay()\n\t self:InitializePetTutorial()')
s=once(s,'\tmethod void Close()\n','\tmethod void Close()\n\t self:ClosePetTutorial()\n')
s=once(s,'\tmethod void OnUpdate(number delta)\n','\tmethod void OnUpdate(number delta)\n\t self:TickPetTutorial(delta)\n')
for method in ['BuyEgg()','OpenStatPopup()','MovePet(integer direction)','RequestCare(string action)']:
    signature='\tmethod void '+method+'\n';s=once(s,signature,signature+'\t\tif self.PetTutorialOpen then return end\n')
s=once(s,'if not self.PetMode or not self.StoneTouchArea.Enable then','if not self.PetMode or self.PetTutorialOpen or not self.StoneTouchArea.Enable then')
end=s.rfind('\nend');s=s[:end]+'\n'+(stage/'TutorialMethods.mlua').read_text(encoding='utf-8')+s[end:]
(stage/'PetHouseUI.mlua').write_text(s,encoding='utf-8')
translations=json.loads((stage/'translations.json').read_text(encoding='utf-8'))
raw=(stage/'GameText.csv.before').read_bytes();rows=list(csv.DictReader(io.StringIO(raw.decode('utf-8-sig'))));keys={r['Key']for r in rows};assert not keys.intersection(translations)
fieldnames=list(rows[0]);stream=io.StringIO(newline='');writer=csv.DictWriter(stream,fieldnames=fieldnames,lineterminator='\n')
for key,values in translations.items():
    entry={field:''for field in fieldnames};entry.update({'Key':key,'Source':values['ko'].replace('\n','\\n'),'Note':'Pet-house illustrated tutorial'})
    for language,value in values.items():entry[language]=value.replace('\n','\\n')
    writer.writerow(entry)
(stage/'GameText.csv').write_bytes(raw+(b''if raw.endswith(b'\n')else b'\n')+stream.getvalue().encode('utf-8'))
assert len(list(csv.DictReader(io.StringIO((stage/'GameText.csv').read_text(encoding='utf-8-sig')))))==len(rows)+6
sys.path.insert(0,str(Path('work/ranged-lua-runtime').resolve()));from lupa import LuaRuntime
tree=ast.parse(Path('work/pet-ttungttang/verify.py').read_text(encoding='utf-8'));fn=next(n for n in tree.body if isinstance(n,ast.FunctionDef)and n.name=='translate');ns={'re':re};exec(compile(ast.Module(body=[fn],type_ignores=[]),'translator','exec'),ns)
lua=LuaRuntime();lua.execute('function Vector2(x,y)return {}end');lua.execute(ns['translate'](s))
print('Staged replayable four-step tutorial, input blocking, cleanup and five-language copy; mLua compiled.',flush=True)

from pathlib import Path
import sys,json,time
sys.path.insert(0,str(Path('work').resolve()));from maker_session import MakerSession
s=MakerSession()
try:
 script='''local L=_PetLogic;local id=nil;for k,_ in pairs(L.States)do id=k break end;local rec=L:ReadAccount(L:SerializeAccount(L.States[id]));rec.test=true;local p=rec.pets.ttungttang;p.Owned=true;p.GearOwnedMask=7;p.GearEquippedMask=7;local data=L:SerializeAccount(rec);local clone=L:ReadAccount(_HttpService:JSONDecode(_HttpService:JSONEncode(data)));log("[VRF] GEAR-PROBE clone="..tostring(clone~=nil).." v="..data.version)'''
 script='''log("[VRF] GEAR-PROBE A");local L=_PetLogic;local id=nil;for k,_ in pairs(L.States)do id=k break end;log("[VRF] GEAR-PROBE B");local data=L:SerializeAccount(L.States[id]);log("[VRF] GEAR-PROBE C");local encoded=_HttpService:JSONEncode(data);log("[VRF] GEAR-PROBE D");local decoded=_HttpService:JSONDecode(encoded);log("[VRF] GEAR-PROBE E");local clone=L:ReadAccount(decoded);log("[VRF] GEAR-PROBE F "..tostring(clone~=nil))'''
 print('dispatch',s.call('maker_execute_script',{'context':'server_main','script':script}),flush=True)
 for _ in range(12):
  time.sleep(.5);logs=s.call('maker_logs',{'kind':'normal'});hits=[x['message']for x in logs.get('logs',[])if 'GEAR-PROBE' in x.get('message','') or x.get('logType')=='Error']
  if any('GEAR-PROBE F' in v for v in hits):break
 print(json.dumps(hits,ensure_ascii=False,indent=2),flush=True)
 build=s.call('maker_logs',{'kind':'build'});print('Build',json.dumps([x for x in build.get('logs',[])if x.get('logType')=='Error'],ensure_ascii=False),flush=True)
finally:s.close()

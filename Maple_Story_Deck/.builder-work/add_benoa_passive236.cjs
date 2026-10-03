// 베노아 패시브 엘리멘탈 어뎁팅(카드236, 크리티컬 대미지 +5/8/11/14/17%)을 하이 위즈덤(235) 줄 옆에 추가한다. 재실행 안전.
const fs = require('fs');
const path = 'RootDesk/MyDesk/Card/CardManager.mlua';
let src = fs.readFileSync(path, 'utf8');
const NL = '\n';
if (src.includes('@Sync property integer ElementalAdeptLevel')) { console.log('already applied'); process.exit(0); }
function count(h, n) { let c = 0, i = 0; while ((i = h.indexOf(n, i)) >= 0) { c++; i += n.length; } return c; }
function after(anchorLine, add, expected = 1) {
  const needle = anchorLine + NL; const c = count(src, needle);
  if (c !== expected) throw new Error(`anchor ${c} != ${expected}: ${anchorLine}`);
  src = src.split(needle).join(needle + add + NL);
}
function rep(a, b) { const c = count(src, a); if (c !== 1) throw new Error(`rep ${c}: ${a.slice(0, 70)}`); src = src.replace(a, b); }

after('\t@Sync property integer HighWisdomLevel = 0', '\t@Sync property integer ElementalAdeptLevel = 0  -- 엘리멘탈 어뎁팅(236) 크리티컬 대미지 +5/8/11/14/17% — MonsterAI.TakeDamageCrit* 3곳에서 가산');
rep('\tmethod number GetHighWisdomMult()\n', '\tmethod number GetElementalAdeptBonus()\n\t\t-- 엘리멘탈 어뎁팅(236) 크리티컬 대미지 보너스\n\t\treturn _CardRegistry:GetChance(236, self.ElementalAdeptLevel)\n\tend\n\n\tmethod number GetHighWisdomMult()\n');
after('\tproperty SpriteGUIRendererComponent highWisdomFill = ""', '\tproperty Entity elementalAdeptBuff = ""\n\tproperty SpriteGUIRendererComponent elementalAdeptFill = ""');
rep('\t@ExecSpace("Multicast")\n\tmethod void NotifyHighWisdomOnPermanent()\n', '\t@ExecSpace("Multicast")\n\tmethod void NotifyElementalAdeptOnPermanent()\n\t\tif self:IsServer() then return end\n\t\tself:ShowBuffIconPermanent(self.elementalAdeptBuff, self.elementalAdeptFill)\n\tend\n\n\t@ExecSpace("Multicast")\n\tmethod void NotifyHighWisdomOnPermanent()\n');
after('\t\telseif panel == self.highWisdomBuff then return "highwisdom"', '\t\telseif panel == self.elementalAdeptBuff then return "elementaladept"');
after('\t\telseif buffName == "highwisdom" then return self.highWisdomBuff', '\t\telseif buffName == "elementaladept" then return self.elementalAdeptBuff');
after('\t\tself:HideBuffIcon(self.highWisdomBuff, self.highWisdomFill)', '\t\tself:HideBuffIcon(self.elementalAdeptBuff, self.elementalAdeptFill)');
rep('magicguard = 234, highwisdom = 235,', 'magicguard = 234, highwisdom = 235, elementaladept = 236,');
rep('"magicguard", "highwisdom" }', '"magicguard", "highwisdom", "elementaladept" }');
after('\t\tif cardIdx == 235 then return self.HighWisdomLevel > 0 end', '\t\tif cardIdx == 236 then return self.ElementalAdeptLevel > 0 end');
after('\t\telseif cardIdx == 235 then return self.HighWisdomLevel', '\t\telseif cardIdx == 236 then return self.ElementalAdeptLevel');
after('\t\telseif cardIdx == 235 then self.HighWisdomLevel = level', '\t\telseif cardIdx == 236 then self.ElementalAdeptLevel = level');
after('\t\telseif cardIdx == 235 then return "highwisdom_up"', '\t\telseif cardIdx == 236 then return "elementaladept_up"');
after('\t\t\tif self.HighWisdomLevel > 0 then self:NotifyHighWisdomOnPermanent() end', '\t\telseif name == "ElementalAdeptLevel" then\n\t\t\tif self.ElementalAdeptLevel > 0 then self:NotifyElementalAdeptOnPermanent() end');
rep('or cardIdx == 234 or cardIdx == 235\n', 'or cardIdx == 234 or cardIdx == 235 or cardIdx == 236\n');
rep('\t\telseif cardIdx == 235 then\n\t\t\tdmg = ', '\t\telseif cardIdx == 236 then\n\t\t\tdmg = _LocalizationService:GetTextFormat("FMT_CARDMANAGER_013", math.floor(self:GetElementalAdeptBonus() * 100 + 0.5))\n\t\telseif cardIdx == 235 then\n\t\t\tdmg = ');
rep('\t\telseif cardIdx == 235 then\n\t\t\treturn {', '\t\telseif cardIdx == 236 then\n\t\t\treturn { "MLUA_CARDMANAGER_598", "MLUA_CARDMANAGER_599", "MLUA_CARDMANAGER_599", "MLUA_CARDMANAGER_599", "MLUA_CARDMANAGER_599" }\n\t\telseif cardIdx == 235 then\n\t\t\treturn {');
rep('\t\t\telseif self.HighWisdomLevel < 5 then\n\t\t\t\ttable.insert(pool, { card = 235, type = "highwisdom_up" })\n\t\t\tend\n',
  '\t\t\telseif self.HighWisdomLevel < 5 then\n\t\t\t\ttable.insert(pool, { card = 235, type = "highwisdom_up" })\n\t\t\tend\n\t\t\tif self.ElementalAdeptLevel == 0 then\n\t\t\t\ttable.insert(pool, { card = 236, type = "unlock" })\n\t\t\telseif self.ElementalAdeptLevel < 5 then\n\t\t\t\ttable.insert(pool, { card = 236, type = "elementaladept_up" })\n\t\t\tend\n');
rep('\t\tif cardIdx == 235 then\n\t\t\tlocal nextLevel', '\t\tif cardIdx == 236 then\n\t\t\tlocal nextLevel = (upgradeType == "unlock") and 1 or (self.ElementalAdeptLevel + 1)\n\t\t\ticon.ImageRUID = _CardRegistry:GetIcon(236)\n\t\t\ttitle.Text = "Lv" .. nextLevel\n\t\t\tname.Text  = _LocText:Resolve(_CardRegistry:GetName(236))\n\t\t\treturn\n\t\tend\n\n\t\tif cardIdx == 235 then\n\t\t\tlocal nextLevel');
rep('\t\t-- HighWisdom(베노아 패시브 235)', '\t\t-- ElementalAdept(베노아 패시브 236) — 슬롯 배정 없이 해금 즉시 영구 적용\n\t\tif cardIdx == 236 then\n\t\t\tif upgradeType == "unlock" then\n\t\t\t\tself.ElementalAdeptLevel = 1\n\t\t\telseif upgradeType == "elementaladept_up" and self.ElementalAdeptLevel < 5 then\n\t\t\t\tself.ElementalAdeptLevel = self.ElementalAdeptLevel + 1\n\t\t\tend\n\t\t\tself:NotifyElementalAdeptOnPermanent()\n\t\t\tlog("ElementalAdept L" .. self.ElementalAdeptLevel .. " (크리티컬 대미지 +" .. math.floor(self:GetElementalAdeptBonus() * 100 + 0.5) .. "%)")\n\t\t\treturn\n\t\tend\n\n\t\t-- HighWisdom(베노아 패시브 235)');
after('\t\tif self:IsCardUnlocked(235) and self.HighWisdomLevel < 5 then table.insert(pool, 235) end', '\t\tif self:IsCardUnlocked(236) and self.ElementalAdeptLevel < 5 then table.insert(pool, 236) end');
after('\t\tself.HighWisdomLevel = 0', '\t\tself.ElementalAdeptLevel = 0');
fs.writeFileSync(path, src, 'utf8');

const mp = 'RootDesk/MyDesk/MonsterAI.mlua';
let m = fs.readFileSync(mp, 'utf8');
const a = '_CardManager:GetSpiritJavelinBonus() + _RelicInventory:GetCritDamageBonus()';
const n = count(m, a);
if (n !== 3) throw new Error('monster crit anchors ' + n);
m = m.split(a).join('_CardManager:GetSpiritJavelinBonus() + _CardManager:GetElementalAdeptBonus() + _RelicInventory:GetCritDamageBonus()');
fs.writeFileSync(mp, m, 'utf8');
console.log('applied OK');

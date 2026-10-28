// 비교판 Lua 생성기: 대표 스타일을 옛날(TextComponent, 왼쪽) / 새(TextGUIRenderer, 오른쪽)로 나란히 띄운다.
// 사용: node .builder-work/textgui_board.cjs <styles.json> <out.lua>
const fs = require("fs");
const { mapComponent } = require("./textgui_convert.cjs");
const styles = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const SAMPLE = "골드 12,345 Lv.9";

function luaVal(v) {
  if (v === null || v === undefined) return "nil";
  if (typeof v === "boolean") return v ? "true" : "false";
  if (typeof v === "number") return String(v);
  if (typeof v === "string") return JSON.stringify(v);
  if ("r" in v) return `{r=${v.r},g=${v.g},b=${v.b},a=${v.a}}`;
  if ("x" in v) return `{x=${v.x},y=${v.y}}`;
  if ("Character" in v) return `{Character=${v.Character}}`;
  return "nil";
}
function luaTable(o) {
  return "{" + Object.entries(o).filter(([k, v]) => /^[A-Za-z_]\w*$/.test(k) && luaVal(v) !== "nil").map(([k, v]) => `${k}=${luaVal(v)}`).join(",") + "}";
}

const rows = styles.map((s) => {
  const text = s.Text === "!" ? "!" : SAMPLE;
  const old = { ...s, Text: text };
  const neu = mapComponent({ ...s, Text: text });
  return `{old=${luaTable(old)},new=${luaTable(neu)},w=${s.rect.x},h=${s.rect.y}}`;
});

const lua = `
local ROWS={${rows.join(",\n")}}
local function C(t) return Color(t.r,t.g,t.b,t.a) end
local FT={[0]=FontType.Default,[1]=FontType.Maple,[2]=FontType.Bazzi,[3]=FontType.Football}
local TA={[0]=TextAlignmentType.UpperLeft,TextAlignmentType.UpperCenter,TextAlignmentType.UpperRight,TextAlignmentType.MiddleLeft,TextAlignmentType.MiddleCenter,TextAlignmentType.MiddleRight,TextAlignmentType.LowerLeft,TextAlignmentType.LowerCenter,TextAlignmentType.LowerRight}
local HA={[1]=TextHorizontalAlignmentOption.Left,[2]=TextHorizontalAlignmentOption.Center,[4]=TextHorizontalAlignmentOption.Right}
local VA={[256]=TextVerticalAlignmentOption.Top,[512]=TextVerticalAlignmentOption.Middle,[1024]=TextVerticalAlignmentOption.Bottom}
local function applyOld(c,s)
  c.Text=s.Text c.Font=FT[s.Font or 0] c.FontSize=s.FontSize c.Bold=s.Bold==true c.Alignment=TA[s.Alignment or 4]
  c.FontColor=C(s.FontColor) c.UseOutLine=s.UseOutLine==true c.OutlineWidth=s.OutlineWidth or 1
  if s.OutlineColor then c.OutlineColor=C(s.OutlineColor) end
  if s.OutlineDistance then c.OutlineDistance=Vector2(s.OutlineDistance.x,s.OutlineDistance.y) end
  c.DropShadow=s.DropShadow==true
  if s.DropShadowAngle then c.DropShadowAngle=s.DropShadowAngle end
  if s.DropShadowDistance then c.DropShadowDistance=s.DropShadowDistance end
  if s.DropShadowColor then c.DropShadowColor=C(s.DropShadowColor) end
  c.BestFit=s.BestFit==true if s.MinSize then c.MinSize=s.MinSize end if s.MaxSize then c.MaxSize=s.MaxSize end
end
local function applyNew(c,n)
  c.Text=n.Text c.Font=n.Font c.FontSize=n.FontSize
  if n.FontStyle==1 then c.FontStyle=FontStyleType.Bold else c.FontStyle=FontStyleType.Normal end
  c.HorizontalAlignment=HA[n.HorizontalAlignment] c.VerticalAlignment=VA[n.VerticalAlignment]
  c.FontColor=C(n.FontColor) c.OutlineWidth=n.OutlineWidth or 0
  if n.OutlineColor then c.OutlineColor=C(n.OutlineColor) end
  c.FaceDilate=n.FaceDilate or 0
  c.Underlay=n.Underlay==true
  if n.Underlay then c.UnderlayColor=C(n.UnderlayColor) c.UnderlayOffsetX=n.UnderlayOffsetX c.UnderlayOffsetY=n.UnderlayOffsetY c.UnderlayDilate=n.UnderlayDilate c.UnderlaySoftness=n.UnderlaySoftness end
  c.BestFit=n.BestFit==true c.MinSize=n.MinSize c.MaxSize=n.MaxSize
  if n.SpacingOption then local sp=c.SpacingOption sp.Character=n.SpacingOption.Character c.SpacingOption=sp end
end
local MULTI="첫째 줄 설명 문구입니다 길게 써 봅니다 둘째 줄로 넘어가요"
local root=_EntityService:GetEntityByPath("/ui/TitleGroup")
local old=root:GetChildByName("TextBoard") if isvalid(old) then old:Destroy() end
local panelTpl=_EntityService:GetEntityByPath("/ui/LoadingGroup/Screen/Logo")
local textTpl=_EntityService:GetEntityByPath("/ui/LoadingGroup/Screen/LoadingText/Char_0")
local board=_SpawnService:SpawnByEntity(panelTpl,"TextBoard",Vector3(0,0,0),root,false)
board.Enable=true
local bt=board.UITransformComponent
bt.RectSize=Vector2(1880,1060) bt.anchoredPosition=Vector2(0,0) bt.Scale=Vector3(1,1,1)
local bs=board.SpriteGUIRendererComponent bs.ImageRUID=DataRef("2860136c06ab075439721c027de365af") bs.Color=Color(0.45,0.55,0.68,1)
_UILogic:SetSiblingIndex(bt,1000000)
for i,r in ipairs(ROWS) do
  local y=470-(i-1)*112
  for side=1,2 do
    local e=_SpawnService:SpawnByEntity(textTpl,"T"..i.."_"..side,Vector3(0,0,0),board,false)
    local t=e.UITransformComponent
    t.RectSize=Vector2(math.max(r.w,520),math.max(r.h,60)) t.anchoredPosition=Vector2(side==1 and -430 or 430,y)
    if side==1 then
      e:RemoveComponent("TextGUIRendererComponent") local c=e:AddComponent("TextComponent") applyOld(c,r.old)
      log(string.format("[VRF] board %d old w=%.1f h=%.1f",i,c:GetPreferredWidth(r.old.Text),c:GetPreferredHeight(r.old.Text,2000)))
    else
      local c=e.TextGUIRendererComponent applyNew(c,r.new)
      log(string.format("[VRF] board %d new w=%.1f h=%.1f",i,c:GetPreferredWidth(r.new.Text),c:GetPreferredHeight(r.new.Text,2000)))
    end
    if i==#ROWS then
      local c=e.TextGUIRendererComponent or e.TextComponent
      log(string.format("[VRF] board multi side=%d h=%.1f",side,c:GetPreferredHeight(MULTI,228)))
    end
  end
end
log("[VRF] board built rows="..#ROWS)
`;
fs.writeFileSync(process.argv[3], lua);
console.log("written", process.argv[3], lua.length);

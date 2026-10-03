// 베노아 스킬 22종(인덱스 113~134, 2026-10-04) — 스킬탭 칸(TitleGroup.ui SkillSlot_N)과 뽑기 확률공시 행(GachaGroup.ui Row_N)을
// 135개까지 늘리고, 스킬탭 캐릭터 필터 드롭다운에 베노아 버튼(btnCharBenoa)을 추가한다.
// skill_tab_rows_113.cjs와 같은 방식(마지막 칸/행/린 버튼의 하위 트리를 컴포넌트째 복제). 이미 있으면 건너뛰므로 다시 돌려도 안전하다.
const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");

const T = "MOD.Core.UITransformComponent";
const clone = (o) => JSON.parse(JSON.stringify(o));
const FIRST = 113;
const LAST = 134;

function cloneTree(b, srcRoot, dstRoot, rootPos) {
  // srcRoot 아래 엔티티를 경로 깊이 순으로 dstRoot 아래에 복제(부모 먼저 생성)
  const prefix = b.find(srcRoot).path;
  const ents = b.listEntities().filter((e) => e.path === prefix || e.path.startsWith(prefix + "/"));
  ents.sort((a, c) => a.path.split("/").length - c.path.split("/").length);
  for (const e of ents) {
    const src = b.find(e.path);
    const rel = e.path.slice(prefix.length);
    const dst = dstRoot + rel;
    b.empty(dst);
    for (const comp of src.jsonString["@components"]) b.upsertComponent(dst, comp["@type"], clone(comp));
    const js = src.jsonString;
    b.patch(dst, { enable: js.enable, visible: js.visible, localize: js.localize, display_order: js.displayOrder });
  }
  b.patch(dstRoot, { pos: rootPos });
}

// ── 스킬탭 칸 + 캐릭터 필터
{
  const FILE = "ui/TitleGroup.ui";
  const LIST = "SkillPanel/ScrollArea/List";
  const b = UIBuilder.read(FILE);
  let made = 0;
  for (let i = FIRST; i <= LAST; i++) {
    const dst = `${LIST}/SkillSlot_${i}`;
    if (b.find(dst)) continue;
    // 2행 격자(세로 먼저), 열 간격 254 — 실제 자리는 ScrollLayoutGroup이 다시 잡는다.
    // 원본은 SkillSlot_112(자물쇠 Dim 포함 — 베노아는 IsSkillLocked가 false라 Dim이 항상 꺼진다)
    const col = Math.floor(i / 2);
    cloneTree(b, `${LIST}/SkillSlot_112`, dst, [155 + col * 254, i % 2 === 0 ? -160 : -495]);
    b.patch(dst, { display_order: i });
    made++;
  }
  console.log("skill slots made:", made);

  // 캐릭터 필터: 버튼 7개(전체/아르카나/실피드/레이온/쉐이드/린/베노아). 드롭다운 위쪽 끝(y=438)은 그대로 두고 아래로 50 늘린다.
  const FL = "SkillPanel/CharacterFilterList";
  const BENOA = `${FL}/btnCharBenoa`;
  if (!b.find(BENOA)) {
    cloneTree(b, `${FL}/btnCharRin`, BENOA, [0, -150]);
    b.patch(BENOA, { display_order: 6 });
    // 버튼 글자 = 캐릭터 선택창과 같은 "베노아" 키(IsLocalizationKey=true라 엔진이 언어별로 푼다)
    b.patchComponent(BENOA, "MOD.Core.TextGUIRendererComponent", { Text: "MLUA_WORLDCHARACTERSELECTUI_013" });
    const order = ["btnCharAll", "btnCharArcana", "btnCharSylph", "btnCharReion", "btnCharShade", "btnCharRin"];
    order.forEach((n, k) => b.patch(`${FL}/${n}`, { pos: [0, 150 - 50 * k] }));
    b.patch(FL, { pos: [-225, 258], rect_size: [170, 360] });
  }
  b.write(FILE, { strict: false }); // 스크롤 목록이라 화면 밖 칸(L013)은 정상
}

// ── 확률공시: 세로 목록, 행 간격 50
{
  const FILE = "ui/GachaGroup.ui";
  const LIST = "GachaProbInfo/Window/ListMask/List";
  const b = UIBuilder.read(FILE);
  let made = 0;
  for (let i = FIRST; i <= LAST; i++) {
    const dst = `${LIST}/Row_${i}`;
    if (b.find(dst)) continue;
    cloneTree(b, `${LIST}/Row_112`, dst, [388, -27 - 50 * i]);
    b.patch(dst, { display_order: i });
    made++;
  }
  console.log("prob rows made:", made);
  b.write(FILE, { strict: false });
}

// ── 확인
{
  const t = UIBuilder.read("ui/TitleGroup.ui");
  const slots = t.listEntities().filter((e) => /\/SkillSlot_\d+$/.test(e.path)).length;
  console.log("skill slots total:", slots);
  for (const i of [112, 113, 134]) {
    const p = `SkillPanel/ScrollArea/List/SkillSlot_${i}`;
    const kids = t.listEntities().filter((e) => e.path.includes(`/SkillSlot_${i}/`)).length;
    console.log(i, "children:", kids, "order:", t.find(p).jsonString.displayOrder);
  }
  for (const e of t.listEntities().filter((x) => x.path.includes("CharacterFilterList"))) {
    const tr = t.getComponent(e.path, T);
    const tc = t.find(e.path).componentNames.includes("MOD.Core.TextGUIRendererComponent") ? t.getComponent(e.path, "MOD.Core.TextGUIRendererComponent").Text : "";
    console.log(e.path.split("/").pop(), t.find(e.path).id, JSON.stringify(tr.anchoredPosition), JSON.stringify(tr.RectSize), tc);
  }
  const g = UIBuilder.read("ui/GachaGroup.ui");
  console.log("prob rows total:", g.listEntities().filter((e) => /\/Row_\d+$/.test(e.path)).length);
}

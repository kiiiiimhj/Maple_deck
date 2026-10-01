// 신규 스킬 11종(인덱스 102~112, 2026-10-01) — 스킬탭 칸(TitleGroup.ui SkillSlot_N)과 뽑기 확률공시 행(GachaGroup.ui Row_N)을 113개까지 늘린다.
// 마지막 칸(SkillSlot_101 / Row_101)의 하위 트리를 컴포넌트째 그대로 복제한다. 이미 있으면 건너뛰므로 다시 돌려도 안전하다.
const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");

const T = "MOD.Core.UITransformComponent";
const clone = (o) => JSON.parse(JSON.stringify(o));

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

// ── 스킬탭: 2행 격자(세로 먼저), 열 간격 254 — 실제 자리는 ScrollLayoutGroup이 다시 잡는다
{
  const FILE = "ui/TitleGroup.ui";
  const LIST = "SkillPanel/ScrollArea/List";
  const b = UIBuilder.read(FILE);
  let made = 0;
  for (let i = 102; i <= 112; i++) {
    const dst = `${LIST}/SkillSlot_${i}`;
    if (b.find(dst)) continue;
    const col = Math.floor(i / 2);
    cloneTree(b, `${LIST}/SkillSlot_101`, dst, [155 + col * 254, i % 2 === 0 ? -160 : -495]);
    b.patch(dst, { display_order: i });
    made++;
  }
  console.log("skill slots made:", made);
  b.write(FILE, { strict: false }); // 스크롤 목록이라 화면 밖 칸(L013)은 정상
}

// ── 확률공시: 세로 목록, 행 간격 50
{
  const FILE = "ui/GachaGroup.ui";
  const LIST = "GachaProbInfo/Window/ListMask/List";
  const b = UIBuilder.read(FILE);
  console.log("prob list comps:", b.find(LIST).componentNames);
  let made = 0;
  for (let i = 102; i <= 112; i++) {
    const dst = `${LIST}/Row_${i}`;
    if (b.find(dst)) continue;
    cloneTree(b, `${LIST}/Row_101`, dst, [388, -27 - 50 * i]);
    b.patch(dst, { display_order: i });
    made++;
  }
  console.log("prob rows made:", made);
  b.write(FILE, { strict: false });
}

// ── 확인
{
  const t = UIBuilder.read("ui/TitleGroup.ui");
  for (const i of [101, 102, 112]) {
    const p = `SkillPanel/ScrollArea/List/SkillSlot_${i}`;
    const kids = t.listEntities().filter((e) => e.path.includes(`/SkillSlot_${i}/`)).length;
    console.log(i, t.find(p).componentNames, "children:", kids, "order:", t.find(p).jsonString.displayOrder, JSON.stringify(t.getComponent(p, T).anchoredPosition));
  }
  const g = UIBuilder.read("ui/GachaGroup.ui");
  for (const i of [101, 102, 112]) {
    const p = `GachaProbInfo/Window/ListMask/List/Row_${i}`;
    console.log("row", i, g.find(p).componentNames, JSON.stringify(g.getComponent(p, T).anchoredPosition), g.find(p + "/Name").componentNames);
  }
}

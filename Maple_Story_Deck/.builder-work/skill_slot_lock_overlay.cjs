// 뽑기 해금 스킬(인덱스 102~112, 2026-10-01) 스킬탭 칸에 자물쇠 오버레이를 붙인다.
// 유물 칸(RelicSlot_0/Dim + Dim/Lock — 검은 딤 판 + 자물쇠)을 컴포넌트째 복제해 각 SkillSlot_N의 마지막 자식으로 둔다
// (형제 순서가 곧 그리는 순서라 마지막에 있어야 이름/레벨/진행바 위까지 덮인다). 켜고 끄는 건 SkillUI.RefreshAllSkillSlots.
// 이미 있으면 건너뛰므로 다시 돌려도 안전하다.
const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");

const FILE = "ui/TitleGroup.ui";
const SRC = "RelicPanel/ScrollArea/List/RelicSlot_0/Dim";
const LIST = "SkillPanel/ScrollArea/List";
const clone = (o) => JSON.parse(JSON.stringify(o));

const b = UIBuilder.read(FILE);
const srcPrefix = b.find(SRC).path;
const srcEnts = b.listEntities()
  .filter((e) => e.path === srcPrefix || e.path.startsWith(srcPrefix + "/"))
  .sort((a, c) => a.path.split("/").length - c.path.split("/").length);

let made = 0;
for (let i = 102; i <= 112; i++) {
  const slot = `${LIST}/SkillSlot_${i}`;
  const dst = `${slot}/Dim`;
  if (b.find(dst)) continue;
  for (const e of srcEnts) {
    const src = b.find(e.path);
    const path = dst + e.path.slice(srcPrefix.length);
    b.empty(path);
    for (const comp of src.jsonString["@components"]) b.upsertComponent(path, comp["@type"], clone(comp));
    const js = src.jsonString;
    b.patch(path, { enable: js.enable, visible: js.visible, display_order: js.displayOrder });
  }
  b.patch(dst, { enable: false, display_order: 10 });  // 기본은 꺼 둠(SkillUI가 잠김 여부로 켠다), RedDot(9) 뒤
  made++;
}
console.log("lock overlays made:", made);
b.write(FILE, { strict: false }); // 스크롤 목록이라 화면 밖 칸(L013)은 정상

const t = UIBuilder.read(FILE);
for (const i of [102, 112]) {
  const kids = t.listEntities().filter((e) => e.path.includes(`/SkillSlot_${i}/`)).map((e) => e.path.split(`SkillSlot_${i}/`)[1]);
  const lock = t.getComponent(`${LIST}/SkillSlot_${i}/Dim/Lock`, "MOD.Core.SpriteGUIRendererComponent");
  console.log(i, kids.join(","), "lock ruid:", lock.ImageRUID.DataId, "dim enable:", t.find(`${LIST}/SkillSlot_${i}/Dim`).jsonString.enable);
}

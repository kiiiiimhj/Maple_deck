// 발로르 뽑기 해금 스킬 2종(2026-10-26 유저 지정) — 볼케닉 스윙(인덱스 149, 카드259) / 글레이셜 드라이브(155, 카드265)
// 스킬탭 칸에 102~112와 같은 자물쇠 오버레이(유물 칸 RelicSlot_0/Dim 복제)를 붙인다. 이미 있으면 건너뛴다.
const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");

const FILE = "ui/TitleGroup.ui";
const SRC = "RelicPanel/ScrollArea/List/RelicSlot_0/Dim";
const LIST = "SkillPanel/ScrollArea/List";
const TARGETS = [149, 155];
const clone = (o) => JSON.parse(JSON.stringify(o));

const b = UIBuilder.read(FILE);
const srcPrefix = b.find(SRC).path;
const srcEnts = b.listEntities()
  .filter((e) => e.path === srcPrefix || e.path.startsWith(srcPrefix + "/"))
  .sort((a, c) => a.path.split("/").length - c.path.split("/").length);

let made = 0;
for (const i of TARGETS) {
  const slot = `${LIST}/SkillSlot_${i}`;
  if (!b.find(slot)) throw new Error("missing " + slot);
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
  b.patch(dst, { enable: false, display_order: 10 });
  made++;
}
console.log("lock overlays made:", made);
b.write(FILE, { strict: false }); // 스크롤 목록이라 화면 밖 칸(L013)은 정상

const t = UIBuilder.read(FILE);
for (const i of [102, ...TARGETS]) {
  const kids = t.listEntities().filter((e) => e.path.includes(`/SkillSlot_${i}/`)).map((e) => e.path.split(`SkillSlot_${i}/`)[1]);
  const lock = t.getComponent(`${LIST}/SkillSlot_${i}/Dim/Lock`, "MOD.Core.SpriteGUIRendererComponent");
  console.log(i, kids.join(","), "lock ruid:", lock.ImageRUID.DataId, "dim enable:", t.find(`${LIST}/SkillSlot_${i}/Dim`).jsonString.enable);
}

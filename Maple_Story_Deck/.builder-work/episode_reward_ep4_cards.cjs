// 에피소드 보상 EP4(루디브리엄) 칸 추가 — 2026-09-29. Card9(자식 Label/Icon/Check/AmountText 포함)를 그대로 복제해
// Card10~12를 만든다. 카드 간격은 EpisodeRewardUI.CardSpacing(200)과 같게 x += 200씩. 새 UUID는 빌더가 발급.
// 이미 있으면(재실행) 건너뛴다 — 같은 경로를 지우고 다시 만들면 import가 깨진다.
const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");

const FILE = "ui/EpisodeRewardGroup.ui";
const b = UIBuilder.load(FILE);
const STRIP = "Panel/Viewport/Strip";
const SRC = `${STRIP}/Card9`;
const SPACING = 200;
const clone = (o) => JSON.parse(JSON.stringify(o));

function copyEntity(srcPath, dstPath, dx) {
  const src = b.find(srcPath);
  if (!src) throw new Error("missing " + srcPath);
  const js = src.jsonString;
  const comps = clone(js["@components"]);
  if (dx) {
    const t = comps.find((c) => c["@type"] === "MOD.Core.UITransformComponent");
    t.anchoredPosition.x += dx;
    if (t.Position) t.Position.x = (t.Position.x || 0) + dx / 100;
  }
  b._add(dstPath, src.componentNames, js.origin.entry_id, js.modelId, comps, js.enable);
  const dst = b.find(dstPath).jsonString;
  dst.visible = js.visible;
  dst.localize = js.localize;
}

const srcCard = b.find(SRC).jsonString;
const children = b.entities
  .map((e) => e.jsonString)
  .filter((js) => js.path.startsWith(srcCard.path + "/"))
  .sort((a, c) => a.displayOrder - c.displayOrder)
  .map((js) => js.name);

for (let k = 1; k <= 3; k++) {
  const name = `Card${9 + k}`;
  if (b.find(`${STRIP}/${name}`)) { console.log("skip existing " + name); continue; }
  copyEntity(SRC, `${STRIP}/${name}`, SPACING * k);
  for (const child of children) copyEntity(`${SRC}/${child}`, `${STRIP}/${name}/${child}`, 0);
}
b.write(FILE, { strict: false });

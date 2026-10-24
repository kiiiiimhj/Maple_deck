// 펫 장비 목록: 페이지(Cell0~23 고정 칸) → 인벤토리와 같은 스크롤 그리드(GridView + UIGridScrollBar) — 2026-10-22 유저 지정
// 메인 인벤토리(InventoryPanel/Grid, GridScrollBar)의 컴포넌트 값을 그대로 복사한다. 셀 템플릿은 런타임에 Cells/Cell0을 복제해 쓴다.
const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");
const FILE = "ui/EquipmentGroup.ui";
const b = UIBuilder.load(FILE);
const SRC = "Inventory/Panel/InventoryPanel/";
const DST = "Inventory/Panel/PetInventoryPanel/";
const comps = (path) => b.find(path).jsonString["@components"];
const copy = (name, skip) => {
  const target = DST + name;
  if (!b.find(target)) b.empty(target, { pos: [0, 0], rect_size: [100, 100] });
  for (const c of comps(SRC + name)) {
    if (skip.includes(c["@type"])) continue;
    b.upsertComponent(target, c["@type"], JSON.parse(JSON.stringify(c)));
  }
};
copy("Grid", ["script.UIInventoryGrid"]);
copy("GridScrollBar", []);
b.write(FILE, { strict: false });
for (const n of ["Grid", "GridScrollBar"]) console.log(n, b.find(DST + n).componentNames);

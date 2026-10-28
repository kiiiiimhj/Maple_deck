// 로비 뽑기 아이콘(BattlePanel/GachaIcon)을 로비 화면 바로 아래(출석 버튼과 같은 단계)로 옮긴다 (2026-10-29)
// 이유: 다른 로비 버튼은 TitleGroup 바로 아래에서 탭 전환 때 TitleUI.ShowPanelOnly가 끄고 켜는데, 뽑기만 전투 화면 안에
//       들어 있어 폰에서 탭을 바꿀 때 혼자 꺼지는 게 보였다(유저 리포트).
// UIBuilder에는 부모를 바꾸는 API가 없어(rename은 이름만 바꿈) 같은 방식으로 경로만 바꾼다. UUID는 그대로 유지
// (GachaUI.btnOpen=ClickArea, RewardFlyUI.gachaButton/gachaIcon이 UUID로 잡고 있다).
// 사용: node .builder-work/move_gacha_icon.cjs [--dry]
const path = require("path");
const { UIBuilder } = require(path.join(__dirname, "..", ".claude", "skills", "msw-ui-system", "scripts", "msw_ui_builder.cjs"));

const FILE = path.join(__dirname, "..", "ui", "TitleGroup" + ".ui");
const OLD = "/ui/TitleGroup/BattlePanel/GachaIcon";
const NEW = "/ui/TitleGroup/GachaIcon";
const dry = process.argv.includes("--dry");

const b = UIBuilder.read(FILE);
if (!b.find(OLD)) throw new Error("GachaIcon이 BattlePanel 안에 없다(이미 옮겼나?)");
if (b.find(NEW)) throw new Error("로비 바로 아래에 GachaIcon이 이미 있다");

// 1) 전투 화면은 1920x1080 stretch에 y +58.47 올라가 있다 → 화면상 같은 자리가 되도록 그만큼 더한다
const panel = b.getComponent("BattlePanel", "MOD.Core.UITransformComponent");
const icon = b.getComponent(OLD, "MOD.Core.UITransformComponent");
const dx = panel.anchoredPosition.x, dy = panel.anchoredPosition.y;
const r2 = v => Math.round(v * 100) / 100;
const pos = [r2(icon.anchoredPosition.x + dx), r2(icon.anchoredPosition.y + dy)];

// 2) 경로 이동(자식 포함) — rename()과 같은 방식으로 path/pathConstraints만 바꾼다
for (const e of b.entities) {
  const js = b._entityJson(e);
  const p = js.path || "";
  if (p === OLD || p.startsWith(OLD + "/")) {
    const np = NEW + p.slice(OLD.length);
    e.path = np; js.path = np; js.pathConstraints = b._pathConstraints(np);
  }
}

// 3) 그리는 순서: 출석 버튼(10) 바로 뒤 11에 넣고, 11 이상인 형제는 한 칸씩 민다(딤·팝업보다 아래 유지)
const attendOrder = b.find("AttendanceButton").jsonString.displayOrder;
for (const e of b.listEntities().filter(x => x.depth === 1 && x.path !== NEW)) {
  const js = b.find(e.path).jsonString;
  if (js.displayOrder > attendOrder) js.displayOrder += 1;
}
b.find(NEW).jsonString.displayOrder = attendOrder + 1;
b.patch(NEW, { pos });

const t = b.getComponent(NEW, "MOD.Core.UITransformComponent");
console.log("이동:", OLD, "->", NEW, "id", b.getId(NEW), "pos", JSON.stringify(t.anchoredPosition), "anchor", JSON.stringify(t.AnchorsMin), "order", b.find(NEW).jsonString.displayOrder);
console.log("자식:", b.listEntities().filter(x => x.path.startsWith(NEW + "/")).map(x => x.path + "=" + b.getId(x.path)).join(" "));
console.log("1단계 순서:", b.listEntities().filter(x => x.depth === 1).map(x => x.name + ":" + b.find(x.path).jsonString.displayOrder).sort((a, c) => +a.split(":")[1] - +c.split(":")[1]).join(" "));
if (!dry) b.write(FILE);

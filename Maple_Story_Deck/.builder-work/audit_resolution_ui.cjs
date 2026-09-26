// 해상도 의존 UI 전수 점검(읽기 전용, 2026-09-26).
// varies(e): e의 크기가 화면 크기에 따라 변하는가 — 루트(캔버스)이거나, stretch 앵커이면서 부모가 변하는 경우.
// posDep(e): e의 화면상 위치가 화면 크기에 따라 (화면 중앙 기준으로) 변하는가 —
//   부모 위치가 변하거나, 부모 크기가 변하는데 자기 앵커가 가운데(0.5)가 아닌 축이 있으면.
// 닫기 버튼: posDep=true 인데 그 버튼을 담은 "창"(가장 가까운 고정 크기 조상 패널)은 posDep=false → 창과 따로 논다.
// 창 크기: 고정 크기가 아니라 stretch로 화면 따라 늘어나는 팝업 창(딤/배경 제외).
const fs = require("fs");
const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");

const CLOSE_RE = /(close|exit|btnx|^x$|닫기|cancel|back)/i;
const DIM_RE = /(dim|bg$|^bg|background|backdrop|flash|cover|screen|blocker|shade|overlay|mask|img|art|wipe)/i;
const PANEL_RE = /(panel|popup|window|dialog|frame|board|box|confirm|shop|info|table|list)/i;

const out = { close: [], sizeVar: [] };
const log = console.log;
console.log = () => {};
for (const f of fs.readdirSync("ui").filter((x) => x.endsWith(".ui"))) {
  let b;
  try { b = UIBuilder.load("ui/" + f); } catch (e) { continue; }
  const ents = b.listEntities();
  const byPath = new Map(ents.map((e) => [e.path, e]));
  const tr = (p) => b.getComponent(p, "MOD.Core.UITransformComponent");
  const memoV = new Map(), memoP = new Map();
  const parentOf = (p) => { const i = p.lastIndexOf("/"); const pp = p.slice(0, i); return byPath.has(pp) ? pp : null; };
  const varies = (p) => {
    if (memoV.has(p)) return memoV.get(p);
    const par = parentOf(p); let r;
    if (!par) r = true; else {
      const t = tr(p); const st = t && (t.AnchorsMin.x !== t.AnchorsMax.x || t.AnchorsMin.y !== t.AnchorsMax.y);
      r = !!st && varies(par);
    }
    memoV.set(p, r); return r;
  };
  const posDep = (p) => {
    if (memoP.has(p)) return memoP.get(p);
    const par = parentOf(p); let r = false;
    if (par) {
      const t = tr(p);
      const ax = t ? (t.AnchorsMin.x + t.AnchorsMax.x) / 2 : 0.5, ay = t ? (t.AnchorsMin.y + t.AnchorsMax.y) / 2 : 0.5;
      const stretchX = t && t.AnchorsMin.x !== t.AnchorsMax.x, stretchY = t && t.AnchorsMin.y !== t.AnchorsMax.y;
      const edge = (!stretchX && ax !== 0.5) || (!stretchY && ay !== 0.5);
      r = posDep(par) || (varies(par) && edge);
    }
    memoP.set(p, r); return r;
  };
  for (const e of ents) {
    const name = e.path.split("/").pop();
    const rel = e.path.replace(/^\/ui\/[^/]+\//, "");
    const hasBtn = b.hasComponent(e.path, "MOD.Core.ButtonComponent");
    if (hasBtn && CLOSE_RE.test(name)) {
      // 가장 가까운 "창" 조상 = 크기가 화면에 안 묶인(varies=false) 조상 중 가장 가까운 것
      let a = parentOf(e.path), win = null;
      while (a) { if (!varies(a)) { win = a; break; } a = parentOf(a); }
      const me = posDep(e.path), wp = win ? posDep(win) : null;
      if (me && (win === null || wp === false)) {
        const t = tr(e.path);
        out.close.push(`${f}  ${rel}  anchor=${t.AlignmentOption} pos=(${t.anchoredPosition.x.toFixed(0)},${t.anchoredPosition.y.toFixed(0)})  window=${win ? win.replace(/^\/ui\/[^/]+\//, "") : "(없음: 화면 기준)"}`);
      }
    }
    if (e.depth >= 1 && varies(e.path) && parentOf(e.path) && b.hasComponent(e.path, "MOD.Core.SpriteGUIRendererComponent")) {
      const t = tr(e.path);
      const offs = [t.OffsetMin.x, t.OffsetMin.y, t.OffsetMax.x, t.OffsetMax.y].some((v) => Math.abs(v) > 1);
      // 전체 화면 딤(여백 0)은 정상 — 여백이 있는 stretch 그림 또는 이름이 창인 것만 본다
      if ((offs || PANEL_RE.test(name)) && !(DIM_RE.test(name) && !offs)) {
        const kids = ents.filter((c) => c.path.startsWith(e.path + "/"));
        const btns = kids.filter((c) => b.hasComponent(c.path, "MOD.Core.ButtonComponent")).length;
        out.sizeVar.push(`${f}  ${rel}  anchor=${t.AlignmentOption} offMin=(${t.OffsetMin.x.toFixed(0)},${t.OffsetMin.y.toFixed(0)}) offMax=(${t.OffsetMax.x.toFixed(0)},${t.OffsetMax.y.toFixed(0)}) 자식=${kids.length} 버튼=${btns}`);
      }
    }
  }
}
console.log = log;
console.log("=== 닫기 버튼이 창과 따로 움직임 (" + out.close.length + ")");
out.close.forEach((s) => console.log(s));
console.log("=== 화면 따라 크기가 변하는 창 (" + out.sizeVar.length + ")");
out.sizeVar.forEach((s) => console.log(s));

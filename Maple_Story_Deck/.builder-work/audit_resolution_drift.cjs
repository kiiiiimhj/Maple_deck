// 해상도별 UI 어긋남 전수 점검(읽기 전용, 2026-09-26).
// 각 .ui를 캔버스 3종(PC 16:9 1920x1080 / 와이드 2340x1080 / 아이폰 시뮬 2044x1027)에서 RectTransform 규칙으로 배치해 보고,
//  (1) 어떤 요소가 "올라가 있는 그림(자기를 감싸는 가장 작은 보이는 그림)"과 다른 방향으로 움직이면 → 틀에서 미끄러짐
//  (2) 16:9에선 화면 안인데 다른 비율에선 화면 밖으로 나가면 → 잘림
// 을 보고한다. 런타임 스크립트가 옮기는 위치(MobileScreenFitLogic 등)는 반영하지 못한다.
const fs = require("fs");
const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");

const CANVASES = { pc: [1920, 1080], wide: [2340, 1080], phone: [2044, 1027], ipad: [1920, 1440], ultra: [2560, 1080] };
const TOL = 12; // px

const log = console.log;
console.log = () => {};
const report = [];
for (const f of fs.readdirSync("ui").filter((x) => x.endsWith(".ui"))) {
  let b;
  try { b = UIBuilder.load("ui/" + f); } catch (e) { continue; }
  const ents = b.listEntities();
  const byPath = new Map(ents.map((e) => [e.path, e]));
  const parentOf = (p) => { const i = p.lastIndexOf("/"); const pp = p.slice(0, i); return byPath.has(pp) ? pp : null; };
  const tr = (p) => b.getComponent(p, "MOD.Core.UITransformComponent");

  const layout = (W, H) => {
    const rect = new Map();
    const calc = (p) => {
      if (rect.has(p)) return rect.get(p);
      const par = parentOf(p);
      const t = tr(p);
      let r;
      if (!par) r = { x0: -W / 2, y0: -H / 2, x1: W / 2, y1: H / 2 };
      else {
        const pr = calc(par);
        const pw = pr.x1 - pr.x0, ph = pr.y1 - pr.y0;
        if (!t) r = pr;
        else {
          const amin = t.AnchorsMin, amax = t.AnchorsMax;
          const stX = amin.x !== amax.x, stY = amin.y !== amax.y;
          let x0, x1, y0, y1;
          if (stX) { x0 = pr.x0 + amin.x * pw + t.OffsetMin.x; x1 = pr.x0 + amax.x * pw + t.OffsetMax.x; }
          else { const cx = pr.x0 + amin.x * pw + t.anchoredPosition.x + (0.5 - t.Pivot.x) * t.RectSize.x; x0 = cx - t.RectSize.x / 2; x1 = cx + t.RectSize.x / 2; }
          if (stY) { y0 = pr.y0 + amin.y * ph + t.OffsetMin.y; y1 = pr.y0 + amax.y * ph + t.OffsetMax.y; }
          else { const cy = pr.y0 + amin.y * ph + t.anchoredPosition.y + (0.5 - t.Pivot.y) * t.RectSize.y; y0 = cy - t.RectSize.y / 2; y1 = cy + t.RectSize.y / 2; }
          r = { x0, y0, x1, y1 };
        }
      }
      rect.set(p, r);
      return r;
    };
    for (const e of ents) calc(e.path);
    return rect;
  };
  const L = {};
  for (const [k, [W, H]] of Object.entries(CANVASES)) L[k] = layout(W, H);

  const visible = (p) => {
    const sp = b.getComponent(p, "MOD.Core.SpriteGUIRendererComponent");
    const tx = b.getComponent(p, "MOD.Core.TextGUIRendererComponent");
    const ruid = sp && sp.ImageRUID && (sp.ImageRUID.DataId !== undefined ? sp.ImageRUID.DataId : sp.ImageRUID);
    const spriteVis = sp && sp.Enable !== false && ruid && sp.Color && sp.Color.a > 0.05;
    const textVis = tx && tx.Enable !== false && tx.Text && String(tx.Text).trim() !== "";
    return { sprite: !!spriteVis, text: !!textVis, any: !!(spriteVis || textVis) };
  };
  const area = (r) => Math.max(0, r.x1 - r.x0) * Math.max(0, r.y1 - r.y0);
  const center = (r) => [(r.x0 + r.x1) / 2, (r.y0 + r.y1) / 2];
  const inside = (a, c) => { const [x, y] = center(a); return x >= c.x0 && x <= c.x1 && y >= c.y0 && y <= c.y1; };
  const onScreen = (r, W, H) => r.x1 > -W / 2 + 2 && r.x0 < W / 2 - 2 && r.y1 > -H / 2 + 2 && r.y0 < H / 2 - 2;
  const fullyOnScreen = (r, W, H) => r.x0 >= -W / 2 - 1 && r.x1 <= W / 2 + 1 && r.y0 >= -H / 2 - 1 && r.y1 <= H / 2 + 1;

  const vis = new Map(ents.map((e) => [e.path, visible(e.path)]));
  const group = (p) => p.split("/").slice(0, 4).join("/"); // "/ui/그룹/최상위패널"
  const cand = ents.filter((e) => vis.get(e.path).any && parentOf(e.path));
  const sprites = ents.filter((e) => vis.get(e.path).sprite && parentOf(e.path));

  for (const e of cand) {
    const a = L.pc.get(e.path);
    const ea = area(a);
    if (ea < 4) continue;
    // 받침 그림: pc에서 e의 중심을 품는, e보다 큰 그림 중 가장 작은 것(같은 UI 그룹, 자기/자손 제외)
    let host = null, hostArea = Infinity;
    for (const s of sprites) {
      if (s.path === e.path || s.path.startsWith(e.path + "/")) continue;
      // 같은 화면(그룹 바로 아래 같은 최상위 패널) 안의 그림만 받침으로 본다 — 서로 다른 탭 화면이 겹쳐 있어 오탐이 났다
      if (group(s.path) !== group(e.path)) continue;
      const sr = L.pc.get(s.path);
      const sa = area(sr);
      if (sa <= ea * 1.2 || sa >= hostArea) continue;
      if (sa > 1900 * 1060) continue; // 화면 전체 딤/배경은 받침으로 안 본다
      if (!inside(a, sr)) continue;
      host = s.path; hostArea = sa;
    }
    const issues = [];
    for (const k of ["wide", "phone", "ipad", "ultra"]) {
      const [W, H] = CANVASES[k];
      const r = L[k].get(e.path);
      if (fullyOnScreen(a, 1920, 1080) && !fullyOnScreen(r, W, H)) issues.push(`${k}:화면밖`);
      if (host) {
        const [ex0, ey0] = center(a), [ex1, ey1] = center(r);
        const hr0 = L.pc.get(host), hr1 = L[k].get(host);
        const [hx0, hy0] = center(hr0), [hx1, hy1] = center(hr1);
        // 받침이 stretch로 커지면 중심만 비교하면 오탐 — e가 받침 안에 계속 들어 있는지, 받침 가장자리 대비 상대 위치가 유지되는지 본다
        const relX0 = (ex0 - hr0.x0) / (hr0.x1 - hr0.x0), relX1 = (ex1 - hr1.x0) / (hr1.x1 - hr1.x0);
        const dx = (ex1 - ex0) - (hx1 - hx0), dy = (ey1 - ey0) - (hy1 - hy0);
        const leftEdgeGap0 = a.x0 - hr0.x0, leftEdgeGap1 = r.x0 - hr1.x0, rightGap0 = hr0.x1 - a.x1, rightGap1 = hr1.x1 - r.x1;
        const keepsLeft = Math.abs(leftEdgeGap1 - leftEdgeGap0) <= TOL, keepsRight = Math.abs(rightGap1 - rightGap0) <= TOL;
        const keepsCenter = Math.abs(dx) <= TOL;
        if (!(keepsLeft || keepsRight || keepsCenter) || Math.abs(dy) > TOL) {
          issues.push(`${k}:받침 대비 x${dx >= 0 ? "+" : ""}${dx.toFixed(0)} y${dy >= 0 ? "+" : ""}${dy.toFixed(0)}`);
        }
        if (!inside(r, hr1)) issues.push(`${k}:받침 밖`);
      }
    }
    if (issues.length) {
      report.push({ f, path: e.path.replace(/^\/ui\/[^/]+\//, ""), host: host ? host.replace(/^\/ui\/[^/]+\//, "") : "-", issues: [...new Set(issues)].join(" ") , enable: e.enable });
    }
  }
}
console.log = log;
const byFile = {};
for (const r of report) (byFile[r.f] = byFile[r.f] || []).push(r);
for (const [f, rows] of Object.entries(byFile)) {
  console.log(`\n### ${f} (${rows.length})`);
  for (const r of rows) console.log(`  ${r.path}  [받침: ${r.host}]  ${r.issues}`);
}
console.log(`\n총 ${report.length}건`);

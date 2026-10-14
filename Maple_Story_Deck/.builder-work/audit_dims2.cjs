// 전체화면 딤 정밀 감사 (2026-10-14) — 그림 종류·부모 크기 오차·모바일 확장 목록 누락을 한 번에 본다.
//   node .builder-work/audit_dims2.cjs
// 기준(출석 딤): ImageRUID 4fea64a3307cda641809ad8be0d4890b / Type 0(Simple) / stretch offset 0 / GetDimmerPaths 등록
const fs = require("fs");
const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");

const lua = fs.readFileSync("RootDesk/MyDesk/UI/MobileScreenFitLogic.mlua", "utf8");
const reg = new Set((lua.match(/"\/ui\/[^"]+"/g) || []).map((s) => s.slice(1, -1)));
const r = (v) => (Math.abs(v) < 0.01 ? 0 : +v.toFixed(2));

for (const f of fs.readdirSync("ui").filter((x) => x.endsWith(".ui")).sort()) {
  let b;
  try { b = UIBuilder.load("ui/" + f); } catch (e) { continue; }
  for (const e of b.listEntities()) {
    if (/Buff\/|SoldOutCover|LockOverlay|Fill$/.test(e.path)) continue;
    const s = b.getComponent(e.path, "MOD.Core.SpriteGUIRendererComponent");
    if (!s) continue;
    const t = b.getComponent(e.path, "MOD.Core.UITransformComponent");
    const full = (t && t.AlignmentOption === 15) || (e.size[0] >= 1900 && e.size[1] >= 1000);
    if (!full) continue;
    const c = s.Color || {};
    const a = c.a === undefined ? 1 : c.a;
    if (!(c.r <= 0.25 && c.g <= 0.25 && c.b <= 0.25 && a > 0.15 && a < 1.0)) continue;
    const ruid = s.ImageRUID && s.ImageRUID.DataId ? s.ImageRUID.DataId.slice(0, 6) : "EMPTY";
    // 자신과 조상 중 stretch인데 offset이 0이 아닌 것(=화면보다 작아짐)
    const parts = e.path.split("/");
    const offs = [];
    for (let i = 4; i <= parts.length; i++) {
      const p = parts.slice(0, i).join("/");
      const tt = b.getComponent(p, "MOD.Core.UITransformComponent");
      if (!tt || !tt.AnchorsMin) continue;
      if (tt.AnchorsMin.x === 0 && tt.AnchorsMax.x === 1 && tt.AnchorsMin.y === 0 && tt.AnchorsMax.y === 1) {
        const o = [tt.OffsetMin.x, tt.OffsetMin.y, tt.OffsetMax.x, tt.OffsetMax.y].map(r);
        if (o.some((v) => v !== 0)) offs.push(parts[i - 1] + ":" + o.join(","));
      } else {
        offs.push(parts[i - 1] + ":fixed" + JSON.stringify(tt.RectSize));
      }
    }
    const flags = [];
    if (ruid !== "4fea64" || s.Type !== 0) flags.push("SPRITE=" + ruid + "/T" + s.Type);
    if (!reg.has(e.path)) flags.push("MOBILE-MISSING");
    if (offs.length) flags.push("SIZE " + offs.join(" "));
    console.log((flags.length ? "!! " : "ok ") + a.toFixed(2) + " " + e.path + (flags.length ? "  " + flags.join(" | ") : ""));
  }
}

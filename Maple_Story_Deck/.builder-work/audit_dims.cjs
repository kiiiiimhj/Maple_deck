// 전체화면 딤 감사 — 팝업 딤 작업할 때마다 이거 먼저 돌려서 현황을 본다 (2026-09-22).
//
// 판정 기준: 스프라이트 + (anchor stretch 또는 1900x1000 이상) + 어두운색(rgb<=0.25) + 반투명(0.15<a<1.0)
// 그중 ImageRUID가 빈 문자열이면 **화면에 아무것도 안 그려진다**(MSW 8대 규칙 #3: 빈 RUID = 에러 없이 안 보임).
// 인벤토리 배경이 안 어두웠던 원인이 정확히 이것이었다.
//
//   node .builder-work/audit_dims.cjs
const fs = require("fs");
const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");

const GOOD_RUID = "4fea64a3307cda641809ad8be0d4890b"; // 출석 딤이 쓰는, 렌더 확인된 RUID

const broken = [];
const ok = [];
for (const f of fs.readdirSync("ui").filter((x) => x.endsWith(".ui")).sort()) {
  let b;
  try { b = UIBuilder.load("ui/" + f); } catch (e) { continue; }
  for (const e of b.listEntities()) {
    const s = b.getComponent(e.path, "MOD.Core.SpriteGUIRendererComponent");
    if (!s) continue;
    const t = b.getComponent(e.path, "MOD.Core.UITransformComponent");
    const full = (t && t.AlignmentOption === 15) || (e.size[0] >= 1900 && e.size[1] >= 1000);
    if (!full) continue;
    const c = s.Color || {};
    const a = c.a === undefined ? 1 : c.a;
    if (!(c.r <= 0.25 && c.g <= 0.25 && c.b <= 0.25 && a > 0.15 && a < 1.0)) continue;
    const ruid = s.ImageRUID && s.ImageRUID.DataId ? s.ImageRUID.DataId : "";
    (ruid === "" ? broken : ok).push({ p: e.path, a: a.toFixed(2), ray: s.RaycastTarget });
  }
}

console.log(`[A] RUID가 비어 안 그려지는 전체화면 딤 (${broken.length}) — 고치려면 ImageRUID를 ${GOOD_RUID} 로`);
for (const x of broken) console.log(`    a=${x.a} ray=${x.ray}  ${x.p}`);
console.log(`\n[B] 정상 렌더되는 전체화면 딤 (${ok.length})`);
for (const x of ok) console.log(`    a=${x.a} ray=${x.ray}  ${x.p}`);

// 노치(모바일 안전영역) 확장 목록에 빠진 딤 찾기
const lua = fs.readFileSync("RootDesk/MyDesk/UI/MobileScreenFitLogic.mlua", "utf8");
const registered = new Set((lua.match(/"\/ui\/[^"]+"/g) || []).map((s) => s.slice(1, -1)));
const missing = ok.filter((x) => x.ray && !registered.has(x.p) && !/SoldOutCover|IconFrame|Fill$/.test(x.p));
console.log(`\n[C] 렌더는 되지만 MobileScreenFitLogic.GetDimmerPaths()에 없는 딤 (${missing.length}) — 아이폰 노치에서 가장자리 비침`);
for (const x of missing) console.log(`    a=${x.a}  ${x.p}`);

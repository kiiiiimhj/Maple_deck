// 런타임 스캔 로그([UITXT]) × .ui 파일 값 대조 → "정적 / 스크립트 구동" 전수 분류 (2026-09-22).
//   node .builder-work/ui_localize_classify.cjs <로그파일경로>
//
// 왜 필요한가: .ui에 한국어가 박혀 있어도 스크립트가 런타임에 Text를 덮어쓰면
//   .ui를 키로 바꿔봐야 화면에 안 나온다(실측: 인벤 탭 UIInventoryTab.mlua:39).
//   → 덮어쓰지 않는 "정적" 엔티티만 .ui 변환 대상이고, 나머지는 .mlua GetText 경로다.
const fs = require("fs");
const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");

const KO = /[가-힣]/;
const LOG = process.argv[2];
const GUI = "MOD.Core.TextGUIRendererComponent";
const LEGACY = "MOD.Core.TextComponent";

// ── 런타임 값 수집 ────────────────────────────────────────────────────────
const raw = fs.readFileSync(LOG, "utf8");
const runtime = new Map(); // path -> { kind, text }
// ⚠ 로그는 JSON 레코드 배열이 한 줄에 들어 있다. 통째로 \t/\n 치환하면 레코드 경계가
//   사라져서 정규식이 한 줄 전체를 하나로 삼킨다(실측 실패). "message" 필드만 뽑아
//   JSON.parse로 정확히 언이스케이프한다.
for (const m of raw.matchAll(/"message"\s*:\s*("(?:[^"\\]|\\.)*")/g)) {
  let msg;
  try { msg = JSON.parse(m[1]); } catch (e) { continue; }
  const r = msg.match(/^\[UITXT\]([GL])\t([^\t]+)\t([\s\S]*)$/);
  if (!r) continue;
  // 같은 경로가 여러 번 찍혔으면 마지막 값(= 스크립트 적용 후)을 쓴다
  runtime.set(r[2], { kind: r[1], text: r[3] });
}
console.log(`런타임 스캔에서 수집한 텍스트 엔티티: ${runtime.size}개`);

// ── .ui 파일 값 수집 ──────────────────────────────────────────────────────
const buckets = { staticGui: [], staticLegacy: [], dynamic: [], missing: [] };

for (const f of fs.readdirSync("ui").filter((x) => x.endsWith(".ui")).sort()) {
  let b;
  try { b = UIBuilder.load("ui/" + f); } catch (e) { continue; }
  for (const e of b.listEntities()) {
    for (const type of [GUI, LEGACY]) {
      const c = b.getComponent(e.path, type);
      if (!c || typeof c.Text !== "string") continue;

      const isKey = c.IsLocalizationKey === true;
      // 한국어가 남아 있거나(미변환) 이미 키로 바뀐 것만 관심 대상
      if (!isKey && !KO.test(c.Text)) continue;

      const rt = runtime.get(e.path);
      const rec = { file: f, path: e.path, type, uiText: c.Text, isKey, rtText: rt ? rt.text : null };

      if (!rt) { buckets.missing.push(rec); continue; }

      // 정적 = 런타임 값이 .ui 값과 같다(키로 바꾼 경우 키 문자열이 그대로 보임)
      if (rt.text === c.Text) {
        (type === GUI ? buckets.staticGui : buckets.staticLegacy).push(rec);
      } else {
        buckets.dynamic.push(rec);
      }
    }
  }
}

const n = (a) => String(a.length).padStart(4);
console.log(`
=== 분류 결과 ===
정적 · TextGUIRenderer  : ${n(buckets.staticGui)}   (이미 변환됨 / .ui 경로 유효)
정적 · 구형 TextComponent: ${n(buckets.staticLegacy)}   (.ui 변환하면 되는 대상)
스크립트가 덮어씀        : ${n(buckets.dynamic)}   ⚠ .ui 변환 무의미 → .mlua GetText 필요
런타임에 안 잡힘         : ${n(buckets.missing)}   (비활성 그룹 등 — 판정 보류)`);

const byFile = (arr) => {
  const m = new Map();
  for (const r of arr) m.set(r.file, (m.get(r.file) || 0) + 1);
  return [...m].sort((a, b) => b[1] - a[1]).map(([f, c]) => `    ${String(c).padStart(3)}  ${f}`).join("\n");
};

console.log("\n-- 스크립트가 덮어쓰는 것 (파일별) --\n" + byFile(buckets.dynamic));
console.log("\n-- 정적 구형 TextComponent (파일별) --\n" + byFile(buckets.staticLegacy));
console.log("\n-- 런타임에 안 잡힌 것 (파일별) --\n" + byFile(buckets.missing));

fs.writeFileSync(".builder-work/ui_localize_classified.json", JSON.stringify(buckets, null, 1), "utf8");
console.log("\n→ .builder-work/ui_localize_classified.json 저장");

console.log("\n-- 스크립트 덮어쓰기 샘플 20 --");
for (const r of buckets.dynamic.slice(0, 20)) {
  console.log(`  ${r.path}\n      .ui=${JSON.stringify(r.uiText)}  런타임=${JSON.stringify(r.rtText)}`);
}

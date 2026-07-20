// 존 스크롤 그룹(존19~22/map17, 존23~26/map18 같은 "한 물리 파일 안에서 카메라만 스크롤" 그룹)에
// 새 존을 추가하거나 지형을 수정할 때, spawnX 자리에 실제로 발판이 있는지 / 그룹 공통 지면 높이와
// 맞는지를 미리 점검하는 스크립트.
//
// 배경: DoScrollMapChange(MapManager.mlua)는 존 이동 시 목적지 발판을 실제로 조회하지 않고
// "이전 존의 Y를 그대로 재사용"한다 — 그룹 전체가 같은 높이의 평평한 지면이라는 전제 하나로 짜여있다.
// 이 전제가 깨지면(어떤 존 자리에만 다른 높이의 발판/구덩이가 생기면) 스크롤 이동 시 발판 사이로
// 낙하해 맵 밖 세이프티넷에 의해 엉뚱한 존으로 튕겨나가는 버그가 생긴다(2026-07-21 존25/map18에서 실제 발생).
//
// 사용법:
//   node tools/check_zone_landing.cjs
// (아래 GROUPS 배열에 그룹을 추가/수정하면 그 정의를 기준으로 검사한다 — MapManager.mlua의 ZoneInfo와
//  항상 같은 내용으로 동기화해서 유지할 것)

const path = require("path");
const { MapBuilder } = require(path.join(
  __dirname,
  "..",
  ".claude",
  "skills",
  "msw-general",
  "scripts",
  "map",
  "msw_map_builder.cjs"
));

// 그룹 정의 — MapManager.mlua의 ZoneInfo와 동일하게 유지한다.
// referenceY: 그 그룹의 "공통 지면" Y(맵1/2/3처럼 다들 똑같이 맞춰뒀던 값). 어떤 존이 이 Y와
// 다른 발판을 가지면 랜딩 예외(landY)가 필요하다는 뜻이다.
const GROUPS = [
  {
    name: "그룹G (존19~22, map17)",
    file: "map/map17.map",
    referenceY: -1.25,
    zones: [
      { zoneIndex: 19, spawnX: 0 },
      { zoneIndex: 20, spawnX: 15.5 },
      { zoneIndex: 21, spawnX: 31.0 },
      { zoneIndex: 22, spawnX: 46.5 },
    ],
  },
  {
    name: "그룹H (존23~26, map18)",
    file: "map/map18.map",
    referenceY: -1.25,
    zones: [
      { zoneIndex: 23, spawnX: 0 },
      { zoneIndex: 24, spawnX: 15.5 },
      { zoneIndex: 25, spawnX: 31.0, landY: -0.65 }, // 2026-07-21 수정: 계단식 발판으로 지형 변경됨
      { zoneIndex: 26, spawnX: 46.5 },
    ],
  },
];

const Y_EPSILON = 0.05;

function findFootholdAt(footholds, x) {
  // spawnX가 속한 발판 구간을 찾는다. 여러 개 겹치면(계단식 지형처럼 같은 x에 다른 높이의 발판이
  // 여러 개 있으면) 전부 반환한다 — 여러 개면 "어느 높이에 착지할지 모호하다"는 뜻이므로 그 자체가
  // 주의 신호다.
  return footholds.filter(
    (f) => x >= Math.min(f.StartPoint.x, f.EndPoint.x) - 0.01 && x <= Math.max(f.StartPoint.x, f.EndPoint.x) + 0.01
  );
}

function checkGroup(group) {
  console.log(`\n=== ${group.name} (${group.file}) ===`);
  const absPath = path.join(__dirname, "..", group.file);
  const map = MapBuilder.read(absPath);
  const footholds = map.getFootholds();

  let anyIssue = false;

  for (const zone of group.zones) {
    const hits = findFootholdAt(footholds, zone.spawnX);
    const label = `존${zone.zoneIndex} (spawnX=${zone.spawnX})`;

    if (hits.length === 0) {
      console.log(`  ✗ ${label}: 발판 없음 — 낙사 위험. landY를 지정하거나 spawnX를 옮기세요.`);
      anyIssue = true;
      continue;
    }

    // 이 x에 걸리는 발판이 여러 층이면(계단식 지형) 그 중 하나라도 landY와 일치하는지 확인한다.
    const ys = hits.map((f) => f.StartPoint.y);
    const expectedY = zone.landY !== undefined ? zone.landY : group.referenceY;
    const matches = ys.some((y) => Math.abs(y - expectedY) <= Y_EPSILON);

    if (!matches) {
      console.log(
        `  ✗ ${label}: 이 자리 발판 높이(${ys.map((y) => y.toFixed(2)).join(", ")})가 기대값(${expectedY.toFixed(2)})과 다름.` +
          (zone.landY === undefined
            ? " landY를 지정하세요 (예: 이 자리 실제 발판 y값)."
            : " landY 값을 다시 확인하세요.")
      );
      anyIssue = true;
      continue;
    }

    if (hits.length > 1) {
      console.log(
        `  ⚠ ${label}: 이 x에 발판이 ${hits.length}층(${ys.map((y) => y.toFixed(2)).join(", ")}) 있음 — ` +
          `landY=${expectedY.toFixed(2)}로 착지하도록 이미 지정돼 있는지 확인하세요.`
      );
    } else {
      console.log(`  ✓ ${label}: 발판 y=${ys[0].toFixed(2)} (기대값과 일치)`);
    }
  }

  return anyIssue;
}

let anyGroupIssue = false;
for (const group of GROUPS) {
  if (checkGroup(group)) anyGroupIssue = true;
}

console.log();
if (anyGroupIssue) {
  console.log("결과: 문제 있음 — 위 ✗ 항목을 확인하세요.");
  process.exitCode = 1;
} else {
  console.log("결과: 모든 존의 스폰 지점이 정상 발판 위에 있습니다.");
}

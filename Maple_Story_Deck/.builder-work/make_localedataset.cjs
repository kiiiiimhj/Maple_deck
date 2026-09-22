// Docs/Localization/locale_strings.csv → 실제 LocaleDataSet 자산 생성 (2026-09-22).
//   node .builder-work/make_localedataset.cjs
//
// LocaleDataSet은 "메타데이터 래퍼(.localedataset) + 실데이터(.csv)" 한 쌍이다(dataset.md).
// Maker UI의 Create LocaleDataSet + Import CSV를 거치지 않고 파일로 직접 만든다 —
// dataset.md "Manual creation" 절차 그대로: UUID 생성 → 래퍼 작성 → CSV 작성 → Refresh.
//
// ⚠ 컬럼 순서 Key,Source,Note가 고정이고 그 뒤가 언어 코드다. ko/en은 공식 문서로 확인된
//   지원 코드, zh-TW/ja는 유저 요청분 — Refresh 후 빌드로그로 받아들여지는지 확인한다.
const fs = require("fs");
const path = require("path");

const SRC_CSV = "Docs/Localization/locale_strings.csv";
const OUT_DIR = "RootDesk/MyDesk/Localization";
const NAME = "GameText";
const UUID = "1e8d96a2-6c47-400c-ad91-a83dbf42aaef";

const wrapper = {
  Id: "",
  GameId: "",
  EntryKey: `localedataset://${UUID}`,
  ContentType: "x-mod/localedataset",
  Content: "",
  Usage: 0,
  UsePublish: 1,
  UseService: 0,
  CoreVersion: "26.7.0.0",
  StudioVersion: "0.1.0.0",
  DynamicLoading: 0,
  ContentProto: {
    Use: "Json",
    Json: {
      name: NAME,
      id: UUID,
      serveronly: false,
      syncDataSetWebUrl: "",
      dynamicloading: 0,
    },
  },
};

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(path.join(OUT_DIR, `${NAME}.localedataset`), JSON.stringify(wrapper, null, 2), "utf8");

// CSV는 추출본을 그대로 쓴다. 단 BOM은 떼고 줄끝은 그대로 둔다(엔진이 읽는 쪽은 UTF-8 무BOM 기준).
const csv = fs.readFileSync(SRC_CSV, "utf8").replace(/^﻿/, "");
fs.writeFileSync(path.join(OUT_DIR, `${NAME}.csv`), csv, "utf8");

const rows = csv.trim().split(/\r?\n/).length;
console.log(`${OUT_DIR}/${NAME}.localedataset  (EntryKey=${wrapper.EntryKey})`);
console.log(`${OUT_DIR}/${NAME}.csv  (헤더 포함 ${rows}줄, 헤더=${csv.slice(0, csv.indexOf("\n")).trim()})`);

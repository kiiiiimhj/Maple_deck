const path = require("path");
const { UIBuilder } = require(path.join(__dirname, "..", ".claude", "skills", "msw-ui-system", "scripts", "msw_ui_builder.cjs"));

// 로비 레이드 아이콘 위의 "보스 레이드" 글자 제거(유저 지정 2026-09-23 — 제목은 레이드 로딩 화면으로 옮겼다).
// 어느 .mlua도 이 엔티티를 바인딩하지 않는다(grep 확인) — 프로퍼티 정리 불필요.
const UI_PATH = "ui/TitleGroup.ui";
const b = UIBuilder.load(UI_PATH);
b.remove("RaidButton/RaidLabel");
b.write(UI_PATH);
console.log("removed RaidButton/RaidLabel ->", b.getId("RaidButton/RaidLabel"));

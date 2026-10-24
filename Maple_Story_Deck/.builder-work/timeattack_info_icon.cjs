// 시작 팝업: "타임어택" 체크 옆 i 아이콘 + 누르면 2초 뜨는 설명 말풍선 — 2026-10-22 유저 지정
const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");
const FILE = "ui/WorldCharacterSelectGroup.ui";
const b = UIBuilder.load(FILE);
const INFO = "78d254b94ee54616ab1d6038e131ec8a";   // 펫하우스 가이드 버튼과 같은 i 아이콘
const BUBBLE = "823c09bacaa54d1780577e455add2918"; // 인벤토리 아이템 이름 말풍선과 같은 그림
// i 아이콘: 체크 배경(300x56) 안, "타임어택" 글자 오른쪽
if (!b.find("Panel/UnlimitedModeBg/InfoButton"))
  b.button("Panel/UnlimitedModeBg/InfoButton", "", { pos: [-6, 0], rect_size: [42, 42], image_ruid: INFO, color: "#FFFFFF" });
b.patch("Panel/UnlimitedModeBg/InfoButton", { pos: [-6, 0], rect_size: [42, 42] });
// 설명 말풍선: Panel 직속(다른 칸 위에 그려지게), 기본 꺼짐. 위치는 런타임에 아이콘 기준으로 잡는다
if (!b.find("Panel/ModeInfoTooltip"))
  b.sprite("Panel/ModeInfoTooltip", { pos: [0, 0], rect_size: [300, 110], image_ruid: BUBBLE, color: "#FFFFFF", raycast: false, enable: false });
if (!b.find("Panel/ModeInfoTooltip/Label"))
  b.text("Panel/ModeInfoTooltip/Label", "", { pos: [0, -3], rect_size: [260, 60], size: 22, bold: true, color: "#4A2A12", alignment: 4 });
b.write(FILE, { strict: false });
for (const p of ["Panel/UnlimitedModeBg/InfoButton", "Panel/ModeInfoTooltip", "Panel/ModeInfoTooltip/Label"]) console.log(p, b.getId(p), b.find(p).componentNames);

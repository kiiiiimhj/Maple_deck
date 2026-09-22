const path = require("path");
const { UIBuilder } = require(path.join(__dirname, "..", ".claude", "skills", "msw-ui-system", "scripts", "msw_ui_builder.cjs"));

const UI_PATH = "ui/LoadingGroup.ui";
const b = UIBuilder.load(UI_PATH);

// 레이드 전용 로딩 그림 위에 얹는 제목. 평소엔 꺼둔 채 저장되고 LoadingUI가 켠다.
b.text("Screen/RaidTitle", "UI_LOADINGGROUP_002", {
  anchor: "middle-center",
  pos: [0, 290],
  rect_size: [1200, 150],
  size: 92,
  bold: true,
  alignment: 4,
  overflow: 0,
  color: "#FFD65C",
  outline: true,
  outline_color: "#2E0806",
  outline_width: 4,
  enable: false,
});

b.patchComponent("Screen/RaidTitle", "MOD.Core.TextGUIRendererComponent", {
  IsLocalizationKey: true,
  BestFit: true,
  MinSize: 48,
  MaxSize: 92,
  // 용암 배경 위에서 글자가 떠 보이게 — 검은 그림자
  Underlay: true,
  UnderlayColor: { r: 0, g: 0, b: 0, a: 0.85 },
  UnderlayOffsetX: 2,
  UnderlayOffsetY: -2,
  UnderlayDilate: 0.3,
  UnderlaySoftness: 0.2,
});

// Bg(0) / UfoDeco(1) / LoadingText(2) / AiNotice(3) 다음 — 배경 그림 위에 그려져야 한다
b.patch("Screen/RaidTitle", { display_order: 4 });

b.write(UI_PATH, {
  bind: {
    mlua: "RootDesk/MyDesk/LoadingUI.mlua",
    props: { titleText: "Screen/RaidTitle" },
  },
});
console.log("RaidTitle id =", b.getId("Screen/RaidTitle"));

// 몬스터 도감 팝업(ui/MonsterBookGroup.ui) — 유저 지정 2026-09-29. 리소스는 유저 제공 계정 스프라이트(popup_book_*).
// ⚠ 이미 있는 파일은 반드시 load로 열어 갱신한다(새로 만들면 루트 UUID가 바뀌어 Maker 엔트리가 깨진다 —
//   [[feedback_ui_root_uuid_churn_breaks_entry]]). 같은 경로를 remove 후 재생성하지도 않는다(창작 메서드 upsert만).
const fs = require("fs");
const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");

const R = {
  frame: "2abb7e636ce742c8ab3bfab8b91e5f47",   // popup_book_1 1530x1028 (테두리만, 안쪽은 투명)
  inner: "4f4ef7f1611548b1887aaa5db609d35b",   // popup_book_2 1659x948 (프레임 밑에 깔리는 패널)
  banner: "8231c225dc3549a3ba58306e819aff21",  // popup_book_3 2172x724 (맵 사진 테두리)
  card: "042e72ea975d4c448d50caee5105e9fa",    // popup_book_4 1122x1402
  green: "b1edd272562e46009d559aef07c6be63",   // popup_book_5 1983x793
  arrow: "29dd4972e9ff44c7a988e1b4acc92132",   // popup_book_6 1254x1254 (오른쪽 화살표, 왼쪽은 FlipX)
  close: "45f18bb1b747498796aeb1358dc64810",   // popup_book_7 1254x1254
  lock: "9b0f8afa34bc438d864bf4c9cc393844",    // 흰 자물쇠(맵 이동 버튼과 같은 아이콘)
  dim: "4fea64a3307cda641809ad8be0d4890b",     // 업적 팝업 딤과 같은 흰 사각
  round: "2860136c06ab075439721c027de365af",   // 빌더 기본 둥근 사각(9-slice)
  photo: "95ce798ac8fd4b1ab8177405c18c9949",   // 에피1 월드 사진(런타임에 에피소드별로 교체)
  elite: "ed6a53c6c13641dd8073ac871553de37",
};
const SGR = "MOD.Core.SpriteGUIRendererComponent";
const TGR = "MOD.Core.TextGUIRendererComponent";
const white = { r: 1, g: 1, b: 1, a: 1 };
const PATH = "ui/MonsterBookGroup.ui";

const b = fs.existsSync(PATH) ? UIBuilder.load(PATH) : new UIBuilder("MonsterBookGroup", 1, false);
b.patchComponent("MonsterBookGroup", "MOD.Core.UIGroupComponent", { DefaultShow: false, GroupOrder: 23, GroupType: 2 });

b.sprite("Dimmer", { anchor: "stretch", pos: [0, 0], rect_size: [1920, 1080], image_ruid: R.dim, color: { r: 0, g: 0, b: 0, a: 0.65 }, raycast: true, sprite_type: 0 });

b.empty("Panel", { pos: [0, -30], rect_size: [1500, 1008] });
// 프레임(테두리) 밑에 까는 나무 패널 — 프레임 안쪽 실측(스샷) x ±614 / y 299 ~ -383 을 살짝 넘게 덮는다
b.sprite("Panel/Backdrop", { rect_size: [1350, 830], pos: [0, -10], image_ruid: R.inner, color: white, sprite_type: 0, raycast: true });
b.sprite("Panel/Frame", { rect_size: [1500, 1008], image_ruid: R.frame, color: white, sprite_type: 0, raycast: true });

// 제목 — 팝업 프레임 위(유저 지정 "팝업 프레임 위에 몬스터 도감")
b.text("Panel/Title", "UI_MONSTERBOOKGROUP_001", { size: 52, bold: true, color: "#FFFFFF", pos: [0, 520], rect_size: [640, 80], outline: true, outline_color: "#5A2A0A" });
b.patchComponent("Panel/Title", TGR, { Font: "Maple", IsLocalizationKey: true, OutlineWidth: 0.3 });
b.patch("Panel/Title", { localize: true });

// 에피소드 배너(테두리 안쪽 창에 사진) + 좌우 화살표
b.empty("Panel/Banner", { pos: [0, 345], rect_size: [420, 140] });
b.sprite("Panel/Banner/Border", { rect_size: [420, 140], image_ruid: R.banner, color: white, sprite_type: 0 });
b.sprite("Panel/Banner/Photo", { rect_size: [352, 92], pos: [0, 2], image_ruid: R.photo, color: white, sprite_type: 0 });
b.text("Panel/Banner/Name", "", { size: 26, bold: true, color: "#FFFFFF", pos: [0, -28], rect_size: [340, 36], outline: true, outline_color: "#3A2208" });
b.patchComponent("Panel/Banner/Name", TGR, { Font: "Maple", OutlineWidth: 0.3 });
b.button("Panel/BtnPrev", "", { rect_size: [96, 96], pos: [-300, 345], image_ruid: R.arrow, bg_color: white, sprite_type: 0 });
b.patchComponent("Panel/BtnPrev", SGR, { FlipX: true });
b.button("Panel/BtnNext", "", { rect_size: [96, 96], pos: [300, 345], image_ruid: R.arrow, bg_color: white, sprite_type: 0 });

b.button("Panel/BtnClose", "", { rect_size: [110, 110], pos: [695, 455], image_ruid: R.close, bg_color: white, sprite_type: 0 });

// 카드 영역 — 어두운 홈(시안의 안쪽 칸)
b.sprite("Panel/Inner", { rect_size: [1170, 540], pos: [0, -20], image_ruid: R.round, color: { r: 0.22, g: 0.11, b: 0.04, a: 0.55 }, sprite_type: 1 });
b.mask("Panel/Inner/Grid", { rect_size: [1070, 526], pos: [-22, 0] });
b.upsertComponent("Panel/Inner/Grid", "MOD.Core.GridViewComponent", {
  "@type": "MOD.Core.GridViewComponent", CellSize: { x: 200, y: 250 }, FixedCount: 5, FixedType: 0,
  HorizontalScrollBarDirection: 0, Padding: { left: 3, right: 0, top: 6, bottom: 6 },
  ScrollBarBackgroundColor: { r: 1, g: 1, b: 1, a: 0 }, ScrollBarBackgroundImageRUID: { DataId: "" },
  ScrollBarHandleColor: { r: 0.725, g: 0.71, b: 0.698, a: 1 }, ScrollBarHandleImageRUID: { DataId: "" },
  ScrollBarThickness: 10, ScrollBarVisible: 2, Spacing: { x: 16, y: 12 }, TotalCount: 0, UseScroll: true,
  VerticalScrollBarDirection: 0, Enable: true,
});

// 카드 템플릿(GridView ItemEntity — 런타임에 복제된다)
b.panel("Panel/Inner/Grid/CardTemplate", { rect_size: [200, 250], alpha: 0, enable: false });
b.sprite("Panel/Inner/Grid/CardTemplate/Bg", { rect_size: [200, 250], image_ruid: R.card, color: white, sprite_type: 0 });
// 그림은 런타임에 스프라이트 기준점(발밑)만큼 되돌려 칸 가운데에 맞춘다(MonsterBookUI.PlaceImage)
b.sprite("Panel/Inner/Grid/CardTemplate/Image", { rect_size: [92, 88], pos: [0, 52], image_ruid: R.photo, color: white, sprite_type: 0 });
b.patchComponent("Panel/Inner/Grid/CardTemplate/Image", SGR, { PreserveSprite: 1 });
b.sprite("Panel/Inner/Grid/CardTemplate/Badge", { rect_size: [54, 54], pos: [0, 100], image_ruid: R.elite, color: white, sprite_type: 0 });
b.patchComponent("Panel/Inner/Grid/CardTemplate/Badge", SGR, { PreserveSprite: 1 });
b.text("Panel/Inner/Grid/CardTemplate/Count", "0/100", { size: 22, bold: true, color: "#5C3314", pos: [0, -32], rect_size: [160, 32], bestfit: true, min_size: 12, max_size: 22 });
b.button("Panel/Inner/Grid/CardTemplate/BtnClaim", "", { rect_size: [150, 60], pos: [0, -80], image_ruid: R.green, bg_color: white, sprite_type: 0, font_size: 22 });
b.patchComponent("Panel/Inner/Grid/CardTemplate/BtnClaim", TGR, { Font: "Maple", FontStyle: 1, OutlineWidth: 0.25, OutlineColor: { r: 0.1, g: 0.3, b: 0.05, a: 1 } });
b.sprite("Panel/Inner/Grid/CardTemplate/Dim", { rect_size: [192, 242], image_ruid: R.dim, color: { r: 0, g: 0, b: 0, a: 0.45 }, sprite_type: 0 });
b.sprite("Panel/Inner/Grid/CardTemplate/Lock", { rect_size: [44, 51], pos: [0, 52], image_ruid: R.lock, color: white, sprite_type: 0 });

// 스크롤바 — 업적 팝업과 같은 커스텀 바(UIGridScrollBar: 같은 부모의 "Grid"를 찾아 붙는다)
const src = UIBuilder.read("ui/AchievementGroup.ui");
b.empty("Panel/Inner/ScrollBar", { rect_size: [43, 526], pos: [556, 0] });
for (const c of src.find("Panel/List/ScrollBar").jsonString["@components"]) {
  if (c["@type"] === "MOD.Core.UITransformComponent") continue;
  b.upsertComponent("Panel/Inner/ScrollBar", c["@type"], JSON.parse(JSON.stringify(c)));
}

// 모두 받기 — 짧게, 프레임 안쪽에(유저 지정 "너무 길고 경계에 걸쳐 있어서 보기 쫌 그렇다").
// 카드 홈 아래(-290)와 프레임 아래 테두리 안쪽(-383) 사이에 들어가게 한다.
b.button("Panel/BtnClaimAll", "UI_ACHIEVEMENTGROUP_001", { rect_size: [200, 80], pos: [0, -336], image_ruid: R.green, bg_color: white, sprite_type: 0, font_size: 28 });
b.patchComponent("Panel/BtnClaimAll", TGR, { Font: "Maple", FontStyle: 1, IsLocalizationKey: true, OutlineWidth: 0.25, OutlineColor: { r: 0.1, g: 0.3, b: 0.05, a: 1 } });
b.patch("Panel/BtnClaimAll", { localize: true });

// 그리는 순서: 나무 패널이 프레임보다 먼저(밑에) — Panel 자식의 displayOrder를 이 순서로 다시 매긴다
const order = ["Backdrop", "Frame", "Title", "Banner", "BtnPrev", "BtnNext", "BtnClose", "Inner", "BtnClaimAll"];
order.forEach((name, i) => b.patch("Panel/" + name, { display_order: i }));
const bannerOrder = ["Border", "Photo", "Name"];
bannerOrder.forEach((name, i) => b.patch("Panel/Banner/" + name, { display_order: i }));

b.write(PATH, {
  bind: {
    mlua: "RootDesk/MyDesk/MonsterBook/MonsterBookUI.mlua",
    props: {
      popupGroup: "MonsterBookGroup",
      btnClose: "Panel/BtnClose",
      btnClaimAll: "Panel/BtnClaimAll",
      btnPrev: "Panel/BtnPrev",
      btnNext: "Panel/BtnNext",
      listGrid: "Panel/Inner/Grid",
      cardTemplate: "Panel/Inner/Grid/CardTemplate",
      episodePhoto: "Panel/Banner/Photo",
      episodeName: "Panel/Banner/Name",
    },
  },
});
console.log("MonsterBookGroup written");

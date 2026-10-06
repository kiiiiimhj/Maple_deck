// 입장 연출 "기절했다 눈 뜨는" 시야(2026-10-07 유저 지정): Effect/Haze(흰 반투명 안개) + Effect/Vignette(가장자리 어둡게)
// Shade 바로 위·눈꺼풀 띠/실루엣 아래에 그린다. 투명도는 GameEntryFxUI가 CanvasGroup으로 조절(기본 0).
const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");
const P = "ui/GameEntryFxGroup.ui";
const b = UIBuilder.read(P);
b.sprite("Effect/Haze", { anchor: "stretch", pos: [0, 0], rect_size: [1920, 1080], color: { r: 1, g: 1, b: 1, a: 1 }, sprite_type: 0, raycast: false });
b.upsertComponent("Effect/Haze", "MOD.Core.CanvasGroupComponent", { "@type": "MOD.Core.CanvasGroupComponent", BlocksRaycasts: false, GroupAlpha: 0, Interactable: false, Enable: true });
b.sprite("Effect/Vignette", { anchor: "stretch", pos: [0, 0], rect_size: [1920, 1080], color: { r: 1, g: 1, b: 1, a: 1 }, sprite_type: 0, raycast: false, image_ruid: "6afef2ebb8c24b00b481ea4e48826fde" });
b.upsertComponent("Effect/Vignette", "MOD.Core.CanvasGroupComponent", { "@type": "MOD.Core.CanvasGroupComponent", BlocksRaycasts: false, GroupAlpha: 0, Interactable: false, Enable: true });
// 그리는 순서: Shade 0 → Haze 1 → Vignette 2 → 눈꺼풀 3,4 → 실루엣 5~9 → 입력막 10
const order = { Shade: 0, Haze: 1, Vignette: 2, VisionTop: 3, VisionBottom: 4, Silhouette: 5, TurnPose1: 6, TurnPose2: 7, TurnPose3: 8, TurnPose4: 9, InputBlocker: 10 };
for (const [n, o] of Object.entries(order)) b.patch("Effect/" + n, { display_order: o });
b.write(P, { strict: false });
const c = UIBuilder.read(P);
for (const e of c.listEntities()) console.log(e.path, "do=" + c.find(e.path).jsonString.displayOrder, e.kind);

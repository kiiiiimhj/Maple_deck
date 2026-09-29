// 몬스터 도감 — 유저가 Maker에서 배너/버튼 위치를 직접 잡은 뒤의 후속 보정(2026-09-29)
//   1) 사진(Photo)은 테두리(Border) **밑에** — 테두리 안쪽 창(가로 83% · 세로 33%, 썸네일 알파 실측)을 여백 없이 채운다.
//      사진 비율(3.31:1)은 유지하고 넘치는 위아래는 마스크(PhotoClip)로 잘라낸다.
//   2) 테두리를 가로 중앙(x=0)에, 좌우 화살표를 그 중심 높이에 대칭으로.
//   3) 배너가 내려온 만큼 카드 영역을 아래로 — 배너 아래 ~ 모두 받기 버튼 위 사이에 들어가게 카드를 0.78배로 줄인다.
// ⚠ build_monster_book.cjs는 다시 돌리지 말 것(유저가 Maker에서 잡은 위치를 덮어쓴다).
const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");
const SGR = "MOD.Core.SpriteGUIRendererComponent";
const TGR = "MOD.Core.TextGUIRendererComponent";
const white = { r: 1, g: 1, b: 1, a: 1 };
const PATH = "ui/MonsterBookGroup.ui";
const b = UIBuilder.load(PATH);

const tf = (p) => b.getComponent(p, "MOD.Core.UITransformComponent");
const border = tf("Panel/Banner/Border");
const bannerPos = tf("Panel/Banner").anchoredPosition;
const bw = border.RectSize.x, bh = border.RectSize.y;
const by = border.anchoredPosition.y;                // 배너 기준 테두리 중심 Y(유저 위치 유지)
const borderAbsY = bannerPos.y + by;                // Panel 기준 테두리 중심 Y

// (1)(2) 테두리 가로 중앙 + 사진 창
b.patch("Panel/Banner/Border", { pos: [0, by] });
const winW = Math.round(bw * 0.83) + 12;            // 썸네일 1px 오차만큼 살짝 크게 — 가장자리는 테두리가 덮는다
const winH = Math.round(bh * 0.33) + 12;
const winY = by - bh * 0.02;                        // 창 중심이 테두리 중심보다 2% 아래
b.mask("Panel/Banner/PhotoClip", { rect_size: [winW, winH], pos: [0, winY] });
const photoH = Math.round(winW / 3.314);            // 월드 사진 1690x510 비율 유지(가로를 꽉 채우고 위아래는 잘림)
b.sprite("Panel/Banner/PhotoClip/Photo", { rect_size: [winW, photoH], pos: [0, 0], image_ruid: "95ce798ac8fd4b1ab8177405c18c9949", color: white, sprite_type: 0 });
if (b.find("Panel/Banner/Photo")) b.remove("Panel/Banner/Photo");
["PhotoClip", "Border", "Name"].forEach((n, i) => b.patch("Panel/Banner/" + n, { display_order: i }));

// 좌우 화살표: 테두리 중심 높이, 가운데 기준 대칭(테두리 바깥 가장자리 + 여유)
const arrowX = Math.round(bw / 2 + 48 + 14);
b.patch("Panel/BtnPrev", { pos: [-arrowX, borderAbsY] });
b.patch("Panel/BtnNext", { pos: [arrowX, borderAbsY] });

// (3) 카드 영역 — 배너 아래 ~ 모두 받기 위
const bannerBottom = borderAbsY - bh / 2 - 8;
const claim = tf("Panel/BtnClaimAll");
const claimTop = claim.anchoredPosition.y + claim.RectSize.y / 2 + 6;
const innerH = Math.floor(bannerBottom - claimTop);
const innerY = (bannerBottom + claimTop) / 2;
const k = 0.78;
const cellW = Math.round(200 * k), cellH = Math.round(250 * k);
const gapX = 30, gapY = 9, cols = 5;
const gridW = cols * cellW + (cols - 1) * gapX + 6;
const gridH = innerH - 12;
const innerW = gridW + 110;
b.sprite("Panel/Inner", { rect_size: [innerW, innerH], pos: [0, innerY], image_ruid: "2860136c06ab075439721c027de365af", color: { r: 0.22, g: 0.11, b: 0.04, a: 0.55 }, sprite_type: 1 });
b.patch("Panel/Inner/Grid", { rect_size: [gridW, gridH], pos: [-22, 0] });
b.patchComponent("Panel/Inner/Grid", "MOD.Core.GridViewComponent", { CellSize: { x: cellW, y: cellH }, Spacing: { x: gapX, y: gapY }, Padding: { left: 3, right: 0, top: 4, bottom: 4 } });
b.patch("Panel/Inner/ScrollBar", { rect_size: [43, gridH], pos: [gridW / 2 - 22 + 34, 0] });

// 카드 템플릿 0.78배
const C = "Panel/Inner/Grid/CardTemplate";
const s = (v) => Math.round(v * k * 10) / 10;
b.panel(C, { rect_size: [cellW, cellH], alpha: 0, enable: false });
b.sprite(C + "/Bg", { rect_size: [cellW, cellH], image_ruid: "042e72ea975d4c448d50caee5105e9fa", color: white, sprite_type: 0 });
b.sprite(C + "/Image", { rect_size: [s(92), s(88)], pos: [0, s(52)], image_ruid: "95ce798ac8fd4b1ab8177405c18c9949", color: white, sprite_type: 0 });
b.patchComponent(C + "/Image", SGR, { PreserveSprite: 1 });
b.sprite(C + "/Badge", { rect_size: [s(54), s(54)], pos: [0, s(100)], image_ruid: "ed6a53c6c13641dd8073ac871553de37", color: white, sprite_type: 0 });
b.patchComponent(C + "/Badge", SGR, { PreserveSprite: 1 });
b.text(C + "/Count", "0/100", { size: 17, bold: true, color: "#5C3314", pos: [0, s(-32)], rect_size: [s(160), s(32)], bestfit: true, min_size: 10, max_size: 17 });
b.button(C + "/BtnClaim", "", { rect_size: [s(150), s(60)], pos: [0, s(-80)], image_ruid: "b1edd272562e46009d559aef07c6be63", bg_color: white, sprite_type: 0, font_size: 17 });
b.patchComponent(C + "/BtnClaim", TGR, { Font: "Maple", FontStyle: 1, OutlineWidth: 0.25, OutlineColor: { r: 0.1, g: 0.3, b: 0.05, a: 1 } });
b.sprite(C + "/Dim", { rect_size: [s(192), s(242)], image_ruid: "4fea64a3307cda641809ad8be0d4890b", color: { r: 0, g: 0, b: 0, a: 0.45 }, sprite_type: 0 });
b.sprite(C + "/Lock", { rect_size: [s(44), s(51)], pos: [0, s(52)], image_ruid: "9b0f8afa34bc438d864bf4c9cc393844", color: white, sprite_type: 0 });
["Bg", "Image", "Badge", "Count", "BtnClaim", "Dim", "Lock"].forEach((n, i) => b.patch(C + "/" + n, { display_order: i }));

b.write(PATH, { bind: { mlua: "RootDesk/MyDesk/MonsterBook/MonsterBookUI.mlua", props: { episodePhoto: "Panel/Banner/PhotoClip/Photo" } } });
console.log(JSON.stringify({ borderAbsY, bw, bh, winW, winH, photoH, arrowX, bannerBottom, claimTop, innerH, innerY, cellW, cellH, gridW, gridH, imageBaseY: s(52) }));

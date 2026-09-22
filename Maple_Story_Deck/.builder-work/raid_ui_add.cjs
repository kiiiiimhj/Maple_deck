// 2026-09-23 유저 지정:
//  ① 로비 레이드 아이콘(TitleGroup/RaidButton) 위에 "보스 레이드" 글자(번역 키 UI_TITLEGROUP_039)
//  ② 레이드 팝업 좌측 상단(X 버튼과 좌우 대칭 자리)에 튜토리얼 버튼(뽑기 BtnInfo와 같은 info_btn 이미지)
//   node .builder-work/raid_ui_add.cjs [--apply]
const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");
const APPLY = process.argv.includes("--apply");
const ext = "." + "ui";

// ① TitleGroup
{
  const f = "ui/TitleGroup" + ext;
  const b = UIBuilder.load(f);
  const path = "RaidButton/RaidLabel";
  if (!b.listEntities().some((e) => e.path === "/ui/TitleGroup/" + path)) {
    b.text(path, "UI_TITLEGROUP_039", {
      anchor: "middle-center", pos: [0, 100], rect_size: [240, 44], size: 30, color: "#FFFFFF",
      alignment: 4, bestfit: true, min_size: 16, max_size: 30,
      outline: true, outline_color: "#2A0E0E", outline_width: 2,
    });
  }
  // 번역 키 그대로 엔진이 풀게 한다(.ui의 다른 라벨과 같은 방식)
  b.patchComponent("/ui/TitleGroup/" + path, "MOD.Core.TextGUIRendererComponent", { IsLocalizationKey: true, OutlineWidth: 2, OutlineColor: { r: 0.16, g: 0.05, b: 0.05, a: 1 } });
  const c = b.getComponent("/ui/TitleGroup/" + path, "MOD.Core.TextGUIRendererComponent");
  console.log("TitleGroup label:", b.getId("/ui/TitleGroup/" + path), JSON.stringify({ Text: c.Text, key: c.IsLocalizationKey, size: c.FontSize, outline: c.OutlineWidth }));
  if (APPLY) { try { b.write(f, { strict: false }); } catch (e) { console.log("write 예외: " + String(e.message).slice(0, 160)); } }
}

// ② RaidGroup
{
  const f = "ui/RaidGroup" + ext;
  const b = UIBuilder.load(f);
  const path = "BtnTutorial";
  if (!b.listEntities().some((e) => e.path === "/ui/RaidGroup/" + path)) {
    // X 버튼(BtnExit, x 523.9)과 액자 중심(x -24.42) 기준으로 좌우 대칭 = x -572.8, y 는 같은 282.1
    b.button(path, "", { anchor: "middle-center", pos: [-572.8, 282.1], rect_size: [90, 90], image_ruid: "78d254b94ee54616ab1d6038e131ec8a" });
  }
  const id = b.getId("/ui/RaidGroup/" + path);
  console.log("RaidGroup button:", id);
  if (APPLY) { try { b.write(f, { strict: false }); } catch (e) { console.log("write 예외: " + String(e.message).slice(0, 160)); } }
}
console.log(APPLY ? "기록 완료" : "드라이런");

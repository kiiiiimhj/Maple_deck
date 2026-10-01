// 방치 보상 팝업 장면 양끝에 에피소드 < > 버튼(유저 지정 2026-10-01).
// 조합 방법 팝업(OptionGroup FusionPanel/Pager/Prev·Next)의 버튼을 컴포넌트째 복제해서 IdleRewardGroup Panel에 둔다.
// 장면(Scene, 900x190 × UIScale 1.2 = 화면상 1080 너비, Panel y-50) 양끝에서 살짝 안쪽(x ±495).
// SceneFrame보다 뒤(마지막 자식)에 붙여서 장면 위에 그려지게 한다. IdleRewardUI.btnEpPrev/btnEpNext에 UUID를 넣는다.
const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");

const SRC_FILE = "ui/OptionGroup.ui";
const DST_FILE = "ui/IdleRewardGroup.ui";
const clone = (o) => JSON.parse(JSON.stringify(o));
const T = "MOD.Core.UITransformComponent";

const src = UIBuilder.read(SRC_FILE);
const dst = UIBuilder.read(DST_FILE);

const pairs = [
  ["FusionPanel/Pager/Prev", "Panel/EpPrev", -495],
  ["FusionPanel/Pager/Next", "Panel/EpNext", 495],
];
for (const [from, to, x] of pairs) {
  const f = src.find(from);
  dst.empty(to);
  for (const comp of f.jsonString["@components"]) dst.upsertComponent(to, comp["@type"], clone(comp));
  dst.patch(to, { pos: [x, -50], enable: false });  // 기본 숨김 — IdleRewardUI.RefreshEpisodeArrows가 갈 수 있는 쪽만 켠다
  const t = dst.getComponent(to, T);
  console.log(to, "from", from, "size", JSON.stringify(t.RectSize), "pos", JSON.stringify(t.anchoredPosition), dst.find(to).componentNames);
}

dst.write(DST_FILE, {
  strict: false,
  bind: {
    mlua: "RootDesk/MyDesk/IdleReward/IdleRewardUI.mlua",
    props: { btnEpPrev: "Panel/EpPrev", btnEpNext: "Panel/EpNext" },
  },
});
const txt = UIBuilder.read(DST_FILE).getComponent("Panel/EpPrev", "MOD.Core.TextGUIRendererComponent");
console.log("prev label:", txt && JSON.stringify(txt.Text));

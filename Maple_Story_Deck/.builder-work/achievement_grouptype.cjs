// 업적 팝업을 TitleGroup(GroupType 2)과 같은 레이어로 — 에디터에서 로비 배경 뒤에 깔리는 문제.
// GroupOrder(23)는 건드리지 않는다(바꾸면 Maker가 다른 .ui 순서까지 재정렬함 — project_toast_group_order_fix)
const {UIBuilder}=require('../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs');
const b=UIBuilder.load('ui/AchievementGroup.ui');
b.patchComponent('/','MOD.Core.UIGroupComponent',{GroupType:2});
b.write('ui/AchievementGroup.ui');
console.log(JSON.stringify(UIBuilder.load('ui/AchievementGroup.ui').getComponent('/','MOD.Core.UIGroupComponent')));

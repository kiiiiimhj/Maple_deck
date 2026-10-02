// 버튼 글씨 통일(유저 지정 2026-10-02): GPT로 버튼 그림을 싹 바꾼 뒤, 버튼 안 글씨를
//  - 가운데 정렬
//  - 색: 모든 버튼 공통 크림색(FFF3D1, 확인창 기준과 같은 색) + 외곽선은 "버튼 색의 진한 톤"
//  - 살짝 FaceDilate + 살짝 외곽선
// 으로 맞춘다. 문구·로컬라이즈 키·Enable·폰트 크기는 안 건드린다.
// 카드형(보상 카드·상품 카드·출석 칸·상점 아이템), 닫기 X, 기본 스프라이트(관리자/디버그) 버튼은 제외.
// 사용: node .builder-work/button_text_restyle.cjs          → 바뀔 내용만 출력(dry run)
//       node .builder-work/button_text_restyle.cjs --write  → 실제로 쓴다(Maker stop 후)
const fs = require("fs");
const { UIBuilder } = require("../.claude/skills/msw-ui-system/scripts/msw_ui_builder.cjs");
const WRITE = process.argv.includes("--write");
const SPR = "MOD.Core.SpriteGUIRendererComponent";
const BTN = "MOD.Core.ButtonComponent";
const TXT = "MOD.Core.TextComponent";
const TGR = "MOD.Core.TextGUIRendererComponent";
const T = "MOD.Core.UITransformComponent";

const hex = (h, a = 1) => ({ r: parseInt(h.slice(0, 2), 16) / 255, g: parseInt(h.slice(2, 4), 16) / 255, b: parseInt(h.slice(4, 6), 16) / 255, a });
const CREAM = hex("fff3d1");
// 버튼 그림 RUID → 외곽선 색(버튼 색의 진한 톤)
const OUTLINE = {
  green: "1f4208", red: "5a1208", blue: "0f2d57", gold: "6b3a05", wood: "2e1606", gray: "3c3c3c",
};
const FAMILY = {
  "0a0194a2dc554eaabe47240600e2b109": "green", "0e724e04a7634d0f897527968811c8bc": "green",
  "27ba6555b44f415087f593dfaa005077": "green", "2f3a7d9ab7fd4248b2f56823bc202c80": "green",
  "40b51b1577874009b41c2485a8a2d028": "green", "5f3b12df85724f2ab7b48e26610f42f5": "green",
  "73a50596371b43bea72b8222a7b8881d": "green", "8959f174c2af47aa9f5ffdf594329758": "green",
  "93fd99637232481b8565d2135945bd7e": "green", "a480556c7a0a4dd1825c6433bb17bb2b": "green",
  "b1edd272562e46009d559aef07c6be63": "green", "b988cc0e3c8d4903bd10427dadd153fe": "green",
  "f9f36999b7724737bb23ee5d6b756a61": "green",
  "38bdbbefdf294295b5cedb147737f1d0": "red", "4d2705c12b364a4c8babfbc4e954ccdf": "red",
  "9b5253439b6a4d0597d5e8f96cce6be9": "red",
  "71159c46fac84ad083b48a3fa2995b87": "blue", "808c067b9f3f49fcba0f9dac17b58e32": "blue",
  "96c516f00fb8457ca34ddf99e213d020": "gold", "988c6f89fbb543f9afd92e1ac5808cec": "gold",
  "e6142efec43b4440acfb1298a6e01408": "gold", "f5b1566d1c664430a5134fd55811c33d": "gold",
  "c6d376a4daba46cea8f03166f8637f91": "gold",
  "0cfbd6e3aa6845abb4a42659d01b6078": "wood", "df45bdb1640949c9b5269bbd4cee7a66": "wood",
  "d64558d3613a4e9bbe94fb4223e9d88d": "wood",
  "6a34f87232c649cfaa6d770aae45e293": "gray",
  "85d2ad0704f54117a9a511d95e9f0b71": "gold", // 뽑기 1회 버튼(노랑)
};
// 파일에선 글씨가 비어 있고 스크립트가 런타임에 채우는 버튼 글씨 — 빈 글씨여도 대상에 넣는다
const RUNTIME_TEXT = new Set([
  "ui/GachaGroup.ui:BtnPull1/Title", "ui/GachaGroup.ui:BtnPull1/CostText",
  "ui/GachaGroup.ui:BtnPull10/Title", "ui/GachaGroup.ui:BtnPull10/CostText",
]);
const EXCLUDE = /\/(Card\d+|ProductCard_\d+|Day\d+|Item\d+|RewardBox|Material\d+|NameBackground|RewardTable|BtnClose)(\/|$)|\/(TextLock|InfoIcon)$/;
// 글씨 하나뿐인 자식 라벨이 옛 그림 기준으로 위로 밀려 있던 것 → 가운데(0,0)로
const RECENTER = new Set([
  "ui/EquipmentGroup.ui:StatButton/Label", "ui/EquipmentGroup.ui:AvatarViewToggle/Label",
  "ui/EquipmentGroup.ui:ComposeButton/Label", "ui/EquipmentGroup.ui:SellButton/Label",
  "ui/EquipmentGroup.ui:ButtonEquip/Label", "ui/EquipmentGroup.ui:ButtonLevelUp/Label",
  "ui/EquipmentGroup.ui:ButtonBatchLevelUp/Label",
]);
// FontStyle 1 = 굵게. 확인창 버튼(굵게)과 뽑기 버튼(보통)이 같은 값인데도 두께가 달라 보여서 통일(2026-10-02)
const TGR_STYLE = { OutlineWidth: 0.2, FaceDilate: 0.2, FontStyle: 1, HorizontalAlignment: 2, VerticalAlignment: 512 };
const TXT_STYLE = { UseOutLine: true, OutlineWidth: 2, Bold: true, Alignment: 4 };

const ruidOf = (spr) => { const v = spr.ImageRUID; return typeof v === "string" ? v : (v && v.DataId) || ""; };
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
let changed = 0;
for (const f of fs.readdirSync("ui").filter((n) => n.endsWith(".ui"))) {
  const file = "ui/" + f;
  const b = UIBuilder.read(file);
  const comp = (e, t) => (e.jsonString["@components"] || []).find((c) => c["@type"] === t);
  let dirty = false;
  for (const e of b.entities) {
    if (!comp(e, BTN) || !comp(e, SPR)) continue;
    const p = e.jsonString.path;
    if (EXCLUDE.test(p)) continue;
    const fam = FAMILY[ruidOf(comp(e, SPR))];
    if (!fam) continue;
    const cands = [e, ...b.entities.filter((c) => {
      const cp = c.jsonString.path;
      return cp.startsWith(p + "/") && !cp.slice(p.length + 1).includes("/");
    })];
    for (const t of cands) {
      const tp = t.jsonString.path;
      if (EXCLUDE.test(tp)) continue;
      const type = comp(t, TGR) ? TGR : comp(t, TXT) ? TXT : null;
      if (!type) continue;
      const tc = comp(t, type);
      const rtKey = file + ":" + tp.replace(/^\/ui\/[^/]+\//, "").split("/").slice(-2).join("/");
      if ((!tc.Text || !String(tc.Text).trim()) && !RUNTIME_TEXT.has(rtKey)) continue;
      // 정렬은 버튼 자체 글씨·"Label"만(아이콘 옆 수량/비용/제목 글씨는 자리 배치가 따로 있어 그대로)
      const isMain = tp === p || tp.endsWith("/Label");
      const style = { ...(type === TGR ? TGR_STYLE : TXT_STYLE) };
      if (!isMain) { delete style.HorizontalAlignment; delete style.VerticalAlignment; delete style.Alignment; }
      const want = { FontColor: CREAM, OutlineColor: hex(OUTLINE[fam]), ...style };
      const upd = {};
      for (const [k, v] of Object.entries(want)) if (!same(tc[k], v)) upd[k] = v;
      const short = tp.replace(/^\/ui\/[^/]+\//, "");
      const key = file + ":" + short.split("/").slice(-2).join("/");
      if (Object.keys(upd).length) {
        console.log(f.padEnd(26), fam.padEnd(5), type.split(".").pop().slice(0, 4), short, Object.keys(upd).join(","));
        if (WRITE) { b.patchComponent(tp, type, upd); dirty = true; }
        changed++;
      }
      if (RECENTER.has(key)) {
        const tr = comp(t, T);
        if (tr.anchoredPosition.x !== 0 || tr.anchoredPosition.y !== 0) {
          console.log("   recenter", short, JSON.stringify(tr.anchoredPosition), "-> 0,0");
          if (WRITE) { b.patchComponent(tp, T, { anchoredPosition: { x: 0, y: 0 } }); dirty = true; }
        }
      }
    }
  }
  if (WRITE && dirty) b.write(file, { strict: false });
}
console.log(WRITE ? "written" : "dry run", changed);

# Pet shop alignment v15

Applied to `RootDesk/MyDesk/UI/ShopUI.mlua`.

- Skill icons align to the left inner edge; the left-aligned skill name follows with a 6 UI-pixel gap.
- Descriptions and automatic activation interval remain centered on each card.
- Price text is explicitly centered and raised 4 UI pixels to center its glyphs on the blue button face.
- Skill images are centered using their actual source pivots, including Bugi's bottom-pivot shell icon.
- Four pet cards, 1,300 coins each; Oduck remains excluded. UI preview only.

Verified after saving and restarting in actual Maker. Screenshot and geometry evidence are included. ShopPurchaseLogic, PetLogic and PetHouseUI are byte-identical to their pre-change versions.

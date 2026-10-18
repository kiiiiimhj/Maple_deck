# Pet shop alignment v16

Current applied source: `RootDesk/MyDesk/UI/ShopUI.mlua`.

The skill icon and name remain adjacent with a 6 UI-pixel gap. Their combined width is centered on the card using the renderer's actual text measurement. Price, description and interval alignment from v15 is retained. Verified after saving and restarting actual Maker; screenshot and geometry evidence are included.

This supersedes v15's left-aligned skill row. Four pets cost 1,300 coins each in the preview; Oduck is excluded. ShopPurchaseLogic, PetLogic and PetHouseUI are unchanged.

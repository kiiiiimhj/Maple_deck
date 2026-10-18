# Pet equipment resources

Current applied artwork and editable sources are managed in this folder.

- Native pets: Maps/validated-native-equipment-inputs-v11.json and Sources/Validated/<pet>.
- Ttungttang: Maps/validated-ttung-equipment-inputs.json and Sources/Validated/ttungttang.
- Live textures and icons: Maps/equipment-resources.json. Each item retains its individual slot state and bonus.
- Game source snapshots: Workflow/AppliedSource.
- Current native comparison and actual playback proof: Previews/NativeEquipmentV11.
- Complete native sheet rebuild from portable inputs: Workflow/NativeEquipmentV11/rebuild_validated.py.
- Pendant illustration source: Sources/Validated/PendantDesigns; built-in image generation specification: Workflow/NativeEquipmentV11/pendant-prompt.txt.

The native set adds one variation for each pet/slot. Coats give attack +5%, head ornaments critical damage +10%, necklaces critical chance +5%. Variants of the same slot replace one another and do not stack. Maker inventory's equipment test button makes both designs available for the selected owned pet. Release acquisition remains undecided.

Read AGENTS.md before modifying artwork or rendering. Earlier exploratory outputs are retired; do not rebuild from their defective masks.

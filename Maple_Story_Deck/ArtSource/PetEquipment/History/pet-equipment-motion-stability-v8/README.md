# Pet equipment motion stability v8

Fixes Ducky walking ribbon shape changes, pendant size pumping, pose registration and intermittent sleep coat color changes. The native faces, feet and body frames stay in use. Bugi's already painted frame-specific body replacements are retained byte-for-byte, preserving all leg poses. Equipment remains independently removable; Ttungttang, stat values and test acquisition are unchanged.

The same jewel artwork is used at a fixed size per pet, with native head/bill occlusion. Ordinary coat and Ducky ribbon frames use rigid native-pixel registration, with the existing pose-specific painting retained when native anatomy differs too much for a reliable match. No image scaling/warping or blur was added. Textures use Point filtering.

The actual care controller's repeated whole-body injection shake is replaced with one small recoil. Actual playback inspection also caught a native body sprite missing momentarily at the first feeding transition, despite resource preload reporting success. The native UI renderer now warms incoming body frames at their real display footprint while holding the previous complete pose, then switches body and equipment together. Final cold-start feeding footage contains the body from its first captured frame.

Verification contains local frame checks, actual Maker care playback and 5,984 native-frame / independent-slot / facing cases. The first runtime report checks renderer hookups, and its initial feeding footage preserves the visual issue found in review; cold-runtime-verification and cold-fixed captures are the final handoff checks. Captures are screenshot sequences, not full-frame-rate video. They do not constitute a guarantee against every possible engine rendering fault.

Previous source artwork and v7 archive remain alongside this directory. Private account snapshots, credentials and upload URLs are excluded.

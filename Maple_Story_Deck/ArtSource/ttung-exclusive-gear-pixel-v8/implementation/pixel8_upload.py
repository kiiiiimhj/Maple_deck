from pathlib import Path
source=Path('work/ttung-gear/upload.py').read_text(encoding='utf-8').replace("out=Path('outputs/ttung-gear')","out=Path('outputs/ttung-gear-pixel-v8')").replace("'ttung_gear_'","'tt_px8_'")
exec(compile(source,'sniff-equipment-upload','exec'))

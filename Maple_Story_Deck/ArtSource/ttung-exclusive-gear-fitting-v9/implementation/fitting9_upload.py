from pathlib import Path
source=Path('work/ttung-gear/upload.py').read_text(encoding='utf-8').replace("out=Path('outputs/ttung-gear')","out=Path('outputs/ttung-gear-fitting-v9')").replace("'ttung_gear_'","'tt_ft9_'")
exec(compile(source,'sniff-equipment-upload','exec'))

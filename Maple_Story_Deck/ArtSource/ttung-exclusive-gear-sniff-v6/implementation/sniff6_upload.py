from pathlib import Path
source=Path('work/ttung-gear/upload.py').read_text(encoding='utf-8').replace("out=Path('outputs/ttung-gear')","out=Path('outputs/ttung-gear-sniff-v6')").replace("'ttung_gear_'","'tt_sn6_'")
exec(compile(source,'sniff-equipment-upload','exec'))

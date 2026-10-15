from pathlib import Path
source=Path('work/ttung-gear/upload.py').read_text(encoding='utf-8').replace("out=Path('outputs/ttung-gear')","out=Path('outputs/ttung-gear-fit5')").replace("'ttung_gear_'","'tt_cap5_'")
exec(compile(source,'clean-gear-upload','exec'))

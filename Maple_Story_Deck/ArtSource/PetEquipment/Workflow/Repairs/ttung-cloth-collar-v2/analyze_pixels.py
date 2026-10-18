from pathlib import Path
from PIL import Image
import numpy as np,sys,json
sys.path.insert(0,str(Path('work/pet-gear-contours-v7/python-libs').resolve()));import cv2
out=Path('outputs/pet-variation-repair-v2');a=Image.open(out/'actual-fixed-neutral-expected.png').resize((128,128),Image.Resampling.NEAREST).convert('RGBA');a=np.array(a);screen=np.array(Image.open(out/'actual-fixed-neutral.png').convert('RGB'));step=3
template=np.repeat(np.repeat(a[:,:,:3],step,axis=0),step,axis=1);mask=np.repeat(np.repeat((a[:,:,3]==255).astype(np.uint8)*255,step,axis=0),step,axis=1)
area=screen[330:760,690:1180];result=cv2.matchTemplate(area,template,cv2.TM_SQDIFF,mask=mask);minimum,_,loc,_=cv2.minMaxLoc(result);left=loc[0]+690;top=loc[1]+330;actual=screen[top+1+np.arange(128)*3[:,None] if False else slice(0)]if False else screen[top+1+np.arange(128)[:,None]*3,left+1+np.arange(128)[None,:]*3];delta=np.abs(actual.astype(int)-a[:,:,:3].astype(int)).max(axis=2);bad=(a[:,:,3]==255)&(delta>6)
print({'left':left,'top':top,'match':minimum,'bad':int(bad.sum()),'max':int(delta[a[:,:,3]==255].max())})
Image.fromarray(actual).resize((512,512),Image.Resampling.NEAREST).save(out/'neutral-aligned-actual.png')

from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import json,sys,re,numpy as np
sys.path.insert(0,'work/pet-gear-contours-v7/python-libs')
import cv2
sys.path.insert(0,'work/pet-gear-density-v6');from test_complete_masks import high
old=Path('outputs/pet-gear-density-v6');out=Path('outputs/pet-gear-contours-v7');pages=json.loads(Path('outputs/pet-gear-painted-v5/pages.json').read_text())
def locate(paint,im):
 a=np.array(paint);b=np.array(im);ys,xs=np.where(b[:,:,3]>0);iy,ix=int(ys[len(ys)//2]),int(xs[len(xs)//2]);yy,xx=np.where((a[:,:,:3]==b[iy,ix,:3]).all(axis=2));hits=[]
 for y,x in zip(yy,xx):
  top,left=y-iy,x-ix
  if top>=0 and left>=0 and top+im.height<=paint.height and left+im.width<=paint.width and np.array_equal(a[top:top+im.height,left:left+im.width,:3],b[:,:,:3]):hits.append((left,top))
 assert len(hits)==1,(len(hits),im.size)
 return hits[0]
def extract(paint,init,pet,slot):
 a=np.array(paint);y,x=np.where(init);margin=16 if slot=='hat'else(12 if slot=='neck'or(slot=='coat'and pet=='landturtle')else 6);x0=max(0,x.min()-margin);y0=max(0,y.min()-margin);x1=min(paint.width,x.max()+margin+1);y1=min(paint.height,y.max()+margin+1);rgb=a[y0:y1,x0:x1,:3].copy();alpha=a[y0:y1,x0:x1,3];m=init[y0:y1,x0:x1];r,g,b=rgb.transpose(2,0,1).astype(int);yy,xx=np.indices(m.shape);forbidden=np.zeros_like(m)
 labels=np.full(m.shape,cv2.GC_PR_BGD,np.uint8);hull=np.zeros(m.shape,np.uint8);points=np.column_stack(np.where(m)[::-1]).astype(np.int32);cv2.fillConvexPoly(hull,cv2.convexHull(points),1);labels[hull>0]=cv2.GC_PR_FGD
 if slot=='hat':
  if pet=='5000498':color=(r>g*1.25)&(b>g*1.05)&(r>115)&(b>45)
  elif pet=='oduck':color=((g>r*1.15)&(b>r*1.15)&(g>35))|((r>150)&(r-b>60)&(r-g>40)&(g>40)&(b>g*.6)&(b>40)&(b<g*1.25))
  else:color=((g>r*1.15)&(g>b*1.1)&(g>65))|((r>205)&(g>110)&(g<215)&(b<105)&(r>g*1.12))|((r>230)&(g>225)&(b>210))
 elif slot=='neck':
  if pet=='5002617':color=(r>185)&(g>70)&(b<130)&((r-g)>30)&((g-b)>40)
  elif pet=='landturtle':color=(b>r*1.1)&(b>g*.98)&(b>100)
  elif pet=='oduck':color=(g>140)&(b>130)&(r<g*.82)&(r<b*.82)
  else:color=(g>r*1.1)&(b>r*1.1)&(g>65)&(b>70)
 else:
  if pet in ['5002617','landturtle']:color=(g>r*1.12)&(g>b*1.06)&(g>45)
  elif pet=='5000498':color=(r>g*1.3)&(b>g*1.05)&(r<235)&(g<120)&(r>40)
  else:color=(b>r*1.3)&(g>r*.95)&(b<180)&(g<130)&(b>35)
 fg=m&color
 if slot=='coat'and pet=='landturtle':
  # The old green-only seed excluded the painted cream rim. Seed that entire
  # actual source band below the green shell, including its shaded gold edge.
  gy,gx=np.where(fg);columns=np.unique(gx)
  bottom=np.interp(np.arange(m.shape[1]),columns,[np.where(fg[:,col])[0].max()for col in columns])
  rim=(r>110)&(g>70)&(r>g*1.035)&(g>b*1.08)&(b<225)&(alpha>=160)&(xx>=gx.min()-5)&(xx<=gx.max()+6)&(yy>=bottom[None,:]-2)&(yy<=bottom[None,:]+10)
  fg|=rim
  labels[cv2.dilate(rim.astype(np.uint8),np.ones((3,3),np.uint8))>0]=cv2.GC_PR_FGD
 if slot=='hat':
  n,labels0,stats,centers=cv2.connectedComponentsWithStats(m.astype(np.uint8),connectivity=8);main=1+int(np.argmax(stats[1:,cv2.CC_STAT_AREA]));seedm=labels0==main
  if pet=='5000498':
   pink=seedm&color
   if not pink.any():pink=m&color
   py,px=np.where(pink);left,right,top,bottom=px.min(),px.max(),py.min(),py.max();window=(xx>=left-20)&(xx<=right+12)&(yy>=top-6)&(yy<=bottom+6);fg=color&window
   gy,gx=np.where(fg);cx,cy=gx.mean(),gy.mean();gold=(r>145)&(g>90)&(g<225)&(b<110)&(r>g*1.05)&(abs(xx-(cx-3))<13)&(yy>top+2)&(yy<bottom+8)
   nc,cc,ss,ccent=cv2.connectedComponentsWithStats(gold.astype(np.uint8),connectivity=4);candidates=[k for k in range(1,nc)if 3<=ss[k,cv2.CC_STAT_AREA]<=260]
   if candidates:
    bell=min(candidates,key=lambda k:(ccent[k,0]-(cx-3))**2+(ccent[k,1]-(cy+6))**2);fg|=cc==bell
   forbidden|=color&~window
   blue=(b>r*1.15)&(g>r*1.1)&(b>35)
   forbidden|=cv2.dilate(blue.astype(np.uint8),np.ones((5,5),np.uint8))>0
  elif pet=='oduck':
   coral=(r>150)&(r-b>60)&(r-g>40)&(g>40)&(b>g*.6)&(b>40)&(b<g*1.25);stars=coral&seedm
   if not stars.any():stars=coral&m
   if stars.any():sy,sx=np.where(stars);cx,cy=sx.mean(),sy.mean()
   else:sy,sx=np.where(seedm&color);cx,cy=sx.mean(),sy.mean()
   window=(abs(xx-cx)<20)&(abs(yy-cy)<11);fg=color&window;forbidden|=color&~window;forbidden|=(b>g*1.4)&(r>180)&(b>120)
  else:
   green=(g>r*1.15)&(g>b*1.1)&(g>65);leaves=green&seedm
   if not leaves.any():leaves=green&m
   ly,lx=np.where(leaves);cx,cy=lx.mean(),ly.mean();gold=(r>205)&(g>110)&(g<215)&(b<105)&(r>g*1.12)&(abs(xx-cx)<18)&(abs(yy-cy)<14)
   nc,cc,ss,ccent=cv2.connectedComponentsWithStats(gold.astype(np.uint8),connectivity=4);candidates=[k for k in range(1,nc)if 2<=ss[k,cv2.CC_STAT_AREA]<=100]
   if candidates:
    center=min(candidates,key=lambda k:(ccent[k,0]-cx)**2+(ccent[k,1]-cy)**2);fx,fy=ccent[center];flower=cc==center
   else:fx,fy=cx-7,cy-2;flower=np.zeros_like(m)
   white=(r>230)&(g>225)&(b>215)&((xx-fx)**2+(yy-fy)**2<100)
   fg=(green&(abs(xx-fx)<22)&(abs(yy-fy)<16))|flower|white
   red=(r>220)&(g<85)&(b<85);forbidden|=(cv2.dilate(red.astype(np.uint8),np.ones((5,5),np.uint8))>0)|((b>r*1.2)&(b>100))
   skin=(r>g*1.08)&(r>b*1.25)&(g>70)&(b>50);forbidden|=skin&((xx-fx)**2+(yy-fy)**2>100)&~green
  fg&=alpha>=160;fg&=~forbidden
  hp=np.column_stack(np.where(fg)[::-1]).astype(np.int32)
  if len(hp):hh=np.zeros(m.shape,np.uint8);cv2.fillConvexPoly(hh,cv2.convexHull(hp),1);labels[hh>0]=cv2.GC_PR_FGD
 if slot=='neck':
  n,cc,stats,centers=cv2.connectedComponentsWithStats(color.astype(np.uint8),connectivity=8)
  touching={int(v)for v in np.unique(cc[fg])if v>0}
  if not touching and n>1:
   iy,ix=np.where(m);tx,ty=ix.mean(),iy.mean()-2
   chosen=min(range(1,n),key=lambda k:((centers[k,0]-tx)**2+(centers[k,1]-ty)**2)/max(1,stats[k,cv2.CC_STAT_AREA]**.1));touching={chosen}
  fg=np.isin(cc,list(touching))
  if pet in ['5000498','landturtle']:
   adjacent=cv2.dilate(fg.astype(np.uint8),np.ones((5,5),np.uint8))>0
   gold=(r>110)&(g>65)&(b<115)&(r>g*1.06)&(r<g*2.5)
   fg|=adjacent&gold
  labels[cv2.dilate(fg.astype(np.uint8),np.ones((5,5),np.uint8))>0]=cv2.GC_PR_FGD
 assert fg.sum()>0,(pet,slot)
 labels[fg]=cv2.GC_FGD;labels[alpha<160]=cv2.GC_BGD;labels[:2,:]=0;labels[-2:,:]=0;labels[:,:2]=0;labels[:,-2:]=0
 labels[forbidden]=cv2.GC_BGD
 if slot=='coat'and pet in ['5002617','landturtle']:labels[(b>r*1.1)&(b>g*1.05)&(b>100)]=cv2.GC_BGD
 cv2.setRNGSeed(7);cv2.grabCut(cv2.cvtColor(rgb,cv2.COLOR_RGB2BGR),labels,None,np.zeros((1,65)),np.zeros((1,65)),8,cv2.GC_INIT_WITH_MASK)
 result=(labels==cv2.GC_FGD)|(labels==cv2.GC_PR_FGD);result&=alpha>=160
 # Include only the actual dark border directly touching the segmented object.
 edge=cv2.dilate(result.astype(np.uint8),np.ones((3,3),np.uint8))>0;dark=(r<110)&(g<105)&(b<100);result|=edge&dark&(alpha>=160)
 # Keep complete connected item contours. Foreground colors guide extraction;
 # every source color enclosed by the contour, including whites, is retained.
 n,cc,stats,centroids=cv2.connectedComponentsWithStats(result.astype(np.uint8),connectivity=8)
 if n>1:
  largest=1+int(np.argmax(stats[1:,cv2.CC_STAT_AREA]));keep=cc==largest
  if slot=='coat'and pet!='landturtle':
   for k in range(1,n):
    if stats[k,cv2.CC_STAT_AREA]>=max(8,stats[largest,cv2.CC_STAT_AREA]*.08)and np.any(fg&(cc==k)):keep|=cc==k
  elif slot=='hat':
   for k in range(1,n):
    if stats[k,cv2.CC_STAT_AREA]>=3 and np.any(fg&(cc==k)):keep|=cc==k
  result=keep
 padded=np.pad(result.astype(np.uint8),1);flood=padded.copy();cv2.floodFill(flood,None,(0,0),1);holes=flood[1:-1,1:-1]==0;result|=holes&(alpha>=160)
 if slot=='hat':result&=cv2.dilate(fg.astype(np.uint8),np.ones((5,5),np.uint8))>0
 if slot=='neck':result&=cv2.dilate(fg.astype(np.uint8),np.ones((5,5),np.uint8))>0
 result&=~forbidden
 full=np.zeros(init.shape,bool);full[y0:y1,x0:x1]=result;return full
if __name__=='__main__':
 board=Image.new('RGB',(1600,1800),(60,58,55));draw=ImageDraw.Draw(board);font=ImageFont.truetype('C:/Windows/Fonts/malgun.ttf',18)
 cases=[('5000498',38,'hat'),('landturtle',12,'hat'),('oduck',45,'hat'),('5002617',4,'hat'),('5002617',0,'neck'),('5000498',26,'neck')]
 if len(sys.argv)>1:cases=[('5000498',26,'coat'),('landturtle',28,'coat'),('oduck',44,'coat'),('5002617',55,'coat'),('5002617',100,'coat'),('landturtle',1,'coat')]
 for row,(pet,index,slot)in enumerate(cases):
  pg=next(p for p in pages if p['pet']==pet and any(f['index']==index for f in p['frames']));f=next(f for f in pg['frames']if f['index']==index);maps=json.loads((old/(pet+'-parts.json')).read_text());z=maps[f['ruid']][slot];index=int(re.search(r'-(\d{3})-',z['file'])[1]);pg=next(p for p in pages if p['pet']==pet and any(f['index']==index for f in p['frames']));f=next(f for f in pg['frames']if f['index']==index);base,paint=high(f,pg,'coat'if slot=='coat'else'painted');im=Image.open(old/z['file']).convert('RGBA');at=locate(paint,im);init=np.zeros((paint.height,paint.width),bool);init[at[1]:at[1]+im.height,at[0]:at[0]+im.width]=np.asarray(im)[:,:,3]>0;m=extract(paint,init,pet,slot);a=np.array(paint);a[:,:,3]=np.where(m,a[:,:,3],0);cut=Image.fromarray(a);before=Image.new('RGBA',paint.size);before.alpha_composite(im,at)
  for col,(label,image)in enumerate([('SOURCE',paint),('CURRENT',before),('CONTOUR',cut),('COMPOSITE',cut)]):
   if col==3:image=Image.new('RGBA',paint.size);image.alpha_composite(base.resize((base.width*2,base.height*2),Image.Resampling.NEAREST),(32,32));image.alpha_composite(cut)
   image=image.resize((image.width*2,image.height*2),Image.Resampling.NEAREST);x=col*400+(400-image.width)//2;y=row*300+25;board.paste(image,(x,y),image);draw.text((col*400+4,row*300+3),f'{pet} {index} {slot} {label}',font=font,fill='white')
 board.save(out/'contour-segmentation-test.png')

import numpy as np, subprocess, sys
from PIL import Image, ImageDraw, ImageFont
S=sys.argv[1]
W,H=720,1280
y0,y1=640,920
cmd=["ffmpeg","-v","error","-i",f"{S}/input.mp4","-vf",f"crop=720:{y1-y0}:0:{y0}","-f","rawvideo","-pix_fmt","rgb24","-"]
p=subprocess.Popen(cmd,stdout=subprocess.PIPE)
fs=[];ms=[]
while True:
    b=p.stdout.read(W*(y1-y0)*3)
    if len(b)<W*(y1-y0)*3: break
    f=np.frombuffer(b,np.uint8).reshape(y1-y0,W,3).astype(int)
    R,G,B=f[...,0],f[...,1],f[...,2]
    white=(R>232)&(G>232)&(B>232)
    blue=(B>140)&(B-R>70)&(B-G>50)
    fs.append(f.astype(np.uint8)); ms.append(white|blue)
ms=np.array(ms); n=len(ms)
cnt=ms.sum((1,2))
np.save(f"{S}/work/submask_cnt.npy",cnt)
# change score between consecutive frames
ch=[0]+[ (ms[i]^ms[i-1]).sum()/max(1,(ms[i]|ms[i-1]).sum()) for i in range(1,n)]
events=[0]
for i in range(1,n):
    if ch[i]>0.35 and i-events[-1]>=3: events.append(i)
print(len(events))
for e in events: print(f"{e/25:.2f}", int(cnt[e]))
# sheet: frame 2 after each event (to show settled text)
font=ImageFont.truetype(f"{S}/fonts/Poppins-SemiBold.ttf",22)
cw,chh=360,140
idx=[min(n-1,e+3) for e in events]
cols=4
for part in range(0,len(idx),32):
    sub=idx[part:part+32]
    rows=(len(sub)+cols-1)//cols
    sh=Image.new("RGB",(cols*cw,rows*chh),"black")
    d=ImageDraw.Draw(sh)
    for k,i in enumerate(sub):
        im=Image.fromarray(fs[i]).resize((cw,chh))
        x,y=(k%cols)*cw,(k//cols)*chh
        sh.paste(im,(x,y)); d.rectangle([x,y,x+90,y+28],fill="red"); d.text((x+4,y),f"{events[part+k]/25:.2f}",font=font,fill="white")
    sh.save(f"{S}/work/subsheet_{part//32}.png")

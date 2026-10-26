import numpy as np, cv2, sys
S=sys.argv[1]
fr=np.load(f"{S}/work/frames.npy",mmap_mode='r')
N=fr.shape[0]; y0,y1=560,980
sm=np.lib.format.open_memmap(f"{S}/work/submask.npy",mode="w+",dtype=np.uint8,shape=(N,y1-y0,720))
k=cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(11,11))
tot=0
for i in range(N):
    f=np.asarray(fr[i,y0:y1]).astype(np.int16)
    R,G,B=f[...,0],f[...,1],f[...,2]
    mx=f.max(2); mn=f.min(2)
    lum=0.3*R+0.59*G+0.11*B
    white=((mn>222)&((mx-mn)<35)).astype(np.uint8)
    box=((B>120)&(B-R>60)&(B-G>40)).astype(np.uint8)
    outline=((lum<105)&(B>R+12)).astype(np.uint8)
    white=white&cv2.dilate(outline|box,k)
    outline=outline&cv2.dilate(white|box,k)
    m=white|box|outline
    m=cv2.morphologyEx(m,cv2.MORPH_OPEN,np.ones((2,2),np.uint8))
    m=cv2.dilate(m,np.ones((3,3),np.uint8))
    m=cv2.GaussianBlur(m.astype(np.float32)*255,(3,3),0)
    sm[i]=np.clip(m,0,255).astype(np.uint8); tot+=int((m>128).sum())
sm.flush(); print("ok",tot/N)

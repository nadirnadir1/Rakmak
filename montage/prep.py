import numpy as np, subprocess, json, sys, cv2
S=sys.argv[1]; W,H,N=720,1280,1088
# 1) raw frames memmap
fr=np.lib.format.open_memmap(f"{S}/work/frames.npy",mode="w+",dtype=np.uint8,shape=(N,H,W,3))
p=subprocess.Popen(["ffmpeg","-v","error","-i",f"{S}/input.mp4","-f","rawvideo","-pix_fmt","rgb24","-"],stdout=subprocess.PIPE)
for i in range(N):
    b=p.stdout.read(W*H*3); fr[i]=np.frombuffer(b,np.uint8).reshape(H,W,3)
fr.flush()
# 2) subtitle masks (only band rows 560..980)
y0,y1=560,980
sm=np.lib.format.open_memmap(f"{S}/work/submask.npy",mode="w+",dtype=np.uint8,shape=(N,y1-y0,W))
k5=cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(9,9))
for i in range(N):
    f=fr[i,y0:y1].astype(np.int16)
    R,G,B=f[...,0],f[...,1],f[...,2]
    mx=f.max(2); mn=f.min(2)
    white=(mn>205)&((mx-mn)<40)
    blue=(B>120)&(B-R>60)&(B-G>40)
    core=(white|blue).astype(np.uint8)
    near=cv2.dilate(core,k5)
    lum=(0.3*R+0.59*G+0.11*B)
    dark=((lum<120)&(B>=R-5)).astype(np.uint8)
    m=np.maximum(core,near&dark)
    m=cv2.dilate(m,np.ones((3,3),np.uint8))
    m=cv2.GaussianBlur(m.astype(np.float32)*255,(3,3),0)
    sm[i]=np.clip(m,0,255).astype(np.uint8)
sm.flush()
# 3) hands smoothing
d=json.load(open(f"{S}/work/track.json"))
from scipy.ndimage import gaussian_filter1d
out={}
for lab in ["Left","Right"]:
    palm=np.full((N,2),np.nan); tip=np.full((N,2),np.nan); wrist=np.full((N,2),np.nan)
    for i,hs in enumerate(d["hands"]):
        for h in hs:
            if h["side"]!=lab: continue
            pts=np.array(h["pts"])[:,:2]*[W,H]
            palm[i]=pts[[0,5,9,13,17]].mean(0); tip[i]=pts[8]; wrist[i]=pts[0]
    for arr in (palm,tip,wrist):
        valid=~np.isnan(arr[:,0])
        idx=np.arange(N)
        # fill short gaps
        vi=np.where(valid)[0]
        if len(vi)==0: continue
        for c in range(2):
            full=np.interp(idx,vi,arr[vi,c])
            # gap length
            gap=np.zeros(N,bool)
            last=-100
            for j in range(N):
                if valid[j]: last=j
            # mark frames whose distance to nearest valid >3
            dist=np.full(N,999)
            prev=-999
            for j in range(N):
                if valid[j]: prev=j
                dist[j]=j-prev
            nxt=9999
            for j in range(N-1,-1,-1):
                if valid[j]: nxt=j
                dist[j]=min(dist[j],nxt-j)
            ok=dist<=4
            sm_=gaussian_filter1d(full,1.6)
            arr[:,c]=np.where(ok,sm_,np.nan)
    out[lab+"_palm"]=palm; out[lab+"_tip"]=tip; out[lab+"_wrist"]=wrist
# pose: nose & ears
pose=np.full((N,6),np.nan)
for i,pl in enumerate(d["pose"]):
    if pl: pose[i]=[pl[0][0]*W,pl[0][1]*H,pl[7][0]*W,pl[7][1]*H,pl[8][0]*W,pl[8][1]*H]
out["pose"]=pose
np.savez(f"{S}/work/hands.npz",**out)
print("ok")

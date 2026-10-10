import numpy as np, sys, os
from PIL import Image
n=np.arange(594)
sel=[i for i in n if i%12==0 or 140<=i<=152 or 286<=i<=292 or 430<=i<=436]
def load(p): return np.asarray(Image.open(p).convert('RGB'),np.float32)
def ov(i): return np.asarray(Image.open(f'ov/{i:03d}.png'),np.float32)
worst_out=0; bad=[]; rows=[]
for k,i in enumerate(sel):
    o=load(f'vo/{k+1:03d}.png'); s=load(f'vs/{k+1:03d}.png')
    O=ov(i); a=O[...,3:]/255
    outside=a[...,0]==0
    # dilate the overlay footprint a little for chroma subsampling bleed
    from scipy.ndimage import binary_dilation
    fp=binary_dilation(~outside,iterations=3)
    d=np.abs(o-s).mean(-1)
    m_out=d[~fp].mean(); p99=np.percentile(d[~fp],99.9)
    worst_out=max(worst_out,m_out)
    line=f'{i:3d} outside-overlay mean|diff|={m_out:.2f} p99.9={p99:.1f}'
    if (~outside).any():
        errs={}
        for j in (i-1,i,i+1):
            if 0<=j<594:
                Oj=ov(j); aj=Oj[...,3:]/255; e=s*(1-aj)+Oj[...,:3]*aj
                m=binary_dilation(fp|(Oj[...,3]>0),iterations=1)
                errs[j]=np.abs(o-e).mean(-1)[m].mean()
        best=min(errs,key=errs.get); line+=f'  sync: best overlay={best} ' + ' '.join(f'{j}:{v:.2f}' for j,v in errs.items())
        if best!=i and len(set(round(v,2) for v in errs.values()))>1: bad.append(i)
    rows.append(line)
print('\n'.join(rows)); print('worst outside mean diff',round(worst_out,2),' sync mismatches:',bad)

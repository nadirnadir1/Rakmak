import json, sys
logs=json.load(open(sys.argv[1]))
W,H=1440,2560; S=(115,204,1325,2356)
APPROVED={'ENGINE NACELLE','ENGINE NACELLE CHEVRONS','AIRCRAFT REGISTRATION — CN-RHR',
          'WING LOWER SURFACE','VERTICAL STABILIZER','HORIZONTAL / STABILIZER'}
errs=[]; spans={}
def ov(a,b): return not (a[2]<=b[0] or b[2]<=a[0] or a[3]<=b[1] or b[3]<=a[1])
for L in logs:
    f=L['frame']; labs=L['labels']
    if len(labs)>2: errs.append((f,'more than 2 labels'))
    if labs and L['titles']: errs.append((f,'title + label together'))
    names=[l['text'] for l in labs]
    if len(set(names))!=len(names): errs.append((f,'duplicate label'))
    boxes=[]
    for l in labs:
        if l['text'] not in APPROVED: errs.append((f,'unapproved '+l['text']))
        x,y=l['dot']; m=min(x,y,W-x,H-y)
        spans.setdefault(l['text'],[f,f,1e9]); s=spans[l['text']]; s[1]=f; s[2]=min(s[2],m)
        if m<25: errs.append((f,f'dot near edge {l["text"]} {m:.0f}'))
        b=l['box']; boxes.append(b)
        if b[0]<S[0] or b[1]<S[1] or b[2]>S[2] or b[3]>S[3]: errs.append((f,f'outside safe area {l["text"]} {b}'))
    for t in L['titles']:
        for b in t['boxes']:
            boxes.append(b)
            if b[0]<S[0] or b[1]<S[1] or b[2]>S[2] or b[3]>S[3]: errs.append((f,'title outside safe'))
    for i in range(len(boxes)):
        for j in range(i+1,len(boxes)):
            if ov(boxes[i],boxes[j]) and not (len(L['titles']) and not labs): errs.append((f,'overlap'))
print('errors:',len(errs)); [print(e) for e in errs[:30]]
for k,(a,b,m) in spans.items(): print(f'{k:38s} frames {a}-{b}  min dot-to-edge {m:.0f}px')

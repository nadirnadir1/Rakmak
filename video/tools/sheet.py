import sys
from PIL import Image
out=sys.argv[1]; fs=sys.argv[2:]
ims=[Image.open(f).convert('RGB').resize((432,768)) for f in fs]
n=len(ims); W=Image.new('RGB',(442*n-10,768),'white')
for i,im in enumerate(ims): W.paste(im,(i*442,0))
W.save(out,quality=85)

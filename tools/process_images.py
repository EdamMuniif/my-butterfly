import math, os
os.makedirs("tools/.out", exist_ok=True)
import numpy as np, sys
from PIL import Image, ImageFilter
from scipy import ndimage as nd
U='reference/'; O='tools/.out/'
def hsv(a):
    a=a.astype(np.float32)/255; r,g,b=a[...,0],a[...,1],a[...,2]
    mx=a.max(-1); mn=a.min(-1); d=mx-mn+1e-6
    h=np.where(mx==r,((g-b)/d)%6,np.where(mx==g,(b-r)/d+2,(r-g)/d+4))*60
    s=np.where(mx>0,(mx-mn)/(mx+1e-6),0); return h,s,mx
def rgb(h,s,v):
    h=(h%360)/60; i=np.floor(h).astype(int)%6; f=h-np.floor(h)
    p=v*(1-s); q=v*(1-s*f); t=v*(1-s*(1-f))
    r=np.choose(i,[v,q,p,p,t,v]); g=np.choose(i,[t,v,v,q,p,p]); b=np.choose(i,[p,p,t,v,v,q])
    return (np.clip(np.stack([r,g,b],-1),0,1)*255).astype(np.uint8)
def flood_bg(cand,minpocket=0):
    lab,n=nd.label(cand); border=set(np.unique(np.concatenate([lab[0],lab[-1],lab[:,0],lab[:,-1]])))-{0}
    if minpocket:
        sizes=nd.sum(np.ones_like(lab),lab,range(1,n+1))
        border|={i+1 for i,z in enumerate(sizes) if z>minpocket}
    return np.isin(lab,list(border))
def alpha_from(bg,feather=1.2):
    a=(~bg).astype(np.float32)
    a=nd.binary_opening(a>0.5,iterations=1).astype(np.float32)
    a=nd.gaussian_filter(a,feather); return (np.clip((a-0.15)/0.7,0,1)*255).astype(np.uint8)
def save(rgbarr,al,name,trim=True):
    im=Image.fromarray(np.dstack([rgbarr,al]),'RGBA')
    if trim: im=im.crop(im.getbbox())
    im.save(O+name+'.png'); return im

# 1 open rose (pink on black) -> blue with lavender undertone
a=np.array(Image.open(U+'rose-open-pink.jpg').convert('RGB'))
h,s,v=hsv(a); bg=flood_bg(a.max(-1)<28)
nh=212+48*np.clip(1-v,0,1)**2.2; ns=np.clip(s*1.12,0,1); nv=np.clip(v*1.02,0,1)
save(rgb(nh,ns,nv),alpha_from(bg,1.0),'rose_open')

# 2 stem rose (red, beige bg) -> blue head, green leaves kept
a=np.array(Image.open(U+'rose-stem-red.jpg').convert('RGB'))
h,s,v=hsv(a); bg=flood_bg((s<0.3)&(v>0.22)&~((h>60)&(h<170)&(s>0.3)),400)
red=((h<22)|(h>320))&(s>0.35)
nh=np.where(red,216+30*np.clip(1-v,0,1)**2,h); nv=np.where(red,np.clip(v*1.18+0.04,0,1),v*0.92); ns=np.where(red,np.clip(s*0.92,0,1),s*0.85)
save(rgb(nh,ns,nv),alpha_from(bg,1.0),'rose_stem')

# butterflies
def bfly(fn,name,target,crop=None):
    im=Image.open(U+fn).convert('RGB')
    if crop: im=im.crop(crop)
    a=np.array(im); h,s,v=hsv(a); bg=flood_bg((s<0.2)&(v>0.4))
    if target is not None:
        orange=((h<62)|(h>345))&(s>0.22)
        nh=np.where(orange,target+(h-30)*0.35,h); nv=np.where(orange,np.clip(v*0.95,0,1),v)
        a=rgb(nh,s,nv)
    return save(a,alpha_from(bg,0.8),name)
bfly('butterfly-blue.jpg','bf_a',None)
bfly('butterfly-monarch.jpg','bf_b',204)
bfly('butterfly-trio.jpg','bf_trio',224)
from PIL import Image, ImageFilter
O='tools/.out/'; P='public/images/'
def sprite(src,crop,head,tail,name,w=420):
    im=Image.open(O+src+'.png')
    if crop: im=im.crop(crop); head=(head[0]-crop[0],head[1]-crop[1]); tail=(tail[0]-crop[0],tail[1]-crop[1])
    from scipy import ndimage as nd
    a=np.array(im); m=a[...,3]>20; lab,n=nd.label(nd.binary_dilation(m,iterations=3))
    if n>1:
        sz=nd.sum(m,lab,range(1,n+1)); keep=lab==(int(np.argmax(sz))+1); a[...,3]=np.where(keep,a[...,3],0); im=Image.fromarray(a)
    pad=max(im.size); big=Image.new('RGBA',(im.width+2*pad,im.height+2*pad)); big.paste(im,(pad,pad))
    hx,hy=head[0]+pad,head[1]+pad; tx,ty=tail[0]+pad,tail[1]+pad
    cx,cy=hx+(tx-hx)*0.3,hy+(ty-hy)*0.3
    best=None
    for sgn in (1,-1):
        ang=sgn*math.degrees(math.atan2(hx-tx,-(hy-ty)))
        r=big.rotate(ang,resample=Image.BICUBIC,center=(cx,cy))
        a=math.radians(-ang)  # PIL ccw; screen coords y down
        def rot(x,y):
            dx,dy=x-cx,y-cy; return (cx+dx*math.cos(a)-dy*math.sin(a), cy+dx*math.sin(a)+dy*math.cos(a))
        H,T=rot(hx,hy),rot(tx,ty)
        err=abs(H[0]-T[0])+(0 if H[1]<T[1] else 999)
        if best is None or err<best[0]: best=(err,r,H)
    err,r,H=best; print(name,'err',round(err,1))
    bb=r.getbbox(); half=max(cx-bb[0],bb[2]-cx)
    box=(int(cx-half),bb[1],int(cx+half),bb[3]); out=r.crop(box)
    out=out.resize((w,int(out.height*w/out.width)),Image.LANCZOS)
    out.save(P+name+'.webp',quality=84,method=6); print(name,out.size,'bodyY%',round((cy-bb[1])/(bb[3]-bb[1])*100,1))
sprite('bf_a',None,(288,312),(385,450),'bf-azure')
sprite('bf_b',None,(348,378),(222,552),'bf-sky')
sprite('bf_trio',(0,330,410,716),(183,532),(125,640),'bf-royal')
sprite('bf_trio',(330,195,701,535),(535,405),(595,495),'bf-indigo')
# roses
ro=Image.open(O+'rose_open.png'); ro.save(P+'rose-open.webp',quality=86,method=6)
st=Image.open(O+'rose_stem.png'); st.save(P+'rose-stem.webp',quality=86,method=6)
sm=st.resize((st.width//2,st.height//2),Image.LANCZOS).filter(ImageFilter.GaussianBlur(5)); sm.save(P+'rose-stem-blur.webp',quality=80)
sm2=ro.resize((ro.width//2,ro.height//2),Image.LANCZOS).filter(ImageFilter.GaussianBlur(4)); sm2.save(P+'rose-open-blur.webp',quality=80)
# petal sprite cropped from open rose outer petal
print('open',ro.size,'stem',st.size)

import numpy as np, subprocess, json, sys, time
import onnxruntime as ort
import mediapipe as mp
from mediapipe.tasks import python as mpt
from mediapipe.tasks.python import vision
S=sys.argv[1]
W,H,N=720,1280,1088
cmd=["ffmpeg","-v","error","-i",f"{S}/input.mp4","-f","rawvideo","-pix_fmt","rgb24","-"]
p=subprocess.Popen(cmd,stdout=subprocess.PIPE)
so=ort.SessionOptions(); so.intra_op_num_threads=4
sess=ort.InferenceSession(f"{S}/models/rvm_mobilenetv3_fp32.onnx",so,providers=["CPUExecutionProvider"])
rec=[np.zeros([1,1,1,1],np.float32)]*4
dr=np.array([0.4],np.float32)
alpha=np.lib.format.open_memmap(f"{S}/work/alpha.npy",mode="w+",dtype=np.uint8,shape=(N,H,W))
hand=vision.HandLandmarker.create_from_options(vision.HandLandmarkerOptions(
    base_options=mpt.BaseOptions(model_asset_path=f"{S}/models/hand_landmarker.task"),
    running_mode=vision.RunningMode.VIDEO,num_hands=2,min_hand_detection_confidence=0.4,min_tracking_confidence=0.4))
pose=vision.PoseLandmarker.create_from_options(vision.PoseLandmarkerOptions(
    base_options=mpt.BaseOptions(model_asset_path=f"{S}/models/pose_landmarker.task"),
    running_mode=vision.RunningMode.VIDEO))
hands_out=[];pose_out=[]
i=0;t0=time.time()
while True:
    buf=p.stdout.read(W*H*3)
    if len(buf)<W*H*3: break
    fr=np.frombuffer(buf,np.uint8).reshape(H,W,3)
    src=(fr.astype(np.float32)/255.).transpose(2,0,1)[None]
    fgr,pha,*rec=sess.run(None,{"src":src,"r1i":rec[0],"r2i":rec[1],"r3i":rec[2],"r4i":rec[3],"downsample_ratio":dr})
    alpha[i]=(np.clip(pha[0,0],0,1)*255+0.5).astype(np.uint8)
    img=mp.Image(image_format=mp.ImageFormat.SRGB,data=np.ascontiguousarray(fr))
    ts=int(i*40)
    hr=hand.detect_for_video(img,ts)
    hs=[]
    for lm,hd in zip(hr.hand_landmarks,hr.handedness):
        hs.append({"side":hd[0].category_name,"score":hd[0].score,"pts":[[l.x,l.y,l.z] for l in lm]})
    hands_out.append(hs)
    pr=pose.detect_for_video(img,ts)
    pose_out.append([[l.x,l.y,l.z,l.visibility] for l in pr.pose_landmarks[0]] if pr.pose_landmarks else None)
    i+=1
    if i%50==0: print(i,round(time.time()-t0,1),flush=True)
alpha.flush()
json.dump({"n":i,"hands":hands_out,"pose":pose_out},open(f"{S}/work/track.json","w"))
print("done",i,time.time()-t0)

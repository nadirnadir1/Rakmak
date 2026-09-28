#!/usr/bin/env bash
# Build voice track, mix with music/sfx (ducked), loudness-normalize to -14 LUFS, mux with picture.
set -euo pipefail
T=$(python3 -c "from timeline import *;print(f'{TOTAL:.4f}')")
VC="highpass=f=75,equalizer=f=220:t=q:w=1:g=-2,equalizer=f=3500:t=q:w=1.2:g=2.5,equalizer=f=9000:t=q:w=1:g=1.5,acompressor=threshold=-22dB:ratio=3:attack=5:release=90:makeup=3"

ffmpeg -v error -y -i src.mp4 -filter_complex "\
[0:a]atrim=9.72:13.75,asetpts=PTS-STARTPTS,afade=t=in:d=0.02,afade=t=out:st=3.99:d=0.04[h];\
[0:a]atrim=0:45.55,asetpts=PTS-STARTPTS,afade=t=out:st=45.45:d=0.1[m];\
[h][m]concat=n=2:v=0:a=1,atempo=1.1,$VC,aresample=48000,apad,atrim=0:$T[v]" -map "[v]" -ac 2 voice.wav

ffmpeg -v error -y -i voice.wav -i music.wav -i sfx.wav -filter_complex "\
[0:a]asplit=2[v1][key];\
[1:a]volume='0.6*if(lt(t,3.66),4,if(gt(t,45.07),1.8,1))':eval=frame[mu];\
[mu][key]sidechaincompress=threshold=0.03:ratio=4:attack=15:release=400:makeup=1[mud];\
[2:a]volume=0.5[sf];[v1][mud][sf]amix=inputs=3:normalize=0,atrim=0:$T[o]" -map "[o]" mix_full.wav

ffmpeg -v error -y -i voice.wav -i sfx.wav -filter_complex \
  "[1:a]volume=0.5[sf];[0:a][sf]amix=inputs=2:normalize=0[o]" -map "[o]" mix_nomusic.wav

for f in mix_full mix_nomusic; do
  read -r I TP LRA TH OFF < <(ffmpeg -hide_banner -i $f.wav -af loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json -f null - 2>&1 \
    | sed -n '/{/,/}/p' | python3 -c "import json,sys;d=json.load(sys.stdin);print(d['input_i'],d['input_tp'],d['input_lra'],d['input_thresh'],d['target_offset'])")
  ffmpeg -v error -y -i $f.wav -af "loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=$I:measured_TP=$TP:measured_LRA=$LRA:measured_thresh=$TH:offset=$OFF:linear=true" -ar 48000 ${f}_ln.wav
done

ffmpeg -v error -y -i video_only.mp4 -i mix_full_ln.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 256k -shortest -movflags +faststart EFH_CabinCrew_Premium_FINAL.mp4
ffmpeg -v error -y -i video_only.mp4 -i mix_nomusic_ln.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 256k -shortest -movflags +faststart EFH_CabinCrew_Premium_NoMusic.mp4

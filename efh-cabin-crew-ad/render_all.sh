#!/bin/bash
# render 48s @60fps in 4 parallel chunks, then concat
FPS=60; N=2880; K=4; STEP=$(( (N + K - 1) / K ))
for i in $(seq 0 $((K-1))); do
  a=$((i*STEP)); b=$(( (i+1)*STEP )); [ $b -gt $N ] && b=$N
  node renderseg.js $a $b $FPS ../segs/seg_$i.mkv png &
done
wait
for i in $(seq 0 $((K-1))); do echo "file 'seg_$i.mkv'"; done > ../segs/list.txt
ffmpeg -loglevel error -y -f concat -safe 0 -i ../segs/list.txt -c copy ../segs/video_noaudio.mkv && echo CONCAT_OK

import React from 'react';
import { Composition } from 'remotion';
import { DURATION, FPS, HEIGHT, WIDTH } from './theme';
import { EFHPromo } from './Video';

export const RemotionRoot: React.FC = () => (
  <Composition id="EFHPromo" component={EFHPromo} durationInFrames={DURATION} fps={FPS} width={WIDTH} height={HEIGHT} />
);

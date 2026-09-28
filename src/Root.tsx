import React from 'react';
import {Composition} from 'remotion';
import {EnhancedReel, timeline} from './EnhancedReel';
import {FPS, H, W} from './theme';

export const Root: React.FC = () => (
  <>
    <Composition id="EFH-HookA" component={EnhancedReel} defaultProps={{hookId: 'A' as const}} durationInFrames={timeline('A').total} fps={FPS} width={W} height={H} />
    <Composition id="EFH-HookB" component={EnhancedReel} defaultProps={{hookId: 'B' as const}} durationInFrames={timeline('B').total} fps={FPS} width={W} height={H} />
  </>
);

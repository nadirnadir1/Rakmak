import React from 'react';
import {Composition} from 'remotion';
import {EnhancedReel, timeline} from './EnhancedReel';
import {FPS, H, W} from './theme';
import {PREVIEW_FRAMES, Preview} from './Preview';
import {HOOK_PREVIEW_FRAMES, HookFlyPast, HookLivery, HookPortrait} from './HookPreviews';

export const Root: React.FC = () => (
  <>
    <Composition id="EFH-HookA" component={EnhancedReel} defaultProps={{hookId: 'A' as const}} durationInFrames={timeline('A').total} fps={FPS} width={W} height={H} />
    <Composition id="EFH-HookB" component={EnhancedReel} defaultProps={{hookId: 'B' as const}} durationInFrames={timeline('B').total} fps={FPS} width={W} height={H} />
    <Composition id="EFH-Preview" component={Preview} durationInFrames={PREVIEW_FRAMES} fps={FPS} width={W} height={H} />
    <Composition id="Hook1-FlyPast" component={HookFlyPast} durationInFrames={HOOK_PREVIEW_FRAMES} fps={FPS} width={W} height={H} />
    <Composition id="Hook2-Livery" component={HookLivery} durationInFrames={HOOK_PREVIEW_FRAMES} fps={FPS} width={W} height={H} />
    <Composition id="Hook3-Portrait" component={HookPortrait} durationInFrames={HOOK_PREVIEW_FRAMES} fps={FPS} width={W} height={H} />
  </>
);

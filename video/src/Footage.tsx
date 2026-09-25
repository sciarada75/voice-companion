import React from 'react';
import {
  AbsoluteFill,
  Easing,
  OffthreadVideo,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
} from 'remotion';
import {FPS, HEIGHT, WIDTH, theme} from './theme';

export type Align = 'center' | 'left' | 'right' | 'bottom' | 'top';

/**
 * Footage under type.
 *
 * THE BUG THIS FILE EXISTS NOT TO REPEAT: a video that is not inside a
 * <Sequence> is seeked to the COMPOSITION frame, not to its own. A clip placed
 * under a block starting at frame 700 was therefore asked for second 23 of a
 * nine second file, and rendered its last frame - a still photograph. Every
 * clip here is wrapped in a Sequence so its time starts when its block does,
 * A clip shorter than its block does NOT loop and does NOT freeze: it fades out
 * when its footage runs out, and the block finishes on the ground colour. A
 * repeat is more noticeable than an absence.
 * Never render OffthreadVideo bare.
 *
 * Vertical clips are NOT cropped to fill a landscape frame. Cover-cropping a
 * 9:16 source leaves the middle band, which cuts faces in half. They run as a
 * portrait panel at their own shape, with the words beside them.
 */

const GRADE = 'saturate(0.72) contrast(1.06) brightness(0.74)';
const EASE = Easing.bezier(0.4, 0, 0.2, 1);

type Common = {
  src: string;
  from: number;
  to: number;
  startAt?: number;
  clipSeconds: number; // the source's real length, so Loop knows its period
};

const Fade: React.FC<{span: number; usable: number; children: React.ReactNode}> = ({
  span,
  usable,
  children,
}) => {
  const frame = useCurrentFrame();
  // whichever ends first - the block or the footage - is where this fades out
  const out = Math.min(span, usable);
  const o = interpolate(frame, [0, 10, Math.max(11, out - 14), out], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: EASE,
  });
  return <AbsoluteFill style={{opacity: o}}>{children}</AbsoluteFill>;
};

export const Footage: React.FC<
  Common & {
    align?: Align;
    strength?: number;
    zoom?: number;
    shiftX?: number;
    shiftY?: number;
  }
> = ({
  src,
  from,
  to,
  startAt = 0,
  clipSeconds,
  align = 'bottom',
  strength = 1,
  zoom = 1,
  shiftX = 0,
  shiftY = 0,
}) => {
  const span = to - from;
  const g = 'rgba(23,21,15,';
  const scrim: Record<Align, string> = {
    center: `radial-gradient(ellipse at center, ${g}${0.5 * strength}) 0%, ${g}${0.82 * strength}) 78%)`,
    left: `linear-gradient(90deg, ${g}${0.94 * strength}) 0%, ${g}${0.74 * strength}) 48%, ${g}${0.2 * strength}) 100%)`,
    right: `linear-gradient(270deg, ${g}${0.94 * strength}) 0%, ${g}${0.74 * strength}) 48%, ${g}${0.2 * strength}) 100%)`,
    bottom: `linear-gradient(0deg, ${g}${0.97 * strength}) 0%, ${g}${0.94 * strength}) 24%, ${g}${0.6 * strength}) 44%, ${g}${0.18 * strength}) 100%)`,
    top: `linear-gradient(180deg, ${g}${0.97 * strength}) 0%, ${g}${0.94 * strength}) 24%, ${g}${0.6 * strength}) 44%, ${g}${0.18 * strength}) 100%)`,
  };

  const usable = Math.max(1, Math.round((clipSeconds - startAt) * FPS));

  return (
    <Sequence from={from} durationInFrames={span + 12} layout="none">
      <Fade span={span} usable={usable}>
        <AbsoluteFill style={{backgroundColor: theme.ground}}>
          <OffthreadVideo
              src={staticFile(`footage/${src}.mp4`)}
              startFrom={Math.round(startAt * FPS)}
              muted
              style={{
                width: WIDTH,
                height: HEIGHT,
                objectFit: 'cover',
                transform: `scale(${zoom}) translate(${shiftX}%, ${shiftY}%)`,
              filter: GRADE,
            }}
          />
          <AbsoluteFill style={{backgroundColor: theme.ground, opacity: 0.3}} />
          <AbsoluteFill style={{background: scrim[align]}} />
          <AbsoluteFill
            style={{
              background:
                'radial-gradient(ellipse at center, rgba(0,0,0,0) 52%, rgba(0,0,0,0.5) 100%)',
            }}
          />
        </AbsoluteFill>
      </Fade>
    </Sequence>
  );
};

/**
 * A vertical clip kept at its own shape, as a tall panel, with the other half of
 * the frame left dark for the words. Nothing is cropped, so no face is cut.
 */
export const FootagePanel: React.FC<Common & {side?: 'left' | 'right'; width?: number}> = ({
  src,
  from,
  to,
  startAt = 0,
  clipSeconds,
  side = 'right',
  width = 720,
}) => {
  const span = to - from;
  const usable = Math.max(1, Math.round((clipSeconds - startAt) * FPS));
  const edge = side === 'right' ? 90 : 270;

  return (
    <Sequence from={from} durationInFrames={span + 12} layout="none">
      <Fade span={span} usable={usable}>
        <AbsoluteFill style={{backgroundColor: theme.ground}}>
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: side === 'left' ? 0 : undefined,
              right: side === 'right' ? 0 : undefined,
              width,
              height: HEIGHT,
              overflow: 'hidden',
            }}
          >
            <OffthreadVideo
              src={staticFile(`footage/${src}.mp4`)}
              startFrom={Math.round(startAt * FPS)}
              muted
              style={{width, height: HEIGHT, objectFit: 'cover', filter: GRADE}}
            />
            <AbsoluteFill style={{backgroundColor: theme.ground, opacity: 0.26}} />
            {/* the panel dissolves into the ground rather than ending on an edge */}
            <AbsoluteFill
              style={{
                background: `linear-gradient(${edge}deg, ${theme.ground} 0%, rgba(23,21,15,0.7) 18%, rgba(23,21,15,0) 52%)`,
              }}
            />
            <AbsoluteFill
              style={{
                background:
                  'linear-gradient(180deg, rgba(23,21,15,0.5) 0%, rgba(23,21,15,0) 20%, rgba(23,21,15,0) 76%, rgba(23,21,15,0.66) 100%)',
              }}
            />
          </div>
        </AbsoluteFill>
      </Fade>
    </Sequence>
  );
};

export const alignStyle = (align: Align): React.CSSProperties => {
  switch (align) {
    case 'left':
      return {justifyContent: 'center', alignItems: 'flex-start', textAlign: 'left'};
    case 'right':
      return {justifyContent: 'center', alignItems: 'flex-end', textAlign: 'right'};
    case 'bottom':
      return {
        justifyContent: 'flex-end',
        alignItems: 'center',
        textAlign: 'center',
        paddingBottom: 120,
      };
    case 'top':
      return {justifyContent: 'flex-start', alignItems: 'center', textAlign: 'center', paddingTop: 120};
    default:
      return {justifyContent: 'center', alignItems: 'center', textAlign: 'center'};
  }
};

/**
 * A still from the product itself - a screen that cannot be filmed, because the
 * voice list is a native menu the browser will not render into a screenshot.
 * Treated like the report: paper on the dark ground, not a full-bleed image.
 */
export const Still: React.FC<{
  src: string;
  from: number;
  to: number;
  align?: Align;
  width?: number;
}> = ({src, from, to, align = 'bottom', width = 1580}) => {
  const span = to - from;
  return (
    <Sequence from={from} durationInFrames={span + 12} layout="none">
      <Fade span={span} usable={span}>
        <AbsoluteFill style={{backgroundColor: theme.ground, alignItems: 'center'}}>
          <img
            src={staticFile(`stills/${src}.png`)}
            style={{
              width,
              marginTop: -30,
              objectFit: 'contain',
              boxShadow: '0 0 90px rgba(0,0,0,0.6)',
            }}
          />
          <AbsoluteFill
            style={{
              background: `linear-gradient(0deg, rgba(23,21,15,0.97) 0%, rgba(23,21,15,0.94) 26%,
                rgba(23,21,15,0.55) 46%, rgba(23,21,15,0.1) 100%)`,
            }}
          />
        </AbsoluteFill>
      </Fade>
    </Sequence>
  );
};

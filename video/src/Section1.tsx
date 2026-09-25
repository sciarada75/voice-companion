import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Easing,
  Img,
  OffthreadVideo,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
} from 'remotion';
import {SpokenCard} from './Cards';
import {FALL, FPS, HEIGHT, HOLD, MIN_GAP, WIDTH, sec, theme} from './theme';
import narration from './narration.json';
import lines from './lines.json';

/**
 * Section 1 - "The video everyone has already seen".
 *
 * THE ONE EDIT THE WHOLE FILM RESTS ON is in here: a room with somebody in it,
 * then the same room empty. Everything after this section is argument; this is
 * the only part that has to be felt.
 *
 * WHOSE PICTURES THESE ARE. The occupied half is somebody else's advertisement,
 * quoted. Claudia decided that on 24/09, against the earlier production note,
 * and the reasoning is worth keeping: the film already owns twenty-one clips of
 * old people with phones and tablets, and not one of them reads as "the video
 * everyone has seen" - it reads as clip twenty-two. The quotation only works if
 * it looks quoted. So it is never full-frame: it runs inside a screen, on the
 * dark ground, desaturated, softened and scanlined, with a faint room hum under
 * it. Recognisable, plainly not ours, plainly not the point.
 *
 * The empty room is Claudia's, and it is the same room - the ad's own set with
 * the woman taken out of it, her glasses still on the table. It gets no
 * treatment at all: full frame, flat, cold, silent. That contrast IS the cut.
 *
 * The hum stops in the same frame as the picture, on "And then it ends".
 * Silence is doing as much work there as the image.
 */

const say = lines as Record<string, string>;
const EASE = Easing.bezier(0.4, 0, 0.2, 1);

const A = sec(narration.s1a);
const B = sec(narration.s1b);
const C = sec(narration.s1c);

const LEAD = sec(0.3);

const m = {
  aIn: LEAD,
  aOut: LEAD + A,
};
// A hard cut, so the beat before "And then it ends" is short. It is the shortest
// silence in the film on purpose.
const bIn = m.aOut + sec(0.45);
const bOut = bIn + B;
const cIn = bOut + MIN_GAP;
const cOut = cIn + C;
// THE SECTION ENDS ON THE EMPTY ROOM, 25/09. Claudia: "then it's tuesday
// afternoon, and she is back alone. hold it for a sec on the empty room, skip
// the rest, and move to italy's data." So s1d - "the demo was never the problem,
// it is a conversation that happened once" - is gone, and with it the
// advertisement's own slate. The empty room makes that argument without saying
// it, and the figures in section 2 are what it cuts to.
export const SECTION1_DURATION = cOut + HOLD + FALL + sec(0.08);

// Her script opens on black with the words, and only then shows the thing it is
// describing. The screen therefore arrives on the SECOND sentence, not the first.
const screenIn = m.aIn + Math.round(1.73 * FPS) - 10;
// Three pieces of the ad, ending on its own title card - so the last thing on
// screen before the cut is their logo, and then there is nothing.
const AD = [
  {from: screenIn, to: screenIn + sec(1.3), at: 0.0}, // she laughs, holding the phone
  {from: screenIn + sec(1.3), to: screenIn + sec(4.1), at: 10.6}, // at the table
  {from: screenIn + sec(4.1), to: m.aOut, at: 6.2}, // THE ALL-NEW CHATGPT VOICE
];

/**
 * Somebody else's film, inside a screen, inside our frame. Never full-bleed:
 * full-bleed would be us claiming it.
 */
const AdScreen: React.FC<{src: string; from: number; to: number; at: number}> = ({
  src,
  from,
  to,
  at,
}) => {
  const frame = useCurrentFrame();
  if (frame < from - 14 || frame >= to) return null;
  // Fades UP, never down: every one of these ends on a hard cut.
  const o = interpolate(frame, [from - 14, from - 2], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: EASE,
  });
  // sized so the caption below it lands on ground, never on the picture
  const W = 1180;
  const H = Math.round((W * 9) / 16);
  return (
    <AbsoluteFill style={{opacity: o, alignItems: 'center', justifyContent: 'flex-start', paddingTop: 36}}>
      <div style={{width: W, height: H, position: 'relative', boxShadow: '0 0 120px rgba(0,0,0,0.8)'}}>
        <Sequence from={from} durationInFrames={to - from + 2} layout="none">
          <OffthreadVideo
            src={staticFile(`footage/${src}.mp4`)}
            startFrom={Math.round(at * FPS)}
            muted
            style={{
              width: W,
              height: H,
              objectFit: 'cover',
              filter: 'saturate(0.5) contrast(0.94) brightness(0.74) blur(0.6px)',
            }}
          />
        </Sequence>
        {/* scanlines */}
        <AbsoluteFill
          style={{
            background:
              'repeating-linear-gradient(0deg, rgba(0,0,0,0.30) 0px, rgba(0,0,0,0.30) 1px, rgba(0,0,0,0) 1px, rgba(0,0,0,0) 3px)',
          }}
        />
        {/* the glass it is behind */}
        <AbsoluteFill
          style={{
            background:
              'radial-gradient(ellipse at center, rgba(0,0,0,0) 46%, rgba(23,21,15,0.66) 100%)',
          }}
        />
        <AbsoluteFill style={{boxShadow: 'inset 0 0 3px rgba(240,236,229,0.10)'}} />
      </div>
    </AbsoluteFill>
  );
};

/** Claudia's room. No treatment beyond the afternoon going flat. */
const EmptyRoom: React.FC<{from: number; to: number}> = ({from, to}) => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [from, from + 20, to - 12, to], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: EASE,
  });
  if (o <= 0) return null;
  return (
    <AbsoluteFill style={{opacity: o}}>
      <Img
        src={staticFile('stills/empty-room.png')}
        style={{
          width: WIDTH,
          height: HEIGHT,
          objectFit: 'cover',
          // the same light, later and colder: the warmth is what has gone
          filter: 'saturate(0.46) contrast(0.96) brightness(0.62)',
        }}
      />
      <AbsoluteFill style={{backgroundColor: '#243040', opacity: 0.16}} />
      <AbsoluteFill
        style={{
          background:
            'linear-gradient(0deg, rgba(23,21,15,0.92) 0%, rgba(23,21,15,0.55) 26%, rgba(23,21,15,0.05) 58%)',
        }}
      />
    </AbsoluteFill>
  );
};

export const Section1: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{backgroundColor: theme.ground}}>
      {AD.map((a) => (
        <AdScreen key={a.from} src="ad-grandma" {...a} />
      ))}

      {/* It stays up through the hold and out over the cut: the last thing in
          the section is the room, with nobody in it. */}
      <EmptyRoom from={bOut - 12} to={SECTION1_DURATION} />

      {/* hold={0}: this is the film's shortest silence on purpose, so the
          opening line must be GONE before "And then it ends" arrives. */}
      <SpokenCard from={m.aIn} to={m.aOut} text={say.s1a} align="bottom" over hold={0} fall={3} />
      <SpokenCard from={bIn} to={bOut} text={say.s1b} />
      <SpokenCard from={cIn} to={cOut} text={say.s1c} align="bottom" over />

      {/* The hum belongs to the screen and dies with it, in the same frame. The
          last three frames are a fade only so it does not click. */}
      <Sequence from={screenIn - 10} durationInFrames={m.aOut - screenIn + 10}>
        <Audio
          src={staticFile('audio/room-hum.wav')}
          volume={(f) =>
            interpolate(f, [0, 20, m.aOut - screenIn + 7, m.aOut - screenIn + 10], [0, 1, 1, 0], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            })
          }
        />
      </Sequence>

      {(['s1a', 's1b', 's1c'] as const).map((k, i) => (
        <Sequence key={k} from={[m.aIn, bIn, cIn][i]}>
          <Audio src={staticFile(`audio/${k}.wav`)} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

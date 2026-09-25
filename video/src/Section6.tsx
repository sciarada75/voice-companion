import React, {useMemo, useState} from 'react';
import {AbsoluteFill, Audio, Easing, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {Marks, ReportPage} from './ReportPage';
import {FALL, HEIGHT, HOLD, PAGE_SCALE, WIDTH, sec, theme} from './theme';
import narration from './narration.json';
import lines from './lines.json';

/**
 * Section 6 - "The people who love her".
 *
 * Every timing below is derived from the measured length of the narration
 * audio, never typed by hand. Change a sentence in the script, regenerate the
 * voice, and the whole section retimes itself.
 */
const A = sec(narration.s6a);
const B = sec(narration.s6b);
const C = sec(narration.s6c);

const LEAD = sec(0.3);
// Jamie reads at about 190 words a minute whatever -r says, which is brisk for a
// pitch. Rather than time-stretch her, the silences carry the pace: the film
// slows down between sentences, not inside them.
// The page stands still, with its caption up, for HOLD before the camera is
// allowed to move again.
const BEAT = HOLD; // stillness between spoken blocks, then MOVE
const MOVE = sec(0.72); // one camera move

export const marks = {
  aIn: LEAD,
  aOut: LEAD + A,
  move1: LEAD + A + BEAT,
  bIn: LEAD + A + BEAT + MOVE,
  bOut: LEAD + A + BEAT + MOVE + B,
  move2: LEAD + A + BEAT + MOVE + B + BEAT,
  cIn: LEAD + A + BEAT + MOVE + B + BEAT + MOVE,
  cOut: LEAD + A + BEAT + MOVE + B + BEAT + MOVE + C,
};
// Claudia named this tail specifically. It cannot lose "a couple of sec" - the
// caption's own second is in it - but everything after that second goes.
export const SECTION6_DURATION = marks.cOut + HOLD + FALL + sec(0.08);

// The captions come from lines.json, the same file the voice is read from.
// They used to be typed here as well, which meant an edit to the script changed
// what was SAID and not what was SHOWN - the viewer heard one sentence and read
// another. Never hold a second copy of a spoken line.
const say = lines as Record<string, string>;
const CAPTIONS: {from: number; to: number; text: string}[] = [
  {from: marks.aIn, to: marks.aOut, text: say.s6a},
  {from: marks.bIn, to: marks.bOut, text: say.s6b},
  {from: marks.cIn, to: marks.cOut, text: say.s6c},
];

const EASE = Easing.bezier(0.4, 0, 0.2, 1);

export const Section6: React.FC = () => {
  const frame = useCurrentFrame();
  const [m, setM] = useState<Marks | null>(null);

  // Where the page sits, in page pixels. Cut and hold: the camera is still
  // while anyone is speaking, and only moves in the silences.
  const scrollY = useMemo(() => {
    if (!m) return 0;
    const toFrameY = (pageY: number, wantFrameY: number) => pageY - wantFrameY / PAGE_SCALE;
    const top = -70;
    const atCall = toFrameY(m.call, 250);
    // The counted table is the least interesting thing on the page - minutes and
    // percentages. AT A GLANCE is the part a family actually reads, so the
    // camera spends block C there and only glances at the footer.
    const atGlance = toFrameY(m.glance, 150);
    const atWords = toFrameY(m.words, 520); // her own words, with the note above
    // the four rows that say fine: a quiet week, which is the point
    const atGreen = toFrameY(m.green, 200);
    const atFooter = toFrameY(m.footer, 500);

    // inside block C the camera walks the page: rows, then the counted table,
    // then the line that refuses to be a medical opinion
    const cGlance = marks.cIn;
    const cToWords = marks.cIn + Math.round(C * 0.26);
    const cWords = cToWords + MOVE;
    const cToGreen = marks.cIn + Math.round(C * 0.58);
    const cGreen = cToGreen + MOVE;
    const cToFooter = marks.cIn + Math.round(C * 0.88);
    const cFooter = cToFooter + MOVE;

    return interpolate(
      frame,
      [
        0, marks.move1, marks.bIn, marks.move2,
        cGlance, cToWords, cWords, cToGreen, cGreen, cToFooter, cFooter,
      ],
      [
        top, top, atCall, atCall,
        atGlance, atGlance, atWords, atWords, atGreen, atGreen, atFooter,
      ],
      {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE}
    );
  }, [frame, m]);

  // While the "Worth a call" box is spoken about, everything else on the page
  // dims. A focus pull, not a highlighter pen.
  //
  // THE ACKNOWLEDGEMENT BOX IS INSIDE THE PULL, added 25/09. Claudia: "the
  // recap for the family misses the box where a relative can actually flag who
  // acknowledged that." I reported it as missing from the product; it was not.
  // tools/report/run.mjs has always served it and always stripped it from the
  // saved copy, and the saved copy is what this section films - so the film was
  // promising a button the footage did not contain. Nothing here is a mock-up:
  // it is the markup the local report server returns, and it is boxed together
  // with "Worth a call" because s6b is one sentence about both - the advice and
  // the fact that it stays until somebody signs for it.
  const dim = interpolate(
    frame,
    [marks.bIn - MOVE / 2, marks.bIn, marks.bOut, marks.bOut + BEAT],
    [0, 0.62, 0.62, 0],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE}
  );
  const callTopInFrame = m ? (m.call - scrollY) * PAGE_SCALE : 0;
  const callBottomInFrame = m ? (m.readBottom - scrollY) * PAGE_SCALE : 0;

  const fadeIn = interpolate(frame, [0, LEAD + 6], [0, 1], {extrapolateRight: 'clamp'});
  const fadeOut = interpolate(frame, [SECTION6_DURATION - sec(0.8), SECTION6_DURATION], [1, 0], {
    extrapolateLeft: 'clamp',
  });

  return (
    <AbsoluteFill style={{backgroundColor: theme.ground}}>
      <AbsoluteFill style={{opacity: fadeIn * fadeOut}}>
        <ReportPage scrollY={scrollY} onMeasured={setM} />

        {/* focus pull onto the Worth a call box */}
        {m ? (
          <>
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                width: WIDTH,
                height: Math.max(0, callTopInFrame - 10),
                background: theme.ground,
                opacity: dim,
              }}
            />
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: callBottomInFrame + 10,
                width: WIDTH,
                height: Math.max(0, HEIGHT - callBottomInFrame - 10),
                background: theme.ground,
                opacity: dim,
              }}
            />
          </>
        ) : null}

        {/* The page bleeds off top and bottom rather than sitting in a box, and
            the bottom band goes fully to ground so captions never sit on paper. */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(${theme.ground} 0px, rgba(23,21,15,0) 160px,
              rgba(23,21,15,0) ${HEIGHT - 330}px, rgba(23,21,15,0.97) ${HEIGHT - 165}px,
              ${theme.ground} ${HEIGHT - 120}px)`,
            pointerEvents: 'none',
          }}
        />

        <PageNote from={LEAD} to={marks.aOut + BEAT} />
        <Captions frame={frame} />
      </AbsoluteFill>

      <Sequence from={marks.aIn}>
        <Audio src={staticFile('audio/s6a.wav')} />
      </Sequence>
      <Sequence from={marks.bIn}>
        <Audio src={staticFile('audio/s6b.wav')} />
      </Sequence>
      <Sequence from={marks.cIn}>
        <Audio src={staticFile('audio/s6c.wav')} />
      </Sequence>
    </AbsoluteFill>
  );
};

/**
 * The film pointing, in the same voice as the notes in section 4: monospace, in
 * the margin, never on the paper. It answers the question the page raises on
 * sight - how often does this arrive - which the narration does not.
 */
const PageNote: React.FC<{from: number; to: number}> = ({from, to}) => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [from, from + 12, to - 10, to], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: EASE,
  });
  if (o <= 0) return null;
  return (
    <div
      style={{
        position: 'absolute',
        // The page is 1000pt at PAGE_SCALE and centred, which leaves a 285px
        // gutter. The note lives inside it: a margin note that laps onto the
        // paper stops reading as a margin note.
        left: 42,
        top: 118,
        maxWidth: 196,
        opacity: o,
        borderLeft: `2px solid ${theme.fine}`,
        paddingLeft: 18,
        fontFamily: theme.mono,
        fontSize: 19,
        lineHeight: 1.6,
        color: theme.cream,
      }}
    >
      After every interaction, the family get a page.
    </div>
  );
};

const Captions: React.FC<{frame: number}> = ({frame}) => {
  const active = CAPTIONS.find((c) => frame >= c.from - 16 && frame <= c.to + HOLD + 8);
  if (!active) return null;
  const o = interpolate(
    frame,
    [active.from - 16, active.from - 5, active.to + HOLD, active.to + HOLD + 8],
    [0, 1, 1, 0],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}
  );
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 58,
        display: 'flex',
        justifyContent: 'center',
        opacity: o,
      }}
    >
      <p
        style={{
          margin: 0,
          maxWidth: 1380,
          textAlign: 'center',
          fontFamily: theme.serif,
          fontSize: 38,
          lineHeight: 1.45,
          color: theme.cream,
          textShadow: '0 2px 10px rgba(0,0,0,0.6)',
        }}
      >
        {active.text}
      </p>
    </div>
  );
};

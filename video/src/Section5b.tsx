import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Easing,
  Img,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
} from 'remotion';
import {Caption} from './Cards';
import {FALL, HEIGHT, HOLD, MIN_GAP, WIDTH, sec, theme} from './theme';
import narration from './narration.json';
import lines from './lines.json';

/**
 * Section 5b - "Set up for one person".
 *
 * PUT BACK INTO THE FILM 24/09, having been moved to the deck on 22/09 to save
 * twenty seconds. Claudia: "we totally skipped all the configuration deck,
 * where all the infos on the user, the relatives, the habits, the routine, the
 * not-to-mention can be addressed."
 *
 * She is right that it cannot be left out, and the reason is sharper than the
 * one used to drop it. Everything before this section is what the companion
 * DOES. The next question anybody asks is who it is for and who decided - and
 * this is the only place the film shows that the PERSON holds the permissions,
 * not the family and not us. Section 6 then hands a page to relatives, and that
 * page is only defensible because of what is on screen here.
 *
 * THE DATA IS FICTIONAL AND DELIBERATELY SO. The form was filled in a real
 * browser against the real setup server and photographed; nothing was saved,
 * because Save was never pressed. Addresses are example.com and the numbers are
 * in +44 7700 900xxx, which Ofcom reserves for drama and which reaches nobody.
 * The script's rule - no real contact, no real number, nothing from a
 * setup.json - is kept by construction rather than by care.
 */

const say = lines as Record<string, string>;
const EASE = Easing.bezier(0.4, 0, 0.2, 1);

const A = sec(narration.s9a);
const B = sec(narration.s9b);
const C = sec(narration.s9c);

const LEAD = sec(0.3);
// A FULL SCREEN OF TEXT NEEDS A SECOND AFTER IT, not just before the next one.
// Claudia, 25/09: "we need a small pause from one frame to the other. when the
// full screen text is read, the viewer need a sec to digest." This section is
// the densest in the film - three filled forms, read rather than watched - so
// the beat here is twice what the narrated sections use, and the card changes
// in the MIDDLE of it: the eye finishes one screen, the screen changes, and
// only then does the next sentence start.
// Raised to the film-wide floor on 25/09 - what this section learned first is
// now what every section does.
const BEAT = MIN_GAP;
const SWAP = Math.round(BEAT / 2);

const aIn = LEAD;
const aOut = aIn + A;
const bIn = aOut + BEAT;
const bOut = bIn + B;
const cIn = bOut + BEAT;
const cOut = cIn + C;
export const SECTION5B_DURATION = cOut + HOLD + FALL + sec(0.08);

/**
 * A piece of the form, on the dark ground, sized to the frame. Each one is a
 * real group out of the real page, not a crop of a screenshot of a browser -
 * so there is no chrome to hide and no bookmarks bar to worry about.
 */
const Card: React.FC<{
  src: string;
  from: number;
  to: number;
  width?: number;
}> = ({src, from, to, width = 1180}) => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [from - 12, from + 6, to - 10, to], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: EASE,
  });
  if (o <= 0) return null;
  // a slow drift, so a still image is not a dead frame
  const drift = interpolate(frame, [from, to], [0, -14], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <AbsoluteFill
      style={{
        opacity: o,
        alignItems: 'center',
        justifyContent: 'center',
        paddingBottom: 150, // the caption lives under it
      }}
    >
      <Img
        src={staticFile(`stills/${src}.png`)}
        style={{
          width,
          maxHeight: HEIGHT - 300,
          objectFit: 'contain',
          transform: `translateY(${drift}px)`,
          borderRadius: 10,
          boxShadow: '0 30px 90px rgba(0,0,0,0.6), 0 0 0 1px rgba(240,236,229,0.06)',
        }}
      />
    </AbsoluteFill>
  );
};

export const Section5b: React.FC = () => (
  <AbsoluteFill style={{backgroundColor: theme.ground}}>
    {/* "somebody sets it up for one person" - the shape of their week, typed */}
    <Card src="setup-week" from={aIn - 10} to={bIn - SWAP} width={1120} />
    {/* "her circle is hers" - the access level, which is the whole claim */}
    <Card src="setup-circle" from={bIn - SWAP} to={cIn - SWAP} width={1180} />
    {/* "a list it will never raise" */}
    <Card src="setup-like" from={cIn - SWAP} to={cOut + 12} width={1150} />

    <Caption text={say.s9a} from={aIn} to={aOut} />
    <Caption text={say.s9b} from={bIn} to={bOut} />
    <Caption text={say.s9c} from={cIn} to={cOut} />

    <Note from={aIn - 10} to={cOut + 10} />

    {(['s9a', 's9b', 's9c'] as const).map((k, i) => (
      <Sequence key={k} from={[aIn, bIn, cIn][i]}>
        <Audio src={staticFile(`audio/${k}.wav`)} />
      </Sequence>
    ))}
  </AbsoluteFill>
);

/** Said on screen, because a form full of a person's details has to say it. */
const Note: React.FC<{from: number; to: number}> = ({from, to}) => {
  const frame = useCurrentFrame();
  if (frame < from || frame > to) return null;
  return (
    <div
      style={{
        position: 'absolute',
        left: 56,
        top: 44,
        maxWidth: 285,
        fontFamily: theme.mono,
        fontSize: 18,
        lineHeight: 1.6,
        color: '#6d6659',
      }}
    >
      Demonstration data. No real contact, no real number.
    </div>
  );
};

export const SECTION5B_WIDTH = WIDTH;

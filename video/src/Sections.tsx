import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile} from 'remotion';
import {Beat, EndCard, FigureCard, SpokenCard, TypeLines, buildTimeline} from './Cards';
import {Footage, FootagePanel, Still} from './Footage';
import {HOLD, sec, theme} from './theme';
import lines from './lines.json';

const say = lines as Record<string, string>;

/**
 * ART DIRECTION
 *
 * Footage goes under the lines that are about people; plain ground under the
 * lines about the product, the data, or the promise. Each clip is chosen for
 * what the sentence over it actually says, not for general atmosphere.
 *
 * Vertical clips run as portrait panels beside the words, never cover-cropped
 * into a landscape frame - cover-cropping 9:16 keeps the middle band, which is
 * what cut faces in half.
 */

// Real source lengths. Loop needs them: a clip shorter than its block would
// otherwise freeze on its last frame.
const LEN = {
  '1960-pilot': 15.7,
  'elder-bored': 18.5,
  'elder-with-colf': 9.1,
  'elder-alone': 7.7,
  'elder-struggle': 9.0,
  'grandma-on-phone': 12.7,
  'grandpa-on-phone': 16.6,
  'couple-with-mobile-2': 72.3,
  'elder-with-tablet-and-medicine': 9.1,
  'weekend-visit': 8.9,
  'couple-with-mobile': 12.8,
  'elderly-couple-sick': 7.0,
  'man-alone-drinking': 9.5,
  'man-with-mobile-on-sofa': 9.6,
  'old-farmer': 10.5,
  'old-lady-pc': 22.2,
  'seamstress-black-and-white': 18.9,
  'seamstress-elder': 10.5,
  'woman-alone-knitting-vertical': 9.3,
  'woman-with-mobile-vertical': 19.7,
  'woman-with-tablet-vertical': 10.0,
} as const;

const Narration: React.FC<{timed: {key: string; from: number}[]}> = ({timed}) => (
  <>
    {timed.map((t) => (
      <Sequence key={t.key} from={t.from}>
        <Audio src={staticFile(`audio/${t.key}.wav`)} />
      </Sequence>
    ))}
  </>
);

// ---------------------------------------------------------------- section 2

const S2: Beat[] = [
  {key: 's2a', beat: 0.55},
  {key: 's2b', beat: 0.55},
  // The one gap in this section that must stay short: "They check in on Sunday"
  // is the tail of the sentence before it, not a new thought.
  {key: 's2c', beat: 0.45, hard: true},
  {key: 's2c2'},
  {key: 's2d', beat: 0.6},
  {key: 's2e', beat: 0.55},
  {key: 's2f'},
];
const t2 = buildTimeline(S2);
export const SECTION2_DURATION = t2.total;

export const Section2: React.FC = () => (
  <AbsoluteFill style={{backgroundColor: theme.ground}}>
    <FigureCard
      {...t2.at('s2a')}
      figure="2.7 million"
      label="people over seventy-five in Italy live on their own"
      source="ISTAT · Censimento permanente della popolazione, 2023"
    />
    <FigureCard
      {...t2.at('s2b')}
      figure="92.8%"
      label="can count on a relative"
      secondary={{figure: '3.2%', label: 'have nobody at all'}}
      source="ISTAT · Censimento permanente della popolazione, 2023"
    />

    {/* The picture arrives before the words do - elder bored runs under the
        tail of the statistics and carries into the sentence. Then the two of
        them ring, one after the other. */}
    <Footage
      src="elder-bored"
      clipSeconds={LEN['elder-bored']}
      from={t2.at('s2c').from - 60}
      to={t2.at('s2c').from + Math.round((t2.at('s2c').to - t2.at('s2c').from) * 0.34)}
      startAt={2}
    />
    <Footage
      src="grandpa-on-phone"
      clipSeconds={LEN['grandpa-on-phone']}
      from={t2.at('s2c').from + Math.round((t2.at('s2c').to - t2.at('s2c').from) * 0.34)}
      to={t2.at('s2c').from + Math.round((t2.at('s2c').to - t2.at('s2c').from) * 0.67)}
      startAt={2}
    />
    <Footage
      src="grandma-on-phone"
      clipSeconds={LEN['grandma-on-phone']}
      from={t2.at('s2c').from + Math.round((t2.at('s2c').to - t2.at('s2c').from) * 0.67)}
      to={t2.at('s2c').to}
      startAt={1.5}
    />
    <SpokenCard {...t2.at('s2c')} text={say.s2c} align="bottom" over />

    {/* "they check in on Sunday" - the visit */}
    <Footage
      src="weekend-visit"
      clipSeconds={LEN['weekend-visit']}
      from={t2.at('s2c2').from}
      to={t2.at('s2c2').to + sec(2.0)}
      startAt={1}
    />
    <SpokenCard {...t2.at('s2c2')} text={say.s2c2} align="bottom" over />

    {/* "what is missing is the ordinary daily contact" - a room with one person */}
    <Footage
      src="man-alone-drinking"
      clipSeconds={LEN['man-alone-drinking']}
      from={t2.at('s2d').from + sec(1.4)}
      to={t2.at('s2d').to}
      startAt={0.5}
    />
    <SpokenCard {...t2.at('s2d')} text={say.s2d} align="bottom" over />

    {/* The last picture of the section arrives here, under the worried lines,
        not at the end. "Did they take the tablets" wants a face, and the final
        sentence is stronger with nothing behind it. */}
    <Footage
      src="elderly-couple-sick"
      clipSeconds={LEN['elderly-couple-sick']}
      from={t2.at('s2e').from}
      to={sec(37.8)}
      startAt={0.5}
      align="left"
    />

    {/* the fourth line is "one person with a key to the house" - which is what a
        colf is. Vertical, so it runs as a panel beside the words. */}
    <FootagePanel
      src="elder-with-colf"
      clipSeconds={LEN['elder-with-colf']}
      from={sec(37.8)}
      to={t2.at('s2e').to + sec(0.6)}
      startAt={1}
      side="right"
    />
    <TypeLines
      over
      align="left"
      {...t2.at('s2e')}
      lines={(say.s2e.match(/[^.?!]+[.?!]*/g) ?? []).map((l) => l.trim()).filter(Boolean)}
    />

    {/* "none of it is an emergency" - held on nothing, to end the section */}
    <SpokenCard {...t2.at('s2f')} text={say.s2f} />

    <Narration timed={t2.timed} />
  </AbsoluteFill>
);

// ---------------------------------------------------------------- section 3
// The centre of the film, and the section where every picture is literally the
// thing its sentence is about.

const S3: Beat[] = [
  {key: 's3a', beat: 0.42},
  {key: 's3b', beat: 0.42},
  {key: 's3c', beat: 0.42},
  {key: 's3d'},
];
const t3 = buildTimeline(S3);
export const SECTION3_DURATION = t3.total;

export const Section3: React.FC = () => (
  <AbsoluteFill style={{backgroundColor: theme.ground}}>
    {/* the hinge of the film: a statement, on nothing */}
    <SpokenCard {...t3.at('s3a')} text={say.s3a} />

    {/* "was once very good at something" - archive film of a man in his prime */}
    <Footage src="1960-pilot" clipSeconds={LEN['1960-pilot']} {...t3.at('s3b')} startAt={1} />
    <SpokenCard {...t3.at('s3b')} text={say.s3b} align="bottom" over />

    {/* "Peggy ran the sample room" - a woman at a sewing machine */}
    <Footage
      src="seamstress-elder"
      clipSeconds={LEN['seamstress-elder']}
      {...t3.at('s3c')}
      startAt={0.5}
    />
    <SpokenCard {...t3.at('s3c')} text={say.s3c} align="bottom" over />

    {/* "what became of her trade after she left" - the trade itself */}
    <Footage
      src="seamstress-black-and-white"
      clipSeconds={LEN['seamstress-black-and-white']}
      {...t3.at('s3d')}
      startAt={3}
    />
    <SpokenCard {...t3.at('s3d')} text={say.s3d} align="bottom" over />

    <Narration timed={t3.timed} />
  </AbsoluteFill>
);

// ---------------------------------------------------------------- section 7

const S7: Beat[] = [
  {key: 's7b', beat: 0.5},
  {key: 's7b2', beat: 0.85},
  {key: 's7c', beat: 0.85},
  {key: 's7d'},
];
const t7 = buildTimeline(S7);
export const SECTION7_DURATION = t7.total;

export const Section7: React.FC = () => (
  <AbsoluteFill style={{backgroundColor: theme.ground}}>
    {/* Each clip starts a beat after its words and fades when its footage runs
        out, rather than repeating. An absence reads better than a loop. */}
    <Footage
      src="elder-alone"
      clipSeconds={LEN['elder-alone']}
      from={t7.at('s7b').from + sec(0.9)}
      to={t7.at('s7b').to}
      startAt={0.5}
    />
    <SpokenCard {...t7.at('s7b')} text={say.s7b} align="bottom" over />

    <Footage
      src="elder-struggle"
      clipSeconds={LEN['elder-struggle']}
      from={t7.at('s7b2').from + sec(0.9)}
      to={t7.at('s7b2').to}
      startAt={0.5}
    />
    <SpokenCard {...t7.at('s7b2')} text={say.s7b2} align="bottom" over />

    {/* "There is Anna, or Mary, or George" - the voice list from the setup form,
        where those names actually are. A still, because the menu is a native
        one the browser will not render into a capture. */}
    <Still src="config-voices" {...t7.at('s7c')} />
    <SpokenCard {...t7.at('s7c')} text={say.s7c} align="bottom" over />

    {/* the refusal, one item to a line, on nothing */}
    <TypeLines
      {...t7.at('s7d')}
      lines={(say.s7d.match(/[^,.]+[,.]?/g) ?? []).map((l) => l.trim()).filter(Boolean)}
    />
    <Narration timed={t7.timed} />
  </AbsoluteFill>
);

// ---------------------------------------------------------------- section 8

const S8: Beat[] = [
  {key: 's8a', beat: 1.3},
  {key: 's8b', beat: 1.4},
  {key: 's8c', beat: 1.3},
  {key: 's8d', beat: 0.8},
  {key: 's8e'},
];
const t8 = buildTimeline(S8);
// the couple holds in silence for a beat before the name arrives - 1.3s until
// 25/09, and the longest piece of pure dead air left in the film
const END_FROM = t8.total + sec(0.45);
// long enough that the addresses are up, complete, for a beat before the fade
const END_HOLD = sec(3.05);
export const SECTION8_DURATION = END_FROM + END_HOLD;

export const Section8: React.FC = () => (
  <AbsoluteFill style={{backgroundColor: theme.ground}}>
    {/* every picture in this section arrives before its words, the opening one
        included - it used to wait until 0:07 */}
    <FootagePanel
      src="woman-with-mobile-vertical"
      clipSeconds={LEN['woman-with-mobile-vertical']}
      from={sec(2.2)}
      to={t8.at('s8a').to}
      startAt={6}
      side="right"
    />
    <SpokenCard {...t8.at('s8a')} text={say.s8a} align="left" over />

    <Footage
      src="elder-with-tablet-and-medicine"
      clipSeconds={LEN['elder-with-tablet-and-medicine']}
      from={t8.at('s8b').from - sec(0.8)}
      to={t8.at('s8b').to}
      startAt={0.5}
    />
    <SpokenCard {...t8.at('s8b')} text={say.s8b} align="bottom" over />

    <Footage
      src="man-with-mobile-on-sofa"
      clipSeconds={LEN['man-with-mobile-on-sofa']}
      from={t8.at('s8c').from - sec(0.8)}
      to={t8.at('s8c').to}
      startAt={1}
    />
    <SpokenCard {...t8.at('s8c')} text={say.s8c} align="bottom" over />

    {/* the last picture: it comes in early, carries both closing lines, and
        holds in silence afterwards. It is the closure. */}
    <Footage
      src="couple-with-mobile"
      clipSeconds={LEN['couple-with-mobile']}
      from={t8.at('s8d').from - sec(1.4)}
      to={END_FROM}
      startAt={2}
    />
    <SpokenCard {...t8.at('s8d')} text={say.s8d} align="bottom" over />
    <SpokenCard {...t8.at('s8e')} text={say.s8e} align="bottom" over />

    {/* The last card is the one place the hold must NOT be added on top: its
        window is the end of the film, so a card that starts fading a second
        after the composition ends never fades at all - the film would stop dead
        on it. It holds for END_HOLD, HOLD included, and fades inside. */}
    <EndCard from={END_FROM} to={END_FROM + END_HOLD - 20} hold={0} />
    <Narration timed={t8.timed} />
  </AbsoluteFill>
);

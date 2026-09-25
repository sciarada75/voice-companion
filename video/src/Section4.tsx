import React, {useMemo, useState} from 'react';
import {
  AbsoluteFill,
  Audio,
  Easing,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
} from 'remotion';
import {SpokenCard} from './Cards';
import {ConversationPage, Device, Lines, PAGE_W, findBlock, findLine} from './ConversationPage';
import {FALL, HEIGHT, HOLD, MIN_GAP, sec, theme} from './theme';
import narration from './narration.json';
import lines from './lines.json';

/**
 * Section 4 - "Let it talk". The only place the product speaks.
 *
 * SECOND CUT, 24/09, after Claudia saw the first: "the screen is not centered,
 * the layout is poor. would have been better in a fake screen or mobile mode.
 * the conversation is frozen in the bottom, you do not see the beginning. I
 * would not record the whole conversation - it is poor, but just scroll thru
 * that and just now and then make closer's voice heard."
 *
 * Every one of those was right, and none of them was fixable in the footage:
 * a capture decides its framing and its scroll at the moment you press record.
 * So the page is no longer footage. ConversationPage lays out the product's own
 * HTML - its stylesheet, its markup, a real stored session - and this file
 * drives the scroll. The device frame is furniture; the glass is the real page
 * at the width a phone gives it.
 *
 * THE SOUND IS THE PART THAT IS STILL A RECORDING, and that is the right way
 * round: what the agent SAID has to be the agent's own voice, while how the
 * page LOOKED is a matter of framing. Two moments are heard, not the whole
 * conversation - the long answer about Jobs, and the joke it takes seriously.
 * Both are lifted straight out of the session with nothing but a gain change.
 *
 * The scroll is written against those two moments: it moves while nobody is
 * talking and holds still while somebody is, which is also how section 6 works.
 *
 * THE NOTES IN THE MARGIN, added 24/09: "when you scroll the chat you should
 * make evidence specific blocks, with your notes: here, closer says this, here
 * it answers that." Without them the scroll is a wall of dialogue and a judge
 * has thirty seconds to find the thing that matters in it. They are the film
 * SAYING WHAT TO LOOK AT, so they are set apart from the product: monospace, in
 * the dark margin beside the glass, never on it. Three of them, each pinned to
 * the leg of the scroll it describes.
 */

const say = lines as Record<string, string>;
const EASE = Easing.bezier(0.4, 0, 0.2, 1);

// FOURTH CUT, 25/09. The third put the narration OVER the recording and
// Claudia watched it: "this is the actual thing running: the overlap is not
// effective. instead, let the 2 voices start and talk for 3-4 sentences each
// first. then start with your explanation."
//
// So nothing talks over anything. THE CONVERSATION PLAYS FIRST, in the clear,
// at full level, with the page moving in step with it line by line - the two
// voices, several turns each, before a word of narration. Then the film
// explains what was just heard, and the recording is out while it does.
//
// It is also why section 4 no longer mentions the diary: "if we have the
// recording function in the 2nd reel, do not mention in the 1st as well." The
// diary IS section 5 - the tool call, the write, the read-back. Saying it here
// as well was mine, and it was saying it twice.
//
// THE LISTEN IS ONE NUMBER. LISTEN_TO is a timestamp in the recording, and the
// turn table below is lifted from the session's own millisecond timings
// (sessions/peggy/sess_45edfaec….json, `timeline.turns`), so the scroll cannot
// drift from the audio. The dead air between turns is the REAL response time
// and is not tightened: it is a voice agent, the latency is the product.
//   24.0 = two sentences each   36.2 = three   47.5 = four
// (each is a beat after the SECOND voice finishes its nth line, not the first)
const BED = 'audio/session-bed.wav'; // sess_45edfaec….ogg, as recorded
// TWO LINES EACH, 25/09. Three cost 12 seconds the film could only find by
// spending the two lines that argue the product is different (the "list it will
// never raise", and the loose end). The listen ends on her own longest answer -
// the walk, the tiredness, the reading - which is the one the film would have
// pointed at anyway.
const LISTEN_TO = 23.8;

/** Each turn, as the session recorded it: when it starts, and the line it is. */
const TURNS: {at: number; re: RegExp}[] = [
  {at: 0.4, re: /Afternoon, Peggy/},
  {at: 6.6, re: /It's been good till now/},
  {at: 10.7, re: /Have you been up to much today/},
  {at: 16.5, re: /I had a small walk this morning/},
  {at: 25.7, re: /peaceful way to spend an afternoon/},
  {at: 33.1, re: /Steve Jobs' biography/},
  {at: 37.6, re: /quite a life story/},
  {at: 44.9, re: /Do you know something about him/},
];
const HEARD = TURNS.filter((t) => t.at < LISTEN_TO);

// NO REPLAY. The Jobs answer used to come up to full for six seconds here, on
// the block the callout had just framed. Claudia, 25/09: "cut the record of the
// voice on the joke. the screenshot is enough." It is: the exchange is on the
// glass, lit, framed and read - hearing it a second time was my belt and
// braces, and it cost seven seconds the film does not have.
const MOVE = sec(0.85); // one scroll move, in the silence after a hold

const LEAD = sec(0.3);
const A = sec(narration.s4a);
const C = sec(narration.s4c);

const pageIn = LEAD - sec(0.5);
const aIn = LEAD;
const aOut = aIn + A;

// listen first, explain after
const listenFrom = aOut + HOLD;
const listenTo = listenFrom + sec(LISTEN_TO);

// ONE CALLOUT, NOT TWO. "Listen to how it runs. It answers, and asks one small
// thing back" was cut on 25/09 to pay for the listen, and it is the right one to
// lose: the viewer has just HEARD that exchange, twice over, in the voices
// themselves. The film naming it afterwards was the film explaining a joke it
// had already told.
const cIn = listenTo + HOLD + MOVE;
const cOut = cIn + C;
export const SECTION4_DURATION = cOut + HOLD + FALL + sec(0.08);

// The glass, in screen pixels. PAGE_W is the width the page is laid out at, so
// SCALE is how much bigger than a phone it is shown.
// Shorter than it was, and sitting high: the narration used to land across the
// middle of the conversation, which broke the film's own rule that captions
// never sit on paper (section 6). The glass gives up 100px and the words get a
// band of ground to stand on.
const GLASS_H = 840;
const SCALE = 1.42;
const GLASS_W = Math.round(PAGE_W * SCALE);

/** The two lines the voices belong to, found by what they SAY. */
const JOBS_LINE = /massive influence on how we use technology/;
const HOUSE_LINE = /exact right place/;

/**
 * THE TWO JOKES, boxed. Claudia, 25/09: "we actually have 2 jokes, not one -
 * from the mention on Steve Jobs till 'I do not know him personally', that is
 * one, and the housekeeping is the second. These parts deserve a small frame to
 * make them evident."
 *
 * She is right that both are jokes and that the first was going past unmarked.
 * The first is HERS about it: she asks a machine whether it knows Steve Jobs,
 * and it answers "not personally, of course" - it gets the joke and does not
 * pretend. The second is hers about him, and it plays along.
 *
 * A frame rather than a highlight: a highlighter says READ THIS WORD, a frame
 * says this exchange is one thing. Each is given by its first and last line and
 * matched by words, so adding a turn cannot move the box onto the wrong rows.
 */
const JOKE_ONE: [RegExp, RegExp] = [/Steve Jobs/, /massive influence on how we use technology/];
const JOKE_TWO: [RegExp, RegExp] = [/nice housekeeper/, /exact right place/];

// The other two blocks the film points at, 25/09. Both are on the same page and
// neither is staged: the turn where it answers and hands one small question
// back, and the turn where it reads the diary mid-conversation - the tool call
// is a row on the screen, with its arguments, not a claim in the narration.
//
// THE DIARY CALLOUT SAYS TABLETS AND NOTHING ELSE, on purpose. Claudia asked for
// "medicines, daily exercise, upcoming appointments"; tools/habits.mjs records
// medicines and habits and says of the third, in as many words, that "a visit or
// an appointment happens to them; it is context for the prompt, not a notebook
// line". So the film claims the two that are real and shows the one that is on
// the screen.
const DIARY: [RegExp, RegExp] = [/she asked me about my medicines/, /Have you had your evening ones yet/];

/**
 * A note in the margin. Deliberately not the product's voice and not the
 * narrator's: it is the film pointing at something.
 */
const Margin: React.FC<{from: number; to: number; text: string}> = ({from, to, text}) => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [from, from + 12, to - 10, to], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: EASE,
  });
  if (o <= 0) return null;
  const rise = interpolate(frame, [from, from + 16], [10, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: EASE,
  });
  return (
    <div
      style={{
        position: 'absolute',
        right: 70,
        top: '50%',
        width: 360,
        transform: `translateY(calc(-50% + ${rise}px))`,
        opacity: o,
        borderLeft: `2px solid ${theme.fine}`,
        paddingLeft: 22,
      }}
    >
      <p
        style={{
          margin: 0,
          fontFamily: theme.mono,
          fontSize: 25,
          lineHeight: 1.65,
          color: theme.cream,
        }}
      >
        {text}
      </p>
    </div>
  );
};

/**
 * A box drawn on the glass, in PAGE coordinates - it lives inside the scaled
 * container next to the iframe, so it scrolls with the page and scales with it
 * without any arithmetic of its own.
 */
const Frame: React.FC<{
  box: {top: number; bottom: number} | null;
  scrollY: number;
  from: number;
  to: number;
}> = ({box, scrollY, from, to}) => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [from, from + 10, to - 8, to], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: EASE,
  });
  if (!box || o <= 0) return null;
  const pad = 9;
  return (
    <div
      style={{
        position: 'absolute',
        left: 10,
        width: PAGE_W - 20 - 4,
        top: box.top - scrollY - pad,
        height: box.bottom - box.top + pad * 2,
        border: `2px solid ${theme.fine}`,
        borderRadius: 12,
        boxShadow: `0 0 0 6px rgba(121,201,177,0.10)`,
        opacity: o,
        pointerEvents: 'none',
      }}
    />
  );
};

/**
 * THE FOCUS PULL, taken from section 6 (added 25/09). Claudia sent the report
 * frame back with "this is the graphic treatment I want on the chat": on the
 * page, everything outside the block being talked about goes down to the film's
 * own ground and the block stays lit. It is the same idea as the green frame
 * and a stronger one - a frame says LOOK HERE, a focus pull removes everywhere
 * else - so the two run together: the box is drawn, and the rest of the
 * conversation recedes behind it.
 *
 * Drawn in PAGE coordinates inside the scaled container, exactly like Frame, so
 * it scrolls and scales with the page without arithmetic of its own.
 */
const Spotlight: React.FC<{
  box: {top: number; bottom: number} | null;
  scrollY: number;
  from: number;
  to: number;
  height: number;
}> = ({box, scrollY, from, to, height}) => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [from, from + 12, to - 8, to], [0, 0.62, 0.62, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: EASE,
  });
  if (!box || o <= 0) return null;
  const pad = 9;
  const top = box.top - scrollY - pad;
  const bottom = box.bottom - scrollY + pad;
  const band = {position: 'absolute' as const, left: 0, width: PAGE_W, background: theme.ground, opacity: o};
  return (
    <>
      <div style={{...band, top: 0, height: Math.max(0, top)}} />
      <div style={{...band, top: bottom, height: Math.max(0, height - bottom)}} />
    </>
  );
};

export const Section4: React.FC = () => {
  const frame = useCurrentFrame();
  const [m, setM] = useState<Lines | null>(null);

  const jokeOne = useMemo(() => findBlock(m, ...JOKE_ONE), [m]);

  // The page follows the RECORDING while it plays, line by line, off the
  // session's own timestamps - then holds still on each block the narration
  // points at. Nothing is ever read off a moving screen and nothing moves while
  // anybody is speaking about it.
  const scrollY = useMemo(() => {
    if (!m) return 0;
    const visible = GLASS_H / SCALE;
    const end = Math.max(0, m.docHeight - visible);
    const clamp = (y: number) => Math.max(0, Math.min(y, end));
    const at = (box: {top: number; bottom: number} | null, re: RegExp) => {
      if (!box) return clamp(findLine(m, re) - visible * 0.34);
      const h = box.bottom - box.top;
      return clamp(h + 90 > visible ? box.top - 40 : box.top - (visible - h) / 2);
    };
    // the listen: keep the line being spoken a little above the middle, so the
    // one after it is already on the glass when it starts
    const listenKeys: number[] = [];
    const listenVals: number[] = [];
    for (const t of HEARD) {
      listenKeys.push(listenFrom + sec(t.at));
      listenVals.push(clamp(findLine(m, t.re) - visible * 0.42));
    }
    const two = at(jokeOne, JOBS_LINE);

    const keys = [0, listenFrom, ...listenKeys, listenTo, cIn - MOVE, cIn, SECTION4_DURATION];
    const vals = [listenVals[0] ?? 0, listenVals[0] ?? 0, ...listenVals,
      listenVals[listenVals.length - 1] ?? 0, two, two, two];
    // strictly increasing keys, or interpolate throws
    const k: number[] = [];
    const v: number[] = [];
    keys.forEach((x, i) => {
      if (i === 0 || x > k[k.length - 1]) {
        k.push(x);
        v.push(vals[i]);
      }
    });
    return interpolate(frame, k, v, {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: EASE,
    });
  }, [frame, m, jokeOne]);

  const deviceOpacity = interpolate(
    frame,
    [pageIn, pageIn + 16, SECTION4_DURATION - sec(0.55), SECTION4_DURATION - sec(0.1)],
    [0, 1, 1, 0],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE}
  );

  return (
    <AbsoluteFill style={{backgroundColor: theme.ground}}>
      <AbsoluteFill
        style={{
          alignItems: 'center',
          justifyContent: 'flex-start',
          paddingTop: 34,
          opacity: deviceOpacity,
        }}
      >
        <Device width={GLASS_W} height={GLASS_H}>
          {/* the page is laid out at phone width and scaled up bodily, so the
              proportions stay the product's own rather than being re-typeset */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              transform: `scale(${SCALE})`,
              transformOrigin: 'top left',
              width: PAGE_W,
              height: GLASS_H / SCALE,
              overflow: 'hidden',
            }}
          >
            <ConversationPage
              page="conversation"
              scrollY={scrollY}
              height={GLASS_H / SCALE}
              onMeasured={setM}
            />
            {/* Each callout: everywhere else recedes, the block is framed. */}
            <Spotlight box={jokeOne} scrollY={scrollY} from={cIn - 10} to={cOut + HOLD}
              height={GLASS_H / SCALE} />
            <Frame box={jokeOne} scrollY={scrollY} from={cIn - 10} to={cOut + HOLD} />
          </div>
        </Device>
      </AbsoluteFill>

      {/* The band the words stand on. The glass bleeds into it rather than
          ending on a hard edge, exactly as the report does in section 6. */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(rgba(23,21,15,0) ${GLASS_H - 200}px,
            rgba(23,21,15,0.94) ${GLASS_H - 20}px, ${theme.ground} ${GLASS_H + 40}px)`,
          pointerEvents: 'none',
        }}
      />

      {/* "This is the actual thing, running." - over the ground beside the
          device, which is narrow enough to leave room on both sides. */}
      <Disclosure from={pageIn} to={SECTION4_DURATION} />

      {/* Nothing is written over the listen: for those seconds the film shuts
          up and the conversation is the whole picture. */}
      <Margin from={cIn - 4} to={cOut + HOLD} text="The user asks a machine whether it knew him. The companion does not pretend, and adds something the user did not know." />

      <SpokenCard from={aIn} to={aOut} text={say.s4a} align="bottom" over />
      <SpokenCard from={cIn} to={cOut} text={say.s4c} align="bottom" over />

      {/* The conversation, as recorded, in the clear and on its own. */}
      <Sequence from={listenFrom} durationInFrames={listenTo - listenFrom + 2}>
        <Audio src={staticFile(BED)} />
      </Sequence>
      {(['s4a', 's4c'] as const).map((k, i) => (
        <Sequence key={k} from={[aIn, cIn][i]}>
          <Audio src={staticFile(`audio/${k}.wav`)} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

/**
 * Permanent while the real page is up. Peggy is not a person, and the film says
 * so where the claim is made rather than only in the README.
 */
const Disclosure: React.FC<{from: number; to: number}> = ({from, to}) => {
  const frame = useCurrentFrame();
  if (frame < from || frame > to) return null;
  return (
    <div
      style={{
        position: 'absolute',
        left: 64,
        top: 56,
        maxWidth: 400,
        fontFamily: theme.mono,
        fontSize: 18,
        lineHeight: 1.6,
        color: '#6d6659',
      }}
    >
      Peggy is a demonstration persona derived from national statistics. No real person’s data
      appears in this project.
    </div>
  );
};

export const SECTION4_HEIGHT = HEIGHT;

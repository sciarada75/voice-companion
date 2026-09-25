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
import {Caption} from './Cards';
import {ConversationPage, Device, Lines, PAGE_W, findLine} from './ConversationPage';
import {FALL, FPS, HOLD, MIN_GAP, sec, theme} from './theme';
import narration from './narration.json';
import lines from './lines.json';
import lastTime from './last-time.json';

/**
 * Section 5 - "What it is made of". Two screens, briskly, no feature grid.
 *
 * BOTH ARE REAL AND BOTH WERE HARD-WON, so neither is a mock-up.
 *
 * The first is a real session in which the agent checks the diary, is told she
 * took her tablets, writes it down and reads it back BY NAME - which is the
 * whole point of reading it back, because "I've got that down for you" is
 * something she cannot check.
 *
 * It is the product's own page, laid out live and scrolled (see
 * ConversationPage), not a capture. Claudia's observation on the first cut of
 * section 4 is what unlocked it: once the page is built from the stored session
 * rather than filmed, THE TAKES WITH NO MICROPHONE BECOME USABLE TOO. The only
 * conversation in which the diary write succeeded cleanly happened to be one
 * nobody was recording sound for. Here that costs nothing - the section is
 * narrated, and the tool call is something you read, not something you hear.
 *
 * The second is the loose end, captured off the LIVE agent at 18:37 on 24/09
 * and frozen into src/last-time.json so a later conversation cannot age it out
 * from under the render. It is the literal text of the published system prompt,
 * not a reconstruction. There is no screen in the product that shows it - the
 * only page that does is /dev, which the script forbids - so it is set as type.
 *
 * It took four attempts to get the agent to write one at all: the tool had
 * fired once in twelve conversations because THE DIARY told it to write while
 * MEMORY described memory in the passive and closed with "never say that you
 * wrote anything down". See HANDOVER §0.1. This section is therefore the part
 * of the film most likely to become untrue again - if the loose end stops
 * working, this is the section that has to change.
 */

const say = lines as Record<string, string>;
const EASE = Easing.bezier(0.4, 0, 0.2, 1);

const A = sec(narration.s5a);
const B = sec(narration.s5b);
const LEAD = sec(0.3);

const m = {
  aIn: LEAD,
  aOut: LEAD + A,
};
const bIn = m.aOut + MIN_GAP;
const bOut = bIn + B;
export const SECTION5_DURATION = bOut + HOLD + FALL + sec(0.08);


// The glass, and the line the camera comes to rest on. Found by its words, so
// adding a turn to the conversation cannot silently aim it at the wrong row.
const GLASS_H = 880;
const SCALE = 1.34;
const GLASS_W = Math.round(PAGE_W * SCALE);
const WRITE_LINE = /diary_record/;

/**
 * The loose end, as it is written in the agent's own instructions. The brackets
 * are dimmed and the sentence is not: the sentence is the product, the brackets
 * are only where it lives.
 */
const LastTimeBlock: React.FC<{from: number; to: number}> = ({from, to}) => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [from - 14, from, to - 10, to], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: EASE,
  });
  if (o <= 0) return null;

  const rows = lastTime.block.split('\n').filter(Boolean);
  const noteIn = interpolate(frame, [from + sec(0.9), from + sec(1.5)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: EASE,
  });

  return (
    <AbsoluteFill
      style={{
        opacity: o,
        alignItems: 'center',
        justifyContent: 'center',
        paddingBottom: 190, // the caption lives below
      }}
    >
      <div style={{fontFamily: theme.mono, textAlign: 'left'}}>
        {rows.map((r, i) => {
          const isTag = r.startsWith('[');
          return (
            <div
              key={i}
              style={{
                fontSize: isTag ? 32 : 54,
                lineHeight: 1.7,
                color: isTag ? '#6d6659' : theme.cream,
                letterSpacing: isTag ? '0.1em' : 0,
                opacity: isTag ? 1 : noteIn,
              }}
            >
              {r}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

export const Section5: React.FC = () => {
  const frame = useCurrentFrame();
  const [meas, setMeas] = useState<Lines | null>(null);

  const from = m.aIn - 12;
  const to = m.aOut + 8;

  // It arrives already part-way down - a conversation in progress, not one
  // starting - and settles on the write while the narration describes it.
  const scrollY = useMemo(() => {
    if (!meas) return 0;
    const visible = GLASS_H / SCALE;
    const end = Math.max(0, meas.docHeight - visible);
    const land = Math.max(0, Math.min(findLine(meas, WRITE_LINE) - visible * 0.42, end));
    return interpolate(frame, [from, m.aOut - sec(1.4)], [Math.max(0, land - 340), land], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: EASE,
    });
  }, [frame, meas]);

  const deviceOpacity = interpolate(frame, [from, from + 14, to - 12, to], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: EASE,
  });

  return (
  <AbsoluteFill style={{backgroundColor: theme.ground}}>
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'flex-start', paddingTop: 24, opacity: deviceOpacity}}>
      <Device width={GLASS_W} height={GLASS_H}>
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
          <ConversationPage page="diary" scrollY={scrollY} height={GLASS_H / SCALE} onMeasured={setMeas} />
        </div>
      </Device>
    </AbsoluteFill>
    <Caption text={say.s5a} from={m.aIn} to={m.aOut} />

    <LastTimeBlock from={bIn - 8} to={bOut + 10} />
    <Caption text={say.s5b} from={bIn} to={bOut} />

    <Sequence from={m.aIn}>
      <Audio src={staticFile('audio/s5a.wav')} />
    </Sequence>
    <Sequence from={bIn}>
      <Audio src={staticFile('audio/s5b.wav')} />
    </Sequence>
  </AbsoluteFill>
  );
};

import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {FALL, FPS, HEIGHT, HOLD, MIN_GAP, RISE, sec, theme} from './theme';
import {Align, alignStyle} from './Footage';
import narration from './narration.json';

const durations = narration as Record<string, number>;
const EASE = Easing.bezier(0.4, 0, 0.2, 1);

/**
 * One spoken block, and the silence after it. A section is a list of these, and
 * every frame number in the film is computed from the measured audio - nothing
 * downstream is typed by hand.
 */
export type Beat = {key: string; beat?: number; hard?: boolean};
// `hold` is how long THIS card stands still afterwards, which is not always the
// film-wide HOLD: a block followed by a deliberately short gap has to be GONE
// before the next one arrives, or its words sit on top of them.
export type Timed = {key: string; from: number; to: number; dur: number; hold: number; fall: number};

// TIGHTENING THE SILENCES, 25/09. Claudia: "even cut half sec upon transitions,
// prioritise the ones where the silence is longer." There IS a floor and it is
// the rule she set an hour earlier: a card holds for HOLD and then takes FALL to
// leave, so the shortest a section can end is HOLD + FALL, and the shortest it
// can open is RISE. Everything above those two numbers is dead air, and this is
// where most of it was - a full MIN_GAP after the last block, which reserved
// room for a card that never comes, plus a third of a second of pad on top.
export const buildTimeline = (beats: Beat[], lead = 0.3) => {
  let at = sec(lead);
  const timed: Timed[] = [];
  let last: {hold: number; fall: number; end: number} | null = null;
  for (const b of beats) {
    const d = durations[b.key];
    if (d === undefined) throw new Error(`no measured duration for ${b.key} - run narrate.mjs`);
    const dur = Math.round(d * FPS);
    // MIN_GAP is a floor, not a beat: a block that already breathes longer keeps
    // its own. `hard: true` opts out, for the two cuts the film means to be
    // short - they are marked where they are written, not guessed at here.
    const gap = sec(b.beat ?? 0.65);
    const real = b.hard ? gap : Math.max(gap, MIN_GAP);
    // What the gap leaves once the NEXT card's rise is reserved is all this one
    // has: it holds for as much of HOLD as fits, then fades in what is left.
    // On a real hard cut that is a three-frame cut and no hold at all - which
    // is what a hard cut means, and it is why nothing ever lands on top of
    // anything else, however short the beat.
    const room = Math.max(0, real - RISE);
    const hold = Math.max(0, Math.min(HOLD, room - FALL));
    const fall = Math.max(0, Math.min(FALL, room - hold));
    timed.push({key: b.key, from: at, to: at + dur, dur, hold, fall});
    at += dur + real;
    last = {hold, fall, end: timed[timed.length - 1].to};
  }
  // The section ends when the last card has gone, not a gap later.
  const total = last ? last.end + last.hold + last.fall + sec(0.08) : at;
  return {timed, total, at: (k: string) => timed.find((t) => t.key === k)!};
};

/** Fade a thing up and down around a window, in frames. */
// The words stand still for HOLD after the voice stops, and only then leave.
// They used to start fading on `to`, which put an empty screen at the end of
// every block - the thing that read as rushed even where the silence was long.
const window_ = (frame: number, from: number, to: number, up = RISE, down = FALL, hold = HOLD) =>
  interpolate(frame, [from - up, from - Math.round(up / 3), to + hold, to + hold + down], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: EASE,
  });

/**
 * Where the words live. `over` means there is footage underneath, which costs
 * the words a shadow and buys them a position other than dead centre.
 */
export const Ground: React.FC<{
  children: React.ReactNode;
  align?: Align;
  over?: boolean;
}> = ({children, align = 'center', over = false}) => (
  <AbsoluteFill
    style={{
      backgroundColor: over ? 'transparent' : theme.ground,
      color: theme.cream,
      fontFamily: theme.serif,
      padding: '0 190px',
      textShadow: over ? '0 2px 26px rgba(0,0,0,0.9), 0 0 8px rgba(0,0,0,0.75)' : 'none',
      ...alignStyle(align),
    }}
  >
    {children}
  </AbsoluteFill>
);

/** Type size follows length, so a long block never crowds the frame. */
const sizeFor = (words: number) =>
  words <= 8 ? 96 : words <= 16 ? 74 : words <= 30 ? 58 : 46;

/**
 * The spoken words, on screen, as the picture. Used wherever there is no footage
 * - which means no bottom caption in these sections, because the card already
 * is the subtitle. Sentences arrive as they are spoken.
 */
export const SpokenCard: React.FC<{
  text: string;
  from: number;
  to: number;
  hold?: number;
  fall?: number;
  align?: Align;
  over?: boolean;
}> = ({text, from, to, hold = HOLD, fall = FALL, align = 'center', over = false}) => {
  const frame = useCurrentFrame();
  const o = window_(frame, from, to, RISE, fall, hold);
  if (o <= 0) return null;

  const sentences = text.match(/[^.?!]+[.?!]*/g)?.map((s) => s.trim()).filter(Boolean) ?? [text];
  const words = text.trim().split(/\s+/).length;
  const counts = sentences.map((s) => s.split(/\s+/).length);
  const span = to - from;

  let acc = 0;
  const starts = counts.map((c) => {
    const at = from + Math.round((acc / words) * span);
    acc += c;
    return at;
  });

  return (
    <Ground align={align} over={over}>
      <div style={{opacity: o, maxWidth: over && align !== 'center' ? 1020 : 1460}}>
        {sentences.map((s, i) => (
          <span
            key={i}
            style={{
              fontSize: sizeFor(words),
              lineHeight: 1.34,
              // Fully visible BEFORE the sentence is spoken. A reveal centred on
            // the audio reads as lag, because the eye needs a beat to find new
            // words; a subtitle that arrives with the voice is already late.
            opacity: interpolate(frame, [starts[i] - 16, starts[i] - 5], [0, 1], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
                easing: EASE,
              }),
            }}
          >
            {s}{' '}
          </span>
        ))}
      </div>
    </Ground>
  );
};

/** A statistic, large, with the agency that published it named underneath. */
export const FigureCard: React.FC<{
  hold?: number;
  fall?: number;
  figure: string;
  label: string;
  source?: string;
  secondary?: {figure: string; label: string};
  from: number;
  to: number;
  align?: Align;
  over?: boolean;
}> = ({figure, label, source, secondary, from, to, hold = HOLD, fall = FALL, align = 'center', over = false}) => {
  const frame = useCurrentFrame();
  const o = window_(frame, from, to, RISE, fall, hold);
  if (o <= 0) return null;
  const secondIn = interpolate(frame, [from + sec(1.4), from + sec(2.0)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: EASE,
  });

  return (
    <Ground align={align} over={over}>
      <div style={{opacity: o}}>
        <div
          style={{
            // a long figure ("2.7 million") gets smaller type than a short one
            // ("92.8%"), so both fill the frame rather than one overflowing it
            fontSize: figure.length <= 5 ? 232 : figure.length <= 9 ? 176 : 132,
            lineHeight: 1,
            letterSpacing: '-0.02em',
          }}
        >
          {figure}
        </div>
        <div style={{fontSize: 40, lineHeight: 1.4, marginTop: 30, color: '#cfc8bb', maxWidth: 1180}}>
          {label}
        </div>
        {secondary ? (
          <div style={{opacity: secondIn, marginTop: 58}}>
            <div style={{fontSize: 92, lineHeight: 1, color: '#a49c8d'}}>{secondary.figure}</div>
            <div style={{fontSize: 30, marginTop: 14, color: '#8a8275'}}>{secondary.label}</div>
          </div>
        ) : null}
        {source ? (
          <div
            style={{
              marginTop: 66,
              fontSize: 22,
              letterSpacing: '0.13em',
              textTransform: 'uppercase',
              color: '#7a7365',
              fontFamily: theme.mono,
            }}
          >
            {source}
          </div>
        ) : null}
      </div>
    </Ground>
  );
};

/** Lines that arrive one at a time and stay - the worried adult child. */
export const TypeLines: React.FC<{
  hold?: number;
  fall?: number;
  lines: string[];
  from: number;
  to: number;
  align?: Align;
  over?: boolean;
}> = ({lines, from, to, hold = HOLD, fall = FALL, align = 'center', over = false}) => {
  const frame = useCurrentFrame();
  const o = window_(frame, from, to, RISE, fall, hold);
  if (o <= 0) return null;
  const step = (to - from) / lines.length;

  return (
    <Ground align={align} over={over}>
      <div style={{opacity: o, maxWidth: 1420, textAlign: 'left'}}>
        {lines.map((l, i) => {
          const at = from + step * i;
          return (
            <p
              key={i}
              style={{
                fontSize: 50,
                lineHeight: 1.42,
                margin: '0 0 30px',
                color: theme.cream,
                opacity: interpolate(frame, [at - 14, at - 4], [0, 1], {
                  extrapolateLeft: 'clamp',
                  extrapolateRight: 'clamp',
                  easing: EASE,
                }),
              }}
            >
              {l}
            </p>
          );
        })}
      </div>
    </Ground>
  );
};

export const EndCard: React.FC<{from: number; to: number; hold?: number}> = ({
  from,
  to,
  hold = HOLD,
}) => {
  const frame = useCurrentFrame();
  const o = window_(frame, from, to, 14, 20, hold);
  if (o <= 0) return null;
  // THE URLS NEVER APPEARED. They faded in from 1.9s to 2.6s on a card whose own
  // window ended at 1.9s - so the last frame of the film, which carries the two
  // addresses a judge would type, was showing them at a few per cent and then
  // fading them out. Present since the card was written; found 25/09 by asking
  // what the card was still doing when the film stopped. The reveal is now
  // finished well before the fade, and END_HOLD is long enough to read them.
  const tagIn = interpolate(frame, [from + sec(0.45), from + sec(0.95)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: EASE,
  });
  const urlIn = interpolate(frame, [from + sec(1.05), from + sec(1.55)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: EASE,
  });

  return (
    <Ground>
      <div style={{opacity: o, textAlign: 'center'}}>
        <div style={{fontSize: 128, letterSpacing: '0.16em', paddingLeft: '0.16em'}}>CLOSER</div>
        <div style={{fontSize: 46, fontStyle: 'italic', marginTop: 26, color: '#cfc8bb', opacity: tagIn}}>
          Closer, if not near.
        </div>
        <div
          style={{
            marginTop: 86,
            fontSize: 25,
            lineHeight: 1.9,
            color: '#8a8275',
            fontFamily: theme.mono,
            opacity: urlIn,
          }}
        >
          lablab.claudiaonclaude.com
          <br />
          github.com/sciarada75/voice-companion
        </div>
      </div>
    </Ground>
  );
};

/** Subtitle for the sections that show footage rather than words. */
export const Caption: React.FC<{text: string; from: number; to: number; hold?: number}> = ({
  text,
  from,
  to,
  hold = HOLD,
}) => {
  const frame = useCurrentFrame();
  const o = window_(frame, from, to, 14, 8, hold);
  if (o <= 0) return null;
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
        {text}
      </p>
    </div>
  );
};

export const HEIGHT_ = HEIGHT;

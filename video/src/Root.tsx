import React from 'react';
import {Composition, Series} from 'remotion';
import {Section1, SECTION1_DURATION} from './Section1';
import {Section4, SECTION4_DURATION} from './Section4';
import {Section5, SECTION5_DURATION} from './Section5';
import {Section5b, SECTION5B_DURATION} from './Section5b';
import {Section6, SECTION6_DURATION} from './Section6';
import {
  Section2, SECTION2_DURATION,
  Section3, SECTION3_DURATION,
  Section7, SECTION7_DURATION,
  Section8, SECTION8_DURATION,
} from './Sections';
import {FPS, HEIGHT, WIDTH} from './theme';

const base = {fps: FPS, width: WIDTH, height: HEIGHT} as const;

/**
 * THE WHOLE FILM, as one composition (25/09).
 *
 * It used to be nine renders concatenated with ffmpeg, and every one of those
 * files carried about 50ms of AAC padding on the end of its audio track - nine
 * of them, half a second, against a HARD five-minute cap with 0.2s to spare.
 * As a Series the runtime is the frame count and nothing else, which is also
 * the only way to say honestly what the film is going to measure before it is
 * rendered. The section compositions stay: they are how a single section gets
 * looked at without rendering five minutes.
 */
const SECTIONS = [
  [Section1, SECTION1_DURATION],
  [Section2, SECTION2_DURATION],
  [Section3, SECTION3_DURATION],
  [Section4, SECTION4_DURATION],
  [Section5, SECTION5_DURATION],
  [Section5b, SECTION5B_DURATION],
  [Section6, SECTION6_DURATION],
  [Section7, SECTION7_DURATION],
  [Section8, SECTION8_DURATION],
] as const;

export const FILM_DURATION = SECTIONS.reduce((a, [, d]) => a + d, 0);

const Film: React.FC = () => (
  <Series>
    {SECTIONS.map(([Component, duration], i) => (
      <Series.Sequence key={i} durationInFrames={duration}>
        <Component />
      </Series.Sequence>
    ))}
  </Series>
);

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Film" component={Film} durationInFrames={FILM_DURATION} {...base} />
    <Composition id="Section1" component={Section1} durationInFrames={SECTION1_DURATION} {...base} />
    <Composition id="Section2" component={Section2} durationInFrames={SECTION2_DURATION} {...base} />
    <Composition id="Section3" component={Section3} durationInFrames={SECTION3_DURATION} {...base} />
    <Composition id="Section4" component={Section4} durationInFrames={SECTION4_DURATION} {...base} />
    <Composition id="Section5" component={Section5} durationInFrames={SECTION5_DURATION} {...base} />
    <Composition id="Section5b" component={Section5b} durationInFrames={SECTION5B_DURATION} {...base} />
    <Composition id="Section6" component={Section6} durationInFrames={SECTION6_DURATION} {...base} />
    <Composition id="Section7" component={Section7} durationInFrames={SECTION7_DURATION} {...base} />
    <Composition id="Section8" component={Section8} durationInFrames={SECTION8_DURATION} {...base} />
  </>
);

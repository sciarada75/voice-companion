// The film's design system is not invented: it is lifted from the product's own
// report stylesheet (tools/report/run.mjs). Film and product then read as one thing.

export const theme = {
  // dark tokens = the film's ground; light tokens = the report, shown as paper on it
  ground: '#17150f',
  cream: '#f0ece5',
  ink: '#1c1a17',
  paper: '#f7f4ef',
  line: '#3a3630',
  fine: '#79c9b1', // --basso, dark variant
  notice: '#dcae5f', // --medio, dark variant
  critical: '#e98a80', // --alto, dark variant
  serif: 'ui-serif, Georgia, "Times New Roman", serif',
  mono: 'ui-monospace, "SF Mono", Menlo, monospace',
} as const;

export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;

// The report page is rendered at its natural 1000px width and scaled up, so the
// body type lands at roughly 22px in frame - readable if a judge watches small.
export const PAGE_WIDTH = 1000;
export const PAGE_SCALE = 1.35;

export const sec = (s: number) => Math.round(s * FPS);

// --- how long a finished frame stands still -----------------------------------
// Claudia, 25/09: "when a frame finishes it has to stay still, with the text
// there, for 1 second. still too fast." Two things had to change, and only one
// of them costs time. The words used to fade the instant the voice stopped, so
// every block ended on an empty screen - that is what read as fast, and holding
// them through the silence is free. HOLD is the second part: the silence itself
// is raised to a full second wherever the film does not deliberately cut short.
//
// It is a floor, not a fixed beat: a section that already breathes longer keeps
// its own timing. The film is against a HARD five-minute cap, so every frame of
// this is paid for - see the runtime note in the handover before raising it.
export const HOLD = sec(1);
export const RISE = 10; // frames a card takes to arrive, ahead of its voice
export const FALL = 8; // frames it takes to leave, after the hold
// NOTHING OVERLAPS. This was briefly HOLD alone, which let the incoming words
// start rising while the outgoing ones were still at full opacity - defended in
// this comment as a dissolve, and Claudia, 25/09: "text from one frame overlaps
// to the previous. do not do that." So the gap has to clear the whole
// transition: the hold, the outgoing fade, and the incoming one.
export const MIN_GAP = HOLD + FALL + RISE;

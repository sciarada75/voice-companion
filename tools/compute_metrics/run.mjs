// Stage 8: arithmetic on the calls. No AI here, on purpose — these numbers go
// to a family, so they have to be the same every time anyone runs them.
//
//   PROFILE=peggy node tools/compute_metrics/run.mjs [--json]
//
// What it measures, per call and across calls:
//   - how long the call lasted, and at what time of day it started
//   - how much SHE talked: words, and the average length of her answers
//   - flat answers ("yes", "mm", "I don't know"): the rules make the agent
//     change subject after two in a row, so counting them is the engagement
//     signal the workflow asks for
//   - the delay she heard before each reply (time_to_first_audio_ms)
//   - how often she interrupted, and how often the agent was cut off
//
// Nothing here is a diagnosis. It is a description of one call, against her own
// earlier calls and nothing else.
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const PROFILE = process.env.PROFILE || '';
if (!PROFILE) {
  console.error('\nERROR: say which profile.\n  PROFILE=<name> node tools/compute_metrics/run.mjs\n');
  process.exit(1);
}

const DIR = join(ROOT, 'sessions', PROFILE);
let files = [];
try {
  files = readdirSync(DIR).filter((f) => f.endsWith('.json'));
} catch {
  console.error(`\nERROR: no sessions for "${PROFILE}". Run tools/pull_sessions first.\n`);
  process.exit(1);
}
if (!files.length) {
  console.error(`\nNo calls stored for "${PROFILE}" yet.\n`);
  process.exit(1);
}

// A "flat" answer is short and carries nothing: it is how someone says they
// are done with a subject without saying so. Hedges count too ("I don't know").
const EMPTY_WORDS = /^(yes|yeah|yep|no|nope|mm+|hmm+|ok|okay|right|sure|maybe|i don'?t know|dunno|nothing|fine)\b/i;
const words = (t) => (t || '').trim().split(/\s+/).filter(Boolean).length;
const flat = (t) => {
  const s = (t || '').trim();
  if (!s) return false;
  return words(s) <= 3 || EMPTY_WORDS.test(s);
};
const median = (a) => {
  if (!a.length) return null;
  const s = [...a].sort((x, y) => x - y);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2);
};

const calls = files
  .map((f) => JSON.parse(readFileSync(join(DIR, f), 'utf8')))
  .sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)))
  .map((c) => {
    const turns = c.timeline?.turns ?? [];
    const theirs = turns.filter((t) => t.user_transcript);
    const answers = theirs.map((t) => t.user_transcript);
    const delays = turns.map((t) => t.time_to_first_audio_ms).filter((n) => typeof n === 'number');

    // Two flat answers in a row is the moment the agent is told to change
    // subject. Counting the runs says how often that moment came.
    let doubleFlats = 0;
    for (let i = 1; i < answers.length; i++) {
      if (flat(answers[i]) && flat(answers[i - 1])) doubleFlats++;
    }

    const theirWords = answers.reduce((n, t) => n + words(t), 0);
    const agentWords = turns.reduce((n, t) => n + words(t.agent_text), 0);

    return {
      session_id: c.session_id,
      when: c.created_at,
      local_time: c.created_at ? new Date(c.created_at).toLocaleString() : null,
      duration_s: Math.round(c.duration_seconds ?? 0),
      their_turns: theirs.length,
      their_words: theirWords,
      agent_words: agentWords,
      their_share: theirWords + agentWords ? Math.round((100 * theirWords) / (theirWords + agentWords)) : 0,
      average_answer_words: theirs.length ? Math.round(theirWords / theirs.length) : 0,
      flat_answers: answers.filter(flat).length,
      flat_in_a_row: doubleFlats,
      interruptions: turns.filter((t) => t.interrupted_at_ms != null || t.status === 'interrupted').length,
      median_delay_ms: median(delays),
      worst_delay_ms: delays.length ? Math.max(...delays) : null,
    };
  });

if (process.argv.includes('--json')) {
  console.log(JSON.stringify({ profile: PROFILE, calls }, null, 1));
  process.exit(0);
}

const pad = (s, n) => String(s ?? '-').padEnd(n);
const num = (s, n) => String(s ?? '-').padStart(n);

console.log(`\n${PROFILE}: ${calls.length} calls\n`);
console.log(
  pad('when', 22) + num('secs', 6) + num('turns', 7) + num('her words', 11) +
  num('her share', 11) + num('avg answer', 12) + num('flat', 6) + num('2-flat', 8) + num('delay ms', 10),
);
for (const c of calls) {
  console.log(
    pad(c.local_time, 22) + num(c.duration_s, 6) + num(c.their_turns, 7) + num(c.their_words, 11) +
    num(c.their_share + '%', 11) + num(c.average_answer_words, 12) + num(c.flat_answers, 6) +
    num(c.flat_in_a_row, 8) + num(c.median_delay_ms, 10),
  );
}

// The comparison that matters is with HER earlier calls, so the averages of
// everything before today are printed under today's line, and nothing else is
// compared to anything.
if (calls.length > 1) {
  const before = calls.slice(0, -1);
  const average = (k) => Math.round(before.reduce((n, c) => n + (c[k] ?? 0), 0) / before.length);
  const today = calls.at(-1);
  console.log('\nher own baseline (every call before the last one):');
  console.log(
    `  length ${average('duration_s')}s · her words ${average('their_words')} · her share ${average('their_share')}%` +
    ` · avg answer ${average('average_answer_words')} words · flat ${average('flat_answers')}`,
  );
  console.log('last call against it:');
  console.log(
    `  length ${today.duration_s}s · her words ${today.their_words} · her share ${today.their_share}%` +
    ` · avg answer ${today.average_answer_words} words · flat ${today.flat_answers}`,
  );
}
console.log('\nDescriptive only. Nothing here is a diagnosis.\n');

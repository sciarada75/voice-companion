#!/usr/bin/env node
// Builds public/pages/conversation.html: the PRODUCT'S OWN page, with a REAL
// recorded conversation already in it.
//
// WHY THIS EXISTS RATHER THAN A SCREEN RECORDING. Section 4 first used the
// capture straight off Claudia's machine. It was unusable as direction: the
// column sat off-centre inside browser chrome, the page had only grown far
// enough to fill its top half so the bottom was dead white, and the beginning
// of the conversation had already scrolled away before the clip started. None
// of that is fixable in footage - the framing and the scroll were decided at
// record time.
//
// So the page is rebuilt here instead, and NOTHING about it is invented:
//   - the CSS is lifted verbatim from deployment/cloudflare/public/index.html
//   - the markup is what app.js's transcriptLine() produces, class for class
//   - the words are the stored timeline of a real session, in order, uncut
// What the film gains is the camera: the whole conversation exists at once, so
// it can be scrolled from the first line to the last at whatever pace the
// narration wants.
//
// A CONSEQUENCE CLAUDIA SPOTTED, 24/09: because the page is built from the
// stored session and not from a capture, the recordings with NO MICROPHONE are
// usable too. The voice is only heard here and there; the rest is reading. So
// any conversation the system has ever had can be put on screen, whether or not
// anybody was recording the sound at the time. That is how section 5 gets its
// diary screen - the only clean write happened in a silent take.
import {readFileSync, writeFileSync} from 'node:fs';

const REPO = '/Users/claudiamauri/Desktop/voice-companion';
const [SESSION_ID, OUT] = process.argv.slice(2);
if (!SESSION_ID || !OUT) {
  console.error('usage: node make-conversation.mjs <session_id> <name>');
  process.exit(1);
}
const SESSION = `${REPO}/sessions/peggy/${SESSION_ID}.json`;

const index = readFileSync(`${REPO}/deployment/cloudflare/public/index.html`, 'utf8');
const css = index.match(/<style>([\s\S]*?)<\/style>/)[1];

const session = JSON.parse(readFileSync(SESSION, 'utf8'));
const esc = (s) => s.replace(/[&<>]/g, (c) => ({'&': '&amp;', '<': '&lt;', '>': '&gt;'}[c]));

// transcriptLine(who, text) in app.js: <div class="line {who}"><span class="who">
// …</span><span class="said">…</span></div>. `who` is the literal AGENT.name for
// the agent and the literal string "you" for the person.
//
// Tool calls are rows too, and they are rendered exactly as the page renders
// them - `.line.tool`, monospace, the call written out. Showing them is the
// point in section 5: the diary is not a claim in the narration, it is a line
// on the screen with the arguments visible.
const rows = [];
for (const t of session.timeline.turns) {
  if (t.user_transcript) rows.push({who: 'you', cls: 'you', text: t.user_transcript});
  for (const c of t.tool_calls ?? []) {
    rows.push({who: 'tool', cls: 'tool', text: `${c.name}(${JSON.stringify(c.arguments)})`});
  }
  if (t.agent_text) rows.push({who: 'Iris', cls: 'agent', text: t.agent_text});
}

const lines = rows
  .map((r) => `      <div class="line ${r.cls}"><span class="who">${r.who}</span><span class="said">${esc(r.text)}</span></div>`)
  .join('\n');

writeFileSync(
  new URL(`./public/pages/${OUT}.html`, import.meta.url).pathname,
  `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<style>${css}
  /* The film's own two additions, and they change no rule of the product's:
     the page is rendered tall enough to hold the whole conversation at once
     (a browser would be scrolling it), and the dark-mode variables are pinned
     off, because the render host's preference is not the person's. */
  html, body { background: var(--bg) !important; }
  body.simple main { padding-top: 2.6rem; padding-bottom: 3rem; }
</style></head>
<body class="simple">
<main>
  <header>
    <h1>Iris</h1>
    <span class="status speaking" id="status"><span id="status-text">speaking</span></span>
  </header>
  <div class="panes">
    <section class="pane">
      <div class="pane-body" id="transcript">
${lines}
      </div>
      <div class="pane-foot">
        <button id="btn">End the conversation</button>
      </div>
    </section>
  </div>
</main>
</body></html>
`
);
console.log(`${OUT}.html — ${rows.length} lines from ${session.session_id}`);

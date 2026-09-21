# B2 — Loose Ends Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Something the person left hanging in one conversation comes back in the next one, in the agent's own words, and then expires.

**Architecture:** The agent writes the note itself with a fourth diary tool (a moment it can feel, not a position in time — see HANDOVER §6.15). A Cloudflare function stores it in D1 and rewrites one marked block inside the stored agent's `system_prompt` via the AssemblyAI API. `/token` expires it after exactly one conversation. Nothing runs on the operator's machine.

**Tech Stack:** Node 18+ ESM, no dependencies. Cloudflare Pages Functions + D1 (SQLite). AssemblyAI Agents API (`GET`/`PUT /v1/agents/{id}`). Tests: `node --test`.

**Spec:** `docs/superpowers/specs/2026-09-21-b2-loose-ends-design.md`

---

## File Structure

| File | Responsibility | New? |
|---|---|---|
| `deployment/cloudflare/lib/prompt-block.js` | Pure string surgery: replace the text between two markers. No I/O, no network. | create |
| `tools/prompt-block.test.mjs` | Tests for the above. Runs under `npm test`. | create |
| `deployment/cloudflare/schema.sql` | Adds the `loose_ends` table. | modify |
| `deployment/cloudflare/lib/agent-prompt.js` | Reads the agent from AssemblyAI, rewrites the block, writes it back, reads it back to confirm. | create |
| `deployment/cloudflare/functions/diary/loose-end.js` | `POST /diary/loose-end` — the tool's endpoint. | create |
| `deployment/cloudflare/functions/token.js` | Expiry: pending → delivered → cleared. | modify |
| `config/rules/en.md` | The `[LAST TIME]` block and `{{LAST_TIME}}` placeholder. | modify |
| `tools/build_agent/run.mjs` | Fills `{{LAST_TIME}}` with the empty state; declares the fourth tool. | modify |

`prompt-block.js` is deliberately separate from `agent-prompt.js`: the string surgery is the part that can destroy a biography, so it is pure and tested, while the network code around it stays thin.

---

### Task 1: The block replacer

**Files:**
- Create: `deployment/cloudflare/lib/prompt-block.js`
- Test: `tools/prompt-block.test.mjs`

- [ ] **Step 1: Write the failing test**

Create `tools/prompt-block.test.mjs`:

```javascript
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { replaceBlock, OPEN, CLOSE } from '../deployment/cloudflare/lib/prompt-block.js';

const prompt = [
  'BEFORE THE BLOCK.',
  OPEN,
  'Nothing was left hanging last time.',
  CLOSE,
  'AFTER THE BLOCK.',
].join('\n');

test('replaces only what is between the markers', () => {
  const out = replaceBlock(prompt, 'She said she had not slept.');
  assert.equal(out.ok, true);
  assert.match(out.prompt, /BEFORE THE BLOCK\./);
  assert.match(out.prompt, /AFTER THE BLOCK\./);
  assert.match(out.prompt, /She said she had not slept\./);
  assert.doesNotMatch(out.prompt, /Nothing was left hanging/);
});

test('everything outside the markers is byte-identical', () => {
  const out = replaceBlock(prompt, 'Anything at all.');
  const before = (s) => s.slice(0, s.indexOf(OPEN));
  const after = (s) => s.slice(s.indexOf(CLOSE));
  assert.equal(before(out.prompt), before(prompt));
  assert.equal(after(out.prompt).slice(CLOSE.length), after(prompt).slice(CLOSE.length));
});

test('replacing twice does not accumulate', () => {
  const once = replaceBlock(prompt, 'First note.').prompt;
  const twice = replaceBlock(once, 'Second note.').prompt;
  assert.doesNotMatch(twice, /First note/);
  assert.match(twice, /Second note\./);
  assert.equal(twice.split(OPEN).length, 2, 'exactly one open marker');
  assert.equal(twice.split(CLOSE).length, 2, 'exactly one close marker');
});

test('a prompt with no markers is returned unchanged, and says so', () => {
  const out = replaceBlock('No markers anywhere.', 'Note.');
  assert.equal(out.ok, false);
  assert.equal(out.prompt, 'No markers anywhere.');
  assert.match(out.reason, /marker/i);
});

test('a prompt missing only the closing marker is refused', () => {
  const out = replaceBlock(`A\n${OPEN}\nB`, 'Note.');
  assert.equal(out.ok, false);
  assert.match(out.reason, /marker/i);
});

test('an empty note restores the empty-state sentence', () => {
  const out = replaceBlock(prompt, '');
  assert.equal(out.ok, true);
  assert.match(out.prompt, /Nothing was left hanging last time\./);
  assert.match(out.prompt, /Do not refer to a previous conversation\./);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd /Users/claudiamauri/Desktop/voice-companion && npm test`
Expected: FAIL — `Cannot find module '../deployment/cloudflare/lib/prompt-block.js'`

- [ ] **Step 3: Write the implementation**

Create `deployment/cloudflare/lib/prompt-block.js`:

```javascript
// Replaces the text between two markers inside the agent's system_prompt, and
// NOTHING else.
//
// It is a separate file, with no network in it, because this is the piece that
// can do real damage: the string it edits is a person's biography, and a
// pattern that matches one character too far would quietly destroy it. Pure
// function, six tests, no excuses.
//
// If the markers are not both there it changes NOTHING and says why. A silent
// no-op is the §6.2 family of defects: the file says one thing, the server does
// another, and nobody notices until someone speaks to it.

export const OPEN = '[LAST TIME]';
export const CLOSE = '[/LAST TIME]';

// What the agent is told when nothing is carried forward. It is a sentence
// about what NOT to do, because an empty block would leave the model to invent
// a reason for the heading being there.
export const NOTHING =
  'Nothing was left hanging last time. Do not refer to a previous conversation.';

export function replaceBlock(prompt, note) {
  const start = prompt.indexOf(OPEN);
  const end = prompt.indexOf(CLOSE);

  if (start === -1 || end === -1 || end < start) {
    return {
      ok: false,
      prompt,
      reason: `the ${OPEN} / ${CLOSE} marker pair is not in the prompt, so nothing was changed`,
    };
  }

  const text = String(note ?? '').trim() || NOTHING;
  return {
    ok: true,
    prompt: prompt.slice(0, start + OPEN.length) + '\n' + text + '\n' + prompt.slice(end),
  };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd /Users/claudiamauri/Desktop/voice-companion && npm test`
Expected: `# pass 12` (6 existing habits tests + 6 new), `# fail 0`

- [ ] **Step 5: Commit**

```bash
cd /Users/claudiamauri/Desktop/voice-companion
git add deployment/cloudflare/lib/prompt-block.js tools/prompt-block.test.mjs
git commit -m "The one piece of string surgery that could destroy a biography

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: The table

**Files:**
- Modify: `deployment/cloudflare/schema.sql` (append)

- [ ] **Step 1: Append the table**

Add at the end of `deployment/cloudflare/schema.sql`:

```sql
-- What the person left hanging, to be picked up in the NEXT conversation.
--
-- Only the most recent row is ever used. If somebody leaves three things
-- hanging in one conversation, carrying all three back is an interrogation.
--
-- Rows are never deleted and the note is never rewritten: only `state` moves,
-- pending -> delivered. The history of what was carried forward is worth
-- keeping, and it is the same "an event, not a box" rule as `entries`.
CREATE TABLE IF NOT EXISTS loose_ends (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  note       TEXT NOT NULL,
  -- Local day in Europe/Rome, like everywhere else: at 00:30 Italian time UTC
  -- is still yesterday, and the row would land on the wrong day.
  day        TEXT NOT NULL,
  created_at TEXT NOT NULL,
  -- 'pending'   written, not yet given to a conversation
  -- 'delivered' a conversation has had it; the next one clears the block
  state      TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS loose_ends_recent ON loose_ends (id DESC);
```

- [ ] **Step 2: Apply it to the live database**

Run:
```bash
cd /Users/claudiamauri/Desktop/voice-companion
set -a; . ./.env; set +a
npx wrangler d1 execute companion-diary --remote --file deployment/cloudflare/schema.sql
```
Expected: `Executed 9 queries`, `"success": true`. The existing tables are untouched — every statement is `IF NOT EXISTS`.

- [ ] **Step 3: Commit**

```bash
cd /Users/claudiamauri/Desktop/voice-companion
git add deployment/cloudflare/schema.sql
git commit -m "A table for what was left hanging

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: Rewriting the stored agent

**Files:**
- Create: `deployment/cloudflare/lib/agent-prompt.js`

No unit test: this file is nothing but network calls against AssemblyAI, and a mocked test of it would only prove the mock works. It is covered by the HTTP checks in Task 7.

- [ ] **Step 1: Write the implementation**

Create `deployment/cloudflare/lib/agent-prompt.js`:

```javascript
// Puts the loose end into the stored agent's instructions, and takes it out
// again. Everything that can go wrong here is silent, so every step is checked.
//
// WHY THE STORED AGENT AND NOT THE SESSION: AssemblyAI's own words are that
// `agent_id` must be sent "as the only field in your first session.update; it's
// mutually exclusive with the inline fields". So a conversation cannot be handed
// a little extra context — either it names our stored agent, or the page sends
// the whole configuration, which would put the person's biography in the
// browser and break §5.3. The note therefore has to be IN the agent before the
// conversation starts.

import { replaceBlock } from './prompt-block.js';

const AGENTS_API = 'https://agents.assemblyai.com/v1';

// PUT merges: a key that is absent keeps its old value (§6.2a). So sending only
// system_prompt leaves the voice, the tools and the turn detection alone.
export async function setLastTime(env, note) {
  const id = env.AGENT_ID;
  if (!id || !env.ASSEMBLYAI_API_KEY) {
    return { ok: false, reason: 'AGENT_ID or ASSEMBLYAI_API_KEY is not set on Cloudflare' };
  }
  const headers = { authorization: env.ASSEMBLYAI_API_KEY, 'content-type': 'application/json' };

  const read = await fetch(`${AGENTS_API}/agents/${id}`, { headers });
  if (!read.ok) return { ok: false, reason: `could not read the agent: ${read.status}` };
  const agent = await read.json();

  const edit = replaceBlock(agent.system_prompt ?? '', note);
  if (!edit.ok) return edit;

  // Already right: do not spend a write. Two conversations starting at once
  // would otherwise race to say the same thing.
  if (edit.prompt === agent.system_prompt) return { ok: true, unchanged: true };

  const write = await fetch(`${AGENTS_API}/agents/${id}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ system_prompt: edit.prompt }),
  });
  if (!write.ok) return { ok: false, reason: `could not write the agent: ${write.status}` };

  // NEVER TRUST "Updated" — HANDOVER §4. Read it back and look at it.
  const check = await fetch(`${AGENTS_API}/agents/${id}`, { headers });
  if (!check.ok) return { ok: false, reason: `could not read the agent back: ${check.status}` };
  const after = await check.json();
  if (after.system_prompt !== edit.prompt) {
    return { ok: false, reason: 'the agent read back does not match what was written' };
  }
  return { ok: true };
}
```

- [ ] **Step 2: Check it parses**

Run: `cd /Users/claudiamauri/Desktop/voice-companion && node --check deployment/cloudflare/lib/agent-prompt.js`
Expected: no output.

- [ ] **Step 3: Commit**

```bash
cd /Users/claudiamauri/Desktop/voice-companion
git add deployment/cloudflare/lib/agent-prompt.js
git commit -m "Put the loose end into the stored agent, and read it back

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: The endpoint the agent calls

**Files:**
- Create: `deployment/cloudflare/functions/diary/loose-end.js`

- [ ] **Step 1: Write the implementation**

Create `deployment/cloudflare/functions/diary/loose-end.js`:

```javascript
// POST /diary/loose-end — something the person left hanging, to be picked up
// in the NEXT conversation.
//
// The agent decides what counts. That is the right place for it: it is a
// judgement about the person in front of you, not arithmetic. It is also the
// shape that WORKS — on 20/09 `diary_record` fired reliably while
// `diary_status` never fired once, and the difference was that recording has a
// moment the model can feel and "at the start" does not (§6.15).
//
// "interactive", never "hold": the agent must not go quiet mid-sentence while a
// database and two API calls happen.

import { json, authorised, nowInRome } from '../../lib/diary.js';
import { setLastTime } from '../../lib/agent-prompt.js';

export async function onRequestPost({ request, env, waitUntil }) {
  if (!env.DIARY) return json({ error: 'diary not configured' }, 503);
  if (!authorised(request, env)) return json({ error: 'not authorised' }, 401);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'invalid body' }, 400);
  }

  // 300 characters, like the diary's note field. This is a thread to pick up,
  // not a summary of the conversation: a summary is the quiz §0.3 forbids.
  const note = String(body?.note ?? '').slice(0, 300).trim();
  if (!note) return json({ error: 'note is required' }, 400);

  const now = nowInRome();
  await env.DIARY.prepare(
    'INSERT INTO loose_ends (note, day, created_at, state) VALUES (?, ?, ?, ?)',
  ).bind(note, now.day, now.iso, 'pending').run();

  // The agent update is two or three API calls, so it does not go in the
  // person's way. It takes effect from the NEXT conversation: the running
  // session keeps the instructions it started with, which is correct.
  waitUntil(setLastTime(env, note));

  return json({
    ok: true,
    // A fact, not a sentence to say. What the agent does with this is decided
    // by the rules, never here (§6.14).
    noted_for_next_time: note,
  });
}
```

- [ ] **Step 2: Check it parses**

Run: `cd /Users/claudiamauri/Desktop/voice-companion && node --check deployment/cloudflare/functions/diary/loose-end.js`
Expected: no output.

- [ ] **Step 3: Commit**

```bash
cd /Users/claudiamauri/Desktop/voice-companion
git add deployment/cloudflare/functions/diary/loose-end.js
git commit -m "The endpoint that takes what was left hanging

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: Expiry in /token

**Files:**
- Modify: `deployment/cloudflare/functions/token.js`

- [ ] **Step 1: Add the import**

`token.js` has no imports today — it carries its own `json` and
`constantTimeEqual`. Add this as the file's first statement, on the line
**above** `const AGENTS_API = 'https://agents.assemblyai.com/v1';`:

```javascript
import { setLastTime } from '../lib/agent-prompt.js';
```

- [ ] **Step 2: Call the expiry alongside the conversation row**

Find this block:

```javascript
    if (env.DIARY) {
      waitUntil(recordConversation(env));
    }
```

Replace it with:

```javascript
    if (env.DIARY) {
      waitUntil(recordConversation(env));
      waitUntil(ageLooseEnd(env));
    }
```

- [ ] **Step 3: Add the expiry function**

At the end of `deployment/cloudflare/functions/token.js`, after `recordConversation`, add:

```javascript
// A loose end lives for exactly ONE conversation.
//
// Without this, Monday's bad night gets asked about every day for a week, which
// is the "you told me before" failure in slow motion — the thing §0.3 forbids.
//
// This conversation is starting, so:
//   pending   -> mark it delivered. THIS conversation is the one that gets it,
//               and the instructions already hold it: nothing to write.
//   delivered -> it has had its turn. Put the block back to the empty state.
// Silent on failure, like recordConversation: the diary is worth less than the
// conversation.
async function ageLooseEnd(env) {
  try {
    const latest = await env.DIARY.prepare(
      'SELECT id, state FROM loose_ends ORDER BY id DESC LIMIT 1',
    ).first();
    if (!latest) return;

    if (latest.state === 'pending') {
      await env.DIARY.prepare('UPDATE loose_ends SET state = ? WHERE id = ?')
        .bind('delivered', latest.id).run();
      return;
    }

    if (latest.state === 'delivered') {
      await setLastTime(env, '');
    }
  } catch {
    // Deliberately silent.
  }
}
```

- [ ] **Step 4: Check it parses**

Run: `cd /Users/claudiamauri/Desktop/voice-companion && node --check deployment/cloudflare/functions/token.js`
Expected: no output.

- [ ] **Step 5: Commit**

```bash
cd /Users/claudiamauri/Desktop/voice-companion
git add deployment/cloudflare/functions/token.js
git commit -m "A loose end lives for exactly one conversation

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: The doctrine and the fourth tool

**Files:**
- Modify: `config/rules/en.md` (append)
- Modify: `tools/build_agent/run.mjs`

- [ ] **Step 1: Add the block to the doctrine**

Append to `config/rules/en.md`, after the `{{TOPICS}}` section:

```
WHAT WAS LEFT HANGING LAST TIME. Raise it early and in your own words, only if it still fits what they are saying today. If they have moved on, let it go and never return to it. Never say that you wrote it down, never say "last time you told me", and never treat it as a question they owe you an answer to.
[LAST TIME]
{{LAST_TIME}}
[/LAST TIME]
```

- [ ] **Step 2: Fill the placeholder in build_agent**

In `tools/build_agent/run.mjs`, add the import at the top, below the existing `import { recordableHabits } from '../habits.mjs';`:

```javascript
import { NOTHING } from '../deployment/cloudflare/lib/prompt-block.js';
```

**Do not "tidy" this into a copy.** `tools/` reaching into `deployment/` is
unusual here, and it is deliberate: `build_agent` writes the empty-state
sentence when publishing, and Cloudflare writes the same sentence when a note
expires. If those two sentences are declared separately they will drift, and the
block will silently flip between two different versions of "nothing" — which is
§6.13 exactly. One declaration, imported. It is a build-time import on the
operator's machine; nothing is bundled and Cloudflare is unaffected.

Then in the `VALUES` object, after the `TOPICS: topics,` line, add:

```javascript
  // Built empty, ALWAYS. What actually goes in here is written by Cloudflare
  // between the [LAST TIME] markers after a conversation leaves something
  // hanging. A publish is a fresh start, so a rebuild wipes the note — correct:
  // publishing means the agent changed.
  LAST_TIME: NOTHING,
```

- [ ] **Step 3: Declare the fourth tool**

In `tools/build_agent/run.mjs`, inside the `tools.push(` call, after the `diary_read` object and before the closing `);`, add:

```javascript
    {
      name: 'note_for_next_time',
      // THE WORDING IS THE DESIGN. `diary_status` was described as "use it once
      // at the start" and was never used once, because a model acts on a moment
      // it can feel and ignores a position in time (§6.15). "The moment it
      // comes up" is a moment.
      description: t.note ?? 'Note something worth returning to next time — they slept badly, they were waiting on news, they started a story and did not finish it. Use it the moment it comes up, not at the end. Only for something genuinely left hanging: if nothing was, do not use this.',
      parameters: {
        type: 'object',
        properties: {
          note: { type: 'string', description: 'What is worth returning to, in plain words, as they would recognise it. Not a summary of the conversation.' },
        },
        required: ['note'],
      },
      // "interactive": a write must never put a silence in the middle of a
      // sentence. Same reason as diary_record.
      execution_mode: 'interactive',
      timeout_seconds: 10,
      http: { url: `${base}/loose-end`, http_method: 'POST', headers: key },
    },
```

- [ ] **Step 4: Build and confirm the prompt changed exactly once**

Run:
```bash
cd /Users/claudiamauri/Desktop/voice-companion
PROFILE=peggy node tools/build_agent/run.mjs
node -e '
const fs=require("fs");
const a=JSON.parse(fs.readFileSync("agents/peggy.jsonc","utf8").replace(/^\s*\/\/.*$/gm,"").replace(/,(\s*[}\]])/g,"$1"));
console.log("tools:", a.tools.map(t=>t.name).join(", "));
console.log("[LAST TIME] blocks:", a.system_prompt.split("[LAST TIME]").length - 1);
console.log("empty state present:", /Nothing was left hanging last time/.test(a.system_prompt));
console.log("prompt length:", a.system_prompt.length);'
```
Expected: four tools ending in `note_for_next_time`; exactly `1` block; empty state `true`; length larger than 18813 (the doctrine grew on purpose).

- [ ] **Step 5: Run the tests**

Run: `cd /Users/claudiamauri/Desktop/voice-companion && npm test`
Expected: `# pass 12`, `# fail 0`

- [ ] **Step 6: Commit**

```bash
cd /Users/claudiamauri/Desktop/voice-companion
git add config/rules/en.md tools/build_agent/run.mjs agents/peggy.jsonc
git commit -m "A fourth tool: what to pick up next time

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 7: Ship it and prove it over HTTP

**Files:** none changed. This task is verification.

- [ ] **Step 1: Give Cloudflare the agent id**

`agent-prompt.js` needs `env.AGENT_ID`, which Cloudflare does not have yet. Run:

```bash
cd /Users/claudiamauri/Desktop/voice-companion
set -a; . ./.env; set +a
printf '%s' "$AGENT_ID_PEGGY" | npx wrangler pages secret put AGENT_ID --project-name voice-companion
```
Expected: `✨ Success! Uploaded secret AGENT_ID`

- [ ] **Step 2: Ship**

Run: `cd /Users/claudiamauri/Desktop/voice-companion && PROFILE=peggy npm run ship`
Expected: four steps, ending `Shipped "peggy".`

- [ ] **Step 3: Confirm the agent carries the fourth tool and the empty block**

Run:
```bash
cd /Users/claudiamauri/Desktop/voice-companion
set -a; . ./.env; set +a
curl -s -H "authorization: $ASSEMBLYAI_API_KEY" \
  "https://agents.assemblyai.com/v1/agents/$AGENT_ID_PEGGY" | node -e '
let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const a=JSON.parse(s);
console.log("tools:",(a.tools||[]).map(t=>t.name).join(", "));
console.log("empty state:",/Nothing was left hanging last time/.test(a.system_prompt));})'
```
Expected: four tools including `note_for_next_time`; `empty state: true`

- [ ] **Step 4: Write a loose end and watch it reach the agent**

Run:
```bash
cd /Users/claudiamauri/Desktop/voice-companion
set -a; . ./.env; set +a
curl -s -X POST -H "x-diary-key: $DIARY_KEY" -H 'content-type: application/json' \
  -d '{"note":"She said she had not slept well."}' \
  https://lablab.claudiaonclaude.com/diary/loose-end
sleep 6
curl -s -H "authorization: $ASSEMBLYAI_API_KEY" \
  "https://agents.assemblyai.com/v1/agents/$AGENT_ID_PEGGY" | node -e '
let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const a=JSON.parse(s);
console.log("note in the agent:",/had not slept well/.test(a.system_prompt));
console.log("blocks:",a.system_prompt.split("[LAST TIME]").length - 1);})'
```
Expected: `{"ok":true,...}`, then `note in the agent: true` and `blocks: 1`

- [ ] **Step 5: Confirm it expires after exactly one conversation**

Run:
```bash
cd /Users/claudiamauri/Desktop/voice-companion
set -a; . ./.env; set +a
read_state () {
  curl -s -H "authorization: $ASSEMBLYAI_API_KEY" \
    "https://agents.assemblyai.com/v1/agents/$AGENT_ID_PEGGY" | node -e '
let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const a=JSON.parse(s);
console.log("  note still there:",/had not slept well/.test(a.system_prompt));})'
}
echo "first conversation starts (pending -> delivered):"
curl -s -o /dev/null "https://lablab.claudiaonclaude.com/token?k=$PAGE_KEY"; sleep 6; read_state
echo "second conversation starts (delivered -> cleared):"
curl -s -o /dev/null "https://lablab.claudiaonclaude.com/token?k=$PAGE_KEY"; sleep 6; read_state
```
Expected: after the first, `note still there: true`. After the second, `note still there: false`.

- [ ] **Step 6: Update the handover**

In `HANDOVER.md` §0, replace the phase B row's `**B2 is not built**: every
conversation starts from zero, and says so honestly.` with:

```
**B2 built and shipped 21/09, waiting for a spoken test:** a fourth tool
`note_for_next_time` writes what was left hanging, Cloudflare puts it between
the `[LAST TIME]` markers in the stored agent, and `/token` expires it after
exactly one conversation (§6.16).
```

In §6, immediately above `### 6.5 Latency`, add:

```
- **6.16 — Editing a prompt by pattern-matching can destroy a biography.**
  The loose end is written into the live `system_prompt`, which is the person's
  life. A pattern that matched one character too far would delete it silently,
  and the agent would keep answering, so nobody would notice until someone
  spoke to it. *Guards: `deployment/cloudflare/lib/prompt-block.js` is a pure
  function with no network in it and six tests; it changes NOTHING and says why
  if both markers are not present; `agent-prompt.js` reads the agent back after
  every write and refuses to report success unless it matches.* **A string that
  holds a person is edited by a tested function, never inline.**
```

Then:

```bash
cd /Users/claudiamauri/Desktop/voice-companion
git add HANDOVER.md
git commit -m "Handover: B2 built, waiting on a spoken test

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
git push
```

---

### Task 8: The spoken test — Claudia only

This cannot be done by an agent. It is the only test that counts.

- [ ] **Step 1: First conversation.** Open the page. Say something genuinely left hanging — *"I didn't sleep well last night"* — and let the conversation run on to something else. End it.
- [ ] **Step 2: Check the agent picked it up.** Re-run Task 7 Step 4's second half: the note should be in the agent's instructions.
- [ ] **Step 3: Second conversation.** Start again. **She should raise it, in her own words, early.** She may not — that is allowed by the design.
- [ ] **Step 4: Third conversation.** She must NOT raise it again. It expired.
- [ ] **Step 5: Read the numbers, not the impression.**

```bash
cd /Users/claudiamauri/Desktop/voice-companion
PROFILE=peggy npm run sessions
PROFILE=peggy npm run metrics
```

Remember the measured variance: her share ran 13% and 26% on the same prompt within ninety minutes. One conversation proves nothing either way.
